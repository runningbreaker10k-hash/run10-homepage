// 뿌리오 API 유틸리티

const PPURIO_BASE_URL = 'https://message.ppurio.com';

interface PpurioTokenResponse {
  token: string;
  expires_in: number;
}

interface PpurioSMSResponse {
  status: string;
  messageKey?: string;
  message?: string;
}

/**
 * 뿌리오 액세스 토큰 발급 (24시간 유효)
 */
async function getAccessToken(): Promise<string> {
  const account = process.env.PPURIO_ACCOUNT;
  const apiKey = process.env.PPURIO_API_KEY;

  if (!account || !apiKey) {
    console.error('환경 변수 누락:', { account: !!account, apiKey: !!apiKey });
    throw new Error('뿌리오 환경 변수가 설정되지 않았습니다');
  }

  console.log('토큰 발급 시도:', { account, apiKeyLength: apiKey.length });

  const credentials = `${account}:${apiKey}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');

  const response = await fetch(`${PPURIO_BASE_URL}/v1/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('토큰 발급 실패 응답:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`토큰 발급 실패: ${response.statusText} - ${errorText}`);
  }

  const data: PpurioTokenResponse = await response.json();
  console.log('토큰 발급 성공');
  return data.token;
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

  // 토큰 발급
  const token = await getAccessToken();

  // 알림톡 발송
  const response = await fetch(`${PPURIO_BASE_URL}/v1/kakao`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('알림톡 발송 실패:', errorText);
    throw new Error(`알림톡 발송 실패: ${errorText}`);
  }

  const result = await response.json();
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

  // 토큰 발급
  const token = await getAccessToken();

  // 알림톡 발송
  const response = await fetch(`${PPURIO_BASE_URL}/v1/kakao`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account,
      messageType: 'ali',  // 이미지형 알림톡
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('회원가입 완료 알림톡 발송 실패:', errorText);
    throw new Error(`알림톡 발송 실패: ${errorText}`);
  }

  const result = await response.json();
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

  // 토큰 발급
  const token = await getAccessToken();

  // 알림톡 발송
  const response = await fetch(`${PPURIO_BASE_URL}/v1/kakao`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account,
      messageType: 'ali',  // 이미지형 알림톡
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('대회 신청 완료 알림톡 발송 실패:', errorText);
    throw new Error(`알림톡 발송 실패: ${errorText}`);
  }

  const result = await response.json();
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

  // 토큰 발급
  const token = await getAccessToken();

  // 알림톡 발송
  const response = await fetch(`${PPURIO_BASE_URL}/v1/kakao`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account,
      messageType: 'ali',  // 이미지형 알림톡
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('입금 확인 완료 알림톡 발송 실패:', errorText);
    throw new Error(`알림톡 발송 실패: ${errorText}`);
  }

  const result = await response.json();
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

  // 토큰 발급
  const token = await getAccessToken();

  // 알림톡 발송
  const response = await fetch(`${PPURIO_BASE_URL}/v1/kakao`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`알림톡 발송 실패: ${errorText}`);
  }

  return await response.json();
}
