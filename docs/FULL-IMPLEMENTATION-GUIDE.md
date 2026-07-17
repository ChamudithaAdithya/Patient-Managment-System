# Full Implementation Guide — Cloud-Based Hospital Management System

Step-by-step guide covering how every AWS resource, microservice, security layer, CI/CD pipeline, and deployment was built from scratch.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [AWS Infrastructure](#2-aws-infrastructure)
3. [EC2 & Docker Deployment](#3-ec2--docker-deployment)
4. [Backend Microservices](#4-backend-microservices)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [API Gateway](#6-api-gateway)
7. [CI/CD Pipeline (GitHub Actions)](#7-cicd-pipeline-github-actions)
8. [Frontend Build & Deployment](#8-frontend-build--deployment)
9. [Monitoring & Load Testing](#9-monitoring--load-testing)
10. [Summary of Everything Created](#10-summary-of-everything-created)

---

## 1. Prerequisites

| Requirement | Version / Details |
|---|---|
| AWS Account | Free Tier (ap-southeast-1) |
| GitHub Repository | `Patient-Managment-System` |
| Docker Hub Account | `chamudithaadithya/patient_management_system` |
| Node.js | 20.x |
| Java | 21 (Temurin) |
| Maven | Bundled with Spring Boot |
| Domain (optional) | For HTTPS via ACM |

---

## 2. AWS Infrastructure

### 2.1 VPC + Subnets + IGW + NAT (Anjali)

Opened AWS Console -> VPC -> Your VPCs -> Create VPC:

| Field | Value |
|-------|-------|
| Resources | VPC and more |
| Name tag | `pm-vpc` |
| IPv4 CIDR | `10.0.0.0/16` |
| Number of AZs | 2 |
| Public subnets | 2 (`10.0.1.0/24`, `10.0.2.0/24`) |
| Private subnets | 2 (`10.0.3.0/24`, `10.0.4.0/24`) |
| NAT Gateway | In 1 AZ |

This auto-created the VPC, Internet Gateway, NAT Gateway, subnets, and route tables.

### 2.2 Route Tables (Chamuditha)

Created 2 route tables:
- **Public**: `0.0.0.0/0` -> Internet Gateway (associated with public subnets)
- **Private**: `0.0.0.0/0` -> NAT Gateway (associated with private subnets)

### 2.3 Security Groups (Chamuditha)

Created `pm-system-sg` via `scripts/aws-setup.sh`:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | 0.0.0.0/0 |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Backend APIs | TCP | 4000-4010 | sg-self (same group) |

### 2.4 EC2 Instance (Chamuditha)

Launched via `scripts/aws-setup.sh`:

| Field | Value |
|-------|-------|
| Name | `pm-system` |
| AMI | Amazon Linux 2023 |
| Type | `t3.medium` |
| Storage | 30GB gp3 |
| Key Pair | `pm-system-key` |
| SG | `pm-system-sg` |
| User-data | `scripts/ec2-userdata.sh` |

**User-data script** (`scripts/ec2-userdata.sh`):
```bash
#!/bin/bash
# Installs Docker, docker-compose-plugin, git
# Clones repository
# Creates .env file with RDS connection strings
```

### 2.5 RDS PostgreSQL (Nishan)

Created via AWS Console -> RDS:

| Field | Value |
|-------|-------|
| Identifier | `pm-postgres` |
| Engine | PostgreSQL |
| Class | `db.t3.micro` (Free tier) |
| Storage | 20GB |
| Master user | `pm_admin` |
| Password | `PMSystem2026!` |
| Public access | Yes |

Then connected and created the database:
```sql
CREATE DATABASE patient_management;
```

### 2.6 S3 Bucket for Frontend (Nishan)

Created via AWS Console -> S3:

| Field | Value |
|-------|-------|
| Name | `hospital-frontend-dev-2026` |
| Region | ap-southeast-1 |
| Static hosting | Enabled (index.html, error document = index.html) |
| Public access | Blocked (served via CloudFront) |

---

## 3. EC2 & Docker Deployment

### 3.1 SSH into EC2

```bash
ssh -i pm-system-key.pem ubuntu@47.130.152.226
```

### 3.2 Docker Compose Configuration

File: `docker-compose.yml` at project root.

**Network**: `internal-net` (external bridge network)

**9 containers:**

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| zookeeper | `cp-zookeeper:7.4.0` | 2181 | Kafka coordination |
| patient-kafka | `cp-kafka:7.4.0` | 9092 | Event bus |
| billing-service | `patient_management_system:billing` | 4001, 9001 | Billing gRPC service |
| patient-service | `patient_management_system:patient` | 4000 (int) | Patient CRUD |
| analytics-service | `patient_management_system:analytics` | 4002 | Kafka consumer |
| api-getway | `patient_management_system:api_getway` | 4004 | API Gateway |
| auth-service | `patient_management_system:auth_service` | 4005 | Auth + JWT |
| appointment-service | `patient_management_system:appointment` | 4006 | Appointments |
| imaging-service | `patient_management_system:imaging` | 4007 | Medical images |

**Volume**: `medical-images` -> `/app/images` (imaging-service)

### 3.3 Steps to Deploy on EC2

```bash
# 1. Create the external network
docker network create internal-net

# 2. Clone the repo (if not already)
git clone https://github.com/ChamudithaAdithya/Patient-Managment-System.git
cd Patient-Managment-System

# 3. Pull latest images
docker compose pull

# 4. Start all services
docker compose up -d

# 5. Verify
docker ps
```

### 3.4 Building & Pushing Docker Images

Each service has a `Dockerfile` (multi-stage: Maven build -> JRE runtime).

```bash
# Build a service
cd patient-service
mvn clean package -DskipTests

# Build Docker image
docker build -t chamudithaadithya/patient_management_system:patient .

# Push to Docker Hub
docker push chamudithaadithya/patient_management_system:patient
```

All 7 images pushed to Docker Hub under `chamudithaadithya/patient_management_system`.

---

## 4. Backend Microservices

### 4.1 Auth Service (Port 4005)

| Aspect | Details |
|--------|---------|
| Framework | Spring Boot 3.5.x, Java 21 |
| DB | PostgreSQL (RDS) |
| Endpoints | `/login`, `/register`, `/admin/create`, `/admin/staff`, `/admin/users` |
| JWT | HMAC-SHA256 using `jjwt` 0.12.6 |

**How login works:**
1. User posts `{ email, password }` to `/login`
2. Service validates credentials against DB
3. On success, generates JWT with claims: `sub` (email), `role`, `iat`, `exp`
4. Returns `{ token: "eyJ..." }`

**Registration rules:**
- `/register` accepts only `DOCTOR` and `PATIENT` roles
- `SUPER_ADMIN` seeded on startup (`chamuditha@hospital.com` / `Admin@123`)
- `/admin/create` restricted to `SUPER_ADMIN` only

### 4.2 Patient Service (Port 4000)

| Aspect | Details |
|--------|---------|
| Framework | Spring Boot 3.5.x, Java 21 |
| DB | PostgreSQL (RDS) |
| Endpoints | CRUD `/api/patients/**` |
| Integration | gRPC -> billing-service, Kafka -> patient events |

**Workflow when a patient is created:**
1. Validate fields + check email uniqueness
2. Save to PostgreSQL `patient` table
3. Send gRPC call to billing-service (creates billing account)
4. Publish `PatientEvent` to Kafka topic `patient`
5. Analytics-service consumes the event

**Soft-delete:** `DELETE` sets `status = INACTIVE` instead of removing the row.

### 4.3 Billing Service (Port 4001 / 9001)

| Aspect | Details |
|--------|---------|
| Protocol | gRPC (port 9001) + REST (port 4001) |
| gRPC | Receives billing account creation from patient-service |
| DB | PostgreSQL |

### 4.4 Analytics Service (Port 4002)

| Aspect | Details |
|--------|---------|
| Role | Kafka consumer |
| Topics | `patient`, `appointment` |
| Action | Logs all events to database |

### 4.5 Appointment Service (Port 4006)

| Aspect | Details |
|--------|---------|
| DB | PostgreSQL (RDS) |
| Tables | `appointments`, `consultations`, `doctors` |

**Endpoints:**
- `GET /appointments` — list all
- `POST /appointments` — create (with conflict check)
- `PUT /appointments/{id}/cancel` — cancel
- `PUT /appointments/{id}/complete` — complete
- `GET /appointments/doctor/{id}/available?date=` — available slots
- `POST /consultations` — create consultation (auto-completes appointment)
- `GET /consultations/patient/{id}` — patient history

### 4.6 Imaging Service (Port 4007)

| Aspect | Details |
|--------|---------|
| DB | PostgreSQL (RDS) |
| Storage | Volume mount `/app/images` |
| Table | `medical_images` (id, patient_id, uploaded_by, image_type, file_name, file_path) |

**Endpoints:**
- `POST /images/upload` — multipart form (file + patientId + imageType)
- `GET /images/patient/{patientId}` — list patient images
- `GET /images/{id}` — download image file

### 4.7 API Gateway (Port 4004)

Built with Spring Cloud Gateway. Routes all external requests to internal services.

```
External Port 4004
    │
    ├── /login,/register,/admin/**  → auth-service:4005
    ├── /api/patients/**      → patient-service:4000
    ├── /api/doctors/**       → appointment-service:4006
    ├── /api/appointments/**  → appointment-service:4006
    ├── /api/consultations/** → appointment-service:4006
    ├── /api/images/**        → imaging-service:4007
    └── /api-docs/**          → respective services
```

CORS: Wildcard origin pattern for cross-origin requests from S3 frontend.

---

## 5. Role-Based Access Control (RBAC)

### 5.1 Role Hierarchy

```
SUPER_ADMIN  (full system access, can create ADMINS)
    └── ADMIN  (manage doctors, staff, patients)
           ├── DOCTOR  (consultations, imaging, patient records)
           ├── STAFF   (front desk: register patients, book appointments)
           └── PATIENT (own data only)
```

### 5.2 Adding Spring Security + JJWT Dependencies

Added to `pom.xml` of patient-service, auth-service, appointment-service, imaging-service:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### 5.3 Shared Secret Key

Same key in all services (`application.properties` / `application.yml`):
```properties
secret.key=dqYCMmwi5RRi2q3q0b32EZ3mR37RgQEJFfi3egXDQNI=
```

### 5.4 JwtAuthFilter

Created `config/JwtAuthFilter.java` in all 4 secured services:

```java
// Extends OncePerRequestFilter
// Reads Authorization: Bearer <token>
// Decodes Base64 secret key
// Parses JWT: Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token)
// Extracts sub (email) and role claim
// Sets SecurityContextHolder with ROLE_<role> authority
// On failure, clears context (passes to filter chain)
```

### 5.5 SecurityConfig

Created `config/SecurityConfig.java` in all 4 services:

**Auth service rules:**
- `/login`, `/register`, Swagger docs -> permit all
- `POST /admin/create`, `DELETE /admin/*`, `GET /admin/users` -> SUPER_ADMIN only
- `POST /admin/staff`, `GET /admin/staff`, `DELETE /admin/staff/*` -> SUPER_ADMIN or ADMIN
- Everything else -> authenticated

**Patient service rules:**
- `GET /patients/**` -> SUPER_ADMIN, ADMIN, DOCTOR, PATIENT, STAFF
- `POST /patients` -> SUPER_ADMIN, ADMIN, DOCTOR, STAFF
- `PUT /patients/**` -> SUPER_ADMIN, ADMIN, DOCTOR
- `DELETE /patients/**` -> SUPER_ADMIN, ADMIN only

**Appointment & Imaging services:** Same pattern with CSRF disabled, stateless sessions, JwtAuthFilter before `UsernamePasswordAuthenticationFilter`.

### 5.6 Testing RBAC with Curl

```bash
# Get ADMIN token
TOKEN=$(curl -s -X POST http://47.130.152.226:4005/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chamuditha@hospital.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# ADMIN can delete patients -> 200
curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  http://47.130.152.226:4004/api/patients/some-id \
  -H "Authorization: Bearer $TOKEN"

# PATIENT can NOT delete patients -> 403
curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  http://47.130.152.226:4004/api/patients/some-id \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

---

## 6. CI/CD Pipeline (GitHub Actions)

File: `.github/workflows/deploy.yml`

**Trigger**: Push to `main` or `develop`, or manual `workflow_dispatch`.

### Job 1: build-backend (Matrix — 7 parallel)

```
Strategy matrix:
  service: [auth-service, patient-service, billing-service,
            analytics-service, api-getway, appoinment-service-main,
            imaging-service]

Steps:
  1. Checkout code
  2. Setup Java 21 (Temurin)
  3. mvn clean package -DskipTests
  4. Upload JAR as artifact
```

### Job 2: docker-build (Matrix — 7 parallel, needs build-backend)

```
Steps:
  1. Download JAR artifact
  2. Login to Docker Hub (secrets.DOCKER_USERNAME, secrets.DOCKER_PASSWORD)
  3. Build Docker image
  4. Push to chamudithaadithya/patient_management_system:{tag}
```

### Job 3: build-frontend (needs docker-build)

```
Steps:
  1. Install Node 20
  2. npm ci
  3. Inject env vars: VITE_API_GATEWAY, VITE_AUTH_SERVICE (from EC2_HOST secret)
  4. npm run build
  5. Upload dist as artifact
```

### Job 4: deploy-frontend (main only, needs build-frontend)

```
Steps:
  1. Configure AWS credentials (secrets.AWS_ACCESS_KEY_ID, secrets.AWS_SECRET_ACCESS_KEY)
  2. Download dist artifact
  3. aws s3 sync ./dist s3://hospital-frontend-dev-2026
  4. (Optional) CloudFront invalidation
```

### Job 5: deploy-backend (main only, needs docker-build)

```
Steps:
  1. SSH into EC2 (appleboy/ssh-action)
  2. cd patient-managment
  3. git pull origin main
  4. docker compose pull
  5. docker compose up -d --remove-orphans
  6. docker system prune -f
```

### GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub login |
| `DOCKER_PASSWORD` | Docker Hub password/token |
| `AWS_ACCESS_KEY_ID` | IAM user `github-actions` |
| `AWS_SECRET_ACCESS_KEY` | IAM user `github-actions` secret |
| `EC2_HOST` | `47.130.152.226` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | SSH private key |

---

## 7. Frontend Build & Deployment

### 7.1 Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Language | TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP | Axios |
| Auth | JWT in localStorage |

### 7.2 Frontend Architecture

```
frontend/src/
├── api/            # API modules (patients, appointments, auth)
├── components/     # Reusable UI (Button, Table, Badge, etc.)
├── context/        # AuthContext (JWT state)
├── hooks/          # Custom hooks
├── lib/            # Axios instance with interceptors
├── pages/          # Page components
├── types/          # TypeScript type definitions
└── App.tsx         # Router config
```

### 7.3 Build for Production

```bash
cd frontend
npm ci
echo "VITE_API_GATEWAY=http://47.130.152.226:4004/api" >> .env.production
echo "VITE_AUTH_SERVICE=http://47.130.152.226:4005" >> .env.production
npm run build

# dist/ folder is created
aws s3 sync ./dist s3://hospital-frontend-dev-2026
```

### 7.4 How the Frontend Connects

1. User visits `http://hospital-frontend-dev-2026.s3-website.ap-southeast-1.amazonaws.com`
2. React app loads the SPA
3. All API calls go to `http://47.130.152.226:4004/api/*` (API Gateway)
4. Login calls go directly to `http://47.130.152.226:4005/login`
5. JWT token stored in localStorage, attached to every request via Axios interceptor

---

## 8. Monitoring & Load Testing

### 8.1 CloudWatch Dashboard (Hirusha)

Created AWS CloudWatch dashboard `PM-System-Monitoring` with widgets:
- EC2 CPU Utilization
- EC2 Network In/Out
- RDS DatabaseConnections
- RDS CPUUtilization
- S3 BucketSizeBytes

**Alarms created:**
- `pm-ec2-cpu-high` — CPU > 80% for 3 consecutive 5-minute periods
- `pm-rds-connections-high` — Connections > 20

### 8.2 k6 Load Testing (Hirusha)

Test script at `scripts/k6-test.js`:

```javascript
// Stages: 5 users (30s) -> 20 users (1m) -> 20 users (2m) -> ramp down
// Tests: Login -> Get Patients
// Thresholds: error rate < 5%, p(95) < 3s
```

```bash
# Run against production
k6 run scripts/k6-test.js -e BASE_URL=http://47.130.152.226
```

---

## 9. Cross-Cutting Infrastructure Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| CORS | Frontend on S3 can't call EC2 APIs | Changed to wildcard origin pattern without allowCredentials |
| Kafka | Version upgrade required KRaft mode | Pinned to `7.4.0` for ZooKeeper compatibility |
| AWS Region | Resources in different regions | Migrated `eu-north-1` -> `us-east-1` -> `ap-southeast-1` |
| CloudFront | Pipeline failed when no distribution exists | Added conditional step with `if:` |
| Duplicate sidebar | React Router nested AppLayout | Fixed route definitions to remove nesting |
| YAML syntax | Docker compose parse error | Fixed indentation in imaging-service block |

---

## 10. Summary of Everything Created

### AWS Resources

| Resource | Name | Details | Created By |
|----------|------|---------|-----------|
| VPC | `pm-vpc` | 10.0.0.0/16, 2 AZs | Anjali |
| Public subnets | 2 | 10.0.1.0/24, 10.0.2.0/24 | Anjali |
| Private subnets | 2 | 10.0.3.0/24, 10.0.4.0/24 | Anjali |
| Internet Gateway | 1 | Attached to pm-vpc | Anjali |
| NAT Gateway | 1 | In public subnet | Anjali |
| Route tables | 2 | Public (->IGW), Private (->NAT) | Chamuditha |
| Security Group | `pm-system-sg` | SSH, HTTP, HTTPS, backend ports | Chamuditha |
| EC2 | `pm-system` | t3.medium, 30GB gp3, Amazon Linux 2023 | Chamuditha |
| RDS | `pm-postgres` | PostgreSQL, db.t3.micro, 20GB | Nishan |
| S3 | `hospital-frontend-dev-2026` | Static website hosting | Nishan |
| CloudFront | 1 | CDN for S3 frontend | Nishan |
| CloudWatch Dashboard | `PM-System-Monitoring` | EC2 + RDS + S3 metrics | Hirusha |
| CloudWatch Alarms | 2 | CPU > 80%, Connections > 20 | Hirusha |

### Docker Containers (Running on EC2)

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| zookeeper | `cp-zookeeper:7.4.0` | 2181 | Kafka coordination |
| patient-kafka | `cp-kafka:7.4.0` | 9092 | Event bus |
| billing-service | `patient_management_system:billing` | 4001, 9001 | Billing gRPC |
| patient-service | `patient_management_system:patient` | 4000 (int) | Patient CRUD |
| analytics-service | `patient_management_system:analytics` | 4002 | Kafka consumer |
| api-getway | `patient_management_system:api_getway` | 4004 | API Gateway |
| auth-service | `patient_management_system:auth_service` | 4005 | Auth + JWT |
| appointment-service | `patient_management_system:appointment` | 4006 | Appointments |
| imaging-service | `patient_management_system:imaging` | 4007 | Medical images |

### GitHub Actions CI/CD Pipeline

| Job | Services | What It Does |
|-----|----------|-------------|
| build-backend | 7 Java services | Maven build |
| docker-build | 7 Docker images | Build + push to Docker Hub |
| build-frontend | React app | npm ci + build |
| deploy-frontend | S3 | Sync dist to bucket |
| deploy-backend | EC2 | SSH -> git pull -> compose up |

### Security (RBAC)

| Component | Services | Role Scope |
|-----------|----------|-----------|
| JwtAuthFilter | auth, patient, appointment, imaging | Token validation |
| SecurityConfig | auth, patient, appointment, imaging | URL-based access rules |
| Role hierarchy | All | SUPER_ADMIN > ADMIN > DOCTOR > STAFF > PATIENT |

### Database Tables (Single RDS PostgreSQL: `patient_management`)

| Table | Service | Key Columns |
|-------|---------|-------------|
| `users` | auth-service | id, name, email, password, role |
| `patient` | patient-service | id, name, email, phone, status |
| `billing_account` | billing-service | id, patient_id, status |
| `analytics_event` | analytics-service | id, event_type, payload |
| `appointments` | appointment-service | id, patient_id, doctor_id, status |
| `consultations` | appointment-service | id, appointment_id, diagnosis, notes |
| `doctors` | appointment-service | id, name, specialization |
| `medical_images` | imaging-service | id, patient_id, image_type, file_path |

### End-to-End User Flow

1. **Patient registers** at reception (STAFF logs in, creates patient record)
2. **Appointment booked** (select doctor, pick available slot, enter reason)
3. **Doctor consults** (views appointments, creates consultation record)
4. **Medical imaging** (doctor uploads X-ray/MRI, linked to patient)
5. **Follow-up** (doctor views patient history, books next appointment)
6. **Admin management** (SUPER_ADMIN creates admins, admins manage doctors/staff)

All 8 microservices, 1 API Gateway, 1 Kafka event bus, 1 RDS database, S3-hosted frontend, and automated CI/CD deployment — running on a single EC2 instance in AWS ap-southeast-1.
