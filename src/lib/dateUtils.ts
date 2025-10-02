import { format as dateFnsFormat } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * UTC 시간을 한국 시간(KST, UTC+9)으로 변환
 */
export function toKST(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // UTC 시간에 9시간을 더해서 KST로 변환
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
}

/**
 * UTC 시간을 KST로 변환하고 포맷팅
 */
export function formatKST(utcDate: string | Date, formatStr: string = 'yyyy.MM.dd HH:mm'): string {
  const kstDate = toKST(utcDate)
  return dateFnsFormat(kstDate, formatStr, { locale: ko })
}

/**
 * UTC 시간을 KST로 변환하고 상대 시간으로 표시 (예: 5분 전, 2시간 전)
 */
export function formatRelativeKST(utcDate: string | Date): string {
  const kstDate = toKST(utcDate)
  const now = new Date()
  const diff = now.getTime() - kstDate.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return dateFnsFormat(kstDate, 'yyyy.MM.dd', { locale: ko })
  } else if (hours > 0) {
    return `${hours}시간 전`
  } else if (minutes > 0) {
    return `${minutes}분 전`
  } else {
    return '방금 전'
  }
}
