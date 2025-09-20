'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Target, Award, Heart } from 'lucide-react'

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
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              2024년에 설립되어 대한민국 곳곳에서 러닝 대회를 개최하며 
              건강한 러닝 문화 확산에 앞장서고 있습니다. 초보 러너부터 전문 마라토너까지 
              모든 수준의 참가자들이 함께 즐길 수 있는 다양한 대회를 운영하고 있습니다.
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
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">정기 대회 개최</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    매월 전국 각지에서 다양한 러닝 대회를 개최합니다. 
                    많은 러너들이 참여할 수 있는 다채로운 대회를 제공합니다.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>월 1회 정기 대회</li>
                    <li>계절별 특별 대회</li>
                    <li>초보자부터 전문가까지 모든 레벨 지원</li>
                    <li>안전하고 체계적인 대회 운영</li>
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
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-gray-400 text-center"><p>대회 현장 이미지</p><p class="text-sm">/images/about-competition.jpg</p></div>';
                        }
                      }}
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
                      onError={(e) => {
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-gray-400 text-center"><p>커뮤니티 이미지</p><p class="text-sm">/images/about-community.jpg</p></div>';
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="order-2">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">러닝 커뮤니티</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    러너들 간의 정보 공유와 소통을 위한 다양한 플랫폼을 운영합니다. 
                    러닝 팁, 훈련 방법, 대회 후기 등을 나누며 
                    함께 성장하는 러닝 커뮤니티를 만들어갑니다.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>온라인 커뮤니티 운영</li>
                    <li>러닝 정보 및 팁 공유</li>
                    <li>대회별 게시판 운영</li>
                    <li>러너들 간의 네트워킹 지원</li>
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