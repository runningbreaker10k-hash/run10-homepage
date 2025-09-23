import { Shield, AlertTriangle, Heart, Droplets, Thermometer, Users, Phone, Activity } from 'lucide-react'

export default function SafetyPage() {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">안전수칙</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            안전하고 즐거운 러닝을 위한 필수 안전수칙
          </p>
        </div>
      </section>

      {/* 핵심 안전수칙 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">핵심 안전수칙</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">건강 체크</h3>
              <p className="text-gray-600 text-sm">
                대회 참가 전 충분한 건강 검진과 컨디션 확인
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Droplets className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">수분 보충</h3>
              <p className="text-gray-600 text-sm">
                충분한 수분 섭취와 전해질 보충
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <Activity className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">적절한 페이스</h3>
              <p className="text-gray-600 text-sm">
                자신의 체력에 맞는 적절한 페이스 유지
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">안전 신호</h3>
              <p className="text-gray-600 text-sm">
                응급상황 시 주변 도움 요청과 신호
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 대회 전 준비사항 */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">대회 전 준비사항</h2>
          
          <div className="space-y-8">
            <div className="bg-blue-50 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Heart className="h-6 w-6 text-blue-600 mr-2" />
                건강상태 점검
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">필수 건강 체크</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>최근 3개월 내 건강검진 결과 확인</li>
                    <li>심장질환, 고혈압 등 순환기계 질환 점검</li>
                    <li>당뇨, 천식 등 만성질환 상태 확인</li>
                    <li>최근 부상 부위 회복 상태 점검</li>
                    <li>감기, 발열 등 급성 질환 여부 확인</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">참가 불가 조건</h4>
                  <ul className="list-disc list-inside text-red-700 space-y-2">
                    <li>발열(37.5°C 이상) 시</li>
                    <li>심한 감기 또는 몸살 증상</li>
                    <li>근육 또는 관절 부상으로 통증이 있을 시</li>
                    <li>전날 과도한 음주 후 숙취 상태</li>
                    <li>수면 부족(4시간 미만) 상태</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="h-6 w-6 text-green-600 mr-2" />
                훈련 및 컨디션 조절
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">대회 1개월 전</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>목표 거리에 맞는 체계적인 훈련 시작</li>
                    <li>주 3-4회 이상 규칙적인 러닝</li>
                    <li>장거리 연습으로 지구력 향상</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">대회 1주일 전</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>훈련량 50% 감소 (테이퍼링)</li>
                    <li>충분한 수면과 휴식</li>
                    <li>규칙적인 식사와 영양 관리</li>
                    <li>스트레칭과 마사지로 근육 이완</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">대회 전날</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>가벼운 조깅 또는 완전 휴식</li>
                    <li>일찍 취침하여 충분한 수면</li>
                    <li>과식 금지, 소화 잘 되는 음식 섭취</li>
                    <li>알코올 및 카페인 섭취 제한</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 대회 당일 안전수칙 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">대회 당일 안전수칙</h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Thermometer className="h-6 w-6 text-orange-600 mr-2" />
                기온별 대응법
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">추위 (5°C 이하)</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>레이어드 의복 착용</li>
                    <li>장갑, 모자 필수 착용</li>
                    <li>충분한 워밍업 실시</li>
                    <li>찬 공기 흡입 주의</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">적정 온도 (5-25°C)</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>가벼운 운동복 착용</li>
                    <li>적절한 워밍업</li>
                    <li>규칙적인 수분 보충</li>
                    <li>자연스러운 호흡 유지</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="text-lg font-semibold text-red-800 mb-2">더위 (25°C 이상)</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>밝은색, 통풍 잘 되는 의복</li>
                    <li>모자, 선글라스 착용</li>
                    <li>자주 수분 보충</li>
                    <li>그늘에서 휴식</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Droplets className="h-6 w-6 text-blue-600 mr-2" />
                수분 섭취 가이드
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">대회 2시간 전</div>
                    <p className="text-gray-700">500-600ml 충분히 마시기</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">대회 중</div>
                    <p className="text-gray-700">15-20분마다 150-250ml 섭취</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">대회 후</div>
                    <p className="text-gray-700">체중 감소량의 150% 보충</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">수분 섭취 주의사항</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    <li>갈증을 느끼기 전에 미리 섭취</li>
                    <li>너무 차가운 물은 피하기</li>
                    <li>30분 이상 러닝 시 전해질 보충</li>
                    <li>과도한 수분 섭취로 인한 저나트륨혈증 주의</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 응급상황 대처법 */}
      <section className="py-16 bg-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">응급상황 대처법</h2>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  위험 신호 인지
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">즉시 중단 신호</h4>
                    <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                      <li>가슴 통증 또는 압박감</li>
                      <li>심한 어지러움, 현기증</li>
                      <li>호흡곤란, 과도한 숨가쁨</li>
                      <li>구토, 메스꺼움</li>
                      <li>시야 흐림 또는 의식 저하</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">주의 신호</h4>
                    <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                      <li>근육 경련 또는 쥐남</li>
                      <li>과도한 피로감</li>
                      <li>두통</li>
                      <li>관절 통증</li>
                      <li>불규칙한 심박</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-green-600 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  응급처치 방법
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">일반적 응급처치</h4>
                    <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
                      <li>즉시 러닝 중단하고 안전한 곳으로 이동</li>
                      <li>앉거나 누워서 휴식</li>
                      <li>의복을 느슨하게 풀어주기</li>
                      <li>주변에 도움 요청</li>
                      <li>필요시 119 신고</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">열사병 응급처치</h4>
                    <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
                      <li>그늘진 시원한 곳으로 이동</li>
                      <li>의복 제거하여 체온 낮추기</li>
                      <li>목, 겨드랑이, 사타구니에 차가운 물</li>
                      <li>의식이 있으면 소량씩 수분 보충</li>
                      <li>즉시 응급실 이송</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <h3 className="text-xl font-semibold text-red-600 mb-4 flex items-center justify-center">
                <Phone className="h-5 w-5 mr-2" />
                응급연락처
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-red-600">119</div>
                  <p className="text-gray-700">소방서 (응급상황)</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">042-710-2058</div>
                  <p className="text-gray-700">대회 본부</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">010-1234-5678</div>
                  <p className="text-gray-700">현장 응급팀</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 장비 및 복장 안전수칙 */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">장비 및 복장 안전수칙</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">권장 복장</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>통풍이 잘 되는 기능성 운동복</li>
                <li>쿠션이 좋은 러닝화 (평소 착용 제품)</li>
                <li>습기 배출이 좋은 양말</li>
                <li>반사 소재가 포함된 의복 (야간 대회)</li>
                <li>모자, 선글라스 (햇빛 차단)</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">위험한 복장</h3>
              <ul className="list-disc list-inside text-red-700 space-y-2">
                <li>새로 구매한 신발 (물집 위험)</li>
                <li>면 소재 의복 (땀 흡수 후 무거워짐)</li>
                <li>너무 꽉 조이는 의복</li>
                <li>금속 액세서리 (마찰 위험)</li>
                <li>헤드폰, 이어폰 (주변 소리 차단)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 마무리 메시지 */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">안전한 러닝, 즐거운 대회</h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            안전수칙을 준수하여 부상 없이 완주하는 것이 가장 큰 성취입니다. 
            무리하지 말고 자신의 체력에 맞는 페이스로 달리세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/competitions"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              대회 참가하기
            </a>
            <a
              href="/terms"
              className="inline-flex items-center px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
            >
              이용약관 확인
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}