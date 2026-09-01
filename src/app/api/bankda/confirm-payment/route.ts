import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { sendPaymentConfirmAlimtalk } from '@/lib/ppurio'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const maxDuration = 60

interface BankdaRequest {
  requests: Array<{
    order_id: string
  }>
}

interface OrderResult {
  order_id: string
  description: string
}

async function handleConfirmPayment(request: NextRequest) {
  try {
    let body: BankdaRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { return_code: 400, description: '요청 format 오류', orders: [] },
        { status: 400 }
      )
    }

    if (!body.requests || !Array.isArray(body.requests)) {
      return NextResponse.json(
        { return_code: 400, description: '요청 format 오류', orders: [] },
        { status: 400 }
      )
    }

    const orderResults: OrderResult[] = []
    let hasError = false

    for (const item of body.requests) {
      const orderId = item.order_id

      try {
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

        try {
          const { data: smsSettings } = await supabase
            .from('sms_settings')
            .select('enabled')
            .eq('feature_name', 'payment_confirm')
            .single()

          if (smsSettings?.enabled) {
            const group = Array.isArray(registration.participation_groups)
              ? registration.participation_groups[0]
              : registration.participation_groups
            const competition = Array.isArray(group?.competitions)
              ? group.competitions[0]
              : group?.competitions

            if (competition && registration.phone) {
              const eventDate = format(new Date(competition.date), 'yyyy년 M월 d일 HH:mm', { locale: ko })
              const distance = group?.distance || registration.distance || ''

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
          }
        } catch (alimtalkError) {
          console.error(`[뱅크다A] 입금 확인 알림톡 발송 실패:`, alimtalkError)
        }

      } catch (error) {
        console.error(`주문 처리 오류 (${orderId}):`, error)
        orderResults.push({ order_id: orderId, description: '처리 중 오류 발생' })
        hasError = true
      }
    }

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
      { return_code: 500, description: '서버 오류', orders: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handleConfirmPayment(request)
}

export async function PUT(request: NextRequest) {
  return handleConfirmPayment(request)
}

export async function GET() {
  return NextResponse.json({
    service: '뱅크다A 자동 입금 확인',
    status: 'active',
    endpoint: '/api/bankda/confirm-payment',
    method: 'POST, PUT'
  })
}
