import type { ReactNode } from 'react'

interface Props {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: Props) {
  return (
    <div className={`rounded-xl border bg-white p-6 shadow-sm ${className}`}>
      {title && <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>}
      {children}
    </div>
  )
}
