import Image from 'next/image'
import { Users, Target, Award, Heart } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "런텐 소개 | RUN10 전국 러닝 협회 인증 플랫폼",
  description: "전국 러닝 협회가 공식 인증하는 10km 러너들의 전용 플랫폼입니다. 정확한 기록 측정과 체계적인 등급 시스템을 통해 러너들의 성장을 지원합니다. 치타족, 홀스족, 울프족, 터틀족까지 나의 RUN10 티어를 확인하세요.",
  keywords: "런텐소개, RUN10소개, 러닝협회, 10km러닝, 티어시스템, 치타족, 홀스족, 울프족, 터틀족",
  openGraph: {
    title: "런텐 소개 | RUN10 전국 러닝 협회 인증 플랫폼",
    description: "전국 러닝 협회가 공식 인증하는 10km 러너들의 전용 플랫폼입니다.",
    url: "https://runten.co.kr/about",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        {/* 배경 이미지 공간 */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/about-hero-bg.jpg"
            alt="런텐 배경"
            width={1920}
            height={1080}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">런텐 RUN10</h1>
          <div className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto space-y-1">
            <p> 전국 10km 러너들을 위한 공식 플랫폼</p>
          </div>
        </div>
      </section>

      {/* 소개 섹션 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              대회부터 플래시, 티어, 랭킹까지
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4">
              러너의 모든 순간을 연결합니다.
            </p>
          </div>

          {/* 핵심 가치 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">소통</h3>
              <p className="text-gray-600">
                전국 러너들과의 활발한 소통과 교류
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">도전</h3>
              <p className="text-gray-600">
                개인의 한계를 뛰어넘는 도전 정신
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">성취</h3>
              <p className="text-gray-600">
                목표 달성을 통한 성취감과 자신감
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">건강</h3>
              <p className="text-gray-600">
                건강한 몸과 마음을 위한 러닝 라이프
              </p>
            </div>
          </div>

          {/* 활동 소개 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">주요 활동</h2>
            
            {/* 대회 활동 이미지 섹션 */}
            <div className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold mb-4">
                    <span className="text-red-600">01</span>
                    <span className="text-gray-900"> 런텐 대회</span>
                  </h3>
                  <p className="text-gray-600 mb-1 leading-relaxed">전국 주요 도심에 펼쳐지는 공식 10km 대회.</p>
                  <p className="text-gray-600 mb-4 leading-relaxed">기록과 도전을 위한 공식 레이스를 경험해보세요.</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>페이스별 출발로 안정적인 레이스</li>
                    <li>공인 칩을 통한 정확한 기록 측정</li>
                    <li>기록을 최적화하는 평탄한 코스</li>
                    <li>깨끗하고 쾌적한 달림 환경</li>
                    <li>이주 메달과 100명 대상 경품 이벤트</li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/about-competition.jpg"
                      alt="런텐 대회 현장"
                      width={600}
                      height={338}
                      className="object-cover rounded-lg shadow-md w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 02 런텐 플래시 — 이미지(좌) 설명(우) */}
            <div className="mt-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-1">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/about_flash.jpg"
                      alt="런텐 플래시"
                      width={600}
                      height={338}
                      className="object-cover rounded-lg shadow-md w-full h-full"
                    />
                  </div>
                </div>
                <div className="order-2">
                  <h3 className="text-2xl font-bold mb-4">
                    <span className="text-red-600">02</span>
                    <span className="text-gray-900"> 런텐 플래시</span>
                  </h3>
                  <p className="text-gray-600 mb-1 leading-relaxed">크루형, 헤비형, 다이형, 아무런 규정도 없이</p>
                  <p className="text-gray-600 mb-4 leading-relaxed">원하는 시간과 장소에서 가볍게 모여 달려라.</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>원하는 지역·시간에서 자유롭게 참여</li>
                    <li>거리·페이스가 맞는 달림이 함께</li>
                    <li>최대 10명의 부담 없는 소규모 달림</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 03 런텐티어 — 설명(좌) 이미지(우) */}
            <div className="mt-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl font-bold mb-4">
                    <span className="text-red-600">03</span>
                    <span className="text-gray-900"> 런텐티어</span>
                  </h3>
                  <p className="text-gray-600 mb-1 leading-relaxed">4가지 티어로 나의 달림 실력을 확인하고,</p>
                  <p className="text-gray-600 mb-4 leading-relaxed">나에게 맞는 레이스를 선택해보세요.</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>치타족 (남성 30-39분59초 / 여성 40-49분59초)</li>
                    <li>홀스족 (남성 40-49분59초 / 여성 50-59분59초)</li>
                    <li>울프족 (남성 50-59분59초 / 여성 60-69분59초)</li>
                    <li>터틀족 (남성 60분 이상 / 여성 70분 이상)</li>
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/about-tier.jpg"
                      alt="런텐 티어 시스템"
                      width={600}
                      height={338}
                      className="object-cover rounded-lg shadow-md w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 04 런텐랭커 — 이미지(좌) 설명(우) */}
            <div className="mt-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-1">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/about-rank.jpg"
                      alt="런텐 랭커"
                      width={600}
                      height={338}
                      className="object-cover rounded-lg shadow-md w-full h-full"
                    />
                  </div>
                </div>
                <div className="order-2">
                  <h3 className="text-2xl font-bold mb-4">
                    <span className="text-red-600">04</span>
                    <span className="text-gray-900"> 런텐랭커</span>
                  </h3>
                  <p className="text-gray-600 mb-1 leading-relaxed">모든 대회 기록이 데이터로 쌓여 전체 랭킹과 티어별 랭킹에 반영됩니다.</p>
                  <p className="text-gray-600 mb-4 leading-relaxed">기록은 기억되고, 당신의 랭커가 됩니다. 전국 달림이와 순위를 겨뤄보세요!</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>공식 10km 기록 기반 랭킹</li>
                    <li>남성·여성 랭킹 구분</li>
                    <li>순위별 기록 및 티어 확인</li>
                    <li>기록을 통한 지속적인 성장과 도전</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}