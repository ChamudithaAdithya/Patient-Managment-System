import { useState, useEffect, useCallback } from 'react'

interface ToastData {
  message: string
  type: 'success' | 'error'
}

let showToastFn: (data: ToastData) => void = () => {}

export function toast(data: ToastData) {
  showToastFn(data)
}

export function ToastContainer() {
  const [items, setItems] = useState<(ToastData & { id: number })[]>([])

  const add = useCallback((data: ToastData) => {
    const id = Date.now()
    setItems((prev) => [...prev, { ...data, id }])
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000)
  }, [])

  useEffect(() => {
    showToastFn = add
  }, [add])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white ${
            item.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  )
}
