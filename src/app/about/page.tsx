import Image from 'next/image'
import { Users, Target, Award, Heart } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
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
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20 overflow-hidden">
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">런텐 RUN10</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            전국의 러너들이 함께 달리며 건강한 러닝 문화를 만들어 가겠습니다
          </p>
        </div>
      </section>

      {/* 소개 섹션 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4">
              전국 러닝 협회가 공식 인증하는 10km 러너들의 전용 플랫폼입니다.
              정확한 기록 측정과 체계적인 등급 시스템을 통해 러너들의 성장을 지원합니다.
            </p>
          </div>

          {/* 핵심 가치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">JUST RUN 10 대회</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    전국 러닝 협회가 인증하는 공식 10km 대회를 개최합니다.
                    정확한 기록 측정과 함께 최고의 러닝 경험을 제공합니다.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>평지코스 정확한 기록 인증</li>
                    <li>깨끗하고 쾌적한 러닝코스</li>
                    <li>70명 대상 국내 최고 경품</li>
                    <li>수준별 출발 안정적 레이스</li>
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

            {/* 커뮤니티 활동 이미지 섹션 */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-1">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                      src="/images/about-community.jpg"
                      alt="런텐 커뮤니티"
                      width={600}
                      height={338}
                      className="object-cover rounded-lg shadow-md w-full h-full"
                    />
                  </div>
                </div>
                <div className="order-2">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">RUN10 티어 시스템</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    개인 기록에 따른 체계적인 등급 시스템을 운영합니다.
                    나의 RUN10 티어를 확인하고 더 높은 등급을 향해 도전하세요.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>치타족 (30-39분59초) - 최상급 러너</li>
                    <li>홀스족 (40-49분59초) - 상급 러너</li>
                    <li>울프족 (50-59분59초) - 중급 러너</li>
                    <li>터틀족 (60분 이상) - 초급 러너</li>
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