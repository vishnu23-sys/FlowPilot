# FlowPilot redesign — design spec

Date: 2026-10-14 · Branch: `redesign`

## Goal

Replace the dark-glassmorphism UI with a distinctive, product-grade design language, add a real
motion system, harden the app, and ship three new features (income tracking, category budgets,
savings goals). Delivered as three sub-projects in order.

## Visual language ("Instrument + Ledger")

- Structure from "Instrument" (Linear/Vercel-like): neutral near-black dark mode, 1px hairlines,
  dense layouts, mono numerals. Character from "Ledger": Instrument Serif page titles and hero
  figures, paper-and-ink light mode, mono uppercase micro-labels.
- Widgets from user references (Expensio, SubTrackr): profile block in sidebar, quick-action tiles,
  "needs attention" list, smooth spend curve with pinned callout + W/M/Y toggle, subscriptions donut,
  renewal calendar, upcoming reminders with monograms, tagged recent-transactions.
- Colour lives in data (fixed per-category palette); UI chrome is neutrals + one accent.
- Accent: lime by default; user-selectable lime / vermilion / teal.
- Background: dot grid fading out down the page inside the app; contour lines on landing/auth.

### Tokens

CSS custom properties on `:root`, switched by `html[data-theme]` and `html[data-accent]`; Tailwind maps
to them (`rgb(var(--x) / <alpha-value>)`). No raw hex in components.

| Token | Dark | Light |
|---|---|---|
| canvas | `#0B0B0C` | `#F3EFE6` |
| panel | `#121214` | `#FBF9F4` |
| line | `#232327` | `#DDD6C6` |
| text / muted | `#EDEDEF` / `#7A7A83` | `#1B1A17` / `#807A6C` |
| lime | `#C5F23A` | `#4F7A00` |
| vermilion | `#FF6A4D` | `#C8442A` |
| teal | `#3DD6B5` | `#0F7A65` |

Fonts (self-hosted via @fontsource): Instrument Serif (titles/hero numbers), Geist (UI), Geist Mono
(amounts, dates, labels; tabular figures). Radius 10px panels / 7px controls. Shadows only on
popovers/dialogs. Theme defaults to OS, persisted; applied pre-mount (no flash).

## App shell

- One `<AppShell>` layout route with `<Outlet>`; pages are `React.lazy` with layout-matched fallbacks.
- Sidebar: expanded 232px ↔ rail 56px (`Ctrl+B`), persisted; tooltips in rail; sliding active
  indicator; profile block + menu at bottom; rail by default <1024px; drawer on mobile.
- Topbar 52px: breadcrumb, `Ctrl K` search trigger, theme toggle, attention bell, `+ Expense`.
- Command palette (`cmdk`): navigate, actions, search expenses.
- Quick-add sheet (`N`): right sheet (bottom sheet on mobile), category pill grid, "add another".
- Shortcuts: `Ctrl K`, `N`, `Ctrl B`, `G`+`D/E/I/B/S/A/G`, `?`, `Esc`; ignored while typing.

## Motion system

`lib/motion.js` holds durations (120/220/380ms), springs (snappy, soft), one easing.

1. Pages: content-only, direction-aware by sidebar order, short stagger, first-visit only.
2. Tabs/toggles: one `<Segmented>` with spring indicator (`layoutId`) + directional crossfade.
3. Shared-element: expense row → edit sheet (pill + amount morph), subscription card → detail,
   list add/remove/reorder via `layout` + `AnimatePresence`, delete with Undo toast.
4. Data: digit-rolling numbers, charts kept mounted so they tween, springy progress/gauge.

Theme switch uses a View Transitions circular reveal (crossfade fallback). `prefers-reduced-motion`
or the in-app "Reduce motion" preference collapses everything to opacity fades/instant.

## Pages

Shared anatomy: micro-label → serif title → actions; loading skeleton, error panel with Retry,
inviting empty state.

- Dashboard: hero strip (Spent ±% vs last month, Left to spend, Health), quick actions, spend curve
  this vs last month, needs attention, recent, category breakdown bar, budgets, health card, insights.
- Expenses: search, category multi-select, date presets, sort; URL-synced filter chips; summary line;
  day-grouped rows with subtotals; bulk select/delete with Undo; row→sheet morph; cards on mobile;
  incremental rendering (50 at a time).
- Income (new): hero, source breakdown, list grouped by month, income-vs-spending chart.
- Budgets (new): per-category monthly limits with progress, over/near states, inline editing.
- Debts: Segmented owed/owe, net balance, grouped by person, settle with strike animation, settled
  section collapsed.
- Subscriptions: cost hero, active donut, renewal calendar (click day to filter), upcoming list with
  monograms, card → detail morph.
- Analytics: W/M/Y with morphing charts, trend area, stacked category bars, income vs spending,
  period comparison card, correct currency symbols.
- Goals: tabs "Goals" (named goals, contributions, progress rings, monthly-needed) and "Simulator"
  (existing predictions, live-updating, debounced).
- Settings: Profile / Preferences (theme, accent with preview, sidebar default, reduce motion,
  shortcuts) / Security (password + strength meter).
- Landing: contour background, serif headline, live animated product preview built from real
  components. Login/Signup: split screen with contour panel; inline validation.

## Backend

Sub-project 1:
- JWT access tokens expire after 7 days; `JWT_SECRET_KEY` required unless `FLASK_ENV=development`.
- `CORS_ORIGIN` accepts a comma-separated list.
- Malformed input → 400 with a readable message (central `ValueError` handling).
- `/api/expenses/summary` adds `previous_month_total`, `daily` (current month) and `previous_daily`.

Sub-project 2 (new tables via `create_all`; no existing table altered):
- `Income(id, user_id, amount, source, date, description, is_recurring)`; CRUD `/api/income`,
  `/api/income/summary`.
- `Budget(id, user_id, category, monthly_limit)`, unique (user, category); `GET /api/budgets`
  (with spent/pct), `PUT /api/budgets/<category>`, `DELETE /api/budgets/<category>`.
- `SavingsGoal(id, user_id, name, target_amount, target_date, color, created_at)` and
  `GoalContribution(id, goal_id, amount, date, note)`; CRUD `/api/goals`, contributions sub-routes;
  responses include saved, pct, monthly_needed.
- `effective_income(user, year, month)`: sum of Income entries for that month, else
  `user.monthly_income`. Used by health score, insights, analytics, predictions, dashboard.
- `GET /api/attention`: renewals ≤7 days, unsettled debts, over/near budgets, income not set.
- Insights gain budget-based observations.

## Frontend architecture

- TanStack Query for all server state (cache, invalidation after mutations, retries, optimistic
  delete + undo).
- Axios 401 interceptor → clear session, redirect to `/login` with "session expired"; token validated
  via `/api/auth/me` on load; return-to after login.
- Radix primitives (Dialog, DropdownMenu, Tooltip, Popover, Checkbox, Switch) styled with tokens.
- Route-level error boundary inside the shell.
- One chart theme module; one category source (colour, pill style, icon).
- Delete dead `Layout.jsx`, glass/gradient utilities.

## Testing

- Vitest + Testing Library: formatting, expense filter/sort/group, theme persistence, reduced motion,
  shortcut guard.
- pytest: summary fields, 400s on bad input, secret requirement, income/budgets/goals/attention,
  effective income.
- Playwright smoke: login → dashboard → `N` quick-add → visible in Expenses → theme toggle →
  sidebar collapse persists.

## Out of scope

CSV import/export, login rate limiting, Alembic migrations.
