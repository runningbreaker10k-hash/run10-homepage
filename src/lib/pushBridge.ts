/**
 * 앱 푸시 브릿지 유틸리티
 *
 * 앱케이크 하이브리드 앱에서 push_id를 가져와 서버에 저장합니다.
 * 웹 환경에서는 아무 동작도 하지 않습니다.
 */

// Window 타입 확장
declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        cordova_iab?: {
          postMessage: (message: string) => void
        }
      }
    }
    receivePushId?: (pushId: string) => void
  }
}

/**
 * 현재 환경이 앱(하이브리드)인지 확인합니다.
 */
export function isAppEnvironment(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('androidapp') || userAgent.includes('iosapp')
}

/**
 * 브릿지가 준비될 때까지 대기합니다.
 */
function waitForBridge(callback: () => void, attempts = 0): void {
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.cordova_iab) {
    callback()
  } else if (attempts < 100) {
    setTimeout(() => waitForBridge(callback, attempts + 1), 100)
  }
}

/**
 * 앱에서 push_id를 가져와 서버에 저장합니다.
 *
 * @param userId - 로그인한 사용자의 ID (users.id)
 * @returns 성공 여부
 */
export async function savePushIdFromApp(userId: string): Promise<boolean> {
  // 웹 환경이면 무시
  if (!isAppEnvironment()) {
    return false
  }

  return new Promise((resolve) => {
    // push_id 수신 콜백 등록
    window.receivePushId = async (pushId: string) => {
      if (!pushId) {
        resolve(false)
        return
      }

      try {
        // API 호출하여 DB에 저장
        const response = await fetch('/api/user/update-push-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, push_id: pushId })
        })

        const result = await response.json()
        resolve(result.success === true)
      } catch {
        resolve(false)
      }
    }

    // 브릿지 호출
    waitForBridge(() => {
      try {
        window.webkit!.messageHandlers!.cordova_iab!.postMessage(
          JSON.stringify({
            action: 'getpushid',
            callback: 'receivePushId'
          })
        )
      } catch {
        resolve(false)
      }
    })

    // 타임아웃 (10초)
    setTimeout(() => {
      resolve(false)
    }, 10000)
  })
}
