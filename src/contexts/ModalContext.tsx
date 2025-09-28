'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { MessageModal, ConfirmModal, MessageModalProps, ConfirmModalProps } from '@/components/Modal'

// 모달 타입 정의
interface MessageModalState extends Omit<MessageModalProps, 'isOpen' | 'onClose'> {
  id: string
}

interface ConfirmModalState extends Omit<ConfirmModalProps, 'isOpen' | 'onClose'> {
  id: string
}

interface ModalContextType {
  // 메시지 모달
  showMessage: (props: Omit<MessageModalProps, 'isOpen' | 'onClose'>) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void

  // 확인 모달
  showConfirm: (props: Omit<ConfirmModalProps, 'isOpen' | 'onClose'>) => void

  // 모달 닫기
  closeModal: (id: string) => void
  closeAllModals: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [messageModals, setMessageModals] = useState<MessageModalState[]>([])
  const [confirmModals, setConfirmModals] = useState<ConfirmModalState[]>([])

  // 고유 ID 생성
  const generateId = () => `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 메시지 모달 표시
  const showMessage = (props: Omit<MessageModalProps, 'isOpen' | 'onClose'>) => {
    const id = generateId()
    setMessageModals(prev => [...prev, { ...props, id }])
  }

  const showSuccess = (message: string, title = '성공') => {
    showMessage({ message, title, type: 'success' })
  }

  const showError = (message: string, title = '오류') => {
    showMessage({ message, title, type: 'error' })
  }

  const showWarning = (message: string, title = '경고') => {
    showMessage({ message, title, type: 'warning' })
  }

  const showInfo = (message: string, title = '알림') => {
    showMessage({ message, title, type: 'info' })
  }

  // 확인 모달 표시
  const showConfirm = (props: Omit<ConfirmModalProps, 'isOpen' | 'onClose'>) => {
    const id = generateId()
    setConfirmModals(prev => [...prev, { ...props, id }])
  }

  // 모달 닫기
  const closeModal = (id: string) => {
    setMessageModals(prev => prev.filter(modal => modal.id !== id))
    setConfirmModals(prev => prev.filter(modal => modal.id !== id))
  }

  const closeAllModals = () => {
    setMessageModals([])
    setConfirmModals([])
  }

  // 메시지 모달 닫기 핸들러
  const handleMessageModalClose = (id: string) => {
    closeModal(id)
  }

  // 확인 모달 닫기 핸들러
  const handleConfirmModalClose = (id: string) => {
    closeModal(id)
  }

  const value: ModalContextType = {
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    closeModal,
    closeAllModals
  }

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* 메시지 모달들 렌더링 */}
      {messageModals.map((modal) => (
        <MessageModal
          key={modal.id}
          isOpen={true}
          onClose={() => handleMessageModalClose(modal.id)}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          confirmText={modal.confirmText}
          onConfirm={() => {
            modal.onConfirm?.()
            handleMessageModalClose(modal.id)
          }}
        />
      ))}

      {/* 확인 모달들 렌더링 */}
      {confirmModals.map((modal) => (
        <ConfirmModal
          key={modal.id}
          isOpen={true}
          onClose={() => handleConfirmModalClose(modal.id)}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          type={modal.type}
          onConfirm={() => {
            modal.onConfirm()
            handleConfirmModalClose(modal.id)
          }}
        />
      ))}
    </ModalContext.Provider>
  )
}

// 모달 훅
export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

// 편의 훅들
export function useMessageModal() {
  const { showMessage, showSuccess, showError, showWarning, showInfo } = useModal()
  return { showMessage, showSuccess, showError, showWarning, showInfo }
}

export function useConfirmModal() {
  const { showConfirm } = useModal()
  return { showConfirm }
}