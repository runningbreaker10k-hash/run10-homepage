'use client'

import { useState, useRef } from 'react'
import { Upload, X, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImagePreview {
  id: string
  file: File
  preview: string
  caption: string
  uploading?: boolean
}

interface MultipleImageUploadProps {
  onUploadComplete: () => void
  competitionId: string
}

export default function MultipleImageUpload({ onUploadComplete, competitionId }: MultipleImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newImages: ImagePreview[] = []
    Array.from(files).forEach(file => {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}은(는) 이미지 파일이 아닙니다.`)
        return
      }

      // 5MB 제한
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}의 크기가 5MB를 초과합니다.`)
        return
      }

      const preview = URL.createObjectURL(file)
      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        caption: ''
      })
    })

    setImages(prev => [...prev, ...newImages])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      // 프리뷰 URL 해제
      const removed = prev.find(img => img.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.preview)
      }
      return updated
    })
  }

  const updateCaption = (id: string, caption: string) => {
    setImages(prev => prev.map(img =>
      img.id === id ? { ...img, caption } : img
    ))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }

  const handleUploadAll = async () => {
    if (images.length === 0) {
      alert('업로드할 사진을 선택해주세요.')
      return
    }

    setIsUploading(true)

    try {
      // 기존 사진 중 최대 display_order 조회
      const { data: existingPhotos, error: fetchError } = await supabase
        .from('competition_photos')
        .select('display_order')
        .eq('competition_id', competitionId)
        .order('display_order', { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        alert('기존 사진 정보를 가져오는 중 오류가 발생했습니다.')
        return
      }

      // 시작 순서 계산 (기존 사진이 없으면 0부터, 있으면 최대값+1부터)
      let currentOrder = existingPhotos && existingPhotos.length > 0
        ? existingPhotos[0].display_order + 1
        : 0

      // 성공/실패 추적
      const successList: string[] = []
      const failedList: string[] = []

      // 모든 이미지를 순차적으로 업로드
      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        try {
          // 파일명 충돌 방지: 타임스탬프 + 인덱스 + 랜덤
          const fileExt = image.file.name.split('.').pop()
          const fileName = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `competition-photos/${competitionId}/${fileName}`

          // Supabase Storage에 업로드
          const { error: uploadError } = await supabase.storage
            .from('competition-images')
            .upload(filePath, image.file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            failedList.push(image.file.name)
            continue
          }

          // 공개 URL 가져오기
          const { data: { publicUrl } } = supabase.storage
            .from('competition-images')
            .getPublicUrl(filePath)

          // DB에 저장 (성공한 순서대로 currentOrder 부여)
          const { error: dbError } = await supabase
            .from('competition_photos')
            .insert({
              competition_id: competitionId,
              image_url: publicUrl,
              caption: image.caption || null,
              display_order: currentOrder
            })

          if (dbError) {
            console.error('DB insert error:', dbError)

            // DB 저장 실패 시 Storage에서 파일 삭제 (Rollback)
            await supabase.storage
              .from('competition-images')
              .remove([filePath])

            failedList.push(image.file.name)
            continue
          }

          // 성공 시 순서 증가 및 성공 목록에 추가
          successList.push(image.file.name)
          currentOrder++

          // 업로드 간 짧은 딜레이 (파일명 충돌 추가 방지)
          await new Promise(resolve => setTimeout(resolve, 10))
        } catch (error) {
          console.error('Image upload error:', error)
          failedList.push(image.file.name)
        }
      }

      // 결과 피드백
      if (failedList.length === 0) {
        alert(`✅ 모든 사진(${successList.length}장)이 성공적으로 업로드되었습니다.`)
      } else if (successList.length === 0) {
        alert(`❌ 모든 사진 업로드에 실패했습니다.\n\n실패한 파일:\n${failedList.join('\n')}`)
      } else {
        alert(
          `⚠️ 일부 사진만 업로드되었습니다.\n\n` +
          `성공: ${successList.length}장\n` +
          `실패: ${failedList.length}장\n\n` +
          `실패한 파일:\n${failedList.slice(0, 5).join('\n')}` +
          (failedList.length > 5 ? `\n... 외 ${failedList.length - 5}개` : '')
        )
      }

      // 성공한 사진이 있으면 목록 새로고침
      if (successList.length > 0) {
        setImages([])
        onUploadComplete()
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 드래그앤드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-gray-600 mb-2">
          클릭하거나 파일을 드래그하여 사진을 추가하세요
        </p>
        <p className="text-sm text-gray-500">
          여러 장의 이미지를 한 번에 선택할 수 있습니다 (최대 5MB/파일)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* 이미지 미리보기 그리드 */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              선택된 사진 ({images.length}장)
            </h3>
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? '업로드 중...' : '전체 업로드'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.preview}
                    alt={`미리보기 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                    {index + 1}번째
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(e) => updateCaption(image.id, e.target.value)}
                    placeholder="사진 설명 (선택사항)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{image.file.name}</span>
                    <span>{(image.file.size / 1024 / 1024).toFixed(2)}MB</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">순서 변경</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => moveImage(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => moveImage(index, Math.min(images.length - 1, index + 1))}
                      disabled={index === images.length - 1}
                      className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
