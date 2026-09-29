# Ratebook — Store Rating Platform

A full-stack web app where shoppers rate stores from 1 to 5, store owners see how their store is doing, and administrators manage everything. One login, three roles, each with its own experience.

**Live demo:** _add your Vercel link here_ · **API:** _add your Render link here_

| Role | Email | Password |
|---|---|---|
| System administrator | `admin@storerating.com` | `Admin@123` |
| Store owner | `owner1@storerating.com` | `Owner@123` |
| Normal user | `user1@storerating.com` | `User@1234` |

The login page has one-click buttons that fill in these accounts.

![Admin dashboard](docs/screenshots/admin-dashboard.png)

---

## Features

**System administrator**
- Overview dashboard: total users, total stores, total ratings, accounts by role, and the highest rated stores
- Add users of any role (normal user, store owner, admin) and add stores, optionally assigning an owner
- Users table and stores table with filters (name, email, address, role), sorting on every key column, and pagination
- User detail page; for store owners it also shows their store's average rating

**Normal user**
- Self-service sign-up and login
- Browse all stores, search by name and by address, sort by name, address, overall rating or your rating
- Submit a 1–5 star rating inline and change it any time (optimistic UI with rollback on failure)
- Change password

**Store owner**
- Dashboard with the store's average rating, a 5-to-1 star distribution chart, and a sortable table of every customer who rated the store
- Change password

**Across the app:** form validation on both client and server with matching rules, live password requirement checklist, character counters, toasts, loading skeletons, empty states that say what to do next, keyboard-accessible star picker, and a responsive layout down to phone width.

<p>
  <img src="docs/screenshots/user-stores.png" width="49%" alt="Normal user store list" />
  <img src="docs/screenshots/owner-dashboard.png" width="49%" alt="Store owner dashboard" />
</p>

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Express 4 (Node 18+, ES modules) | Small, explicit, easy to review |
| Database | PostgreSQL with raw parameterised SQL (`pg`) | Full control over joins, aggregates and constraints |
| Validation | Zod | One schema gives parsing, coercion and readable errors |
| Auth | JWT (Bearer) + bcrypt | Stateless, works across separate frontend/backend domains |
| Security | Helmet, CORS allow-list, rate limiting on auth routes, 10 kB body limit | Sensible defaults for a public API |
| Frontend | React 18 + Vite + React Router 6 + Axios | Fast dev server, simple deploy |
| Styling | Hand-written CSS with design tokens | No UI kit; small bundle |
| Tests / CI | `node:test` unit tests, GitHub Actions against a real Postgres | Runs on every push |

---

## Architecture

```
store-rating-platform/
├── backend/
│   ├── src/
│   │   ├── config/env.js            # env loading + validation
│   │   ├── db/
│   │   │   ├── schema.sql           # tables, constraints, indexes, triggers, view
│   │   │   ├── migrate.js           # idempotent migration runner
│   │   │   ├── seed.js              # demo data (skips if already seeded)
│   │   │   └── pool.js              # pg pool + transaction helper
│   │   ├── middleware/              # auth (JWT + role guard), validation, errors
│   │   ├── modules/                 # feature modules: routes → controller → service
│   │   │   ├── auth/  admin/  stores/  owner/
│   │   ├── utils/queryBuilder.js    # safe dynamic WHERE / ORDER BY / pagination
│   │   ├── validators/schemas.js    # Zod schemas (single source of truth)
│   │   ├── app.js                   # express app
│   │   └── server.js                # http server + graceful shutdown
│   └── tests/                       # unit tests
├── frontend/
│   └── src/
│       ├── api/                     # axios client + typed service functions
│       ├── context/                 # AuthContext, ToastContext
│       ├── hooks/useListQuery.js    # filters + sorting + pagination state
│       ├── components/              # DataTable, StarRating, FormField, Modal…
│       ├── pages/                   # auth, admin, user, owner
│       └── utils/validation.js      # mirrors backend rules
├── docker-compose.yml               # local PostgreSQL
├── render.yaml                      # Render blueprint for the API
└── .github/workflows/ci.yml
```

Each backend feature is split into **routes** (HTTP wiring, validation, role guard), **controller** (request/response) and **service** (SQL and business rules), so the SQL never leaks into route files.

### Database schema

```mermaid
erDiagram
    users ||--o| stores : "owns (0..1)"
    users ||--o{ ratings : submits
    stores ||--o{ ratings : receives

    users {
        serial id PK
        varchar name "20-60 chars (CHECK)"
        varchar email "unique, case-insensitive"
        varchar password_hash
        varchar address "max 400"
        user_role role "ADMIN | USER | OWNER"
        timestamptz created_at
        timestamptz updated_at
    }
    stores {
        serial id PK
        varchar name "20-60 chars (CHECK)"
        varchar email "unique, case-insensitive"
        varchar address "max 400"
        int owner_id FK "UNIQUE, nullable"
        timestamptz created_at
        timestamptz updated_at
    }
    ratings {
        serial id PK
        int user_id FK
        int store_id FK
        smallint rating "1-5 (CHECK)"
        timestamptz created_at
        timestamptz updated_at
    }
```

Design decisions:
- **Integrity in the database, not only the app.** Length and range rules are `CHECK` constraints, roles are a Postgres `ENUM`, and `UNIQUE (user_id, store_id)` guarantees one rating per user per store.
- **Case-insensitive unique emails** via a unique index on `LOWER(email)`.
- **Upsert for ratings** (`INSERT … ON CONFLICT DO UPDATE`), so submitting and modifying a rating is one idempotent `PUT`.
- **One owner ↔ one store** enforced by `UNIQUE (owner_id)`; `ON DELETE SET NULL` keeps a store if its owner is removed, `ON DELETE CASCADE` cleans up ratings.
- **`store_rating_summary` view** computes average and count in one place, so every screen shows the same number.
- **`updated_at` triggers** keep timestamps correct without relying on application code.
- **Indexes** on foreign keys and on the columns used for filtering and sorting.

### Security notes
- Passwords hashed with bcrypt; password hashes are never selected into API responses.
- Login returns the same message for unknown email and wrong password (no account enumeration).
- Every SQL value is parameterised. Sort columns come from server-side whitelists, so a crafted `sortBy` can't inject SQL (covered by unit tests).
- The auth middleware reloads the user from the database on each request, so a deleted account or role change takes effect immediately.
- The JWT is kept in `localStorage` to keep cross-domain deployment (Vercel + Render) simple. For a production system I'd move it to an `httpOnly`, `SameSite` cookie on a shared parent domain.

---

## API reference

All routes are prefixed with `/api`. Authenticated routes need `Authorization: Bearer <token>`.

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Sign up as a normal user |
| POST | `/auth/login` | public | Log in (any role) |
| GET | `/auth/me` | any | Current user |
| PATCH | `/auth/password` | any | Change password (`currentPassword`, `newPassword`) |
| GET | `/admin/dashboard` | admin | Totals, users by role, top stores |
| GET | `/admin/users` | admin | List users. Query: `name, email, address, role, sortBy, order, page, limit` |
| POST | `/admin/users` | admin | Create user with `role` |
| GET | `/admin/users/:id` | admin | User details (+ store rating for owners) |
| GET | `/admin/owners/available` | admin | Store owners without a store |
| GET | `/admin/stores` | admin | List stores. Query: `name, email, address, sortBy, order, page, limit` |
| POST | `/admin/stores` | admin | Create store (`ownerId` optional) |
| GET | `/stores` | user | Stores with overall rating and your rating. Query: `name, address, search, sortBy, order, page, limit` |
| PUT | `/stores/:id/rating` | user | Submit or change your rating (`{ "rating": 1-5 }`) |
| GET | `/owner/dashboard` | owner | Store summary, star distribution, raters. Query: `sortBy, order` |
| GET | `/health` | public | Liveness + database check |

Validation errors return `400` with `{ message, errors: [{ field, message }] }`; duplicate emails return `409`.

---

## Run it locally

### Prerequisites
- **Node.js 18 or newer** (`node -v`)
- **PostgreSQL**, either through **Docker Desktop** (easiest) or a normal install
- **Git**

### 1. Get the code and install dependencies

```bash
git clone https://github.com/<your-username>/store-rating-platform.git
cd store-rating-platform
npm run install:all
```

### 2. Start PostgreSQL

**Option A: Docker (recommended)**
```bash
docker compose up -d
```
This starts Postgres 16 on port 5432 with user `postgres`, password `postgres`, database `store_rating`, matching the defaults in `.env.example`.

**Option B: PostgreSQL installed on your machine**
Install PostgreSQL (on Windows, use the installer from postgresql.org and remember the password you set for the `postgres` user). Then create the database:
```bash
psql -U postgres -c "CREATE DATABASE store_rating;"
```
You can also create it in pgAdmin: right-click Databases, Create, Database, name it `store_rating`.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
On Windows Command Prompt use `copy backend\.env.example backend\.env` (and the same for frontend).

If you used Option B, edit `DATABASE_URL` in `backend/.env` with your own password:
```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/store_rating
```

### 4. Create tables and demo data

```bash
npm run db:setup
```
Safe to run again; it won't duplicate anything.

### 5. Start both servers

```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health

Log in with a demo account from the table at the top.

### 6. Run the tests

```bash
npm test
```

**Troubleshooting**
- `ECONNREFUSED 5432`: Postgres isn't running. Start Docker Desktop and run `docker compose up -d`, or start the PostgreSQL service.
- `password authentication failed`: the password in `DATABASE_URL` doesn't match your Postgres user.
- `Cannot reach the server` in the browser: the API isn't running; check the terminal running `npm run dev`.
- Port 5432 already in use: another Postgres is running. Either use it (Option B) or stop it.

---

## Deploy it (free)

The app deploys as three pieces: **Neon** (PostgreSQL), **Render** (Express API) and **Vercel** (React). All have free tiers. Push the code to GitHub first (next section), because Render and Vercel deploy from your repository.

### 1. Database on Neon
1. Sign up at https://neon.tech and create a project (pick the region closest to you, e.g. Singapore for India).
2. On the dashboard, copy the **connection string**. It looks like `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`.

### 2. API on Render
1. Sign up at https://render.com with GitHub.
2. **New → Web Service**, choose your repository.
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci`
   - **Start Command:** `npm run db:setup && npm start`
   - **Instance type:** Free
4. **Environment variables:**

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your Neon connection string |
   | `DB_SSL` | `true` |
   | `JWT_SECRET` | a long random string (Render can generate one) |
   | `JWT_EXPIRES_IN` | `1d` |
   | `CLIENT_URL` | `http://localhost:5173` for now; you'll replace it in step 4 |
   | `SEED_ADMIN_EMAIL` | `admin@storerating.com` |
   | `SEED_ADMIN_PASSWORD` | `Admin@123` |

5. Click **Create Web Service**. When it's live, open `https://<your-service>.onrender.com/api/health` and check it says `"database":"up"`.

The start command runs the migration and seed on each boot; both are idempotent. Free Render services sleep after 15 minutes of inactivity, so the first request after a pause can take about a minute.

### 3. Frontend on Vercel
1. Sign up at https://vercel.com with GitHub.
2. **Add New → Project**, import the same repository.
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework preset:** Vite (auto-detected)
   - **Environment variable:** `VITE_API_URL` = `https://<your-service>.onrender.com/api`
4. Click **Deploy**. `frontend/vercel.json` already makes page refreshes on routes like `/admin/users` work.

### 4. Connect them
Back in Render, set `CLIENT_URL` to your Vercel URL (for example `https://store-rating-platform.vercel.app`, no trailing slash) and save. Render redeploys automatically. Open the Vercel URL and log in.

---

## Push to GitHub and submit

1. Create an empty repository at https://github.com/new named `store-rating-platform`. Make it **Public**, and don't add a README or .gitignore (the project has them).
2. From the project folder:

```bash
git init
git add .
git commit -m "feat: store rating platform with Express, PostgreSQL and React"
git branch -M main
git remote add origin https://github.com/<your-username>/store-rating-platform.git
git push -u origin main
```

3. Check that `.env` files and `node_modules` are **not** in the repository (they're in `.gitignore`).
4. The **Actions** tab will show the CI run; a green check means tests, migrations and the build all passed.
5. After deploying, edit the two links at the top of this README and push again:
```bash
git add README.md
git commit -m "docs: add live demo links"
git push
```
6. Share the repository link, e.g. `https://github.com/<your-username>/store-rating-platform`, together with the live demo link and the demo accounts.

---

## Assumptions

- The name rule (20–60 characters) applies to store names as well as user names, since the brief lists it under form validations generally.
- Address is required for all forms (max 400 characters).
- A store owner owns at most one store, and a store has at most one owner. Admins can create a store without an owner; the owner dropdown lists only store owners who don't have a store yet.
- Only normal users submit ratings; admins and owners can't rate.
- Admins can change their own password too.
- Emails are stored in lowercase and compared case-insensitively.
