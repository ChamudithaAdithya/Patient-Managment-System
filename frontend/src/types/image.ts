export type ImageType = 'XRAY' | 'MRI' | 'CT' | 'ULTRASOUND' | 'OTHER'

export interface MedicalImage {
  id: string
  patientId: string
  uploadedBy: string
  imageType: ImageType
  fileName: string
  uploadedDate: string
}
