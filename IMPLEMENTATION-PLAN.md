# Implementation Plan — Cloud-Based Hospital Management System (AWS)

**Group Project — Cloud Computing**  
**Chosen Scenario:** Option C — Cloud-Based Hospital Management System  
**Cloud Platform:** Amazon Web Services (AWS) — Free Tier Eligible  

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [AWS Service Mapping](#2-aws-service-mapping)
3. [Phase 1: Foundation — Conceptual & Design](#3-phase-1-foundation--conceptual--design)
4. [Phase 2: Build — Virtualization & Containers](#4-phase-2-build--virtualization--containers)
5. [Phase 3: Deploy — Cloud Infrastructure](#5-phase-3-deploy--cloud-infrastructure)
6. [Phase 4: Storage & Data](#6-phase-4-storage--data)
7. [Phase 5: Programming Model & Serverless](#7-phase-5-programming-model--serverless)
8. [Phase 6: Security & Monitoring](#8-phase-6-security--monitoring)
9. [Phase 7: Testing & Evaluation](#9-phase-7-testing--evaluation)
10. [Phase 8: Deliverables — Report & Presentation](#10-phase-8-deliverables--report--presentation)
11. [Cost Estimation](#11-cost-estimation)
12. [Timeline](#12-timeline)

---

## 1. High-Level Architecture

```
                                ┌─────────────────────────┐
                                │   Route 53 (DNS)        │
                                └─────────┬───────────────┘
                                          │
                                ┌─────────▼───────────────┐
                                │  CloudFront / ALB       │
                                │  (HTTPS termination)    │
                                └─────────┬───────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
              ┌───────────▼───────────┐       ┌───────────▼───────────┐
              │   React Frontend      │       │  API Gateway          │
              │   (S3 + CloudFront)   │       │  (ECS Fargate)        │
              │   port 80/443         │       │  port 4004            │
              └───────────────────────┘       └───────────┬───────────┘
                                                          │
                          ┌───────────────────────────────┼───────────────────────────────┐
                          │                               │                               │
              ┌───────────▼───────────┐       ┌───────────▼───────────┐       ┌───────────▼───────────┐
              │  Patient Service      │       │  Auth Service         │       │  Analytics Service    │
              │  (ECS Fargate)        │       │  (ECS Fargate)        │       │  (ECS Fargate)        │
              │  port 4000            │       │  port 4005            │       │  port 4002            │
              └───────┬───────┬───────┘       └───────────────────────┘       └───────────────────────┘
                      │       │
                      │  ┌────▼────────────┐          ┌─────────────────────────┐
                      │  │ Billing Service  │          │  Amazon MSK (Kafka)     │
                      │  │ (ECS Fargate)    │──────────►  Topic: "patient"      │
                      │  │ gRPC port 9001   │          │  Consumer: analytics   │
                      │  │ HTTP port 4001   │          └─────────────────────────┘
                      │  └─────────────────┘
                      │
                      │  ┌─────────────────────────────┐
                      │  │  Amazon RDS (PostgreSQL)    │
                      └──►  Databases: patient, auth  │
                         └─────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                     AWS VPC (10.0.0.0/16)                                   │
    │  ┌─────────────────────────┐          ┌────────────────────────────────┐   │
    │  │  Public Subnets (x2 AZ) │          │  Private Subnets (x2 AZ)       │   │
    │  │  - ALB                  │          │  - ECS Fargate Tasks           │   │
    │  │  - NAT Gateway          │          │  - RDS (db)                    │   │
    │  │  - Bastion Host (dev)   │          │  - Amazon MSK                  │   │
    │  └─────────────────────────┘          └────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────────────────┘

    Storage:
    ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ S3 Bucket    │  │ S3 Bucket        │  │ ECR (Container   │
    │ (Static Web) │  │ (Medical Images) │  │  Registry)       │
    └──────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 2. AWS Service Mapping

| Existing Component | AWS Service | Purpose |
|---|---|---|
| Docker containers | **ECS Fargate** | Serverless containers — no EC2 management |
| Docker image registry | **ECR (Elastic Container Registry)** | Store Docker images |
| Docker Compose networking | **VPC + Public/Private Subnets** | Isolate services |
| PostgreSQL (Docker) | **Amazon RDS (PostgreSQL)** | Managed database with Multi-AZ |
| Kafka (self-hosted) | **Amazon MSK** or **SQS + SNS** | Managed event streaming |
| Spring Cloud Gateway | **AWS ALB (Application Load Balancer)** + **CloudFront** | External traffic routing, HTTPS |
| File storage (none) | **S3 + Lifecycle Policies** | Medical images, documents |
| Monitoring (none) | **CloudWatch + X-Ray** | Logs, metrics, tracing |
| JWT auth | **Cognito** (optional) or keep existing | Identity management |
| CI/CD | **CodePipeline + CodeBuild** | Automated deployment |
| DNS | **Route 53** | Domain name |
| React frontend | **S3 + CloudFront** | Static site hosting |

---

## 3. Phase 1: Foundation — Conceptual & Design

### 3.1 Part 1 — Cloud Conceptual Analysis (Report Only)

This is purely written. No code changes needed.

**To write:**
- Overview of IaaS, PaaS, SaaS and where each component fits
- Benefits: elasticity (auto-scaling), pay-per-use, disaster recovery (Multi-AZ), global access
- Risks: data breaches (mitigate with encryption), downtime (mitigate with Multi-AZ), vendor lock-in
- Challenges: latency (use CloudFront), compliance (HIPAA-eligible services)
- Cloud suitability: justify using AWS for hospital system — HIPAA eligibility, 99.99% RDS SLA, encryption, IAM
- Compliance: HIPAA, GDPR, data residency (select specific AWS region)

---

### 3.2 Part 2 — Cloud Infrastructure Design

**Deliverable:** Architecture diagram + component explanations + cost estimation

#### Architecture Diagram

Create using **Draw.io** or **Lucidchart** (free):
1. Draw the VPC with public/private subnets across 2 AZs
2. Place ALB in public subnets
3. Place ECS Fargate services in private subnets
4. Draw RDS in private subnets (Multi-AZ)
5. Draw S3 buckets, CloudFront, Route 53
6. Draw MSK/Kafka topic
7. Draw arrows showing data flow
8. Label all components clearly

**Reference AWS architecture:** Search "AWS 3-tier architecture VPC" for inspiration.

#### Component Explanations

Write 2–3 sentences for each:
- **VPC:** Isolated network, 10.0.0.0/16, public subnets for ALB, private for everything else
- **ALB:** Distributes traffic across ECS tasks, terminates HTTPS
- **ECS Fargate:** Serverless container orchestration, auto-scales based on CPU/memory
- **RDS:** Managed PostgreSQL, Multi-AZ for HA, automated backups with 7-day retention
- **S3:** Object storage for medical images with lifecycle policies (Standard → IA → Glacier)
- **CloudFront:** CDN — static assets and API caching, DDoS protection
- **MSK:** Managed Kafka for event-driven analytics
- **CodePipeline:** CI/CD from GitHub to ECS

#### Auto-scaling Design

| Service | Metric | Scale Out | Scale In |
|---------|--------|-----------|----------|
| Patient Service | CPU > 70% | +1 task | CPU < 30% → -1 |
| Auth Service | CPU > 70% | +1 task | CPU < 30% → -1 |
| Analytics Service | Queue depth > 100 | +1 task | < 10 → -1 |

#### Disaster Recovery

| Item | Target |
|------|--------|
| RPO (Recovery Point Objective) | 5 minutes (RDS automated backups) |
| RTO (Recovery Time Objective) | 15 minutes (Multi-AZ failover) |
| Backup retention | 7 days (RDS), 30 days (S3 versioning) |
| Cross-region DR | Optional — S3 Cross-Region Replication |

#### Cost Estimation Table (AWS Free Tier)

| Service | Free Tier Limit | Monthly Cost (free tier) | Post-Free Tier Estimate |
|---|---|---|---|
| ECS Fargate | 750 vCPU-hours/month | $0 | ~$30/month |
| ALB | 750 hours/month | $0 | ~$20/month |
| RDS (db.t4g.micro) | 750 hours/month (12 months) | $0 | ~$15/month |
| S3 (5GB) | 5GB standard storage | $0 | ~$0.50/month |
| CloudFront (1TB) | 1TB transfer/month | $0 | ~$0.085/GB |
| MSK (broker) | Not free | ~$40/month | ~$40/month |
| ECR | 500MB | $0 | ~$0.10/GB |
| CodePipeline | 1 free pipeline | $0 | ~$1/month |
| CloudWatch (10 metrics) | 10 metrics | $0 | ~$0.30/month |
| NAT Gateway | Not free | ~$35/month | ~$35/month |
| **Total** | | **~$0** (with MSK alternative below) | **~$142/month** |

**Cost-saving alternative for MSK:** Replace MSK with **SQS + SNS** (free tier: 1M requests). This reduces cost to **~$0** for the free tier period.

---

## 4. Phase 2: Build — Virtualization & Containers

### 4.1 Part 3 — Virtualization Implementation

#### What's already done:
- All services have Dockerfiles (multi-stage build with Maven + JDK 21)
- Docker Compose orchestrates all services
- Docker images pushed to Docker Hub

#### What needs to be added:

**A. Docker volumes for persistent data**

Edit `docker-compose.yml` to add volumes for PostgreSQL:

```yaml
services:
  db:
    image: postgres:latest
    volumes:
      - postgres_patient_data:/var/lib/postgresql/data
    # ...

  db_auth:
    image: postgres:latest
    volumes:
      - postgres_auth_data:/var/lib/postgresql/data
    # ...

volumes:
  postgres_patient_data:
  postgres_auth_data:
```

**B. Push all images to ECR (Elastic Container Registry)**

```bash
# 1. Create ECR repositories
aws ecr create-repository --repository-name patient-service
aws ecr create-repository --repository-name billing-service
aws ecr create-repository --repository-name analytics-service
aws ecr create-repository --repository-name api-getway
aws ecr create-repository --repository-name auth-service

# 2. Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag and push each image
docker tag patient-service:latest <account>.dkr.ecr.us-east-1.amazonaws.com/patient-service:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/patient-service:latest
# Repeat for billing-service, analytics-service, api-getway, auth-service
```

**C. Update CI/CD to build and push to ECR**

Modify `.github/workflows/CICD Pipline.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Build all services
        run: |
          for dir in patient-service billing-service analytics-service api-getway auth-service; do
            cd $dir
            mvn clean package -DskipTests
            cd ..
          done

      - name: Build and push all Docker images
        run: |
          for service in patient-service billing-service analytics-service api-getway auth-service; do
            docker build -t $service ./$service
            docker tag $service:latest $ECR_REGISTRY/$service:latest
            docker push $ECR_REGISTRY/$service:latest
          done

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster hospital-cluster --service patient-service --force-new-deployment
          aws ecs update-service --cluster hospital-cluster --service billing-service --force-new-deployment
          aws ecs update-service --cluster hospital-cluster --service analytics-service --force-new-deployment
          aws ecs update-service --cluster hospital-cluster --service api-getway --force-new-deployment
          aws ecs update-service --cluster hospital-cluster --service auth-service --force-new-deployment
```

#### Screenshots to capture (for report):

| Screenshot | How to Get |
|---|---|
| Running containers locally | `docker ps` in terminal |
| Docker images list | `docker images` |
| Docker volumes list | `docker volume ls` |
| ECR repository images | AWS Console → ECR → repo → images |
| ECS running tasks | AWS Console → ECS → cluster → tasks |
| VPC/subnets | AWS Console → VPC → Your VPCs |
| Security groups | AWS Console → EC2 → Security Groups |

#### Hypervisor / SDN / SDS explanation write-up:

- **Hypervisor:** Docker uses OS-level virtualization (container engine) — no hypervisor needed. If using EC2, it uses Nitro hypervisor (Type 1).
- **SDN:** AWS VPC implements SDN — virtual networks, subnets, route tables, security groups (stateful firewalls).
- **SDS:** Amazon EBS (block storage for EC2) and S3 (object storage) are software-defined — abstract physical hardware, provide durability via replication.

---

## 5. Phase 3: Deploy — Cloud Infrastructure

### 5.1 Set up AWS Account & CLI

```bash
# Install AWS CLI (if not installed)
winget install Amazon.AWSCLI

# Configure
aws configure
# Enter: AWS Access Key ID, Secret Access Key, region: us-east-1, format: json
```

### 5.2 Create VPC & Networking

Use AWS Console or CloudFormation. Easiest: use **VPC Wizard** with Public and Private Subnets.

**Manual steps via Console:**
1. Create VPC: `10.0.0.0/16`
2. Create 2 public subnets: `10.0.1.0/24` (us-east-1a), `10.0.2.0/24` (us-east-1b)
3. Create 2 private subnets: `10.0.3.0/24` (us-east-1a), `10.0.4.0/24` (us-east-1b)
4. Create Internet Gateway + attach to VPC
5. Create NAT Gateway in public subnet (or use VPC endpoints for cost saving)
6. Create route tables: public (IGW), private (NAT)
7. Create Security Groups:

| Security Group | Rules |
|---|---|
| `alb-sg` | Inbound: 443 from 0.0.0.0/0, 80 from 0.0.0.0/0 |
| `ecs-tasks-sg` | Inbound: 4000,4001,4002,4004,4005 from `alb-sg` |
| `rds-sg` | Inbound: 5432 from `ecs-tasks-sg` |
| `msk-sg` | Inbound: 9092,9094 from `ecs-tasks-sg` |

### 5.3 Create ECS Cluster (Fargate)

```bash
aws ecs create-cluster --cluster-name hospital-cluster
```

For each service, create:
- **Task Definition** (JSON)
- **Service** (attached to ALB target group)

#### Task Definition Example (patient-service):

```json
{
  "family": "patient-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::xxx:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "patient-service",
      "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/patient-service:latest",
      "portMappings": [{"containerPort": 4000, "protocol": "tcp"}],
      "environment": [
        {"name": "SPRING_DATASOURCE_URL", "value": "jdbc:postgresql://<rds-endpoint>:5432/patient_management"},
        {"name": "SPRING_DATASOURCE_USERNAME", "value": "postgres"},
        {"name": "SPRING_DATASOURCE_PASSWORD", "value": "<from-secrets-manager>"},
        {"name": "KAFKA_BOOTSTRAP_SERVERS", "value": "<msk-broker>:9092"},
        {"name": "BILLING_SERVICE_ADDRESS_LOCALHOST", "value": "billing-service"},
        {"name": "BILLING_SERVICE_GRPC_PORT", "value": "9001"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/patient-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

> **Note:** Replace `billing-service` hostname with the private IP of the billing service task (for gRPC, use Service Connect or Cloud Map).

For ECS networking between containers (gRPC), use **ECS Service Connect** — this gives each service a DNS name within the cluster:

```bash
aws ecs create-service \
  --cluster hospital-cluster \
  --service-name patient-service \
  --task-definition patient-service \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-private-1,subnet-private-2],securityGroups=[sg-ecs-tasks]}" \
  --service-connect-configuration "enabled=true,namespace=hospital"
```

With Service Connect, billing-service is reachable at `billing-service:9001` from any other service.

### 5.4 Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name hospital-alb \
  --subnets subnet-public-1 subnet-public-2 \
  --security-groups sg-alb

# Create target groups (one per service)
aws elbv2 create-target-group \
  --name tg-patient \
  --protocol HTTP --port 4000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /patients

# Repeat for auth-service (port 4005, health /login)

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:...tg-patient
```

**For the API Gateway service** — you can either:
- **Option A:** Deploy Spring Cloud Gateway on ECS and route through ALB (preserve existing architecture)
- **Option B:** Replace with **AWS API Gateway** + **VPC Link** to ECS NLB (fully managed, serverless)

**Recommendation:** Option A is simpler — keep Spring Cloud Gateway on ECS. The ALB forwards `/api/*` to the gateway.

### 5.5 Create RDS (PostgreSQL)

```bash
aws rds create-db-instance \
  --db-instance-identifier hospital-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-rds \
  --db-subnet-group-name hospital-db-subnet-group \
  --backup-retention-period 7 \
  --auto-minor-version-upgrade \
  --storage-encrypted
```

**Create databases:**
```sql
CREATE DATABASE patient_management;
CREATE DATABASE db_auth;
```

### 5.6 Set up Amazon MSK (Kafka)

```bash
# Simple approach — use SQS+SNS instead (free tier, simpler)
aws sqs create-queue --queue-name patient-events
```

**Why SQS+SNS is better for this project:**
- MSK minimum cost: ~$40/month
- SQS free tier: 1M requests/month
- No need for Kafka-specific features (retention, partitions, replay) for this use-case
- Existing Kafka code can be replaced with SQS listener

**Alternative:** Keep Kafka but use local Docker for demo, skip MSK.

**Recommendation (report justification):** "We chose SQS over MSK due to cost constraints of the free tier. SQS provides exactly-once delivery and integrates natively with CloudWatch. For a production hospital system, MSK would be used for log retention and replay capabilities."

### 5.7 Domain & CDN (Optional but impressive)

1. Register domain via Route 53 (or use a free `.tk` domain)
2. Request ACM certificate: `*.yourdomain.com`
3. Create CloudFront distribution pointing to ALB
4. Set up Route 53 alias record → CloudFront

---

## 6. Phase 4: Storage & Data

### 6.1 S3 Buckets

Create buckets via Console or CLI:

```bash
# Bucket 1: Medical images (private)
aws s3api create-bucket --bucket hospital-medical-images --region us-east-1

# Bucket 2: Static website (Frontend)
aws s3api create-bucket --bucket hospital-frontend --region us-east-1

# Block public access for medical images
aws s3api put-public-access-block --bucket hospital-medical-images \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning --bucket hospital-medical-images --versioning-configuration Status=Enabled
```

#### Lifecycle Policies

```json
// hospital-medical-images lifecycle
{
  "Rules": [
    {
      "Id": "tier-transition",
      "Status": "Enabled",
      "Transitions": [
        {"Days": 30, "StorageClass": "STANDARD_IA"},
        {"Days": 90, "StorageClass": "GLACIER_INSTANT_RETRIEVAL"}
      ],
      "Expiration": {"Days": 365}
    }
  ]
}
```

#### Frontend Hosting (S3 + CloudFront)

```bash
# Build React app
cd frontend
npm install
npm run build

# Upload to S3
aws s3 sync dist/ s3://hospital-frontend/

# Enable static website hosting
aws s3 website s3://hospital-frontend/ --index-document index.html --error-document index.html

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name hospital-frontend.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

#### Medical Image Upload API

Add a new endpoint to Patient Service:

```java
@PostMapping("/patients/{id}/images")
public ResponseEntity<String> uploadImage(
    @PathVariable UUID id,
    @RequestParam("file") MultipartFile file) {
    
    String key = "patients/" + id + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
    
    PutObjectRequest request = PutObjectRequest.builder()
        .bucket("hospital-medical-images")
        .key(key)
        .build();
    
    s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
    
    return ResponseEntity.ok(key);
}
```

Add dependency to `pom.xml`:
```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.30.0</version>
</dependency>
```

### 6.2 Backup Configuration

**RDS Automated Backups:**
- Already enabled with `--backup-retention-period 7`
- Point-in-time restore within 7 days

**S3 Versioning:**
- Already enabled above
- Allows restoring deleted/overwritten objects

**Script for manual DB dump (for report):**
```bash
pg_dump -h <rds-endpoint> -U postgres -d patient_management > backup_$(date +%Y%m%d).sql
aws s3 cp backup_*.sql s3://hospital-backups/db/
```

---

## 7. Phase 5: Programming Model & Serverless

### 7.1 What's Already Working

| Feature | Status |
|---|---|
| REST API (patient CRUD) | ✅ Working |
| JWT Authentication | ✅ Working |
| gRPC (patient→billing) | ✅ Working |
| Kafka events (patient→analytics) | ✅ Working |
| Spring Cloud Gateway | ✅ Working |
| Docker containers | ✅ Working |

### 7.2 What to Add

#### A. Serverless Function — AWS Lambda

Add a Lambda that sends an email notification when a patient is created.

**Option 1: Trigger from SQS**
1. Patient Service publishes to SQS (instead of Kafka)
2. Lambda triggers on SQS messages
3. Lambda logs notification (or sends SES email)

**Lambda code (Node.js):**

```javascript
exports.handler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log(`New patient registered: ${body.name} (${body.email})`);
    
    // In production, send via SES:
    // await ses.sendEmail({ ... }).promise();
  }
  return { statusCode: 200 };
};
```

**Deploy:**

```bash
# Create Lambda function
aws lambda create-function \
  --function-name patient-notification \
  --runtime nodejs20.x \
  --role arn:aws:iam::xxx:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip

# Create SQS trigger
aws lambda create-event-source-mapping \
  --function-name patient-notification \
  --event-source-arn arn:aws:sqs:us-east-1:xxx:patient-events
```

**Update Patient Service to use SQS (optional, for full integration):**

Replace Kafka producer with SQS in `pom.xml`:
```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>sqs</artifactId>
    <version>2.30.0</version>
</dependency>
```

```java
// In PatientServiceImpl, after saving patient:
sqsClient.sendMessage(SendMessageRequest.builder()
    .queueUrl("https://sqs.us-east-1.amazonaws.com/xxx/patient-events")
    .messageBody(new ObjectMapper().writeValueAsString(patientEvent))
    .build());
```

#### B. Serverless Analytics (optional upgrade)

Replace Analytics Service's Kafka consumer with Lambda:

1. Keep Kafka topic (or SQS)
2. Lambda triggers on messages and logs to CloudWatch
3. Or Lambda writes processed data to DynamoDB for dashboards

#### C. Demo Script

Create a Postman collection (`api-requests/` already has some) with:
1. Login → get JWT (from auth-service)
2. Create patient (with image upload)
3. Get all patients
4. Update patient
5. Delete patient

Run from terminal using `newman`:
```bash
newman run collection.json --env-var "baseUrl=https://<alb-dns>/api"
```

### 7.3 Programming Model Justification (for Report)

The system implements:
- **Microservices architecture** (decomposed monolith → independent services)
- **Containerization** (Docker + ECS Fargate — no server management)
- **Event-driven** (Kafka/SQS for async communication)
- **RESTful APIs** (standard HTTP for CRUD)
- **Serverless** (Lambda for event notifications)

Why this model: Microservices enable independent scaling of patient vs. auth services. Event-driven architecture decouples analytics from patient service. Serverless handles sporadic notifications without provisioning infrastructure.

---

## 8. Phase 6: Security & Monitoring

### 8.1 Identity & Access Management (IAM)

Create IAM roles with least privilege:

```bash
# ECS Task Execution Role (pulls images, writes logs)
# Already created by ECS wizard — grants ECR pull + CloudWatch logs

# Lambda Execution Role
aws iam create-role --role-name lambda-execution-role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam attach-role-policy --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSQSFullAccess
```

**IAM policy for patient service (S3 + SQS):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::hospital-medical-images/*"
    },
    {
      "Effect": "Allow",
      "Action": ["sqs:SendMessage"],
      "Resource": "arn:aws:sqs:us-east-1:xxx:patient-events"
    }
  ]
}
```

### 8.2 Encryption

**At rest:**
- RDS: `--storage-encrypted` enables AES-256 encryption
- S3: Default SSE-S3 (or SSE-KMS for report)
- ECR: Images encrypted at rest by default

**In transit:**
- ALB: Configure HTTPS listener with ACM certificate
- RDS: `rds.force_ssl=1` parameter in parameter group
- gRPC: Enable TLS (add `.usePlaintext()` → `.useTransportSecurity()`)

Add HTTPS to ALB:

```bash
# Request ACM certificate
aws acm request-certificate --domain-name api.hospital-system.com

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<acm-arn> \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>
```

### 8.3 Firewall / Security Groups

| Security Group | Inbound Rules | Outbound |
|---|---|---|
| `alb-sg` | HTTP 80 (0.0.0.0/0), HTTPS 443 (0.0.0.0/0) | All |
| `ecs-tasks-sg` | 4000,4001,4002,4004,4005 from `alb-sg` | All |
| `rds-sg` | 5432 from `ecs-tasks-sg` | All |
| `msk-sg` | 9092,9094 from `ecs-tasks-sg` | All |

### 8.4 Cost Optimization Strategy

| Strategy | Implementation |
|---|---|
| Right-size instances | Use `db.t4g.micro` (free tier), Fargate 512/1024 |
| Auto-scaling | Scale to 0 at night (optional for project demo) |
| S3 lifecycle | Transition old medical images to Glacier |
| NAT Gateway cost | Use VPC endpoints for S3 (free) instead of NAT |
| Reserved instances | Not needed for project (free tier) |
| Delete after presentation | Set CloudFormation stack + schedule deletion |

### 8.5 Monitoring & Logging

**CloudWatch Dashboard:**
Create a dashboard with:
- ECS Service CPU/Memory utilization (line graphs)
- RDS connections
- ALB request count + 5xx errors
- S3 bucket size
- Lambda invocations

```bash
# Create log groups for each ECS service (already in task def)
aws logs create-log-group --log-group-name /ecs/patient-service
aws logs create-log-group --log-group-name /ecs/billing-service
aws logs create-log-group --log-group-name /ecs/analytics-service
aws logs create-log-group --log-group-name /ecs/api-getway
aws logs create-log-group --log-group-name /ecs/auth-service
```

**CloudWatch Alarms:**
```bash
# Alert if CPU > 80% for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-patient-service \
  --alarm-description "Patient service CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=patient-service \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:xxx:alerts
```

---

## 9. Phase 7: Testing & Evaluation

### 9.1 Performance Testing

Use **k6** (free, scriptable) or **Apache Bench**:

```bash
# Install k6
winget install k6

# Create test script test.js
cat > test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up to 10 users
    { duration: '1m', target: 10 },   // stay at 10 users
    { duration: '30s', target: 0 },   // ramp down
  ],
};

export default function () {
  const res = http.get('https://<alb-dns>/api/patients');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF

# Run test
k6 run test.js
```

**Expected output to capture for report:**
- Average response time
- Requests per second
- Error rate
- P95/P99 latency

### 9.2 System Limitations Analysis

| Limitation | Cause | Impact |
|---|---|---|
| Single DB instance | RDS single-AZ (free tier) | No failover if AZ fails |
| gRPC synchronous call | Patient waits for billing ACK | Slower patient creation under load |
| No caching | No Redis/memcached | Repeated DB queries for same patients |
| Kafka single broker | MSK single broker (cost) | No HA for event streaming |
| No CDN for images | Direct S3 downloads | Higher latency for large images |

### 9.3 Proposed Improvements

| Improvement | Priority | Effort |
|---|---|---|
| Add Redis caching (ElastiCache) | High | Medium |
| Make gRPC async (non-blocking stub) | High | Low |
| Implement CDN for image delivery (CloudFront + S3) | Medium | Low |
| Multi-AZ RDS | Medium | Low (just enabled) |
| Index DB columns (email, registeredDate) | Medium | Low |
| Add connection pooling (HikariCP already default) | Low | None |

---

## 10. Phase 8: Deliverables — Report & Presentation

### 10.1 Report Structure (4000–6000 words)

Write each section based on the implementation above.

| Section | Content | Est. Words |
|---|---|---|
| Cover Page | Project title, group members, date | — |
| Table of Contents | Auto-generated | — |
| 1. Introduction | Scenario, objectives | 300 |
| 2. Cloud Conceptual Analysis | Part 1 content | 800 |
| 3. System Architecture | Part 2 content + diagram | 800 |
| 4. Virtualization Implementation | Part 3 content + screenshots | 600 |
| 5. Cloud Storage & Data Management | Part 4 content + screenshots | 700 |
| 6. Cloud Programming Model | Part 5 content + screenshots | 1000 |
| 7. Security & Optimization | Part 6 content + screenshots | 500 |
| 8. Testing & Evaluation | Part 7 content + charts | 400 |
| 9. Conclusion | Summary, lessons learned | 300 |
| References | APA format | — |
| Appendices | Additional screenshots, logs | — |
| **Total** | | **~5400** |

### 10.2 Presentation Slides (15–20 min)

| Slide | Content | Presenter | Duration |
|---|---|---|---|
| 1 | Title slide | — | 0.5 min |
| 2 | Problem statement & chosen scenario | Member 1 | 1 min |
| 3 | Cloud paradigm & suitability | Member 1 | 2 min |
| 4 | Architecture overview diagram | Member 2 | 2 min |
| 5 | VPC, networking, compute design | Member 2 | 2 min |
| 6 | Virtualization demo (Docker, ECS) | Member 3 | 2 min |
| 7 | Storage (S3, RDS, backup) | Member 3 | 2 min |
| 8 | Cloud programming model (APIs, serverless) | Member 4 | 2 min |
| 9 | **Live demo!** | Member 4 | 3 min |
| 10 | Security (IAM, encryption, SG) | Member 5 | 1.5 min |
| 11 | Testing results & limitations | Member 5 | 1.5 min |
| 12 | Conclusion & Q&A | All | 1 min |

### 10.3 README Enhancement

Update the project README to include:
- Project overview (screenshots)
- Architecture diagram
- Prerequisites (AWS account, Docker, Java 21)
- Setup instructions (local + cloud deployment)
- API documentation
- Deployment guide (with ECS instructions)
- Group members & responsibilities

---

## 11. Cost Estimation Table (Report)

| AWS Service | Configuration | Monthly Cost (Free Tier) |
|---|---|---|
| ECS Fargate | 2x 0.5 vCPU, 1GB RAM | $0 (750 vCPU-hrs free) |
| ALB | 1 ALB, 2 target groups | $0 (750 hrs free) |
| RDS PostgreSQL | db.t4g.micro, 20GB | $0 (750 hrs free for 12 months) |
| S3 Standard | 5GB data | $0 (5GB free) |
| S3 Glacier | 1GB data | ~$0.01 |
| CloudFront | 1TB transfer | $0 (1TB free) |
| SQS | 1M requests | $0 (1M free) |
| Lambda | 1M invocations | $0 (1M free/month) |
| CloudWatch | 10 metrics, 5GB logs | $0 (10 metrics, 5GB free) |
| NAT Gateway | 1 NAT | ~$35 (not free) |
| ECR | 1GB storage | $0 (500MB free) |
| **Total** | | **~$35/month (NAT only)** |

> **Cost-Saving Tip:** Use VPC Gateway Endpoints for S3 (free) instead of NAT Gateway for S3 access. This reduces cost to ~$0/month.

---

## 12. Timeline

| Phase | Tasks | Estimated Time | Dependencies |
|---|---|---|---|
| **Phase 1** (Now) | Set up AWS account, VPC, ECR, push images | 1 day | AWS account |
| **Phase 2** (Day 1–2) | Create ECS cluster, task defs, services, ALB | 2 days | Phase 1 |
| **Phase 3** (Day 2–3) | Create RDS, S3 buckets, lifecycle policies | 1 day | Phase 1 |
| **Phase 4** (Day 3–4) | SQS + Lambda, frontend hosting, image upload API | 2 days | Phase 2, 3 |
| **Phase 5** (Day 4–5) | Security groups, IAM, HTTPS, CloudWatch | 1 day | Phase 2 |
| **Phase 6** (Day 5–6) | Testing (k6), screenshot collection | 1 day | All above |
| **Phase 7** (Day 6–8) | Write report (all 7 parts) | 2 days | All screenshots |
| **Phase 8** (Day 8–9) | Presentation slides, live demo prep | 1 day | Report |
| **Phase 9** (Day 9) | Rehearsal, final verification, push to GitHub | 1 day | Everything |

**Total estimated: 9 days** with a team of 3–5 working in parallel.

---

## Quick Start — What to Do First (Right Now)

### Step 1: AWS Account Setup
```
1. Go to https://aws.amazon.com/free
2. Create account (email, payment method for verification)
3. Enable MFA on root account
4. Create IAM user with Admin access
5. Generate Access Key + Secret Key
6. Run: aws configure
```

### Step 2: Clone & Build Locally
```
1. Ensure Docker Desktop is running
2. Ensure Java 21 + Maven are installed
3. Build all services: mvn clean package -DskipTests (in each directory)
4. Run: docker-compose up
5. Test: curl http://localhost:4004/api/patients
```

### Step 3: Deploy to AWS
```
1. Create ECR repositories (5 repos)
2. Build & push Docker images to ECR
3. Create VPC + subnets + security groups
4. Create RDS PostgreSQL
5. Create ECS cluster + task definitions + services
6. Create ALB
7. Verify: curl http://<alb-dns>/api/patients
```

---

**End of Implementation Plan**
