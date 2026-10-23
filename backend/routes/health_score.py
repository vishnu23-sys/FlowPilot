from datetime import date, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import User, Expense, Subscription, Debt
from utils import add_months, effective_income, money, monthly_expense_totals, subscription_monthly_cost

health_score_bp = Blueprint('health_score', __name__, url_prefix='/api')


@health_score_bp.route('/health-score', methods=['GET'])
@jwt_required()
def get_health_score():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    cur = user.currency or 'USD'
    today = date.today()
    first_of_month = today.replace(day=1)
    income = effective_income(user, today)

    this_month_total = db.session.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.date >= first_of_month,
        Expense.date <= today,
    ).scalar() or 0.0

    score = 0.0
    components = []
    recommendations = []

    # 1. Savings rate (40 pts) — 20%+ savings = full marks
    if income and income > 0:
        rate = (income - this_month_total) / income
        savings_pts = max(0.0, min(40.0, rate * 200))
        score += savings_pts
        components.append({'label': 'Savings rate', 'score': round(savings_pts), 'max': 40})
        if rate < 0:
            recommendations.append("You're spending more than you earn. Cut discretionary expenses first.")
        elif rate < 0.1:
            recommendations.append('Aim to save at least 20% of income. Start by trimming your top category.')
        elif rate < 0.2:
            recommendations.append('Pushing savings above 20% will build a strong financial buffer.')
    else:
        score += 20.0
        components.append({'label': 'Savings rate', 'score': 20, 'max': 40})
        recommendations.append('Log your income for a more accurate health score.')

    # 2. Debt ratio (25 pts)
    total_owe = sum(d.amount for d in Debt.query.filter_by(user_id=user_id, is_settled=False, type='i_owe').all())
    if total_owe == 0:
        debt_pts = 25.0
    elif income and income > 0:
        ratio = total_owe / income
        debt_pts = max(0.0, 25.0 - ratio * 8)
        if ratio > 2:
            recommendations.append(f'Your debt ({money(total_owe, cur)}) is high compared to income. Build a payoff plan.')
    else:
        debt_pts = 18.0
    score += debt_pts
    components.append({'label': 'Debt ratio', 'score': round(debt_pts), 'max': 25})

    # 3. Subscription load (20 pts)
    sub_monthly = subscription_monthly_cost(Subscription.query.filter_by(user_id=user_id, is_active=True).all())
    if income and income > 0 and sub_monthly > 0:
        sub_pct = sub_monthly / income
        sub_pts = max(0.0, 20.0 - sub_pct * 80)
        if sub_pct > 0.2:
            recommendations.append(
                f'Subscriptions use {sub_pct * 100:.0f}% of income ({money(sub_monthly, cur)}/mo). Cancel unused ones.')
    else:
        sub_pts = 18.0 if sub_monthly > 0 else 20.0
    score += sub_pts
    components.append({'label': 'Subscription load', 'score': round(sub_pts), 'max': 20})

    # 4. Spending consistency (15 pts) — coefficient of variation across the last 3 full months
    totals = list(monthly_expense_totals(user_id, add_months(today, -3), first_of_month - timedelta(days=1)).values())
    if len(totals) >= 2:
        avg = sum(totals) / len(totals)
        std = (sum((t - avg) ** 2 for t in totals) / len(totals)) ** 0.5
        cv = std / avg if avg > 0 else 0
        consistency_pts = max(0.0, 15.0 - cv * 30)
    else:
        consistency_pts = 10.0
    score += consistency_pts
    components.append({'label': 'Spending consistency', 'score': round(consistency_pts), 'max': 15})

    if not recommendations:
        recommendations.append('Your finances look strong. Keep your current habits going.')

    final = round(score)
    label = 'Excellent' if final >= 80 else 'Good' if final >= 60 else 'Fair' if final >= 40 else 'Needs attention'

    return jsonify({
        'score': final,
        'label': label,
        'components': components,
        'recommendations': recommendations[:3],
    })
