from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Budget, Expense
from routes.expenses import VALID_CATEGORIES
from utils import ApiError, json_body, parse_amount, month_bounds

budgets_bp = Blueprint('budgets', __name__, url_prefix='/api/budgets')

NEAR_THRESHOLD = 0.85


def budget_status(pct):
    if pct >= 1:
        return 'over'
    if pct >= NEAR_THRESHOLD:
        return 'near'
    return 'ok'


def budgets_with_progress(user_id, today=None):
    today = today or date.today()
    first, last = month_bounds(today)
    budgets = Budget.query.filter_by(user_id=user_id).all()
    if not budgets:
        return []

    spent = {}
    for category, amount in db.session.query(Expense.category, Expense.amount).filter(
        Expense.user_id == user_id,
        Expense.date >= first,
        Expense.date <= last,
    ).all():
        spent[category] = spent.get(category, 0.0) + amount

    days_in_month = last.day
    elapsed = today.day / days_in_month
    result = []
    for b in budgets:
        s = round(spent.get(b.category, 0.0), 2)
        pct = s / b.monthly_limit if b.monthly_limit else 0
        result.append({
            'category': b.category,
            'monthly_limit': b.monthly_limit,
            'spent': s,
            'remaining': round(b.monthly_limit - s, 2),
            'pct': round(pct, 4),
            'status': budget_status(pct),
            # Projected month-end spend at the current daily pace.
            'projected': round(s / elapsed, 2) if elapsed > 0 else s,
        })
    result.sort(key=lambda r: -r['pct'])
    return result


@budgets_bp.route('', methods=['GET'])
@jwt_required()
def list_budgets():
    user_id = int(get_jwt_identity())
    items = budgets_with_progress(user_id)
    total_limit = sum(i['monthly_limit'] for i in items)
    total_spent = sum(i['spent'] for i in items)
    return jsonify({
        'budgets': items,
        'total_limit': round(total_limit, 2),
        'total_spent': round(total_spent, 2),
    })


@budgets_bp.route('/<category>', methods=['PUT'])
@jwt_required()
def upsert_budget(category):
    user_id = int(get_jwt_identity())
    if category not in VALID_CATEGORIES:
        raise ApiError('Invalid category')
    limit = parse_amount(json_body(request).get('monthly_limit'), 'monthly_limit')

    budget = Budget.query.filter_by(user_id=user_id, category=category).first()
    if budget:
        budget.monthly_limit = limit
    else:
        db.session.add(Budget(user_id=user_id, category=category, monthly_limit=limit))
    db.session.commit()
    item = next(i for i in budgets_with_progress(user_id) if i['category'] == category)
    return jsonify({'budget': item})


@budgets_bp.route('/<category>', methods=['DELETE'])
@jwt_required()
def delete_budget(category):
    user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(user_id=user_id, category=category).first()
    if not budget:
        raise ApiError('Budget not found', 404)
    db.session.delete(budget)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
