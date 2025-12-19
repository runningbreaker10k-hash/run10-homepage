import { Shield, AlertTriangle, Heart, Droplets, Thermometer, Users, Phone, Activity } from 'lucide-react'

export default function SafetyPage() {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">안전수칙</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">
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
          </div>
        </div>
      </section>
    </div>
  )
}