"""Shared helpers: input parsing, month arithmetic, money formatting, income resolution."""
from datetime import date, datetime, timedelta

from sqlalchemy import func

from extensions import db

CURRENCY_SYMBOLS = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹',
    'AUD': 'A$', 'CAD': 'C$', 'SGD': 'S$', 'AED': 'AED ',
}


class ApiError(Exception):
    """Raised for client errors; rendered as {"error": message} with the given status."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def json_body(request):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError('Request body must be a JSON object')
    return data


def parse_date(value, field='date'):
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), '%Y-%m-%d').date()
    except (TypeError, ValueError):
        raise ApiError(f'{field} must be a date in YYYY-MM-DD format')


def parse_amount(value, field='amount', allow_zero=False):
    try:
        amount = float(value)
    except (TypeError, ValueError):
        raise ApiError(f'{field} must be a number')
    if amount != amount or amount in (float('inf'), float('-inf')):
        raise ApiError(f'{field} must be a number')
    if amount < 0 or (amount == 0 and not allow_zero):
        raise ApiError(f'{field} must be greater than 0' if not allow_zero else f'{field} cannot be negative')
    return round(amount, 2)


def add_months(d, months):
    """First day of the month `months` away from d's month."""
    m = d.month - 1 + months
    return date(d.year + m // 12, m % 12 + 1, 1)


def month_bounds(d):
    """(first_day, last_day) of d's month."""
    first = d.replace(day=1)
    last = add_months(first, 1) - timedelta(days=1)
    return first, last


def month_key(d):
    return (d.year, d.month)


def money(amount, currency):
    symbol = CURRENCY_SYMBOLS.get(currency or 'USD', f'{currency} ')
    sign = '-' if amount < 0 else ''
    return f'{sign}{symbol}{abs(amount):,.0f}'


def subscription_monthly_cost(subs):
    return sum(s.amount if s.billing_cycle == 'monthly' else s.amount / 12 for s in subs if s.is_active)


def income_entries_total(user_id, first, last):
    from models import Income
    total = db.session.query(func.sum(Income.amount)).filter(
        Income.user_id == user_id,
        Income.date >= first,
        Income.date <= last,
    ).scalar()
    return float(total) if total is not None else None


def effective_income(user, d=None):
    """Income for d's month: logged Income entries when any exist, else the profile's expected income."""
    d = d or date.today()
    first, last = month_bounds(d)
    logged = income_entries_total(user.id, first, last)
    if logged is not None:
        return logged
    return float(user.monthly_income) if user.monthly_income else None


def monthly_expense_totals(user_id, start, end):
    """{(year, month): total} for expenses between start and end inclusive (DB-portable)."""
    from models import Expense
    rows = db.session.query(Expense.date, Expense.amount).filter(
        Expense.user_id == user_id,
        Expense.date >= start,
        Expense.date <= end,
    ).all()
    totals = {}
    for d, amount in rows:
        totals[month_key(d)] = totals.get(month_key(d), 0.0) + amount
    return totals
