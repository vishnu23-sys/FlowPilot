from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Income
from utils import ApiError, json_body, parse_amount, parse_date, add_months, month_bounds

income_bp = Blueprint('income', __name__, url_prefix='/api/income')

VALID_SOURCES = {'Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Gift', 'Refund', 'Other'}


def _get_owned(income_id, user_id):
    entry = db.session.get(Income, income_id)
    if not entry or entry.user_id != user_id:
        raise ApiError('Income entry not found', 404)
    return entry


def _apply(entry, data, partial=False):
    if not partial or data.get('amount') is not None:
        entry.amount = parse_amount(data.get('amount'))
    if not partial or data.get('source'):
        if data.get('source') not in VALID_SOURCES:
            raise ApiError('Invalid source')
        entry.source = data['source']
    if not partial or data.get('date'):
        entry.date = parse_date(data.get('date'))
    if 'description' in data or not partial:
        entry.description = (data.get('description') or '').strip()[:255]
    if 'is_recurring' in data or not partial:
        entry.is_recurring = bool(data.get('is_recurring', False))


@income_bp.route('', methods=['GET'])
@jwt_required()
def list_income():
    user_id = int(get_jwt_identity())
    entries = Income.query.filter_by(user_id=user_id).order_by(Income.date.desc(), Income.id.desc()).all()
    return jsonify({'income': [e.to_dict() for e in entries]})


@income_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = date.today()
    first, last = month_bounds(today)
    prev_first, prev_last = month_bounds(add_months(today, -1))
    start = add_months(today, -5)

    entries = Income.query.filter(Income.user_id == user_id, Income.date >= start).all()
    this_month = [e for e in entries if first <= e.date <= last]
    prev_month = [e for e in entries if prev_first <= e.date <= prev_last]

    by_source = {}
    for e in this_month:
        by_source[e.source] = by_source.get(e.source, 0.0) + e.amount

    monthly = []
    for i in range(5, -1, -1):
        m_first, m_last = month_bounds(add_months(today, -i))
        monthly.append({
            'period': m_first.strftime('%b %Y'),
            'total': round(sum(e.amount for e in entries if m_first <= e.date <= m_last), 2),
        })

    return jsonify({
        'monthly_total': round(sum(e.amount for e in this_month), 2),
        'previous_month_total': round(sum(e.amount for e in prev_month), 2),
        'by_source': [{'source': s, 'total': round(t, 2)} for s, t in sorted(by_source.items(), key=lambda x: -x[1])],
        'monthly': monthly,
    })


@income_bp.route('', methods=['POST'])
@jwt_required()
def create_income():
    user_id = int(get_jwt_identity())
    entry = Income(user_id=user_id)
    _apply(entry, json_body(request))
    db.session.add(entry)
    db.session.commit()
    return jsonify({'income': entry.to_dict()}), 201


@income_bp.route('/<int:income_id>', methods=['PUT'])
@jwt_required()
def update_income(income_id):
    entry = _get_owned(income_id, int(get_jwt_identity()))
    _apply(entry, json_body(request), partial=True)
    db.session.commit()
    return jsonify({'income': entry.to_dict()})


@income_bp.route('/<int:income_id>', methods=['DELETE'])
@jwt_required()
def delete_income(income_id):
    entry = _get_owned(income_id, int(get_jwt_identity()))
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
