import api from '../lib/axios'
import type { MedicalImage, ImageType } from '../types/image'

export const uploadImage = (patientId: string, file: File, imageType: ImageType) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('patientId', patientId)
  fd.append('imageType', imageType)
  return api.post<MedicalImage>('/images/upload', fd).then((r) => r.data)
}

export const getPatientImages = (patientId: string) =>
  api.get<MedicalImage[]>(`/images/patient/${patientId}`).then((r) => r.data)

export const getImageUrl = (id: string) => `/api/images/${id}`
