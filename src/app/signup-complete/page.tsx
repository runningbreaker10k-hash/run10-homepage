'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function SignupCompletePage() {
  const router = useRouter()
  const [competitionTitle, setCompetitionTitle] = useState<string>('')
  const [remainingSeconds, setRemainingSeconds] = useState(3)

  useEffect(() => {
    // URL에서 쿼리 파라미터 추출
    const params = new URLSearchParams(window.location.search)
    const competitionId = params.get('competitionId')
    const competitionName = params.get('competitionName') || '대회'

    setCompetitionTitle(decodeURIComponent(competitionName))

    // TODO: GA4 signup_complete 이벤트 추적은 나중에 재작업
    // (현재 리다이렉트 체인으로 인한 Vercel Fast Data Transfer 비용 증가로 인해 임시 제거)

    // 3초 후 자동 리다이렉트
    const timer = setTimeout(() => {
      if (competitionId) {
        router.push(`/competitions/${competitionId}?tab=lookup`)
      } else {
        router.push('/competitions')
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  // 남은 시간 카운트다운
  useEffect(() => {
    if (remainingSeconds <= 0) return

    const timer = setTimeout(() => {
      setRemainingSeconds(remainingSeconds - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [remainingSeconds])

  const handleSkip = () => {
    const params = new URLSearchParams(window.location.search)
    const competitionId = params.get('competitionId')

    if (competitionId) {
      router.push(`/competitions/${competitionId}?tab=lookup`)
    } else {
      router.push('/competitions')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 sm:p-12 max-w-md w-full text-center">
        {/* 체크 아이콘 */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          대회 신청 완료!
        </h1>

        {/* 대회명 */}
        <p className="text-gray-600 text-base sm:text-lg mb-6">
          <span className="font-semibold text-gray-900">{competitionTitle}</span>에 신청되셨습니다.
        </p>

        {/* 메시지 */}
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          신청 내역을 확인하시려면 아래를 참고해주세요.
        </p>

        {/* 자동 리다이렉트 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-700 text-sm sm:text-base">
            <span className="font-semibold">{remainingSeconds}초</span> 후 자동으로 이동합니다.
          </p>
        </div>

        {/* 버튼 */}
        <button
          onClick={handleSkip}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
        >
          신청 내역 확인
        </button>
      </div>
    </div>
  )
}
