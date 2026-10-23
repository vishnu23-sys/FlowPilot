from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Expense
from utils import ApiError, json_body, parse_amount, parse_date, add_months, month_bounds

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

VALID_CATEGORIES = {
    'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills',
    'Health', 'Education', 'Travel', 'Investments', 'Others',
}


def _daily_series(expenses, first, last_day):
    """Cumulative spend per day of month, 1..last_day."""
    per_day = {}
    for e in expenses:
        per_day[e.date.day] = per_day.get(e.date.day, 0.0) + e.amount
    running, series = 0.0, []
    for day in range(1, last_day + 1):
        running += per_day.get(day, 0.0)
        series.append({'day': day, 'total': round(running, 2)})
    return series


@expenses_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = date.today()
    first_of_month = today.replace(day=1)
    prev_first, prev_last = month_bounds(add_months(today, -1))

    this_month = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= first_of_month,
        Expense.date <= today,
    ).all()
    prev_month = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= prev_first,
        Expense.date <= prev_last,
    ).all()

    by_cat = {}
    for e in this_month:
        by_cat[e.category] = by_cat.get(e.category, 0.0) + e.amount

    recent = (
        Expense.query.filter_by(user_id=user_id)
        .order_by(Expense.date.desc(), Expense.id.desc())
        .limit(6)
        .all()
    )

    return jsonify({
        'monthly_total': round(sum(e.amount for e in this_month), 2),
        'previous_month_total': round(sum(e.amount for e in prev_month), 2),
        'by_category': [
            {'category': c, 'total': round(t, 2)}
            for c, t in sorted(by_cat.items(), key=lambda x: -x[1])
        ],
        'daily': _daily_series(this_month, first_of_month, today.day),
        'previous_daily': _daily_series(prev_month, prev_first, prev_last.day),
        'recent_transactions': [e.to_dict() for e in recent],
    })


@expenses_bp.route('', methods=['GET'])
@jwt_required()
def list_expenses():
    user_id = int(get_jwt_identity())
    query = Expense.query.filter_by(user_id=user_id)

    category = request.args.get('category')
    if category:
        query = query.filter(Expense.category == category)

    from_date = request.args.get('from')
    if from_date:
        query = query.filter(Expense.date >= parse_date(from_date, 'from'))

    to_date = request.args.get('to')
    if to_date:
        query = query.filter(Expense.date <= parse_date(to_date, 'to'))

    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()
    return jsonify({'expenses': [e.to_dict() for e in expenses]})


def _validate_category(category):
    if category not in VALID_CATEGORIES:
        raise ApiError('Invalid category')
    return category


@expenses_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    user_id = int(get_jwt_identity())
    data = json_body(request)

    for field in ('amount', 'category', 'date'):
        if data.get(field) in (None, ''):
            raise ApiError('amount, category, and date are required')

    expense = Expense(
        user_id=user_id,
        amount=parse_amount(data['amount']),
        category=_validate_category(data['category']),
        date=parse_date(data['date']),
        description=(data.get('description') or '').strip()[:255],
        payment_method=(data.get('payment_method') or '')[:50],
        is_recurring=bool(data.get('is_recurring', False)),
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({'expense': expense.to_dict()}), 201


@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    user_id = int(get_jwt_identity())
    expense = db.session.get(Expense, expense_id)

    if not expense or expense.user_id != user_id:
        raise ApiError('Expense not found', 404)

    data = json_body(request)
    if data.get('amount') is not None:
        expense.amount = parse_amount(data['amount'])
    if data.get('category'):
        expense.category = _validate_category(data['category'])
    if data.get('date'):
        expense.date = parse_date(data['date'])
    if 'description' in data:
        expense.description = (data['description'] or '').strip()[:255]
    if 'payment_method' in data:
        expense.payment_method = (data['payment_method'] or '')[:50]
    if 'is_recurring' in data:
        expense.is_recurring = bool(data['is_recurring'])

    db.session.commit()
    return jsonify({'expense': expense.to_dict()})


@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())
    expense = db.session.get(Expense, expense_id)

    if not expense or expense.user_id != user_id:
        raise ApiError('Expense not found', 404)

    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@expenses_bp.route('/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete():
    user_id = int(get_jwt_identity())
    ids = json_body(request).get('ids')
    if not isinstance(ids, list) or not ids or not all(isinstance(i, int) for i in ids):
        raise ApiError('ids must be a non-empty list of expense ids')
    deleted = Expense.query.filter(Expense.user_id == user_id, Expense.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'deleted': deleted})
