# Hirusha Kalani — Implementation Guide

## CloudWatch Monitoring + k6 Load Testing + Security Verification

---

### Task 1: Install k6

**On your local machine (Windows - PowerShell):**

```powershell
# Option 1: Direct download
winget install k6

# Option 2: Using chocolatey
# choco install k6

# Verify
k6 version
```

**If you want to run from EC2 (Linux):**

```bash
sudo dnf install -y https://dl.k6.io/rpm/repo.rpm
sudo dnf install -y k6
```

---

### Task 2: Create CloudWatch Dashboard

- AWS Console → CloudWatch → Dashboards → Create dashboard
- **Dashboard name**: `PM-System-Monitoring`
- Click **Create**

**Add widgets:**

| Widget Type | Metric | What It Shows |
|-------------|--------|---------------|
| Line | EC2 → CPUUtilization | Server CPU load |
| Line | EC2 → NetworkIn/Out | Network traffic |
| Number | EC2 → StatusCheckFailed | Health checks |
| Line | RDS → CPUUtilization | Database CPU |
| Line | RDS → DatabaseConnections | Active DB connections |
| Line | S3 → BucketSizeBytes | Storage growth |

**How to add a widget:**
1. Click **Add widget** → Select type (Line, Number, etc.)
2. **Metrics** tab → Search for the service (EC2, RDS, S3)
3. Select the specific metric → **Create widget**
4. Drag to position on dashboard

Take screenshot of the completed dashboard.

---

### Task 3: Get EC2 and RDS Instance IDs

Run these commands to get the IDs you need for CloudWatch:

```bash
# Get EC2 instance ID (run on your local machine with AWS CLI)
aws ec2 describe-instances --filters "Name=tag:Name,Values=pm-system" --query "Reservations[0].Instances[0].InstanceId" --output text

# Get RDS instance ID
aws rds describe-db-instances --db-instance-identifier pm-postgres --query "DBInstances[0].DbiResourceId" --output text
```

Or find them in AWS Console:
- EC2 → Instances → click `pm-system` → copy Instance ID (e.g. `i-0abc123...`)
- RDS → Databases → click `pm-postgres` → copy **Resource ID** (e.g. `db-ABCDEF...`)

---

### Task 4: Create CloudWatch Alarms

**CPU Alarm — EC2 too hot:**

- AWS Console → CloudWatch → Alarms → Create alarm
- **Select metric**: EC2 → Per-Instance Metrics → `CPUUtilization` → Select your EC2
- **Conditions**: Greater than 80
- **Additional configuration**:
  - Datapoints: 3 out of 3
  - Period: 5 minutes
- **Alarm name**: `pm-ec2-cpu-high`
- **Notification**: Create new SNS topic → Email: your-email@example.com
- Click **Create alarm**

**RDS Connection Spike Alarm:**

- **Select metric**: RDS → Per-Database Metrics → `DatabaseConnections` → Select `pm-postgres`
- **Conditions**: Greater than 20
- **Alarm name**: `pm-rds-connections-high`
- Click **Create alarm**

Take screenshot of both alarms.

---

### Task 5: Write k6 Load Test Script

Create file: `scripts/k6-test.js`

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://47.130.152.226';
const loginUrl = `${baseUrl}:4005/login`;
const patientUrl = `${baseUrl}:4004/api/patients`;

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const patientsDuration = new Trend('patients_duration');

export let options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 users
    { duration: '1m', target: 20 },    // Ramp to 20 users
    { duration: '2m', target: 20 },    // Stay at 20
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'],             // Error rate < 5%
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
  },
};

export default function () {
  // 1. Login
  let loginRes = http.post(loginUrl, JSON.stringify({
    email: 'chamuditha@hospital.com',
    password: 'Admin@123',
  }), { headers: { 'Content-Type': 'application/json' } });

  loginDuration.add(loginRes.timings.duration);
  let loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });
  errorRate.add(!loginOk);

  if (!loginOk) {
    sleep(1);
    return;
  }

  let token = loginRes.json('token');
  let authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Get patients list
  let patientsRes = http.get(patientUrl, { headers: authHeaders });
  patientsDuration.add(patientsRes.timings.duration);
  let patientsOk = check(patientsRes, {
    'patients status 200': (r) => r.status === 200,
  });
  errorRate.add(!patientsOk);

  sleep(1);
}
```

---

### Task 6: Run Load Test Locally

From your local machine:

```bash
# Test the local system (Docker running on your machine)
k6 run scripts/k6-test.js -e BASE_URL=http://localhost:4004
```

---

### Task 7: Run Load Test Against Cloud

```bash
# Test the production system on EC2
k6 run scripts/k6-test.js -e BASE_URL=http://47.130.152.226
```

**Record these results:**
```
✓ login status 200
✓ login has token
✓ patients status 200

http_req_duration........: avg=XXXms  min=XXXms  med=XXXms  p(90)=XXXms  p(95)=XXXms
errors...................: 0.00%  ✓ XX  ✗ XX
```

Take screenshot of the k6 terminal output.

---

### Task 8: Run Longer Load Test for Report

Create a more comprehensive test: `scripts/k6-test-report.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = `${__ENV.BASE_URL || 'http://47.130.152.226'}`;

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 30 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  // Login first
  let res = http.post(`${BASE}:4005/login`, JSON.stringify({
    email: 'chamuditha@hospital.com',
    password: 'Admin@123',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (res.status !== 200) {
    sleep(1);
    return;
  }

  let token = res.json('token');
  let headers = { 'Authorization': `Bearer ${token}` };

  // Mix of requests
  let patientCheck = http.get(`${BASE}:4004/api/patients`, { headers });
  check(patientCheck, { 'GET patients ok': (r) => r.status === 200 });

  let doctorCheck = http.get(`${BASE}:4004/api/doctors`, { headers });
  check(doctorCheck, { 'GET doctors ok': (r) => r.status === 200 });

  let apptCheck = http.get(`${BASE}:4004/api/appointments`, { headers });
  check(apptCheck, { 'GET appointments ok': (r) => r.status === 200 });

  sleep(1);
}
```

Run:
```bash
k6 run scripts/k6-test-report.js
```

---

### Task 9: Verify RBAC Security

Run these tests to confirm role-based access works:

```bash
# Get a SUPER_ADMIN token
ADMIN_TOKEN=$(curl -s -X POST http://47.130.152.226:4005/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chamuditha@hospital.com","password":"Admin@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Get a PATIENT token (register a test patient)
PATIENT_TOKEN=$(curl -s -X POST http://47.130.152.226:4005/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Patient","email":"testpatient@test.com","password":"Test@123","role":"PATIENT"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Test 1: ADMIN can delete a patient (GET first to get a patient ID)
PATIENT_ID=$(curl -s http://47.130.152.226:4004/api/patients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data,list) and len(data)>0 else 'none')")

echo "=== Test 1: ADMIN creates patient (should be 201) ==="
curl -s -o /dev/null -w "%{http_code}" -X POST http://47.130.152.226:4004/api/patients \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"RBAC Test Patient","dateOfBirth":"1990-01-01","email":"rbac@test.com"}'

echo ""
echo "=== Test 2: PATIENT deletes patient (should be 403) ==="
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://47.130.152.226:4004/api/patients/$PATIENT_ID \
  -H "Authorization: Bearer $PATIENT_TOKEN"

echo ""
echo "=== Test 3: PATIENT GET /admin/users (should be 403) ==="
curl -s -o /dev/null -w "%{http_code}" http://47.130.152.226:4005/admin/users \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

Record all HTTP status codes for your report.

---

### Task 10: Verify Encryption

```bash
# Check RDS encryption
aws rds describe-db-instances --db-instance-identifier pm-postgres \
  --query "DBInstances[0].StorageEncrypted"

# Check S3 encryption
aws s3api get-bucket-encryption --bucket hospital-frontend-dev-2026

# Check S3 bucket policy
aws s3api get-bucket-policy --bucket hospital-frontend-dev-2026
```

---

### Task 11: Verify Security Groups

```bash
# List security group rules
aws ec2 describe-security-groups --group-names pm-system-sg \
  --query "SecurityGroups[0].IpPermissions"
```

In AWS Console, check:
1. `pm-system-sg` only has necessary ports open (22, 5432, 4000-4010)
2. No 0.0.0.0/0 on database ports (5432) in production design

---

### Task 12: Report Compilation (All Members)

Collect screenshots from each team member:

| Member | Screenshots Needed |
|--------|-------------------|
| Anjali | VPC, subnets, security groups, NAT, IGW, ALB |
| Bishar | Auto-scaling group, HTTPS listener, appointment API tests |
| Nishan | S3 buckets, lifecycle rules, backup script, image upload test |
| Hirusha (you) | CloudWatch dashboard, alarms, k6 output, RBAC tests |

**Compile into report:**
1. Create a `docs/` folder for each section
2. Collect all screenshots in one place
3. Write the report document (4000-6000 words) in Google Docs/Word

---

### Summary

| # | Task | Status |
|---|------|--------|
| 1 | Install k6 | ⬅️ **Your task** |
| 2 | Create CloudWatch dashboard | ⬅️ **Your task** |
| 3 | Create CloudWatch alarms | ⬅️ **Your task** |
| 4 | Write k6 load test script | ⬅️ **Your task** |
| 5 | Run local load test | ⬅️ **Your task** |
| 6 | Run cloud load test | ⬅️ **Your task** |
| 7 | Verify RBAC security | ⬅️ **Your task** |
| 8 | Verify encryption & SGs | ⬅️ **Your task** |
| 9 | Compile report sections | ⬅️ **Your task** |
| 10 | Prepare presentation slides | ⬅️ **Your task** |

### Need Help?

- **k6 installation**: If winget fails, download from https://k6.io/docs/get-started/installation/
- **AWS CLI**: Run `aws configure` first with your IAM keys
- **CloudWatch**: Make sure your IAM user has `CloudWatchFullAccess` policy
- If any command fails → take a screenshot of the error and ask Chamuditha
