export interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  department: string
}

export interface DoctorRequest {
  name: string
  email: string
  phone: string
  specialization: string
  department: string
}
