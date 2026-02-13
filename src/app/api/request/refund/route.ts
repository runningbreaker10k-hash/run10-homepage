import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, registration_id, competition_id, name, phone, amount, distance, bank_name, account_number, account_holder } = await request.json()

    // 필수 필드 검증
    if (!user_id || !registration_id || !competition_id || !name || !phone || !amount || !distance || !bank_name || !account_number || !account_holder) {
      return NextResponse.json(
        { success: false, error: '모든 항목을 입력해주세요' },
        { status: 400 }
      )
    }

    // 해당 신청(registration)에 이미 환불 요청했는지 확인
    const { data: existing } = await supabase
      .from('refund_requests')
      .select('id')
      .eq('registration_id', registration_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 해당 신청의 환불을 요청하셨습니다' },
        { status: 409 }
      )
    }

    // 환불 요청 저장
    const { error } = await supabase
      .from('refund_requests')
      .insert({
        user_id,
        registration_id,
        competition_id,
        name,
        phone,
        amount: parseInt(amount),
        distance,
        bank_name,
        account_number,
        account_holder,
        status: 'pending'
      })

    if (error) {
      console.error('환불 요청 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: '요청 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    // 환불 요청 시 해당 대회의 현금영수증 신청 내역 삭제
    try {
      await supabase
        .from('receipt_requests')
        .delete()
        .eq('user_id', user_id)
        .eq('competition_id', competition_id)
    } catch (receiptError) {
      console.warn('현금영수증 삭제 처리 중 오류 (무시함):', receiptError)
      // 현금영수증 삭제 실패해도 환불 요청은 성공한 것으로 처리
    }

    return NextResponse.json({
      success: true,
      message: '환불 요청이 완료되었습니다'
    })

  } catch (error) {
    console.error('환불 요청 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
