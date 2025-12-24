'use client'

import { useState } from 'react'
import { X, Lock } from 'lucide-react'

interface PasswordCheckModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => void
  errorMessage?: string
}

export default function PasswordCheckModal({
  isOpen,
  onClose,
  onConfirm,
  errorMessage
}: PasswordCheckModalProps) {
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setLocalError('비밀번호를 입력해주세요')
      return
    }

    if (password.length !== 4 || !/^\d+$/.test(password)) {
      setLocalError('4자리 숫자를 입력해주세요')
      return
    }

    setLocalError('')
    onConfirm(password)
  }

  const handleClose = () => {
    setPassword('')
    setLocalError('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">비밀글입니다</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호를 입력하세요
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setLocalError('')
              }}
              maxLength={4}
              placeholder="4자리 숫자"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
              autoFocus
            />
            {(localError || errorMessage) && (
              <p className="mt-2 text-sm text-red-600">
                {localError || errorMessage}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
