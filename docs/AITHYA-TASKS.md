# Chamuditha Adithya — Implementation Guide

## RBAC Security + API Gateway + CI/CD + Infrastructure & DevOps Lead

---

Your work covers AWS networking, RBAC security across all services, API Gateway routing, CI/CD pipeline, and overall DevOps coordination.

---
---

### Task 2: Create EC2 Instance (Automated Script)

- SSH key pair `pm-system-key`
- EC2 `t3.medium` (Amazon Linux 2023, 30GB gp3) with user-data bootstrap
- Security group `pm-system-sg`

- Installs Docker + docker-compose-plugin + git
- Clones the repository
- Creates `.env` file with connection strings

> **Credit:** S3 bucket (`pm-frontend-2026`) and RDS PostgreSQL (`pm-postgres`) were provisioned by **Nishan**.

---



### Task 4: Configure Docker Compose Networking

File: `docker-compose.yml`

- Created shared bridge network `internal-net`
- 8 containers: zookeeper, patient-kafka, billing-service, patient-service, analytics-service, api-getway, auth-service, appointment-service, imaging-service
- Patient-service reaches billing-service via gRPC at `billing-service:9001`
- All services reach Kafka at `patient-kafka:9092`
- All services connect to RDS PostgreSQL (created by **Nishan**)
- Named volume `medical-images` for imaging-service persistence

---

### Task 5: Add Spring Security + JJWT Dependencies

Added to `patient-service/pom.xml`, and replicated across `auth-service`, `appointment-service`, `imaging-service`:

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

---

### Task 6: Create JwtAuthFilter (All 4 Services)

Identical implementation in:
- `auth-service/src/main/java/com/pm/auth_service/config/JwtAuthFilter.java`
- `patient-service/src/main/java/com/pm/patientService/config/JwtAuthFilter.java`
- `appoinment-service-main/src/main/java/com/pm/appointment_service/config/JwtAuthFilter.java`
- `imaging-service/src/main/java/com/pm/imaging_service/config/JwtAuthFilter.java`

**How it works:**
1. Extends `OncePerRequestFilter` — runs once per request
2. Reads `Authorization: Bearer <token>` header
3. Decodes Base64 secret key from `application.properties`
4. Parses JWT using JJWT: `Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token)`
5. Extracts `sub` (email) and `role` claim
6. Sets `UsernamePasswordAuthenticationToken` with `ROLE_<role>` authority in `SecurityContextHolder`
7. On failure, clears context (passes to next filter chain for proper 401 handling)

---

### Task 7: Create SecurityConfig (RBAC Rules — All 4 Services)

**auth-service** (`SecurityConfig.java`):
- `/login`, `/register`, Swagger docs -> permit all
- `POST /admin/create`, `DELETE /admin/*`, `GET /admin/users` -> `SUPER_ADMIN` only
- `POST /admin/staff`, `GET /admin/staff`, `DELETE /admin/staff/*` -> `SUPER_ADMIN` or `ADMIN`
- Everything else -> authenticated

**patient-service** (`SecurityConfig.java`):
- Swagger docs -> permit all
- `GET /patients/**` -> `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `PATIENT`, `STAFF`
- `POST /patients` -> `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `STAFF`
- `PUT /patients/**` -> `SUPER_ADMIN`, `ADMIN`, `DOCTOR`
- `DELETE /patients/**` -> `SUPER_ADMIN`, `ADMIN` only

**appointment-service** and **imaging-service** follow the same pattern: CSRF disabled, stateless sessions, JwtAuthFilter before `UsernamePasswordAuthenticationFilter`.

---

### Task 8: Configure API Gateway Routes

File: `api-getway/src/main/resources/application.yml`

| Route ID | Path | Target |
|----------|------|--------|
| patient-service-route | `/api/patients/**` | `http://patient-service:4000` |
| doctor-service-route | `/api/doctors/**` | `http://appointment-service:4006` |
| appointment-service-route | `/api/appointments/**` | `http://appointment-service:4006` |
| consultation-service-route | `/api/consultations/**` | `http://appointment-service:4006` |
| imaging-service-route | `/api/images/**` | `http://imaging-service:4007` |
| api-docs-patient-route | `/api-docs/patients` | `http://patient-service:4000` |
| api-docs-appointment-route | `/api-docs/appointments` | `http://appointment-service:4006` |

All routes use `StripPrefix=1` filter. Global CORS configured with wildcard origin pattern.

---

### Task 9: Add Secret Key & Test RBAC

- Added `secret.key` property to `application.properties` in all 4 secured services
- Used the same Base64-encoded HMAC key across auth-service and all backend services so tokens issued by auth-service are accepted everywhere
- Tested RBAC rules with curl:
  - `ADMIN` token -> `DELETE /patients/{id}` -> `200 OK`
  - `PATIENT` token -> `DELETE /patients/{id}` -> `403 Forbidden`
  - `DOCTOR` token -> `POST /patients` -> `200 OK`

---

### Task 10: Build CI/CD Pipeline

File: `.github/workflows/deploy.yml`

**5 jobs, triggered on push to `main`/`develop`:**

| Job | What It Does |
|-----|-------------|
| `build-backend` | Matrix build of 7 Java services (Java 21, Maven cache) |
| `docker-build` | Matrix build & push of 7 Docker images to Docker Hub |
| `build-frontend` | Build React/Vite frontend with production API URLs |
| `deploy-frontend` | Sync to S3 bucket `hospital-frontend-dev-2026` + CloudFront invalidation |
| `deploy-backend` | SSH into EC2 -> `git pull` -> `docker compose pull` -> `docker compose up -d` |

**GitHub Secrets configured:**
`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`

---

### Task 11: Configure Cross-Cutting Infrastructure Fixes

| Issue | Fix |
|-------|-----|
| **CORS blocking frontend requests** | Changed to wildcard origin pattern, fixed allowCredentials conflict |
| **Kafka KRaft mode incompatibility** | Pinned images to `7.4.0` to retain ZooKeeper-based operation |
| **Wrong AWS region** | Migrated from `eu-north-1` -> `us-east-1` -> `ap-southeast-1` to match EC2 location |
| **YAML syntax in imaging-service** | Fixed indentation in docker-compose environment block |
| **CloudFront invalidation failure** | Added conditional step to skip when no distribution exists |
| **Frontend duplicate sidebar routes** | Fixed React routing for admin/staff/doctor views |

---

### Task 12: Final Integration Test & Documentation

- End-to-end test: Login -> Create Patient -> Schedule Appointment -> Verify in Database
- Confirmed all services are reachable through the API Gateway on port 4004
- Verified RBAC enforcement across patient, appointment, and imaging endpoints
- Documented in the report as Part 6 (Security)

---

### Task 12: Disaster Recovery Setup

Configure disaster recovery for the system to minimize data loss and downtime.

#### Step 1: Enable RDS Multi-AZ

AWS Console -> RDS -> `pm-postgres` -> Modify:

| Field | Current | New Value |
|-------|---------|-----------|
| Multi-AZ | No | **Yes** (creates standby in another AZ) |
| Backup retention | 7 days | Keep as-is (or increase to 30) |
| Backup window | No preference | Set a specific window (e.g. 02:00-03:00) |

Click **Apply immediately**.

This creates a standby replica in a different Availability Zone. If the primary AZ fails, RDS automatically fails over to the standby with zero data loss.

> **Cost note:** Multi-AZ doubles RDS cost (you pay for the standby). For Free Tier, you may skip this and document it as the recommended DR strategy instead.

#### Step 2: Cross-Region Backup (S3)

Enable cross-region replication for the frontend S3 bucket:

```bash
# Create a backup bucket in us-east-1
aws s3 mb s3://hospital-frontend-dr-backup --region us-east-1

# Enable versioning on both buckets
aws s3api put-bucket-versioning \
  --bucket hospital-frontend-dev-2026 \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-versioning \
  --bucket hospital-frontend-dr-backup \
  --versioning-configuration Status=Enabled

# Add replication rule (via AWS Console):
# S3 -> hospital-frontend-dev-2026 -> Management -> Replication -> Add rule
# Destination: hospital-frontend-dr-backup in us-east-1
# IAM role: Create new role
```

#### Step 3: Automate RDS Snapshots to Another Region

Create a script `scripts/cross-region-snapshot.sh`:

```bash
#!/bin/bash
set -e

SOURCE_REGION="ap-southeast-1"
DEST_REGION="us-east-1"
DB_INSTANCE="pm-postgres"
SNAPSHOT_ID="${DB_INSTANCE}-dr-$(date +%Y%m%d-%H%M%S)"

echo "Creating snapshot in $SOURCE_REGION..."
aws rds create-db-snapshot \
  --db-instance-identifier $DB_INSTANCE \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --region $SOURCE_REGION

aws rds wait db-snapshot-available \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --region $SOURCE_REGION

echo "Copying snapshot to $DEST_REGION..."
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:${SOURCE_REGION}:$(aws sts get-caller-identity --query Account --output text):db-snapshot:${SNAPSHOT_ID} \
  --target-db-snapshot-identifier ${SNAPSHOT_ID}-dr \
  --region $DEST_REGION

echo "DR snapshot complete: ${SNAPSHOT_ID} -> ${DEST_REGION}"
```

Schedule weekly via cron on EC2:

```bash
# Run every Sunday at 3 AM
0 3 * * 0 /home/ubuntu/patient-managment/scripts/cross-region-snapshot.sh >> /var/log/dr-snapshot.log 2>&1
```

#### Step 4: Define RTO & RPO for Report

Document these in the report:

| Metric | Target | How It's Achieved |
|--------|--------|-------------------|
| **RPO** (Recovery Point Objective) | 5 minutes | Automated RDS backups every 5 minutes (default) + cross-region snapshot weekly |
| **RTO** (Recovery Time Objective) | 1 hour | Multi-AZ failover (~1-2 min) or restore from latest snapshot (~30-60 min) |
| **Frontend DR** | 15 minutes | S3 static hosting + CloudFront; redeploy via CI/CD |
| **Backend DR** | 1 hour | Docker images on Docker Hub; `docker compose up -d` on new EC2 via CI/CD |

#### Step 5: Document Recovery Steps

Add to report as Part 2.8 — Disaster Recovery:

**If EC2 fails:**
1. Launch new EC2 from saved AMI or use auto-scaling (Bishar's task)
2. SSH in, clone repo, `docker compose up -d`
3. Update EC2_HOST GitHub secret with new IP
4. Re-run CI/CD pipeline

**If RDS fails:**
1. Multi-AZ auto-failover (if enabled) — no action needed
2. Or: Restore from latest snapshot via AWS Console
3. Update SPRING_DATASOURCE_URL in .env if endpoint changed

**If region fails:**
1. Promote cross-region snapshot to new RDS in us-east-1
2. Launch EC2 in us-east-1
3. Update CloudFront to point to new backend
4. Restore frontend from S3 dr-backup bucket

---

### Summary

| # | Task | Status |
|---|------|--------|
| 1 | Route tables + security groups | ✅ Done |
| 2 | EC2 instance + bootstrap script | ✅ Done |
| 3 | Docker Compose networking | ✅ Done |
| 4 | Spring Security + JJWT dependencies | ✅ Done |
| 5 | JwtAuthFilter (4 services) | ✅ Done |
| 6 | SecurityConfig RBAC rules (4 services) | ✅ Done |
| 7 | API Gateway routes | ✅ Done |
| 8 | Secret key config + RBAC testing | ✅ Done |
| 9 | CI/CD pipeline (GitHub Actions) | ✅ Done |
| 10 | Cross-cutting infrastructure fixes | ✅ Done |
| 11 | Final integration test + docs | ✅ Done |
| 12 | Disaster Recovery setup | **⬅️ Your task** |

### Key Shared Resources & Credits

| Resource | Created By |
|----------|-----------|
| VPC + Subnets + IGW + NAT | Anjali |
| ALB | Anjali |
| Route Tables + Security Groups | **Chamuditha** |
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
| Disaster Recovery (Multi-AZ, cross-region) | **Chamuditha** |

