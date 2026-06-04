# FlowPilot

**Personal finance management — built for clarity, not complexity.**

FlowPilot is a full-stack personal finance web application that helps you track expenses, manage debts and subscriptions, and understand your financial health through rule-based insights and savings predictions. It features a premium dark glassmorphism UI, JWT-based authentication, and a RESTful Flask API backed by PostgreSQL.

---

## Screenshots

> Add your own screenshots to a `screenshots/` folder and update the paths below.

![Dashboard](screenshots/dashboard.png)
![Expenses](screenshots/expenses.png)
![Analytics](screenshots/analytics.png)
![Goals & Predictions](screenshots/goals.png)
![Settings](screenshots/settings.png)

---

## Features

- **Authentication** — JWT-based register/login; passwords hashed with bcrypt; persistent sessions via localStorage.
- **Expense tracking** — Full CRUD with category, date, payment method, description, and recurring flag. Ten supported categories (Food, Transport, Shopping, Entertainment, Bills, Health, Education, Travel, Investments, Others).
- **Dashboard** — Monthly spend totals, budget-remaining card, spending-by-category donut chart (Recharts), recent transactions, financial health score gauge, and rule-based insight cards. Count-up animations on all monetary stat cards.
- **Financial health score** — Computed out of 100 from savings rate, debt ratio, subscription load, and spending consistency. Includes component breakdown bars and 2–3 personalised recommendations.
- **Rule-based insights** — Automatic observations derived from the user's own data: top category growth, weekend vs. weekday patterns, subscription-to-expense ratio, largest single spend, and more. No external AI API required.
- **Analytics page** — Spending-by-category pie chart, monthly spending trend line chart, and savings trend line chart. Filterable by weekly / monthly / yearly range.
- **Goals & Predictions** — Simulate reduced spending, increased savings, or cancelling a subscription with sliders; projects 12-month savings trajectory and debt-payoff timeline as area charts.
- **Debts & Split tracking** — Track money owed to you and money you owe, with settle/unsettle toggle. Unsettled totals shown as stat cards.
- **Subscription tracker** — Log recurring bills with monthly/yearly billing cycles, next-renewal dates, and active/inactive status. Stat cards for monthly cost, yearly cost, and total annual equivalent. Upcoming renewals (next 30 days) highlighted with urgency colour coding.
- **Settings / Profile** — Edit name, monthly income (unlocks health score and predictions), and preferred currency (USD, EUR, GBP, INR, AUD, CAD, SGD, AED). Change email and password (password strength enforced: 8+ chars, uppercase, special character).
- **Premium dark UI** — Glassmorphism cards, blue/purple gradient accents, Framer Motion page transitions and stagger animations, animated sidebar, responsive mobile layout with hamburger drawer.
- **UX polish** — Toast notifications (react-hot-toast) for all create/update/delete/save actions; glassmorphism confirm modal before any delete; friendly empty states with call-to-action prompts; currency symbol display (₹, $, £, €, etc.) across all pages.

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5.0 | Build tool and dev server |
| Tailwind CSS | 3.3 | Utility-first styling |
| Framer Motion | 12.40 | Animations and page transitions |
| Recharts | 3.8 | Charts (pie, line, area) |
| Axios | 1.6 | HTTP client with JWT interceptor |
| React Router DOM | 7.16 | Client-side routing and protected routes |
| react-hot-toast | 2.6 | Toast notifications |
| lucide-react | 1.17 | Icon set |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Flask | 3.0 | Web framework |
| Flask-SQLAlchemy | 3.1 | ORM |
| Flask-JWT-Extended | 4.6 | JWT authentication |
| Flask-Bcrypt | 1.0 | Password hashing |
| Flask-CORS | 4.0 | Cross-origin request handling |
| psycopg (psycopg3) | ≥ 3.1 | PostgreSQL driver (binary wheel, Python 3.14 compatible) |
| SQLAlchemy | ≥ 2.0 | SQL toolkit |
| python-dotenv | 1.0 | Environment variable loading |

### Database
- **PostgreSQL** — via psycopg3 using the `postgresql+psycopg://` SQLAlchemy dialect.

---

## Local Setup

### Prerequisites

- **Node.js** v18 or later (includes npm)
- **Python 3.14** (psycopg3 has a pre-built binary wheel for 3.14 — do **not** use psycopg2)
- **PostgreSQL** running locally with a database named `flowpilot`

Create the database if you haven't yet:
```sql
CREATE DATABASE flowpilot;
```

---

### Backend

Open a terminal in the project root.

```powershell
cd backend

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create your .env file from the example
copy .env.example .env
```

Edit `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/flowpilot
FLASK_ENV=development
FLASK_APP=app.py
CORS_ORIGIN=http://localhost:5173
JWT_SECRET_KEY=replace-with-a-long-random-string
```

> **Important — dialect:** The URL must use `postgresql+psycopg://` (psycopg3), not `postgresql://` (psycopg2). If your PostgreSQL password contains `@`, encode it as `%40`.

Start the backend (tables are created automatically on first run):

```powershell
python app.py
```

The API runs on **http://localhost:5000**.

---

### Frontend

Open a second terminal in the project root.

```powershell
cd frontend

# Install dependencies
npm install

# Create your .env file from the example
copy .env.example .env
```

`frontend/.env` should contain:

```env
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```powershell
npm run dev
```

The app runs on **http://localhost:5173**.

---

### Troubleshooting

**PowerShell execution policy error** when running `.\venv\Scripts\Activate.ps1`:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Run this once, then retry the activation command.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Full psycopg3 connection string. Must use `postgresql+psycopg://` dialect. |
| `FLASK_ENV` | No | Set to `development` for debug mode and auto-reload. |
| `FLASK_APP` | No | Entry point — set to `app.py`. |
| `CORS_ORIGIN` | No | Allowed frontend origin. Defaults to `http://localhost:5173`. |
| `JWT_SECRET_KEY` | Yes | Secret used to sign JWT tokens. Use a long random string in production. |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the Flask backend. All Axios requests are prefixed with this value. |

---

## Project Structure

```
project/
├── backend/
│   ├── app.py                  # Flask app factory, blueprint registration, db.create_all()
│   ├── extensions.py           # SQLAlchemy, Bcrypt, JWTManager instances (avoids circular imports)
│   ├── models.py               # ORM models: User, Expense, Debt, Subscription
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── auth.py             # POST /api/auth/register, /login, GET /me
│       ├── expenses.py         # CRUD /api/expenses + /summary
│       ├── debts.py            # CRUD /api/debts + /summary
│       ├── subscriptions.py    # CRUD /api/subscriptions + /summary
│       ├── profile.py          # GET/PUT /api/profile, PUT /api/profile/password
│       ├── insights.py         # GET /api/insights
│       ├── health_score.py     # GET /api/health-score
│       ├── analytics.py        # GET /api/analytics
│       └── predictions.py      # GET /api/predictions
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx             # Router, protected routes, Toaster
│       ├── main.jsx
│       ├── index.css           # Tailwind directives, glass utility, skeleton animation
│       ├── constants.js        # Categories, currency symbols, formatAmount helper
│       ├── context/
│       │   └── AuthContext.jsx # JWT + user state; login / logout / updateUser
│       ├── hooks/
│       │   └── useCountUp.js   # Animated number count-up hook
│       ├── api/
│       │   └── apiClient.js    # Axios instance with Bearer token interceptor
│       ├── components/
│       │   ├── AppLayout.jsx   # Sidebar + TopNavbar wrapper with page transitions
│       │   ├── Sidebar.jsx     # Nav links, coming-soon placeholders, Settings footer
│       │   ├── TopNavbar.jsx   # User dropdown (logout, settings placeholder)
│       │   ├── ProtectedRoute.jsx
│       │   └── ui/
│       │       ├── Card.jsx        # Glassmorphism animated card
│       │       ├── Button.jsx      # Primary / ghost / danger variants
│       │       ├── Input.jsx       # Dark-styled Input and Select exports
│       │       ├── StatCard.jsx    # Metric card with count-up animation
│       │       ├── Skeleton.jsx    # Loading skeleton components
│       │       ├── ConfirmModal.jsx # Delete confirmation dialog
│       │       └── ScoreGauge.jsx  # SVG arc gauge for health score
│       └── pages/
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Dashboard.jsx
│           ├── Expenses.jsx
│           ├── Debts.jsx
│           ├── Subscriptions.jsx
│           ├── Analytics.jsx
│           ├── Goals.jsx           # Savings predictions and simulations
│           └── Settings.jsx        # Profile and security tabs
│
└── README.md
```

---

## API Overview

All routes except `/api/health`, `/api/auth/register`, and `/api/auth/login` require a `Authorization: Bearer <token>` header.

| Group | Prefix | Endpoints |
|---|---|---|
| Health check | `/api/health` | `GET` — returns `{"status": "ok"}` |
| Auth | `/api/auth` | `POST /register`, `POST /login`, `GET /me` |
| Expenses | `/api/expenses` | `GET`, `POST`, `PUT /<id>`, `DELETE /<id>`, `GET /summary` |
| Debts | `/api/debts` | `GET`, `POST`, `PUT /<id>`, `DELETE /<id>`, `GET /summary` |
| Subscriptions | `/api/subscriptions` | `GET`, `POST`, `PUT /<id>`, `DELETE /<id>`, `GET /summary` |
| Profile | `/api/profile` | `GET`, `PUT`, `PUT /password` |
| Insights | `/api/insights` | `GET` — rule-based financial observations |
| Health Score | `/api/health-score` | `GET` — score out of 100 with component breakdown |
| Analytics | `/api/analytics` | `GET ?range=weekly\|monthly\|yearly` |
| Predictions | `/api/predictions` | `GET ?reduce_spending_pct=&extra_savings=&cancel_subscription_id=` |

---

## Deployment

> **Status: Coming soon.** The app is not yet deployed. The recommended target stack is:

| Layer | Service |
|---|---|
| Frontend | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — run `npm run build`, deploy the `dist/` folder |
| Backend | [Render](https://render.com) or [Railway](https://railway.app) — set environment variables via the dashboard |
| Database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both provide managed PostgreSQL with a free tier |

When deploying, set `JWT_ACCESS_TOKEN_EXPIRES` to a `timedelta` (e.g. `timedelta(days=7)`) rather than `False`, and set `CORS_ORIGIN` to your production frontend URL.

---

## License

MIT © 2026 Vishnu Patruni
