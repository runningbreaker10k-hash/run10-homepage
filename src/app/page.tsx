'use client'

import { useState, useEffect } from 'react'
import WebMainPage from '@/components/WebMainPage'
import AppMainPage from '@/components/AppMainPage'

export default function Home() {
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios' | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // 플랫폼 구분 (웹 vs 앱)
  useEffect(() => {
    if (typeof window === 'undefined') return

    let detectedPlatform: 'web' | 'android' | 'ios' = 'web'

    // 1. URL 쿼리 파라미터 확인 (테스트용)
    const urlParams = new URLSearchParams(window.location.search)
    const platformParam = urlParams.get('platform')

    if (platformParam === 'android' || platformParam === 'ios') {
      detectedPlatform = platformParam
      // sessionStorage에 저장 (테스트 환경에서 플랫폼 유지)
      sessionStorage.setItem('appPlatform', platformParam)
    }
    // 2. sessionStorage 확인 (테스트용 플랫폼 정보 유지)
    else {
      const savedPlatform = sessionStorage.getItem('appPlatform')
      if (savedPlatform === 'android' || savedPlatform === 'ios') {
        detectedPlatform = savedPlatform
      }
      // 3. 실제 UserAgent 확인
      else {
        const userAgent = navigator.userAgent.toLowerCase()

        if (userAgent.indexOf('androidapp') !== -1) {
          detectedPlatform = 'android'
          sessionStorage.setItem('appPlatform', 'android')
        } else if (userAgent.indexOf('iosapp') !== -1) {
          detectedPlatform = 'ios'
          sessionStorage.setItem('appPlatform', 'ios')
        } else {
          detectedPlatform = 'web'
          sessionStorage.removeItem('appPlatform')
        }
      }
    }

    setPlatform(detectedPlatform)
    setIsChecking(false)
  }, [])

  // 플랫폼 확인 중일 때 로딩 화면
  if (isChecking || platform === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-black text-white mb-4">RUN10</h1>
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // 플랫폼에 따라 다른 페이지 렌더링
  if (platform === 'android' || platform === 'ios') {
    return <AppMainPage />
  }

  return <WebMainPage />
}
