#!/bin/bash
# ──────────────────────────────────────────────────────────
# EC2 User Data — runs automatically on first boot
# Installs Docker, Docker Compose, and clones the repo
# ──────────────────────────────────────────────────────────

exec > /home/ec2-user/install.log 2>&1

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# Install Docker Compose plugin
dnf install -y docker-compose-plugin

# Install git
dnf install -y git

# Clone repo
cd /home/ec2-user
git clone https://github.com/CAdithya11/Patient-Managment-System.git patient-managment
cd patient-managment

# Create .env file with RDS endpoints (update these after RDS is ready)
cat > .env << 'EOF'
# RDS PostgreSQL (patient-service, auth-service, imaging-service)
SPRING_DATASOURCE_URL=jdbc:postgresql://pm-postgres.REGION.rds.amazonaws.com:5432/patient_management
SPRING_DATASOURCE_USERNAME=pm_admin
SPRING_DATASOURCE_PASSWORD=PMSystem2026!

# RDS MySQL (appointment-service)
MYSQL_URL=jdbc:mysql://pm-mysql.REGION.rds.amazonaws.com:3306/appointment_db
MYSQL_USER=pm_admin
MYSQL_PASSWORD=PMSystem2026!
EOF

chown -R ec2-user:ec2-user /home/ec2-user/patient-managment

echo "=== EC2 setup complete ==="
echo "Log in and run: docker compose up -d"
