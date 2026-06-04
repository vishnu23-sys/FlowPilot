from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Expense

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api')


def _month_list(n):
    """Return list of (year, month) for the last n months, oldest first."""
    today = date.today()
    result = []
    for i in range(n - 1, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        result.append((y, m))
    return result


@analytics_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    range_param = request.args.get('range', 'monthly')
    today = date.today()

    if range_param == 'weekly':
        start_date = today - timedelta(days=6)
    elif range_param == 'yearly':
        m, y = today.month - 11, today.year
        while m <= 0:
            m += 12
            y -= 1
        start_date = date(y, m, 1)
    else:
        m, y = today.month - 5, today.year
        while m <= 0:
            m += 12
            y -= 1
        start_date = date(y, m, 1)

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= start_date,
        Expense.date <= today,
    ).all()

    # Spending by category
    by_cat = {}
    for e in expenses:
        by_cat[e.category] = by_cat.get(e.category, 0) + e.amount
    spending_by_category = [
        {'category': k, 'total': round(v, 2)}
        for k, v in sorted(by_cat.items(), key=lambda x: -x[1])
    ]

    # Trend over time
    if range_param == 'weekly':
        by_day = {}
        for e in expenses:
            key = e.date.strftime('%b %d')
            by_day[key] = by_day.get(key, 0) + e.amount
        trend = [
            {
                'period': (start_date + timedelta(days=i)).strftime('%b %d'),
                'total': round(by_day.get((start_date + timedelta(days=i)).strftime('%b %d'), 0), 2),
            }
            for i in range(7)
        ]
    else:
        months_back = 12 if range_param == 'yearly' else 6
        by_month = {}
        for e in expenses:
            key = e.date.strftime('%b %Y')
            by_month[key] = by_month.get(key, 0) + e.amount
        trend = [
            {
                'period': date(y, m, 1).strftime('%b %Y'),
                'total': round(by_month.get(date(y, m, 1).strftime('%b %Y'), 0), 2),
            }
            for y, m in _month_list(months_back)
        ]

    # Savings trend (only for monthly/yearly, needs income)
    savings_trend = []
    if user.monthly_income and range_param != 'weekly':
        for item in trend:
            savings_trend.append({
                'period': item['period'],
                'income': round(user.monthly_income, 2),
                'expenses': item['total'],
                'savings': round(user.monthly_income - item['total'], 2),
            })

    return jsonify({
        'spending_by_category': spending_by_category,
        'trend': trend,
        'savings_trend': savings_trend,
    })
