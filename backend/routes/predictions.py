import math
from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Subscription, Debt
from utils import ApiError, add_months, effective_income, monthly_expense_totals

predictions_bp = Blueprint('predictions', __name__, url_prefix='/api')


def _month_label(months_ahead):
    return add_months(date.today(), months_ahead).strftime('%b %Y')


def _float_arg(name, low, high):
    raw = request.args.get(name, 0)
    try:
        value = float(raw)
    except (TypeError, ValueError):
        raise ApiError(f'{name} must be a number')
    if not low <= value <= high:
        raise ApiError(f'{name} must be between {low:g} and {high:g}')
    return value


@predictions_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    today = date.today()

    reduce_pct = _float_arg('reduce_spending_pct', 0, 100) / 100
    extra_savings = _float_arg('extra_savings', 0, 1e9)
    cancel_sub_id = request.args.get('cancel_subscription_id')

    # Average monthly expenses over the last 3 full months (fall back to this month so far)
    totals = monthly_expense_totals(user_id, add_months(today, -3), today.replace(day=1) - timedelta(days=1))
    if totals:
        avg_expenses = sum(totals.values()) / len(totals)
    else:
        avg_expenses = sum(monthly_expense_totals(user_id, today.replace(day=1), today).values())
    income = float(effective_income(user, today) or 0)

    sub_savings = 0.0
    if cancel_sub_id:
        try:
            sub = db.session.get(Subscription, int(cancel_sub_id))
        except (ValueError, TypeError):
            raise ApiError('cancel_subscription_id must be an id')
        if sub and sub.user_id == user_id and sub.is_active:
            sub_savings = sub.amount if sub.billing_cycle == 'monthly' else sub.amount / 12

    adj_expenses = max(avg_expenses * (1 - reduce_pct) - sub_savings, 0)
    monthly_net = income - adj_expenses + extra_savings
    baseline_net = income - avg_expenses

    cumulative = baseline = 0.0
    savings_projection = []
    for i in range(1, 13):
        cumulative += monthly_net
        baseline += baseline_net
        savings_projection.append({'month': _month_label(i), 'savings': round(cumulative, 2), 'baseline': round(baseline, 2)})

    total_owe = sum(d.amount for d in Debt.query.filter_by(user_id=user_id, is_settled=False, type='i_owe').all())
    debt_payoff = None
    if total_owe > 0:
        months_needed = math.ceil(total_owe / monthly_net) if monthly_net > 0 else None
        debt_payoff = {
            'total_debt': round(total_owe, 2),
            'months_to_payoff': months_needed,
            'monthly_payment': round(monthly_net, 2),
            'payoff_date': _month_label(months_needed) if months_needed else None,
        }

    return jsonify({
        'monthly_income': round(income, 2),
        'base_monthly_expenses': round(avg_expenses, 2),
        'monthly_net_savings': round(monthly_net, 2),
        'baseline_net_savings': round(baseline_net, 2),
        'savings_projection': savings_projection,
        'debt_payoff': debt_payoff,
    })
