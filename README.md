# Sycamore Backend Assessment

A Node.js/TypeScript backend service implementing an **Idempotent Wallet Transfer System** and a **Daily Interest Accumulator**, built with Express, Sequelize, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express
- **ORM:** Sequelize (v6)
- **Database:** PostgreSQL 16 (Docker)
- **Testing:** Jest + ts-jest
- **Math Precision:** Decimal.js (no floating-point errors)
- **Auth:** JWT (Bearer tokens) + bcrypt

## Project Structure

```
src/
├── config/              # Environment and Sequelize CLI config
├── database/
│   ├── models/          # Sequelize model definitions
│   ├── migrations/      # Database migration files
│   └── seeders/         # Seed files
├── interfaces/          # TypeScript interfaces
├── middlewares/          # Auth middleware and JWT service
├── modules/
│   ├── auth/            # Signup/Signin (routes, controller, service, repo, validator)
│   ├── user/            # User profile
│   ├── wallet/          # Wallet balance and funding
│   ├── transfer/        # Idempotent wallet transfer
│   └── interest/        # Loan interest accumulation
├── routes/              # Central router
├── types/               # Express type augmentations
├── utils/               # Logger, error handler, custom error
└── server.ts            # App entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Docker Desktop
- npm

### 1. Clone and Install

```bash
git clone <repo-url>
cd backend-assessment
npm install
```

### 2. Environment Configuration

Create a `.env.development` file (or copy from the example):

```bash
cp .env.example .env.development
```

Default values (matching Docker config):

```env
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

DB_PORT=5432
DB_USERNAME=sycamore_user
DB_PASSWORD=sycamore_pass
DB_NAME=sycamore_db
DB_HOST=localhost
DB_DIALECT=postgres

JWT_ACCESS_TOKEN_SECRET=sycamore_jwt_access_secret_key_2026
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container (`sycamore_db`) on port 5432 with persistent storage.

### 4. Run Migrations

```bash
npm run migration
```

This creates the following tables:
- `users` — User accounts
- `wallets` — One wallet per user with DECIMAL balance
- `transaction_logs` — Transfer records with idempotency keys and status tracking
- `ledgers` — Double-entry bookkeeping (DEBIT/CREDIT per transfer)
- `loans` — Loan records with principal and interest tracking
- `interest_accruals` — Daily interest accrual log

### 5. Start the Server

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`.

### 6. Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npx jest --coverage

# Watch mode
npm run test:watch
```

## API Endpoints

### Authentication

| Method | Endpoint          | Description        | Auth |
|--------|-------------------|--------------------|------|
| POST   | `/api/auth/signup` | Register new user  | No   |
| POST   | `/api/auth/signin` | Login, get JWT     | No   |

### User

| Method | Endpoint           | Description       | Auth |
|--------|--------------------|-------------------|------|
| GET    | `/api/user/profile` | Get user profile  | Yes  |

### Wallet

| Method | Endpoint             | Description                 | Auth |
|--------|----------------------|-----------------------------|------|
| GET    | `/api/wallet/balance` | Get wallet balance          | Yes  |
| POST   | `/api/wallet/fund`    | Add funds to wallet         | Yes  |

### Transfer (Task A: Idempotent Wallet)

| Method | Endpoint        | Description              | Auth |
|--------|-----------------|--------------------------|------|
| POST   | `/api/transfer`  | Transfer between wallets | Yes  |

**Request body:**
```json
{
  "idempotency_key": "unique-client-generated-key",
  "receiver_id": "uuid-of-receiver",
  "amount": 1000.50
}
```

### Loans & Interest (Task B: Interest Accumulator)

| Method | Endpoint                   | Description                          | Auth |
|--------|----------------------------|--------------------------------------|------|
| POST   | `/api/loans`                | Create a new loan                    | Yes  |
| GET    | `/api/loans/:id`            | Get loan details                     | Yes  |
| POST   | `/api/loans/:id/accrue`     | Accrue daily interest up to a date   | Yes  |
| GET    | `/api/loans/:id/accruals`   | List all daily accrual records       | Yes  |

**Create loan:**
```json
{
  "principal": 100000,
  "annual_rate": 27.5,
  "start_date": "2025-01-01"
}
```

**Accrue interest:**
```json
{
  "end_date": "2025-01-31"
}
```

## Architectural Decisions

### Task A: Idempotent Wallet Transfer

1. **Idempotency Key** — A unique client-generated key stored in `transaction_logs`. Duplicate requests with the same key return the existing result instead of processing twice. Enforced via a UNIQUE database constraint.

2. **Race Condition Prevention** — Uses `SELECT ... FOR UPDATE` (row-level locking) inside Sequelize managed transactions. Wallets are locked in deterministic order (sorted by user_id) to prevent deadlocks when concurrent transfers involve the same wallets.

3. **TransactionLog PENDING-first Pattern** — A `TransactionLog` entry with `PENDING` status is created *before* the main database transaction begins. This ensures that even if the DB connection drops mid-transaction, there's an audit trail. The status is updated to `COMPLETED` or `FAILED` after the transaction.

4. **Double-Entry Ledger** — Every transfer creates two ledger entries: a `DEBIT` on the sender's wallet and a `CREDIT` on the receiver's. Each entry records `balance_before` and `balance_after` for full auditability.

5. **DECIMAL(20,4)** — All monetary values use PostgreSQL DECIMAL type with 4 decimal places, avoiding floating-point representation issues at the database level.

### Task B: Interest Accumulator

1. **Decimal.js for Math Precision** — All interest calculations use the `decimal.js` library with 30-digit precision, completely eliminating IEEE 754 floating-point errors. This is critical for financial calculations where even tiny rounding errors compound over time.

2. **Daily Interest Formula:**
   ```
   daily_rate = annual_rate / days_in_year
   daily_interest = principal × (annual_rate / 100) / days_in_year
   ```

3. **Leap Year Handling** — The `days_in_year` function correctly returns 366 for leap years and 365 otherwise, using the standard rule: divisible by 4, NOT by 100, UNLESS by 400.

4. **Per-Day Accrual Records** — Each day's interest calculation is stored individually in `interest_accruals`, creating a complete audit trail. A unique index on `(loan_id, date)` prevents duplicate calculations.

5. **Atomic Batch Processing** — When accruing interest over a date range, all daily calculations and the loan balance update happen inside a single database transaction. Either all days are processed or none are.

## Testing

**81 tests across 12 suites** covering:

- **Interest math precision** — Verifies zero floating-point drift over 365/366 days, correct leap year rates, year boundary transitions, and proves Decimal.js avoids IEEE 754 errors
- **Transfer idempotency** — Duplicate keys return same result (COMPLETED), reject in-progress (PENDING), and reject failed keys
- **Transfer race conditions** — Row locking prevents double-spending, insufficient funds correctly rejected
- **Edge cases** — Self-transfer prevention, zero principal interest, exact balance transfers, Feb 29 leap year calculations
- **Controller layer** — Request handling, status codes, error delegation via `next()`
- **Auth & middleware** — JWT generation/verification, auth bypass rules, protected routes

```
Test Suites: 12 passed, 12 total
Tests:       81 passed, 81 total
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot-reload (nodemon) |
| `npm start` | Build and start production |
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style |
| `npm run migration` | Run database migrations |
| `npm run migration:generate -- <name>` | Generate new migration |
