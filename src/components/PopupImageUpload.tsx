'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface PopupImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImageUrl?: string
}

export default function PopupImageUpload({ onImageUploaded, currentImageUrl }: PopupImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // 고유한 파일명 생성
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `popups/${fileName}`

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('competition-images')
        .upload(filePath, file)

      if (error) {
        console.error('Upload error:', error)
        alert('이미지 업로드에 실패했습니다.')
        return
      }

      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('competition-images')
        .getPublicUrl(filePath)

      setPreviewUrl(publicUrl)
      onImageUploaded(publicUrl)

    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setPreviewUrl(null)
    onImageUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    await uploadImage(file)
  }

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="space-y-4">
          {/* 팝업 미리보기 (실제 팝업과 동일한 크기) */}
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">미리보기 (실제 팝업 크기: 600x450)</p>
            <div className="relative w-[600px] h-[450px] max-w-full mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="팝업 미리보기"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* 이미지 제거 버튼 */}
          <button
            type="button"
            onClick={removeImage}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <X className="w-5 h-5" />
            이미지 제거
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600">업로드 중...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-700 font-medium">클릭하거나 파일을 드래그하여 업로드</p>
                <p className="text-sm text-gray-500 mt-1">
                  권장: 600x450 픽셀 (4:3 비율) | 최대 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
