export interface Consultation {
  id: string
  appointmentId: string
  doctorId: string
  patientId: string
  symptoms: string
  diagnosis: string
  notes: string
  createdDate: string
}

export interface ConsultationRequest {
  appointmentId: string
  patientId: string
  symptoms: string
  diagnosis?: string
  notes?: string
}
