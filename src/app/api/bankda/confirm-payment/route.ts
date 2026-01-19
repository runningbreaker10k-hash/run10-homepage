import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendPaymentConfirmAlimtalk } from '@/lib/ppurio'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 뱅크다A 자동 입금 확인 API
 *
 * 뱅크다A가 입금 매칭 후 호출하는 Webhook 엔드포인트
 *
 * Request:
 * {
 *   "requests": [
 *     { "order_id": "주문번호1" },
 *     { "order_id": "주문번호2" }
 *   ]
 * }
 *
 * Response:
 * {
 *   "return_code": 200,
 *   "description": "정상",
 *   "orders": [
 *     { "order_id": "주문번호1", "description": "성공" },
 *     { "order_id": "주문번호2", "description": "성공" }
 *   ]
 * }
 */

interface BankdaRequest {
  requests: Array<{
    order_id: string
  }>
}

interface OrderResult {
  order_id: string
  description: string
}

// 공통 처리 로직
async function handleConfirmPayment(request: NextRequest) {
  try {
    // 1. JSON 파싱
    let body: BankdaRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          return_code: 400,
          description: '요청 format 오류',
          orders: []
        },
        { status: 400 }
      )
    }

    // 2. requests 필드 확인
    if (!body.requests || !Array.isArray(body.requests)) {
      return NextResponse.json(
        {
          return_code: 400,
          description: '요청 format 오류',
          orders: []
        },
        { status: 400 }
      )
    }

    // 3. 각 order_id 처리
    const orderResults: OrderResult[] = []
    let hasError = false

    for (const item of body.requests) {
      const orderId = item.order_id

      try {
        // 3-1. 주문 조회 (대회 정보 포함)
        const { data: registration, error: selectError } = await supabase
          .from('registrations')
          .select(`
            id,
            payment_status,
            name,
            phone,
            entry_fee,
            distance,
            participation_groups (
              name,
              distance,
              competitions (
                title,
                date,
                location
              )
            )
          `)
          .eq('id', orderId)
          .single()

        if (selectError || !registration) {
          // 존재하지 않는 주문번호
          orderResults.push({
            order_id: orderId,
            description: '존재하지 않는 주문'
          })
          hasError = true
          continue
        }

        // 3-2. payment_status 확인
        if (registration.payment_status !== 'pending') {
          // 이미 입금확인되었거나 취소된 경우
          orderResults.push({
            order_id: orderId,
            description: `입금대기 상태가 아님 (현재: ${
              registration.payment_status === 'confirmed' ? '입금확인' :
              registration.payment_status === 'cancelled' ? '취소' : registration.payment_status
            })`
          })
          hasError = true
          continue
        }

        // 3-3. payment_status를 'confirmed'로 업데이트
        const { error: updateError } = await supabase
          .from('registrations')
          .update({ payment_status: 'confirmed' })
          .eq('id', orderId)

        if (updateError) {
          console.error('입금 확인 업데이트 오류:', updateError)
          orderResults.push({
            order_id: orderId,
            description: '업데이트 실패'
          })
          hasError = true
          continue
        }

        // 3-4. 성공
        orderResults.push({
          order_id: orderId,
          description: '성공'
        })

        // 로그 출력 (Vercel 로그에서 확인 가능)
        console.log(`[뱅크다A] 입금 확인 완료: ${registration.name} (${orderId}), 금액: ${registration.entry_fee}원`)

        // 3-5. 입금 확인 완료 알림톡 발송 (설정이 활성화된 경우에만)
        try {
          // 알림톡 설정 확인
          const { data: smsSettings } = await supabase
            .from('sms_settings')
            .select('enabled')
            .eq('feature_name', 'payment_confirm')
            .single()

          if (smsSettings?.enabled) {
            const competition = registration.participation_groups?.competitions
            if (competition && registration.phone) {
              // 날짜 형식 변환 (예: 2025년 3월 15일 09:00)
              const eventDate = format(new Date(competition.date), 'yyyy년 M월 d일 HH:mm', { locale: ko })
              const distance = registration.participation_groups?.distance || registration.distance || ''

              await sendPaymentConfirmAlimtalk(
                registration.phone,
                registration.name,
                eventDate,
                competition.location,
                distance,
                registration.entry_fee.toLocaleString()
              )
              console.log(`[뱅크다A] 입금 확인 알림톡 발송 성공: ${registration.name}`)
            }
          } else {
            console.log(`[뱅크다A] 입금 확인 알림톡 비활성화 상태: ${registration.name}`)
          }
        } catch (alimtalkError) {
          // 알림톡 발송 실패해도 입금 확인은 성공으로 처리
          console.error(`[뱅크다A] 입금 확인 알림톡 발송 실패:`, alimtalkError)
        }

      } catch (error) {
        console.error(`주문 처리 오류 (${orderId}):`, error)
        orderResults.push({
          order_id: orderId,
          description: '처리 중 오류 발생'
        })
        hasError = true
      }
    }

    // 4. 응답 반환
    if (hasError) {
      return NextResponse.json({
        return_code: 415,
        description: 'order_id 오류',
        orders: orderResults
      })
    }

    return NextResponse.json({
      return_code: 200,
      description: '정상',
      orders: orderResults
    })

  } catch (error) {
    console.error('[뱅크다A] API 오류:', error)
    return NextResponse.json(
      {
        return_code: 500,
        description: '서버 오류',
        orders: []
      },
      { status: 500 }
    )
  }
}

// POST 요청 처리
export async function POST(request: NextRequest) {
  return handleConfirmPayment(request)
}

// PUT 요청 처리 (뱅크다A가 PUT으로 요청을 보냄)
export async function PUT(request: NextRequest) {
  return handleConfirmPayment(request)
}

// GET 요청 처리 (테스트용)
export async function GET() {
  return NextResponse.json({
    service: '뱅크다A 자동 입금 확인',
    status: 'active',
    endpoint: '/api/bankda/confirm-payment',
    method: 'POST, PUT'
  })
}
