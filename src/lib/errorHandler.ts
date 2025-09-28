// 전역 에러 처리 시스템
export interface AppError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

// 모달 표시 함수 타입 (런타임에 주입됨)
let showModalFunction: ((message: string, title?: string, type?: 'success' | 'error' | 'warning' | 'info') => void) | null = null

export function setModalFunction(fn: (message: string, title?: string, type?: 'success' | 'error' | 'warning' | 'info') => void) {
  showModalFunction = fn
}

export class ErrorHandler {
  static handle(error: any): AppError {
    // Supabase 에러 처리
    if (error?.code) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          if (error.message.includes('users_email_key')) {
            return {
              code: 'EMAIL_DUPLICATE',
              message: '이미 사용 중인 이메일 주소입니다.',
              statusCode: 409
            }
          }
          if (error.message.includes('users_user_id_key')) {
            return {
              code: 'USER_ID_DUPLICATE',
              message: '이미 사용 중인 아이디입니다.',
              statusCode: 409
            }
          }
          return {
            code: 'DUPLICATE_ENTRY',
            message: '중복된 데이터입니다.',
            statusCode: 409
          }

        case 'PGRST116': // No rows found
          return {
            code: 'NOT_FOUND',
            message: '요청한 데이터를 찾을 수 없습니다.',
            statusCode: 404
          }

        case '42501': // Insufficient privilege
          return {
            code: 'UNAUTHORIZED',
            message: '접근 권한이 없습니다.',
            statusCode: 403
          }

        default:
          return {
            code: 'DATABASE_ERROR',
            message: '데이터베이스 오류가 발생했습니다.',
            details: error.message,
            statusCode: 500
          }
      }
    }

    // 네트워크 에러
    if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: '네트워크 연결을 확인해주세요.',
        statusCode: 503
      }
    }

    // 일반 에러
    return {
      code: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다.',
      details: error?.message || error,
      statusCode: 500
    }
  }

  static showUserMessage(error: AppError): void {
    // 모달이 설정되어 있으면 모달 사용, 없으면 alert 폴백
    if (showModalFunction) {
      const type = error.statusCode && error.statusCode >= 400 ? 'error' : 'warning'
      showModalFunction(error.message, '오류', type)
    } else {
      // 폴백: alert 사용
      alert(error.message)
    }
  }

  static showSuccessMessage(message: string, title = '성공'): void {
    if (showModalFunction) {
      showModalFunction(message, title, 'success')
    } else {
      alert(message)
    }
  }

  static showInfoMessage(message: string, title = '알림'): void {
    if (showModalFunction) {
      showModalFunction(message, title, 'info')
    } else {
      alert(message)
    }
  }

  static logError(error: AppError, context?: string): void {
    // 개발/운영 환경에서 에러 로깅
    console.error(`[${error.code}] ${context || 'Unknown context'}:`, {
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    })

    // 운영 환경에서는 Sentry 등 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentry.captureException(error)
    }
  }
}

// 에러 타입별 사용자 메시지 매핑
export const ERROR_MESSAGES = {
  EMAIL_DUPLICATE: '이미 사용 중인 이메일 주소입니다. 다른 이메일을 사용해주세요.',
  USER_ID_DUPLICATE: '이미 사용 중인 아이디입니다. 다른 아이디를 사용해주세요.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  UNAUTHORIZED: '로그인이 필요하거나 접근 권한이 없습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인하고 다시 시도해주세요.',
  VALIDATION_ERROR: '입력한 정보를 다시 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
} as const

// 재시도 가능한 에러인지 확인
export function isRetryableError(error: AppError): boolean {
  return ['NETWORK_ERROR', 'SERVER_ERROR'].includes(error.code)
}