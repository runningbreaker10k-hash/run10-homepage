import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendPaymentConfirmAlimtalk } from '@/lib/ppurio'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const maxDuration = 60

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

    // 3. 알림톡 설정 1회 확인 (루프 밖)
    const { data: smsSettings } = await supabase
      .from('sms_settings')
      .select('enabled')
      .eq('feature_name', 'payment_confirm')
      .single()

    // 4. 각 order_id DB 업데이트 (순차 처리)
    const orderResults: OrderResult[] = []
    let hasError = false

    interface AlimtalkTarget {
      phone: string
      name: string
      eventDate: string
      location: string
      distance: string
      fee: string
    }
    const alimtalkTargets: AlimtalkTarget[] = []

    for (const item of body.requests) {
      const orderId = item.order_id

      try {
        // 4-1. 주문 조회 (대회 정보 포함)
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
          orderResults.push({ order_id: orderId, description: '존재하지 않는 주문' })
          hasError = true
          continue
        }

        // 4-2. payment_status 확인
        if (registration.payment_status !== 'pending') {
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

        // 4-3. payment_status를 'confirmed'로 업데이트
        const { error: updateError } = await supabase
          .from('registrations')
          .update({ payment_status: 'confirmed' })
          .eq('id', orderId)

        if (updateError) {
          console.error('입금 확인 업데이트 오류:', updateError)
          orderResults.push({ order_id: orderId, description: '업데이트 실패' })
          hasError = true
          continue
        }

        orderResults.push({ order_id: orderId, description: '성공' })
        console.log(`[뱅크다A] 입금 확인 완료: ${registration.name} (${orderId}), 금액: ${registration.entry_fee}원`)

        // 4-4. 알림톡 대상 수집 (활성화된 경우에만)
        if (smsSettings?.enabled && registration.phone) {
          const group = Array.isArray(registration.participation_groups)
            ? registration.participation_groups[0]
            : registration.participation_groups
          const competition = group?.competitions
          const comp = Array.isArray(competition) ? competition[0] : competition

          if (comp) {
            const eventDate = format(new Date(comp.date), 'yyyy년 M월 d일 HH:mm', { locale: ko })
            const distance = group?.distance || registration.distance || ''
            alimtalkTargets.push({
              phone: registration.phone,
              name: registration.name,
              eventDate,
              location: comp.location,
              distance,
              fee: registration.entry_fee.toLocaleString()
            })
          }
        }

      } catch (error) {
        console.error(`주문 처리 오류 (${orderId}):`, error)
        orderResults.push({ order_id: orderId, description: '처리 중 오류 발생' })
        hasError = true
      }
    }

    // 5. 알림톡 병렬 발송 (Promise.allSettled - 1명 실패해도 나머지 진행)
    if (alimtalkTargets.length > 0) {
      const results = await Promise.allSettled(
        alimtalkTargets.map(t =>
          sendPaymentConfirmAlimtalk(t.phone, t.name, t.eventDate, t.location, t.distance, t.fee)
        )
      )
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          console.log(`[뱅크다A] 알림톡 발송 성공: ${alimtalkTargets[i].name}`)
        } else {
          console.error(`[뱅크다A] 알림톡 발송 실패: ${alimtalkTargets[i].name}`, result.reason)
        }
      })
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
