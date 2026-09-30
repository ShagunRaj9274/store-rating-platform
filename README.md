# Ratebook — Store Rating Platform

![CI](https://github.com/ShagunRaj9274/store-rating-platform/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-92.7%25-brightgreen)
![Frontend](https://img.shields.io/website?url=https%3A%2F%2Fstore-rating-platform-xi-three.vercel.app\&label=frontend)
![API](https://img.shields.io/website?url=https%3A%2F%2Fstore-rating-api-l2br.onrender.com%2Fapi%2Fhealth\&label=api)

A full-stack web app where shoppers rate stores from 1 to 5, store owners see how their store is doing, and administrators manage everything. One login, three roles, each with its own experience.

**Live demo:** https://store-rating-platform-xi-three.vercel.app · **API:** https://store-rating-api-l2br.onrender.com

| Role                 | Email                    | Password    |
| -------------------- | ------------------------ | ----------- |
| System administrator | `admin@storerating.com`  | `Admin@123` |
| Store owner          | `owner1@storerating.com` | `Owner@123` |
| Normal user          | `user1@storerating.com`  | `User@1234` |

The login page has one-click buttons that fill in these accounts.

![Admin dashboard](docs/screenshots/admin-dashboard.png)

---

## Features

### System administrator

* Overview dashboard: total users, total stores, total ratings, accounts by role, and the highest rated stores
* Add users of any role (normal user, store owner, admin) and add stores, optionally assigning an owner
* Users table and stores table with filters (name, email, address, role), sorting on every key column, and pagination
* User detail page; for store owners it also shows their store's average rating

### Normal user

* Self-service sign-up and login
* Browse all stores, search by name and by address, sort by name, address, overall rating or your rating
* Submit a 1–5 star rating inline and change it any time (optimistic UI with rollback on failure)
* Change password

### Store owner

* Dashboard with the store's average rating, a 5-to-1 star distribution chart, and a sortable table of every customer who rated the store
* Change password

### Across the app

Form validation on both client and server with matching rules, live password requirement checklist, character counters, toasts, loading skeletons, empty states that say what to do next, keyboard-accessible star picker, and a responsive layout down to phone width.

<p>
  <img src="docs/screenshots/user-stores.png" width="49%" alt="Normal user store list" />
  <img src="docs/screenshots/owner-dashboard.png" width="49%" alt="Store owner dashboard" />
</p>

---

## Tech stack

| Layer      | Choice                                                                  | Why                                                       |
| ---------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Backend    | Express 4 (Node 18+, ES modules)                                        | Small, explicit, easy to review                           |
| Database   | PostgreSQL with raw parameterised SQL (`pg`)                            | Full control over joins, aggregates and constraints       |
| Validation | Zod                                                                     | One schema gives parsing, coercion and readable errors    |
| Auth       | JWT (Bearer) + bcrypt                                                   | Stateless, works across separate frontend/backend domains |
| Security   | Helmet, CORS allow-list, rate limiting on auth routes, 10 kB body limit | Sensible defaults for a public API                        |
| Frontend   | React 18 + Vite + React Router 6 + Axios                                | Fast dev server, simple deploy                            |
| Styling    | Hand-written CSS with design tokens                                     | No UI kit; small bundle                                   |
| Tests / CI | `node:test`, Vitest, GitHub Actions against a real PostgreSQL service   | Runs automatically on pushes and pull requests            |

---

## Architecture

The application is split into a React frontend, an Express REST API, and a PostgreSQL database.

```text
┌──────────────┐   HTTPS + JWT    ┌──────────────────────────────┐    SQL     ┌─────────────┐
│ React (Vite) │ ───────────────▶ │ Express API                 │ ─────────▶ │ PostgreSQL  │
│  on Vercel   │ ◀─────────────── │ routes → controllers →       │ ◀───────── │  on Neon    │
└──────────────┘   JSON envelope  │ services, Zod, pino logs    │            └─────────────┘
                                  └──────────────────────────────┘
```

### Project structure

```text
store-rating-platform/
├── backend/
│   ├── src/
│   │   ├── config/env.js            # env loading + validation
│   │   ├── db/
│   │   │   ├── schema.sql           # tables, constraints, indexes, triggers, view
│   │   │   ├── migrate.js           # idempotent migration runner
│   │   │   ├── seed.js              # demo data
│   │   │   └── pool.js               # pg pool + transaction helper
│   │   ├── middleware/               # auth, validation, errors
│   │   ├── modules/                  # feature modules
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── stores/
│   │   │   └── owner/
│   │   ├── utils/queryBuilder.js     # safe WHERE / ORDER BY / pagination
│   │   ├── validators/schemas.js     # Zod schemas
│   │   ├── app.js                    # Express app
│   │   └── server.js                 # HTTP server + graceful shutdown
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/                      # Axios client + API functions
│       ├── context/                  # AuthContext, ToastContext
│       ├── hooks/useListQuery.js     # filters + sorting + pagination
│       ├── components/               # reusable UI components
│       ├── pages/                    # auth, admin, user, owner
│       └── utils/validation.js       # frontend validation
├── docker-compose.yml                # local PostgreSQL
├── render.yaml                       # Render blueprint
└── .github/workflows/ci.yml          # GitHub Actions CI
```

Each backend feature is split into **routes** (HTTP wiring, validation, role guard), **controllers** (request/response handling), and **services** (SQL and business rules), so database logic does not leak into route files.

### Database schema

```mermaid
erDiagram
    users ||--o| stores : "owns (0..1)"
    users ||--o{ ratings : submits
    stores ||--o{ ratings : receives

    users {
        serial id PK
        varchar name "20-60 chars"
        varchar email "unique, case-insensitive"
        varchar password_hash
        varchar address "max 400"
        user_role role "ADMIN | USER | OWNER"
        timestamptz created_at
        timestamptz updated_at
    }

    stores {
        serial id PK
        varchar name "20-60 chars"
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
        smallint rating "1-5"
        timestamptz created_at
        timestamptz updated_at
    }
```

### Database design decisions

* **Integrity in the database, not only the app.** Length and range rules are `CHECK` constraints, roles are a PostgreSQL `ENUM`, and `UNIQUE (user_id, store_id)` guarantees one rating per user per store.
* **Case-insensitive unique emails** via a unique index on `LOWER(email)`.
* **Upsert for ratings** using `INSERT ... ON CONFLICT DO UPDATE`, so submitting or modifying a rating is one idempotent `PUT`.
* **One owner ↔ one store** is enforced by `UNIQUE (owner_id)`.
* `ON DELETE SET NULL` keeps a store if its owner is removed.
* `ON DELETE CASCADE` cleans up ratings when their user or store is deleted.
* **`store_rating_summary` view** computes average and count in one place.
* **`updated_at` triggers** keep timestamps correct without relying on application code.
* **Indexes** are used for foreign keys and frequently filtered/sorted columns.

---

## Authentication & Authorization

Authentication and authorization follow this flow:

```text
Login
  ↓
bcrypt password comparison
  ↓
JWT issued (1 day)
  ↓
authenticate middleware
  ↓
JWT signature/expiry verification
  ↓
User reloaded from PostgreSQL
  ↓
authorize(role) middleware
  ↓
Route handler
```

### Authentication decisions

* Passwords are hashed with **bcrypt** and password hashes are never returned in API responses.
* Login returns the same error message for an unknown email and an incorrect password to reduce account enumeration.
* JWTs are short-lived with a **1-day expiration**.
* The authentication middleware reloads the user from the database on every authenticated request.
* This means deleted users or role changes take effect immediately instead of waiting for a previously issued token to expire.
* The current deployment stores the JWT in `localStorage` because the frontend and backend are deployed separately on Vercel and Render.

### Authorization

Role-based access is enforced through middleware:

```text
ADMIN  → administrator routes
OWNER  → store-owner routes
USER   → normal-user routes
```

A valid JWT alone does not grant access to every endpoint. The user's current database role is checked before protected route handlers execute.

### Production improvement

For a production system, I would move authentication from `localStorage` to secure `httpOnly` cookies.

Refresh-token rotation and reuse detection are intentionally listed under **Future improvements** rather than implemented as a rushed version.

---

## Security notes

* Passwords are hashed with bcrypt.
* Password hashes are never selected into API responses.
* Login uses the same message for unknown email and wrong password.
* Every SQL value is parameterised.
* Sort columns come from server-side allow-lists, preventing SQL injection through `sortBy`.
* Dynamic filtering is also restricted to known columns.
* The authentication middleware reloads users from PostgreSQL on each request.
* Helmet adds common HTTP security headers.
* CORS is restricted through an allow-list.
* Authentication endpoints are rate-limited.
* Request bodies are limited to 10 kB.
* Validation is performed on both frontend and backend.

---

## API Documentation

Interactive API documentation is available through Swagger UI:

**Local:**

`http://localhost:5000/api/docs`

**Production:**

`https://store-rating-api-l2br.onrender.com/api/docs`

The OpenAPI specification is stored at:

`backend/docs/openapi.yaml`

The documentation covers the available endpoints, authentication requirements, request bodies, response formats, validation errors, and role requirements.

---

## API reference

All routes are prefixed with `/api`. Authenticated routes need:

```text
Authorization: Bearer <token>
```

| Method | Route                     | Role   | Purpose                                           |
| ------ | ------------------------- | ------ | ------------------------------------------------- |
| POST   | `/auth/register`          | public | Sign up as a normal user                          |
| POST   | `/auth/login`             | public | Log in (any role)                                 |
| GET    | `/auth/me`                | any    | Current user                                      |
| PATCH  | `/auth/password`          | any    | Change password                                   |
| GET    | `/admin/dashboard`        | admin  | Totals, users by role, top stores                 |
| GET    | `/admin/users`            | admin  | List users with filtering, sorting and pagination |
| POST   | `/admin/users`            | admin  | Create user with role                             |
| GET    | `/admin/users/:id`        | admin  | User details                                      |
| GET    | `/admin/owners/available` | admin  | Store owners without a store                      |
| GET    | `/admin/stores`           | admin  | List stores                                       |
| POST   | `/admin/stores`           | admin  | Create store                                      |
| GET    | `/stores`                 | user   | Browse stores and ratings                         |
| PUT    | `/stores/:id/rating`      | user   | Submit or change rating                           |
| GET    | `/owner/dashboard`        | owner  | Store summary and customer ratings                |
| GET    | `/health`                 | public | API and database health check                     |

Validation errors return:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

Duplicate emails return HTTP `409`.

---

## Testing

The project includes unit tests, integration tests, validation tests, authentication tests, authorization tests, rating tests, and query-builder tests.

### Test coverage

The latest backend coverage run produced:

```text
Tests:       43
Passed:      43
Failed:       0
Skipped:      0

Coverage:
Statements:  92.7%
Branches:    81.28%
Functions:   83.33%
Lines:       92.7%
```

The configured CI threshold requires at least **80% line coverage**.

### Test suites

**Authentication**

* Registration
* Duplicate email handling
* Role escalation prevention
* Invalid credentials
* JWT validation
* Password changes

**Search, sorting and pagination**

* Name filtering
* Sorting
* Pagination metadata
* Invalid sort-column protection
* Role filtering

**Ratings**

* Create rating
* Update rating
* Average recalculation
* Invalid rating rejection
* Missing-store handling
* Owner rating dashboard

**Role-based access**

* Admin access
* User access
* Owner access
* Role-change restrictions
* Owner/store assignment rules

**Validation and utilities**

* Password rules
* Name length
* Address length
* Email normalization
* Rating validation
* Safe SQL query building
* SQL wildcard escaping
* Pagination limits

### Run backend unit tests

```bash
cd backend
npm test
```

### Run all backend tests

```bash
cd backend
npm run test:all
```

### Run coverage

```bash
cd backend
npm run coverage
```

The coverage command enforces the 80% line-coverage threshold.

### Run frontend tests

```bash
cd frontend
npm test
```

### Run frontend linting

```bash
cd frontend
npm run lint
```

### Run backend linting

```bash
cd backend
npm run lint
```

### Run frontend production build

```bash
cd frontend
npm run build
```

---

## Continuous Integration

GitHub Actions runs the project checks automatically on pushes to `main` and on pull requests.

The CI pipeline checks:

### Backend

* Node.js setup
* `npm ci`
* ESLint
* Backend tests
* Coverage
* PostgreSQL service
* Database migration and seed
* API health endpoint

### Frontend

* Node.js setup
* `npm ci`
* ESLint
* Vitest tests
* Production build

The workflow is located at:

```text
.github/workflows/ci.yml
```

---

## Run it locally

### Prerequisites

* **Node.js 18 or newer**
* **PostgreSQL**, either through Docker Desktop or a normal installation
* **Git**

### 1. Get the code

```bash
git clone https://github.com/ShagunRaj9274/store-rating-platform.git
cd store-rating-platform
```

Install dependencies:

```bash
cd backend
npm ci

cd ../frontend
npm ci

cd ..
```

### 2. Start PostgreSQL

**Option A: Docker**

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5432` with:

```text
user: postgres
password: postgres
database: store_rating
```

**Option B: Local PostgreSQL**

Create the database:

```bash
psql -U postgres -c "CREATE DATABASE store_rating;"
```

### 3. Configure environment variables

Create:

```text
backend/.env
frontend/.env
```

using the corresponding `.env.example` files.

For a local PostgreSQL installation:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/store_rating
```

### 4. Create tables and demo data

```bash
cd backend
npm run db:setup
```

The migration and seed operations are designed to be safe to run more than once.

### 5. Start the backend

```bash
cd backend
npm run dev
```

API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Swagger UI:

```text
http://localhost:5000/api/docs
```

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Log in using one of the demo accounts shown at the top of this README.

---

## Troubleshooting

### `ECONNREFUSED 5432`

PostgreSQL is not running.

Start Docker:

```bash
docker compose up -d
```

### `password authentication failed`

Check that the password in `DATABASE_URL` matches the PostgreSQL user.

### `EADDRINUSE: address already in use :::5000`

Another process is already using port 5000.

On Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

Then stop the process using its actual PID:

```powershell
Stop-Process -Id <PID> -Force
```

### `Cannot reach the server`

Make sure the backend is running:

```bash
cd backend
npm run dev
```

### Frontend shows a blank page

Check the browser console and verify that the API URL in `frontend/.env` is correct.

The application also includes a React error boundary so unexpected rendering errors display a recovery screen instead of leaving the page completely blank.

---

## Deploy it

The application is deployed as three pieces:

```text
React/Vite → Vercel
Express API → Render
PostgreSQL → Neon
```

### 1. Database on Neon

Create a PostgreSQL project on Neon and copy the connection string.

It will look similar to:

```text
postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require
```

### 2. API on Render

Create a Render Web Service using the repository.

Settings:

| Setting        | Value                           |
| -------------- | ------------------------------- |
| Root Directory | `backend`                       |
| Runtime        | Node                            |
| Build Command  | `npm ci`                        |
| Start Command  | `npm run db:setup && npm start` |

Environment variables:

| Key                   | Value                   |
| --------------------- | ----------------------- |
| `NODE_ENV`            | `production`            |
| `DATABASE_URL`        | Neon connection string  |
| `DB_SSL`              | `true`                  |
| `JWT_SECRET`          | Long random secret      |
| `JWT_EXPIRES_IN`      | `1d`                    |
| `CLIENT_URL`          | Vercel frontend URL     |
| `SEED_ADMIN_EMAIL`    | `admin@storerating.com` |
| `SEED_ADMIN_PASSWORD` | `Admin@123`             |

After deployment:

```text
https://<your-service>.onrender.com/api/health
```

should report that the database is up.

### 3. Frontend on Vercel

Import the repository into Vercel.

Settings:

| Setting              | Value          |
| -------------------- | -------------- |
| Root Directory       | `frontend`     |
| Framework            | Vite           |
| Environment variable | `VITE_API_URL` |

Example:

```env
VITE_API_URL=https://store-rating-api-l2br.onrender.com/api
```

### 4. Connect frontend and backend

Set the Render environment variable:

```env
CLIENT_URL=https://store-rating-platform-xi-three.vercel.app
```

Redeploy the API if necessary.

---

## Future improvements

The current implementation intentionally keeps the authentication flow simple and suitable for the separate Vercel + Render deployment.

Potential next improvements include:

* **Refresh-token rotation with `httpOnly` cookies**

  * Add short-lived access tokens
  * Store refresh tokens in secure `httpOnly` cookies
  * Rotate refresh tokens after use
  * Detect refresh-token reuse
  * Handle cross-domain cookie configuration between frontend and backend

* **Audit log of admin actions**

  * Record important administrative operations
  * Store the acting user, action, target resource and timestamp
  * Provide an admin audit-history view

* **Editing stores and reassigning owners**

  * Allow administrators to update existing store information
  * Allow reassignment between eligible store owners
  * Preserve ownership constraints

* **End-to-end tests with Playwright**

  * Test complete login flows
  * Verify role-based navigation
  * Test rating submission
  * Test administrator workflows
  * Run against the deployed or CI environment

Refresh tokens are intentionally not implemented in the current version because a correct implementation requires secure cookie handling, rotation, reuse detection, and careful cross-domain configuration. A smaller, clearly documented JWT implementation is preferable to a rushed refresh-token implementation.

---

## Push to GitHub

If setting up the repository from scratch:

```bash
git init
git add .
git commit -m "feat: store rating platform with Express, PostgreSQL and React"
git branch -M main
git remote add origin https://github.com/ShagunRaj9274/store-rating-platform.git
git push -u origin main
```

Make sure `.env` files and `node_modules` are excluded through `.gitignore`.

For future README changes:

```bash
git add README.md
git commit -m "docs: architecture, auth flow, testing and roadmap"
git push
```

---

## Assumptions

* The name rule (20–60 characters) applies to store names as well as user names.
* Address is required for all forms and has a maximum length of 400 characters.
* A store owner owns at most one store.
* A store has at most one owner.
* Administrators can create stores without assigning an owner.
* The owner dropdown only lists store owners who do not currently have a store.
* Only normal users submit ratings.
* Administrators and store owners cannot submit ratings.
* Administrators can change their own password.
* Emails are stored in lowercase and compared case-insensitively.
* Ratings are whole numbers from 1 to 5.
* A user can have at most one rating for a particular store.
* The backend is responsible for enforcing authorization even when the frontend hides unavailable actions.
* The PostgreSQL database remains the source of truth for users, roles, stores and ratings.
