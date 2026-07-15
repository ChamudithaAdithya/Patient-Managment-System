# AWS & CI/CD Setup Summary

## Infrastructure (ap-southeast-1 Singapore)

| Resource | Name | Purpose |
|----------|------|---------|
| **EC2** | `pm-system` (c7i-flex.large) | Runs all 7 backend microservices + Kafka/Zookeeper via Docker |
| **RDS** | `pm-postgres` (db.t3.micro) | Single PostgreSQL for all services (patient-service, auth-service, imaging-service, appointment-service) |
| **S3** | `hospital-frontend-dev-2026` | Static hosting for React frontend |
| **S3** | `hospital-frontend-nishan-dev` | Old bucket in eu-north-1 (not used, belongs to other IAM user) |

## Security Groups

| Name | Inbound Rules |
|------|---------------|
| `pm-system-sg` | SSH (22), HTTP (80), PostgreSQL (5432), Backend ports (4000-4010), Frontend (5173) — all from 0.0.0.0/0 |

## Architecture

```
User's Browser
    │
    ├── http://hospital-frontend-dev-2026.s3-website.ap-southeast-1.amazonaws.com
    │   (React app served via S3 static hosting)
    │
    └── API calls to EC2 Public IP: 47.130.152.226
        │
        ├── :4004/api/*  →  API Gateway (routes to backend services)
        ├── :4005/*      →  Auth Service (login/register/admin/staff)
        └── other ports  →  direct service access (if needed)
```

## CI/CD Pipeline (GitHub Actions)

**File**: `.github/workflows/deploy.yml`

**Triggered on**: Push to `main` branch, or manually via `workflow_dispatch`

### Jobs

1. **build-backend** (7 parallel jobs)
   - Builds each Java microservice with Maven
   - Uploads JARs as artifacts
   - Services: auth-service, patient-service, billing-service, analytics-service, api-getway, appoinment-service-main, imaging-service

2. **docker-build** (7 parallel jobs, after build-backend)
   - Downloads JAR artifact
   - Logs into Docker Hub
   - Builds Docker image and pushes to `chamudithaadithya/patient_management_system:{tag}`
   - Tags: `auth_service, patient, billing, analytics, api_getway, appointment, imaging`

3. **build-frontend** (after docker-build)
   - Installs npm dependencies
   - Injects VITE_API_GATEWAY and VITE_AUTH_SERVICE env vars (EC2 IP)
   - Builds React app
   - Uploads dist as artifact

4. **deploy-frontend** (after build-frontend, main only)
   - Downloads dist artifact
   - Configures AWS credentials
   - Syncs to S3 bucket `hospital-frontend-dev-2026`

5. **deploy-backend** (after docker-build, main only)
   - SSH into EC2 using `appleboy/ssh-action`
   - `git pull origin main`
   - `docker compose pull`
   - `docker compose up -d --remove-orphans`
   - `docker system prune -f`

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | `chamudithaadithya` |
| `DOCKER_PASSWORD` | Docker Hub password/access token |
| `AWS_ACCESS_KEY_ID` | IAM user `github-actions` key |
| `AWS_SECRET_ACCESS_KEY` | IAM user `github-actions` secret |
| `EC2_HOST` | `47.130.152.226` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | SSH private key for EC2 access |

## Services Running on EC2

All defined in `docker-compose.yml`:

| Container | Port | Image |
|-----------|------|-------|
| auth-service | 4005 | `chamudithaadithya/patient_management_system:auth_service` |
| patient-service | 4000 (internal) | `chamudithaadithya/patient_management_system:patient` |
| billing-service | 4001, 9001 | `chamudithaadithya/patient_management_system:billing` |
| analytics-service | 4002 | `chamudithaadithya/patient_management_system:analytics` |
| api-getway | 4004 | `chamudithaadithya/patient_management_system:api_getway` |
| appointment-service | 4006 | `chamudithaadithya/patient_management_system:appointment` |
| imaging-service | 4007 | `chamudithaadithya/patient_management_system:imaging` |
| patient-kafka | 9092 | `confluentinc/cp-kafka:7.4.0` |
| patient-zookeeper | 2181 | `confluentinc/cp-zookeeper:7.4.0` |

All services connect to a single RDS PostgreSQL: `pm-postgres.cfyk0wk8c4m1.ap-southeast-1.rds.amazonaws.com:5432/patient_management`

## Key Fixes Made

1. **CORS**: Changed to wildcard origin pattern (`*`) without `allowCredentials` — fixes cross-origin requests from S3 frontend to EC2 APIs
2. **Kafka**: Pinned to `7.4.0` to avoid KRaft mode requirement in newer versions
3. **Appointment DB**: Switched from MySQL to PostgreSQL (single RDS for all services)
4. **SSH Key**: Generated on EC2 via `ssh-keygen` for GitHub Actions access
5. **S3 Static Hosting**: Enabled with `index.html` as both index and error document for React SPA routing
6. **Duplicate Sidebar**: Removed nested `<AppLayout>` in route definitions

## Login Credentials

- **Email**: `chamuditha@hospital.com`
- **Password**: `Admin@123`
- **Role**: SUPER_ADMIN

## Useful AWS Console Links

- EC2: https://ap-southeast-1.console.aws.amazon.com/ec2/home?region=ap-southeast-1
- RDS: https://ap-southeast-1.console.aws.amazon.com/rds/home?region=ap-southeast-1
- S3: https://s3.console.aws.amazon.com/s3/buckets/hospital-frontend-dev-2026?region=ap-southeast-1
- GitHub Actions: https://github.com/ChamudithaAdithya/Patient-Managment-System/actions
- Docker Hub: https://hub.docker.com/r/chamudithaadithya/patient_management_system
