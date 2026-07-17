# NM Bishar — Implementation Guide

## Auto-scaling Setup

---

### The Problem

Your current launch template uses:
```bash
git clone https://github.com/ChamudithaAdithya/Patient-Managment-System.git
```

This asks for GitHub username/password because it's an **HTTPS** URL. The repo is private, so authentication is required. Don't ask for someone else's password — use one of the approaches below instead.

---

### Option 1: Don't Clone the Repo at All (Recommended)

The Docker images are **already on Docker Hub**. You only need a minimal `docker-compose.yml` to pull and run them. No git clone needed.

**Launch template user data:**
```bash
#!/bin/bash
cd /home/ubuntu

# Create a minimal docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  billing-service:
    image: chamudithaadithya/patient_management_system:billing
    container_name: billing-service
    restart: unless-stopped
    ports:
      - '4001:4001'
      - '9001:9001'
    networks:
      - internal-net

  patient-service:
    image: chamudithaadithya/patient_management_system:patient
    container_name: patient-service
    restart: unless-stopped
    environment:
      - BILLING_SERVICE_ADDRESS_LOCALHOST=billing-service
      - BILLING_SERVICE_GRPC_PORT=9001
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=patient-kafka:9092
      - SPRING_DATASOURCE_URL=jdbc:postgresql://pm-postgres.cfyk0wk8c4m1.ap-southeast-1.rds.amazonaws.com:5432/patient_management
      - SPRING_DATASOURCE_USERNAME=pm_admin
      - SPRING_DATASOURCE_PASSWORD=PMSystem2026!
    depends_on:
      - billing-service
    networks:
      - internal-net

  api-getway:
    image: chamudithaadithya/patient_management_system:api_getway
    container_name: api-getway
    restart: unless-stopped
    ports:
      - 4004:4004
    networks:
      - internal-net

  auth-service:
    image: chamudithaadithya/patient_management_system:auth_service
    container_name: auth-service
    restart: unless-stopped
    ports:
      - 4005:4005
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://pm-postgres.cfyk0wk8c4m1.ap-southeast-1.rds.amazonaws.com:5432/patient_management
      - SPRING_DATASOURCE_USERNAME=pm_admin
      - SPRING_DATASOURCE_PASSWORD=PMSystem2026!
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=patient-kafka:9092
    networks:
      - internal-net

  # ... add remaining services (appointment, imaging, analytics, kafka, zookeeper)
EOF

docker network create internal-net 2>/dev/null || true
docker compose up -d
```

**Advantages:** No git clone, no credentials needed, pulls the latest images from Docker Hub.

---

### Option 2: Use a GitHub Personal Access Token

If you want to clone the repo:

```bash
#!/bin/bash
cd /home/ubuntu
git clone https://<YOUR_USERNAME>:<YOUR_TOKEN>@github.com/ChamudithaAdithya/Patient-Managment-System.git
cd patient-managment
docker compose up -d --pull always
```

Generate a token at GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Repo access.

---

### Option 3: Use SSH

Add the SSH key to GitHub first, then:

```bash
#!/bin/bash
cd /home/ubuntu
git clone git@github.com:ChamudithaAdithya/Patient-Managment-System.git
cd patient-managment
docker compose up -d --pull always
```

---

### Option 4: Use the Existing EC2 as an AMI

Instead of cloning on every new instance:
1. Take an AMI snapshot of the current working EC2
2. Use that AMI in the launch template
3. New instances boot up with everything already installed and running

```bash
# Create AMI from current EC2
aws ec2 create-image \
  --instance-id i-xxxxx \
  --name "pm-system-ami" \
  --no-reboot
```

---

### Recommendations for the Report

Document what you **actually did**:

**For auto-scaling screenshot:**
1. Create an Auto Scaling Group with the launch template
2. Set min=2, max=4, target CPU=70%
3. Register it with the ALB target group
4. Take screenshots of the ASG summary page

**The actual scaling:** For the demo/show, the ASG will monitor CPU. When it goes above 70%, it launches a new EC2 from the template. The ALB distributes traffic between instances. This is standard EC2 auto-scaling.
