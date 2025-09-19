'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import MessageModal from './MessageModal'

interface UnifiedPostWriteModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId?: string  // 없으면 회원게시판, 있으면 대회별게시판
  onPostCreated: () => void
}

export default function UnifiedPostWriteModal({
  isOpen,
  onClose,
  competitionId,
  onPostCreated
}: UnifiedPostWriteModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })

  if (!isOpen) return null

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">로그인이 필요합니다</h3>
          <p className="text-gray-600 mb-4">게시글을 작성하려면 먼저 로그인해주세요.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            확인
          </button>
        </div>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessageProps({
          type: 'error',
          message: '이미지 파일은 5MB 이하여야 합니다.'
        })
        setShowMessage(true)
        return
      }
      setImageFile(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `community-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('competition-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('competition-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let imageUrl = null

      // 이미지 업로드
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          setMessageProps({
            type: 'error',
            message: '이미지 업로드에 실패했습니다.'
          })
          setShowMessage(true)
          setIsSubmitting(false)
          return
        }
      }

      // 게시글 작성
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          competition_id: competitionId || null,
          title: formData.title,
          content: formData.content,
          image_url: imageUrl,
          views: 0,
          is_notice: false
        })

      if (error) throw error

      setMessageProps({
        type: 'success',
        message: '게시글이 성공적으로 작성되었습니다.'
      })
      setShowMessage(true)

      // 폼 초기화
      setFormData({ title: '', content: '' })
      setImageFile(null)
      onPostCreated()

      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('게시글 작성 오류:', error)
      setMessageProps({
        type: 'error',
        message: '게시글 작성에 실패했습니다.'
      })
      setShowMessage(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {competitionId ? '대회 게시글 작성' : '게시글 작성'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 작성자 정보 */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">작성자: {user.name}</p>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="제목을 입력하세요"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={8}
                placeholder="내용을 입력하세요"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 첨부 (선택사항)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF 파일만 가능 (최대 5MB)</p>
              {imageFile && (
                <p className="text-sm text-green-600 mt-1">선택된 파일: {imageFile.name}</p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              >
                {isSubmitting ? '작성 중...' : '작성하기'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <MessageModal
        isOpen={showMessage}
        onClose={() => setShowMessage(false)}
        type={messageProps.type}
        message={messageProps.message}
      />
    </>
  )
}