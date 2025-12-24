'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import MessageModal from './MessageModal'

interface AdminReplyModalProps {
  isOpen: boolean
  onClose: () => void
  parentPost: any
  onReplyCreated: () => void
}

export default function AdminReplyModal({ isOpen, onClose, parentPost, onReplyCreated }: AdminReplyModalProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })

  if (!isOpen || !parentPost) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 관리자 계정 찾기
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      if (adminError || !adminUser) {
        throw new Error('관리자 계정을 찾을 수 없습니다.')
      }

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: parentPost.id,
          user_id: adminUser.id,
          content: content
        })

      if (error) throw error

      onReplyCreated()
      setContent('')
      onClose()
    } catch (error) {
      console.error('댓글 작성 오류:', error)
      setMessageProps({
        type: 'error',
        message: '댓글 작성 중 오류가 발생했습니다.'
      })
      setShowMessage(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">관리자 댓글 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 원글 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">원글</div>
          <div className="font-medium text-gray-900 mb-2">{parentPost.title}</div>
          <div className="text-sm text-gray-500 mb-2">
            작성자: {parentPost.author} | 작성일: {new Date(parentPost.created_at).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-700 max-h-20 overflow-y-auto">
            {parentPost.content.substring(0, 200)}
            {parentPost.content.length > 200 && '...'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              댓글 내용 *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="댓글 내용을 입력하세요"
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
              {isSubmitting ? '작성 중...' : '댓글 작성'}
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