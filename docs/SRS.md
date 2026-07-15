# Software Requirements Specification — Cloud-Based Hospital Management System

---

## 1. Introduction

### 1.1 Purpose
This document defines the complete workflows implemented in the frontend application. Each workflow describes the step-by-step user journey through the React SPA, including the page flow, API calls made, and the resulting backend behavior.

### 1.2 System Overview
A modular hospital management platform with a React frontend communicating with six Spring Boot microservices via REST (through Spring Cloud Gateway) and direct HTTP. Backend services handle patient records, appointment scheduling, doctor management, billing, analytics, and JWT authentication.

### 1.3 Technology Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 5, React Router 7, Axios 1.18 |
| API Gateway | Spring Cloud Gateway (port 4004) |
| Backend | Java 21, Spring Boot 3.5.x |
| Auth | JWT (HMAC-SHA256, 10-hour expiry) |
| Databases | PostgreSQL (patient-service, auth-service), MySQL (appointment-service) |
| Messaging | Apache Kafka 3.9.0 (topics: patient, appointment) |
| RPC | gRPC (patient-service → billing-service) |

---

## 2. Frontend Application Structure

### 2.1 Page Routing

| Path | Page Component | Auth Required | Role Restriction |
|---|---|---|---|
| `/login` | Login | No | — |
| `/dashboard` | Dashboard | Yes | — |
| `/patients` | PatientList | Yes | — |
| `/patients/new` | PatientForm | Yes | — |
| `/patients/:id` | PatientDetail | Yes | — |
| `/patients/:id/edit` | PatientForm | Yes | — |
| `/appointments` | AppointmentList | Yes | — |
| `/appointments/new` | AppointmentForm | Yes | — |
| `/appointments/:id` | AppointmentDetail | Yes | — |
| `/doctors` | DoctorList | Yes | — |
| `/doctors/new` | DoctorForm | Yes | ADMIN only |
| `/doctors/:id` | DoctorDetail | Yes | — |
| `/doctors/:id/edit` | DoctorForm | Yes | ADMIN only |
| `/doctors/schedule` | DoctorSchedule | Yes | — |

### 2.2 Shared UI Components

| Component | Purpose |
|---|---|
| `Button` | Styled button with loading spinner, variants: primary/secondary/danger/ghost |
| `Input` | Text input with label and inline error display (red border + error text) |
| `Select` | Dropdown with label, placeholder, and inline error display |
| `Badge` | Status badge with color-coded variants: SCHEDULED (blue), COMPLETED (green), CANCELLED (red), NO_SHOW (gray) |
| `Table<T>` | Generic table with typed columns, optional row click handler, loading skeleton |
| `Card` | Container card with optional title |
| `Toast` | Global notification system (top-right, 4s auto-dismiss), types: success (green), error (red) |
| `ProtectedRoute` | Route guard — redirects to `/login` if unauthenticated, shows forbidden message if role mismatch |
| `AppLayout` | Application shell with Sidebar + content `<Outlet/>` |
| `Sidebar` | Navigation sidebar — links rendered conditionally based on user role |

### 2.3 Error Handling Pattern (all forms)
1. On API error, `parseError()` extracts `message` and `fieldErrors` from the backend `ErrorResponseDTO`
2. The `message` is shown in a red toast
3. Each field in `fieldErrors` is mapped to its corresponding `Input`/`Select` via the `error` prop — renders a red border + error text beneath the field
4. Errors clear automatically when the user starts editing the field

---

## 3. Authentication Workflow

### 3.1 User Login

```
Start
  │
  ▼
[Login Page]  (/login)
  │
  ├── User enters email + password
  │
  ├── User clicks "Sign In"
  │     │
  │     ├── Client-side: nothing beyond HTML5 validation
  │     │
  │     ▼
  │   POST http://localhost:4005/login
  │   Body: { email, password }
  │     │
  │     ├── SUCCESS (200)
  │     │     ├── Response: { token: "jwt-string" }
  │     │     ├── Store token in localStorage
  │     │     ├── Decode JWT → extract sub (email) + role
  │     │     ├── Save { token, email, role } in AuthContext
  │     │     └── Navigate to /dashboard
  │     │
  │     └── ERROR (401)
  │           ├── Backend: "Invalid credentials"
  │           └── Toast: "Invalid credentials" (red)
  │
  └── User clicks "Register here" link
        └── Toggle to Register mode
```

### 3.2 User Registration

```
[Login Page — Register mode]
  │
  ├── User enters email + password + selects role (PATIENT/DOCTOR/ADMIN)
  │
  ├── User clicks "Sign Up"
  │     │
  │     ▼
  │   POST http://localhost:4005/register
  │   Body: { email, password, role }
  │     │
  │     ├── SUCCESS (200)
  │     │     ├── Response: { token: "jwt-string" }
  │     │     └── Same as Login success (store JWT, decode, redirect to /dashboard)
  │     │
  │     └── ERROR (400 / 409)
  │           ├── Backend: "Email address already exists" / validation errors
  │           └── Toast: error message (red)
  │
  └── User clicks "Login here" link
        └── Toggle to Login mode
```

### 3.3 Session Handling
- On 401 response from any API call, the Axios interceptor:
  1. Clears `token` from localStorage
  2. Redirects to `/login`
- On manual logout (sidebar button):
  1. Clears `token` from localStorage
  2. Clears AuthContext
  3. Navigates to `/login`

---

## 4. Dashboard Workflow

### 4.1 Page Load

```
[Dashboard]  (/dashboard)
  │
  ├── ProtectedRoute checks: token exists in localStorage?
  │     ├── No  → redirect to /login
  │     └── Yes → render Dashboard
  │
  ├── useEffect triggers parallel API calls:
  │     │
  │     ├── GET /api/patients
  │     │     ├── SUCCESS → store patient list → compute count
  │     │     └── ERROR   → toast error
  │     │
  │     ├── GET /api/appointments
  │     │     ├── SUCCESS → store appointment list
  │     │     │             → compute counts by status (SCHEDULED / COMPLETED / CANCELLED)
  │     │     └── ERROR   → toast error
  │     │
  │     └── (on success) Derive latest 5 patients + latest 5 appointments
  │
  └── Render:
        ├── Stats cards: Total Patients | Scheduled Appointments | Completed | Cancelled
        ├── Recent Patients table (5 rows) with "View All" link
        ├── Recent Appointments table (5 rows) with "View All" link
        └── Quick action buttons:
              ├── "New Patient" → navigate to /patients/new
              └── "New Appointment" → navigate to /appointments/new
```

### 4.2 Role-Based Visibility
- All roles see the same dashboard layout
- Sidebar links differ by role (see Section 10)

---

## 5. Patient Management Workflow

### 5.1 List Patients

```
[Patient List]  (/patients)
  │
  ├── ProtectedRoute: must be authenticated
  │
  ├── useEffect: GET /api/patients
  │     ├── SUCCESS → store list
  │     └── ERROR   → toast: parsed error message
  │
  ├── Render: Table with columns:
  │     Name | Email | Phone | Address | Actions
  │
  ├── Row click → navigate to /patients/{id}
  │
  ├── "Edit" button → navigate to /patients/{id}/edit
  │
  ├── "Delete" button:
  │     ├── Confirm dialog (window.confirm)
  │     ├── DELETE /api/patients/{id}
  │     │     ├── SUCCESS → toast "Patient deleted" + refetch list
  │     │     └── ERROR   → toast error message
  │     └── (no delete if confirm cancelled)
  │
  └── "New Patient" button → navigate to /patients/new
```

### 5.2 Create Patient

```
[Patient Form — Create]  (/patients/new)
  │
  ├── Render empty form:
  │     name* | email* | phone | address* | dateOfBirth* | registeredDate*
  │
  ├── User fills fields and clicks "Create"
  │     │
  │     ├── Client-side: no extra validation (HTML5 required attributes)
  │     │
  │     ▼
  │   POST /api/patients
  │   Body: { name, email, phone, address, dateOfBirth, registeredDate }
  │     │
  │     ├── SUCCESS (200)
  │     │     ├── Toast: "Patient created" (green)
  │     │     └── Navigate to /patients
  │     │
  │     └── ERROR (400 / 409 / 500)
  │           ├── Parse ErrorResponseDTO
  │           ├── Toast: parsed.message (red)  (e.g. "Email Already Exists")
  │           ├── Field errors mapped to Input components:
  │           │     errors.email  → Input "Email" gets red border + error text
  │           │     errors.name   → Input "Name" gets red border + error text
  │           │     ...
  │           └── Errors clear when user edits the field
  │
  └── "Cancel" button → navigate to /patients
```

### 5.3 Edit Patient

```
[Patient Form — Edit]  (/patients/{id}/edit)
  │
  ├── useEffect: GET /api/patients/{id}
  │     ├── SUCCESS → populate form fields
  │     └── ERROR   → toast error
  │
  ├── Same form as Create, pre-filled with existing values
  │
  ├── User modifies fields and clicks "Update"
  │     │
  │     ▼
  │   PUT /api/patients/{id}
  │   Body: { name, email, phone, address, dateOfBirth, registeredDate }
  │     │
  │     ├── SUCCESS → toast "Patient updated" + navigate to /patients
  │     └── ERROR   → field-level errors + toast (same as Create)
  │
  └── "Cancel" button → navigate to /patients
```

### 5.4 View Patient Detail

```
[Patient Detail]  (/patients/{id})
  │
  ├── useEffect (parallel):
  │     ├── GET /api/patients/{id}
  │     │     ├── SUCCESS → display patient info
  │     │     └── ERROR   → toast error
  │     │
  │     └── GET /api/appointments/patient/{patientId}
  │           ├── SUCCESS → display linked appointments table
  │           └── ERROR   → ignore (show empty)
  │
  ├── Render:
  │     ├── Patient info cards: name, email, phone, address, DOB, registered date
  │     ├── "Edit" button → /patients/{id}/edit
  │     ├── Linked Appointments table:
  │     │     Doctor | Date/Time | Status (Badge) | Reason
  │     │     (row click → /appointments/{id})
  │     └── "New Appointment" button → /appointments/new
  │
  └── Back button → /patients
```

---

## 6. Doctor Management Workflow

### 6.1 List Doctors

```
[Doctor List]  (/doctors)
  │
  ├── useEffect: GET /api/doctors
  │     ├── SUCCESS → store list
  │     └── ERROR   → toast error
  │
  ├── Render: Table with columns:
  │     Name | Email | Specialization | Department | Phone | Appointments
  │
  ├── Row click → navigate to /doctors/{id}
  │
  ├── "Edit" button → /doctors/{id}/edit (visible only if role === ADMIN)
  │
  └── "New Doctor" button → /doctors/new (visible only if role === ADMIN)
```

### 6.2 Create Doctor (ADMIN only)

```
[Doctor Form — Create]  (/doctors/new)
  │
  ├── ProtectedRoute: requires role === ADMIN
  │     ├── If not ADMIN → show "Access Denied"
  │     └── If ADMIN → render form
  │
  ├── Render empty form:
  │     name* | email* | phone | specialization | department
  │
  ├── User fills fields and clicks "Create"
  │     │
  │     ▼
  │   POST /api/doctors
  │   Body: { name, email, phone, specialization, department }
  │     │
  │     ├── SUCCESS → toast "Doctor created" + navigate to /doctors
  │     └── ERROR   → field-level errors + toast (same error pattern)
  │
  └── "Cancel" button → /doctors
```

### 6.3 Edit Doctor (ADMIN only)

```
[Doctor Form — Edit]  (/doctors/{id}/edit)
  │
  ├── ProtectedRoute: ADMIN only
  ├── useEffect: GET /api/doctors/{id} → populate form
  ├── PUT /api/doctors/{id} on submit
  └── Same error handling as Create
```

### 6.4 View Doctor Detail

```
[Doctor Detail]  (/doctors/{id})
  │
  ├── useEffect (parallel):
  │     ├── GET /api/doctors/{id} → display info
  │     └── GET /api/appointments/doctor/{doctorId}
  │           ├── SUCCESS → display linked appointments
  │           └── ERROR   → ignore
  │
  ├── Render:
  │     ├── Info cards: name, email, phone, specialization, department
  │     ├── Stats: Scheduled: N, Completed: N
  │     ├── Appointments table:
  │     │     Patient | Date/Time | Status (Badge) | Reason
  │     │     (row click → /appointments/{id})
  │     ├── "Edit" button (ADMIN only)
  │     └── "View Schedule" button → /doctors/schedule
  │
  └── Back button → /doctors
```

### 6.5 View Doctor Schedule

```
[Doctor Schedule]  (/doctors/schedule)
  │
  ├── User selects a doctor from dropdown
  │     └── Options loaded from GET /api/doctors
  │
  ├── User selects a date from date picker
  │
  ├── useEffect (when both selected):
  │     ├── GET /api/appointments/doctor/{doctorId}/available?date=
  │     │     └── Returns list of free 30-min slots
  │     │
  │     └── GET /api/appointments/doctor/{doctorId}
  │           └── Returns booked appointments for that doctor
  │
  ├── Render side-by-side:
  │     ├── Left: Available Slots (green, selectable)
  │     └── Right: Booked Appointments (list with status badges)
  │
  └── "Book Appointment" on available slot → navigate to /appointments/new (pre-filled)
```

---

## 7. Appointment Management Workflow

### 7.1 List Appointments

```
[Appointment List]  (/appointments)
  │
  ├── useEffect: GET /api/appointments
  │     ├── SUCCESS → store list
  │     └── ERROR   → toast error
  │
  ├── Render: Table with columns:
  │     Patient ID | Doctor | Date/Time | Reason | Status (Badge) | Actions
  │
  ├── Row click → navigate to /appointments/{id}
  │
  ├── "Cancel" button (only shown if status === SCHEDULED):
  │     ├── PUT /api/appointments/{id}/cancel
  │     │     ├── SUCCESS → toast "Appointment cancelled" + refetch list
  │     │     └── ERROR   → toast error message
  │     └── (no confirmation dialog)
  │
  └── "New Appointment" button → /appointments/new
```

### 7.2 Create Appointment (Multi-Step)

```
[Appointment Form]  (/appointments/new)
  │
  ├── Step 1: Load reference data
  │     ├── useEffect: Promise.all([ GET /api/patients, GET /api/doctors ])
  │     │     ├── SUCCESS → populate Patient + Doctor dropdowns
  │     │     └── ERROR   → toast error
  │     └── Render:
  │           └── Select "Patient" (from patient list)
  │           └── Select "Doctor" (from doctor list)
  │
  ├── Step 2: Select date → load available slots
  │     ├── User selects a date via date picker
  │     ├── useEffect (doctorId + date both set):
  │     │     ├── GET /api/appointments/doctor/{doctorId}/available?date=
  │     │     │     ├── SUCCESS → display slot buttons (30-min intervals, 09:00–17:00)
  │     │     │     └── ERROR/empty → "No available slots for this date."
  │     │     └── (clears previously selected slot when doctor or date changes)
  │     └── User clicks a time slot button (highlighted when selected)
  │
  ├── Step 3: Enter reason
  │     └── Input "Reason" (required)
  │
  ├── Step 4: Submit
  │     ├── Client validation: if no slot selected → toast "Please select a time slot"
  │     │
  │     ▼
  │   POST /api/appointments
  │   Body: { patientId, doctorId, appointmentDateTime, reason }
  │     │
  │     ├── SUCCESS (200)
  │     │     ├── Toast: "Appointment created" (green)
  │     │     └── Navigate to /appointments
  │     │
  │     └── ERROR (400)
  │           ├── Validation failure (past date):
  │           │     ├── Toast: "must be a future date" (red)
  │           │     ├── Input "Date" gets error: "must be a future date"
  │           │     └── Time slots section shows same error
  │           │
  │           └── Business rule violation (duplicate slot):
  │                 ├── Toast: "Doctor already has an appointment at this time" (red)
  │                 └── Time slots section shows error text
  │
  └── "Cancel" button → /appointments
```

### 7.3 View Appointment Detail

```
[Appointment Detail]  (/appointments/{id})
  │
  ├── useEffect: GET /api/appointments/{id}
  │     ├── SUCCESS → display appointment info
  │     └── ERROR   → toast error
  │
  ├── Render:
  │     ├── Appointment ID, Patient ID, Doctor ID, Date/Time, Reason
  │     ├── Status as large Badge
  │     └── Action buttons (only if status === SCHEDULED):
  │           ├── "Mark Completed"
  │           │     ├── PUT /api/appointments/{id}/complete
  │           │     │     ├── SUCCESS → toast + refresh
  │           │     │     └── ERROR   → toast error
  │           │     └── (no confirmation)
  │           │
  │           └── "Cancel Appointment"
  │                 ├── PUT /api/appointments/{id}/cancel
  │                 │     ├── SUCCESS → toast + refresh
  │                 │     └── ERROR   → toast error
  │                 └── (no confirmation)
  │
  └── Back button → /appointments
```

---

## 8. Navigation & Auth Flow

### 8.1 Sidebar (Role-Based)

```
[Sidebar] — rendered in AppLayout, always visible when authenticated
  │
  ├── Links common to all roles:
  │     ├── Dashboard          → /dashboard
  │     ├── Patients           → /patients
  │     └── Appointments       → /appointments
  │
  ├── Links for ADMIN + DOCTOR roles:
  │     └── Doctors            → /doctors
  │
  ├── Links for ADMIN role only:
  │     └── Schedule           → /doctors/schedule
  │
  └── Logout button at bottom
        └── Clears localStorage token → redirect to /login
```

### 8.2 Protected Route Guard

```
[ProtectedRoute] — wraps every page except /login
  │
  ├── Check: token exists in localStorage and is not expired?
  │     ├── No token → redirect to /login with return URL
  │     └── Token exists → continue
  │
  ├── If component has `roles` prop specified:
  │     ├── Decode JWT → extract role
  │     ├── User's role matches one of required roles?
  │     │     ├── Yes → render page
  │     │     └── No  → render "Access Denied" message
  │     └── (no roles prop → render page for any authenticated user)
  │
  └── On component mount, AuthContext.init() runs:
        ├── Read token from localStorage
        ├── If exists → decode JWT, set { token, email, role }
        └── If missing or expired → clear auth state
```

---

## 9. Complete End-to-End Data Flows

### 9.1 User Creates a Patient

```
Frontend                         API Gateway (4004)    Patient Svc (4000)   Billing Svc     Kafka          Analytics
───────                         ───────────────────    ──────────────────   ───────────     ─────          ─────────
                                                                                                              
POST /api/patients                                                                                            
  Body: PatientRequestDTO                                                                                     
  Header: Authorization Bearer <JWT>                                                                          
  │                                                                                                            
  ├──► /api/patients → StripPrefix → /patients                                                                
       │                                                                                                      
       └──► HTTP POST patient-service:4000/patients                                                           
             │                                                                                                
             ├── Validate PatientRequestDTO                                                                    
             ├── Check email uniqueness                                                                        
             ├── Save to PostgreSQL `patient` table                                                            
             ├── gRPC call → CreateBillingAccount                                                             
             │     └──► billing-service:9001                                                                   
             │         └── Return { accountId: "123", status: "ACTIVE" }                                      
             ├── Kafka send → topic "patient"                                                                  
             │     └──► patient-kafka:9092                                                                     
             │         └──► analytics-service consumes PatientEvent                                           
             └── Return PatientResponseDTO                                                                    
                                                                                                              
◄──── PatientResponseDTO (201)                                                                                
  │                                                                                                            
  └── Frontend: toast "Patient created" → navigate to /patients                                               
```

### 9.2 User Books an Appointment

```
Frontend                         API Gateway (4004)    Appointment Svc (4006)   Kafka          Analytics
───────                         ───────────────────    ──────────────────────   ─────          ─────────
                                                                                                          
1. GET /api/doctors                                                                                       
   └──► /api/doctors → /doctors → appointment-service:4006/doctors                                       
       └── Return Doctor[]                                                                                
                                                                                                          
2. GET /api/appointments/doctor/{id}/available?date=YYYY-MM-DD                                            
   └──► /api/appointments → /appointments → appointment-service:4006                                      
       └── Generate 30-min slots (09:00-17:00), subtract booked → Return String[]                         
                                                                                                          
3. User selects patient, doctor, slot, reason → Submit                                                    
   POST /api/appointments                                                                                 
     Body: AppointmentRequestDTO                                                                           
   └──► /api/appointments → /appointments                                                                 
       └──► appointment-service:4006                                                                      
           ├── Validate (@NotNull, @Future, @NotBlank)                                                    
           ├── Check doctor time conflict → existsByDoctorIdAndAppointmentDateTime                        
           ├── Save to MySQL `appointments` table (status=SCHEDULED)                                      
           ├── Kafka send → topic "appointment" (APPOINTMENT_CREATED)                                     
           │     └──► patient-kafka:9092                                                                   
           │         └──► analytics-service consumes AppointmentEvent                                     
           └── Return AppointmentResponseDTO                                                              
                                                                                                          
   ◄──── AppointmentResponseDTO (200)                                                                     
       └── Frontend: toast "Appointment created" → navigate to /appointments                              
```

### 9.3 User Cancels / Completes an Appointment

```
Frontend                         API Gateway (4004)    Appointment Svc (4006)   Kafka          Analytics
───────                         ───────────────────    ──────────────────────   ─────          ─────────
                                                                                                          
PUT /api/appointments/{id}/cancel                                                                         
  └──► /api/appointments → /appointments/{id}/cancel                                                      
      └──► appointment-service:4006                                                                       
          ├── Find by ID → 404 if not found (ResourceNotFoundException)                                   
          ├── Set status = CANCELLED                                                                      
          ├── Kafka send → topic "appointment" (APPOINTMENT_CANCELLED)                                    
          │     └──► patient-kafka:9092                                                                   
          │         └──► analytics-service consumes AppointmentEvent                                      
          └── Return updated AppointmentResponseDTO                                                       
                                                                                                          
PUT /api/appointments/{id}/complete                                                                       
  └── (same flow, status = COMPLETED, event = APPOINTMENT_COMPLETED)                                      
```

---

## 10. Role-Based Access Control Matrix

| Feature / Action | Unauthenticated | PATIENT | DOCTOR | ADMIN |
|---|---|---|---|---|
| Login / Register | ✅ | — | — | — |
| View Dashboard | — | ✅ | ✅ | ✅ |
| List Patients | — | ✅ | ✅ | ✅ |
| View Patient Detail | — | ✅ | ✅ | ✅ |
| Create Patient | — | ✅ | ✅ | ✅ |
| Edit Patient | — | ✅ | ✅ | ✅ |
| Delete Patient | — | ✅ | ✅ | ✅ |
| List Appointments | — | ✅ | ✅ | ✅ |
| View Appointment Detail | — | ✅ | ✅ | ✅ |
| Create Appointment | — | ✅ | ✅ | ✅ |
| Cancel Appointment | — | ✅ | ✅ | ✅ |
| Complete Appointment | — | ✅ | ✅ | ✅ |
| List Doctors | — | ✅ | ✅ | ✅ |
| View Doctor Detail | — | ✅ | ✅ | ✅ |
| View Doctor Schedule | — | — | — | ✅ |
| Create Doctor | — | — | — | ✅ |
| Edit Doctor | — | — | — | ✅ |
| Delete Doctor | — | — | ✅ (via API) | ✅ (via API) |
| View Sidebar "Doctors" link | — | — | ✅ | ✅ |
| View Sidebar "Schedule" link | — | — | — | ✅ |

**Note:** Backend services do not yet validate JWT roles. Role enforcement is implemented only on the frontend (ProtectedRoute, conditional UI rendering).

---

## 11. API Error Response Contract

All backend services return errors in this standardized format:

```json
{
  "message": "Human-readable summary",
  "errors": {
    "fieldName": "Validation error for this field"
  }
}
```

| Scenario | HTTP Status | `message` | `errors` |
|---|---|---|---|
| Validation failure (past date) | 400 | `"must be a future date"` | `{ "appointmentDateTime": "must be a future date" }` |
| Business rule (duplicate slot) | 400 | `"Doctor already has an appointment at this time"` | `null` |
| Resource not found | 404 | `"Appointment not found with id: {id}"` | `null` |
| Duplicate email | 409 | `"Email Already Exists"` | `null` |
| Invalid credentials | 401 | `"Invalid credentials"` | `null` |
| Generic server error | 500 | `"An unexpected error occurred"` | `null` |

Frontend `parseError()` handles all these formats uniformly.

---

## 12. Appendix: Data Models

### 12.1 Patient
| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID (string) | — | Auto-generated |
| name | string | ✅ | max 100 chars |
| email | string | ✅ | Unique, valid format |
| address | string | ✅ | — |
| dateOfBirth | string (date) | ✅ | ISO date |
| registeredDate | string (date) | ✅ | ISO date |
| phone | string | — | Optional |

### 12.2 Appointment
| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID (string) | — | Auto-generated |
| patientId | UUID (string) | ✅ | — |
| doctorId | UUID (string) | ✅ | — |
| appointmentDateTime | string (datetime) | ✅ | Must be future |
| status | enum | — | SCHEDULED / COMPLETED / CANCELLED / NO_SHOW |
| reason | string | ✅ | — |

### 12.3 Doctor
| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID (string) | — | Auto-generated |
| name | string | ✅ | — |
| email | string | ✅ | Unique |
| phone | string | — | — |
| specialization | string | — | e.g. "Cardiology" |
| department | string | — | e.g. "Cardiology Dept" |

### 12.4 User (Auth)
| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID (string) | — | Auto-generated |
| email | string | ✅ | Unique, used as login |
| password | string | ✅ | BCrypt hash, min 8 chars |
| role | enum | ✅ | ADMIN / PATIENT / DOCTOR |
