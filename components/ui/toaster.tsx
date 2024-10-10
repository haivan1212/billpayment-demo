// components/ui/toaster.tsx
import React from 'react'
import { useToast, Toast as ToastType } from './use-toast'

const Toast: React.FC<{ toast: ToastType; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-semibold">{toast.title}</h3>
      {toast.description && <p className="text-sm text-gray-500">{toast.description}</p>}
      <button onClick={onDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        &times;
      </button>
    </div>
  )
}

export const Toaster: React.FC = () => {
  const { toasts, dismissToast } = useToast()

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </>
  )
}