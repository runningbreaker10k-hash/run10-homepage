'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import LoginForm from './LoginForm'
import MembershipForm from './MembershipForm'
import { useAuth } from '@/contexts/AuthContext'
import { useMessageModal } from '@/contexts/ModalContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'signup'
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab)
  const { login } = useAuth()
  const { showSuccess } = useMessageModal()

  // defaultTab이 변경되거나 모달이 열릴 때마다 activeTab 업데이트
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab, isOpen])

  if (!isOpen) return null

  const handleLoginSuccess = (user: any) => {
    login(user)
    onClose()
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleSignupSuccess = () => {
    showSuccess('회원가입이 완료되었습니다! 이제 로그인해주세요.')
    setActiveTab('login')
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleShowSignup = () => {
    setActiveTab('signup')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐트 */}
      <div className="flex min-h-full items-start sm:items-center justify-center p-2 sm:p-4 pt-20 sm:pt-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[75vh] sm:max-h-[85vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
                  activeTab === 'login'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
                  activeTab === 'signup'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                회원가입
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* 컨텐트 */}
          <div className="p-3 sm:p-6">
            {activeTab === 'login' ? (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onShowSignup={handleShowSignup}
              />
            ) : (
              <MembershipForm
                onSuccess={handleSignupSuccess}
                onCancel={onClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}