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
