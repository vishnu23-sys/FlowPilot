from datetime import date, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import User, Expense, Subscription, Debt

health_score_bp = Blueprint('health_score', __name__, url_prefix='/api')


@health_score_bp.route('/health-score', methods=['GET'])
@jwt_required()
def get_health_score():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    cur = user.currency or 'USD'
    today = date.today()
    first_of_month = today.replace(day=1)

    this_month_total = db.session.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.date >= first_of_month,
        Expense.date <= today,
    ).scalar() or 0.0

    score = 0.0
    components = []
    recommendations = []

    # 1. Savings rate (40 pts) — 20%+ savings = full marks
    if user.monthly_income and user.monthly_income > 0:
        rate = (user.monthly_income - this_month_total) / user.monthly_income
        savings_pts = max(0.0, min(40.0, rate * 200))
        score += savings_pts
        components.append({'label': 'Savings Rate', 'score': round(savings_pts), 'max': 40})
        if rate < 0:
            recommendations.append('You\'re spending more than you earn. Cut discretionary expenses immediately.')
        elif rate < 0.1:
            recommendations.append('Aim to save at least 20% of income — start by trimming your top spending category.')
        elif rate < 0.2:
            recommendations.append('Good progress! Pushing savings above 20% will build a strong financial buffer.')
    else:
        score += 20.0
        components.append({'label': 'Savings Rate', 'score': 20, 'max': 40})
        recommendations.append('Set your monthly income in your profile for a more accurate health score.')

    # 2. Debt ratio (25 pts)
    total_owe = sum(d.amount for d in Debt.query.filter_by(user_id=user_id, is_settled=False, type='i_owe').all())
    if total_owe == 0:
        debt_pts = 25.0
    elif user.monthly_income and user.monthly_income > 0:
        ratio = total_owe / user.monthly_income
        debt_pts = max(0.0, 25.0 - ratio * 8)
        if ratio > 2:
            recommendations.append(f'Your debt ({cur} {total_owe:.0f}) is high vs your income. Build a payoff plan.')
    else:
        debt_pts = 18.0
    score += debt_pts
    components.append({'label': 'Debt Ratio', 'score': round(debt_pts), 'max': 25})

    # 3. Subscription load (20 pts)
    active_subs = Subscription.query.filter_by(user_id=user_id, is_active=True).all()
    sub_monthly = (sum(s.amount for s in active_subs if s.billing_cycle == 'monthly') +
                   sum(s.amount / 12 for s in active_subs if s.billing_cycle == 'yearly'))
    if user.monthly_income and user.monthly_income > 0 and sub_monthly > 0:
        sub_pct = sub_monthly / user.monthly_income
        sub_pts = max(0.0, 20.0 - sub_pct * 80)
        if sub_pct > 0.2:
            recommendations.append(f'Subscriptions use {sub_pct*100:.0f}% of income ({cur} {sub_monthly:.0f}/mo). Cancel unused ones.')
    else:
        sub_pts = 18.0 if sub_monthly > 0 else 20.0
    score += sub_pts
    components.append({'label': 'Subscription Load', 'score': round(sub_pts), 'max': 20})

    # 4. Spending consistency (15 pts) — coefficient of variation across last 3 months
    m, y = today.month - 3, today.year
    while m <= 0:
        m += 12
        y -= 1
    three_months_ago = date(y, m, 1)

    monthly_rows = db.session.query(
        func.date_trunc('month', Expense.date).label('month'),
        func.sum(Expense.amount).label('total'),
    ).filter(
        Expense.user_id == user_id,
        Expense.date >= three_months_ago,
    ).group_by('month').all()

    if len(monthly_rows) >= 2:
        totals = [float(r.total) for r in monthly_rows]
        avg = sum(totals) / len(totals)
        std = (sum((t - avg) ** 2 for t in totals) / len(totals)) ** 0.5
        cv = std / avg if avg > 0 else 0
        consistency_pts = max(0.0, 15.0 - cv * 30)
    else:
        consistency_pts = 10.0
    score += consistency_pts
    components.append({'label': 'Spending Consistency', 'score': round(consistency_pts), 'max': 15})

    if not recommendations:
        recommendations.append('Your finances look strong. Keep maintaining your current habits.')

    final = round(score)
    label = 'Excellent' if final >= 80 else 'Good' if final >= 60 else 'Fair' if final >= 40 else 'Needs Attention'

    return jsonify({
        'score': final,
        'label': label,
        'components': components,
        'recommendations': recommendations[:3],
    })
