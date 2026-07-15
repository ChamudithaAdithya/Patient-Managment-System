# Cloud-Based Hospital Management System — Full Assignment Checklist

**Project Scenario:** Option C — Cloud-Based Hospital Management System  
**Existing Codebase:** Patient Management microservices (Spring Boot, React, Docker, Kafka, gRPC, PostgreSQL)  
**Target Cloud Platform:** AWS (ap-southeast-1)

---

## PART 1: Cloud Conceptual Analysis (15 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Explain the cloud computing paradigm (SaaS, PaaS, IaaS, public/private/hybrid) | ❌ | Write in report |
| 1.2 | Identify **benefits** of cloud for hospital systems (scalability, cost-efficiency, disaster recovery, accessibility) | ❌ | Write in report |
| 1.3 | Identify **risks** (data breaches, compliance, downtime, vendor lock-in) | ❌ | Write in report |
| 1.4 | Identify **challenges** (latency-sensitive ops, legacy integration, regulatory complexity) | ❌ | Write in report |
| 1.5 | **Justify** why cloud is suitable for a Hospital Management System | ❌ | Write in report |
| 1.6 | Identify **compliance/security concerns** (HIPAA, GDPR, data residency, encryption) | ❌ | Write in report |

---

## PART 2: Cloud Infrastructure Design (20 Marks)

### Architecture Design

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Design complete cloud architecture diagram | ❌ | Create original diagram (Draw.io / Lucidchart) |
| 2.2 | **Compute** — Design VM / container / Kubernetes topology | ✅ | EC2 c7i-flex.large running 9 Docker containers (7 services + Kafka + Zookeeper) via docker-compose |
| 2.3 | **Networking** — VPC, subnets (public/private), load balancers, DNS | ✅ Partial | Security group (`pm-system-sg`) configured; no VPC/subnet design documented; no load balancer |
| 2.4 | **Storage** — Block (EBS), Object (S3), File (EFS) decisions per use-case | ✅ Partial | S3 bucket `hospital-frontend-dev-2026` for frontend static files; Docker volume `medical-images` for imaging-service |
| 2.5 | **Database** — SQL (RDS/Azure SQL) for patient/auth data | ✅ | RDS PostgreSQL `pm-postgres` (db.t3.micro) deployed; single database for all services |
| 2.6 | **Auto-scaling** — Horizontal pod/instance scaling strategy | ❌ | Define scaling policies (CPU/memory triggers) |
| 2.7 | **Monitoring** — CloudWatch / Azure Monitor, logging, alerting | ❌ | Design monitoring stack |
| 2.8 | **Disaster Recovery** — Backup, multi-AZ, RTO/RPO targets | ❌ | Define DR plan |
| 2.9 | **Cost Estimation** — Compute, storage, network, database monthly costs | ❌ | Use AWS Pricing Calculator |

### Architecture Diagram

| # | Task | Status |
|---|------|--------|
| 2.10 | Professional architecture diagram (all components, arrows, labels) | ❌ |

---

## PART 3: Virtualization Implementation (15 Marks)

### System Virtualization

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Deploy all services as Docker containers | ✅ | 9 containers via docker-compose on EC2 |
| 3.2 | Push images to container registry (Docker Hub) | ✅ | `chamudithaadithya/patient_management_system:{auth_service,patient,billing,analytics,api_getway,appointment,imaging}` |
| 3.3 | Screenshots of running containers | ❌ | Capture `docker ps` output from EC2 |
| 3.4 | Explain hypervisor type (Type 1 vs Type 2) and where Docker uses OS-level virtualization | ❌ | Write in report |

### Network Virtualization

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.5 | Use Docker bridge network (`internal-net`) | ✅ | `internal-net` bridge network connects all services |
| 3.6 | Configure firewall rules / security groups | ✅ | `pm-system-sg` with SSH (22), HTTP (80), PostgreSQL (5432), backend ports (4000-4010) |
| 3.7 | Explain SDN concepts applied (overlay networks, Docker bridge/networks) | ❌ | Write in report |

### Storage Virtualization

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.8 | Use Docker volumes / bind mounts for persistent data | ✅ | `medical-images` volume for imaging-service image uploads |
| 3.9 | Explain software-defined storage concepts | ❌ | Write in report |

### Evidence Screenshots

| # | Task | Status |
|---|------|--------|
| 3.10 | Screenshots of VM/container deployment, network config, storage config | ❌ |

---

## PART 4: Cloud Storage & Data Management (15 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | **Cloud Object Storage** — Configure S3/Azure Blob for medical imaging / documents | ✅ Partial | S3 bucket `hospital-frontend-dev-2026` created for frontend; medical images still on Docker volume (not S3) |
| 4.2 | **Database Service** — Deploy PostgreSQL via RDS | ✅ | RDS PostgreSQL `pm-postgres` deployed and connected; Docker DBs replaced with managed RDS |
| 4.3 | **Backup Configuration** — Automated backups, point-in-time restore | ❌ | RDS has automatic backups enabled by default; document the configuration |
| 4.4 | **Data Lifecycle Policies** — Transition older data to colder storage tiers | ❌ | S3 lifecycle rules (Standard → IA → Glacier) |
| 4.5 | **Access Control Policies** — IAM roles, bucket policies, DB user permissions | ✅ Partial | IAM user `github-actions` with minimal S3/EC2/CloudFront policies; S3 bucket policy allows public read; `pm_admin` DB user created |
| 4.6 | Explain **CAP Theorem** relevance for patient DB (consistency over availability?) | ❌ | Write in report |
| 4.7 | Explain **Distributed File System** principles relevant to architecture | ❌ | Write in report |
| 4.8 | Explain **Data Durability** mechanisms (replication, erasure coding, multi-AZ) | ❌ | Write in report |
| 4.9 | **Screenshots** of storage config, backup settings, lifecycle rules | ❌ | |

---

## PART 5: Cloud Programming Model (20 Marks)

### REST API (Already Implemented)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | REST API for patient CRUD (GET, POST, PUT, DELETE) | ✅ | `PatientController` at `/api/patients` via API Gateway |
| 5.2 | JWT-based authentication (POST /login) | ✅ | Auth-service returns JWT token; verified working on EC2 |
| 5.3 | API Gateway routing | ✅ | Spring Cloud Gateway at port 4004; routes to all services |
| 5.4 | API testing screenshots (Postman / HTTP files) | ❌ | Use `api-requests/` files and capture results |

### Containerized Microservices (Already Implemented)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.5 | 5+ microservices containerized | ✅ | 7 services: auth, patient, billing, analytics, gateway, appointment, imaging — all with Dockerfiles |
| 5.6 | Inter-service communication (gRPC, Kafka) | ✅ | Patient→Billing via gRPC port 9001; Patient→Analytics via Kafka topic `patient-0` |
| 5.7 | Docker Compose orchestration | ✅ | `docker-compose.yml` with all services, Kafka, Zookeeper |
| 5.8 | Auto-scaling or event-triggered execution | ❌ | Configure or demonstrate cloud auto-scaling |

### Serverless / Additional

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.9 | Deploy a **serverless function** (AWS Lambda) | ❌ | E.g., email notification on patient creation |
| 5.10 | **MapReduce-style** data processing (optional) | ❌ | Could analyze patient data patterns |
| 5.11 | Explain programming model used and why it was chosen | ❌ | Write in report |

### Deployment & Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.12 | Live deployment on cloud (AWS EC2) | ✅ | All 7 services running on EC2 `c7i-flex.large` at `47.130.152.226` |
| 5.13 | API testing screenshots / Postman collection | ❌ | |
| 5.14 | Code deployment pipeline (CI/CD) | ✅ | GitHub Actions builds all 7 services → pushes Docker images → deploys frontend to S3 + backend to EC2 |

---

## PART 6: Security, Governance & Optimization (10 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | **IAM** — Define roles with least-privilege policies | ✅ | Application roles (SUPER_ADMIN, ADMIN, DOCTOR, STAFF, PATIENT) in JWT; IAM user `github-actions` with restricted policies |
| 6.2 | **Encryption at rest** — Database encryption, S3 server-side encryption | ❌ | RDS encryption and S3 SSE-S3 not yet enabled |
| 6.3 | **Encryption in transit** — TLS for all HTTP/gRPC/Kafka traffic | ❌ | No HTTPS/TLS configured yet |
| 6.4 | **Firewall/Security Groups** — Ingress/egress rules per service | ✅ | `pm-system-sg` with SSH (22), PostgreSQL (5432), backend ports (4000-4010) |
| 6.5 | **Cost Optimization** — Right-size instances, reserved instances, auto-scaling | ❌ | Write cost optimization strategy |
| 6.6 | **Monitoring & Logging** — CloudWatch / Azure Monitor dashboards, log aggregation | ❌ | Not configured |
| 6.7 | Screenshots of security configuration | ❌ | |

---

## PART 7: Testing & Evaluation (5 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | **Performance testing** — Basic load test (e.g., k6 / Locust) | ❌ | Run load test against `/login` or `/patients` endpoint |
| 7.2 | **System limitations** — Identify bottlenecks (DB connection pool, gRPC sync call, etc.) | ❌ | Write analysis |
| 7.3 | **Proposed improvements** — Caching layer (Redis), async gRPC, CDN for images | ❌ | Write recommendations |

---

## Deliverables

### 1. Project Report (4000–6000 words)

| # | Component | Status |
|---|-----------|--------|
| D1 | Cover page with group details | ❌ |
| D2 | Table of contents | ❌ |
| D3 | All 7 Parts with clearly labeled sections | ❌ |
| D4 | Architecture diagrams (original) | ❌ |
| D5 | Screenshots of deployment, APIs, cloud console | ❌ |
| D6 | Cost estimation table | ❌ |
| D7 | References in APA format | ❌ |

### 2. Working Cloud Deployment

| # | Component | Status |
|---|-----------|--------|
| D8 | System live during presentation | ✅ | EC2 + S3 + RDS all live and accessible |
| D9 | Lecturer can test functionality | ✅ | Frontend at S3 URL, login with `chamuditha@hospital.com` / `Admin@123` |

### 3. Source Code Repository

| # | Component | Status |
|---|-----------|--------|
| D10 | GitHub/GitLab link | ✅ | https://github.com/ChamudithaAdithya/Patient-Managment-System |
| D11 | Clear README documentation | ✅ Partial | Multiple docs created: `AWS-CICD-SETUP.md`, `IMPLEMENTATION-PLAN.md`, `COMPLETE-WORKFLOW-SCENARIO.md` |

### 4. Group Presentation (15–20 min)

| # | Component | Status |
|---|-----------|--------|
| D12 | Architecture walkthrough slides | ❌ |
| D13 | Live demo (deployed system) | ✅ | System is live and accessible |
| D14 | Technical decisions explained | ❌ |
| D15 | Challenges faced section | ❌ |
| D16 | Every member presents | ❌ |

---

## Summary

| Part | Marks | Completion |
|------|-------|------------|
| Part 1: Cloud Conceptual Analysis | 15 | 0 / 6 tasks |
| Part 2: Cloud Infrastructure Design | 20 | 2.5 / 10 tasks |
| Part 3: Virtualization Implementation | 15 | 7 / 10 tasks |
| Part 4: Cloud Storage & Data Management | 15 | 2.5 / 9 tasks |
| Part 5: Cloud Programming Model | 20 | 10 / 14 tasks |
| Part 6: Security, Governance & Optimization | 10 | 2 / 7 tasks |
| Part 7: Testing & Evaluation | 5 | 0 / 3 tasks |
| **Total** | **100** | **~24 / 59 tasks** |

---

## Recommended Priority Order

1. **Part 5 (Cloud Programming Model)** — Strongest area; capture screenshots. Live deployment ✅.
2. **Part 3 (Virtualization)** — Document what's already built; add screenshots of `docker ps`, network config.
3. **Part 2 (Infrastructure Design)** — Create architecture diagram and cost estimation.
4. **Part 4 (Cloud Storage)** — Add lifecycle policies, backup config, medical images to S3.
5. **Part 1 (Conceptual Analysis)** — Write-up only, no coding needed.
6. **Part 6 (Security)** — Add TLS/HTTPS, enable encryption at rest.
7. **Part 7 (Testing)** — Run load test with k6 and write analysis.
8. **Deliverables** — Report, slides, live demo.
