import pytest

from config import resolve_jwt_secret


def test_secret_required_outside_development():
    with pytest.raises(RuntimeError):
        resolve_jwt_secret({'FLASK_ENV': 'production'})


def test_secret_falls_back_in_development():
    assert resolve_jwt_secret({'FLASK_ENV': 'development'}) == 'dev-jwt-secret'
    assert resolve_jwt_secret({'JWT_SECRET_KEY': 'abc'}) == 'abc'


def test_missing_token_returns_json_401(client):
    res = client.get('/api/expenses')
    assert res.status_code == 401
    assert 'error' in res.get_json()


def test_register_rejects_weak_password(client):
    res = client.post('/api/auth/register', json={'full_name': 'A', 'email': 'a@x.test', 'password': 'short'})
    assert res.status_code == 400


@pytest.mark.parametrize('payload,message', [
    ({'amount': 'abc', 'category': 'Food', 'date': '2026-10-01'}, 'amount must be a number'),
    ({'amount': -5, 'category': 'Food', 'date': '2026-10-01'}, 'amount must be greater than 0'),
    ({'amount': 5, 'category': 'Food', 'date': '01/10/2026'}, 'date must be a date in YYYY-MM-DD format'),
    ({'amount': 5, 'category': 'Nope', 'date': '2026-10-01'}, 'Invalid category'),
])
def test_bad_expense_input_is_400(auth, payload, message):
    res = auth.post('/api/expenses', json=payload)
    assert res.status_code == 400
    assert res.get_json()['error'] == message


def test_non_json_body_is_400(auth):
    res = auth.post('/api/expenses', data='not json', content_type='text/plain')
    assert res.status_code == 400


def test_bad_query_param_is_400(auth):
    assert auth.get('/api/expenses?from=garbage').status_code == 400
    assert auth.get('/api/analytics?range=decade').status_code == 400
    assert auth.get('/api/predictions?reduce_spending_pct=200').status_code == 400


def test_wrong_current_password_is_400_not_401(auth):
    res = auth.put('/api/profile/password', json={'current_password': 'Wrong!pass1', 'new_password': 'Another!1A'})
    assert res.status_code == 400


def test_bulk_delete_only_touches_own_expenses(client, auth):
    ids = [auth.post('/api/expenses', json={'amount': 10, 'category': 'Food', 'date': '2026-10-01'}).get_json()['expense']['id']
           for _ in range(3)]
    from tests.conftest import register
    other = {'Authorization': f"Bearer {register(client, email='bo@example.test')}"}
    other_id = client.post('/api/expenses', headers=other,
                           json={'amount': 1, 'category': 'Food', 'date': '2026-10-01'}).get_json()['expense']['id']

    res = auth.post('/api/expenses/bulk-delete', json={'ids': ids[:2] + [other_id]})
    assert res.get_json()['deleted'] == 2
    assert len(auth.get('/api/expenses').get_json()['expenses']) == 1
    assert len(client.get('/api/expenses', headers=other).get_json()['expenses']) == 1
