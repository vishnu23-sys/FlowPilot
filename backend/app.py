import os
from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

from extensions import db, bcrypt, jwt
from config import resolve_jwt_secret
from utils import ApiError

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = resolve_jwt_secret(os.environ)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=int(os.getenv('JWT_EXPIRES_DAYS', '7')))

db.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)

cors_origins = [o.strip() for o in os.getenv('CORS_ORIGIN', 'http://localhost:5173').split(',') if o.strip()]
CORS(app, origins=cors_origins)


@jwt.expired_token_loader
def expired_token(_header, _payload):
    return jsonify({'error': 'Your session expired. Log in again.'}), 401


@jwt.invalid_token_loader
def invalid_token(_reason):
    return jsonify({'error': 'Invalid session. Log in again.'}), 401


@jwt.unauthorized_loader
def missing_token(_reason):
    return jsonify({'error': 'Log in to continue.'}), 401


@app.errorhandler(ApiError)
def handle_api_error(err):
    return jsonify({'error': err.message}), err.status


@app.errorhandler(HTTPException)
def handle_http_error(err):
    return jsonify({'error': err.description}), err.code


from routes.auth import auth_bp
from routes.expenses import expenses_bp
from routes.debts import debts_bp
from routes.subscriptions import subscriptions_bp
from routes.profile import profile_bp
from routes.insights import insights_bp
from routes.health_score import health_score_bp
from routes.analytics import analytics_bp
from routes.predictions import predictions_bp
from routes.income import income_bp
from routes.budgets import budgets_bp
from routes.goals import goals_bp
from routes.attention import attention_bp

for bp in (auth_bp, expenses_bp, debts_bp, subscriptions_bp, profile_bp, insights_bp,
           health_score_bp, analytics_bp, predictions_bp, income_bp, budgets_bp, goals_bp, attention_bp):
    app.register_blueprint(bp)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
