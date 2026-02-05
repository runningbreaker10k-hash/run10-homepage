/**
 * OneSignal 푸시 알림 유틸리티
 *
 * 사용 방법:
 * import { sendPush } from '@/lib/onesignal'
 *
 * await sendPush({
 *   pushIds: ['player_id_1', 'player_id_2'],
 *   title: '알림 제목',
 *   content: '알림 내용',
 *   url: 'https://run10.co.kr/flash/123'
 * })
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY

export interface PushPayload {
  pushIds: string[]        // 수신 대상 push_id (player_id) 목록
  title: string            // 푸시 제목
  content: string          // 푸시 내용
  url?: string             // 클릭 시 이동 URL
  imageUrl?: string        // 이미지 URL (선택)
}

export interface PushResult {
  success: boolean
  reason?: string
  data?: any
  error?: string
}

/**
 * OneSignal API를 통해 푸시 알림을 발송합니다.
 *
 * @param payload - 푸시 발송 정보
 * @returns 발송 결과
 */
export async function sendPush(payload: PushPayload): Promise<PushResult> {
  // 환경 변수 검증
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('OneSignal 환경 변수가 설정되지 않았습니다')
    return {
      success: false,
      reason: 'config_missing',
      error: 'OneSignal 환경 변수가 설정되지 않았습니다'
    }
  }

  const { pushIds, title, content, url, imageUrl } = payload

  // push_id가 없는 항목 제외 (null, undefined, 빈 문자열)
  const validPushIds = pushIds.filter(id => id && id.trim().length > 0)

  if (validPushIds.length === 0) {
    return {
      success: false,
      reason: 'no_valid_push_ids',
      error: '유효한 push_id가 없습니다'
    }
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: validPushIds,
        headings: { en: title, ko: title },
        contents: { en: content, ko: content },
        // 클릭 시 이동 URL (custom_url로 전달 - 앱케이크 설정에 따름)
        ...(url && { data: { custom_url: url } }),
        // 안드로이드 이미지
        ...(imageUrl && { big_picture: imageUrl }),
        // iOS 뱃지 증가
        ios_badgeType: 'Increase',
        ios_badgeCount: 1
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('OneSignal API 오류:', result)
      return {
        success: false,
        reason: 'api_error',
        error: result.errors?.[0] || 'OneSignal API 오류',
        data: result
      }
    }

    // 성공 로그
    console.log(`푸시 발송 성공: ${validPushIds.length}명, ID: ${result.id}`)

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('푸시 발송 중 오류:', error)
    return {
      success: false,
      reason: 'network_error',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 여러 사용자에게 동일한 푸시를 발송합니다.
 * push_id가 null인 사용자는 자동으로 제외됩니다.
 *
 * @param users - push_id를 포함한 사용자 배열
 * @param title - 푸시 제목
 * @param content - 푸시 내용
 * @param url - 클릭 시 이동 URL (선택)
 */
export async function sendPushToUsers(
  users: Array<{ push_id: string | null }>,
  title: string,
  content: string,
  url?: string
): Promise<PushResult> {
  const pushIds = users
    .map(u => u.push_id)
    .filter((id): id is string => id !== null && id !== undefined)

  return sendPush({
    pushIds,
    title,
    content,
    url
  })
}
