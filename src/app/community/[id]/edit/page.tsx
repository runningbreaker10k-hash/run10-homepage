'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Image, X, Loader2 } from 'lucide-react'

const postSchema = z.object({
  title: z.string()
    .min(2, '제목은 최소 2자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 가능합니다'),
  content: z.string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(10000, '내용은 최대 10,000자까지 가능합니다'),
  is_notice: z.boolean().optional()
})

type PostFormData = z.infer<typeof postSchema>

interface Post {
  id: string
  title: string
  content: string
  image_url?: string
  is_notice: boolean
  user_id: string
  users: {
    role: 'admin' | 'user'
  }
}

export default function CommunityEditPage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema)
  })

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users (role)
        `)
        .eq('id', postId)
        .single()

      if (error) throw error

      // 권한 체크
      if (!user || (user.role !== 'admin' && user.id !== data.user_id)) {
        alert('게시글 수정 권한이 없습니다')
        router.push(`/community/${postId}`)
        return
      }

      setPost(data)
      setCurrentImageUrl(data.image_url)
      
      // 폼에 기존 데이터 설정
      setValue('title', data.title)
      setValue('content', data.content)
      setValue('is_notice', data.is_notice)

    } catch (error) {
      console.error('게시글 로드 오류:', error)
      alert('게시글을 찾을 수 없습니다')
      router.push('/community')
    } finally {
      setIsPageLoading(false)
    }
  }

  // 이미지 선택 처리
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다')
      return
    }

    // 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다')
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

  // 새 이미지 제거
  const removeNewImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    const fileInput = document.getElementById('image-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  // 기존 이미지 제거
  const removeCurrentImage = () => {
    setCurrentImageUrl(null)
  }

  // 이미지 업로드
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `community/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('competition-images')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100)
          }
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('competition-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      return null
    }
  }

  const onSubmit = async (data: PostFormData) => {
    if (!user || !post) return

    setIsLoading(true)

    try {
      let finalImageUrl = currentImageUrl

      // 새 이미지가 선택된 경우
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage)
        if (!uploadedUrl) {
          alert('이미지 업로드에 실패했습니다')
          return
        }
        
        // 기존 이미지가 있다면 삭제
        if (currentImageUrl && post.image_url) {
          const oldImagePath = post.image_url.split('/').pop()
          if (oldImagePath) {
            await supabase.storage
              .from('competition-images')
              .remove([`community/${oldImagePath}`])
          }
        }
        
        finalImageUrl = uploadedUrl
      }

      // 공지글은 관리자만 설정 가능
      const isNotice = user.role === 'admin' ? data.is_notice : false

      // 게시글 업데이트
      const { error } = await supabase
        .from('community_posts')
        .update({
          title: data.title,
          content: data.content,
          image_url: finalImageUrl,
          is_notice: isNotice,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      alert('게시글이 수정되었습니다')
      router.push(`/community/${postId}`)
    } catch (error) {
      console.error('게시글 수정 오류:', error)
      alert('게시글 수정 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleCancel = () => {
    router.push(`/community/${postId}`)
  }

  if (isPageLoading || !post || !user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const gradeInfo = getGradeInfo(user.grade)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            뒤로가기
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{gradeInfo.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">게시글 수정</h1>
              <p className="text-sm text-gray-600">
                작성자: <span className="font-medium">{user.name}</span> ({gradeInfo.display})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 수정 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          {/* 관리자 전용: 공지글 설정 */}
          {user.role === 'admin' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <label className="flex items-center">
                <input
                  {...register('is_notice')}
                  type="checkbox"
                  className="mr-2"
                />
                <span className="text-sm font-medium text-blue-800">
                  📌 공지글로 등록 (상단 고정)
                </span>
              </label>
            </div>
          )}

          {/* 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="제목을 입력하세요"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* 이미지 관리 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 (선택)
            </label>
            
            {/* 기존 이미지 */}
            {currentImageUrl && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">현재 이미지:</p>
                <div className="relative inline-block">
                  <img
                    src={currentImageUrl}
                    alt="현재 이미지"
                    className="w-full max-w-md h-48 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeCurrentImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 새 이미지 업로드 */}
            {!selectedImage ? (
              <div>
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label
                  htmlFor="image-input"
                  className="flex items-center justify-center w-full p-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {currentImageUrl ? '새 이미지로 교체하려면 클릭하세요' : '클릭하여 이미지를 선택하세요'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, GIF (최대 5MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">새 이미지 미리보기:</p>
                <div className="relative inline-block">
                  <img
                    src={imagePreview!}
                    alt="새 이미지 미리보기"
                    className="w-full max-w-md h-48 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  업로드 중... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('content')}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-vertical"
              placeholder="내용을 입력하세요"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
            <div className="text-right text-sm text-gray-500 mt-1">
              {watch('content')?.length || 0} / 10,000자
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>수정 중...</span>
                </>
              ) : (
                <span>수정하기</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}