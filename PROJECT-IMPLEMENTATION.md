# Project Implementation — Cloud-Based Hospital Management System

**Option C:** Cloud-Based Hospital Management System  
**Platform:** AWS (Free Tier)  
**Existing Codebase:** Microservices (Spring Boot 21, Docker, Kafka, gRPC, PostgreSQL)  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Part 1: Cloud Conceptual Analysis](#2-part-1-cloud-conceptual-analysis)
3. [Part 2: Cloud Infrastructure Design](#3-part-2-cloud-infrastructure-design)
4. [Part 3: Virtualization Implementation](#4-part-3-virtualization-implementation)
5. [Part 4: Cloud Storage & Data Management](#5-part-4-cloud-storage--data-management)
6. [Part 5: Cloud Programming Model](#6-part-5-cloud-programming-model)
7. [Part 6: Security, Governance & Optimization](#7-part-6-security-governance--optimization)
8. [Part 7: Testing & Evaluation](#8-part-7-testing--evaluation)
9. [Deliverables](#9-deliverables)
10. [Timeline](#10-timeline)

---

## 1. Architecture Overview

### High-Level System Architecture

```
                          ┌──────────────────────────────────────────┐
                          │            Route 53 / Public DNS         │
                          └────────────────┬─────────────────────────┘
                                           │
                          ┌────────────────▼─────────────────────────┐
                          │        CloudFront (CDN)                  │
                          │  Optional — or use EC2 public IP directly│
                          └────────────────┬─────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────────────┐
                    │                      │                              │
         ┌──────────▼──────────┐  ┌───────▼──────────┐     ┌─────────────▼──────────┐
         │  React Frontend     │  │   API Gateway    │     │  Swagger UI             │
         │  (S3 + CloudFront)  │  │  (Docker on      │     │  (via Gateway)          │
         │                     │  │   EC2 t3.micro)  │     │                         │
         │                     │  │   port 4004      │     │                         │
         └─────────────────────┘  └───────┬──────────┘     └─────────────────────────┘
                                          │
              ┌───────────────────────────┼─────────────────────────────────┐
              │                           │                                 │
   ┌──────────▼──────────┐   ┌───────────▼──────────┐   ┌──────────────────▼──────┐
   │  Patient Service    │   │   Auth Service       │   │  Appointment Service    │
   │  (Docker on         │   │   (Docker on         │   │  (Docker on             │
   │   EC2 t3.micro)    │   │   EC2 t3.micro)     │   │   EC2 t3.micro)         │
   │  port 4000          │   │   port 4005          │   │  port 4006              │
   └──────┬──────┬───────┘   └──────────────────────┘   └─────────────────────────┘
          │      │
     ┌────▼──────▼──────┐          ┌─────────────────────────────────────┐
     │ Billing Service  │          │  Amazon SQS (Free Tier)             │
     │ (Docker on       │──────────►  Topic: "patient" or use Lambda     │
     │  EC2 t3.micro)  │          │  Consumer: Analytics Service         │
     │ gRPC 9001        │          └─────────────────────────────────────┘
     │ HTTP 4001        │
     └──────────────────┘
          │
          │  ┌──────────────────────────────────────────┐
          │  │  Amazon RDS (PostgreSQL Single-AZ)       │
          └──►  db.t4g.micro — FREE TIER ELIGIBLE       │
             │  Databases: patient_management, db_auth   │
             │  Tables: patient, users, appointments     │
             └──────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                         AWS VPC (10.0.0.0/16)                               │
    │                                                                             │
    │  ┌───────────────────────────────────────────────────────────────┐          │
    │  │              Public Subnet (single, one AZ)                   │          │
    │  │  EC2 t3.micro (Docker Compose — all 6 services)              │          │
    │  │  RDS db.t4g.micro (Single-AZ)                                │          │
    │  │  SQS, Lambda, S3 (all outside VPC — no NAT needed)           │          │
    │  └───────────────────────────────────────────────────────────────┘          │
    │                                                                             │
    │  No NAT Gateway  |  No Private Subnets  |  No ALB  |  No Multi-AZ          │
    └─────────────────────────────────────────────────────────────────────────────┘

    Storage:
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ S3: Frontend     │  │ S3: Medical      │  │ S3: Backups      │
    │ + CloudFront CDN │  │     Images       │  │ + Versioning     │
    │ (Free Tier 1TB)  │  │ (Free Tier 5GB)  │  │ (Free Tier 5GB)  │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Diagram Files

The full architecture diagram is available in multiple formats in the `docs/` folder:

| File | Format | How to Open |
|---|---|---|
| `docs/architecture-diagram.drawio` | Draw.io XML | Open at https://app.diagrams.net → File → Open |
| `docs/architecture-diagram.puml` | PlantUML | Install VS Code PlantUML extension or render at https://www.plantuml.com |
| This markdown file (above) | ASCII art | View directly anywhere |

To edit the diagram:
1. Go to https://app.diagrams.net
2. File → Open → Select `docs/architecture-diagram.drawio`
3. Make changes and save (the file will download; replace the existing one)

### Service Communication Matrix

| From | To | Protocol | Port | Format |
|---|---|---|---|---|
| Client → API Gateway | HTTP | 4004 | JSON |
| API Gateway → Patient Service | HTTP | 4000 | JSON |
| API Gateway → Auth Service | HTTP | 4005 | JSON |
| API Gateway → Appointment Service | HTTP | 4006 | JSON |
| Patient Service → Billing Service | gRPC | 9001 | Protobuf |
| Patient Service → Analytics | Kafka / SQS | 9092 / HTTP | Protobuf / JSON |

### Option C Requirements vs. Current State

| Requirement | Status | Action Needed |
|---|---|---|
| Patient Records | ✅ Done | Already implemented |
| Appointment Scheduling | ❌ Missing | Create new `appointment-service` |
| Medical Imaging Storage | ❌ Missing | Add S3 upload endpoint to patient-service |
| Role-Based Access Control | ⚠️ Half-built | Add JWT filter + SecurityConfig to enforce roles |

---

## 2. Part 1: Cloud Conceptual Analysis

This entire part is **written content only** — no implementation needed.

### 2.1 Explain the Cloud Computing Paradigm

Describe in the report:
- **IaaS** — AWS provides virtual compute (EC2), networking (VPC), storage (EBS/S3)
- **PaaS** — Managed services like RDS (PostgreSQL), SQS (messaging), ElastiCache
- **SaaS** — The Hospital Management System itself, delivered as a web application
- **Deployment models** — Public cloud (AWS) with private VPC for network isolation

### 2.2 Benefits of Cloud for Hospital Management

| Benefit | How It Applies To This Project |
|---|---|
| Elasticity | EC2 + Docker Compose can scale vertically; Lambda auto-scales for events |
| Cost-efficiency | EC2 t3.micro is free tier; $3.60/mo for public IP |
| High Availability | RDS Single-AZ with automated backups; EC2 in one AZ |
| Disaster Recovery | Automated RDS snapshots, S3 versioning |
| Global Access | CloudFront CDN for frontend and image delivery |
| Managed Services | RDS, SQS, S3, Lambda — all fully managed by AWS |

### 2.3 Risks

| Risk | Mitigation |
|---|---|
| Data breach | Encryption at rest (S3 SSE-S3, RDS encrypted) + TLS in transit |
| Compliance | Use HIPAA-eligible AWS services; sign AWS BAA |
| Vendor lock-in | Docker containers are portable; PostgreSQL is open-source |
| Downtime | Multi-AZ deployment across 2 Availability Zones |
| Cost overrun | Set AWS Budget alerts; use free tier limits |

### 2.4 Challenges

| Challenge | Solution |
|---|---|
| Legacy system integration | REST APIs with standard JSON format |
| Latency-sensitive operations | CloudFront edge caching; RDS read replicas |
| Regulatory complexity | IAM least-privilege; CloudTrail audit logging |
| Data migration | PostgreSQL pg_dump; S3 bulk import/export |

### 2.5 Justify Cloud Suitability

Argue these points:
1. **Variable load** — Hospital traffic peaks during clinic hours; auto-scaling matches demand
2. **Multi-location access** — Doctors, admin, and patients access from multiple locations
3. **Regulatory compliance** — AWS holds HIPAA BAA, SOC 2, ISO 27001 certifications
4. **Cost** — No upfront hardware cost; pay per use with free tier
5. **Speed** — Deploy new features via CI/CD in minutes

### 2.6 Compliance & Security Concerns

| Concern | AWS Solution |
|---|---|
| Patient data privacy | HIPAA-eligible services; AWS Business Associate Agreement (BAA) |
| Data residency | Choose `us-east-1` or your required region |
| Access control | IAM roles with least privilege; Cognito for patient login |
| Audit trail | CloudTrail logs all API calls; CloudWatch Logs for app logs |
| Encryption | KMS for key management; S3 SSE-S3; RDS encryption |

---

## 3. Part 2: Cloud Infrastructure Design

### 3.1 AWS Service Mapping

| Component | AWS Service | Spec | Free Tier? |
|---|---|---|---|
| Compute | EC2 t3.micro | 1 vCPU, 1 GB RAM, 30 GB EBS, runs Docker Compose with all 6 services | ✅ 750 hrs/mo (12 months) |
| Image Registry | ECR (Public) | 1 repository per service | ✅ Always free (50 GB) |
| Network | VPC | 10.0.0.0/16, 1 public subnet only (no NAT, no private subnets) | ✅ Free |
| Database | RDS PostgreSQL | db.t4g.micro, **Single-AZ** (not Multi-AZ), 20 GB | ✅ 750 hrs/mo (12 months) |
| Object Storage | S3 | 3 buckets: frontend / images / backups | ✅ 5 GB (12 months) |
| CDN | CloudFront | Frontend distribution | ✅ 1 TB/mo (always free) |
| Messaging | SQS | patient-events queue | ✅ 1M requests/mo (always free) |
| Serverless | Lambda | Patient notification function | ✅ 1M requests/mo (always free) |
| DNS | Route 53 | Map domain (optional — skip for free) | ❌ ~$0.50/mo per hosted zone |
| Monitoring | CloudWatch | Logs, metrics, dashboard, alarms | ✅ 10 metrics, 10 alarms (always free) |
| CI/CD | GitHub Actions | Build + push to ECR + SSH deploy to EC2 | ✅ Free for public repos |

**Key cost-saving decisions:**
- **EC2 instead of Fargate** — Fargate has no free tier. EC2 t3.micro is free for 12 months (750 hrs).
- **Single-AZ RDS instead of Multi-AZ** — Multi-AZ is not free tier eligible. Single-AZ db.t4g.micro is free.
- **No NAT Gateway** — EC2 is placed in a public subnet with a public IP. No private subnets needed.
- **No ALB** — Use EC2's public IP directly for API access (or lightweight nginx on the same instance).
- **All 6 Docker services run on one EC2 instance** via Docker Compose — saves compute cost.

### 3.2 Create Architecture Diagram

**Use Draw.io (free) or Lucidchart:**

1. Draw a VPC boundary box labeled "AWS VPC (10.0.0.0/16)"
2. Inside it, draw **one** public subnet (single AZ — cost optimized)
3. Inside the public subnet, draw:
   - **EC2 t3.micro** instance icon labeled "Docker Compose — All 6 Microservices"
   - **RDS db.t4g.micro** icon labeled "PostgreSQL Single-AZ (Free Tier)"
4. Above the VPC, draw:
   - **CloudFront** icon connected to **S3 Frontend** bucket
   - Arrow from User → EC2 public IP:4004 (direct API access)
5. Below/outside VPC, draw:
   - 3 S3 bucket icons (Frontend, Medical Images, Backups)
   - SQS queue icon
   - Lambda function icon
6. Draw arrows showing traffic flow:
   - User → EC2 public IP (REST APIs)
   - User → CloudFront → S3 Frontend (static site)
   - EC2 → RDS (JPA)
   - EC2 → S3 Images (upload/download)
   - EC2 → SQS → Lambda (events)
7. Label all components with ports and free tier status

**Save as:** `docs/architecture-diagram.drawio` (or `.png` for report)

### 3.3 Auto-Scaling Design

**Note:** With a single EC2 t3.micro instance, auto-scaling at the instance level is limited. Instead:

| Layer | Strategy | How |
|---|---|---|
| EC2 Instance | Vertical scaling | Upgrade from t3.micro to t3.small/medium if needed (stop, change type, start) |
| Docker Compose | Restart individual containers | `docker-compose restart <service>` if a service crashes |
| RDS | Storage auto-scaling | Enable storage autoscaling (up to 100 GB max) |
| Lambda | Auto-scales by default | Lambda handles scale automatically — no config needed |
| SQS | Buffer traffic spikes | SQS queues messages when services are busy; services process at their own pace |

For the report, explain that **auto-scaling across multiple EC2 instances** would be implemented in production using an Auto Scaling Group + ALB, but on the free tier, a single t3.micro is sufficient to demonstrate all features.

### 3.4 Disaster Recovery Plan

| Component | Strategy | RTO | RPO |
|---|---|---|---|
| RDS | Automated daily snapshots, 7-day retention | ~30 min | ~24 hrs |
| S3 medical images | Versioning enabled | Seconds | Instant |
| S3 backups | Cross-region replication (optional) | Varies | ~15 min |
| EC2 | AMI backup + user data script to reinstall Docker | ~1 hr | N/A |
| Source code | GitHub repository | Minutes | Instant |

### 3.5 Cost Estimation

| Service | Configuration | Free Tier Status | Monthly Cost |
|---|---|---|---|
| EC2 t3.micro | 1 instance, 24/7, 30 GB EBS | ✅ 750 hrs/mo (12 mo) | **$0** |
| RDS db.t4g.micro | Single-AZ, 20 GB storage | ✅ 750 hrs/mo (12 mo) | **$0** |
| ECR (Public) | 6 repos, ~1 GB total | ✅ Always free (50 GB) | **$0** |
| S3 Standard | 5 GB across 3 buckets | ✅ 5 GB (12 mo) | **$0** |
| CloudFront | 1 TB data transfer | ✅ 1 TB/mo (always free) | **$0** |
| SQS | 1M requests/mo | ✅ Always free | **$0** |
| Lambda | 1M invocations/mo | ✅ Always free | **$0** |
| CloudWatch | 10 metrics + 5 GB logs | ✅ Always free | **$0** |
| GitHub Actions | Public repo, unlimited minutes | ✅ Free | **$0** |
| Public IPv4 (EC2) | 1 address attached to running instance | ❌ $0.005/hr → ~$3.60/mo | **~$3.60** |
| EBS gp3 (30 GB) | Root volume for EC2 | ✅ 30 GB (12 mo) | **$0** |
| **Total Monthly** | | | **~$3.60** |

**What we removed vs. the original plan and why:**

| Removed Service | Original Cost | Why Removed |
|---|---|---|
| ECS Fargate (5 tasks) | ~$30/mo | Replaced with EC2 t3.micro (free tier) — Docker Compose runs all 6 services |
| NAT Gateway | ~$35/mo | Eliminated — EC2 is in a public subnet, no private subnets needed |
| ALB | ~$20/mo | Eliminated — use EC2's public IP directly for API access |
| RDS Multi-AZ | ~$15/mo extra | Changed to Single-AZ (free tier eligible) — Multi-AZ doubles cost |
| **Savings** | **~$100/mo** | |

**$200 free credits:** With a monthly cost of ~$3.60, the $200 credits will last the entire 6-month free plan period with money left over.

---

## 4. Part 3: Virtualization Implementation

### 4.1 What Already Exists

- **Dockerfiles** in each service — multi-stage build (Maven → JDK 21)
- **docker-compose.yml** — orchestrates all 5 services + 2 PostgreSQL + Kafka
- **Docker Hub images** — `chamudithaadithya/patient_management_system` (5 tags)

### 4.2 Add Docker Volumes

**Task:** Edit `docker-compose.yml` to add persistent volume mounts for both PostgreSQL containers.

**How:**
1. Open `docker-compose.yml`
2. For each `db` service, add a `volumes:` block mapping a named volume to `/var/lib/postgresql/data`
3. Declare both volumes in a top-level `volumes:` section
4. Save and run `docker-compose down && docker-compose up -d`

**Files to edit:** `docker-compose.yml`

### 4.3 Push Docker Images to ECR

**Task:** Create ECR repositories and push all service images.

**How:**
1. Open AWS Console → ECR → Create Repository (repeat for each service)
2. Authenticate Docker to ECR:
   - `aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com`
3. For each service:
   - `docker tag <service>:latest <ecr-uri>/<service>:latest`
   - `docker push <ecr-uri>/<service>:latest`

**Screenshots to capture:** ECR repositories list in AWS Console

### 4.4 Deploy to EC2 (instead of ECS)

**Why EC2 instead of ECS Fargate:** Fargate has no free tier. EC2 t3.micro is free for 12 months. We run all 6 Docker services on a single EC2 instance using Docker Compose.

**Step-by-step:**

1. **Launch EC2 instance:**
   - AWS Console → EC2 → Launch Instance
   - Name: `hospital-system`
   - AMI: Ubuntu 24.04 LTS (Free Tier eligible)
   - Instance type: `t3.micro` (Free Tier eligible)
   - Key pair: Create or use existing (save the `.pem` file)
   - Network: Select your VPC + public subnet
   - Auto-assign public IP: Enable
   - Security group: Create new with inbound rules:
     - SSH (22) from your IP
     - Custom TCP (4004) from 0.0.0.0/0 (API Gateway)
   - Storage: 30 GB gp3 (Free Tier eligible)
   - Advanced: Paste this user data script:

```bash
#!/bin/bash
apt-get update -y
apt-get install -y docker.io docker-compose-v2
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu
```

2. **Connect to EC2:**
   - `ssh -i your-key.pem ubuntu@<public-ip>`

3. **Clone the repository and start services:**
   ```bash
   git clone https://github.com/your-org/patient-managment.git
   cd patient-managment
   docker compose up -d
   ```

4. **Verify:**
   - `curl http://localhost:4004/api/patients`
   - Check all containers: `docker ps`

### 4.5 Update CI/CD Pipeline

**Task:** GitHub Actions workflow builds images, pushes to ECR, then SSH into EC2 to pull and restart.

**How:**
1. Open `.github/workflows/CICD Pipline.yml`
2. Add steps:
   - Configure AWS credentials (GitHub Secrets)
   - Login to ECR
   - Build + push all 6 Docker images
   - SSH into EC2 and run:
     ```bash
     cd patient-managment && git pull && docker compose pull && docker compose up -d
     ```

**GitHub Secrets needed:**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`
- `EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`

### 4.5 Screenshots to Capture for Report

| Screenshot | How to Get |
|---|---|
| Running containers on EC2 | `ssh ubuntu@<ip> docker ps` |
| Docker images list on EC2 | `ssh ubuntu@<ip> docker images` |
| Docker volumes | `ssh ubuntu@<ip> docker volume ls` |
| EC2 instance details | AWS Console → EC2 → Instances → `hospital-system` |
| EC2 security group rules | AWS Console → EC2 → Security Groups → `hospital-sg` |
| ECR repositories | AWS Console → ECR → repositories |
| VPC + subnet | AWS Console → VPC → Your VPCs |
| RDS instance | AWS Console → RDS → Databases |
| API test response | `curl http://<ec2-public-ip>:4004/api/patients` in terminal |

### 4.6 Write-Up Topics for Report

**Hypervisor explanation:**
- Docker uses OS-level virtualization (container engine sharing host kernel)
- EC2 uses AWS Nitro hypervisor (Type 1, bare-metal) for t3.micro instances
- Docker runs on EC2 using OS-level virtualization (container engine sharing the host kernel)

**SDN concepts:**
- AWS VPC is software-defined — virtual subnets, route tables, security groups (stateful), NACLs (stateless)

**SDS concepts:**
- Amazon EBS (block) and S3 (object) are software-defined — abstract physical disks
- Durability via replication across multiple devices and AZs

---

## 5. Part 4: Cloud Storage & Data Management

### 5.1 Create S3 Buckets

**Task:** Create 3 S3 buckets for frontend hosting, medical images, and backups.

**How via AWS Console:**
1. Go to S3 → Create bucket
2. **Frontend:** `hospital-frontend-<unique-name>` — enable static website hosting, block public access (use CloudFront OAI)
3. **Images:** `hospital-medical-images-<unique-name>` — block all public access, enable versioning
4. **Backups:** `hospital-backups-<unique-name>` — block public access, enable versioning

**How via CLI:**
```bash
aws s3 mb s3://hospital-frontend-<unique>
aws s3 mb s3://hospital-medical-images-<unique>
aws s3 mb s3://hospital-backups-<unique>
aws s3api put-bucket-versioning --bucket hospital-medical-images-<unique> --versioning-configuration Status=Enabled
```

### 5.2 Configure Lifecycle Policies

**Task:** Set up S3 Lifecycle rules to move old images to cheaper storage tiers.

**How via Console:**
1. Open bucket → Management → Create lifecycle rule
2. Rule 1: Transition objects to Standard-IA after 30 days
3. Rule 2: Transition to Glacier Instant Retrieval after 90 days
4. Expire (delete) objects after 365 days

**Screenshot:** Lifecycle rules configuration page

### 5.3 Set Up RDS PostgreSQL

**Task:** Create a managed PostgreSQL database for the system.

**How via Console:**
1. Go to RDS → Create database
2. Engine: PostgreSQL
3. Template: Free tier
4. DB instance: `db.t4g.micro`
5. Storage: 20 GB, enable storage autoscaling
6. Multi-AZ: Enable
7. VPC security group: Create new (allow port 5432 from ECS security group)
8. Backup retention: 7 days
9. Encryption: Enable

**How via CLI (alternative):**
```bash
aws rds create-db-instance \
  --db-instance-identifier hospital-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <your-password> \
  --allocated-storage 20 \
  --multi-az \
  --backup-retention-period 7 \
  --storage-encrypted
```

**After RDS is created:**
1. Note the endpoint address
2. Connect: `psql -h <endpoint> -U postgres -d postgres`
3. Create databases:
   ```sql
   CREATE DATABASE patient_management;
   CREATE DATABASE db_auth;
   ```

**Screenshot:** RDS instance details page showing endpoint, Multi-AZ, encryption

### 5.4 Add Medical Image Upload Feature

**Task:** Add file upload/download capability to patient-service using S3.

**How to implement — step by step:**

1. **Add AWS SDK dependency** to `patient-service/pom.xml`:
   - Open `pom.xml`
   - Add the `software.amazon.awssdk:s3` dependency (version 2.30.0)
   - Save and rebuild: `mvn clean package`

2. **Create an S3 Configuration class** `config/S3Config.java`:
   - Create a `config/` package inside `com.pm.patientService`
   - Add a `@Configuration` class
   - Define a `@Bean` method returning `S3Client.builder().region(Region.US_EAST_1).credentialsProvider(DefaultCredentialsProvider.create()).build()`
   - This will be auto-injected into services

3. **Create `ImageService.java`** in `service/` package:
   - Inject `S3Client`
   - Method `uploadImage(patientId, file)`:
     - Generate a key: `patients/<patientId>/<uuid>_<originalFilename>`
     - Call `s3Client.putObject()` with content type from `file.getContentType()`
     - Return the S3 object key
   - Method `getImageUrl(patientId, imageKey)`:
     - Use `S3Presigner` to generate a presigned URL (1 hour expiry)
     - Return URL as string

4. **Create `ImageController.java`** in `controller/` package:
   - `POST /patients/{id}/images` — accepts `MultipartFile`, returns S3 key
   - `GET /patients/{id}/images/{imageKey}` — returns presigned URL

5. **Wire in AWS credentials** — the ECS task role will provide permissions via Instance Metadata. For local dev, configure `~/.aws/credentials` or use environment variables.

### 5.5 Create Backup Script

**Task:** Write a script to back up the database to S3.

**Steps:**
1. Create a `scripts/` directory at project root
2. Create `backup-db.sh`:
   - Use `pg_dump` to export the database
   - Upload the `.sql` file to S3 backups bucket with timestamp
   - Delete the local file after upload
3. Test: run `bash scripts/backup-db.sh`
4. (Optional) Set up a cron job or EventBridge rule to run this daily

### 5.6 Write-Up Topics for Report

**CAP Theorem explanation:**
- Our system prioritizes **Consistency (C) and Partition Tolerance (P)** — i.e., CP
- RDS uses synchronous replication (Multi-AZ) — if a write cannot be confirmed, it rolls back
- For a hospital, patient data must be consistent (no conflicting records)
- Availability is achieved via failover, not by relaxing consistency

**Distributed File System principles:**
- Amazon S3 is a distributed key-value object store
- Data is replicated across ≥3 AZs for 99.999999999% durability
- Objects stored flat (key-value), not hierarchical — `/` simulates folders

**Data Durability mechanisms:**
- S3: Erasure coding across multiple devices and AZs
- RDS: Write-Ahead Logging (WAL) + automated daily snapshots
- Multi-AZ: Synchronous standby replica in another AZ

---

## 6. Part 5: Cloud Programming Model

### 6.1 Existing Microservices (Already Implemented)

| Service | Technology | Endpoints | Description |
|---|---|---|---|
| Patient Service | Spring Boot, JPA, gRPC, Kafka | CRUD `/patients` | Patient records management |
| Billing Service | Spring Boot, gRPC | gRPC `CreateBillingAccount` | Mock billing stub |
| Analytics Service | Spring Boot, Kafka | Kafka consumer `"patient"` | Logs patient creation events |
| Auth Service | Spring Boot, Security, JWT | `POST /login` | Generates JWT tokens with role |
| API Gateway | Spring Cloud Gateway | Routes `/api/**` | Single entry point |

### 6.2 Create Appointment Scheduling Service

**Task:** Build a new microservice for appointment management.

**Step-by-step:**

1. **Generate the project skeleton:**
   - Use Spring Initializr (https://start.spring.io/) or IDE
   - Group: `com.pm`, Artifact: `appointment-service`
   - Dependencies: Spring Web, Spring Data JPA, PostgreSQL Driver, Validation, SpringDoc
   - Java 21, Maven
   - Extract to `appointment-service/` folder

2. **Create the `Appointment` entity** in `model/` package:
   - Fields: `id` (UUID, auto-generated), `patientId` (UUID), `doctorId` (UUID), `appointmentDateTime` (LocalDateTime), `status` (Enum), `reason` (String)
   - Use `@Entity`, `@Table(name = "appointments")`

3. **Create `AppointmentStatus` enum** in `model/` package:
   - Values: `SCHEDULED, COMPLETED, CANCELLED, NO_SHOW`

4. **Create `AppointmentRepository`** in `repository/` package:
   - Extend `JpaRepository<Appointment, UUID>`
   - Add methods: `findByPatientId`, `findByDoctorId`, `findByDoctorIdAndAppointmentDateTimeBetween`, `existsByDoctorIdAndAppointmentDateTime`

5. **Create DTOs** in `dto/` package:
   - `AppointmentRequestDTO` — fields: patientId, doctorId, appointmentDateTime, reason (with validation annotations: `@NotNull`, `@Future`, `@NotBlank`)
   - `AppointmentResponseDTO` — fields matching Appointment entity (all readable)

6. **Create `AppointmentMapper`** in `mapper/` package:
   - Static method `toModel(requestDTO)` — maps request to entity (sets status = SCHEDULED)
   - Static method `toDTO(entity)` — maps entity to response

7. **Create `AppointmentService`** in `service/` package:
   - Methods: `getAll()`, `getByPatientId(id)`, `getByDoctorId(id)`, `getById(id)`, `create(dto)`, `cancel(id)`, `complete(id)`, `getAvailableSlots(doctorId, date)`
   - In `create()`: check for time conflicts before saving
   - In `getAvailableSlots()`: return all 30-min slots (8 AM–5 PM) minus booked ones

8. **Create `AppointmentController`** in `controller/` package:
   - `GET /appointments` — list all (optional filters: `?patientId=`, `?doctorId=`)
   - `GET /appointments/{id}` — get by ID
   - `POST /appointments` — create new
   - `PUT /appointments/{id}/cancel` — cancel
   - `PUT /appointments/{id}/complete` — mark complete
   - `GET /appointments/doctor/{doctorId}/available?date=` — available slots

9. **Configure `application.yml`** in `resources/`:
   - Server port: 4006
   - Datasource: PostgreSQL connection (same as patient-service)
   - JPA: `ddl-auto: update`, show SQL, PostgreSQL dialect

10. **Create `Dockerfile`** matching the pattern from other services (multi-stage Maven → JRE)

11. **Test locally:**
    - Run `mvn clean package -DskipTests` in `appointment-service/`
    - Add to `docker-compose.yml` (port 4006, depends on db, network)
    - Run `docker-compose up` and test endpoints with curl/Postman

### 6.3 Update API Gateway Routes

**Task:** Add routes for the new appointment service in the gateway.

**How:**
1. Open `api-getway/src/main/resources/application.yml`
2. Add a new route:
   - ID: `appointment-service-route`
   - Path: `/api/appointments/**`
   - URI: `http://appointment-service:4006`
   - Filter: `StripPrefix=1`
3. Add Swagger UI route for appointment-service API docs
4. Also add missing auth route and patient docs route if not already present
5. Save and rebuild: `mvn clean package` in `api-getway/`

### 6.4 Deploy a Serverless Function (AWS Lambda)

**Task:** Create a Lambda that sends a notification when a patient is created.

**Step-by-step:**

1. **Create a directory** `lambda/patient-notification/`

2. **Initialize Node.js project:**
   - `npm init -y`
   - `npm install @aws-sdk/client-ses`

3. **Write `index.js`:**
   - Export a `handler` function that receives SQS events
   - Loop through `event.Records`
   - Parse each record body (assumes JSON from SQS)
   - Log the patient details: id, name, email
   - (Optional) Send an email via SES

4. **Deploy:**
   - Zip: `zip -r function.zip index.js node_modules`
   - Create Lambda via Console:
     - Runtime: Node.js 20.x
     - Handler: `index.handler`
     - Role: Lambda execution role with SQS read + CloudWatch logs permissions
   - Upload the zip file
   - Create SQS queue: `patient-events`
   - Add SQS trigger to Lambda

5. **Alternative using Console (easier):**
   - Go to Lambda → Create function → Author from scratch
   - Runtime: Node.js 20.x
   - Create a new role with basic permissions
   - Paste the handler code in the inline editor
   - Add SQS trigger from the Designer panel

**Screenshot:** Lambda function configuration page in AWS Console

### 6.5 Programming Model Justification (for Report)

Write about these 4 models used:

1. **Microservices Architecture** — independent deployability, fault isolation, each service scaled independently
2. **Containerization (Docker on EC2)** — portability, consistent runtime across environments
3. **Event-Driven (SQS)** — decouples patient creation from analytics processing; buffers traffic spikes
4. **Serverless (Lambda)** — zero infrastructure for notifications; pay only when patients register

---

## 7. Part 6: Security, Governance & Optimization

### 7.1 Enforce Role-Based Access Control (RBAC)

**Task:** The auth service generates JWT tokens with role claims. Now enforce these roles in patient-service.

**Step-by-step:**

1. **Add dependencies** to `patient-service/pom.xml`:
   - `spring-boot-starter-security`
   - `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (version 0.12.6)

2. **Create `config/JwtAuthFilter.java`:**
   - Extend `OncePerRequestFilter`
   - Read `Authorization: Bearer <token>` header
   - Parse JWT using the same secret key as auth-service (`secret.key` property)
   - Extract `role` claim and `subject` (email)
   - Create `UsernamePasswordAuthenticationToken` with `ROLE_<role>` authority
   - Set it in `SecurityContextHolder`

3. **Create `config/SecurityConfig.java`:**
   - Use `@Configuration` + `@EnableMethodSecurity`
   - Configure `SecurityFilterChain`:
     - Disable CSRF
     - Stateless sessions
     - Authorization rules:
       - `GET /patients` → any authenticated user
       - `POST /patients` → ADMIN or DOCTOR
       - `PUT /patients/**` → ADMIN or DOCTOR
       - `DELETE /patients/**` → ADMIN only
       - Swagger UI → permit all
       - Any other request → authenticated
     - Add `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter`

4. **Add `secret.key`** to `patient-service/src/main/resources/application.yml`:
   - Read from environment variable: `${SECRET_KEY}`
   - Must match the secret key configured in auth-service

5. **Copy the same secret key** to both services' configurations

6. **Test:** Use auth-service `/login` to get a JWT, then call patient endpoints with `Authorization: Bearer <token>`

### 7.2 Encryption Setup

**At rest (all configured during resource creation):**
- **RDS:** Enable `--storage-encrypted` flag (AES-256)
- **S3:** Default SSE-S3 encryption (enabled automatically, free)
- **ECR:** All container images encrypted at rest by default

**In transit:**
1. Request an ACM certificate for your domain (or use default cloud domain)
2. Add an HTTPS listener to your ALB using the ACM certificate
3. (Optional) Redirect HTTP to HTTPS at the ALB level

### 7.3 IAM Roles & Policies

**Task:** Create IAM roles with least-privilege permissions for each service.

| Role | Trusted By | Permissions |
|---|---|---|
| `ecsTaskExecutionRole` | ECS tasks | ECR pull, CloudWatch logs |
| `lambda-execution-role` | Lambda | CloudWatch logs, SQS read |
| `ecsTaskRole-patient` | Patient service tasks | S3 PutObject/GetObject (images bucket), SQS SendMessage |

**How:**
1. AWS Console → IAM → Roles → Create role
2. Select "AWS Service" → "Elastic Container Service" → "ECS Task"
3. Attach policies: `AmazonEC2ContainerRegistryReadOnly`, `CloudWatchLogsFullAccess`
4. For patient service task role: create a custom inline policy allowing `s3:PutObject`, `s3:GetObject` on the images bucket ARN and `sqs:SendMessage` on the queue ARN
5. Reference the role ARN in the ECS task definition under `taskRoleArn`

### 7.4 Security Groups

| Group | Inbound Rules | Outbound |
|---|---|---|
| `alb-sg` | HTTP 80 from 0.0.0.0/0, HTTPS 443 from 0.0.0.0/0 | All |
| `ecs-tasks-sg` | TCP 4000-4006 from `alb-sg` | All |
| `rds-sg` | TCP 5432 from `ecs-tasks-sg` | All |

### 7.5 Cost Optimization Strategies

| Strategy | How to Implement |
|---|---|
| Right-sizing | EC2 t3.micro runs all 6 services via Docker Compose |
| Auto-scaling | Not needed for demo — describe in report as production feature |
| S3 Lifecycle | Transition old medical images to Glacier after 90 days |
| VPC simplicity | Single public subnet — no NAT Gateway cost (~$35/mo saved) |
| Free tier | Use EC2 t3.micro (750 hrs), RDS db.t4g.micro Single-AZ (750 hrs) |
| Stop when idle | Stop EC2 + RDS when not presenting → near-zero cost |

### 7.6 Monitoring & Logging

**Task:** Set up basic monitoring and alerting.

**CloudWatch Dashboard (via Console):**
1. Go to CloudWatch → Dashboards → Create dashboard
2. Add widgets:
   - ECS Service CPU Utilization (line graph, all services)
   - ECS Service Memory Utilization
   - RDS DatabaseConnections
   - ALB RequestCount and 5xx ErrorRate
   - S3 bucket sizes

**CloudWatch Alarms (via Console):**
1. Create alarm: CPU > 80% for 5 minutes on any ECS service
2. Action: Send notification to SNS topic (email)

**Log Groups:**
- ECS task definitions should have `awslogs` log driver configured
- Logs appear in CloudWatch → Log Groups → `/ecs/<service-name>`

**Screenshots:** CloudWatch dashboard view, alarm configuration

---

## 8. Part 7: Testing & Evaluation

### 8.1 Performance Testing with k6

**Task:** Run a basic load test against the deployed API.

**Step-by-step:**

1. **Install k6:** Download from https://k6.io (or `winget install k6` on Windows)

2. **Create a test script** `k6-test.js`:
   - Define stages: ramp up to 5 users over 30s, stay at 20 users for 1 min, ramp down
   - Define thresholds: p95 latency < 2s, error rate < 5%
   - Test 2 endpoints:
     - `GET /api/patients` — check status 200
     - `POST /api/patients` — create a new patient with unique email, check response has id

3. **Run the test:**
   - Local: `k6 run k6-test.js -e BASE_URL=http://localhost:4004/api`
   - Against AWS: `k6 run k6-test.js -e BASE_URL=https://<alb-dns>/api`

4. **Capture results** — k6 outputs summary metrics at the end (avg response time, req/s, p95, error rate)

### 8.2 Metrics to Report

| Metric | Expected | Actual (fill after running) |
|---|---|---|
| Avg response time (GET) | < 500 ms | |
| Avg response time (POST) | < 1000 ms | |
| Max throughput | > 100 req/s | |
| Error rate | < 5% | |
| P95 latency | < 2 s | |
| CPU during load | < 80% | |

### 8.3 System Limitations

| Limitation | Cause | Impact |
|---|---|---|
| Single DB writer | RDS single writer instance (free tier) | Write bottleneck under concurrent creation |
| Synchronous gRPC | Patient-service waits for billing ACK | Slower response on patient creation |
| No caching | No Redis/ElastiCache deployed | Repeated DB queries for same data |
| Unoptimized queries | Missing indexes on email, doctorId, date | Slow lookups at scale |
| Kafka single broker | MSK or local Kafka (single broker) | No HA for event streaming |

### 8.4 Proposed Improvements

| Improvement | Details | Priority |
|---|---|---|
| RDS Read Replica | Offload GET queries to read replica | High |
| Redis Caching (ElastiCache) | Cache frequent patient/appointment lookups | High |
| Async gRPC | Use non-blocking gRPC stub for billing call | Medium |
| DB Indexing | Add indexes on `appointments.doctorId`, `appointments.dateTime`, `patient.email` | Medium |
| CloudFront for Images | Serve medical images through CDN | Medium |
| HikariCP Pool Tuning | Increase max pool size from default 10 | Low |

---

## 9. Deliverables

### 9.1 Report Structure (4000–6000 words)

| Section | Content | Words |
|---|---|---|
| Cover | Project title, group members, date, module | — |
| Table of Contents | Auto-generated | — |
| 1. Introduction | Scenario (Option C), objectives, team roles | 300 |
| 2. Cloud Conceptual Analysis | Paradigm, benefits/risks, justification, compliance (Part 1) | 800 |
| 3. System Architecture | Architecture diagram, AWS mapping, auto-scaling, DR, cost (Part 2) | 1000 |
| 4. Virtualization Implementation | Docker, ECR, ECS, screenshots, hypervisor/SDN/SDS (Part 3) | 700 |
| 5. Cloud Storage & Data | S3, lifecycle, RDS, backup, image upload, CAP theorem (Part 4) | 700 |
| 6. Cloud Programming Model | Microservices, REST APIs, appointment service, Lambda (Part 5) | 1000 |
| 7. Security & Optimization | RBAC, IAM, encryption, security groups, monitoring (Part 6) | 600 |
| 8. Testing & Evaluation | k6 results, limitations, improvements (Part 7) | 500 |
| 9. Conclusion | Summary, challenges faced, lessons learned | 300 |
| References | APA format (10+ sources: AWS docs, Spring docs, cloud computing textbooks) | — |
| Appendices | Full screenshots, key configuration files | — |
| **Total** | | **~5900** |

### 9.2 Final Repository Structure

```
patient-managment/
├── patient-service/          # Patient CRUD + S3 image upload + RBAC
├── billing-service/          # gRPC billing stub
├── analytics-service/        # SQS/Kafka consumer
├── appointment-service/      # NEW: Appointment CRUD + conflict detection
├── api-getway/               # Spring Cloud Gateway
├── auth-service/             # JWT login + role generation
├── frontend/                 # React (optional — can use Swagger UI instead)
├── scripts/
│   └── backup-db.sh          # Database backup to S3
├── lambda/
│   └── patient-notification/ # Serverless Lambda function
├── docs/
│   ├── architecture-diagram.drawio   # Edit at https://app.diagrams.net
│   ├── architecture-diagram.puml     # PlantUML version
│   └── architecture-diagram.png      # Exported screenshot
├── docker-compose.yml        # Local dev orchestration
├── .github/workflows/        # CI/CD pipeline
├── PROJECT-REQUIREMENTS.md   # Full requirement checklist
├── PROJECT-IMPLEMENTATION.md # This file
└── README.md                 # Setup + deployment instructions
```

### 9.3 Presentation (15–20 minutes)

| Slide | Content | Duration | Presenter |
|---|---|---|---|
| 1 | Title slide (project name, team) | 0:30 | All |
| 2 | Problem statement & scenario choice | 1:00 | Member 1 |
| 3 | Cloud paradigm + suitability justification | 2:00 | Member 1 |
| 4 | Architecture overview (diagram walkthrough) | 2:00 | Member 2 |
| 5 | VPC, networking, compute design decisions | 1:30 | Member 2 |
| 6 | Virtualization (Docker, ECR, ECS, CI/CD) | 2:00 | Member 3 |
| 7 | Storage (S3, RDS, lifecycle, backup) | 1:30 | Member 3 |
| 8 | Programming model (microservices, APIs, serverless) | 2:00 | Member 4 |
| 9 | **Live demo** of the deployed system | 3:00 | Member 4 |
| 10 | Security (RBAC, IAM, encryption, monitoring) | 1:30 | Member 5 |
| 11 | Testing results, limitations, improvements | 1:30 | Member 5 |
| 12 | Conclusion, lessons learned, Q&A | 1:30 | All |
| **Total** | | **~20 min** | |

### 9.4 Live Demo Script

1. Open the deployed Swagger UI or Postman
2. **Login** using auth-service with a DOCTOR role user → get JWT
3. **Create a new patient** → show response with patient ID
4. **Upload a medical image** for that patient → show S3 key returned
5. **Schedule an appointment** using the patient ID and a doctor ID → show confirmation
6. **View all appointments** for that patient → verify it appears
7. **Test RBAC** — try DELETE without admin JWT → show 403 Forbidden
8. Show **CloudWatch dashboard** with live metrics

---

## 10. Timeline

| Day | Phase | Tasks | Suggested Owners |
|---|---|---|---|
| **Day 1** | Setup | AWS account, IAM user, CLI, VPC, subnets, security groups | All |
| **Day 2** | Appointment Service | Generate project, create entity, repository, DTOs, mapper, service, controller, Dockerfile | Member 1-2 |
| **Day 3** | Images + RBAC | Add S3 deps, config, ImageService, ImageController, JWT filter, SecurityConfig | Member 3-4 |
| **Day 4** | Deploy to AWS | Push images to ECR, create ECS cluster, task definitions, services, ALB | All |
| **Day 5** | Storage + Serverless | S3 buckets, lifecycle, RDS, backup script, Lambda function | Member 2-3 |
| **Day 6** | Security + Monitoring | IAM policies, ACM/HTTPS, CloudWatch dashboard + alarms | Member 4-5 |
| **Day 7** | Testing | Install k6, write test script, run against deployed system, capture results | All |
| **Day 8** | Report | Write all 7 parts, insert diagrams + screenshots, format in APA | All (divide sections) |
| **Day 9** | Presentation | Create slides, finalize live demo, rehearse timing | All |

---

## Quick Reference — Implementation Commands

### Build All Services Locally

```bash
for dir in patient-service billing-service analytics-service api-getway auth-service appointment-service; do
  (cd $dir && mvn clean package -DskipTests)
done
```

### Run with Docker Compose

```bash
docker-compose up --build
```

### Test Endpoints

```bash
curl http://localhost:4004/api/patients
curl http://localhost:4004/api/appointments
curl -X POST http://localhost:4005/login -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"admin"}'
```

### Push to ECR & Deploy to ECS

```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com
./docker_push_all.sh
aws ecs update-service --cluster hospital-cluster --service patient-service --force-new-deployment
```

### Run Load Test

```bash
k6 run k6-test.js -e BASE_URL=https://<alb-dns>/api
```

---

**End of Project Implementation**
