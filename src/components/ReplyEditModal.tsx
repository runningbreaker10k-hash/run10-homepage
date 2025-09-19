'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import MessageModal from './MessageModal'

interface ReplyEditModalProps {
  isOpen: boolean
  onClose: () => void
  reply: any
  onReplyUpdated: () => void
}

export default function ReplyEditModal({ isOpen, onClose, reply, onReplyUpdated }: ReplyEditModalProps) {
  const [content, setContent] = useState(reply?.content || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })

  if (!isOpen || !reply) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('competition_posts')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', reply.id)

      if (error) throw error

      onReplyUpdated()
      onClose()
    } catch (error) {
      console.error('댓글 수정 오류:', error)
      setMessageProps({
        type: 'error',
        message: '댓글 수정 중 오류가 발생했습니다.'
      })
      setShowMessage(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">댓글 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 원본 댓글 정보 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">기존 댓글</div>
          <div className="text-sm text-gray-500 mb-2">
            작성일: {new Date(reply.created_at).toLocaleDateString()} | 
            {reply.updated_at && reply.updated_at !== reply.created_at && (
              <span> 수정일: {new Date(reply.updated_at).toLocaleDateString()}</span>
            )}
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
              placeholder="수정할 댓글 내용을 입력하세요"
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
              {isSubmitting ? '수정 중...' : '수정 완료'}
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