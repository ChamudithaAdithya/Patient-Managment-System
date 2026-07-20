# Patient Management System

Cloud-based hospital management system with 7 microservices (Spring Boot 21, Kafka, gRPC, PostgreSQL), React frontend, and AWS deployment.

## Architecture

```
Browser ──→ S3 Static Hosting ──→ ALB ──→ EC2 (Docker)
                                              │
                                   ┌──────────┴──────────┐
                                   │   API Gateway :4004  │
                                   └──────┬──────┬───────┘
                          ┌───────────────┤      ├────────────────┐
                          ↓               ↓      ↓                ↓
                   ┌──────────┐  ┌────────────┐ ┌──────────┐  ┌───────────┐
                   │ Patient  │  │ Appointment│ │  Auth    │  │  Imaging  │
                   │  :4000   │  │   :4006    │ │  :4005   │  │   :4007   │
                   └──┬───┬───┘  └──────┬─────┘ └────┬─────┘  └─────┬─────┘
                      │   │             │            │              │
                      │   │ gRPC        │ Kafka      │              │
                      ↓   ↓             ↓            │              │
               ┌──────────┐  ┌──────────────┐        │              │
               │ Billing  │  │  Analytics   │        │              │
               │   :4001  │  │   :4002      │        │              │
               └──────────┘  └──────────────┘        │              │
                                                      ↓              ↓
                                             ┌─────────────────────────┐
                                             │   RDS PostgreSQL        │
                                             │   pm-postgres:5432      │
                                             └─────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Ant Design 6, TypeScript, Recharts |
| Backend | Spring Boot 3.5.x, Java 21, Maven |
| Gateway | Spring Cloud Gateway |
| Database | PostgreSQL 16 (AWS RDS db.t3.micro) |
| Messaging | Apache Kafka 7.4.0, Zookeeper |
| gRPC | Billing service (mock) |
| Auth | JWT (HS256), 5 roles |
| CI/CD | GitHub Actions (5 jobs) |
| Cloud | AWS (EC2, RDS, S3, ALB, CloudFront) |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Java 21+](https://adoptium.net/) (for local dev)
- [AWS CLI](https://aws.amazon.com/cli/) (for deployment)

## Quick Start (Local)

### 1. Clone & setup

```bash
git clone <repo-url>
cd patient-managment
docker network create internal-net
```

### 2. Start all services

```bash
docker compose up -d --build
```

Wait ~60 seconds for initialization.

### 3. Verify

```bash
docker compose ps
```

All 10 containers should show `Up`:

| Container | Port | Purpose |
|-----------|------|---------|
| auth-service | 4005 | JWT authentication |
| patient-service | 4000 (internal) | Patient CRUD |
| appointment-service | 4006 | Appointments, doctors, consultations |
| imaging-service | 4007 | Medical image upload |
| billing-service | 4001 / 9001 (gRPC) | Billing (mock) |
| analytics-service | 4002 | Kafka consumer |
| api-getway | 4004 | API Gateway |
| frontend | 5173 | React SPA |
| patient-kafka | 9092 | Event bus |
| patient-zookeeper | 2181 | Kafka coordination |

### 4. Login & test

```bash
# Login via gateway
curl -X POST http://localhost:4004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chamuditha@hospital.com","password":"Admin@123"}'

# Create patient
curl -X POST http://localhost:4004/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"John Doe","email":"john@test.com","address":"123 Main St","dateOfBirth":"1990-01-01","registeredDate":"2026-01-01"}'

# Get all doctors
curl http://localhost:4004/api/doctors

# Swagger
# http://localhost:4004/api-docs/patients   (patient-service)
# http://localhost:4005/swagger-ui.html      (auth-service)
```

### 5. Frontend (local dev)

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. Proxies `/api` → `http://127.0.0.1:8083` (gateway).

## API Gateway Routes

| Path | Target Service | Method |
|------|---------------|--------|
| `/api/auth/**` | auth-service:4005 (strip 2) | Login, register, admin CRUD |
| `/api/patients/**` | patient-service:4000 | Patient CRUD |
| `/api/doctors/**` | appointment-service:4006 | Doctor CRUD |
| `/api/appointments/**` | appointment-service:4006 | Appointment CRUD |
| `/api/consultations/**` | appointment-service:4006 | Consultation management |
| `/api/images/**` | imaging-service:4007 | Medical image upload/view |

## Roles & Access

| Role | Permissions |
|------|------------|
| SUPER_ADMIN | Full access, admin management |
| ADMIN | Patient/doctor/appointment/staff management |
| DOCTOR | Appointment scheduling, consultations | 
| STAFF | Patient registration, appointment booking |
| PATIENT | Own appointments, medical records |

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| chamuditha@hospital.com | Admin@123 | SUPER_ADMIN |
| sanduni@hospital.com | Admin@123 | ADMIN |
| kasuni@hospital.com | Staff@123 | STAFF |

## AWS Deployment

Infrastructure in `ap-southeast-1` (Singapore):

| Resource | Name | Purpose |
|----------|------|---------|
| EC2 | `pm-system` (c7i-flex.large) | Docker host for all backend services |
| RDS | `pm-postgres` (db.t3.micro) | Single PostgreSQL database |
| S3 | `hospital-frontend-dev-2026` | Static React hosting |
| ALB | `pm-alb-2089108845` | Load balancer for API traffic |

### Deploy

Push to `main` branch triggers GitHub Actions pipeline:

1. **build-backend** — 7 parallel Maven builds
2. **docker-build** — 8 parallel Docker builds & push to Docker Hub
3. **build-frontend** — npm build with production API URL
4. **deploy-frontend** — Sync to S3, invalidate CloudFront
5. **deploy-backend** — SSH into EC2, `docker compose pull && up`

### Frontend URL

`http://hospital-frontend-dev-2026.s3-website-ap-southeast-1.amazonaws.com`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `network internal-net not found` | `docker network create internal-net` |
| Kafka connection refused | Wait 15s after starting Kafka |
| DB connection refused | Wait 30s for PostgreSQL init |
| Empty appointments/patients on dashboard | Logged in as SUPER_ADMIN? Old bug — now fixed |
| CORS errors | Check API Gateway allows wildcard origin |
| Port conflict | Change `ports:` in `docker-compose.yml` |

## Project Structure

```
patient-managment/
├── auth-service/              # JWT auth (login, register, admin/staff CRUD)
├── patient-service/           # Patient CRUD, gRPC client, Kafka producer
├── appoinment-service-main/   # Appointments, doctors, consultations
├── imaging-service/           # Medical image upload/store
├── billing-service/           # gRPC mock server
├── analytics-service/         # Kafka consumer (logs events)
├── api-getway/                # Spring Cloud Gateway (port 4004)
├── frontend/                  # React 19 + Vite + Ant Design 6
│   └── src/
│       ├── api/               # API client modules
│       ├── pages/             # Route pages (Dashboard, Analytics, etc.)
│       ├── components/        # Layout, shared components
│       ├── context/           # AuthContext, role-based guards
│       └── types/             # TypeScript interfaces
├── docs/                      # SRS, architecture diagrams, task lists
├── .github/workflows/         # CI/CD pipeline
├── docker-compose.yml         # All service definitions
└── Postman_Collection.json    # 43 API requests with auto-auth
```
