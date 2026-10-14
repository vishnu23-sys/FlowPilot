# FlowPilot

**Personal finance, without the noise.**

FlowPilot is a full-stack personal finance app. It tracks spending and income, keeps budgets per category, follows subscriptions and debts, and saves toward goals. Rule-based insights and a health score then explain what changed this month. React and Vite on the front end, a Flask REST API with PostgreSQL behind it.

---

## Screenshots

> Add your own screenshots to a `screenshots/` folder and update the paths below.

![Dashboard](screenshots/dashboard.png)
![Expenses](screenshots/expenses.png)
![Subscriptions](screenshots/subscriptions.png)
![Goals](screenshots/goals.png)

---

## Features

- **Dashboard.** Spent this month (against the same point last month), left to spend, and a health score, plus quick actions, a running spend curve with week, month and year views, a "needs attention" list, recent transactions, category split, budgets, the health breakdown and insights.
- **Expenses.** Search, category filter, date presets and sort, all kept in the URL. Rows are grouped by day with subtotals. You can select several rows to delete in bulk, every delete can be undone for five seconds, and clicking a row opens it for editing.
- **Income.** Log salary, freelance work, refunds and other income. Logged income replaces the expected monthly income for that month everywhere it's used: health score, insights, analytics and projections.
- **Budgets.** A monthly limit per category, with progress, a marker for today's point in the month, a month-end projection at the current pace, and a safe-to-spend-per-day figure.
- **Subscriptions.** Monthly and yearly cost, a renewal calendar you can click to filter, upcoming renewals, and cards that open into a detail view with pause and resume.
- **Debts.** "They owe me" and "I owe" views with a net balance, debts grouped by person, and settle or unsettle with one click.
- **Goals.** Named savings goals with a target and optional date. FlowPilot works out the monthly amount needed and keeps a contribution history. The "What if" simulator projects 12 months of savings and debt payoff.
- **Analytics.** Week, 6-month and year ranges, stacked category trends, a comparison against the previous period, and income against spending.
- **Settings.** Profile, expected income and currency; light, dark or system theme; lime, vermilion or teal accent; default sidebar state; reduced motion; password change with a strength meter.

### Design and interaction

- **Look.** Serif headline figures (Instrument Serif) over a quiet UI in Geist and Geist Mono. Colour comes from the data: each category has a fixed colour across pills and charts. The interface itself uses neutrals plus one accent.
- **Themes.** Dark and paper-light themes built from one set of CSS variable tokens. Switching theme plays a circular reveal from the toggle.
- **Motion.** Page transitions follow the direction of travel through the sidebar. Toggles have sliding indicators. Shared-element morphs take an expense row into its edit sheet and a subscription card into its detail view. Numbers roll digit by digit, and charts tween between ranges. Everything falls back to simple fades when reduced motion is on.
- **Keyboard.** `Ctrl K` opens the command palette (pages, actions, expense search). `N` adds an expense from anywhere, `Ctrl B` collapses the sidebar to icons, `G` then a letter jumps to a section, and `?` lists every shortcut.

---

## Tech stack

### Frontend
| Package | Purpose |
|---|---|
| React 18 + Vite 5 | UI and build |
| Tailwind CSS 3 | Styling, mapped to CSS-variable design tokens |
| Framer Motion | Page, layout and shared-element animation |
| TanStack Query | Server state, caching, invalidation, optimistic deletes |
| Radix UI primitives | Accessible dialog, menu, popover, tooltip, checkbox, switch, slider |
| cmdk | Command palette |
| Recharts | Charts |
| React Router 7 | Routing with a persistent app shell |
| @fontsource | Self-hosted Instrument Serif, Geist and Geist Mono |
| Vitest + Testing Library, Playwright | Unit and end-to-end tests |

### Backend
| Package | Purpose |
|---|---|
| Flask 3 | Web framework |
| Flask-SQLAlchemy / SQLAlchemy 2 | ORM |
| Flask-JWT-Extended | JWT auth (7-day tokens by default) |
| Flask-Bcrypt | Password hashing |
| Flask-CORS | Cross-origin requests |
| psycopg 3 | PostgreSQL driver |
| gunicorn | Production server |
| pytest | Tests (run on in-memory SQLite) |

---

## Local setup

### Prerequisites

- **Node.js** 18 or later
- **Python 3.14** (psycopg3 ships a binary wheel for 3.14; don't use psycopg2)
- **PostgreSQL** with a database named `flowpilot`

```sql
CREATE DATABASE flowpilot;
```

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/flowpilot
FLASK_ENV=development
FLASK_APP=app.py
CORS_ORIGIN=http://localhost:5173
JWT_SECRET_KEY=replace-with-a-long-random-string
JWT_EXPIRES_DAYS=7
```

> The URL must use the `postgresql+psycopg://` dialect. If your password contains `@`, encode it as `%40`.

Start the API (tables are created on first run):

```powershell
python app.py
```

The API runs on **http://localhost:5000**.

**Demo data (optional).** `python seed_demo.py` creates (or resets) a local demo account, `demo@flowpilot.test` with password `Demo!pass1`, filled with four months of expenses, income, subscriptions, debts, budgets and goals.

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env   # VITE_API_URL=http://localhost:5000
npm run dev
```

The app runs on **http://localhost:5173**.

### Troubleshooting

**PowerShell execution policy error** when activating the venv:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Tests

| Command | What it covers |
|---|---|
| `cd backend && python -m pytest` | API validation, auth hardening, income, budgets, goals, attention, analytics, health score, predictions |
| `cd frontend && npm test` | Formatting, expense filter/sort/grouping, URL filter state, password policy, hotkey guard, preferences, renewal schedules |
| `cd frontend && npm run e2e` | Smoke test in a real browser: log in, `N` quick-add, search, delete with undo, theme and sidebar persistence, command palette. Needs both servers running and the demo seed. |

---

## Environment variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | psycopg3 connection string (`postgresql+psycopg://`). |
| `JWT_SECRET_KEY` | Yes, outside development | Secret for signing tokens. The app refuses to start without it unless `FLASK_ENV=development`. Use 32+ random characters. |
| `JWT_EXPIRES_DAYS` | No | Token lifetime in days. Defaults to 7. |
| `CORS_ORIGIN` | No | Comma-separated list of allowed frontend origins. Defaults to `http://localhost:5173`. |
| `FLASK_ENV` | No | `development` enables debug mode and the dev secret fallback. |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the Flask API. |

---

## Project structure

```
backend/
├── app.py                 # App setup, JWT/CORS config, JSON error handlers, blueprints
├── config.py              # JWT secret resolution
├── utils.py               # Input parsing, month helpers, money formatting, effective_income()
├── models.py              # User, Expense, Income, Debt, Subscription, Budget, SavingsGoal, GoalContribution
├── seed_demo.py           # Local demo account
├── routes/                # auth, expenses, income, budgets, goals, debts, subscriptions,
│                          # profile, insights, health_score, analytics, predictions, attention
└── tests/                 # pytest suite

frontend/src/
├── App.jsx                # Providers and routes (lazy-loaded pages inside one AppShell)
├── styles/tokens.css      # Colour tokens per theme and accent
├── lib/                   # format, categories, motion, preferences, hotkeys, sheets, undo, password
├── api/                   # Axios client (401 → logout) and TanStack Query hooks
├── components/
│   ├── shell/             # AppShell, Sidebar, Topbar, CommandPalette, ShortcutsDialog, ErrorBoundary
│   ├── ui/                # Button, inputs, Segmented, Panel, PageHeader, RollingNumber, overlays, progress
│   ├── charts/            # Shared chart theme and tooltip
│   └── brand/             # Logo, contour background, landing preview, auth layout
├── features/              # Dashboard widgets, expense rows and filters, goal tabs, sheets (forms)
└── pages/                 # One file per route
```

---

## API overview

All routes except `/api/health`, `/api/auth/register` and `/api/auth/login` need an `Authorization: Bearer <token>` header. Errors are always JSON: `{"error": "…"}`.

| Group | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Expenses | `GET/POST /api/expenses`, `PUT/DELETE /api/expenses/<id>`, `POST /api/expenses/bulk-delete`, `GET /api/expenses/summary` |
| Income | `GET/POST /api/income`, `PUT/DELETE /api/income/<id>`, `GET /api/income/summary` |
| Budgets | `GET /api/budgets`, `PUT/DELETE /api/budgets/<category>` |
| Goals | `GET/POST /api/goals`, `PUT/DELETE /api/goals/<id>`, `POST /api/goals/<id>/contributions`, `DELETE /api/goals/<id>/contributions/<cid>` |
| Debts | `GET/POST /api/debts`, `PUT/DELETE /api/debts/<id>`, `GET /api/debts/summary` |
| Subscriptions | `GET/POST /api/subscriptions`, `PUT/DELETE /api/subscriptions/<id>`, `GET /api/subscriptions/summary` |
| Profile | `GET/PUT /api/profile`, `PUT /api/profile/password` |
| Derived | `GET /api/insights`, `GET /api/health-score`, `GET /api/attention`, `GET /api/analytics?range=weekly\|monthly\|yearly`, `GET /api/predictions` |

---

## Deployment

- **Frontend.** Vercel (see `frontend/vercel.json` for SPA rewrites). Set `VITE_API_URL` to the API's URL.
- **Backend.** Run `gunicorn app:app`. Set `JWT_SECRET_KEY`, `DATABASE_URL`, and `CORS_ORIGIN` (comma-separate production and preview URLs).
- **Database.** New tables are created automatically on startup. Existing tables aren't altered.

---

## License

MIT © 2026 Vishnu Patruni
