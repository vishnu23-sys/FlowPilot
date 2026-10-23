from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from sqlalchemy import func
from models import User, Expense, Income
from utils import ApiError, add_months, effective_income, month_bounds

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api')

RANGES = {'weekly', 'monthly', 'yearly'}


def _periods(range_param, today):
    """List of (label, start, end) for the current range, oldest first, plus the range length."""
    if range_param == 'weekly':
        days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        return [(d.strftime('%a %d'), d, d) for d in days]
    months = 12 if range_param == 'yearly' else 6
    periods = []
    for i in range(months - 1, -1, -1):
        first, last = month_bounds(add_months(today, -i))
        periods.append((first.strftime('%b %Y'), first, min(last, today)))
    return periods


def _previous_window(range_param, start, today):
    if range_param == 'weekly':
        return start - timedelta(days=7), start - timedelta(days=1)
    months = 12 if range_param == 'yearly' else 6
    prev_start = add_months(start, -months)
    # Compare like-for-like: the same number of elapsed days into the final month.
    prev_end = add_months(today, -months) + timedelta(days=today.day - 1)
    return prev_start, min(prev_end, start - timedelta(days=1))


def _by_category(expenses):
    totals = {}
    for e in expenses:
        totals[e.category] = totals.get(e.category, 0.0) + e.amount
    return totals


@analytics_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    range_param = request.args.get('range', 'monthly')
    if range_param not in RANGES:
        raise ApiError('range must be weekly, monthly, or yearly')
    today = date.today()

    periods = _periods(range_param, today)
    start = periods[0][1]
    prev_start, prev_end = _previous_window(range_param, start, today)

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= prev_start,
        Expense.date <= today,
    ).all()
    current = [e for e in expenses if e.date >= start]
    previous = [e for e in expenses if prev_start <= e.date <= prev_end]

    cur_by_cat = _by_category(current)
    prev_by_cat = _by_category(previous)

    trend = []
    for label, p_start, p_end in periods:
        in_period = [e for e in current if p_start <= e.date <= p_end]
        trend.append({
            'period': label,
            'total': round(sum(e.amount for e in in_period), 2),
            'by_category': {k: round(v, 2) for k, v in _by_category(in_period).items()},
        })

    savings_trend = []
    if range_param != 'weekly':
        # Months before the user's first recorded activity would show the expected income as pure
        # savings, so the series starts at their first expense or income entry.
        firsts = [db.session.query(func.min(m.date)).filter(m.user_id == user_id).scalar() for m in (Expense, Income)]
        first_activity = min((d for d in firsts if d), default=None)
        for (label, p_start, p_end), point in zip(periods, trend):
            if first_activity is None or p_end < first_activity:
                continue
            income = effective_income(user, p_start)
            if income is None:
                continue
            savings_trend.append({
                'period': label,
                'income': round(income, 2),
                'expenses': point['total'],
                'savings': round(income - point['total'], 2),
            })

    comparison = []
    for cat in sorted(set(cur_by_cat) | set(prev_by_cat), key=lambda c: -cur_by_cat.get(c, 0)):
        cur_amt, prev_amt = cur_by_cat.get(cat, 0.0), prev_by_cat.get(cat, 0.0)
        comparison.append({
            'category': cat,
            'current': round(cur_amt, 2),
            'previous': round(prev_amt, 2),
            'change_pct': round((cur_amt - prev_amt) / prev_amt * 100, 1) if prev_amt else None,
        })

    total = sum(cur_by_cat.values())
    prev_total = sum(prev_by_cat.values())
    return jsonify({
        'range': range_param,
        'spending_by_category': [
            {'category': k, 'total': round(v, 2)} for k, v in sorted(cur_by_cat.items(), key=lambda x: -x[1])
        ],
        'trend': trend,
        'savings_trend': savings_trend,
        'comparison': comparison,
        'totals': {
            'current': round(total, 2),
            'previous': round(prev_total, 2),
            'change_pct': round((total - prev_total) / prev_total * 100, 1) if prev_total else None,
            'average_per_period': round(total / len(periods), 2),
            'transactions': len(current),
        },
    })
