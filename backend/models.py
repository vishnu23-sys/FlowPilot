from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    monthly_income = db.Column(db.Float, nullable=True)
    currency = db.Column(db.String(10), default='USD')

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'monthly_income': self.monthly_income,
            'currency': self.currency,
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    __table_args__ = (db.Index('ix_expenses_user_id', 'user_id'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), default='')
    payment_method = db.Column(db.String(50), default='')
    is_recurring = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'category': self.category,
            'date': self.date.isoformat(),
            'description': self.description,
            'payment_method': self.payment_method,
            'is_recurring': self.is_recurring,
        }


class Debt(db.Model):
    __tablename__ = 'debts'
    __table_args__ = (db.Index('ix_debts_user_id', 'user_id'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    person_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'owed_to_me' or 'i_owe'
    description = db.Column(db.String(255), default='')
    is_settled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'person_name': self.person_name,
            'amount': self.amount,
            'type': self.type,
            'description': self.description,
            'is_settled': self.is_settled,
            'created_at': self.created_at.isoformat(),
        }


class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    __table_args__ = (db.Index('ix_subscriptions_user_id', 'user_id'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    billing_cycle = db.Column(db.String(10), nullable=False)  # 'monthly' or 'yearly'
    next_renewal_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'amount': self.amount,
            'billing_cycle': self.billing_cycle,
            'next_renewal_date': self.next_renewal_date.isoformat(),
            'is_active': self.is_active,
        }
