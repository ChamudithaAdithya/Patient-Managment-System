#!/bin/bash
set -e

# ──────────────────────────────────────────────────────────
# One-time AWS setup: EC2 + RDS + S3 for the PM System
# Run this ONCE on your local machine with AWS CLI configured
# ──────────────────────────────────────────────────────────

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
KEY_NAME="pm-system-key"
SG_NAME="pm-system-sg"

echo "=== 1. Create SSH key pair ==="
aws ec2 create-key-pair --key-name $KEY_NAME --query KeyMaterial --output text > ${KEY_NAME}.pem
chmod 400 ${KEY_NAME}.pem
echo "Key saved to ${KEY_NAME}.pem — keep this safe!"

echo "=== 2. Create security group ==="
SG_ID=$(aws ec2 create-security-group \
  --group-name $SG_NAME \
  --description "PM System security group" \
  --query GroupId --output text)

# SSH from anywhere (restrict to your IP in production)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
# Web traffic
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
# Backend APIs (restrict to ALB/frontend in production)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 4000-4010 --source-group $SG_ID

echo "=== 3. Launch EC2 t3.medium ==="
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --instance-type t3.medium \
  --key-name $KEY_NAME \
  --security-group-ids $SG_ID \
  --block-device-mappings DeviceName=/dev/xvda,Ebs={VolumeSize=30,VolumeType=gp3} \
  --user-data file://scripts/ec2-userdata.sh \
  --query Instances[0].InstanceId --output text)

aws ec2 create-tags --resources $INSTANCE_ID --tags Key=Name,Value=pm-system

echo "Waiting for instance..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query Reservations[0].Instances[0].PublicIpAddress --output text)
echo "EC2 running at: $PUBLIC_IP"

echo "=== 4. Create S3 bucket for frontend ==="
aws s3 mb s3://pm-frontend-${ACCOUNT_ID} --region $REGION
aws s3 website s3://pm-frontend-${ACCOUNT_ID} --index-document index.html --error-document index.html
aws s3api put-bucket-policy --bucket pm-frontend-${ACCOUNT_ID} --policy '{
  "Version":"2012-10-17",
  "Statement":[{
    "Effect":"Allow",
    "Principal":"*",
    "Action":"s3:GetObject",
    "Resource":"arn:aws:s3:::pm-frontend-'${ACCOUNT_ID}'/*"
  }]
}'

echo "=== 5. Create RDS PostgreSQL ==="
aws rds create-db-instance \
  --db-instance-identifier pm-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username pm_admin \
  --master-user-password PMSystem2026! \
  --allocated-storage 20 \
  --publicly-accessible \
  --vpc-security-group-ids $SG_ID

echo "=== 6. Create RDS MySQL ==="
aws rds create-db-instance \
  --db-instance-identifier pm-mysql \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username pm_admin \
  --master-user-password PMSystem2026! \
  --allocated-storage 20 \
  --publicly-accessible \
  --vpc-security-group-ids $SG_ID

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  SETUP COMPLETE                                     ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  EC2 Public IP: $PUBLIC_IP              ║"
echo "║  SSH: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP    ║"
echo "║  S3 Bucket: pm-frontend-${ACCOUNT_ID}               ║"
echo "║  RDS Postgres: pm-postgres.${ACCOUNT_ID}.us-east-1.rds.amazonaws.com ║"
echo "║  RDS MySQL: pm-mysql.${ACCOUNT_ID}.us-east-1.rds.amazonaws.com      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. ssh into EC2 and clone the repo"
echo "  2. Update docker-compose.yml with RDS endpoints"
echo "  3. docker compose up -d"
echo "  4. Build frontend and upload to S3"
