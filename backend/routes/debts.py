from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Debt

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
    data = request.get_json()

    if not data or not data.get('person_name', '').strip():
        return jsonify({'error': 'person_name is required'}), 400
    if not data.get('amount'):
        return jsonify({'error': 'amount is required'}), 400
    if data.get('type') not in VALID_TYPES:
        return jsonify({'error': 'type must be owed_to_me or i_owe'}), 400

    debt = Debt(
        user_id=user_id,
        person_name=data['person_name'].strip(),
        amount=float(data['amount']),
        type=data['type'],
        description=data.get('description', ''),
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
        return jsonify({'error': 'Debt not found'}), 404

    data = request.get_json()
    if data.get('person_name') is not None:
        debt.person_name = data['person_name'].strip()
    if data.get('amount') is not None:
        debt.amount = float(data['amount'])
    if data.get('type') is not None:
        if data['type'] not in VALID_TYPES:
            return jsonify({'error': 'Invalid type'}), 400
        debt.type = data['type']
    if 'description' in data:
        debt.description = data['description']
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
        return jsonify({'error': 'Debt not found'}), 404

    db.session.delete(debt)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
