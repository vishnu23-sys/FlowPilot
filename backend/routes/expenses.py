from datetime import date, datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Expense

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

VALID_CATEGORIES = {
    'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills',
    'Health', 'Education', 'Travel', 'Investments', 'Others',
}


@expenses_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = date.today()
    first_of_month = today.replace(day=1)

    monthly_total = db.session.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.date >= first_of_month,
        Expense.date <= today,
    ).scalar() or 0.0

    by_category = db.session.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
    ).filter(
        Expense.user_id == user_id,
        Expense.date >= first_of_month,
        Expense.date <= today,
    ).group_by(Expense.category).all()

    recent = (
        Expense.query.filter_by(user_id=user_id)
        .order_by(Expense.date.desc(), Expense.id.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        'monthly_total': float(monthly_total),
        'by_category': [{'category': c, 'total': float(t)} for c, t in by_category],
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
        query = query.filter(Expense.date >= datetime.strptime(from_date, '%Y-%m-%d').date())

    to_date = request.args.get('to')
    if to_date:
        query = query.filter(Expense.date <= datetime.strptime(to_date, '%Y-%m-%d').date())

    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()
    return jsonify({'expenses': [e.to_dict() for e in expenses]})


@expenses_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get('amount') or not data.get('category') or not data.get('date'):
        return jsonify({'error': 'amount, category, and date are required'}), 400

    if data['category'] not in VALID_CATEGORIES:
        return jsonify({'error': 'Invalid category'}), 400

    expense = Expense(
        user_id=user_id,
        amount=float(data['amount']),
        category=data['category'],
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        description=data.get('description', ''),
        payment_method=data.get('payment_method', ''),
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
        return jsonify({'error': 'Expense not found'}), 404

    data = request.get_json()
    if data.get('amount') is not None:
        expense.amount = float(data['amount'])
    if data.get('category'):
        if data['category'] not in VALID_CATEGORIES:
            return jsonify({'error': 'Invalid category'}), 400
        expense.category = data['category']
    if data.get('date'):
        expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'description' in data:
        expense.description = data['description']
    if 'payment_method' in data:
        expense.payment_method = data['payment_method']
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
        return jsonify({'error': 'Expense not found'}), 404

    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
