export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">개인정보처리방침</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            RUN10(런텐) 개인정보처리방침
          </p>
        </div>
      </section>

      {/* 개인정보처리방침 내용 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8 text-sm text-gray-600">
            </div>

            <div className="prose max-w-none">
              <div className="mb-8 p-4 bg-red-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  (주)러닝브레이커(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 
                  개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 개인정보처리방침을 두고 있습니다.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제1조 (개인정보의 처리 목적)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li><strong>대회 참가 신청 및 관리</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-sm">
                      <li>대회 참가 자격 확인, 참가비 결제 처리</li>
                      <li>대회 관련 안내사항 전달</li>
                      <li>참가자 명단 관리 및 기록 관리</li>
                    </ul>
                  </li>
                  <li><strong>서비스 제공 및 운영</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-sm">
                      <li>웹사이트 서비스 제공 및 운영</li>
                      <li>회원제 서비스 이용에 따른 본인확인</li>
                      <li>서비스 이용 관련 필수 공지사항 전달 (카카오톡 채널 알림톡, 문자메시지, 이메일 등)</li>
                      <li>고객상담 및 불만처리</li>
                    </ul>
                  </li>
                  <li><strong>마케팅 및 광고</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-sm">
                      <li>신규 대회 및 서비스 안내</li>
                      <li>이벤트 및 광고성 정보 전달</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제2조 (개인정보의 처리 및 보유기간)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                  <li>각각의 개인정보 처리 및 보유기간은 다음과 같습니다:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                      <li><strong>대회 참가 신청 정보</strong>: 대회 종료 후 3년</li>
                      <li><strong>결제 정보</strong>: 전자상거래법에 따라 5년</li>
                      <li><strong>웹사이트 이용 기록</strong>: 통신비밀보호법에 따라 3개월</li>
                      <li><strong>불만 또는 분쟁 처리 기록</strong>: 소비자보호법에 따라 3년</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제3조 (처리하는 개인정보의 항목)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">1. 대회 참가 신청</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li>필수항목: 성명, 생년월일, 성별, 전화번호, 이메일주소, 주소, 입금자명</li>
                      <li>선택항목: 소속팀, 목표기록</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">2. 결제 정보</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li>무통장입금 정보 (입금자명, 입금금액, 입금일시)</li>
                      <li>하나은행 734-910008-72504 (주식회사 러닝브레이커)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">3. 자동 수집 정보</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li>IP주소, 쿠키, 방문일시, 서비스 이용기록</li>
                      <li>브라우저 종류, OS 정보</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제4조 (개인정보의 제3자 제공)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 정보주체의 사전 동의 없이는 동 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</li>
                  <li>다만, 다음의 경우에는 예외로 합니다:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>정보주체가 사전에 동의한 경우</li>
                      <li>법률에 특별한 규정이 있는 경우</li>
                      <li>정보주체 또는 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>개인정보 처리현황 통지 요구</li>
                  <li>개인정보 열람 요구</li>
                  <li>개인정보 정정·삭제 요구</li>
                  <li>개인정보 처리정지 요구</li>
                </ol>
                <p className="mt-4">위의 권리 행사는 회사에 대해 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.</p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제6조 (개인정보의 안전성 확보조치)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li><strong>관리적 조치</strong>: 개인정보 취급자의 최소화 및 교육</li>
                  <li><strong>기술적 조치</strong>: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                  <li><strong>물리적 조치</strong>: 전산실, 자료보관실 등의 접근통제</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제7조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
                  <li>쿠키는 웹사이트를 운영하는데 이용되는 서버(HTTP)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자의 PC 컴퓨터 내의 하드디스크에 저장되기도 합니다.</li>
                  <li>쿠키 설치 거부 방법: 웹브라우저 상단의 도구 → 인터넷 옵션 → 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제7조의2 (서비스 관련 필수 정보의 전송)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 회원에게 서비스 이용과 관련된 다음의 필수 정보를 카카오톡 채널 알림톡, 문자메시지(SMS/LMS), 이메일 등의 방법으로 전송할 수 있습니다:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>회원 본인이 참가 신청한 대회의 필수 안내사항 (일정, 장소, 변경사항 등)</li>
                      <li>결제 및 환불 처리 안내</li>
                      <li>본인이 작성한 글 또는 댓글에 대한 답변 알림</li>
                      <li>이용약관 또는 개인정보처리방침 변경 공지</li>
                      <li>서비스 점검, 장애, 중단 등 운영 관련 공지</li>
                      <li>보안 관련 중요 공지</li>
                      <li>회원 문의사항에 대한 답변</li>
                      <li>기타 법령에서 정한 의무적 통지사항</li>
                    </ul>
                  </li>
                  <li>위 정보는 회원의 권익 보호 및 서비스 정상 이용을 위한 필수 사항으로, 별도의 수신 동의 없이 전송됩니다.</li>
                  <li>위 정보는 광고성 정보가 아니므로 수신 거부가 불가능하며, 수신 거부 시 서비스 이용에 불편이 발생할 수 있습니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제8조 (개인정보 보호책임자)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">개인정보 보호책임자</h4>
                  <ul className="space-y-1 text-sm">
                    <li>직책: 개인정보보호팀장</li>
                    <li>전화번호: 042-710-2058</li>
                    <li>이메일: runningbreaker10k@gmail.com</li>
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제9조 (개인정보 처리방침 변경)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</li>
                  <li>본 방침은 2024년 9월 12일부터 시행됩니다.</li>
                </ol>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">문의처</h3>
                <div className="text-gray-700">
                  <p>런텐(RUN10)</p>
                  <p>주소: 대전광역시 대덕구 비래서로9 2층</p>
                  <p>전화: 042-710-2058</p>
                  <p>이메일: runningbreaker10k@gmail.com</p>
                  <p>운영시간: 평일 11:00 - 16:00 (주말 및 공휴일 휴무)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}