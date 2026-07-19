# API Testing Flow

## Architecture

```
CloudFront (ETMBF1XUJRC7L)   S3 Website (hospital-frontend-dev-2026)
         |                              |
   /api/* → ALB:80          /* → S3 Origin (SPA)
         |
    pm-alb-2089108845.ap-southeast-1.elb.amazonaws.com
         |
    Target Group (pm-tg-api, port 4004)
         |
    API Gateway (api-getway:4004)
         |
    ┌────┼────┬────┬────┬────┐
    │    │    │    │    │    │
  Auth Patient Appt Imaging Billing Analytics
  :4005  :4000 :4006 :4007  :4001  :4002
```

---

## Where to Test

| Environment | Base URL | Notes |
|---|---|---|
| **Local Dev** | `http://127.0.0.1:8083/api` | Vite proxy → gateway → services. User must be logged in for most endpoints |
| **Local Direct** | `http://localhost:4004/api` | Gateway port mapped to host. No auth token needed for login/register |
| **CloudFront (prod)** | `https://d1u7ou5tjk1m56.cloudfront.net/api` | → ALB → gateway. Currently broken (403 Error from cloudfront) |
| **EC2 Direct** | `http://<EC2-PUBLIC-IP>:4004/api` | Direct to gateway if ALB fails |

---

## Auth Flow

### 1. Register

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "PATIENT"
}
```

```bash
curl -X POST "http://localhost:4004/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"PATIENT"}'
```

### 2. Login (get token)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

```bash
curl -X POST "http://localhost:4004/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Response** (store the token):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "ADMIN",
  "name": "Admin",
  "email": "admin@example.com"
}
```

### 3. Authenticated Requests

All subsequent requests include:

```bash
Authorization: Bearer <token>
```

---

## Endpoints by Service

### Auth Service (`/api/auth/**` → auth-service:4005, StripPrefix=2)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | Login | All |
| POST | `/api/auth/register` | Register | All |
| GET | `/api/auth/admin/users` | List all users | ADMIN |
| POST | `/api/auth/admin/create` | Create admin user | ADMIN |
| DELETE | `/api/auth/admin/{id}` | Delete admin | ADMIN |
| GET | `/api/auth/admin/staff` | List staff | ADMIN |
| POST | `/api/auth/admin/staff` | Create staff | ADMIN |
| DELETE | `/api/auth/admin/staff/{id}` | Delete staff | ADMIN |

#### Test: List Users

```bash
curl -X GET "http://localhost:4004/api/auth/admin/users" \
  -H "Authorization: Bearer <admin-token>"
```

#### Test: Create Staff

```bash
curl -X POST "http://localhost:4004/api/auth/admin/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"name":"Dr. Smith","email":"smith@hospital.com","password":"pass123"}'
```

#### Test: Delete Staff

```bash
curl -X DELETE "http://localhost:4004/api/auth/admin/staff/1" \
  -H "Authorization: Bearer <admin-token>"
```

---

### Patient Service (`/api/patients/**` → patient-service:4000, StripPrefix=1)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| GET | `/api/patients` | List all patients | ADMIN, DOCTOR, STAFF |
| GET | `/api/patients/{id}` | Get patient by ID | ADMIN, DOCTOR, STAFF, PATIENT (own) |
| POST | `/api/patients` | Create patient | ADMIN, STAFF |
| PUT | `/api/patients/{id}` | Update patient | ADMIN, STAFF |
| DELETE | `/api/patients/{id}` | Delete patient | ADMIN |

#### Test: List Patients

```bash
curl -X GET "http://localhost:4004/api/patients" \
  -H "Authorization: Bearer <token>"
```

#### Test: Get Patient by ID

```bash
curl -X GET "http://localhost:4004/api/patients/1" \
  -H "Authorization: Bearer <token>"
```

#### Test: Create Patient

```bash
curl -X POST "http://localhost:4004/api/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "John Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "phone": "+94771234567",
    "email": "john@example.com",
    "address": "123 Main St"
  }'
```

#### Test: Update Patient

```bash
curl -X PUT "http://localhost:4004/api/patients/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"name":"John Updated","phone":"+94779876543"}'
```

#### Test: Delete Patient

```bash
curl -X DELETE "http://localhost:4004/api/patients/1" \
  -H "Authorization: Bearer <admin-token>"
```

---

### Doctor Service (`/api/doctors/**` → appointment-service:4006, StripPrefix=1)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| GET | `/api/doctors` | List all doctors | All |
| GET | `/api/doctors/{id}` | Get doctor by ID | All |
| POST | `/api/doctors` | Create doctor | ADMIN |
| PUT | `/api/doctors/{id}` | Update doctor | ADMIN |
| DELETE | `/api/doctors/{id}` | Delete doctor | ADMIN |

#### Test: List Doctors

```bash
curl -X GET "http://localhost:4004/api/doctors" \
  -H "Authorization: Bearer <token>"
```

#### Test: Create Doctor

```bash
curl -X POST "http://localhost:4004/api/doctors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "Dr. Sarah Wilson",
    "specialization": "CARDIOLOGY",
    "phone": "+94771112233",
    "email": "sarah@hospital.com"
  }'
```

---

### Appointment Service (`/api/appointments/**` → appointment-service:4006, StripPrefix=1)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| GET | `/api/appointments` | List all appointments | ADMIN, DOCTOR, STAFF |
| GET | `/api/appointments/{id}` | Get appointment by ID | ADMIN, DOCTOR, STAFF, PATIENT (own) |
| GET | `/api/appointments/patient/{patientId}` | Get appointments by patient | ADMIN, DOCTOR, PATIENT (own) |
| GET | `/api/appointments/doctor/{doctorId}` | Get appointments by doctor | ADMIN, DOCTOR (own) |
| POST | `/api/appointments` | Create appointment | ADMIN, PATIENT |
| PUT | `/api/appointments/{id}/cancel` | Cancel appointment | ADMIN, PATIENT (own) |
| PUT | `/api/appointments/{id}/complete` | Complete appointment | ADMIN, DOCTOR |
| GET | `/api/appointments/doctor/{doctorId}/available?date=YYYY-MM-DD` | Get available slots | All |

#### Test: List Appointments

```bash
curl -X GET "http://localhost:4004/api/appointments" \
  -H "Authorization: Bearer <token>"
```

#### Test: Create Appointment

```bash
curl -X POST "http://localhost:4004/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <patient-token>" \
  -d '{
    "patientId": 1,
    "doctorId": 1,
    "appointmentDate": "2026-07-20",
    "appointmentTime": "10:00",
    "reason": "Regular checkup"
  }'
```

#### Test: Get Available Slots

```bash
curl -X GET "http://localhost:4004/api/appointments/doctor/1/available?date=2026-07-20" \
  -H "Authorization: Bearer <token>"
```

#### Test: Cancel Appointment

```bash
curl -X PUT "http://localhost:4004/api/appointments/1/cancel" \
  -H "Authorization: Bearer <token>"
```

#### Test: Complete Appointment

```bash
curl -X PUT "http://localhost:4004/api/appointments/1/complete" \
  -H "Authorization: Bearer <doctor-token>"
```

---

### Consultation Service (`/api/consultations/**` → appointment-service:4006, StripPrefix=1)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| POST | `/api/consultations` | Create consultation | ADMIN, DOCTOR |
| GET | `/api/consultations/appointment/{appointmentId}` | Get by appointment | ADMIN, DOCTOR, PATIENT (own) |
| GET | `/api/consultations/patient/{patientId}` | Get by patient | ADMIN, DOCTOR, PATIENT (own) |

#### Test: Create Consultation

```bash
curl -X POST "http://localhost:4004/api/consultations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <doctor-token>" \
  -d '{
    "appointmentId": 1,
    "diagnosis": "Common cold",
    "prescription": "Rest and paracetamol",
    "notes": "Follow up in 1 week if symptoms persist"
  }'
```

---

### Imaging Service (`/api/images/**` → imaging-service:4007, StripPrefix=1)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| POST | `/api/images/upload` | Upload medical image (FormData) | ADMIN, DOCTOR, STAFF |
| GET | `/api/images/patient/{patientId}` | Get images by patient | ADMIN, DOCTOR, PATIENT (own) |
| GET | `/api/images/{id}` | Get image file | ADMIN, DOCTOR, PATIENT (own) |

#### Test: Upload Image

```bash
curl -X POST "http://localhost:4004/api/images/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/xray.jpg" \
  -F "patientId=1" \
  -F "imageType=XRAY"
```

#### Test: Get Patient Images

```bash
curl -X GET "http://localhost:4004/api/images/patient/1" \
  -H "Authorization: Bearer <token>"
```

#### Test: View Image

```bash
# Direct browser URL (or curl with appropriate Accept header)
http://localhost:4004/api/images/1
```

---

### API Docs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api-docs/patients` | Swagger docs (patient-service) |
| GET | `/api-docs/appointments` | Swagger docs (appointment-service) |

```bash
curl -X GET "http://localhost:4004/api-docs/patients"
curl -X GET "http://localhost:4004/api-docs/appointments"
```

---

## End-to-End Testing Scenarios

### Scenario 1: Patient Registration & Login

```bash
# 1. Register
curl -s -X POST "http://localhost:4004/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Patient","email":"jane@test.com","password":"pass123","role":"PATIENT"}' | jq .

# 2. Login
TOKEN=$(curl -s -X POST "http://localhost:4004/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@test.com","password":"pass123"}' | jq -r '.token')

# 3. Browse doctors
curl -s "http://localhost:4004/api/doctors" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. Check available slots
curl -s "http://localhost:4004/api/appointments/doctor/1/available?date=2026-07-20" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Book appointment
curl -s -X POST "http://localhost:4004/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patientId":1,"doctorId":1,"appointmentDate":"2026-07-20","appointmentTime":"10:00","reason":"Checkup"}' | jq .
```

### Scenario 2: Admin Creates Doctor & Staff

```bash
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:4004/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.token')

# Create staff user (who can manage patients)
curl -s -X POST "http://localhost:4004/api/auth/admin/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Receptionist","email":"reception@hospital.com","password":"pass123"}' | jq .

# Create doctor
curl -s -X POST "http://localhost:4004/api/doctors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Dr. House","specialization":"DIAGNOSTICS","phone":"+94770001111","email":"house@hospital.com"}' | jq .
```

### Scenario 3: Full Appointment Lifecycle

```bash
# Admin creates patient
curl -s -X POST "http://localhost:4004/api/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"John Doe","dateOfBirth":"1990-05-15","gender":"MALE","phone":"+94771234567"}' | jq .

# Patient books appointment → Doctor completes → Consultation created

# 1. Book
curl -s -X POST "http://localhost:4004/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d '{"patientId":1,"doctorId":1,"appointmentDate":"2026-07-21","appointmentTime":"14:00","reason":"Chest pain"}' | jq .

# 2. Complete (doctor)
curl -s -X PUT "http://localhost:4004/api/appointments/1/complete" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" | jq .

# 3. Add consultation notes
curl -s -X POST "http://localhost:4004/api/consultations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -d '{"appointmentId":1,"diagnosis":"Anxiety","prescription":"Rest","notes":"Patient reassured"}' | jq .
```

---

## Role-Based Access Summary

| Role | Access |
|---|---|
| **ADMIN** | Everything — CRUD all entities, manage users, manage staff |
| **DOCTOR** | Read patients/appointments, complete appointments, create consultations |
| **STAFF** | Create/update patients and appointments (no doctor management) |
| **PATIENT** | Create own appointments, view own data, cancel own appointments |

---

## Testing via Gateway Direct (when CloudFront is broken)

Replace `http://localhost:4004` with your EC2 public IP:

```bash
BASE="http://<EC2-PUBLIC-IP>:8083/api"
```

## Testing via CloudFront (when fixed)

```bash
BASE="https://d1u7ou5tjk1m56.cloudfront.net/api"
```

---

## Common Issues

| Issue | Likely Cause |
|---|---|
| `401 Unauthorized` | Missing/invalid/expired token |
| `403 Forbidden` | Role lacks permission for the endpoint |
| `404 Not Found` | Wrong path or service not routing correctly |
| `x-cache: Error from cloudfront` | CloudFront cannot reach ALB (SG, NACL, DNS) |
| `Empty response / CORS error` | CORS not configured on gateway or service |
| `Connection refused` | Docker container not running or port not mapped |
