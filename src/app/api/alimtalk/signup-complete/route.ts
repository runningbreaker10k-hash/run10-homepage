import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendSignupCompleteAlimtalk } from '@/lib/ppurio';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, userId, grade } = await request.json();

    // 입력값 검증
    if (!phone || !name || !userId || !grade) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 기능 활성화 여부 확인
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('enabled')
      .eq('feature_name', 'signup_complete')
      .single();

    if (!settings?.enabled) {
      return NextResponse.json(
        { success: true, message: '회원가입 완료 알림톡 기능이 비활성화되어 있습니다' },
        { status: 200 }
      );
    }

    // 알림톡 발송
    try {
      await sendSignupCompleteAlimtalk(phone, name, userId, grade);
    } catch (error) {
      console.error('회원가입 완료 알림톡 발송 실패:', error);
      return NextResponse.json(
        { success: false, error: '알림톡 발송에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '회원가입 완료 알림톡이 발송되었습니다',
    });
  } catch (error) {
    console.error('회원가입 완료 알림톡 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
