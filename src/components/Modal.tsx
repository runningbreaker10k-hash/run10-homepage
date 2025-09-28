'use client'

import { useEffect, useRef } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  }

  useEffect(() => {
    if (!isOpen) return

    // 모달이 열릴 때 body 스크롤 방지
    document.body.style.overflow = 'hidden'

    // ESC 키로 모달 닫기
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, closeOnEscape])

  // 오버레이 클릭 시 모달 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// 특정 타입의 모달들
export interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
  onConfirm?: () => void
}

export function MessageModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = '확인',
  onConfirm
}: MessageModalProps) {
  const icons = {
    success: <CheckCircle className="w-8 h-8 text-green-500" />,
    error: <XCircle className="w-8 h-8 text-red-500" />,
    warning: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
    info: <Info className="w-8 h-8 text-blue-500" />
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {icons[type]}
        </div>
        <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>
        <button
          onClick={handleConfirm}
          className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            type === 'error'
              ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              : type === 'success'
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              : type === 'warning'
              ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}

// 확인/취소 모달
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  type = 'info'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="text-center">
        <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                : type === 'warning'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}