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

const GATEWAY = import.meta.env.VITE_API_GATEWAY || (import.meta.env.DEV ? 'http://127.0.0.1:8083' : '')
export const getImageUrl = (id: string) => `${GATEWAY}/api/images/${id}`
