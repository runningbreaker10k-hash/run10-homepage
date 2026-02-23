import { useEffect } from 'react'

export interface UTMData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

/**
 * UTM 파라미터를 URL에서 추출하여 세션스토리지에 저장하는 Hook
 * 페이지 진입 시 자동으로 UTM을 캡처하고 저장합니다.
 */
export function useUTMTracking() {
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return

    // 현재 URL에서 쿼리 파라미터 추출
    const searchParams = new URLSearchParams(window.location.search)

    // UTM 파라미터 확인
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')
    const utmContent = searchParams.get('utm_content')
    const utmTerm = searchParams.get('utm_term')

    // UTM 파라미터가 있으면 저장
    if (utmSource || utmMedium || utmCampaign || utmContent || utmTerm) {
      const utmData: UTMData = {}

      if (utmSource) utmData.source = utmSource
      if (utmMedium) utmData.medium = utmMedium
      if (utmCampaign) utmData.campaign = utmCampaign
      if (utmContent) utmData.content = utmContent
      if (utmTerm) utmData.term = utmTerm

      // 세션스토리지에 저장
      sessionStorage.setItem('utm_data', JSON.stringify(utmData))

      // GA4에 utm 전송 (기본 동작)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          'utm_source': utmSource || undefined,
          'utm_medium': utmMedium || undefined,
          'utm_campaign': utmCampaign || undefined,
          'utm_content': utmContent || undefined,
          'utm_term': utmTerm || undefined
        })
      }
    }
  }, [])
}

/**
 * 세션스토리지에서 UTM 데이터를 가져오는 함수
 */
export function getUTMData(): UTMData | null {
  if (typeof window === 'undefined') return null

  const utmDataStr = sessionStorage.getItem('utm_data')
  if (!utmDataStr) return null

  try {
    return JSON.parse(utmDataStr) as UTMData
  } catch {
    return null
  }
}

/**
 * 세션스토리지에서 UTM 데이터를 제거하는 함수
 */
export function clearUTMData(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('utm_data')
}
