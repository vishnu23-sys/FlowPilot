from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Debt
from utils import ApiError, json_body, parse_amount

debts_bp = Blueprint('debts', __name__, url_prefix='/api/debts')

VALID_TYPES = {'owed_to_me', 'i_owe'}


@debts_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())

    total_owed_to_me = db.session.query(func.sum(Debt.amount)).filter(
        Debt.user_id == user_id,
        Debt.type == 'owed_to_me',
        Debt.is_settled == False,
    ).scalar() or 0.0

    total_i_owe = db.session.query(func.sum(Debt.amount)).filter(
        Debt.user_id == user_id,
        Debt.type == 'i_owe',
        Debt.is_settled == False,
    ).scalar() or 0.0

    return jsonify({
        'total_owed_to_me': float(total_owed_to_me),
        'total_i_owe': float(total_i_owe),
    })


@debts_bp.route('', methods=['GET'])
@jwt_required()
def list_debts():
    user_id = int(get_jwt_identity())
    debts = Debt.query.filter_by(user_id=user_id).order_by(Debt.created_at.desc()).all()
    return jsonify({'debts': [d.to_dict() for d in debts]})


@debts_bp.route('', methods=['POST'])
@jwt_required()
def create_debt():
    user_id = int(get_jwt_identity())
    data = json_body(request)

    if not str(data.get('person_name') or '').strip():
        raise ApiError('person_name is required')
    if data.get('amount') in (None, ''):
        raise ApiError('amount is required')
    if data.get('type') not in VALID_TYPES:
        raise ApiError('type must be owed_to_me or i_owe')

    debt = Debt(
        user_id=user_id,
        person_name=data['person_name'].strip()[:100],
        amount=parse_amount(data['amount']),
        type=data['type'],
        description=(data.get('description') or '').strip()[:255],
    )
    db.session.add(debt)
    db.session.commit()
    return jsonify({'debt': debt.to_dict()}), 201


@debts_bp.route('/<int:debt_id>', methods=['PUT'])
@jwt_required()
def update_debt(debt_id):
    user_id = int(get_jwt_identity())
    debt = db.session.get(Debt, debt_id)

    if not debt or debt.user_id != user_id:
        raise ApiError('Debt not found', 404)

    data = json_body(request)
    if data.get('person_name') is not None:
        if not str(data['person_name']).strip():
            raise ApiError('person_name is required')
        debt.person_name = str(data['person_name']).strip()[:100]
    if data.get('amount') is not None:
        debt.amount = parse_amount(data['amount'])
    if data.get('type') is not None:
        if data['type'] not in VALID_TYPES:
            raise ApiError('Invalid type')
        debt.type = data['type']
    if 'description' in data:
        debt.description = (data['description'] or '').strip()[:255]
    if 'is_settled' in data:
        debt.is_settled = bool(data['is_settled'])

    db.session.commit()
    return jsonify({'debt': debt.to_dict()})


@debts_bp.route('/<int:debt_id>', methods=['DELETE'])
@jwt_required()
def delete_debt(debt_id):
    user_id = int(get_jwt_identity())
    debt = db.session.get(Debt, debt_id)

    if not debt or debt.user_id != user_id:
        raise ApiError('Debt not found', 404)

    db.session.delete(debt)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
