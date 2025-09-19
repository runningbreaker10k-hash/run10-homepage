'use client'

import { X, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  showCancel?: boolean
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}

export default function MessageModal({ 
  isOpen, 
  onClose, 
  title,
  message, 
  type = 'info',
  showCancel = false,
  onConfirm,
  confirmText = '확인',
  cancelText = '취소'
}: MessageModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-12 w-12 text-yellow-600" />
      default:
        return <AlertCircle className="h-12 w-12 text-blue-600" />
    }
  }

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'success':
        return '성공'
      case 'error':
        return '오류'
      case 'warning':
        return '경고'
      default:
        return '알림'
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
        </div>
        
        <div className="flex justify-end space-x-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded font-medium ${
              type === 'error' 
                ? 'bg-red-600 text-white hover:bg-red-700'
                : type === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}