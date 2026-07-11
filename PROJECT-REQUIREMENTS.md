# Cloud-Based Hospital Management System — Full Assignment Checklist

**Project Scenario:** Option C — Cloud-Based Hospital Management System  
**Existing Codebase:** Patient Management microservices (Spring Boot, React, Docker, Kafka, gRPC, PostgreSQL)  
**Target Cloud Platform:** AWS / Azure / GCP (free-tier)  

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
| 2.2 | **Compute** — Design VM / container / Kubernetes topology | ✅ Partial | Docker Compose exists; needs K8s design or explain container strategy |
| 2.3 | **Networking** — VPC, subnets (public/private), load balancers, DNS | ❌ | Design AWS VPC / Azure VNet with public/private subnets |
| 2.4 | **Storage** — Block (EBS), Object (S3), File (EFS) decisions per use-case | ❌ | Map each service to storage type |
| 2.5 | **Database** — SQL (RDS/Azure SQL) for patient/auth data | ✅ Partial | PostgreSQL used; needs RDS design and replication strategy |
| 2.6 | **Auto-scaling** — Horizontal pod/instance scaling strategy | ❌ | Define scaling policies (CPU/memory triggers) |
| 2.7 | **Monitoring** — CloudWatch / Azure Monitor, logging, alerting | ❌ | Design monitoring stack |
| 2.8 | **Disaster Recovery** — Backup, multi-AZ, RTO/RPO targets | ❌ | Define DR plan |
| 2.9 | **Cost Estimation** — Compute, storage, network, database monthly costs | ❌ | Use AWS Pricing Calculator / Azure Pricing Calculator |

### Architecture Diagram

| # | Task | Status |
|---|------|--------|
| 2.10 | Professional architecture diagram (all components, arrows, labels) | ❌ |

---

## PART 3: Virtualization Implementation (15 Marks)

### System Virtualization

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Deploy all services as Docker containers | ✅ | Already done via docker-compose |
| 3.2 | Push images to container registry (Docker Hub) | ✅ | Images at `chamudithaadithya/patient_management_system` |
| 3.3 | Screenshots of running containers | ❌ | Capture `docker ps` output |
| 3.4 | Explain hypervisor type (Type 1 vs Type 2) and where Docker uses OS-level virtualization | ❌ | Write in report |

### Network Virtualization

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.5 | Use Docker bridge network (`internal-net`) | ✅ | Already configured |
| 3.6 | Configure firewall rules / security groups | ❌ | Add security group design for AWS/Azure |
| 3.7 | Explain SDN concepts applied (overlay networks, Docker bridge/networks) | ❌ | Write in report |

### Storage Virtualization

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.8 | Use Docker volumes / bind mounts for persistent data | ❌ | PostgreSQL containers need persistent volumes |
| 3.9 | Explain software-defined storage concepts | ❌ | Write in report |

### Evidence Screenshots

| # | Task | Status |
|---|------|--------|
| 3.10 | Screenshots of VM/container deployment, network config, storage config | ❌ |

---

## PART 4: Cloud Storage & Data Management (15 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | **Cloud Object Storage** — Configure S3/Azure Blob for medical imaging / documents | ❌ | Set up bucket with lifecycle policies |
| 4.2 | **Database Service** — Deploy PostgreSQL via RDS / Cloud SQL / Azure Database | ✅ Partial | Currently Docker-based; migrate to managed RDS or demonstrate managed DB |
| 4.3 | **Backup Configuration** — Automated backups, point-in-time restore | ❌ | Configure RDS automated backups or pg_dump cron |
| 4.4 | **Data Lifecycle Policies** — Transition older data to colder storage tiers | ❌ | S3 lifecycle rules (Standard → IA → Glacier) |
| 4.5 | **Access Control Policies** — IAM roles, bucket policies, DB user permissions | ❌ | Least-privilege access design |
| 4.6 | Explain **CAP Theorem** relevance for patient DB (consistency over availability?) | ❌ | Write in report |
| 4.7 | Explain **Distributed File System** principles relevant to architecture | ❌ | Write in report |
| 4.8 | Explain **Data Durability** mechanisms (replication, erasure coding, multi-AZ) | ❌ | Write in report |
| 4.9 | **Screenshots** of storage config, backup settings, lifecycle rules | ❌ | |

---

## PART 5: Cloud Programming Model (20 Marks)

The existing codebase already covers **3 areas**. Choose primary focus:

### REST API (Already Implemented)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | REST API for patient CRUD (GET, POST, PUT, DELETE) | ✅ | `PatientController` at `/patients` |
| 5.2 | JWT-based authentication (POST /login) | ✅ | `AuthController` in auth-service |
| 5.3 | API Gateway routing | ✅ | Spring Cloud Gateway at port 4004 |
| 5.4 | API testing screenshots (Postman / HTTP files) | ❌ | Use `api-requests/` files and capture results |

### Containerized Microservices (Already Implemented)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.5 | 5 microservices containerized (patient, billing, analytics, gateway, auth) | ✅ | All have Dockerfiles |
| 5.6 | Inter-service communication (gRPC, Kafka) | ✅ | Patient→Billing via gRPC; Patient→Analytics via Kafka |
| 5.7 | Docker Compose orchestration | ✅ | `docker-compose.yml` |
| 5.8 | Auto-scaling or event-triggered execution | ❌ | Configure or demonstrate K8s HPA or cloud auto-scaling |

### Serverless / Additional

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.9 | Deploy a **serverless function** (AWS Lambda) for notifications or data processing | ❌ | E.g., email notification on patient creation |
| 5.10 | **MapReduce-style** data processing (optional) | ❌ | Could analyze patient data patterns |
| 5.11 | Explain programming model used and why it was chosen | ❌ | Write in report |

### Deployment & Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.12 | Live deployment on cloud (AWS EC2 / ECS / EKS or Azure AKS) | ❌ | Deploy to cloud (not just local Docker) |
| 5.13 | API testing screenshots / Postman collection | ❌ | |
| 5.14 | Code deployment pipeline (CI/CD) | ✅ Partial | GitHub Actions builds patient-service only; expand to all services |

---

## PART 6: Security, Governance & Optimization (10 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | **IAM** — Define roles (Admin, Doctor, Patient) with least-privilege policies | ✅ Partial | Auth service has roles in JWT; no IAM mapping yet |
| 6.2 | **Encryption at rest** — Database encryption, S3 server-side encryption | ❌ | Enable RDS encryption, S3 SSE-S3 or KMS |
| 6.3 | **Encryption in transit** — TLS for all HTTP/gRPC/Kafka traffic | ❌ | Add HTTPS via LB or self-signed certs for dev |
| 6.4 | **Firewall/Security Groups** — Ingress/egress rules per service | ❌ | Define and screenshot security group rules |
| 6.5 | **Cost Optimization** — Right-size instances, reserved instances, auto-scaling | ❌ | Write cost optimization strategy |
| 6.6 | **Monitoring & Logging** — CloudWatch / Azure Monitor dashboards, log aggregation | ❌ | Set up basic monitoring dashboard |
| 6.7 | Screenshots of security configuration | ❌ | |

---

## PART 7: Testing & Evaluation (5 Marks)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | **Performance testing** — Basic load test (e.g., Apache Bench / k6 / Locust) | ❌ | Run load test against `/patients` endpoint |
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
| D8 | System live during presentation | ❌ |
| D9 | Lecturer can test functionality | ❌ |

### 3. Source Code Repository

| # | Component | Status |
|---|-----------|--------|
| D10 | GitHub/GitLab link | ✅ | Already a git repo |
| D11 | Clear README documentation | ✅ Partial | Enhance README with architecture, setup, deployment instructions |

### 4. Group Presentation (15–20 min)

| # | Component | Status |
|---|-----------|--------|
| D12 | Architecture walkthrough slides | ❌ |
| D13 | Live demo (deployed system) | ❌ |
| D14 | Technical decisions explained | ❌ |
| D15 | Challenges faced section | ❌ |
| D16 | Every member presents | ❌ |

---

## Summary

| Part | Marks | Completion |
|------|-------|------------|
| Part 1: Cloud Conceptual Analysis | 15 | 0 / 6 tasks |
| Part 2: Cloud Infrastructure Design | 20 | 1.5 / 10 tasks |
| Part 3: Virtualization Implementation | 15 | 4 / 10 tasks |
| Part 4: Cloud Storage & Data Management | 15 | 0.5 / 9 tasks |
| Part 5: Cloud Programming Model | 20 | 8 / 14 tasks |
| Part 6: Security, Governance & Optimization | 10 | 0.5 / 7 tasks |
| Part 7: Testing & Evaluation | 5 | 0 / 3 tasks |
| **Total** | **100** | **~14 / 59 tasks** |

---

## Recommended Priority Order

1. **Part 5 (Cloud Programming Model)** — Strongest area; write it up and capture screenshots. Deploy to cloud.
2. **Part 2 (Infrastructure Design)** — Create architecture diagram and cost estimation.
3. **Part 3 (Virtualization)** — Document what's already built; add screenshots.
4. **Part 4 (Cloud Storage)** — Set up S3 bucket, RDS, and backup config.
5. **Part 1 (Conceptual Analysis)** — Write-up only, no coding needed.
6. **Part 6 (Security)** — Add TLS, security groups, IAM mapping.
7. **Part 7 (Testing)** — Run load test and write analysis.
8. **Deliverables** — Report, slides, live deployment.
