'use client'

import { useState } from 'react'
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ContentImageUploadProps {
  title: string
  description: string
  currentDescription: string
  currentImageUrl?: string
  onContentChange: (description: string, imageUrl?: string) => void
  className?: string
}

export default function ContentImageUpload({
  title,
  description,
  currentDescription,
  currentImageUrl,
  onContentChange,
  className = ''
}: ContentImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState(currentImageUrl || '')
  const [tempDescription, setTempDescription] = useState(currentDescription || '')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    // 이미지 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)

    try {
      // 파일명에 타임스탬프 추가하여 중복 방지
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('competition-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('이미지 업로드 중 오류가 발생했습니다.')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('competition-images')
        .getPublicUrl(filePath)

      setTempImageUrl(publicUrl)
      onContentChange(tempDescription, publicUrl)
    } catch (error) {
      console.error('Error:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setTempImageUrl('')
    onContentChange(tempDescription, '')
  }

  const handleDescriptionChange = (value: string) => {
    setTempDescription(value)
    onContentChange(value, tempImageUrl || undefined)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {title} *
        </label>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
        
        {/* 텍스트 입력 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <FileText className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">설명 내용</span>
          </div>
          <textarea
            value={tempDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`${title}에 대한 자세한 설명을 입력하세요...`}
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <div className="flex items-center mb-2">
            <ImageIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">이미지 (선택)</span>
          </div>
          
          {tempImageUrl ? (
            <div className="relative inline-block">
              <img
                src={tempImageUrl}
                alt={title}
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor={`image-upload-${title.replace(/\s+/g, '-')}`} className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isUploading ? '업로드 중...' : '이미지를 클릭하여 업로드'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF 파일 (최대 5MB)
                  </p>
                </div>
              </label>
              <input
                id={`image-upload-${title.replace(/\s+/g, '-')}`}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}