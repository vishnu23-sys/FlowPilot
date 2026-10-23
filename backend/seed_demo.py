"""Create (or reset) a local demo account filled with ~4 months of realistic data.

Usage:  python seed_demo.py
Login:  demo@flowpilot.test / Demo!pass1   (local development only)
"""
import random
from datetime import date, timedelta

from app import app
from extensions import db, bcrypt
from models import User, Expense, Income, Subscription, Debt, Budget, SavingsGoal, GoalContribution
from utils import add_months

DEMO_EMAIL = 'demo@flowpilot.test'
DEMO_PASSWORD = 'Demo!pass1'

MERCHANTS = {
    'Food': [('Swiggy', 250, 900), ('Zomato', 200, 800), ('Blue Tokai', 180, 450), ('BigBasket', 900, 2600)],
    'Transport': [('Uber', 150, 520), ('Metro card', 200, 500), ('Fuel', 1200, 2500)],
    'Shopping': [('Amazon', 400, 3500), ('Uniqlo', 1500, 4000), ('IKEA', 800, 6000)],
    'Entertainment': [('PVR Cinemas', 400, 1200), ('Steam', 300, 1800), ('Concert tickets', 1500, 4500)],
    'Bills': [('Electricity', 1400, 2600), ('Airtel Fiber', 999, 999), ('Phone recharge', 399, 699)],
    'Health': [('Apollo Pharmacy', 200, 1500), ('Cult.fit', 1500, 1500)],
    'Education': [('Coursera', 2000, 4000), ('Books', 300, 1200)],
    'Travel': [('IndiGo', 4500, 9000), ('Airbnb', 3000, 8000)],
    'Others': [('Gift', 500, 2000), ('Haircut', 300, 600)],
}
WEIGHTS = {'Food': 10, 'Transport': 6, 'Shopping': 3, 'Entertainment': 2, 'Bills': 1.5,
           'Health': 1, 'Education': 0.6, 'Travel': 0.4, 'Others': 1}
PAYMENT = ['UPI', 'UPI', 'UPI', 'Credit Card', 'Debit Card', 'Cash']


def seed():
    rng = random.Random(42)
    today = date.today()
    user = User.query.filter_by(email=DEMO_EMAIL).first()
    if user:
        for model in (Expense, Income, Subscription, Debt, Budget):
            model.query.filter_by(user_id=user.id).delete()
        for goal in SavingsGoal.query.filter_by(user_id=user.id).all():
            db.session.delete(goal)
    else:
        user = User(full_name='Demo Pilot', email=DEMO_EMAIL,
                    password_hash=bcrypt.generate_password_hash(DEMO_PASSWORD).decode('utf-8'))
        db.session.add(user)
    user.currency = 'INR'
    user.monthly_income = 85000
    db.session.flush()

    start = add_months(today, -3)
    day = start
    categories, weights = zip(*WEIGHTS.items())
    while day <= today:
        for _ in range(rng.choice([0, 1, 1, 2, 2, 3])):
            category = rng.choices(categories, weights)[0]
            name, low, high = rng.choice(MERCHANTS[category])
            db.session.add(Expense(user_id=user.id, amount=round(rng.uniform(low, high) / 10) * 10,
                                   category=category, date=day, description=name,
                                   payment_method=rng.choice(PAYMENT), is_recurring=category == 'Bills'))
        day += timedelta(days=1)

    for i in range(3, -1, -1):
        month = add_months(today, -i)
        db.session.add(Income(user_id=user.id, amount=85000, source='Salary', date=month, description='Acme Corp',
                              is_recurring=True))
        if i % 2 == 0:
            db.session.add(Income(user_id=user.id, amount=rng.choice([12000, 18000, 9500]), source='Freelance',
                                  date=min(month + timedelta(days=14), today), description='Design project'))

    for name, amount, cycle, offset in [('Netflix', 649, 'monthly', 2), ('Spotify', 119, 'monthly', 5),
                                        ('iCloud+', 75, 'monthly', 11), ('Notion', 800, 'monthly', 19),
                                        ('Amazon Prime', 1499, 'yearly', 44), ('LinkedIn Premium', 1950, 'monthly', 1)]:
        db.session.add(Subscription(user_id=user.id, name=name, amount=amount, billing_cycle=cycle,
                                    next_renewal_date=today + timedelta(days=offset)))
    db.session.add(Subscription(user_id=user.id, name='Disney+ Hotstar', amount=299, billing_cycle='monthly',
                                next_renewal_date=today + timedelta(days=8), is_active=False))

    for person, amount, kind, note, settled in [('Rahul', 1200, 'owed_to_me', 'Dinner split', False),
                                                ('Priya', 3400, 'owed_to_me', 'Goa tickets', False),
                                                ('Arjun', 800, 'i_owe', 'Cab share', False),
                                                ('Meera', 2500, 'i_owe', 'Birthday gift pool', False),
                                                ('Rahul', 600, 'owed_to_me', 'Movie night', True)]:
        db.session.add(Debt(user_id=user.id, person_name=person, amount=amount, type=kind,
                            description=note, is_settled=settled))

    for category, limit in [('Food', 14000), ('Transport', 6000), ('Shopping', 8000), ('Entertainment', 3000)]:
        db.session.add(Budget(user_id=user.id, category=category, monthly_limit=limit))

    for name, target, months, color, contributions in [
        ('Emergency fund', 300000, 10, 'accent', [60000, 25000, 25000, 20000]),
        ('MacBook Pro', 180000, 5, 'violet', [40000, 15000, 15000]),
        ('Japan trip', 220000, 14, 'pink', [20000, 10000]),
    ]:
        goal = SavingsGoal(user_id=user.id, name=name, target_amount=target, color=color,
                           target_date=add_months(today, months))
        db.session.add(goal)
        db.session.flush()
        for i, amount in enumerate(contributions):
            db.session.add(GoalContribution(goal_id=goal.id, amount=amount,
                                            date=add_months(today, -len(contributions) + 1 + i),
                                            note='Monthly transfer' if i else 'Starting balance'))

    db.session.commit()
    print(f'Seeded {DEMO_EMAIL}')


if __name__ == '__main__':
    with app.app_context():
        seed()
