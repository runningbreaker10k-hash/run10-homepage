import { NextRequest, NextResponse } from 'next/server';
import { sendCompetitionRegistrationAlimtalk } from '@/lib/ppurio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { phone, name, competitionName, distance, fee, bankAccount, accountHolder, depositorName } = await request.json();

    // 필수 필드 검증
    if (!phone || !name || !competitionName || !distance || !fee || !bankAccount || !accountHolder || !depositorName) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 기능 활성화 여부 확인
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('enabled')
      .eq('feature_name', 'competition_registration')
      .single();

    if (!settings?.enabled) {
      return NextResponse.json(
        { success: true, message: '대회 신청 완료 알림톡 기능이 비활성화되어 있습니다' },
        { status: 200 }
      );
    }

    // 알림톡 발송
    await sendCompetitionRegistrationAlimtalk(
      phone,
      name,
      competitionName,
      distance,
      fee,
      bankAccount,
      accountHolder,
      depositorName
    );

    return NextResponse.json({
      success: true,
      message: '대회 신청 완료 알림톡이 발송되었습니다'
    });

  } catch (error) {
    console.error('대회 신청 완료 알림톡 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림톡 발송에 실패했습니다' },
      { status: 500 }
    );
  }
}
