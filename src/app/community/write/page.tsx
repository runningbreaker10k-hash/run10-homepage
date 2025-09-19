'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function CommunityWritePage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      is_notice: false
    }
  })

  // 로그인하지 않은 경우 리다이렉트
  useEffect(() => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      router.push('/community')
      return
    }
  }, [user, router])

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
    if (!user) return

    setIsLoading(true)

    try {
      let imageUrl: string | null = null

      // 이미지가 있는 경우 업로드
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
        if (!imageUrl) {
          alert('이미지 업로드에 실패했습니다')
          return
        }
      }

      // 공지글은 관리자만 작성 가능
      const isNotice = user.role === 'admin' ? data.is_notice : false

      // 게시글 저장 (회원게시판: competition_id는 null)
      const { error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: user.id,
          title: data.title,
          content: data.content,
          image_url: imageUrl,
          is_notice: isNotice,
          competition_id: null  // 회원게시판은 대회 ID 없음
        }])

      if (error) throw error

      alert('게시글이 등록되었습니다')
      router.push('/community')
    } catch (error) {
      console.error('게시글 등록 오류:', error)
      alert('게시글 등록 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleCancel = () => {
    if (watch('title') || watch('content') || selectedImage) {
      if (confirm('작성 중인 내용이 모두 사라집니다. 정말 취소하시겠습니까?')) {
        router.push('/community')
      }
    } else {
      router.push('/community')
    }
  }

  if (!user) {
    return null
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
            목록으로
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{gradeInfo.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">게시글 작성</h1>
              <p className="text-sm text-gray-600">
                작성자: <span className="font-medium">{user.name}</span> ({gradeInfo.display})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 작성 폼 */}
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

          {/* 이미지 업로드 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 (선택)
            </label>
            
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
                      클릭하여 이미지를 선택하세요
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, GIF (최대 5MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview!}
                  alt="미리보기"
                  className="w-full max-w-md h-48 object-cover rounded-md border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
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
              placeholder="내용을 입력하세요&#10;&#10;✅ 러닝 관련 정보나 경험을 자유롭게 공유해주세요&#10;✅ 서로를 존중하는 건전한 소통 문화를 만들어가요&#10;❌ 광고, 욕설, 비방 등은 삼가해주세요"
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
                  <span>등록 중...</span>
                </>
              ) : (
                <span>등록하기</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 안내사항 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">💡 게시글 작성 안내</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 러닝 관련 정보, 경험, 질문 등을 자유롭게 공유해주세요</li>
          <li>• 다른 회원들을 존중하는 건전한 소통을 부탁드립니다</li>
          <li>• 광고, 욕설, 비방 등 부적절한 내용은 관리자에 의해 삭제될 수 있습니다</li>
          <li>• 이미지는 5MB 이하의 JPG, PNG, GIF 파일만 업로드 가능합니다</li>
        </ul>
      </div>
    </div>
  )
}