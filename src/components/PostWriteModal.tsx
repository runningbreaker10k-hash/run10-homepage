'use client'

import { useState, useEffect } from 'react'
import { X, Image, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import MessageModal from './MessageModal'

const postSchema = z.object({
  title: z.string()
    .min(2, '제목은 최소 2자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 가능합니다'),
  content: z.string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(10000, '내용은 최대 10,000자까지 가능합니다'),
  is_notice: z.boolean().optional(),
  is_private: z.boolean().optional(),
  post_password: z.string().optional()
})

type PostFormData = z.infer<typeof postSchema>

interface PostWriteModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
  onPostCreated: () => void
}

export default function PostWriteModal({ isOpen, onClose, competitionId, onPostCreated }: PostWriteModalProps) {
  const { user, getGradeInfo } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })
  const [isPrivate, setIsPrivate] = useState(true)
  const [postPassword, setPostPassword] = useState('')
  const [postPasswordConfirm, setPostPasswordConfirm] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      is_notice: false,
      is_private: false,
      post_password: ''
    }
  })

  // 로그인 확인
  useEffect(() => {
    if (isOpen && !user) {
      setMessageProps({
        type: 'error',
        message: '로그인 후 이용해주세요'
      })
      setShowMessage(true)
      onClose()
    }
  }, [isOpen, user, onClose])

  if (!isOpen) return null

  // 이미지 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessageProps({
        type: 'error',
        message: '이미지 크기는 5MB 이하여야 합니다'
      })
      setShowMessage(true)
      return
    }

    // 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      setMessageProps({
        type: 'error',
        message: '이미지 파일만 업로드 가능합니다'
      })
      setShowMessage(true)
      return
    }

    setSelectedImage(file)

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 이미지 제거
  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    const fileInput = document.getElementById('image-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  // 이미지 업로드
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('competition-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('이미지 업로드 오류:', uploadError)
        return null
      }

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('competition-images')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('이미지 업로드 중 오류:', error)
      return null
    }
  }

  const onSubmit = async (data: PostFormData) => {
    if (!user) {
      setMessageProps({
        type: 'error',
        message: '로그인이 필요합니다'
      })
      setShowMessage(true)
      return
    }

    // 비밀글인 경우 비밀번호 체크
    if (isPrivate) {
      if (!postPassword.trim()) {
        setMessageProps({
          type: 'error',
          message: '비밀번호를 입력해주세요'
        })
        setShowMessage(true)
        return
      }
      if (postPassword.length !== 4 || !/^\d+$/.test(postPassword)) {
        setMessageProps({
          type: 'error',
          message: '비밀번호는 4자리 숫자여야 합니다'
        })
        setShowMessage(true)
        return
      }
      if (!postPasswordConfirm.trim()) {
        setMessageProps({
          type: 'error',
          message: '비밀번호 확인을 입력해주세요'
        })
        setShowMessage(true)
        return
      }
      if (postPassword !== postPasswordConfirm) {
        setMessageProps({
          type: 'error',
          message: '비밀번호가 일치하지 않습니다'
        })
        setShowMessage(true)
        return
      }
    }

    setIsLoading(true)
    setUploadProgress(0)

    try {
      let imageUrl: string | null = null

      // 이미지가 선택된 경우 업로드
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
        if (!imageUrl) {
          setMessageProps({
            type: 'error',
            message: '이미지 업로드에 실패했습니다'
          })
          setShowMessage(true)
          return
        }
      }

      // 관리자 권한 확인 (공지글 작성 시)
      const isAdmin = user.role === 'admin'
      const canWriteNotice = isAdmin && data.is_notice

      // 게시글 저장 (community_posts 테이블 사용)
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          competition_id: competitionId, // 대회별 게시판임을 표시
          title: data.title,
          content: data.content,
          image_url: imageUrl,
          is_notice: canWriteNotice || false,
          is_private: isPrivate,
          post_password: isPrivate ? postPassword : null
        })

      if (error) {
        console.error('게시글 작성 오류:', error)
        setMessageProps({
          type: 'error',
          message: '게시글 작성 중 오류가 발생했습니다'
        })
        setShowMessage(true)
        return
      }

      // 성공 처리
      setMessageProps({
        type: 'success',
        message: '게시글이 성공적으로 작성되었습니다'
      })
      setShowMessage(true)

      // 폼 초기화
      reset()
      removeImage()
      setIsPrivate(true)
      setPostPassword('')
      setPostPasswordConfirm('')
      onPostCreated()
      onClose()

    } catch (error) {
      console.error('게시글 작성 중 오류:', error)
      setMessageProps({
        type: 'error',
        message: '게시글 작성 중 오류가 발생했습니다'
      })
      setShowMessage(true)
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const gradeInfo = user ? getGradeInfo(user.grade, user.role) : null
  const isAdmin = user?.role === 'admin'

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold">게시글 작성</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1 touch-manipulation"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {user && (
          <div className="flex items-center mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            {gradeInfo && (
              <img
                src={gradeInfo.icon}
                alt={gradeInfo.display}
                className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0"
              />
            )}
            <span className="font-medium text-blue-900 text-sm sm:text-base break-words">{user.name}</span>
            <span className="text-blue-700 ml-2 text-xs sm:text-sm">({gradeInfo?.display})</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          {/* 관리자 공지글 옵션 */}
          {isAdmin && (
            <div className="flex items-center space-x-2 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <input
                {...register('is_notice', {
                  onChange: (e) => {
                    setIsPrivate(!e.target.checked)
                    if (e.target.checked) {
                      setPostPassword('')
                      setPostPasswordConfirm('')
                    }
                  }
                })}
                type="checkbox"
                id="is_notice"
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded touch-manipulation"
              />
              <label htmlFor="is_notice" className="text-xs sm:text-sm font-medium text-amber-900 cursor-pointer">
                📢 공지글로 작성
              </label>
            </div>
          )}

          {/* 비밀글 옵션 - 공지글이 아닐 때만 표시 */}
          {isPrivate && (
          <div className="space-y-2 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_private"
                checked={isPrivate}
                onChange={() => {}}
                className="hidden"
              />
              <label className="text-xs sm:text-sm font-medium text-blue-900">
                🔒 비밀글로 작성
              </label>
            </div>

            <div className="mt-2 space-y-2">
                <div>
                  <label htmlFor="post_password" className="block text-xs font-medium text-blue-800 mb-1">
                    비밀번호 (4자리 숫자)
                  </label>
                  <input
                    type="password"
                    id="post_password"
                    value={postPassword}
                    onChange={(e) => setPostPassword(e.target.value)}
                    maxLength={4}
                    placeholder="4자리 숫자 입력"
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="post_password_confirm" className="block text-xs font-medium text-blue-800 mb-1">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="post_password_confirm"
                    value={postPasswordConfirm}
                    onChange={(e) => setPostPasswordConfirm(e.target.value)}
                    maxLength={4}
                    placeholder="비밀번호 재입력"
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {postPassword && postPasswordConfirm && postPassword !== postPasswordConfirm && (
                    <p className="mt-1 text-xs text-red-600">
                      비밀번호가 일치하지 않습니다
                    </p>
                  )}
                  {postPassword && postPasswordConfirm && postPassword === postPasswordConfirm && (
                    <p className="mt-1 text-xs text-green-600">
                      비밀번호가 일치합니다
                    </p>
                  )}
                </div>
                <p className="text-xs text-blue-700">
                  작성자와 관리자만 게시글을 볼 수 있습니다
                </p>
              </div>
          </div>
          )}

          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="제목을 입력하세요"
            />
            {errors.title && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{errors.title.message}</p>
            )}
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('content')}
              id="content"
              rows={6}
              className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="내용을 입력하세요"
            />
            {errors.content && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{errors.content.message}</p>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 (선택)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="max-w-full h-32 sm:h-40 object-cover mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 touch-manipulation"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Image className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <div className="mt-2">
                    <input
                      type="file"
                      id="image-input"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-input"
                      className="cursor-pointer text-blue-600 hover:text-blue-500 text-sm sm:text-base touch-manipulation"
                    >
                      클릭하여 이미지 선택
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">5MB 이하, JPG, PNG, GIF</p>
                </div>
              )}

              {/* 업로드 진행률 */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">업로드 중... {Math.round(uploadProgress)}%</p>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 sm:py-3 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 text-sm sm:text-base font-medium touch-manipulation order-2 sm:order-1"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 sm:py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-sm sm:text-base font-medium touch-manipulation order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2 flex-shrink-0" />
                  <span>작성 중...</span>
                </>
              ) : (
                '작성하기'
              )}
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