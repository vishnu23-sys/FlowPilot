import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, bcrypt, jwt

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # tokens don't expire during development

db.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)

CORS(app, origins=[os.getenv('CORS_ORIGIN', 'http://localhost:5173')])

from routes.auth import auth_bp
from routes.expenses import expenses_bp
from routes.debts import debts_bp
from routes.subscriptions import subscriptions_bp
from routes.profile import profile_bp
from routes.insights import insights_bp
from routes.health_score import health_score_bp
from routes.analytics import analytics_bp
from routes.predictions import predictions_bp
app.register_blueprint(auth_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(debts_bp)
app.register_blueprint(subscriptions_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(insights_bp)
app.register_blueprint(health_score_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(predictions_bp)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
