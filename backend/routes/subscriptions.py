from datetime import date, datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Subscription

subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')

VALID_CYCLES = {'monthly', 'yearly'}


@subscriptions_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = int(get_jwt_identity())
    today = date.today()
    in_30_days = today + timedelta(days=30)

    active = Subscription.query.filter_by(user_id=user_id, is_active=True).all()

    monthly_total = sum(s.amount for s in active if s.billing_cycle == 'monthly')
    yearly_total  = sum(s.amount for s in active if s.billing_cycle == 'yearly')
    total_yearly  = yearly_total + monthly_total * 12

    upcoming = (
        Subscription.query
        .filter(
            Subscription.user_id == user_id,
            Subscription.is_active == True,
            Subscription.next_renewal_date >= today,
            Subscription.next_renewal_date <= in_30_days,
        )
        .order_by(Subscription.next_renewal_date)
        .all()
    )

    return jsonify({
        'monthly_total': float(monthly_total),
        'yearly_total': float(yearly_total),
        'total_yearly': float(total_yearly),
        'upcoming_renewals': [s.to_dict() for s in upcoming],
    })


@subscriptions_bp.route('', methods=['GET'])
@jwt_required()
def list_subscriptions():
    user_id = int(get_jwt_identity())
    subs = (
        Subscription.query
        .filter_by(user_id=user_id)
        .order_by(Subscription.is_active.desc(), Subscription.next_renewal_date)
        .all()
    )
    return jsonify({'subscriptions': [s.to_dict() for s in subs]})


@subscriptions_bp.route('', methods=['POST'])
@jwt_required()
def create_subscription():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get('name', '').strip():
        return jsonify({'error': 'name is required'}), 400
    if not data.get('amount'):
        return jsonify({'error': 'amount is required'}), 400
    if not data.get('next_renewal_date'):
        return jsonify({'error': 'next_renewal_date is required'}), 400
    if data.get('billing_cycle', 'monthly') not in VALID_CYCLES:
        return jsonify({'error': 'billing_cycle must be monthly or yearly'}), 400

    sub = Subscription(
        user_id=user_id,
        name=data['name'].strip(),
        amount=float(data['amount']),
        billing_cycle=data.get('billing_cycle', 'monthly'),
        next_renewal_date=datetime.strptime(data['next_renewal_date'], '%Y-%m-%d').date(),
        is_active=bool(data.get('is_active', True)),
    )
    db.session.add(sub)
    db.session.commit()
    return jsonify({'subscription': sub.to_dict()}), 201


@subscriptions_bp.route('/<int:sub_id>', methods=['PUT'])
@jwt_required()
def update_subscription(sub_id):
    user_id = int(get_jwt_identity())
    sub = db.session.get(Subscription, sub_id)

    if not sub or sub.user_id != user_id:
        return jsonify({'error': 'Subscription not found'}), 404

    data = request.get_json()
    if data.get('name') is not None:
        sub.name = data['name'].strip()
    if data.get('amount') is not None:
        sub.amount = float(data['amount'])
    if data.get('billing_cycle') is not None:
        if data['billing_cycle'] not in VALID_CYCLES:
            return jsonify({'error': 'Invalid billing_cycle'}), 400
        sub.billing_cycle = data['billing_cycle']
    if data.get('next_renewal_date') is not None:
        sub.next_renewal_date = datetime.strptime(data['next_renewal_date'], '%Y-%m-%d').date()
    if 'is_active' in data:
        sub.is_active = bool(data['is_active'])

    db.session.commit()
    return jsonify({'subscription': sub.to_dict()})


@subscriptions_bp.route('/<int:sub_id>', methods=['DELETE'])
@jwt_required()
def delete_subscription(sub_id):
    user_id = int(get_jwt_identity())
    sub = db.session.get(Subscription, sub_id)

    if not sub or sub.user_id != user_id:
        return jsonify({'error': 'Subscription not found'}), 404

    db.session.delete(sub)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
