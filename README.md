# Patient Management System

Cloud-based hospital management system with 5 microservices (Spring Boot 21, Kafka, gRPC, PostgreSQL).

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│ Frontend │────→│ API Gateway  │────→│ patient-service  │──→ DB (Postgres)
│ (React)  │     │ (port 4004)  │     │ (port 4000)      │
└──────────┘     └──────────────┘     └──┬───────────────┘
                                         │ gRPC
                                         ↓
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│ Auth     │     │ Kafka        │     │ billing-service  │──→ DB
│ (4005)   │     │ (9092)       │     │ (4001 / gRPC 9001)│
└──────────┘     └──────┬───────┘     └──────────────────┘
                        │
                        ↓
                 ┌──────────────────┐
                 │ analytics-service│
                 │ (port 4002)      │
                 └──────────────────┘
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (for frontend)
- [Git](https://git-scm.com/)

## Quick Start

### 1. Clone & environment check

```bash
git clone <repo-url>
cd patient-managment
```

### 2. Create Docker network

All services communicate over `internal-net`:

```bash
docker network create internal-net
```

### 3. Start Kafka

Kafka runs in a separate compose file:

```bash
docker compose -f kafka-docker/docker-compose.yml up -d
```

Verify Kafka is ready:
```bash
docker logs kafka-docker-kafka-1 --tail 5
```

### 4. Build & start all services

```bash
docker compose up -d --build
```

This starts:
| Service | Port | Description |
|---------|------|-------------|
| **db** | 5000 | PostgreSQL (patient data) |
| **db_auth** | 5002 | PostgreSQL (auth data) |
| **billing-service** | 4001 / 9001 (gRPC) | Billing (hardcoded stub) |
| **patient-service** | 4000 (internal) | Patient CRUD REST API |
| **analytics-service** | 4002 | Kafka consumer (logs events) |
| **api-getway** | 4004 | API Gateway |
| **auth-service** | 4005 | JWT login |

Wait ~30 seconds for services to initialize, then verify:

```bash
docker compose ps
```

Expected: all services show `Up` or `Up (healthy)`.

### 5. Verify the APIs

```bash
# Login (get a JWT token)
curl -X POST http://localhost:4005/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pm.com","password":"admin"}'

# Create patient (via API Gateway)
curl -X POST http://localhost:4004/api/patients \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'

# Get all patients
curl http://localhost:4004/api/patients

# Swagger docs
# http://localhost:4000/swagger-ui.html  (patient-service)
# http://localhost:4005/swagger-ui.html  (auth-service)
```

### 6. Start frontend (optional)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Running Locally (without Docker)

For individual service development, you need local PostgreSQL and Kafka.

### Start databases

```bash
# Patient DB
docker run -d --name springboot-postgres \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_DB=patient_management \
  -p 5000:5432 postgres:latest

# Auth DB
docker run -d --name auth-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=patient_management \
  -p 5002:5432 postgres:latest
```

### Start Kafka locally

```bash
docker compose -f kafka-docker/docker-compose.yml up -d
```

### Run services

Each service requires a terminal:

```bash
# 1. billing-service (gRPC + HTTP)
cd billing-service && mvn spring-boot:run

# 2. patient-service (REST + gRPC client + Kafka producer)
cd patient-service && mvn spring-boot:run

# 3. analytics-service (Kafka consumer)
cd analytics-service && mvn spring-boot:run

# 4. auth-service (JWT login)
cd auth-service && mvn spring-boot:run

# 5. api-getway (routes /api/patients/**)
cd api-getway && mvn spring-boot:run
```

> For local runs, update `application.properties` DB URLs to `localhost:<port>` and Kafka to `localhost:9092` as needed.

## Service Details

### patient-service (port 4000)
- `GET /patients` — list all
- `GET /patients/{id}` — get by ID
- `POST /patients` — create (triggers gRPC billing + Kafka event)
- `PUT /patients/{id}` — update
- `DELETE /patients/{id}` — delete

### auth-service (port 4005)
- `POST /login` — authenticate, returns JWT
- Role enum: `ADMIN`, `PATIENT`, `DOCTOR`

### api-getway (port 4004)
Routes `/api/patients/**` → `patient-service:4000/patients`

### billing-service (port 4001, gRPC 9001)
- gRPC `CreateBillingAccount` (hardcoded response)

### analytics-service (port 4002)
- Kafka consumer on topic `patient` (logs events)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `network internal-net not found` | Run `docker network create internal-net` |
| Kafka connection refused | Wait 15s after starting Kafka, or check logs |
| DB connection refused | Services start before DB is ready — wait 30s and retry |
| Port conflict | Change `ports:` in `docker-compose.yml` |
| Frontend can't reach API | Update `vite.config.js` with proxy to `http://localhost:4004` |

## Project Structure

```
patient-managment/
├── patient-service/       # REST API, gRPC client, Kafka producer
├── billing-service/       # gRPC server only
├── analytics-service/     # Kafka consumer
├── auth-service/          # JWT authentication
├── api-getway/            # Spring Cloud Gateway
├── frontend/              # React + Vite
├── kafka-docker/          # Kafka docker-compose
└── docs/                  # Architecture diagrams
```
