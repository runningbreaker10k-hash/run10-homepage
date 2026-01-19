import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentConfirmAlimtalk } from '@/lib/ppurio';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 날짜 형식 변환 함수 (예: 2026-02-28T09:00 → 2026년 2월 28일 09:00)
function formatEventDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'yyyy년 M월 d일 HH:mm', { locale: ko });
  } catch {
    return dateString; // 변환 실패시 원본 반환
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, name, eventDate, location, distance, fee } = await request.json();

    // 필수 필드 검증
    if (!phone || !name || !eventDate || !location || !distance || !fee) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 기능 활성화 여부 확인
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('enabled')
      .eq('feature_name', 'payment_confirm')
      .single();

    if (!settings?.enabled) {
      return NextResponse.json(
        { success: true, message: '입금 확인 완료 알림톡 기능이 비활성화되어 있습니다' },
        { status: 200 }
      );
    }

    // 날짜 형식 변환
    const formattedDate = formatEventDate(eventDate);

    // 알림톡 발송
    await sendPaymentConfirmAlimtalk(
      phone,
      name,
      formattedDate,
      location,
      distance,
      fee
    );

    return NextResponse.json({
      success: true,
      message: '입금 확인 완료 알림톡이 발송되었습니다'
    });

  } catch (error) {
    console.error('입금 확인 완료 알림톡 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림톡 발송에 실패했습니다' },
      { status: 500 }
    );
  }
}
