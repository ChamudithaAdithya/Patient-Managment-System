import type { AxiosError } from 'axios'
import type { ApiError } from '../types/api'

export interface ParsedError {
  message: string
  fieldErrors: Record<string, string>
}

export function parseError(error: unknown): ParsedError {
  const axiosError = error as AxiosError<ApiError>
  const data = axiosError?.response?.data
  return {
    message: data?.message || 'An unexpected error occurred',
    fieldErrors: data?.errors || {},
  }
}
