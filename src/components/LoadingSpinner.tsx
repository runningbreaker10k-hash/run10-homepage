'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : 'flex items-center justify-center'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
        {text && (
          <p className="text-sm text-gray-600 animate-pulse">{text}</p>
        )}
      </div>
    </div>
  )
}

// 페이지 레벨 로딩
export function PageLoading({ text = '페이지를 불러오는 중...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// 버튼 내부 로딩
export function ButtonLoading({ text }: { text: string }) {
  return (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      {text}
    </>
  )
}

// 섹션 로딩
export function SectionLoading({
  height = 'h-64',
  text = '로딩 중...'
}: {
  height?: string
  text?: string
}) {
  return (
    <div className={`${height} flex items-center justify-center bg-gray-50 rounded-lg`}>
      <LoadingSpinner text={text} />
    </div>
  )
}