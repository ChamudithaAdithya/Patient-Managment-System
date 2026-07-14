# Implementation Plan — Phase 2: Completing the Hospital Management System

---

## Objective

Transform the current Patient + Appointment platform into a fully secured, assignment-complete Hospital Management System by adding backend RBAC, a Consultation module, and a Medical Imaging service.

---

## Priority Order

| Priority | Feature | Effort | Reason |
|---|---|---|---|
| 1 | Backend JWT authorization | 2 services × 1 day | Security — everything else depends on this |
| 2 | Consultation module | 1 new table + endpoints | Makes the clinical workflow complete |
| 3 | Medical Imaging Service | New microservice (port 4007) | Explicit assignment requirement |
| 4 | Patient soft-delete | Add status field | Healthcare correctness |
| 5 | Frontend updates | Wire new features into UI | User-facing completion |

---

## Phase 1 — Backend JWT Authorization

### Goal

Move role enforcement from frontend-only to backend. After this phase, a direct API call without a valid JWT (or with insufficient role) will be rejected with 403.

### Architecture

```
Request → API Gateway → Service
                              │
                    JwtAuthFilter (OncePerRequestFilter)
                              │
                    Parses JWT from Authorization header
                              │
                    Extracts email + role
                              │
                    Sets SecurityContextHolder
                              │
                    Controller (method-level @PreAuthorize)
```

### Shared secret key

All services must use the same HMAC key as `auth-service`:

```
secret.key=dqYCMmwi5RRi2q3q0b32EZ3mR37RgQEJFfi3egXDQNI=
```

### Changes by Service

#### A. patient-service

**pom.xml** — add:
- `spring-boot-starter-security`
- `jjwt-api` 0.12.6
- `jjwt-impl` 0.12.6 (runtime)
- `jjwt-jackson` 0.12.6 (runtime)

**New files:**
| File | Package | Purpose |
|---|---|---|
| `config/JwtAuthFilter.java` | `com.pm.patientService.config` | Extends `OncePerRequestFilter`. Reads `Authorization: Bearer <token>`. Parses JWT using same secret key as auth-service. Extracts `sub` (email) and `role` claim. Sets `UsernamePasswordAuthenticationToken` with `ROLE_<role>` authority. On failure → clears context, returns 401. |
| `config/SecurityConfig.java` | `com.pm.patientService.config` | `@Configuration @EnableMethodSecurity`. URL rules: `GET /patients → authenticated`, `POST /patients → ADMIN/DOCTOR`, `PUT /patients/** → ADMIN/DOCTOR`, `DELETE /patients/** → ADMIN`. Adds `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter`. Disables CSRF, stateless sessions. |

**Modified files:**
| File | Change |
|---|---|
| `application.properties` | Add `secret.key=dqYCMmwi5RRi2q3q0b32EZ3mR37RgQEJFfi3egXDQNI=` |
| Nothing else | No controller changes needed — security is declarative via `SecurityConfig` URL rules |

**Role → Endpoint matrix (patient-service):**

| Endpoint | Method | Allowed Roles |
|---|---|---|
| `/patients` | GET | ADMIN, DOCTOR |
| `/patients/{id}` | GET | ADMIN, DOCTOR |
| `/patients` | POST | ADMIN, DOCTOR |
| `/patients/{id}` | PUT | ADMIN, DOCTOR |
| `/patients/{id}` | DELETE | ADMIN |

---

#### B. appointment-service

**pom.xml** — add same dependencies as patient-service (spring-security, jjwt).

**New files:**
| File | Package | Purpose |
|---|---|---|
| `config/JwtAuthFilter.java` | `com.pm.appointment_service.config` | Same logic as patient-service version |
| `config/SecurityConfig.java` | `com.pm.appointment_service.config` | Configures endpoint security for appointment + doctor endpoints |

**Modified files:**
| File | Change |
|---|---|
| `application.yml` | Add `secret.key` property |

**Role → Endpoint matrix (appointment-service):**

| Endpoint | Method | Allowed Roles |
|---|---|---|
| `/appointments` | GET | ADMIN, DOCTOR |
| `/appointments/{id}` | GET | ADMIN, DOCTOR |
| `/appointments/patient/{id}` | GET | ADMIN, DOCTOR |
| `/appointments/doctor/{id}` | GET | ADMIN, DOCTOR |
| `/appointments` | POST | ADMIN, PATIENT (DOCTOR books on behalf) |
| `/appointments/{id}/cancel` | PUT | ADMIN, DOCTOR, PATIENT (own) |
| `/appointments/{id}/complete` | PUT | ADMIN, DOCTOR |
| `/appointments/doctor/{id}/available` | GET | ADMIN, DOCTOR, PATIENT |
| `/doctors` | GET | ADMIN, DOCTOR, PATIENT |
| `/doctors/{id}` | GET | ADMIN, DOCTOR, PATIENT |
| `/doctors` | POST | ADMIN |
| `/doctors/{id}` | PUT | ADMIN |
| `/doctors/{id}` | DELETE | ADMIN |

---

#### C. API Gateway

No changes needed. The gateway already forwards all requests. JWT validation happens at each service, not at the gateway level.

#### D. Frontend

No immediate changes needed — frontend already sends `Authorization: Bearer <token>` via the Axios interceptor. Previously ignored headers will now be enforced.

---

## Phase 2 — Consultation Module

### Goal

Add a medical consultation record attached to each appointment. After this phase, completing an appointment requires a consultation record with symptoms, diagnosis, and notes.

### Location

Inside **appointment-service** (no new microservice needed). This keeps the domain cohesive — consultations are a natural child of appointments.

### New Table: `consultations` (MySQL)

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, auto-generated |
| appointment_id | UUID | NOT NULL, FK → appointments.id |
| doctor_id | UUID | NOT NULL |
| patient_id | UUID | NOT NULL |
| symptoms | TEXT | NOT NULL |
| diagnosis | TEXT | nullable |
| notes | TEXT | nullable |
| created_date | TIMESTAMP | NOT NULL, default NOW() |

### New Java Files

| File | Package |
|---|---|
| `model/Consultation.java` | `com.pm.appointment_service.model` |
| `repository/ConsultationRepository.java` | `com.pm.appointment_service.repository` |
| `dto/ConsultationRequestDTO.java` | `com.pm.appointment_service.dto` |
| `dto/ConsultationResponseDTO.java` | `com.pm.appointment_service.dto` |
| `service/ConsultationService.java` | `com.pm.appointment_service.service` |
| `controller/ConsultationController.java` | `com.pm.appointment_service.controller` |

### API Endpoints

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/consultations` | DOCTOR, ADMIN | Create consultation (linked to appointment) |
| GET | `/consultations/appointment/{appointmentId}` | DOCTOR, ADMIN | Get consultation for an appointment |
| GET | `/consultations/patient/{patientId}` | DOCTOR, ADMIN, PATIENT | List patient's consultation history |
| GET | `/consultations/{id}` | DOCTOR, ADMIN | Get consultation by ID |

### Workflow Change

**Before:**
```
Appointment SCHEDULED → COMPLETED (direct status change)
```

**After:**
```
Appointment SCHEDULED
       │
       │ Doctor creates consultation
       ▼
Appointment COMPLETED (status set automatically when consultation is created)
```

The `complete` endpoint behavior changes:
1. `PUT /appointments/{id}/complete` now requires an existing consultation for that appointment
2. If no consultation exists, returns 400: "Cannot complete appointment without a consultation record"
3. Alternatively, completion is handled implicitly when `POST /consultations` is called with the appointment ID

### Security

All consultation endpoints require `DOCTOR` or `ADMIN` role. `GET /consultations/patient/{patientId}` also allows `PATIENT` (own records only — requires user ID matching in JWT subject lookup).

---

## Phase 3 — Medical Imaging Service

### Goal

New microservice on port 4007 that stores and serves medical images (X-Ray, MRI, CT, Ultrasound) per patient. Uses local filesystem storage (simulating cloud object storage).

### New Service: `imaging-service`

#### Project Setup
- Group: `com.pm`
- Artifact: `imaging-service`
- Spring Boot 3.5.x, Java 21
- Dependencies: Web, JPA, PostgreSQL, Validation, SpringDoc, Spring Security, JJWT
- Port: **4007**

#### Docker infrastructure

**New docker-compose service:**
```yaml
imaging-db:
  image: postgres:latest
  container_name: imaging-db
  environment:
    POSTGRES_DB: medical_images
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: root
  ports:
    - "5004:5432"
  networks:
    - internal-net

imaging-service:
  build: ./imaging-service/Dockerfile
  container_name: imaging-service
  ports:
    - "4007:4007"
  environment:
    SPRING_DATASOURCE_URL: jdbc:postgresql://imaging-db:5432/medical_images
    SPRING_DATASOURCE_USERNAME: postgres
    SPRING_DATASOURCE_PASSWORD: root
  depends_on:
    - imaging-db
  networks:
    - internal-net
  volumes:
    - medical-images:/app/images
```

**Add gateway route:**
```yaml
- id: imaging-service-route
  uri: http://imaging-service:4007
  predicates: Path=/api/images/**
  filters: StripPrefix=1
```

#### New Table: `medical_images` (PostgreSQL)

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, auto-generated |
| patient_id | UUID | NOT NULL |
| uploaded_by | UUID | NOT NULL (doctor/user ID) |
| image_type | VARCHAR(50) | NOT NULL (XRAY, MRI, CT, ULTRASOUND) |
| file_name | VARCHAR(255) | NOT NULL |
| file_path | VARCHAR(500) | NOT NULL |
| uploaded_date | TIMESTAMP | NOT NULL, default NOW() |

#### Storage

Local directory: `/app/images/{patientId}/{uuid}-{originalFileName}`

This simulates S3 without requiring AWS credentials during development. The directory is mounted as a Docker volume.

#### Java Files

| File | Package |
|---|---|
| `model/MedicalImage.java` | `com.pm.imaging_service.model` |
| `repository/MedicalImageRepository.java` | `com.pm.imaging_service.repository` |
| `dto/ImageResponseDTO.java` | `com.pm.imaging_service.dto` |
| `dto/ImageRequestDTO.java` | `com.pm.imaging_service.dto` |
| `service/ImageService.java` | `com.pm.imaging_service.service` |
| `controller/ImageController.java` | `com.pm.imaging_service.controller` |
| `config/JwtAuthFilter.java` | `com.pm.imaging_service.config` |
| `config/SecurityConfig.java` | `com.pm.imaging_service.config` |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/images/upload` | DOCTOR, ADMIN | Upload image (multipart file + metadata) |
| GET | `/images/patient/{patientId}` | DOCTOR, ADMIN, PATIENT | List patient's images |
| GET | `/images/{id}` | DOCTOR, ADMIN, PATIENT | Download image file |
| DELETE | `/images/{id}` | ADMIN | Delete image |

#### Workflow

```
Doctor uploads image:
   POST /api/images/upload
   Multipart: file (PNG/JPG/DICOM)
   Fields: patientId, imageType (XRAY|MRI|CT|ULTRASOUND)
       │
       ├── Validate file type (jpg, png, jpeg, dicom)
       ├── Check patient exists (optional — could call patient-service)
       ├── Save file to /app/images/{patientId}/{uuid}-{filename}
       ├── Save metadata row in medical_images table
       └── Return ImageResponseDTO { id, patientId, imageType, fileName, uploadedDate }

Patient/Doctor views images:
   GET /api/images/patient/{patientId}
       └── Return list of ImageResponseDTO (metadata only, not file content)

Download:
   GET /api/images/{id}
       └── Return file as byte stream (MediaType.APPLICATION_OCTET_STREAM)
```

#### Image Type Enum

```java
public enum ImageType {
    XRAY, MRI, CT, ULTRASOUND, OTHER
}
```

#### File Size Limit

Configure in `application.properties`:
```properties
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB
```

---

## Phase 4 — Patient Soft-Delete

### Goal

Replace permanent `DELETE` with status deactivation. Mark a patient as `INACTIVE` instead of removing the row.

### Changes in patient-service

#### Entity: `Patient.java`

Add field:
```java
@Enumerated(STRING)
private PatientStatus status = PatientStatus.ACTIVE;
```

New enum:
```java
public enum PatientStatus {
    ACTIVE, INACTIVE
}
```

#### DTO: `PatientResponseDTO`

Add field:
```java
private String status; // "ACTIVE" or "INACTIVE"
```

#### Service: `PatientServiceImpl`

Change `deletePatientById`:
```java
Patient patient = patientRepository.findById(id)
    .orElseThrow(() -> new PatientWithTheIdDoesNotExistsException(id));
patient.setStatus(PatientStatus.INACTIVE);
patientRepository.save(patient);
```

#### Controller

Update `deletePatientById` to return 200 (with patient DTO) instead of 204:
```java
public ResponseEntity<PatientResponseDTO> deactivatePatient(@PathVariable UUID id) {
    return ResponseEntity.ok(patientService.deactivatePatient(id));
}
```

(Change mapping to `@DeleteMapping` still works, or use explicit `@PutMapping("/{id}/deactivate")` — keep `@DeleteMapping` for backward compatibility.)

#### Repository

Optionally add query filter:
```java
@Query("SELECT p FROM Patient p WHERE p.status = 'ACTIVE'")
List<Patient> findAllActive();
```

Update `getAllPatients` to return only active patients unless admin requests all.

#### Frontend

- Update Patient table to show "Active" / "Inactive" badge
- Inactive patients shown in gray or excluded by default
- "Delete" button becomes "Deactivate" with confirmation text change

---

## Phase 5 — Frontend Updates

### Changes needed after all backend phases

#### A. Consultation UI

| Page | Change |
|---|---|
| AppointmentDetail | Add "Create Consultation" button (DOCTOR, ADMIN) when status=SCHEDULED |
| New page: `/appointments/{id}/consultation` | Form: symptoms (textarea), diagnosis (textarea), notes (textarea) |
| AppointmentDetail | Show consultation summary if exists (symptoms, diagnosis, notes) |
| PatientDetail | Add "Consultation History" section, linked from consultation service |

#### B. Imaging UI

| Page | Change |
|---|---|
| PatientDetail | Add "Medical Images" section with list of uploaded images (type, filename, date) |
| New page: `/patients/{id}/images/upload` | Form: select image type, file picker, upload button |
| PatientDetail | Each image row: view/download link |
| Image viewer | Simple page that renders image or shows download prompt |

#### C. Patient Status

| Page | Change |
|---|---|
| PatientList | Add "Status" column with ACTIVE/INACTIVE badge |
| PatientDetail | Show status badge, "Deactivate" button (replaces Delete) |
| PatientForm | Status not editable (handled via deactivate action) |

#### D. API route additions

**`api/appointments.ts`:**
```typescript
export const createConsultation = (data: ConsultationRequest) => api.post('/consultations', data).then(r => r.data)
export const getConsultationByAppointment = (appointmentId: string) => api.get(`/consultations/appointment/${appointmentId}`).then(r => r.data)
export const getPatientConsultations = (patientId: string) => api.get(`/consultations/patient/${patientId}`).then(r => r.data)
```

**`api/images.ts`** (new file):
```typescript
export const uploadImage = (patientId: string, file: File, imageType: string) => { const fd = new FormData(); fd.append('file', file); fd.append('patientId', patientId); fd.append('imageType', imageType); return api.post('/images/upload', fd).then(r => r.data) }
export const getPatientImages = (patientId: string) => api.get(`/images/patient/${patientId}`).then(r => r.data)
export const getImageUrl = (id: string) => `/api/images/${id}`
```

---

## Appendix A: Dependency Versions

| Dependency | Version | Used By |
|---|---|---|
| `spring-boot-starter-security` | managed by Spring Boot 3.5.x | patient-service, appointment-service, imaging-service |
| `jjwt-api` | 0.12.6 | patient-service, appointment-service, imaging-service |
| `jjwt-impl` | 0.12.6 (runtime) | patient-service, appointment-service, imaging-service |
| `jjwt-jackson` | 0.12.6 (runtime) | patient-service, appointment-service, imaging-service |

## Appendix B: Docker Compose Changes

Add to `docker-compose.yml`:
```yaml
services:
  imaging-db:
    image: postgres:latest
    container_name: imaging-db
    environment:
      POSTGRES_DB: medical_images
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: root
    ports:
      - "5004:5432"
    networks:
      - internal-net

  imaging-service:
    build: ./imaging-service/Dockerfile
    container_name: imaging-service
    ports:
      - "4007:4007"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://imaging-db:5432/medical_images
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: root
    depends_on:
      - imaging-db
    networks:
      - internal-net
    volumes:
      - medical-images:/app/images

volumes:
  medical-images:
```

## Appendix C: Gateway Route Changes

Add to `api-getway/src/main/resources/application.yml`:
```yaml
- id: imaging-service-route
  uri: http://imaging-service:4007
  predicates: Path=/api/images/**
  filters: StripPrefix=1
- id: api-docs-imaging-route
  uri: http://imaging-service:4007
  predicates: Path=/api-docs/images
  filters: RewritePath=/api-docs/images, /v3/api-docs
```

## Appendix D: Rollout Order

```
Week 1
  ├── Day 1-2: Backend JWT (patient-service + appointment-service)
  │     └── Build, test with curl (verify 401 without token, 403 with wrong role)
  │
  ├── Day 3-4: Consultation module
  │     ├── New table + entities
  │     ├── Service + controller
  │     ├── Update appointment completion logic
  │     └── Build + test
  │
  └── Day 5: Patient soft-delete
        └── Entity change + service update + test

Week 2
  ├── Day 1-3: Imaging Service
  │     ├── New Spring Boot project
  │     ├── DB + storage + controllers
  │     ├── Docker + gateway route
  │     └── Build + test with file upload
  │
  └── Day 4-5: Frontend updates
        ├── Consultation form + display
        ├── Image upload + gallery
        ├── Patient status badge
        └── Build + integration test
```
