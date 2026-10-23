from datetime import date
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Expense, Subscription, Debt, SavingsGoal
from routes.budgets import budgets_with_progress
from routes.goals import goal_to_dict
from utils import add_months, effective_income, money, month_bounds, subscription_monthly_cost

insights_bp = Blueprint('insights', __name__, url_prefix='/api')


@insights_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    cur = user.currency or 'USD'
    today = date.today()
    first_of_month = today.replace(day=1)
    prev_first, prev_last = month_bounds(add_months(today, -1))
    income = effective_income(user, today)

    this_month = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= first_of_month,
        Expense.date <= today,
    ).all()

    last_month = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= prev_first,
        Expense.date <= prev_last,
    ).all()

    insights = []
    this_total = sum(e.amount for e in this_month)

    # Spending vs income
    if income and income > 0:
        rate = (income - this_total) / income
        if this_total > income:
            insights.append({'text': f"You've spent {money(this_total - income, cur)} more than you earned this month.",
                             'type': 'warning'})
        elif rate >= 0.3:
            insights.append({'text': f"You're saving {rate * 100:.0f}% of your income so far ({money(income - this_total, cur)}).",
                             'type': 'positive'})
        elif rate >= 0.1:
            insights.append({'text': f"You're saving {rate * 100:.0f}% of income this month. Aim for 20% to build a cushion.",
                             'type': 'neutral'})

    # Budgets
    for b in budgets_with_progress(user_id, today):
        if b['status'] == 'over':
            insights.append({'text': f"{b['category']} is {money(-b['remaining'], cur)} over its {money(b['monthly_limit'], cur)} budget.",
                             'type': 'warning'})
        elif b['status'] == 'ok' and b['projected'] > b['monthly_limit'] * 1.05:
            insights.append({'text': f"At this pace {b['category']} will reach {money(b['projected'], cur)}, over its {money(b['monthly_limit'], cur)} budget.",
                             'type': 'warning'})

    # Top category
    by_cat = {}
    for e in this_month:
        by_cat[e.category] = by_cat.get(e.category, 0) + e.amount
    if by_cat:
        top_cat, top_amt = max(by_cat.items(), key=lambda x: x[1])
        pct = top_amt / this_total * 100 if this_total else 0
        insights.append({
            'text': f'{top_cat} is your top category at {pct:.0f}% of spending ({money(top_amt, cur)}).',
            'type': 'warning' if pct > 45 else 'neutral',
        })

    # Category growth vs last month
    if this_month and last_month:
        last_by_cat = {}
        for e in last_month:
            last_by_cat[e.category] = last_by_cat.get(e.category, 0) + e.amount

        best_cat, best_pct = None, 25.0
        for cat, amt in by_cat.items():
            if last_by_cat.get(cat, 0) > 0:
                g = (amt - last_by_cat[cat]) / last_by_cat[cat] * 100
                if g > best_pct:
                    best_pct, best_cat = g, cat
        if best_cat:
            insights.append({
                'text': f'{best_cat} spending is up {best_pct:.0f}% compared to last month.',
                'type': 'warning' if best_pct > 60 else 'neutral',
            })

    # Weekend vs weekday
    if len(this_month) >= 5:
        we = [e for e in this_month if e.date.weekday() >= 5]
        wd = [e for e in this_month if e.date.weekday() < 5]
        if we and wd:
            avg_we = sum(e.amount for e in we) / len(we)
            avg_wd = sum(e.amount for e in wd) / len(wd)
            if avg_we > avg_wd * 1.4:
                insights.append({'text': f'You spend {avg_we / avg_wd:.1f}× more per transaction on weekends than weekdays.',
                                 'type': 'neutral'})

    # Subscription load
    sub_monthly = subscription_monthly_cost(Subscription.query.filter_by(user_id=user_id, is_active=True).all())
    if sub_monthly > 0 and this_total > 0:
        sub_pct = sub_monthly / this_total * 100
        insights.append({
            'text': f'Subscriptions are {sub_pct:.0f}% of spending ({money(sub_monthly, cur)}/mo).'
                    f'{" Worth an audit." if sub_pct > 30 else ""}',
            'type': 'warning' if sub_pct > 30 else 'neutral',
        })

    # Goals
    for goal in SavingsGoal.query.filter_by(user_id=user_id).all():
        g = goal_to_dict(goal)
        if g['is_complete']:
            continue
        if g['overdue']:
            insights.append({'text': f"Your {g['name']} goal passed its target date with {money(g['remaining'], cur)} to go.",
                             'type': 'warning'})
        elif g['pct'] >= 0.75:
            insights.append({'text': f"You're {g['pct'] * 100:.0f}% of the way to {g['name']}.", 'type': 'positive'})

    # Biggest single expense
    if this_month:
        biggest = max(this_month, key=lambda e: e.amount)
        insights.append({'text': f'Largest transaction this month: {money(biggest.amount, cur)} on {biggest.category}.',
                         'type': 'neutral'})

    # Debt alert
    total_owe = sum(d.amount for d in Debt.query.filter_by(user_id=user_id, is_settled=False, type='i_owe').all())
    if total_owe > 0 and income and total_owe > income * 0.5:
        insights.append({'text': f'Outstanding debt of {money(total_owe, cur)} is over half your monthly income.',
                         'type': 'warning'})

    if not insights:
        insights.append({'text': 'Add a few more transactions to see personalised insights.', 'type': 'neutral'})

    return jsonify({'insights': insights})
