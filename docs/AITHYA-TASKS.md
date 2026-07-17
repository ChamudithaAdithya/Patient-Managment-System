# Chamuditha Adithya — Work Done

## RBAC Security + API Gateway + CI/CD + Docker & DevOps

---

### Task 1: Create EC2 Instance with Bootstrap Script

Created an EC2 instance (`t3.medium`, Ubuntu, 30GB gp3) and automated its setup:

- **Generated SSH key pair** `pm-system-key` for secure access
- **Launched EC2** in the default VPC with security group `pm-system-sg`
- **User-data bootstrap script** that auto-installs:
  - Docker + docker-compose-plugin
  - Git
- **Clones the repository** from GitHub to `~/patient-managment`
- **Creates `.env` file** with database connection strings for the microservices

---

### Task 2: Docker Compose Networking

File: `docker-compose.yml`

Set up the entire container networking for all 9 microservices:

- **Created shared bridge network** `internal-net` so containers can communicate by service name (e.g., `auth-service:4005`)
- **Configured 9 containers:**
  - `zookeeper` + `patient-kafka` — message broker for async communication
  - `billing-service` (port 4001)
  - `patient-service` (port 4000) — reaches billing-service via gRPC at `billing-service:9001`
  - `analytics-service` (port 4002)
  - `api-getway` (port 4004) — single entry point for all frontend requests
  - `auth-service` (port 4005)
  - `appointment-service` (port 4006)
  - `imaging-service` (port 4007) — with named volume `medical-images` for file persistence
- **All services connect to** shared RDS PostgreSQL (`pm-postgres`)
- **All services connect to** Kafka at `patient-kafka:9092`

---

### Task 3: Add Spring Security + JJWT Dependencies

Added security dependencies to `pom.xml` in 4 services (`auth-service`, `patient-service`, `appointment-service`, `imaging-service`):

- `spring-boot-starter-security` — framework for authentication & authorization
- `jjwt-api` / `jjwt-impl` / `jjwt-jackson` (version 0.12.6) — JSON Web Token creation & validation

---

### Task 4: Create JwtAuthFilter (All 4 Services)

Built a custom JWT authentication filter that runs on every request:

- **Extends `OncePerRequestFilter`** — guaranteed to execute once per HTTP request
- **Reads the `Authorization: Bearer <token>` header** from incoming requests
- **Decodes the HMAC secret key** from `application.properties` (Base64-encoded)
- **Parses the JWT** using JJWT library
- **Extracts user info:** `sub` (email) and `role` from the token claims
- **Sets authentication** in Spring's `SecurityContextHolder` with role prefix `ROLE_<role>`
- **On failure:** clears security context and lets the next filter handle proper 401 response

Implemented identically in:
- `auth-service/src/main/java/com/pm/auth_service/config/JwtAuthFilter.java`
- `patient-service/src/main/java/com/pm/patientService/config/JwtAuthFilter.java`
- `appoinment-service-main/src/main/java/com/pm/appointment_service/config/JwtAuthFilter.java`
- `imaging-service/src/main/java/com/pm/imaging_service/config/JwtAuthFilter.java`

---

### Task 5: Create SecurityConfig with RBAC Rules (All 4 Services)

Configured role-based access control for every endpoint:

**auth-service** (login/register/admin):
- `/login`, `/register`, Swagger docs → public (no auth required)
- `POST /admin/create`, `DELETE /admin/*`, `GET /admin/users` → `SUPER_ADMIN` only
- `POST /admin/staff`, `GET /admin/staff`, `DELETE /admin/staff/*` → `SUPER_ADMIN` or `ADMIN`
- Everything else → any authenticated user

**patient-service** (patient CRUD):
- Swagger docs → public
- `GET /patients/**` → all roles (`SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `PATIENT`, `STAFF`)
- `POST /patients` → `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `STAFF`
- `PUT /patients/**` → `SUPER_ADMIN`, `ADMIN`, `DOCTOR`
- `DELETE /patients/**` → `SUPER_ADMIN`, `ADMIN` only

**appointment-service** and **imaging-service** follow the same pattern:
- CSRF disabled
- Stateless sessions (no HTTP session)
- JwtAuthFilter runs before `UsernamePasswordAuthenticationFilter`

---

### Task 6: Configure API Gateway Routes

File: `api-getway/src/main/resources/application.yml`

Set up Spring Cloud Gateway as the single entry point routing traffic to backend services:

| Route ID | Path (what frontend calls) | Target (internal service) |
|----------|---------------------------|---------------------------|
| patient-service-route | `/api/patients/**` | `http://patient-service:4000` |
| doctor-service-route | `/api/doctors/**` | `http://appointment-service:4006` |
| appointment-service-route | `/api/appointments/**` | `http://appointment-service:4006` |
| consultation-service-route | `/api/consultations/**` | `http://appointment-service:4006` |
| imaging-service-route | `/api/images/**` | `http://imaging-service:4007` |
| auth-service-route | `/login`, `/register`, `/admin/**` | `http://auth-service:4005` |
| api-docs-patient-route | `/api-docs/patients` | `http://patient-service:4000` |
| api-docs-appointment-route | `/api-docs/appointments` | `http://appointment-service:4006` |

All paths use `StripPrefix=1` to remove `/api` before forwarding.

---

### Task 7: Add Secret Key & Test RBAC

- **Added `secret.key`** property to `application.properties` in all 4 secured services
- **Shared the same HMAC key** across all services so tokens issued by auth-service are accepted everywhere
- **Verified RBAC enforcement** by testing with curl:
  - `ADMIN` token → `DELETE /patients/{id}` → `200 OK` (allowed)
  - `PATIENT` token → `DELETE /patients/{id}` → `403 Forbidden` (blocked)
  - `DOCTOR` token → `POST /patients` → `200 OK` (allowed)

---

### Task 8: Build CI/CD Pipeline

File: `.github/workflows/deploy.yml`

Built a fully automated pipeline with 5 jobs that runs on every push to `main` or `develop`:

| Job | What It Does |
|-----|-------------|
| `build-backend` | Builds all 7 Java services in parallel (Java 21, with Maven caching for speed) |
| `docker-build` | Builds & pushes 7 Docker images to Docker Hub (`chamudithaadithya/patient_management_system:*`) |
| `build-frontend` | Builds the React/Vite frontend with production API URLs (points to ALB) |
| `deploy-frontend` | Syncs frontend to S3 bucket `hospital-frontend-dev-2026` |
| `deploy-backend` | SSHs into EC2 → `git pull` → `docker compose pull` → `docker compose up -d` |

**GitHub Secrets configured:**
`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`

---

### Task 9: Cross-Cutting Infrastructure Fixes

| Issue | What Was Wrong | How I Fixed It |
|-------|---------------|----------------|
| **CORS blocking frontend** | Browser rejected API calls due to CORS policy | Changed to wildcard origin pattern in gateway, fixed `allowCredentials` conflict with `allowedOriginPatterns` |
| **Kafka not starting** | KRaft mode was incompatible with our setup | Pinned Kafka images to `7.4.0` to keep ZooKeeper-based operation |
| **Wrong AWS region** | Resources created in `eu-north-1` first, then `us-east-1` | Migrated everything to `ap-southeast-1` to match EC2 location |
| **Imaging-service YAML error** | docker-compose had incorrect indentation | Fixed environment block indentation |
| **Frontend sidebar broken** | Duplicate routes in React for admin/staff/doctor views | Fixed React router configuration |

---

### Task 10: Final Integration Test & Documentation

- Ran end-to-end test: **Login → Create Patient → Schedule Appointment → Verify in Database**
- Confirmed all 7 backend services are reachable through the API Gateway on port 4004
- Verified RBAC enforcement: patients can't delete, admins can, etc.
- Documented security implementation in the project report (Part 6)

---

### Task 11: CORS & Gateway Fixes (July 17 Session)

Debugged and fixed the core issue preventing the frontend from talking to the backend:

| Commit | What Changed | Why |
|--------|-------------|-----|
| `dda31e1` | Created `.gitignore` | Stopped tracking `target/` binaries and `test.dump` |
| `cbe8160` | Replaced YAML `globalcors` with programmatic `CorsWebFilter` bean | Spring Cloud Gateway 4.3.0 deprecated the old YAML property keys |
| `109c8d3` | Fixed S3 origin pattern | Changed `s3-website.ap-southeast-1` → `s3-website-ap-southeast-1` (dot vs hyphen) |
| `b293e69` | Fixed pipeline artifact path + SPA routing | JARs weren't landing in `target/`; added `--error-document index.html` for SPA |
| `4cbe97d` | Added frontend S3 origin to auth-service CORS | Auth-service only allowed `localhost:*` — rejected all forwarded requests with `Origin` header |
| `d9388ce` | Deleted auth-service `WebConfig.java` entirely | Both gateway AND auth-service were adding `Access-Control-Allow-Origin` — browser rejected duplicate headers |
| `512ee1f` | Wildcard `s3-website*.amazonaws.com` | S3 URL can be `s3-website-ap-southeast-1` or `s3-website.ap-southeast-1` — pattern now matches both |

**Current state:** Login and register work from the browser. CORS is fully resolved.

---

### Summary

| # | What I Did | Status |
|---|-----------|--------|
| 1 | EC2 instance + bootstrap (Docker, git, clone) | ✅ Done |
| 2 | Docker Compose networking (9 containers, shared network) | ✅ Done |
| 3 | Spring Security + JJWT dependencies (4 services) | ✅ Done |
| 4 | JwtAuthFilter implementation (4 services) | ✅ Done |
| 5 | SecurityConfig RBAC rules (4 services) | ✅ Done |
| 6 | API Gateway routes (8 routes, StripPrefix) | ✅ Done |
| 7 | Secret key config + RBAC curl testing | ✅ Done |
| 8 | CI/CD pipeline (GitHub Actions, 5 jobs) | ✅ Done |
| 9 | Cross-cutting fixes (CORS, Kafka, YAML, region, routing) | ✅ Done |
| 10 | Final integration test + documentation | ✅ Done |
| 11 | CORS & Gateway debugging (7 commits, July 17) | ✅ Done |

---

### Key Shared Resources & Credits

| Resource | Created By |
|----------|-----------|
| VPC + Subnets + IGW + NAT | Anjali |
| ALB | Anjali |
| Route Tables + Security Groups | Anjali |
| Docker Hub Registry | **Chamuditha** (org owner) |
| EC2 Instance | **Chamuditha** |
| Docker Compose Networking | **Chamuditha** |
| CI/CD Pipeline | **Chamuditha** |
| S3 Buckets | Nishan |
| RDS PostgreSQL | Nishan |
| Auto-scaling Rules | Bishar |
| HTTPS / ACM Certificate | Bishar |
| CloudWatch Dashboard & Alarms | Hirusha |
| k6 Load Testing | Hirusha |

---

---

### Full Story — What I Built

I was responsible for setting up the entire backend infrastructure and DevOps pipeline for a cloud-based hospital management system. First, I launched an EC2 instance and wrote a bootstrap script that automatically installs Docker and Git, clones the repository, and configures the environment so the system is ready to run with zero manual setup. I then designed the Docker Compose networking, creating a shared bridge network called `internal-net` that connects all nine containers — including the API Gateway, auth-service, patient-service, appointment-service, imaging-service, billing-service, analytics-service, and a Kafka message broker — so they can communicate reliably using internal service names.

On the security side, I added Spring Security and JJWT dependencies to four backend services and built a custom JwtAuthFilter that runs on every request. This filter reads the JWT token from the `Authorization` header, validates it using a shared HMAC secret key, and sets the user's authentication context with their role (SUPER_ADMIN, ADMIN, DOCTOR, PATIENT, or STAFF). I then created SecurityConfig files for all four services to enforce role-based access control on every endpoint — for example, only SUPER_ADMIN can delete patients or create admin accounts, while PATIENT role can only view their own data.

For the API Gateway, I configured Spring Cloud Gateway with eight routes that serve as the single entry point for all frontend requests. Each route maps a frontend-facing path like `/api/patients` to the appropriate internal service, strips the `/api` prefix, and forwards the request. This keeps the backend services isolated and allows the frontend to talk to only one endpoint.

I built a complete CI/CD pipeline using GitHub Actions with five jobs running in parallel: building all seven Java services, building and pushing Docker images to Docker Hub, building the React frontend with production API URLs, deploying the frontend to an S3 bucket, and finally SSHing into the EC2 instance to pull and restart the containers. The pipeline triggers automatically on every push to the main branch, so deploying a new version is as simple as committing code.

I also fixed a series of cross-cutting issues that were blocking the system from working end-to-end. The most challenging was a CORS problem where the browser was rejecting all API calls from the frontend. After extensive debugging, I discovered three layers of issues: the gateway's YAML-based CORS configuration was using deprecated property keys that Spring Cloud Gateway 4.3.0 no longer supported (fixed by switching to a programmatic CorsWebFilter bean), the auth-service had its own CORS configuration that only allowed localhost origins (fixed by removing it entirely since the gateway handles all CORS), and the S3 website URL format differed between browsers (some used dots, some used hyphens — fixed with a wildcard pattern). I also fixed the CI/CD pipeline's artifact download path so JAR files land in the correct directory, added SPA routing support to the S3 bucket, pinned Kafka images to a compatible version, migrated resources to the correct AWS region, and fixed YAML formatting issues.

By the end, the full system was working: users can register and log in from the browser, the gateway correctly routes all API calls to the appropriate backend services, role-based access control blocks unauthorized actions, and the entire system can be redeployed with a single git push.

---

### ⚠️ Production Security Notes

| Issue | Risk | Fix Needed |
|-------|------|------------|
| RDS port 5432 open to `0.0.0.0/0` | Critical — database exposed to entire internet | Restrict to EC2 security group only |
| Frontend served over HTTP | Medium — login credentials sent without encryption | Needs HTTPS setup |
| DB credentials in docker-compose.yml | Medium — passwords visible in GitHub | Move to AWS Secrets Manager or environment variables only |
