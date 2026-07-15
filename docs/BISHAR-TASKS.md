# NM Bishar — Implementation Guide

## Appointment Scheduling + Cloud Deployment + HTTPS + Auto-scaling

---

Most of your appointment service code is **already built and running**. Your remaining tasks are:

1. Add HTTPS to the ALB (when Anjali creates it)
2. Configure auto-scaling
3. Document your sections

---

### Task 1: Add Gateway Route (✅ Already Done)

The route exists in `api-getway/src/main/resources/application.yml`:

```yaml
- id: appointment-service-route
  uri: http://appointment-service:4006
  predicates:
    - Path=/api/appointments/**
  filters:
    - StripPrefix=1
```

Verified working — appointment API accessible at `http://47.130.152.226:4004/api/appointments`

---

### Task 2: Set Up HTTPS on ALB (After Anjali creates ALB)

Once Anjali has created the ALB, you need to add HTTPS.

**Step 1: Request a certificate**

- AWS Console → ACM → Request → Request public certificate
- **Domain**: If you have one, enter it (e.g. `api.mysystem.com`)
- **Validation method**: DNS validation
- Click **Request**

If you don't have a domain, for assignment demo you can use a **self-signed certificate**:

```bash
# On EC2:
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/pm-selfsigned.key \
  -out /etc/ssl/certs/pm-selfsigned.crt \
  -subj "/CN=pm-system"
```

**Step 2: Add HTTPS listener to ALB**

- EC2 → Load Balancers → Select `pm-alb`
- **Listeners** → **Add listener**
- **Protocol**: HTTPS, **Port**: 443
- **Certificate**: Choose the ACM certificate (or upload self-signed)
- **Default action**: Forward to target group `pm-tg-api`
- Click **Add**

**Step 3: Redirect HTTP to HTTPS (optional)**

- Select the HTTP:80 listener → **Actions → Edit**
- **Default action**: Redirect to HTTPS
- **Protocol**: HTTPS, **Port**: 443
- Click **Save**

---

### Task 3: Enable Auto-scaling

Since we use Docker Compose (not ECS), auto-scaling means adding more EC2 instances and distributing load. Here's how:

**Step 1: Create Launch Template**

- **EC2 → Launch Templates → Create**
- **Name**: `pm-auto-scale-template`
- **AMI**: Your current EC2's AMI (or Amazon Linux 2023)
- **Instance type**: `c7i-flex.large`
- **Key pair**: `pm-system-key`
- **Security group**: `ecs-tasks-sg`
- **User data**:
```bash
#!/bin/bash
cd /home/ubuntu
git clone https://github.com/ChamudithaAdithya/Patient-Managment-System.git patient-managment
cd patient-managment
sudo docker compose up -d
```

**Step 2: Create Auto Scaling Group**

- **EC2 → Auto Scaling Groups → Create**
- **Name**: `pm-asg`
- **Launch template**: `pm-auto-scale-template`
- **VPC**: `pm-vpc`
- **Subnets**: Both **public** subnets
- **Desired capacity**: 2
- **Minimum**: 2
- **Maximum**: 6
- **Scaling policies**: Target tracking
  - **Metric type**: Average CPU utilization
  - **Target value**: 70%
  - **Instances need**: 120 seconds warm-up

**Step 3: Register ASG with ALB Target Group**

In the Auto Scaling Group creation wizard:
- **Load balancing**: Attach to an existing load balancer
- **Target groups**: Choose `pm-tg-api`
- Complete creation

**For assignment documentation:**
Take screenshots of:
1. Auto Scaling Group summary (min/max/desired)
2. Scaling policy (CPU > 70% → add instance)
3. ALB target group showing registered instances

---

### Task 4: Test the Appointment API

The appointment service is already running on EC2. Test it:

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://47.130.152.226:4005/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chamuditha@hospital.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create an appointment
curl -X POST http://47.130.152.226:4004/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "some-patient-uuid",
    "doctorId": "some-doctor-uuid",
    "appointmentDateTime": "2026-07-20T10:00:00",
    "reason": "Checkup"
  }'

# Get all appointments
curl http://47.130.152.226:4004/api/appointments \
  -H "Authorization: Bearer $TOKEN"
```

---

### Task 5: Documentation (Report Sections)

For your report, write:

**Part 5 — Programming Model:**
- How appointment service follows RESTful patterns
- Entity → Repository → Service → Controller flow
- Screenshots of API test results

**Part 6 — HTTPS Setup:**
- ALB HTTPS listener configuration
- Certificate issuance (ACM or self-signed)
- Redirect HTTP to HTTPS

**Part 6 — Auto-scaling:**
- Launch template configuration
- Auto Scaling group settings
- CPU-based scaling policy
- Diagram showing ASG + ALB + EC2

---

### Summary of What's Already Done

| # | Task | Status |
|---|------|--------|
| 1-11 | Appointment service code | ✅ Done (entity, repo, DTOs, service, controller, Dockerfile) |
| 12 | Build & test locally | ✅ Done (RDS PostgreSQL connected) |
| 13 | Push image | ✅ Pushed to Docker Hub |
| 14 | Create ECS task def | ❌ Not needed (using Docker Compose) |
| 15 | Add gateway route | ✅ Done |
| **16** | **Enable auto-scaling** | **⬅️ Your task** |
| **17** | **Set up HTTPS on ALB** | **⬅️ Your task** |
| **18** | **Document everything** | **⬅️ Your task** |

### Need Help?

- **Auto-scaling**: Ask Chamuditha for the correct security group IDs
- **HTTPS**: Coordinate with Anjali — she creates the ALB, you add HTTPS to it
- **Appointment service**: Already working, no changes needed
