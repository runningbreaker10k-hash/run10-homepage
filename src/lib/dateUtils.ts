import { format as dateFnsFormat } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * UTC 시간을 한국 시간(KST, UTC+9)으로 변환
 * Supabase는 이미 올바른 UTC 시간을 반환하므로, +9시간 추가
 */
export function toKST(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // UTC 시간에 9시간(한국 시간대) 추가
  const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
  return kstDate
}

/**
 * UTC 시간을 KST로 변환하고 포맷팅 (서버/클라이언트 모두 사용 가능)
 */
export function formatKST(utcDate: string | Date, formatStr: string = 'yyyy.MM.dd HH:mm'): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate

  // 서버 환경인지 확인 (Node.js 환경)
  const isServer = typeof window === 'undefined'

  if (isServer) {
    // 서버(UTC 환경): +9시간 추가 필요
    const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
    return dateFnsFormat(kstDate, formatStr, { locale: ko })
  } else {
    // 브라우저(KST 환경): 자동 변환에 의존
    return dateFnsFormat(date, formatStr, { locale: ko })
  }
}

/**
 * UTC 시간을 KST로 변환하고 상대 시간으로 표시 (예: 5분 전, 2시간 전)
 */
export function formatRelativeKST(utcDate: string | Date): string {
  const date = toKST(utcDate)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return dateFnsFormat(date, 'yyyy.MM.dd', { locale: ko })
  } else if (hours > 0) {
    return `${hours}시간 전`
  } else if (minutes > 0) {
    return `${minutes}분 전`
  } else {
    return '방금 전'
  }
}

/**
 * UTC 날짜를 datetime-local input에 사용할 수 있는 형식으로 변환 (KST 기준)
 * 예: "2024-03-20T14:30"
 */
export function toDatetimeLocal(utcDate: string | Date): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // 로컬 시간대 기준으로 datetime-local 형식 생성
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * datetime-local input 값을 UTC ISO 문자열로 변환
 */
export function fromDatetimeLocal(datetimeLocal: string): string {
  const date = new Date(datetimeLocal)
  return date.toISOString()
}
