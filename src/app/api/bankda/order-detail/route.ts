import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 뱅크다A 주문상세 API
 *
 * 뱅크다A가 주문 1건에 대한 상세 정보를 조회하는 API
 *
 * Request:
 * {
 *   "order_id": "주문번호"
 * }
 *
 * Response:
 * {
 *   "order": {
 *     "order_id": "주문번호",
 *     "buyer_name": "주문자 이름",
 *     "billing_name": "입금자명",
 *     "bank_account_no": "계좌번호",
 *     "bank_code_name": "은행 은행명",
 *     "order_price_amount": 주문가격,
 *     "order_date": "2025-12-09 17:59:01",
 *     "items": [
 *       { "product_name": "품목 이름" }
 *     ]
 *   }
 * }
 */

interface BankdaOrderDetail {
  order_id: string
  buyer_name: string
  billing_name: string
  bank_account_no: string
  bank_code_name: string
  order_price_amount: number
  order_date: string
  items: Array<{
    product_name: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    // 1. JSON 파싱
    let body: { order_id: string }
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          return_code: 400,
          description: '요청 format 오류'
        },
        { status: 400 }
      )
    }

    // 2. order_id 필드 확인
    if (!body.order_id) {
      return NextResponse.json(
        {
          return_code: 400,
          description: '요청 format 오류'
        },
        { status: 400 }
      )
    }

    const orderId = body.order_id

    // 3. 주문 조회 (participation_groups와 competitions 조인)
    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        id,
        name,
        depositor_name,
        entry_fee,
        created_at,
        payment_status,
        participation_groups (
          name,
          distance,
          competition_id
        ),
        competitions (
          title
        )
      `)
      .eq('id', orderId)
      .single()

    if (error || !registration) {
      console.error('[뱅크다A] 주문 조회 오류:', error)
      return NextResponse.json(
        {
          return_code: 415,
          description: '존재하지 않는 주문번호'
        },
        { status: 415 }
      )
    }

    // 4. 날짜 형식 변환 (2025-12-09T17:59:01+09:00 → 2025-12-09 17:59:01)
    const orderDate = new Date(registration.created_at)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')

    // 5. 품목명 생성 (대회명 + 참가종목)
    const competitionTitle = registration.competitions?.title || '대회'
    const groupName = registration.participation_groups?.name || '일반부'
    const productName = `${competitionTitle} ${groupName}`

    // 6. 응답 데이터 생성
    const orderDetail: BankdaOrderDetail = {
      order_id: registration.id,
      buyer_name: registration.name,
      billing_name: registration.depositor_name,
      bank_account_no: '73491000872504', // 하나은행 734-910008-72504 (하이픈 제거)
      bank_code_name: '하나은행',
      order_price_amount: registration.entry_fee,
      order_date: orderDate,
      items: [
        {
          product_name: productName
        }
      ]
    }

    // 7. 로그 출력
    console.log(`[뱅크다A] 주문 상세 조회: ${registration.name} (${orderId})`)

    // 8. 응답 반환
    return NextResponse.json({
      order: orderDetail
    })

  } catch (error) {
    console.error('[뱅크다A] 주문상세 API 오류:', error)
    return NextResponse.json(
      {
        return_code: 500,
        description: '서버 오류'
      },
      { status: 500 }
    )
  }
}

// GET 요청 처리 (테스트용)
export async function GET() {
  return NextResponse.json({
    service: '뱅크다A 주문상세',
    status: 'active',
    endpoint: '/api/bankda/order-detail',
    method: 'POST',
    description: 'POST 요청으로 order_id를 보내주세요'
  })
}
