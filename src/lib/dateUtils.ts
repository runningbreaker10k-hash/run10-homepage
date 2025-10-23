import { format as dateFnsFormat } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * UTC 시간을 한국 시간(KST, UTC+9)으로 변환
 * Supabase는 이미 올바른 UTC 시간을 반환하므로, 브라우저의 로컬 시간대로 표시
 */
export function toKST(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // Date 객체는 이미 로컬 시간대를 고려하므로 변환 없이 반환
  return date
}

/**
 * UTC 시간을 KST로 변환하고 포맷팅
 */
export function formatKST(utcDate: string | Date, formatStr: string = 'yyyy.MM.dd HH:mm'): string {
  const date = toKST(utcDate)
  return dateFnsFormat(date, formatStr, { locale: ko })
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
