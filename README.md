# Mono Parser

A B2B API-first credit scoring and decisioning engine. Mono Parser helps loan officers and fintech companies make better-informed lending decisions by processing bank data through a rule-based scoring engine and returning clear, actionable results via webhooks.

Live: [mono-parser.shop](https://mono-parser.shop) · API Docs: [mono-parser.shop/docs](https://mono-parser.shop/docs)

---

## What It Does

Fintechs integrate with Mono Parser to automate their loan evaluation pipeline:

1. A fintech submits a loan application with applicant details
2. The applicant links their bank account via the Mono widget
3. Mono Parser fetches and analyzes bank data (transactions, income, balance, identity)
4. The **Brain** service scores the application using rule-based decisioning
5. A decision (approved/rejected + explanation) is delivered back to the fintech via webhook
6. Real-time progress updates are pushed via WebSocket

The goal is to give loan officers more data-backed reasons to say yes or no — faster, and with less guesswork.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                        │
│              Next.js Dashboard (port 3000)          │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                    Gateway                          │
│            NestJS REST API (port 5000)              │
│  Auth · Applicants · Applications · Queues · WS    │
└──────┬───────────────────────┬──────────────────────┘
       │                       │
┌──────▼──────┐     ┌──────────▼──────────┐
│    Brain    │     │   Mono Banking API  │
│  FastAPI    │     │   (external)        │
│  (port 8000)│     └─────────────────────┘
│  Rule-based │
│  Scoring    │
└─────────────┘
       │
┌──────▼───────────────────────┐
│  PostgreSQL + Redis           │
│  Data · Queues · Job State    │
└───────────────────────────────┘
```

### Services

| Service | Tech | Purpose |
|---------|------|---------|
| `gateway` | NestJS 11, TypeScript | REST API, auth, job queues, WebSockets |
| `brain` | FastAPI, Python | Rule-based credit scoring engine |
| `frontend` | Next.js | Dashboard for fintech companies |
| `db` | PostgreSQL 15 | Primary data store |
| `redis` | Redis 7 | BullMQ job queues |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v27+ recommended)
- [Node.js](https://nodejs.org/) v20+ (for local frontend development only)
- A [Mono](https://mono.co) developer account
- A [Brevo](https://brevo.com) account (email)
- A [Google Gemini](https://aistudio.google.com/) API key (loan decision explanations)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/vector-10/mono-parser.git
cd mono-parser
```

### 2. Configure environment variables

The gateway requires a `.env` file:

```bash
cp gateway/.env.example gateway/.env
```

**`gateway/.env` — required variables:**

```env
# App
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database (matches docker-compose defaults)
DATABASE_URL=postgresql://postgres:password@db:5432/mono_parser

# Auth
JWT_SECRET=your_jwt_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY_DAYS=7

# Redis (matches docker-compose defaults)
REDIS_URL=redis://redis:6379

# Mono Banking API
MONO_BASE_URL=https://api.withmono.com/v2
MONO_WEBHOOK_SECRET=your_mono_webhook_secret

# Brain service (internal — matches docker-compose)
BRAIN_URL=http://brain:8000

# App public URL (used for webhook callbacks)
APP_URL=http://localhost:5000

# Email — Brevo
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Mono Parser

# AI — Google Gemini
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start all services

```bash
docker compose up --build
```

Database migrations run automatically on gateway startup.

| Service | URL |
|---------|-----|
| Gateway API | http://localhost:5000 |
| Brain API | http://localhost:8000 |
| Prisma Studio | http://localhost:5555 |

### 4. Run the frontend (optional, separate)

The frontend is not included in `docker-compose.yaml` and runs independently:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000.

---

## Project Structure

```
mono-parser/
├── docker-compose.yaml
├── gateway/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT auth, guards, OTP
│   │   ├── users/            # Fintech user management
│   │   ├── applicants/       # Loan applicant records
│   │   ├── applications/     # Loan application lifecycle
│   │   ├── mono/             # Mono API integration
│   │   ├── webhooks/         # Inbound Mono webhooks
│   │   ├── queues/           # BullMQ job processors
│   │   ├── events/           # WebSocket gateway
│   │   ├── email/            # Email via Brevo
│   │   ├── gemini/           # AI decision explanations
│   │   └── prisma/           # Database client
│   └── prisma/
│       └── schema.prisma     # Database schema
├── brain/                    # FastAPI scoring engine
│   └── app/
│       ├── main.py           # FastAPI entrypoint
│       ├── engine.py         # Analysis orchestration
│       ├── scoring.py        # Scoring logic
│       ├── decision.py       # Approve/reject decisioning
│       ├── knockout.py       # Hard disqualification rules
│       ├── features.py       # Feature extraction
│       └── models.py         # Pydantic request/response models
└── frontend/                 # Next.js dashboard
```

---

## How the Scoring Engine Works

The `brain` service is a rule-based engine (not ML). When the gateway sends applicant bank data to `POST /analyze`, the engine:

1. **Extracts features** from raw bank data (income, spending patterns, account behavior)
2. **Applies knockout rules** — hard disqualifications (e.g. no verifiable income, consistently negative balance)
3. **Scores remaining applications** across weighted criteria
4. **Makes a decision** (approved/rejected) with reasoning

Results are returned to the gateway as JSON, which then delivers a webhook to the fintech's registered URL and emits a real-time WebSocket event to the dashboard.

---

## API Overview

Full documentation: [mono-parser.shop/docs](https://mono-parser.shop/docs)

**Authentication**
- `POST /api/auth/signup` — Register a fintech account
- `POST /api/auth/verify-otp` — Verify email OTP
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout

**Applicants** _(JWT required)_
- `POST /api/applicants` — Create an applicant
- `GET /api/applicants` — List applicants
- `GET /api/applicants/:id` — Get applicant
- `PATCH /api/applicants/:id` — Update applicant
- `DELETE /api/applicants/:id` — Delete applicant

**Applications** _(API key required)_
- `POST /api/applications/initiate` — Start a loan application (returns Mono widget URL)
- `GET /api/applications/:id` — Get application status and decision

**Webhooks (inbound from Mono)**
- `POST /api/webhooks/mono` — Receives bank account events from Mono

---

## Key Concepts

**API Key vs JWT**
- The dashboard uses **JWT** (cookie-based, 15-minute expiry with refresh)
- Programmatic integrations use an **API key** sent via the `x-api-key` header, generated automatically on signup

**Webhook-Driven Flow**
Loan processing is async. After an applicant links their bank account, Mono sends a webhook to the gateway. The gateway queues a job, fetches the data, runs it through the Brain, and delivers the result to the fintech's registered webhook URL.

**Job Queues (BullMQ)**
Five queues handle async work: `applications`, `emails`, `webhooks`, `enrichments`, `enrichment-cleanup`. All are backed by Redis with automatic retries and exponential backoff.

---

## Development Notes

- **Prisma Studio** is available at port `5555` for database inspection when running via Docker
- **Migrations** run automatically on gateway startup in production. In development, run them manually: `npx prisma migrate dev`
- The **Brain service** is internal — it accepts requests only from the gateway and is not publicly exposed
- Rate limiting is applied globally: 60 requests per minute per IP

---

## Status

Mono Parser is under active development. v1 uses rule-based scoring — ML-driven scoring is planned for a future version. Expect breaking changes between releases.

---

## License

This repository is currently public. License TBD.
