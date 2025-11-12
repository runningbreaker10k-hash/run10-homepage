export default function TermsPage() {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">이용약관</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            RUN10(런텐) 서비스 이용약관
          </p>
        </div>
      </section>

      {/* 이용약관 내용 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8 text-sm text-gray-600">
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">제1조 (목적)</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                본 약관은 (주)러닝브레이커(이하 "회사")이 제공하는 러닝 대회 참가 신청 및 관련 서비스(이하 "서비스")의 이용과 
                관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제2조 (정의)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>"서비스"란 회사가 제공하는 러닝 대회 관련 모든 서비스를 의미합니다.</li>
                  <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 자를 의미합니다.</li>
                  <li>"참가자"란 러닝 대회에 참가 신청을 완료한 이용자를 의미합니다.</li>
                  <li>"대회"란 회사가 주최하거나 주관하는 러닝 행사를 의미합니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제3조 (약관의 효력 및 변경)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.</li>
                  <li>회사는 필요에 따라 본 약관을 변경할 수 있으며, 변경된 약관은 홈페이지에 공지함으로써 효력이 발생합니다.</li>
                  <li>이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제4조 (서비스의 제공)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">회사가 제공하는 서비스는 다음과 같습니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>러닝 대회 정보 제공</li>
                  <li>대회 참가 신청 접수</li>
                  <li>참가자 관리 및 안내</li>
                  <li>대회 결과 발표</li>
                  <li>러닝 관련 정보 및 커뮤니티 서비스</li>
                  <li>서비스 이용 관련 필수 공지사항 전달 (카카오톡 채널 알림톡, 문자메시지, 이메일 등)</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제5조 (참가 신청)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>대회 참가를 원하는 이용자는 회사가 정한 절차에 따라 참가 신청을 해야 합니다.</li>
                  <li>참가 신청 시 제공하는 정보는 사실과 일치해야 하며, 허위 정보로 인한 모든 책임은 이용자에게 있습니다.</li>
                  <li>회사는 다음의 경우 참가 신청을 거절하거나 취소할 수 있습니다:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>허위 정보를 제공한 경우</li>
                      <li>참가 자격을 충족하지 않는 경우</li>
                      <li>참가비를 납부하지 않은 경우</li>
                      <li>기타 대회 운영에 지장을 주는 경우</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제6조 (참가비 및 환불)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>참가비는 대회별로 별도로 정하며, 참가 신청 시 안내됩니다.</li>
                  <li>참가비 납부 완료 시 참가 신청이 확정됩니다.</li>
                  <li>환불 규정:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>대회 접수 마감 전: 참가비 전액 환불</li>
                      <li>대회 접수 마감 후: 환불 불가</li>
                    </ul>
                  </li>
                  <li>회사의 사정으로 대회가 취소되는 경우 참가비 전액을 환불합니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제7조 (참가자의 의무)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <p className="mb-3">참가자는 다음 사항을 준수해야 합니다:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>대회 규칙 및 안전수칙 준수</li>
                  <li>대회 진행요원의 지시사항 이행</li>
                  <li>다른 참가자에 대한 배려 및 예의 준수</li>
                  <li>자신의 건강 상태에 대한 책임</li>
                  <li>대회 중 발생할 수 있는 위험에 대한 인지</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제8조 (회사의 의무)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 안전하고 공정한 대회 운영을 위해 최선을 다합니다.</li>
                  <li>참가자의 개인정보를 관련 법령에 따라 보호합니다.</li>
                  <li>대회 관련 중요 사항은 사전에 공지합니다.</li>
                  <li>참가자의 정당한 의견이나 불만을 처리하기 위해 노력합니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제8조의2 (서비스 관련 정보의 전송)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 서비스 제공 및 회원 보호를 위해 다음의 정보를 카카오톡 채널 알림톡, 문자메시지, 이메일 등을 통해 전송할 수 있습니다:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>회원 본인이 참가 신청한 대회 관련 필수 안내 (일정, 장소, 코스, 변경사항 등)</li>
                      <li>결제 완료, 환불 처리 등 거래 관련 정보</li>
                      <li>회원이 작성한 글에 대한 답변 또는 댓글 알림</li>
                      <li>이용약관 또는 개인정보처리방침의 변경 공지</li>
                      <li>서비스 점검, 시스템 장애, 일시 중단 안내</li>
                      <li>보안 관련 중요 공지 (비밀번호 변경 권고, 부정 로그인 시도 알림 등)</li>
                      <li>회원 문의에 대한 답변</li>
                      <li>기타 법령상 의무적으로 통지해야 하는 사항</li>
                    </ul>
                  </li>
                  <li>위 정보는 서비스 이용 및 회원 권익 보호를 위한 필수 사항으로, 광고성 정보가 아니므로 별도의 수신 동의 없이 전송됩니다.</li>
                  <li>회원은 위 필수 정보의 수신을 거부할 수 없으며, 수신 거부 시 서비스 이용에 제한이 있을 수 있습니다.</li>
                  <li>회원이 연락처 정보를 잘못 기재하거나 변경하지 않아 필수 정보를 받지 못한 경우, 이로 인한 불이익은 회원의 책임입니다.</li>
                  <li>신규 대회 안내, 이벤트 등 광고성 정보는 회원이 별도로 수신을 동의한 경우에만 전송되며, 위 필수 정보와는 구분됩니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제9조 (면책 조항)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>회사는 천재지변, 전쟁, 기타 불가항력적 사유로 인한 서비스 제공 불능에 대해 책임지지 않습니다.</li>
                  <li>참가자의 귀책사유로 인한 손해에 대해서는 책임지지 않습니다.</li>
                  <li>대회 참가 중 발생하는 참가자의 부상이나 사고에 대해서는 참가자 본인의 책임입니다.</li>
                  <li>단, 회사의 고의 또는 중과실로 인한 손해는 제외됩니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제10조 (분쟁 해결)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>본 약관과 관련하여 발생하는 분쟁은 상호 협의를 통해 해결합니다.</li>
                  <li>협의가 이루어지지 않을 경우 관련 법령에 따라 해결합니다.</li>
                  <li>본 약관은 대한민국 법률에 의해 해석됩니다.</li>
                </ol>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">제11조 (기타)</h2>
              <div className="text-gray-700 mb-6 leading-relaxed">
                <ol className="list-decimal list-inside space-y-3">
                  <li>본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</li>
                  <li>본 약관의 일부 조항이 무효가 되어도 나머지 조항의 효력에는 영향을 미치지 않습니다.</li>
                </ol>
              </div>

              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
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