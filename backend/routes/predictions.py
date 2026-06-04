import math
from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import User, Expense, Subscription, Debt

predictions_bp = Blueprint('predictions', __name__, url_prefix='/api')


def _month_label(months_ahead):
    today = date.today()
    m = today.month + months_ahead
    y = today.year
    while m > 12:
        m -= 12
        y += 1
    return date(y, m, 1).strftime('%b %Y')


@predictions_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    today = date.today()

    reduce_pct   = float(request.args.get('reduce_spending_pct', 0)) / 100
    cancel_sub_id = request.args.get('cancel_subscription_id')
    extra_savings = float(request.args.get('extra_savings', 0))

    # Average monthly expenses over last 3 months
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

    avg_expenses = (sum(float(r.total) for r in monthly_rows) / len(monthly_rows)) if monthly_rows else 0.0
    income = float(user.monthly_income or 0)

    # Subscription savings from cancellation
    sub_savings = 0.0
    if cancel_sub_id:
        try:
            sub = db.session.get(Subscription, int(cancel_sub_id))
            if sub and sub.user_id == user_id and sub.is_active:
                sub_savings = sub.amount if sub.billing_cycle == 'monthly' else sub.amount / 12
        except (ValueError, TypeError):
            pass

    adj_expenses = avg_expenses * (1 - reduce_pct) - sub_savings
    monthly_net = income - adj_expenses + extra_savings

    # 12-month cumulative savings projection
    cumulative = 0.0
    savings_projection = []
    for i in range(1, 13):
        cumulative += monthly_net
        savings_projection.append({'month': _month_label(i), 'savings': round(cumulative, 2)})

    # Debt payoff
    total_owe = sum(
        d.amount for d in Debt.query.filter_by(user_id=user_id, is_settled=False, type='i_owe').all()
    )
    debt_payoff = None
    if total_owe > 0:
        if monthly_net > 0:
            months_needed = math.ceil(total_owe / monthly_net)
            debt_payoff = {
                'total_debt': round(total_owe, 2),
                'months_to_payoff': months_needed,
                'monthly_payment': round(monthly_net, 2),
                'payoff_date': _month_label(months_needed),
            }
        else:
            debt_payoff = {
                'total_debt': round(total_owe, 2),
                'months_to_payoff': None,
                'monthly_payment': round(monthly_net, 2),
                'payoff_date': None,
            }

    return jsonify({
        'base_monthly_expenses': round(avg_expenses, 2),
        'monthly_net_savings': round(monthly_net, 2),
        'savings_projection': savings_projection,
        'debt_payoff': debt_payoff,
    })
