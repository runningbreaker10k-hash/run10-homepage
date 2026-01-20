// 뿌리오 API 유틸리티 (GAS 프록시 사용)

interface PpurioSMSResponse {
  status: string;
  messageKey?: string;
  message?: string;
}

interface GASProxyResponse {
  success: boolean;
  detected_google_ip?: string;
  ppurio_response?: any;
  error?: string;
}

/**
 * GAS(Google Apps Script) 프록시를 통해 뿌리오 API 호출
 * API Key는 GAS 스크립트에 저장되어 있으므로 클라이언트에서 전송하지 않음
 */
async function callPpurioProxy(
  endpoint: string,
  body?: any
): Promise<any> {
  const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL;

  if (!proxyUrl) {
    throw new Error('NEXT_PUBLIC_PROXY_URL 환경 변수가 설정되지 않았습니다');
  }

  console.log('GAS 프록시를 통해 뿌리오 API 호출:', endpoint);

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint,
      body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('프록시 호출 실패:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`프록시 호출 실패: ${response.statusText} - ${errorText}`);
  }

  const gasResponse: GASProxyResponse = await response.json();

  // detected_google_ip 값을 크게 로그에 출력 (뿌리오 IP 등록용)
  if (gasResponse.detected_google_ip) {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   🌐 GAS DETECTED IP (뿌리오에 등록 필요!)                 ║');
    console.log('║                                                            ║');
    console.log(`║   IP: ${gasResponse.detected_google_ip.padEnd(50)}║`);
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  if (!gasResponse.success) {
    console.error('GAS 프록시 에러:', gasResponse.error);
    throw new Error(`GAS 프록시 에러: ${gasResponse.error}`);
  }

  return gasResponse.ppurio_response;
}

/**
 * 카카오 알림톡 인증번호 발송
 */
export async function sendVerificationSMS(
  phone: string,
  code: string
): Promise<PpurioSMSResponse> {
  const account = process.env.PPURIO_ACCOUNT;
  const senderProfile = process.env.PPURIO_SENDER_PROFILE;
  const templateCode = 'ppur_2026011318030212849222979';

  if (!account || !senderProfile) {
    throw new Error('뿌리오 환경 변수가 설정되지 않았습니다');
  }

  console.log('알림톡 발송 시도:', { phone, senderProfile });

  // 하이픈 제거
  const cleanPhone = phone.replace(/-/g, '');

  // 알림톡 발송 요청
  const requestBody = {
    account,
    messageType: 'alt',
    senderProfile,
    templateCode,
    duplicateFlag: 'Y',
    isResend: 'N',
    targetCount: 1,
    targets: [
      {
        to: cleanPhone,
        name: '고객',
        changeWord: {
          'var1': code,
        },
      },
    ],
    refKey: `verify_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  };

  const result = await callPpurioProxy('/v1/kakao', requestBody);
  console.log('알림톡 발송 성공:', result);
  return result;
}

/**
 * 회원가입 완료 알림톡 발송
 */
export async function sendSignupCompleteAlimtalk(
  phone: string,
  name: string,
  userId: string,
  grade: string
): Promise<PpurioSMSResponse> {
  const account = process.env.PPURIO_ACCOUNT;
  const senderProfile = process.env.PPURIO_SENDER_PROFILE;
  const templateCode = 'ppur_2026011515211520835256389';

  if (!account || !senderProfile) {
    throw new Error('뿌리오 환경 변수가 설정되지 않았습니다');
  }

  console.log('회원가입 완료 알림톡 발송 시도:', { phone, name, userId, grade });

  // 등급 변환
  const gradeLabels: Record<string, string> = {
    'cheetah': '치타',
    'horse': '말',
    'wolf': '늑대',
    'turtle': '거북',
    'bolt': '볼트'
  };
  const gradeName = gradeLabels[grade] || grade;

  // 하이픈 제거
  const cleanPhone = phone.replace(/-/g, '');

  // 알림톡 발송 요청
  const requestBody = {
    account,
    messageType: 'ali',
    senderProfile,
    templateCode,
    duplicateFlag: 'Y',
    isResend: 'N',
    targetCount: 1,
    targets: [
      {
        to: cleanPhone,
        name: '고객',
        changeWord: {
          'var1': name,
          'var2': userId,
          'var3': gradeName,
        },
      },
    ],
    refKey: `signup_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  };

  const result = await callPpurioProxy('/v1/kakao', requestBody);
  console.log('회원가입 완료 알림톡 발송 성공:', result);
  return result;
}

/**
 * 대회 신청 완료 알림톡 발송
 */
export async function sendCompetitionRegistrationAlimtalk(
  phone: string,
  name: string,
  competitionName: string,
  distance: string,
  fee: string,
  bankAccount: string,
  accountHolder: string,
  depositorName: string
): Promise<PpurioSMSResponse> {
  const account = process.env.PPURIO_ACCOUNT;
  const senderProfile = process.env.PPURIO_SENDER_PROFILE;
  const templateCode = 'ppur_2026011417275620835570482';

  if (!account || !senderProfile) {
    throw new Error('뿌리오 환경 변수가 설정되지 않았습니다');
  }

  console.log('대회 신청 완료 알림톡 발송 시도:', { phone, name, competitionName });

  // 하이픈 제거
  const cleanPhone = phone.replace(/-/g, '');

  // 알림톡 발송 요청
  const requestBody = {
    account,
    messageType: 'ali',
    senderProfile,
    templateCode,
    duplicateFlag: 'Y',
    isResend: 'N',
    targetCount: 1,
    targets: [
      {
        to: cleanPhone,
        name: '고객',
        changeWord: {
          'var1': name,
          'var2': competitionName,
          'var3': distance,
          'var4': fee,
          'var5': bankAccount,
          'var6': accountHolder,
          'var7': depositorName,
        },
      },
    ],
    refKey: `comp_${Date.now()}`,
  };

  const result = await callPpurioProxy('/v1/kakao', requestBody);
  console.log('대회 신청 완료 알림톡 발송 성공:', result);
  return result;
}

/**
 * 입금 확인 완료 알림톡 발송
 */
export async function sendPaymentConfirmAlimtalk(
  phone: string,
  name: string,
  eventDate: string,
  location: string,
  distance: string,
  fee: string
): Promise<PpurioSMSResponse> {
  const account = process.env.PPURIO_ACCOUNT;
  const senderProfile = process.env.PPURIO_SENDER_PROFILE;
  const templateCode = 'ppur_2026011417282512849609021';

  if (!account || !senderProfile) {
    throw new Error('뿌리오 환경 변수가 설정되지 않았습니다');
  }

  console.log('입금 확인 완료 알림톡 발송 시도:', { phone, name, eventDate });

  // 하이픈 제거
  const cleanPhone = phone.replace(/-/g, '');

  // 알림톡 발송 요청
  const requestBody = {
    account,
    messageType: 'ali',
    senderProfile,
    templateCode,
    duplicateFlag: 'Y',
    isResend: 'N',
    targetCount: 1,
    targets: [
      {
        to: cleanPhone,
        name: '고객',
        changeWord: {
          'var1': name,
          'var2': eventDate,
          'var3': location,
          'var4': distance,
          'var5': fee,
        },
      },
    ],
    refKey: `pay_${Date.now()}`,
  };

  const result = await callPpurioProxy('/v1/kakao', requestBody);
  console.log('입금 확인 완료 알림톡 발송 성공:', result);
  return result;
}

/**
 * 카카오 알림톡 발송 (범용)
 */
export async function sendKakaoAlimtalk(
  phone: string,
  templateCode: string,
  variables: Record<string, string>
): Promise<PpurioSMSResponse> {
  const account = process.env.PPURIO_ACCOUNT;
  const senderProfile = process.env.PPURIO_SENDER_PROFILE;

  if (!account || !senderProfile) {
    throw new Error('뿌리오 환경 변수가 설정되지 않았습니다');
  }

  // 하이픈 제거
  const cleanPhone = phone.replace(/-/g, '');

  // 알림톡 발송 요청
  const requestBody = {
    account,
    messageType: 'alt',
    senderProfile,
    templateCode,
    duplicateFlag: 'Y',
    isResend: 'N',
    targetCount: 1,
    targets: [
      {
        to: cleanPhone,
        name: '고객',
        changeWord: variables,
      },
    ],
    refKey: `alimtalk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
  };

  const result = await callPpurioProxy('/v1/kakao', requestBody);
  return result;
}
