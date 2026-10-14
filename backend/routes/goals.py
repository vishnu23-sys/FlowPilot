from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import SavingsGoal, GoalContribution
from utils import ApiError, json_body, parse_amount, parse_date

goals_bp = Blueprint('goals', __name__, url_prefix='/api/goals')

VALID_COLORS = {'accent', 'amber', 'blue', 'violet', 'pink', 'teal'}


def months_between(start, end):
    """Whole months remaining from start until end (at least 1 if end is in the future)."""
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day > start.day:
        months += 1
    return max(months, 1) if end > start else 0


def goal_to_dict(goal, include_contributions=False):
    saved = round(sum(c.amount for c in goal.contributions), 2)
    remaining = round(max(goal.target_amount - saved, 0), 2)
    pct = min(saved / goal.target_amount, 1) if goal.target_amount else 0
    monthly_needed = None
    months_left = None
    if goal.target_date and remaining > 0:
        months_left = months_between(date.today(), goal.target_date)
        monthly_needed = round(remaining / months_left, 2) if months_left else None
    data = {
        'id': goal.id,
        'name': goal.name,
        'target_amount': goal.target_amount,
        'target_date': goal.target_date.isoformat() if goal.target_date else None,
        'color': goal.color or 'accent',
        'saved': saved,
        'remaining': remaining,
        'pct': round(pct, 4),
        'is_complete': saved >= goal.target_amount,
        'months_left': months_left,
        'monthly_needed': monthly_needed,
        'overdue': bool(goal.target_date and goal.target_date < date.today() and remaining > 0),
        'last_contribution': goal.contributions[0].date.isoformat() if goal.contributions else None,
    }
    if include_contributions:
        data['contributions'] = [c.to_dict() for c in goal.contributions]
    return data


def _get_owned(goal_id, user_id):
    goal = db.session.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != user_id:
        raise ApiError('Goal not found', 404)
    return goal


def _apply(goal, data, partial=False):
    if not partial or 'name' in data:
        name = str(data.get('name') or '').strip()
        if not name:
            raise ApiError('name is required')
        goal.name = name[:100]
    if not partial or data.get('target_amount') is not None:
        goal.target_amount = parse_amount(data.get('target_amount'), 'target_amount')
    if 'target_date' in data:
        goal.target_date = parse_date(data['target_date'], 'target_date') if data['target_date'] else None
    if 'color' in data:
        if data['color'] not in VALID_COLORS:
            raise ApiError('Invalid color')
        goal.color = data['color']


@goals_bp.route('', methods=['GET'])
@jwt_required()
def list_goals():
    user_id = int(get_jwt_identity())
    goals = SavingsGoal.query.filter_by(user_id=user_id).order_by(SavingsGoal.created_at).all()
    items = [goal_to_dict(g, include_contributions=True) for g in goals]
    return jsonify({
        'goals': items,
        'total_saved': round(sum(g['saved'] for g in items), 2),
        'total_target': round(sum(g['target_amount'] for g in items), 2),
    })


@goals_bp.route('', methods=['POST'])
@jwt_required()
def create_goal():
    goal = SavingsGoal(user_id=int(get_jwt_identity()))
    data = json_body(request)
    _apply(goal, data)
    db.session.add(goal)
    db.session.flush()
    initial = data.get('initial_amount')
    if initial not in (None, '', 0, '0'):
        db.session.add(GoalContribution(goal_id=goal.id, amount=parse_amount(initial, 'initial_amount'),
                                        date=date.today(), note='Starting balance'))
    db.session.commit()
    return jsonify({'goal': goal_to_dict(goal, include_contributions=True)}), 201


@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    goal = _get_owned(goal_id, int(get_jwt_identity()))
    _apply(goal, json_body(request), partial=True)
    db.session.commit()
    return jsonify({'goal': goal_to_dict(goal, include_contributions=True)})


@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    goal = _get_owned(goal_id, int(get_jwt_identity()))
    db.session.delete(goal)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@goals_bp.route('/<int:goal_id>/contributions', methods=['POST'])
@jwt_required()
def add_contribution(goal_id):
    goal = _get_owned(goal_id, int(get_jwt_identity()))
    data = json_body(request)
    contribution = GoalContribution(
        goal_id=goal.id,
        amount=parse_amount(data.get('amount')),
        date=parse_date(data['date']) if data.get('date') else date.today(),
        note=(data.get('note') or '').strip()[:255],
    )
    db.session.add(contribution)
    db.session.commit()
    db.session.refresh(goal)
    return jsonify({'goal': goal_to_dict(goal, include_contributions=True)}), 201


@goals_bp.route('/<int:goal_id>/contributions/<int:contribution_id>', methods=['DELETE'])
@jwt_required()
def delete_contribution(goal_id, contribution_id):
    goal = _get_owned(goal_id, int(get_jwt_identity()))
    contribution = db.session.get(GoalContribution, contribution_id)
    if not contribution or contribution.goal_id != goal.id:
        raise ApiError('Contribution not found', 404)
    db.session.delete(contribution)
    db.session.commit()
    db.session.refresh(goal)
    return jsonify({'goal': goal_to_dict(goal, include_contributions=True)})
