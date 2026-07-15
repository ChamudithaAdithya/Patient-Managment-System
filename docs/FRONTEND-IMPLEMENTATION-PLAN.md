# Frontend Implementation Plan — React + Tailwind CSS + TypeScript

## Stack
| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 7 (already set up) |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Auth | JWT (stored in localStorage) |
| State Mgmt | React Context (for auth), local state for forms |

---

## Phase 1 — Project Setup

### 1.1 Convert to TypeScript
- Rename `*.jsx` → `*.tsx`, `*.js` → `*.ts`
- Add `tsconfig.json` (app + node configs)
- Install `typescript`, `@types/react`, `@types/react-dom` (already present in devDeps)

### 1.2 Install Dependencies
```bash
npm install react-router-dom axios
npm install -D tailwindcss @tailwindcss/vite
```

### 1.3 Configure Tailwind
- Add `@tailwindcss/vite` plugin to `vite.config.ts`
- Replace `index.css` content with Tailwind directives
- Remove `App.css`

### 1.4 Configure Vite Proxy
- Add proxy in `vite.config.ts` to forward `/api/*` to `http://localhost:4004` (api-getway)
- This avoids CORS issues during development

---

## Phase 2 — App Shell & Routing

### 2.1 Route Structure
```
/                        → Login page (redirect if not authenticated)
/dashboard               → Dashboard (summary cards, recent activity)
/patients                → Patient list
/patients/new            → Create patient form
/patients/:id            → Patient detail + edit
/patients/:id/appointments  → Patient's appointments
/appointments            → Appointment list (all)
/appointments/new        → Create appointment form
/appointments/:id        → Appointment detail
/doctors/:id             → Doctor schedule view
/doctors/:id/available   → Doctor's available slots
/login                   → Login page
```

### 2.2 Layout Components
| Component | Description |
|-----------|-------------|
| `AppLayout` | Sidebar + topbar + `<Outlet/>` |
| `Sidebar` | Nav links (Patients, Appointments, Doctors, Dashboard) |
| `Topbar` | User info, logout button |
| `ProtectedRoute` | Redirects to `/login` if no JWT |
| `PublicRoute` | Redirects to `/dashboard` if already logged in |

### 2.3 Shared UI Components
| Component | Props | Purpose |
|-----------|-------|---------|
| `Button` | variant, loading, disabled | Reusable button |
| `Input` | label, error, ...rest | Form input with validation |
| `Select` | label, options, error | Dropdown |
| `Modal` | open, onClose, title | Confirmation dialogs |
| `Table` | columns, data, loading, onSort | Data table |
| `Badge` | variant, children | Status badges (SCHEDULED, COMPLETED, etc.) |
| `Card` | title, children | Summary dashboard cards |
| `Spinner` | size | Loading indicator |
| `Toast` | message, type | Success/error notifications |

---

## Phase 3 — API Layer

### 3.1 Axios Instance (`src/lib/axios.ts`)
```typescript
const api = axios.create({ baseURL: '/api' })
// Request interceptor: attach JWT from localStorage
// Response interceptor: on 401 → redirect to /login
```

### 3.2 API Modules
| Module | Base Path | Functions |
|--------|-----------|-----------|
| `src/api/patients.ts` | `/patients` | `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `src/api/appointments.ts` | `/appointments` | `getAll()`, `getById(id)`, `getByPatient(pid)`, `getByDoctor(did)`, `create(data)`, `cancel(id)`, `complete(id)`, `getAvailableSlots(did, date)` |
| `src/api/auth.ts` | (direct to `:4005`) | `login(email, password)` |

### 3.3 TypeScript Types (`src/types/`)
```typescript
// patient.ts
Patient { id: string; name: string; email: string; ... }
PatientRequest { name: string; email: string; ... }

// appointment.ts
Appointment { id: string; patientId: string; doctorId: string; appointmentDateTime: string; status: AppointmentStatus; reason: string }
AppointmentRequest { patientId: string; doctorId: string; appointmentDateTime: string; reason: string }
AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
AvailableSlot { time: string }

// auth.ts
LoginRequest { email: string; password: string }
LoginResponse { token: string }
```

---

## Phase 4 — Pages & Features

### 4.1 Authentication
| Page | Features |
|------|----------|
| **Login** | Email + password form, calls `POST /login` on `localhost:4005`, stores JWT, redirects to `/dashboard` |

### 4.2 Dashboard
| Feature | Backend Call |
|---------|-------------|
| Total patients count | `GET /api/patients` (length) |
| Total appointments count | `GET /api/appointments` (length) |
| Appointments by status | Filter from `GET /api/appointments` |
| Recent activity list | Last 5 from `GET /api/patients` + appointments |
| Quick action buttons | "New Patient", "New Appointment" |

### 4.3 Patient Management
| Page | Features |
|------|----------|
| **Patient List** | Table with name, email, actions (View, Edit, Delete) |
| **Create Patient** | Form with name, email, etc. → `POST /api/patients` |
| **Patient Detail** | Info card + linked appointments table |
| **Edit Patient** | Pre-filled form → `PUT /api/patients/{id}` |

### 4.4 Appointment Management
| Page | Features |
|------|----------|
| **Appointment List** | Table with patient, doctor, date/time, status badge, actions |
| **Create Appointment** | Select patient (dropdown from `GET /api/patients`), select doctor (text field for now), pick date → shows available slots via `GET /api/appointments/doctor/{id}/available?date=...`, select a slot, enter reason → `POST /api/appointments` |
| **Appointment Detail** | Full info + Cancel/Complete buttons |
| **Doctor Schedule** | List of appointments for a doctor + available slots view |

### 4.5 Error & Loading States
- Every page shows a `Spinner` while loading
- Empty state: "No patients found" / "No appointments"
- Error state: toast notification on API failure
- 404 page for unknown routes

---

## Phase 5 — Directory Structure

```
frontend/src/
├── api/
│   ├── patients.ts
│   ├── appointments.ts
│   └── auth.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Spinner.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── auth/
│       ├── ProtectedRoute.tsx
│       └── PublicRoute.tsx
├── context/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── lib/
│   └── axios.ts
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── patients/
│   │   ├── PatientList.tsx
│   │   ├── PatientForm.tsx
│   │   └── PatientDetail.tsx
│   ├── appointments/
│   │   ├── AppointmentList.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── AppointmentDetail.tsx
│   └── doctors/
│       └── DoctorSchedule.tsx
├── types/
│   ├── patient.ts
│   ├── appointment.ts
│   └── auth.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Phase 6 — Vite Proxy Config

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Implementation Order

| Step | Phase | Estimate |
|------|-------|----------|
| 1 | TypeScript conversion + Tailwind setup | 30 min |
| 2 | Dependencies install + proxy config | 10 min |
| 3 | Types definition (`src/types/`) | 15 min |
| 4 | Axios instance + API modules | 30 min |
| 5 | Auth context + login page + protected routes | 45 min |
| 6 | Layout (Sidebar, Topbar, AppLayout) | 30 min |
| 7 | Shared UI components (Button, Input, Table, Badge, etc.) | 1 hr |
| 8 | Patient pages (List, Form, Detail) | 1 hr |
| 9 | Appointment pages (List, Form, Detail) | 1.5 hr |
| 10 | Doctor schedule + available slots | 45 min |
| 11 | Dashboard page | 30 min |
| 12 | Error/loading/empty states polish | 30 min |
| **Total** | | **~7 hours** |
