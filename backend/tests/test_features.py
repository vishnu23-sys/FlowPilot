from datetime import date, timedelta

from utils import add_months, effective_income
from models import User

TODAY = date.today()
THIS_MONTH = TODAY.replace(day=1).isoformat()
LAST_MONTH = add_months(TODAY, -1).isoformat()


def add_expense(auth, amount, category='Food', on=THIS_MONTH):
    res = auth.post('/api/expenses', json={'amount': amount, 'category': category, 'date': on})
    assert res.status_code == 201, res.get_json()


def test_summary_includes_previous_month_and_daily_series(auth):
    add_expense(auth, 100)
    add_expense(auth, 50, on=LAST_MONTH)
    data = auth.get('/api/expenses/summary').get_json()

    assert data['monthly_total'] == 100
    assert data['previous_month_total'] == 50
    assert len(data['daily']) == TODAY.day
    assert data['daily'][-1]['total'] == 100  # cumulative
    assert data['previous_daily'][-1]['total'] == 50


def test_income_crud_and_summary(auth):
    res = auth.post('/api/income', json={'amount': 5000, 'source': 'Salary', 'date': THIS_MONTH})
    assert res.status_code == 201
    income_id = res.get_json()['income']['id']
    assert auth.post('/api/income', json={'amount': 5, 'source': 'Lottery', 'date': THIS_MONTH}).status_code == 400

    assert auth.put(f'/api/income/{income_id}', json={'amount': 6000}).get_json()['income']['amount'] == 6000
    summary = auth.get('/api/income/summary').get_json()
    assert summary['monthly_total'] == 6000
    assert summary['by_source'][0] == {'source': 'Salary', 'total': 6000}
    assert len(summary['monthly']) == 6

    assert auth.delete(f'/api/income/{income_id}').status_code == 200
    assert auth.get('/api/income').get_json()['income'] == []


def test_effective_income_prefers_logged_entries(app, auth):
    auth.put('/api/profile', json={'monthly_income': 3000})
    user = User.query.first()
    assert effective_income(user) == 3000
    auth.post('/api/income', json={'amount': 4200, 'source': 'Salary', 'date': THIS_MONTH})
    assert effective_income(user) == 4200


def test_budgets_progress_and_status(auth):
    assert auth.put('/api/budgets/Food', json={'monthly_limit': 100}).status_code == 200
    auth.put('/api/budgets/Travel', json={'monthly_limit': 1000})
    assert auth.put('/api/budgets/Nope', json={'monthly_limit': 1}).status_code == 400
    add_expense(auth, 120, 'Food')
    add_expense(auth, 900, 'Travel')

    data = auth.get('/api/budgets').get_json()
    by_cat = {b['category']: b for b in data['budgets']}
    assert by_cat['Food']['status'] == 'over'
    assert by_cat['Travel']['status'] == 'near'
    assert data['budgets'][0]['category'] == 'Food'  # most used first
    assert data['total_limit'] == 1100

    auth.put('/api/budgets/Food', json={'monthly_limit': 500})
    assert {b['category']: b for b in auth.get('/api/budgets').get_json()['budgets']}['Food']['status'] == 'ok'
    assert auth.delete('/api/budgets/Food').status_code == 200
    assert auth.delete('/api/budgets/Food').status_code == 404


def test_goals_with_contributions(auth):
    target = (TODAY + timedelta(days=95)).isoformat()
    res = auth.post('/api/goals', json={'name': 'Laptop', 'target_amount': 1000, 'target_date': target,
                                         'initial_amount': 100})
    assert res.status_code == 201
    goal = res.get_json()['goal']
    assert goal['saved'] == 100
    assert goal['monthly_needed'] is not None and goal['monthly_needed'] > 0

    goal = auth.post(f"/api/goals/{goal['id']}/contributions", json={'amount': 900}).get_json()['goal']
    assert goal['is_complete'] and goal['pct'] == 1
    contribution_id = goal['contributions'][0]['id']

    goal = auth.delete(f"/api/goals/{goal['id']}/contributions/{contribution_id}").get_json()['goal']
    assert goal['saved'] == 100

    listing = auth.get('/api/goals').get_json()
    assert listing['total_saved'] == 100 and listing['total_target'] == 1000
    assert auth.delete(f"/api/goals/{goal['id']}").status_code == 200
    assert auth.get('/api/goals').get_json()['goals'] == []


def test_attention_collects_signals(auth):
    auth.put('/api/budgets/Food', json={'monthly_limit': 10})
    add_expense(auth, 50, 'Food')
    auth.post('/api/subscriptions', json={'name': 'Music', 'amount': 9, 'billing_cycle': 'monthly',
                                          'next_renewal_date': (TODAY + timedelta(days=1)).isoformat()})
    auth.post('/api/debts', json={'person_name': 'Sam', 'amount': 20, 'type': 'i_owe'})

    data = auth.get('/api/attention').get_json()
    kinds = [i['kind'] for i in data['items']]
    assert kinds[0] == 'budget_over'
    assert {'income_missing', 'renewal', 'debt_owe'} <= set(kinds)
    assert data['count'] == len(data['items'])


def test_derived_endpoints_work_on_portable_sql(auth):
    auth.post('/api/income', json={'amount': 4000, 'source': 'Salary', 'date': THIS_MONTH})
    add_expense(auth, 300, 'Food')
    add_expense(auth, 200, 'Travel', on=LAST_MONTH)
    auth.put('/api/budgets/Food', json={'monthly_limit': 100})
    auth.post('/api/goals', json={'name': 'Trip', 'target_amount': 100, 'initial_amount': 80})

    health = auth.get('/api/health-score').get_json()
    assert 0 <= health['score'] <= 100 and len(health['components']) == 4

    insights = auth.get('/api/insights').get_json()['insights']
    texts = ' '.join(i['text'] for i in insights)
    assert '₹' in texts and 'INR ' not in texts
    assert 'over its' in texts

    preds = auth.get('/api/predictions?reduce_spending_pct=10').get_json()
    assert preds['monthly_income'] == 4000
    assert len(preds['savings_projection']) == 12

    for rng in ('weekly', 'monthly', 'yearly'):
        data = auth.get(f'/api/analytics?range={rng}').get_json()
        assert data['totals']['current'] >= 0
        assert all('by_category' in p for p in data['trend'])
    monthly = auth.get('/api/analytics?range=monthly').get_json()
    assert monthly['savings_trend'][-1]['income'] == 4000
    assert {c['category'] for c in monthly['comparison']} == {'Food', 'Travel'}
