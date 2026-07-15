export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  appointmentDateTime: string
  status: AppointmentStatus
  reason: string
}

export interface AppointmentRequest {
  patientId: string
  doctorId: string
  appointmentDateTime: string
  reason: string
}

export interface AvailableSlot {
  time: string
}
