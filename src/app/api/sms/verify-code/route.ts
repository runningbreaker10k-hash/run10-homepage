import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    // 1. 입력값 검증
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: '휴대폰 번호와 인증번호를 입력해주세요' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '인증번호는 6자리 숫자입니다' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/-/g, '');

    // 2. phone_verifications 테이블에서 조회
    const { data: verification, error: selectError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (selectError || !verification) {
      return NextResponse.json(
        { success: false, error: '유효하지 않거나 만료된 인증번호입니다' },
        { status: 400 }
      );
    }

    // 3. verified = true 업데이트
    const { error: updateError } = await supabase
      .from('phone_verifications')
      .update({ verified: true })
      .eq('id', verification.id);

    if (updateError) {
      console.error('인증 상태 업데이트 실패:', updateError);
      return NextResponse.json(
        { success: false, error: '인증 처리에 실패했습니다' },
        { status: 500 }
      );
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      message: '인증이 완료되었습니다',
      verificationToken: verification.id, // 회원가입 시 검증용
    });
  } catch (error) {
    console.error('인증번호 검증 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
