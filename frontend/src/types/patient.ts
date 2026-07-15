export interface Patient {
  id: string
  name: string
  email: string
  address: string
  dateOfBirth: string
  registeredDate: string
  phone?: string
  status?: string
}

export interface PatientRequest {
  name: string
  email: string
  address: string
  dateOfBirth: string
  registeredDate: string
  phone?: string
}
