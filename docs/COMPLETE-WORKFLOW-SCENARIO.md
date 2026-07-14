# Complete Workflow Scenario — A Patient's Journey

---

## Characters

| Person | Role |
|---|---|
| Sarah | Patient — walks into the hospital for the first time |
| Dr. Kamal | Cardiologist at the hospital |
| Nurse Priya | Hospital STAFF (receptionist) handling registration |
| System Admin Chamuditha | SUPER_ADMIN — manages the entire system |
| Test Admin | ADMIN — created by Chamuditha, manages doctors & staff |

---

## Role Hierarchy

| Role | Capabilities |
|---|---|
| **SUPER_ADMIN** | Full access — create/delete ADMINS, manage all users, all data |
| **ADMIN** | Create/manage DOCTORs, create STAFF members, manage patients |
| **DOCTOR** | Medical work — consultations, imaging upload, patient records |
| **STAFF** | Front-desk — register patients, book appointments, view records |
| **PATIENT** | Own appointments and data only |

---

## Scene 1 — Arrival & Registration

Sarah walks into the hospital reception. She has never been here before.

**Nurse Priya** opens the system on the front desk computer. She logs in:

```
/login
  email:    priya@hospital.com
  password: ********

→ POST http://localhost:4005/login
→ 200 { token: "eyJhbG..." }
→ Redirect to /dashboard
```

She clicks **"New Patient"** and fills Sarah's details:

```
POST /api/patients
  Body: {
    "name": "Sarah Johnson",
    "email": "sarah.j@email.com",
    "phone": "+94-11-9876543",
    "address": "42 Flower Road, Colombo",
    "dateOfBirth": "1992-03-15",
    "registeredDate": "2026-07-14"
  }
  Header: Authorization: Bearer eyJhbG...

→ Backend (patient-service:4000):
    1. Validates all fields ✅
    2. Checks email uniqueness ✅ (no duplicate)
    3. Saves to PostgreSQL `patient` table
    4. Sends gRPC → billing-service — creates billing account (ACTIVE)
    5. Publishes PatientEvent to Kafka topic "patient"
       → analytics-service logs: "Patient created: Sarah Johnson"
    6. Returns:

→ 200 { "id": "a1b2c3d4-...", "name": "Sarah Johnson", ... }
```

**Nurse Priya** sees the success toast: *"Patient created"* and hands Sarah her patient ID card.

---

## Scene 2 — Booking an Appointment

Sarah needs to see a cardiologist. Nurse Priya clicks **"New Appointment"**.

The form loads:

```
GET /api/patients       → dropdown of all patients (Sarah selected)
GET /api/doctors        → dropdown of all doctors
```

Nurse Priya selects **Dr. Kamal** (Cardiology) and picks **tomorrow's date**.

```
GET /api/appointments/doctor/7fb6bfa2-.../available?date=2026-07-15

→ Backend appointment-service:4006:
    1. Generates 30-min slots: 09:00, 09:30, 10:00, ..., 16:30
    2. Queries existing appointments for Dr. Kamal on that date
    3. Returns free slots (no conflicts yet):

→ 200 ["2026-07-15T09:00:00", "2026-07-15T09:30:00", ...]
```

Nurse Priya picks **09:30**, types *"Chest pain and shortness of breath"* as reason, and clicks **Create**:

```
POST /api/appointments
  Body: {
    "patientId": "a1b2c3d4-...",
    "doctorId": "7fb6bfa2-...",
    "appointmentDateTime": "2026-07-15T09:30:00",
    "reason": "Chest pain and shortness of breath"
  }

→ Backend appointment-service:4006:
    1. Validates: patientId ✅, doctorId ✅, future datetime ✅, reason ✅
    2. Checks conflict: existsByDoctorIdAndAppointmentDateTime → false ✅
    3. Saves to MySQL `appointments` table (status: SCHEDULED)
    4. Publishes AppointmentEvent to Kafka topic "appointment"
       → analytics-service logs: "Appointment CREATED: Dr. Kamal — Sarah Johnson"
    5. Returns:

→ 200 { "id": "f5e6d7c8-...", "status": "SCHEDULED", "appointmentDateTime": "2026-07-15T09:30:00", ... }
```

Toast: *"Appointment created"*.

---

## Scene 3 — The Next Day: Doctor Consultation

Sarah arrives at the hospital and checks in. Dr. Kamal opens the system and logs in:

```
→ POST /api/appointments/doctor/7fb6bfa2-...
→ 200 [ list of today's appointments ]

  He sees:
  ┌──────────┬──────────────┬──────────┬──────────────┐
  │ Patient  │ Time         │ Reason   │ Status       │
  ├──────────┼──────────────┼──────────┼──────────────┤
  │ Sarah J. │ 09:30        │ Chest... │ SCHEDULED ✅ │
  └──────────┴──────────────┴──────────┴──────────────┘
```

He clicks Sarah's appointment → `/appointments/f5e6d7c8-...`

He sees the **"Create Consultation"** button. He clicks it.

```
[Consultation Form]
  Symptoms:     "Chest pain for 2 weeks, worsens with exertion. Shortness of breath."
  Diagnosis:    "Stable angina — suspected coronary artery disease"
  Notes:        "Patient advised lifestyle changes. Prescribed nitroglycerin. Follow-up in 2 weeks."

  → POST /api/consultations
    Body: {
      "appointmentId": "f5e6d7c8-...",
      "patientId": "a1b2c3d4-...",
      "symptoms": "Chest pain for 2 weeks...",
      "diagnosis": "Stable angina...",
      "notes": "Patient advised lifestyle changes..."
    }

  → Backend (appointment-service:4006):
      1. Saves consultation to MySQL `consultations` table
      2. Auto-updates appointment status to COMPLETED
      3. Publishes AppointmentEvent to Kafka (APPOINTMENT_COMPLETED)
        → analytics-service logs: "Appointment COMPLETED: Dr. Kamal — Sarah Johnson"
      4. Returns:

  → 200 { "id": "x1y2z3-...", "diagnosis": "Stable angina...", ... }
```

Toast: *"Consultation saved — Appointment completed"*.

---

## Scene 4 — Medical Imaging

Dr. Kamal needs an X-ray and MRI to confirm his diagnosis. He goes to Sarah's patient detail page:

```
/patients/a1b2c3d4-...
```

He clicks **"Upload Medical Image"** and uploads the chest X-ray:

```
POST /api/images/upload
  Multipart: file (chest_xray_2026-07-15.png)
  Fields:   patientId = "a1b2c3d4-..."
            imageType = "XRAY"

  → Backend (imaging-service:4007):
      1. Validates file type (PNG allowed) ✅
      2. Saves file to /app/images/a1b2c3d4/xyz-chest_xray_2026-07-15.png
      3. Saves metadata row in PostgreSQL `medical_images` table
      4. Returns:

  → 200 { "id": "img001-...", "imageType": "XRAY", "fileName": "chest_xray_2026-07-15.png", "uploadedDate": "2026-07-15T09:45:00" }
```

Toast: *"Image uploaded successfully"*.

He uploads the MRI result the same way:

```
POST /api/images/upload
  imageType: "MRI"
  file: brain_mri_2026-07-15.png

→ 200 { "id": "img002-...", "imageType": "MRI", ... }
```

Both images now appear in Sarah's **Medical Images** section on her patient detail page **and** on the appointment detail page.

---

## Scene 5 — Patient History & Follow-Up

Two weeks later, Sarah returns for a follow-up. Dr. Kamal opens her record:

```
GET /api/patients/a1b2c3d4-...

Patient Profile:
  Name:     Sarah Johnson
  DOB:      1992-03-15
  Status:   ACTIVE ✅
```

He scrolls to **Consultation History**:

```
GET /api/consultations/patient/a1b2c3d4-...

→ 200 [{
    "date": "2026-07-15",
    "doctor": "Dr. Kamal",
    "diagnosis": "Stable angina...",
    "notes": "Patient advised lifestyle changes..."
}]
```

He scrolls to **Medical Images**:

```
GET /api/images/patient/a1b2c3d4-...

→ 200 [
  { "type": "XRAY", "fileName": "chest_xray_2026-07-15.png", "date": "2026-07-15" },
  { "type": "MRI",  "fileName": "brain_mri_2026-07-15.png",  "date": "2026-07-15" }
]
```

He clicks the X-ray to view it:

```
GET /api/images/img001-...
→ 200 (file stream — browser renders the PNG)
```

Dr. Kamal sees improvement. He books a new follow-up appointment for 3 months from now.

---

## Scene 6 — Admin: System Management

**Chamuditha** (SUPER_ADMIN) logs in:

```
/login
  email:    chamuditha@hospital.com
  password: Admin@123
```

He sees **"Admin Mgmt"** and **"Staff"** links in the sidebar (SUPER_ADMIN only / ADMIN+).

He opens **Admin Mgmt** `/admin/users` to create a new administrator:

```
POST /admin/create
  Body: { "name": "Test Admin", "email": "admin@hospital.com", "password": "securepass123" }
  Header: Authorization: Bearer <SUPER_ADMIN_TOKEN>

→ 201 { "id": "...", "name": "Test Admin", "email": "admin@hospital.com", "role": "ADMIN" }
Toast: "Admin created"
```

The new ADMIN can now log in and create STAFF members:

```
POST /admin/staff
  Body: { "name": "Nurse Priya", "email": "priya@hospital.com", "password": "staffpass123" }
  Header: Authorization: Bearer <ADMIN_TOKEN>

→ 201 { "id": "...", "name": "Nurse Priya", "email": "priya@hospital.com", "role": "STAFF" }
Toast: "Staff created"
```

Chamuditha clicks **"New Doctor"** to onboard a new cardiologist:

```
POST /api/doctors
  Body: { "name": "Dr. Fernando", "email": "fernando@hospital.com", "specialization": "Cardiology", "department": "Cardiology Dept" }

→ 200 ✅
Toast: "Doctor created"
```

He visits the **Schedule** page to view Dr. Kamal's availability:

```
/doctors/schedule
  Select: Dr. Kamal
  Date:   2026-07-15

  Side-by-side:
  ┌─────────────────────┐  ┌─────────────────────┐
  │ Available Slots     │  │ Booked Appointments  │
  ├─────────────────────┤  ├─────────────────────┤
  │ 09:00 ✅             │  │ 09:30 — Sarah J.    │
  │ 10:00 ✅             │  │                     │
  │ 10:30 ✅             │  │                     │
  │ ...                 │  │                     │
  └─────────────────────┘  └─────────────────────┘
```

---

## What the Analytics Service Sees

Throughout the entire journey, the analytics-service logs every event:

```
[Kafka Consumer] Topic: "patient"
  → PatientEvent{ patientID: a1b2c3d4, name: "Sarah Johnson", eventType: "PATIENT_CREATED" }

[Kafka Consumer] Topic: "appointment"
  → AppointmentEvent{ appointmentID: f5e6d7c8, patientID: a1b2c3d4,
                      doctorID: 7fb6bfa2, status: "SCHEDULED",
                      eventType: "APPOINTMENT_CREATED" }

  → AppointmentEvent{ appointmentID: f5e6d7c8, status: "COMPLETED",
                      eventType: "APPOINTMENT_COMPLETED" }
```

---

## Security: What an Attacker Cannot Do

| Attempt | Result |
|---|---|
| `curl DELETE /api/patients/123` (no JWT) | **401 Unauthorized** |
| `curl DELETE /api/patients/123` (PATIENT JWT) | **403 Forbidden** |
| `curl DELETE /api/doctors/123` (DOCTOR JWT) | **403 Forbidden** |
| `curl GET /api/patients` (PATIENT JWT) | **403 Forbidden** |
| `curl POST /api/appointments` (no JWT) | **401 Unauthorized** |
| `curl POST /api/images/upload` (PATIENT JWT) | **403 Forbidden** |
| `curl POST /api/consultations` (PATIENT JWT) | **403 Forbidden** |
| `curl POST /admin/create` (ADMIN JWT) | **403 Forbidden** (only SUPER_ADMIN) |
| `curl POST /admin/staff` (DOCTOR JWT) | **403 Forbidden** (only ADMIN/SUPER_ADMIN) |

Only requests with the correct role pass through.

---

## Registration Rules

- Public registration (`/register`) only accepts **DOCTOR** and **PATIENT** roles.
- **SUPER_ADMIN** is seeded on startup (chamuditha@hospital.com / Admin@123).
- **ADMIN** can only be created by an existing SUPER_ADMIN via `POST /admin/create`.
- **STAFF** can only be created by SUPER_ADMIN or ADMIN via `POST /admin/staff`.

---

## End State

After this scenario, the database contains:

```
PostgreSQL (patient-service):
  patients: [ Sarah Johnson, ... ]     ← all ACTIVE

MySQL (appointment-service):
  appointments: [ Sarah @ 09:30 ]      ← COMPLETED
  consultations: [ Sarah's record ]    ← with diagnosis & notes
  doctors: [ Dr. Kamal, Dr. Fernando ] ← managed by ADMIN

PostgreSQL (imaging-service):
  medical_images: [ XRAY, MRI ]        ← linked to Sarah

PostgreSQL (auth-service):
  users: [ chamuditha(SUPER_ADMIN), admin(ADMIN), priya(STAFF), dr.kamal(DOCTOR), sarah(PATIENT) ]

Kafka topics:
  "patient"     → 1 event (PATIENT_CREATED)
  "appointment" → 2 events (CREATED, COMPLETED)
```

A complete, auditable, secure hospital management workflow from arrival to diagnosis to follow-up.
