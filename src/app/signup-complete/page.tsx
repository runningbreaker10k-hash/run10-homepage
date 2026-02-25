'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupCompletePage() {
  const router = useRouter()

  useEffect(() => {
    // URL에서 쿼리 파라미터 추출
    const params = new URLSearchParams(window.location.search)
    const competitionId = params.get('competitionId')

    // GA4 signup_complete 이벤트 추적
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'signup_complete', {
        competition_id: competitionId || undefined,
        timestamp: new Date().toISOString()
      })
    }

    // 즉시 해당 대회 페이지로 리다이렉트
    if (competitionId) {
      router.push(`/competitions/${competitionId}?tab=lookup`)
    } else {
      // 대회 ID가 없으면 대회 목록으로
      router.push('/competitions')
    }
  }, [router])

  return <></> // 빈 페이지
}
