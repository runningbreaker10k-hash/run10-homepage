import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendVerificationSMS } from '@/lib/ppurio';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // 1. 휴대폰 번호 유효성 검증
    if (!phone || !/^010-?\d{4}-?\d{4}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: '올바른 휴대폰 번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // 2. SMS 기능 활성화 여부 확인
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('enabled')
      .eq('feature_name', 'phone_verification')
      .single();

    if (!settings?.enabled) {
      return NextResponse.json(
        { success: false, error: '현재 SMS 인증 기능이 비활성화되어 있습니다' },
        { status: 503 }
      );
    }

    // 3. Rate Limiting 확인 (1분에 1회)
    const cleanPhone = phone.replace(/-/g, '');
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('phone_verifications')
      .select('id')
      .eq('phone', cleanPhone)
      .gte('created_at', oneMinuteAgo);

    if (recentAttempts && recentAttempts.length > 0) {
      return NextResponse.json(
        { success: false, error: '1분 후에 다시 시도해주세요' },
        { status: 429 }
      );
    }

    // 5. 6자리 랜덤 인증번호 생성
    const code = crypto.randomInt(100000, 999999).toString();

    // 6. 뿌리오 알림톡 발송
    try {
      await sendVerificationSMS(phone, code);
    } catch (error) {
      console.error('알림톡 발송 실패:', error);
      return NextResponse.json(
        { success: false, error: '알림톡 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 7. phone_verifications 테이블에 저장 (5분 유효)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        phone: cleanPhone,
        code,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error('인증번호 저장 실패:', insertError);
      return NextResponse.json(
        { success: false, error: '인증번호 저장에 실패했습니다' },
        { status: 500 }
      );
    }

    // 8. 성공 응답
    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다',
      expiresIn: 300, // 5분 (초 단위)
    });
  } catch (error) {
    console.error('인증번호 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
