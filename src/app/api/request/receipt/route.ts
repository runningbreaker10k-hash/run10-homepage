import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { user_id, registration_id, competition_id, name, phone, amount, distance, receipt_type, business_number } = await request.json()

    // 필수 필드 검증
    if (!user_id || !registration_id || !competition_id || !name || !amount || !distance) {
      return NextResponse.json(
        { success: false, error: '모든 항목을 입력해주세요' },
        { status: 400 }
      )
    }

    const type = receipt_type || 'personal'
    if (type === 'personal' && !phone) {
      return NextResponse.json(
        { success: false, error: '연락처를 입력해주세요' },
        { status: 400 }
      )
    }
    if (type === 'business' && !business_number) {
      return NextResponse.json(
        { success: false, error: '사업자번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 해당 대회에 이미 요청했는지 확인
    const { data: existing } = await supabase
      .from('receipt_requests')
      .select('id')
      .eq('user_id', user_id)
      .eq('competition_id', competition_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 해당 대회의 현금영수증을 요청하셨습니다' },
        { status: 409 }
      )
    }

    // 현금영수증 요청 저장
    const { error } = await supabase
      .from('receipt_requests')
      .insert({
        user_id,
        registration_id,
        competition_id,
        name,
        phone: phone || '',
        amount: parseInt(amount),
        distance,
        status: 'pending',
        receipt_type: type,
        business_number: business_number || ''
      })

    if (error) {
      console.error('현금영수증 요청 저장 실패:', error)
      return NextResponse.json(
        { success: false, error: '요청 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '현금영수증 요청이 완료되었습니다'
    })

  } catch (error) {
    console.error('현금영수증 요청 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
