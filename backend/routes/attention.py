from datetime import date, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Subscription, Debt
from routes.budgets import budgets_with_progress
from utils import effective_income, money

attention_bp = Blueprint('attention', __name__, url_prefix='/api')


@attention_bp.route('/attention', methods=['GET'])
@jwt_required()
def get_attention():
    """Things the user should look at, most urgent first."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    cur = user.currency or 'USD'
    today = date.today()
    items = []

    if effective_income(user, today) is None:
        items.append({
            'kind': 'income_missing', 'severity': 'info', 'link': '/income',
            'title': 'Add your income',
            'detail': 'Log income or set an expected amount to unlock savings and health insights.',
        })

    for b in budgets_with_progress(user_id, today):
        if b['status'] == 'over':
            items.append({
                'kind': 'budget_over', 'severity': 'danger', 'link': '/budgets',
                'title': f"{b['category']} is over budget",
                'detail': f"{money(b['spent'], cur)} of {money(b['monthly_limit'], cur)} ({b['pct'] * 100:.0f}%)",
            })
        elif b['status'] == 'near':
            items.append({
                'kind': 'budget_near', 'severity': 'warning', 'link': '/budgets',
                'title': f"{b['category']} is close to its limit",
                'detail': f"{money(b['remaining'], cur)} left this month",
            })

    renewals = Subscription.query.filter(
        Subscription.user_id == user_id,
        Subscription.is_active == True,  # noqa: E712
        Subscription.next_renewal_date >= today,
        Subscription.next_renewal_date <= today + timedelta(days=7),
    ).order_by(Subscription.next_renewal_date).all()
    for s in renewals:
        days = (s.next_renewal_date - today).days
        when = 'today' if days == 0 else 'tomorrow' if days == 1 else f'in {days} days'
        items.append({
            'kind': 'renewal', 'severity': 'warning' if days <= 2 else 'info', 'link': '/subscriptions',
            'title': f'{s.name} renews {when}',
            'detail': money(s.amount, cur),
        })

    unsettled = Debt.query.filter_by(user_id=user_id, is_settled=False).all()
    owe = sum(d.amount for d in unsettled if d.type == 'i_owe')
    owed = sum(d.amount for d in unsettled if d.type == 'owed_to_me')
    if owe:
        items.append({
            'kind': 'debt_owe', 'severity': 'info', 'link': '/debts',
            'title': 'You have unsettled debts', 'detail': f'You owe {money(owe, cur)}',
        })
    if owed:
        items.append({
            'kind': 'debt_owed', 'severity': 'info', 'link': '/debts',
            'title': 'People owe you money', 'detail': f'{money(owed, cur)} to collect',
        })

    order = {'danger': 0, 'warning': 1, 'info': 2}
    items.sort(key=lambda i: order[i['severity']])
    return jsonify({'items': items, 'count': len(items)})
