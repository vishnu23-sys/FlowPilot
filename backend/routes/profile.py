import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, bcrypt
from models import User

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

PASSWORD_RE = {
    'length':    (r'.{8,}',          'At least 8 characters'),
    'uppercase': (r'[A-Z]',          'At least one uppercase letter'),
    'special':   (r'[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\;\'`~]', 'At least one special character'),
}


def _validate_password(pw):
    for key, (pattern, msg) in PASSWORD_RE.items():
        if not re.search(pattern, pw):
            return msg
    return None


@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()})


@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}

    if 'full_name' in data:
        name = str(data['full_name']).strip()
        if not name:
            return jsonify({'error': 'Name cannot be empty'}), 400
        user.full_name = name

    if 'email' in data:
        new_email = str(data['email']).lower().strip()
        if not new_email or '@' not in new_email:
            return jsonify({'error': 'Invalid email address'}), 400
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already in use by another account'}), 409
        user.email = new_email

    if 'monthly_income' in data:
        inc = data['monthly_income']
        if inc is None or inc == '':
            user.monthly_income = None
        else:
            try:
                inc = float(inc)
                if inc < 0:
                    return jsonify({'error': 'monthly_income must be 0 or greater'}), 400
                user.monthly_income = inc
            except (ValueError, TypeError):
                return jsonify({'error': 'monthly_income must be a number'}), 400

    if 'currency' in data:
        cur = str(data['currency']).strip().upper()
        if len(cur) != 3:
            return jsonify({'error': 'currency must be a 3-letter code (e.g. USD)'}), 400
        user.currency = cur

    db.session.commit()
    return jsonify({'user': user.to_dict()})


@profile_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    current_pw = data.get('current_password', '')
    new_pw     = data.get('new_password', '')

    if not current_pw or not new_pw:
        return jsonify({'error': 'Both current and new password are required'}), 400
    if not bcrypt.check_password_hash(user.password_hash, current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 401

    error = _validate_password(new_pw)
    if error:
        return jsonify({'error': error}), 400

    user.password_hash = bcrypt.generate_password_hash(new_pw).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'})
