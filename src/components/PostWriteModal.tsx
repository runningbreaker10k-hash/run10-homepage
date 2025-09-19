'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import MessageModal from './MessageModal'

interface PostWriteModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
  onPostCreated: () => void
}

export default function PostWriteModal({ isOpen, onClose, competitionId, onPostCreated }: PostWriteModalProps) {
  const [formData, setFormData] = useState({
    author: '',
    title: '',
    password: '',
    passwordConfirm: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (formData.password !== formData.passwordConfirm) {
      setMessageProps({
        type: 'error',
        message: '비밀번호가 일치하지 않습니다.'
      })
      setShowMessage(true)
      setIsSubmitting(false)
      return
    }

    // 디버깅을 위한 로그
    console.log('게시글 작성 데이터:', {
      competitionId,
      title: formData.title,
      content: formData.content,
      author: formData.author,
      password: formData.password
    })

    try {
      const { error } = await supabase
        .from('competition_posts')
        .insert({
          competition_id: competitionId,
          title: formData.title,
          content: formData.content,
          author: formData.author,
          password: formData.password
        })

      if (error) throw error

      onPostCreated()
      setFormData({ author: '', title: '', password: '', passwordConfirm: '', content: '' })
      onClose()
    } catch (error) {
      console.error('게시글 작성 오류:', error)
      setMessageProps({
        type: 'error',
        message: '게시글 작성 중 오류가 발생했습니다.'
      })
      setShowMessage(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">게시글 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              작성자 *
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="작성자명을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="게시글 접근 시 필요한 비밀번호"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 *
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용 *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="내용을 입력하세요"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>

        <MessageModal
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
          type={messageProps.type}
          message={messageProps.message}
        />
      </div>
    </div>
  )
}