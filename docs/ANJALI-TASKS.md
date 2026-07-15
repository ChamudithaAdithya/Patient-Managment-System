# Anjali Sewmini — Implementation Guide

## AWS Account + VPC + Networking + Documentation

---

### Task 1: Create VPC + Subnets + IGW + NAT

**AWS Console → VPC → Your VPCs → Create VPC:**

Fill in:
| Field | Value |
|-------|-------|
| Resources to create | VPC and more |
| Name tag | `pm-vpc` |
| IPv4 CIDR | `10.0.0.0/16` |
| Number of AZs | 2 |
| Number of public subnets | 2 |
| Number of private subnets | 2 |
| NAT Gateway | In 1 AZ |
| VPC Endpoints | None |

Click **Create VPC**.

This auto-creates:
- 1 VPC (`pm-vpc`)
- 1 Internet Gateway (attached to VPC)
- 1 NAT Gateway (in a public subnet)
- 2 public subnets (`10.0.1.0/24`, `10.0.2.0/24`)
- 2 private subnets (`10.0.3.0/24`, `10.0.4.0/24`)
- 2 route tables: public (routes to IGW) + private (routes to NAT)

**Verify:**
1. Go to **VPC → Your VPCs** → `pm-vpc` should show
2. **VPC → Subnets** → 4 subnets listed
3. **VPC → Internet Gateways** → 1 attached to `pm-vpc`
4. **VPC → NAT Gateways** → 1 in a public subnet (wait until status is "Available")
5. **VPC → Route Tables** → 2 tables: public has `0.0.0.0/0 → igw-xxx`, private has `0.0.0.0/0 → nat-xxx`

---

### Task 2: Create Security Groups

**EC2 → Security Groups → Create security group:**

Create all 3. Do them in order (SG references need existing groups).

#### 1. alb-sg (Load Balancer)

| Field | Value |
|-------|-------|
| Name | `alb-sg` |
| Description | Allow HTTP/HTTPS from internet |
| VPC | `pm-vpc` |

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

#### 2. ecs-tasks-sg (Backend Services)

| Field | Value |
|-------|-------|
| Name | `ecs-tasks-sg` |
| Description | Allow traffic from ALB and SSH |
| VPC | `pm-vpc` |

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| Custom TCP | TCP | 4004-4007 | `sg-alb-sg-id` (paste ALB SG ID) |
| Custom TCP | TCP | 4005 | 0.0.0.0/0 |
| SSH | TCP | 22 | 0.0.0.0/0 |

#### 3. rds-sg (Database)

| Field | Value |
|-------|-------|
| Name | `rds-sg` |
| Description | Allow PostgreSQL from backend services only |
| VPC | `pm-vpc` |

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| PostgreSQL | TCP | 5432 | `sg-ecs-tasks-sg-id` (paste ECS tasks SG ID) |

---

### Task 3: Create Application Load Balancer

**EC2 → Load Balancers → Create → Application Load Balancer:**

| Field | Value |
|-------|-------|
| Name | `pm-alb` |
| Scheme | internet-facing |
| IP address type | IPv4 |
| VPC | `pm-vpc` |
| Subnets | Select both **public** subnets |
| Security group | `alb-sg` |
| Listeners | HTTP:80 |

**Target Group** (create new):
| Field | Value |
|-------|-------|
| Target type | IP |
| Name | `pm-tg-api` |
| Protocol | HTTP |
| Port | 4004 |
| VPC | `pm-vpc` |

**Register targets:**
1. In the Target Group page after creation → **Targets** tab → **Register**
2. Paste your EC2 instance's **private IP** (NOT public IP — use the 10.0.x.x or 172.x.x.x address)
3. Port: `4004`
4. Click **Include → Register**

---

### Task 4: Move EC2 into pm-vpc

Since you can't change VPC on a running instance, you have two options:

**Option A — Simple (for assignment demo):**
Just note that the current EC2 runs in the default VPC but the design specifies `pm-vpc`. The architecture remains the same.

**Option B — Full implementation:**
1. Go to **EC2 → Instances → Select `pm-system` → Actions → Image and templates → Create image**
2. Name it `pm-system-ami` → **Create image**
3. Go to **AMIs** → wait for status "available"
4. **Launch instance from AMI**:
   - Name: `pm-system-v2`
   - AMI: Your saved AMI
   - Instance type: `c7i-flex.large`
   - VPC: `pm-vpc`
   - Subnet: Choose a **public** subnet
   - Security group: `ecs-tasks-sg`
   - Key pair: `pm-system-key`
5. After launch, assign an Elastic IP to the new instance:
   - **EC2 → Elastic IPs → Allocate Elastic IP address**
   - Select it → **Actions → Associate Elastic IP address**
   - Instance: `pm-system-v2`
6. Update the EC2_HOST GitHub secret with the new public IP

---

### Task 5: Update CI/CD for ALB

Once the ALB is ready, update the pipeline environment variables:

| Variable | Old | New |
|----------|-----|-----|
| VITE_API_GATEWAY | `http://47.130.152.226:4004/api` | `http://pm-alb-dns/api` |
| VITE_AUTH_SERVICE | `http://47.130.152.226:4005` | `http://pm-alb-dns:4005` (or route through ALB) |

On **`.github/workflows/deploy.yml`**, line where env vars are set during frontend build:

```yaml
- name: Build frontend (with production API URLs)
  run: |
    echo "VITE_API_GATEWAY=http://${{ secrets.ALB_DNS }}:4004/api" >> .env.production
    echo "VITE_AUTH_SERVICE=http://${{ secrets.ALB_DNS }}:4005" >> .env.production
    npm run build
```

Add new secret `ALB_DNS` → value is the ALB DNS name (looks like `pm-alb-xxxxx.ap-southeast-1.elb.amazonaws.com`)

---

### Timeline

| Task | Time |
|------|------|
| 1 — VPC + subnets + NAT | 10 min |
| 2 — Security groups | 10 min |
| 3 — ALB + target group | 15 min |
| 4 — Move EC2 to VPC | 20 min |
| 5 — Update CI/CD | 5 min |
| **Total** | **~1 hour** |

### Need Help?

If stuck at any point, ask Chamuditha to:
- Check security group ID references
- Help with ALB target registration
- Update the CI/CD pipeline ALB_DNS secret
