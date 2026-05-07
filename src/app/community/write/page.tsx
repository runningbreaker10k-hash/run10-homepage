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

  // 관리자만 접근 가능
  useEffect(() => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      router.push('/community')
      return
    }
    if (user.role !== 'admin') {
      alert('관리자만 글을 작성할 수 있습니다')
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

  const gradeInfo = getGradeInfo(user.grade, user.role)

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/community-hero-bg.jpg"
            alt="게시글 작성 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">게시글 작성</h1>
              <p className="text-lg md:text-xl text-red-100">
                런텐 회원들과 자유롭게 소통해보세요
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm sm:text-base font-medium touch-manipulation backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
              <span>목록으로</span>
            </button>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* 사용자 정보 표시 */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <img
                src={gradeInfo.icon}
                alt={gradeInfo.display}
                className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0"
              />
              <div>
                <span className="font-medium text-red-900 text-sm sm:text-base break-words">{user.name}</span>
                <span className="text-red-700 ml-2 text-xs sm:text-sm">({gradeInfo.display})</span>
              </div>
            </div>
          </div>

          {/* 작성 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow border border-gray-200">
              {/* 관리자 전용: 공지글 설정 */}
              {user.role === 'admin' && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input
                      {...register('is_notice')}
                      type="checkbox"
                      className="mr-2 sm:mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded touch-manipulation"
                    />
                    <span className="text-xs sm:text-sm font-medium text-red-800">
                      📌 공지글로 등록 (상단 고정)
                    </span>
                  </label>
                </div>
              )}

              {/* 제목 */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="제목을 입력하세요"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.title.message}</p>
                )}
              </div>

              {/* 내용 */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('content')}
                  rows={10}
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-vertical"
                  placeholder={`내용을 입력하세요

✅ 러닝 관련 정보나 경험을 자유롭게 공유해주세요
✅ 서로를 존중하는 건전한 소통 문화를 만들어가요
❌ 광고, 욕설, 비방 등은 삼가해주세요`}
                />
                {errors.content && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.content.message}</p>
                )}
                <div className="text-right text-xs sm:text-sm text-gray-500 mt-1">
                  {watch('content')?.length || 0} / 10,000자
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  이미지 첨부 (선택)
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 hover:border-red-400 transition-colors">
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
                        className="flex flex-col items-center justify-center cursor-pointer touch-manipulation"
                      >
                        <Image className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                        <p className="text-xs sm:text-sm text-red-600 hover:text-red-500 font-medium mb-1">
                          클릭하여 이미지를 선택하세요
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, GIF (최대 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview!}
                        alt="미리보기"
                        className="w-full max-w-md h-32 sm:h-48 object-cover rounded-lg border border-gray-300 mx-auto"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 touch-manipulation"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2 sm:mt-3">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        업로드 중... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation order-2 sm:order-1"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base font-medium touch-manipulation order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
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
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-xs sm:text-sm font-medium text-red-900 mb-2 sm:mb-3 flex items-center">
              <span className="mr-1 sm:mr-2">💡</span>
              게시글 작성 안내
            </h3>
            <ul className="text-xs sm:text-sm text-red-700 space-y-1 sm:space-y-2">
              <li className="flex items-start">
                <span className="mr-2 flex-shrink-0">•</span>
                <span>러닝 관련 정보, 경험, 질문 등을 자유롭게 공유해주세요</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 flex-shrink-0">•</span>
                <span>다른 회원들을 존중하는 건전한 소통을 부탁드립니다</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 flex-shrink-0">•</span>
                <span>광고, 욕설, 비방 등 부적절한 내용은 관리자에 의해 삭제될 수 있습니다</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 flex-shrink-0">•</span>
                <span>이미지는 5MB 이하의 JPG, PNG, GIF 파일만 업로드 가능합니다</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}