import os
import sys

os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['FLOWPILOT_TESTING'] = '1'
os.environ['JWT_SECRET_KEY'] = 'test-secret-that-is-at-least-32-bytes-long'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

from app import app as flask_app  # noqa: E402
from extensions import db  # noqa: E402

PASSWORD = 'Testpass!1'


@pytest.fixture
def app():
    flask_app.config['TESTING'] = True
    with flask_app.app_context():
        db.drop_all()
        db.create_all()
        yield flask_app
        db.session.remove()


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, email='ana@example.test', name='Ana Test', currency='INR'):
    res = client.post('/api/auth/register', json={
        'full_name': name, 'email': email, 'password': PASSWORD, 'currency': currency,
    })
    assert res.status_code == 201, res.get_json()
    return res.get_json()['token']


@pytest.fixture
def auth(client):
    token = register(client)
    headers = {'Authorization': f'Bearer {token}'}

    class Api:
        def get(self, url, **kw):
            return client.get(url, headers=headers, **kw)

        def post(self, url, **kw):
            return client.post(url, headers=headers, **kw)

        def put(self, url, **kw):
            return client.put(url, headers=headers, **kw)

        def delete(self, url, **kw):
            return client.delete(url, headers=headers, **kw)

    return Api()
