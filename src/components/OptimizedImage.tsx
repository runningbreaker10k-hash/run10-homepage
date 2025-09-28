'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  priority?: boolean
  quality?: number
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc = '/images/placeholder.jpg',
  priority = false,
  quality = 80
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
    setImageSrc(fallbackSrc)
  }, [fallbackSrc])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">로딩 중...</div>
        </div>
      )}

      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'filter grayscale' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rsa0+YGMadGNs3neTiY5n+ZgM5+2Q7lh5FBV1M8P5QLfhQpA="
        style={{
          objectFit: 'cover',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto'
        }}
      />
    </div>
  )
}

// 사용 예시를 위한 Hook
export function useImageOptimization(originalSrc: string) {
  // Supabase Storage 이미지 최적화
  const getOptimizedSrc = useCallback((width?: number, height?: number, quality = 80) => {
    if (!originalSrc) return originalSrc

    // Supabase Storage 이미지 변환 파라미터
    const params = new URLSearchParams()
    if (width) params.append('width', width.toString())
    if (height) params.append('height', height.toString())
    params.append('quality', quality.toString())
    params.append('format', 'webp') // WebP 형식으로 변환

    return `${originalSrc}?${params.toString()}`
  }, [originalSrc])

  return { getOptimizedSrc }
}