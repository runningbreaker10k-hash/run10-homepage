import { Building, MapPin, Phone, Mail, Users, Calendar, Award } from 'lucide-react'

export default function CompanyInfoPage() {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">회사소개</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            RUN10(런텐)의 상세한 정보를 확인하세요
          </p>
        </div>
      </section>

      {/* 회사 개요 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">회사 개요</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 회사 기본 정보 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">기본 정보</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">회사명</p>
                      <p className="text-gray-600">런텐(RUN10)</p>
                      <p className="text-sm text-gray-500">Korea National Running Association</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">주소</p>
                      <p className="text-gray-600">서울특별시 강남구 테헤란로 123</p>
                      <p className="text-sm text-gray-500">런텐빌딩 5층 (우: 06234)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">전화번호</p>
                      <p className="text-gray-600">02-1234-5678</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">이메일</p>
                      <p className="text-gray-600">info@run10.kr</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 법인 정보 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">법인 정보</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900">사업자등록번호</p>
                    <p className="text-gray-600">123-45-67890</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">통신판매업신고번호</p>
                    <p className="text-gray-600">2024-서울강남-1234</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">대표자</p>
                    <p className="text-gray-600">김러닝</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">설립일</p>
                    <p className="text-gray-600">2020년 3월 15일</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">직원 수</p>
                    <p className="text-gray-600">25명</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 사업 영역 */}
      <section className="py-16 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">사업 영역</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">대회 개최</h3>
              <p className="text-gray-600 text-sm">
                전국 각지에서 다양한 러닝 대회를 기획하고 운영합니다. 
                매월 정기 대회와 계절별 특별 대회를 개최하여 러너들의 참여를 이끌어내고 있습니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">커뮤니티 운영</h3>
              <p className="text-gray-600 text-sm">
                러너들 간의 소통과 정보 공유를 위한 온라인 플랫폼을 운영합니다. 
                러닝 팁, 훈련 방법, 대회 후기 등을 나누며 건강한 러닝 문화를 조성합니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">교육 프로그램</h3>
              <p className="text-gray-600 text-sm">
                초보 러너부터 전문 러너까지 각 단계별 교육 프로그램을 제공합니다. 
                안전한 러닝 방법, 부상 예방, 기록 단축 등 체계적인 교육을 진행합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 연혁 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">회사 연혁</h2>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-red-200"></div>
              
              <div className="space-y-8">
                <div className="relative flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-600">2024년</p>
                    <p className="text-lg font-medium text-gray-900">전국 네트워크 확장</p>
                    <p className="text-gray-600">전국 20개 지역으로 대회 개최 지역 확대, 연간 참가자 10만명 돌파</p>
                  </div>
                </div>
                
                <div className="relative flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-600">2023년</p>
                    <p className="text-lg font-medium text-gray-900">온라인 플랫폼 런칭</p>
                    <p className="text-gray-600">대회 참가 신청 및 커뮤니티 기능을 포함한 통합 온라인 플랫폼 오픈</p>
                  </div>
                </div>
                
                <div className="relative flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-600">2022년</p>
                    <p className="text-lg font-medium text-gray-900">첫 번째 마라톤 대회 개최</p>
                    <p className="text-gray-600">서울 한강에서 첫 번째 풀마라톤 대회 성공적 개최, 5,000명 참가</p>
                  </div>
                </div>
                
                <div className="relative flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-600">2021년</p>
                    <p className="text-lg font-medium text-gray-900">정기 대회 시작</p>
                    <p className="text-gray-600">매월 정기 5K, 10K 대회 시작, 초보 러너들의 큰 호응</p>
                  </div>
                </div>
                
                <div className="relative flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-600">2020년</p>
                    <p className="text-lg font-medium text-gray-900">런텐(RUN10) 설립</p>
                    <p className="text-gray-600">건강한 러닝 문화 확산을 목표로 런텐(RUN10) 공식 출범</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 비전 및 미션 */}
      <section className="py-16 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">비전 & 미션</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-red-600 mb-4">비전 (Vision)</h3>
              <p className="text-gray-600 leading-relaxed">
                대한민국 러닝 문화의 중심이 되어 모든 사람이 건강하고 즐겁게 달릴 수 있는 
                환경을 조성하고, 러닝을 통한 건강한 라이프스타일이 전국적으로 확산되도록 
                선도하는 국내 최고의 러닝 협회가 되겠습니다.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-red-600 mb-4">미션 (Mission)</h3>
              <ul className="text-gray-600 space-y-3">
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>안전하고 체계적인 러닝 대회를 통해 러너들의 도전 의식을 고취합니다</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>다양한 교육 프로그램으로 건강한 러닝 문화를 전파합니다</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>온오프라인 커뮤니티를 통해 러너들 간의 소통과 화합을 도모합니다</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>초보자부터 전문가까지 모든 수준의 러너를 지원합니다</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}