# Team Task Assignment

**Project:** Cloud-Based Hospital Management System (Option C)  
**Platform:** AWS Free Tier  

---

## Member Responsibilities

### Anjali Sewmini — Patient Records + AWS Setup + Documentation

**Primary:** Patient Records (existing) + Cloud infrastructure setup  
**Secondary:** Overall documentation coordinator

**Tasks (in order):**

| # | Task | What to Do | File / Location |
|---|---|---|---|
| 1 | Create AWS account | Go to https://aws.amazon.com/free → Sign up → Enable MFA → Create IAM admin user → Save access keys | AWS Console |
| 2 | Configure AWS CLI | Run `aws configure` on your machine → Enter access key, secret key, region `us-east-1`, format `json` | Terminal |
| 3 | Create VPC + subnets | AWS Console → VPC → Create VPC (10.0.0.0/16) → 2 public subnets (10.0.1.0/24, 10.0.2.0/24) → 2 private subnets (10.0.3.0/24, 10.0.4.0/24) | AWS Console |
| 4 | Create Internet Gateway + NAT Gateway | Attach IGW to VPC → Create NAT Gateway in public subnet A | AWS Console |
| 5 | Create task definitions | For each service: Fargate, 0.5 vCPU, 1GB RAM, container image from ECR, port mapping, env vars (DB host, Kafka, etc.) | AWS Console → ECS → Task Definitions |
| 6 | Create ALB | AWS Console → EC2 → Load Balancers → Create ALB → Internet-facing → Listeners: HTTP:80, HTTPS:443 → Target groups per service | AWS Console |
| 7 | Deploy ECS services | For each service: attach to ALB target group, set desired count 2, spread across AZs | AWS Console → ECS → Cluster → Create Service |
| 8 | Document everything | Write Part 3 (Virtualization) in report — include screenshots of VPC, subnets, security groups, ECS tasks, ALB | Report .docx |

---

### NM Bishar — Appointment Scheduling + Cloud Deployment + Documentation

**Primary:** Build the Appointment Scheduling service  
**Secondary:** Deploy it to AWS and document

**Tasks (in order):**

| # | Task | What to Do | File / Location |
|---|---|---|---|
| 1 | Create new Maven project | Use Spring Initializr (https://start.spring.io/) → Group: `com.pm`, Artifact: `appointment-service` → Dependencies: Web, JPA, PostgreSQL, Validation, SpringDoc → Java 21 | Extract to `appointment-service/` |
| 2 | Create `Appointment.java` entity | Package: `model/`. Fields: id (UUID), patientId (UUID), doctorId (UUID), appointmentDateTime (LocalDateTime), status (Enum), reason (String). Annotations: `@Entity`, `@Table(name="appointments")` | `appointment-service/src/main/java/com/pm/appointment/model/` |
| 3 | Create `AppointmentStatus.java` enum | Values: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW | Same `model/` package |
| 4 | Create `AppointmentRepository.java` | Extend `JpaRepository<Appointment, UUID>`. Add methods: `findByPatientId`, `findByDoctorId`, `findByDoctorIdAndAppointmentDateTimeBetween`, `existsByDoctorIdAndAppointmentDateTime` | `repository/` package |
| 5 | Create `AppointmentRequestDTO.java` | Fields: patientId, doctorId (both `@NotNull`), appointmentDateTime (`@NotNull @Future`), reason (`@NotBlank`) | `dto/` package |
| 6 | Create `AppointmentResponseDTO.java` | Fields: id, patientId, doctorId, appointmentDateTime, status, reason — all getters/setters | `dto/` package |
| 7 | Create `AppointmentMapper.java` | Static `toModel(requestDTO)` → entity, `toDTO(entity)` → response | `mapper/` package |
| 8 | Create `AppointmentService.java` | Methods: getAll, getByPatientId, getByDoctorId, getById, create (with conflict check), cancel, complete, getAvailableSlots | `service/` package |
| 9 | Create `AppointmentController.java` | `GET /appointments`, `GET /appointments/{id}`, `POST /appointments`, `PUT /appointments/{id}/cancel`, `PUT /appointments/{id}/complete`, `GET /appointments/doctor/{doctorId}/available?date=` | `controller/` package |
| 10 | Create `application.yml` | Port 4006, datasource pointing to RDS, JPA ddl-auto: update, show-sql: true | `src/main/resources/` |
| 11 | Create `Dockerfile` | Same multi-stage pattern as other services (Maven builder → JRE runner, expose 4006) | `appointment-service/Dockerfile` |
| 12 | Build & test locally | `mvn clean package -DskipTests` → Add to `docker-compose.yml` → `docker-compose up` → test with curl | Terminal |
| 13 | Push image to ECR | `docker tag appointment-service <ecr-uri>/appointment-service:latest` → `docker push` | Terminal |
| 14 | Create ECS task def + service | AWS Console → ECS → Task Definitions → Create (port 4006, env vars for DB) → Service (attach to ALB target group) | AWS Console |
| 15 | Add gateway route | Add `/api/appointments/**` → `http://appointment-service:4006` route to `api-getway/src/main/resources/application.yml` | `api-getway/` |
| 16 | Enable auto-scaling for all services | For each ECS service: CPU > 70% → add task, CPU < 30% → remove task. Min:2, Max:6 | AWS Console → ECS → Service → Auto Scaling |
| 17 | Set up HTTPS on ALB | AWS Console → ACM → Request public certificate for your domain → Validate via DNS → EC2 → Load Balancers → Add HTTPS listener (443) with the certificate → Redirect HTTP (80) → HTTPS | AWS Console → ACM + EC2 |
| 18 | Document everything | Write appointment service section in Part 5 (Programming Model) — include screenshots of API tests. Also document auto-scaling config and HTTPS setup | Report .docx |

---

### Nishan Pubudu — Medical Imaging Storage + Cloud Storage + Documentation

**Primary:** S3 setup + image upload feature  
**Secondary:** RDS, backups, lifecycle policies

**Tasks (in order):**

| # | Task | What to Do | File / Location |
|---|---|---|---|
| 1 | Create S3 buckets | AWS Console → S3 → 3 buckets: `hospital-frontend-<name>`, `hospital-medical-images-<name>`, `hospital-backups-<name>` | AWS Console |
| 2 | Configure medical images bucket | Block public access → Enable versioning → Enable default SSE-S3 encryption | AWS Console → bucket → Properties |
| 3 | Add S3 lifecycle policy | Rule: transition to Standard-IA after 30 days → Glacier after 90 days → expire after 365 days | AWS Console → bucket → Management |
| 4 | Create RDS PostgreSQL | AWS Console → RDS → Create database → PostgreSQL → Free tier → db.t4g.micro → 20GB → Multi-AZ → 7-day backup → Enable encryption | AWS Console |
| 5 | Create databases | Connect with pgAdmin or `psql -h <endpoint> -U postgres` → Run: `CREATE DATABASE patient_management; CREATE DATABASE db_auth;` | Terminal / pgAdmin |
| 6 | Add AWS S3 dependency | Add to `patient-service/pom.xml`: `software.amazon.awssdk:s3:2.30.0` | `patient-service/pom.xml` |
| 7 | Create `S3Config.java` | `@Configuration` class with `@Bean` returning `S3Client.builder().region(Region.US_EAST_1).credentialsProvider(DefaultCredentialsProvider.create()).build()` | `patient-service/src/main/java/com/pm/patientService/config/S3Config.java` |
| 8 | Create `ImageService.java` | Inject `S3Client`. Method `uploadImage(patientId, file)`: generate key → `s3Client.putObject()`. Method `getImageUrl(patientId, imageKey)`: generate presigned URL (1hr expiry) via `S3Presigner` | `patient-service/src/main/java/com/pm/patientService/service/ImageService.java` |
| 9 | Create `ImageController.java` | `POST /patients/{id}/images` (MultipartFile) → returns S3 key. `GET /patients/{id}/images/{imageKey}` → returns presigned URL | `patient-service/src/main/java/com/pm/patientService/controller/ImageController.java` |
| 10 | Create backup script | `scripts/backup-db.sh`: `pg_dump` → `aws s3 cp` to backups bucket → clean local file | `scripts/backup-db.sh` |
| 11 | Test image upload | `curl -X POST -F "file=@test.jpg" http://localhost:4004/api/patients/{id}/images` → verify file appears in S3 | Terminal + AWS Console |
| 12 | Deploy & verify on AWS | Push updated patient-service image to ECR → Force redeploy ECS service → Test same curl against ALB DNS | Terminal |
| 13 | Document everything | Write Part 4 (Cloud Storage) — include screenshots of S3 buckets, lifecycle rules, RDS config, backup script | Report .docx |

---

### Hirusha Kalani — Monitoring, Testing, Documentation

**Primary:** CloudWatch monitoring + k6 load testing  
**Secondary:** Security group finalization, report compilation

**Tasks (in order):**

| # | Task | What to Do | File / Location |
|---|---|---|---|
| 1 | Create CloudWatch dashboard | AWS Console → CloudWatch → Dashboards → Create → Add widgets: ECS CPU, RDS connections, ALB request count, S3 bucket sizes | AWS Console |
| 2 | Set up log groups | For each ECS task definition, ensure `awslogs` log driver is configured with log group `/ecs/<service-name>` | ECS → Task Definition → Container → Logs |
| 3 | Create CloudWatch alarms | AWS Console → CloudWatch → Alarms → Create → Metric: ECS CPUUtilization > 80% for 5 min → Action: SNS email notification | AWS Console |
| 4 | Install k6 | Download from https://k6.io or run `winget install k6` | Terminal |
| 5 | Write load test script | Create `scripts/k6-test.js` — stages: 30s ramp to 5 users, 1m at 20 users, 30s ramp down. Test GET /patients and POST /patients. Thresholds: p95 < 2s, error rate < 5% | `scripts/k6-test.js` |
| 6 | Run local load test | `k6 run scripts/k6-test.js -e BASE_URL=http://localhost:4004/api` → Record results | Terminal |
| 7 | Run cloud load test | `k6 run scripts/k6-test.js -e BASE_URL=https://<alb-dns>/api` → Record results | Terminal |
| 8 | Verify RBAC security | Test: call DELETE without admin JWT → expect 403. Call POST with doctor JWT → expect 200 | curl/Postman |
| 9 | Verify encryption | Check RDS is `--storage-encrypted`, S3 has SSE-S3, ALB has HTTPS listener | AWS Console |
| 10 | Verify security groups | Check `alb-sg` only allows 80/443, `rds-sg` only allows 5432 from `ecs-tasks-sg` | AWS Console → EC2 → Security Groups |
| 11 | Compile report sections | Collect screenshots from all members → Compile into final report document (4000-6000 words) → Format references in APA | Report .docx |
| 12 | Prepare presentation slides | Create 12 slides (see slide deck in PROJECT-IMPLEMENTATION.md) → Distribute per member → Schedule rehearsal | PowerPoint/Google Slides |

---

### Chamuditha Adithya — RBAC + Infra Setup + DevOps + Documentation

**Primary:** AWS infrastructure provisioning + Role-Based Access Control  
**Secondary:** API Gateway, CI/CD, overall lead

**Tasks (in order):**

| # | Task | What to Do | File / Location |
|---|---|---|---|
| 1 | Create route tables | AWS Console → VPC → Route Tables → 2 tables: Public (0.0.0.0/0 → IGW) + Private (0.0.0.0/0 → NAT Gateway). Associate public with public subnets, private with private subnets | AWS Console |
| 2 | Create security groups | `alb-sg` (80,443 from 0.0.0.0/0), `ecs-tasks-sg` (4000-4006 from alb-sg), `rds-sg` (5432 from ecs-tasks-sg) | AWS Console → EC2 → Security Groups |
| 3 | Create ECR repositories | 6 repos: patient-service, billing-service, analytics-service, api-getway, auth-service, appointment-service | AWS Console → ECR |
| 4 | Push Docker images to ECR | `aws ecr get-login-password | docker login` → `docker tag <svc>:latest <ecr-uri>/<svc>:latest` → `docker push` for each of the 6 services. Get each team member to build and send their image or do it yourself from main branch | Terminal from project root |
| 5 | Create EC2 instance | AWS Console → EC2 → Launch → Ubuntu 24.04, t3.micro, public subnet, security group (22+4004), user data script to install Docker | AWS Console |
| 6 | Add Spring Security + JJWT deps | Add to `patient-service/pom.xml`: `spring-boot-starter-security`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (0.12.6) | `patient-service/pom.xml` |
| 7 | Create `JwtAuthFilter.java` | Extend `OncePerRequestFilter`. Read `Authorization: Bearer <token>` header. Parse JWT using same secret key as auth-service. Extract role → set `SecurityContextHolder` with `ROLE_<role>`. On failure → clear context | `config/JwtAuthFilter.java` |
| 8 | Create `SecurityConfig.java` | `@Configuration` + `@EnableMethodSecurity`. URL rules: `GET /patients` → authenticated, `POST /patients` → ADMIN/DOCTOR, `PUT /patients/**` → ADMIN/DOCTOR, `DELETE /patients/**` → ADMIN. Add `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter` | `config/SecurityConfig.java` |
| 9 | Add `secret.key` config + test RBAC | Add to `application.yml`. Copy same key to auth-service. Test: ADMIN→DELETE=200, PATIENT→DELETE=403, DOCTOR→POST=200 | curl/Postman |
| 10 | Update API Gateway routes | Add `/api/appointments/**` and `/api/login` routes to `api-getway/src/main/resources/application.yml` | `api-getway/` |
| 11 | Update CI/CD pipeline + deploy | Edit `.github/workflows/CICD Pipline.yml` → build+push all 6 services → SSH into EC2 → `docker compose pull && docker compose up -d` | `.github/workflows/` |
| 12 | Configure Docker networking | Ensure all services are on the same Docker network (`internal-net`) so `patient-service` can reach `billing-service:9001` | `docker-compose.yml` |
| 13 | Create IAM task roles | IAM role `ecsTaskRole-patient` with S3 PutObject/GetObject permissions on images bucket + SQS SendMessage. Attach to patient-service task definition | AWS Console → IAM → Roles |
| 14 | Final integration test + docs | End-to-end: Login→Create Patient→Upload Image→Schedule Appointment. Write Part 6 (Security) report section | Terminal + Report |

---

## Key Shared Resources

| Resource | Who Creates | Who Uses |
|---|---|---|
| AWS Account | Anjali | Everyone |
| VPC + Subnets + IGW + NAT | Anjali | Everyone (shared network) |
| Route Tables + Security Groups | Chamuditha | Everyone |
| ECR Repositories | Chamuditha | Everyone (push images) |
| EC2 Instance | Chamuditha | Everyone (Docker host) |
| Task Definitions | Anjali | Everyone (blueprint for Docker services) |
| ALB | Removed (use EC2 public IP directly) | — |
| ECS Services | Removed (Docker Compose on single EC2) | — |
| Auto-scaling Rules | Bishar | Everyone |
| HTTPS / ACM Certificate | Bishar | Everyone |
| Docker Compose Networking | Chamuditha | Everyone |
| RDS PostgreSQL | Nishan | Bishar, Anjali, Chamuditha |
| S3 Buckets | Nishan | Chamuditha (image upload), Hirusha (testing) |
| SQS Queue | Chamuditha | Hirusha (analytics/notifications) |
| Docker Images | Each member pushes their own (ECR created by Chamuditha) | — |
| ECS Task Defs + Services | Each member creates their own | — |
| CI/CD Pipeline | Chamuditha | Everyone |

---

## Timeline Summary

| Day | Anjali | Bishar | Nishan | Hirusha | Chamuditha |
|---|---|---|---|---|
| **Day 1** | AWS account, VPC, subnets, IGW, NAT | Create appointment Maven project + entity + repo | Create S3 buckets, RDS, lifecycle policies | Set up CloudWatch dashboard, log groups | Create route tables, security groups, ECR repos |
| **Day 2** | Create task definitions for all services | Build DTOs, mapper, service, controller | Add S3 SDK dep, create S3Config + ImageService + ImageController | Write k6 test script, run local tests | Push Docker images to ECR, launch EC2 instance |
| **Day 3** | Deploy Docker Compose to EC2 | Build + test appointment locally, create Dockerfile + enable auto-scaling | Create backup script, test locally | Run cloud load tests, record metrics | Add Security/JWT deps, create JwtAuthFilter + SecurityConfig |
| **Day 4** | CI/CD + verify deployment on EC2 | Push image to ECR, SSH deploy to EC2 + set up HTTPS on EC2 | Push image to ECR, test S3 upload via cloud | Verify RBAC, encryption, security groups | Test RBAC locally, update gateway routes, CI/CD to EC2 |
| **Day 5** | Write Part 3 (Virtualization) + Part 2 (cost) sections | Write appointment + auto-scaling + HTTPS sections in Part 5/6 | Write Part 4 (Storage) report section | Compile all report sections, create slides | Create IAM roles, Docker networking. Write Part 6 |
| **Day 6** | Review + Rehearse | Review + Rehearse | Review + Rehearse | Review + Rehearse + final report | Final integration test + deploy + rehearsal |

---

## How to Use This Assignment

**If you don't know how to do your tasks:**

1. **Open `PROJECT-IMPLEMENTATION.md`** — it has step-by-step instructions for everything
2. **Search for your section** — each Part corresponds to one area:
   - **Anjali** → Part 3 (Virtualization: task defs, ALB, deploy) + Part 2 (Infrastructure design for report)
   - **Bishar** → Part 5, section "Create Appointment Scheduling Service" (full new microservice)
   - **Nishan** → Part 4 (Cloud Storage: S3, RDS, image upload API) + Part 5 "Medical Image Upload"
   - **Hirusha** → Part 7 (Testing: k6) + Part 6 (Monitoring/Logging: CloudWatch dashboard)
   - **Chamuditha** → Part 3 (Virtualization: route tables, SGs, ECR, ECS cluster, push images) + Part 6 (RBAC: JWT filter, SecurityConfig) + Part 5 (Gateway routes, CI/CD)
3. **Follow the "How to implement — step by step" guides** — each step tells you exactly which file to create/edit and what code to write
4. **Use the existing services as templates** — look at `patient-service/` structure (controllers, services, repositories) and copy the pattern
5. **Screenshots to capture** are listed at the end of each section — take these as you work
6. **Push your code to GitHub** as you complete each task
7. **Ask for help** if stuck — the project is meant to be collaborative

> **Golden rule:** Do NOT write code from memory. Use `PROJECT-IMPLEMENTATION.md` as your guide and refer to existing working services as examples.
