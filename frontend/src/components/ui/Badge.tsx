import type { ReactNode } from 'react'

interface Props {
  variant: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'default'
  children?: ReactNode
}

const colors: Record<string, string> = {
  SCHEDULED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
  default: 'bg-blue-100 text-blue-800',
}

export function Badge({ variant, children }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[variant] || colors.default}`}>
      {children || variant}
    </span>
  )
}
