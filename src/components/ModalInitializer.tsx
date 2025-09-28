'use client'

import { useEffect } from 'react'
import { setModalFunction } from '@/lib/errorHandler'
import { useMessageModal } from '@/contexts/ModalContext'

export default function ModalInitializer() {
  const { showError, showSuccess, showInfo, showWarning } = useMessageModal()

  useEffect(() => {
    // ErrorHandler에 모달 함수 연결
    setModalFunction((message: string, title?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      switch (type) {
        case 'success':
          showSuccess(message, title)
          break
        case 'error':
          showError(message, title)
          break
        case 'warning':
          showWarning(message, title)
          break
        case 'info':
        default:
          showInfo(message, title)
          break
      }
    })
  }, [showError, showSuccess, showInfo, showWarning])

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}