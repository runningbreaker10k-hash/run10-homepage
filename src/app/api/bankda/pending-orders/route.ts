import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 뱅크다A 미확인주문리스트 API
 *
 * 뱅크다A가 입금 매칭을 위해 입금확인 전 주문건을 조회하는 API
 *
 * Request: GET
 *
 * Response:
 * {
 *   "orders": [
 *     {
 *       "order_id": "주문번호",
 *       "buyer_name": "주문자 이름",
 *       "billing_name": "입금자명",
 *       "bank_account_no": "계좌번호",
 *       "bank_code_name": "은행 은행명",
 *       "order_price_amount": 주문가격,
 *       "order_date": "2025-12-09 17:59:01",
 *       "items": [
 *         { "product_name": "품목 이름" }
 *       ]
 *     }
 *   ]
 * }
 */

interface BankdaOrder {
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

// 공통 로직 함수
async function getPendingOrders() {
  // 1. payment_status='pending'인 신청 조회 (participation_groups를 통해 competitions 조인)
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      name,
      depositor_name,
      entry_fee,
      created_at,
      participation_groups (
        name,
        distance,
        competitions (
          title
        )
      )
    `)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[뱅크다A] 미확인 주문 조회 오류:', error)
    throw error
  }

  // 2. 뱅크다A 형식으로 변환
  const orders: BankdaOrder[] = registrations.map((registration: any) => {
    // 날짜 형식 변환 (2025-12-09T17:59:01+09:00 → 2025-12-09 17:59:01)
    const orderDate = new Date(registration.created_at)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')

    // 품목명 생성 (대회명 + 참가종목)
    const competitionTitle = registration.participation_groups?.competitions?.title || '대회'
    const groupName = registration.participation_groups?.name || '일반부'
    const productName = `${competitionTitle} ${groupName}`

    return {
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
  })

  console.log(`[뱅크다A] 미확인 주문 ${orders.length}건 조회 완료`)
  return orders
}

// GET 요청 처리 (뱅크다A 호출)
export async function GET() {
  try {
    const orders = await getPendingOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[뱅크다A] 미확인주문리스트 API 오류:', error)
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

// POST 요청 처리 (뱅크다A 호출 - GET과 동일한 동작)
export async function POST() {
  try {
    const orders = await getPendingOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[뱅크다A] 미확인주문리스트 API 오류:', error)
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
