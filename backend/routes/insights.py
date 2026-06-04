from datetime import date, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Expense, Subscription, Debt

insights_bp = Blueprint('insights', __name__, url_prefix='/api')


@insights_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    cur = user.currency or 'USD'
    today = date.today()
    first_of_month = today.replace(day=1)
    prev_last = first_of_month - timedelta(days=1)
    prev_first = prev_last.replace(day=1)

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
    if user.monthly_income and user.monthly_income > 0:
        rate = (user.monthly_income - this_total) / user.monthly_income
        if this_total > user.monthly_income:
            overshoot = this_total - user.monthly_income
            insights.append({'text': f'You\'ve overspent by {cur} {overshoot:.0f} this month — above your {cur} {user.monthly_income:.0f} income.', 'type': 'warning'})
        elif rate >= 0.3:
            insights.append({'text': f'Great discipline — you\'re saving {rate*100:.0f}% of your income ({cur} {user.monthly_income - this_total:.0f} saved so far).', 'type': 'positive'})
        elif rate >= 0.1:
            insights.append({'text': f'You\'re saving {rate*100:.0f}% of income this month. Aim for 20% to build a strong cushion.', 'type': 'neutral'})

    # Top category
    if this_month:
        by_cat = {}
        for e in this_month:
            by_cat[e.category] = by_cat.get(e.category, 0) + e.amount
        top_cat, top_amt = max(by_cat.items(), key=lambda x: x[1])
        pct = top_amt / this_total * 100 if this_total else 0
        insights.append({
            'text': f'{top_cat} is your top category at {pct:.0f}% of spending ({cur} {top_amt:.0f}).',
            'type': 'warning' if pct > 45 else 'neutral',
        })

    # Category growth vs last month
    if this_month and last_month:
        this_by_cat = {}
        last_by_cat = {}
        for e in this_month:
            this_by_cat[e.category] = this_by_cat.get(e.category, 0) + e.amount
        for e in last_month:
            last_by_cat[e.category] = last_by_cat.get(e.category, 0) + e.amount

        best_cat, best_pct = None, 25.0
        for cat, amt in this_by_cat.items():
            if cat in last_by_cat and last_by_cat[cat] > 0:
                g = (amt - last_by_cat[cat]) / last_by_cat[cat] * 100
                if g > best_pct:
                    best_pct, best_cat = g, cat
        if best_cat:
            insights.append({
                'text': f'{best_cat} spending jumped {best_pct:.0f}% compared to last month.',
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
                insights.append({'text': f'You spend {avg_we/avg_wd:.1f}× more per transaction on weekends than weekdays.', 'type': 'neutral'})

    # Subscription load
    active_subs = Subscription.query.filter_by(user_id=user_id, is_active=True).all()
    sub_monthly = (sum(s.amount for s in active_subs if s.billing_cycle == 'monthly') +
                   sum(s.amount / 12 for s in active_subs if s.billing_cycle == 'yearly'))
    if sub_monthly > 0 and this_total > 0:
        sub_pct = sub_monthly / this_total * 100
        insights.append({
            'text': f'Subscriptions account for {sub_pct:.0f}% of spending ({cur} {sub_monthly:.0f}/mo).{" Consider auditing them." if sub_pct > 30 else ""}',
            'type': 'warning' if sub_pct > 30 else 'neutral',
        })

    # Biggest single expense
    if this_month:
        biggest = max(this_month, key=lambda e: e.amount)
        insights.append({'text': f'Largest transaction this month: {cur} {biggest.amount:.0f} on {biggest.category}.', 'type': 'neutral'})

    # Debt alert
    total_owe = sum(d.amount for d in Debt.query.filter_by(user_id=user_id, is_settled=False, type='i_owe').all())
    if total_owe > 0 and user.monthly_income and total_owe > user.monthly_income * 0.5:
        insights.append({'text': f'Outstanding debt of {cur} {total_owe:.0f} exceeds 50% of your monthly income. Prioritize clearing it.', 'type': 'warning'})

    if not insights:
        insights.append({'text': 'Add more transactions to unlock personalized financial insights.', 'type': 'neutral'})

    return jsonify({'insights': insights})
