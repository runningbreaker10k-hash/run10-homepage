'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import PagePopup from '@/components/PagePopup'

export default function AppMainPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const slideImages = [
    '/images/main_s01.png',
    '/images/main_s02.png',
    '/images/main_s03.png'
  ]

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length)
    }, 2500) // 2.5초마다 전환

    return () => clearInterval(interval)
  }, [isPaused, slideImages.length])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 메인 페이지 팝업 */}
      <PagePopup pageId="home" />

      {/* Hero Section - 앱 스타일로 간소화 */}
      <section className="relative h-[30vh] min-h-[250px] flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-800">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/images/runners-bg.jpg')",
            backgroundPosition: 'center center'
          }}
        ></div>

        {/* 중앙 텍스트 */}
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight">
            <span className="block">RUN10</span>
          </h1>
          <p className="text-base sm:text-lg font-medium opacity-90 mb-2">
            전국 러닝 협회 인증
          </p>
          <p className="text-sm sm:text-base font-light opacity-80">
            10km 러너들의 공식 플랫폼
          </p>
        </div>
      </section>

      {/* 런텐프로젝트 슬로건 */}
      <section className="py-8 bg-[#051735]">
        <div className="max-w-md mx-auto px-4 text-center">
          <img
            src="/images/grades/subtitle_m.png"
            alt="런텐프로젝트 슬로건"
            className="mx-auto max-w-full h-auto"
          />
        </div>
      </section>

      {/* 현재 모집중인 대회 Section - 대회 홍보 */}
      <section className="py-8 px-4 bg-black text-white">
        <div className="max-w-md mx-auto">
          {/* 대회 이미지 슬라이드쇼 */}
          <div className="mb-6">
            <div
              className="w-full h-64 sm:h-80 rounded-lg shadow-2xl relative border-2 border-white overflow-hidden"
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* 슬라이드 이미지들 */}
              {slideImages.map((image, index) => (
                <div
                  key={index}
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
                  style={{
                    backgroundImage: `url('${image}')`,
                    opacity: currentSlide === index ? 1 : 0,
                    zIndex: currentSlide === index ? 1 : 0
                  }}
                />
              ))}

              {/* 배경 오버레이 */}
              <div className="absolute inset-0 rounded-lg z-10" style={{backgroundColor: '#00000085'}}></div>

              {/* 대회 특장점 텍스트 */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4 z-20">
                <div className="text-center space-y-5">
                  <div className="space-y-1 text-sm sm:text-base font-medium" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                    <p>전국 러닝 성지에서 펼쳐지는 수천명의</p>
                    <p>가장 안전하고 깔끔한 10km 레이스</p>
                  </div>
                  <div className="space-y-1 text-sm sm:text-base font-medium" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                    <p>주말, 소중한 사람들과 전국을 누비며</p>
                    <p>도시관광도 즐기고 PB에 도전하세요!</p>
                  </div>
                  <div className="text-sm sm:text-base font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                    <p>전국 러닝 협회 기록인증 10km 대회</p>
                  </div>
                </div>
              </div>

              {/* 슬라이드 인디케이터 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
                {slideImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                    aria-label={`슬라이드 ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 대회 참가하기 버튼 */}
          <div className="text-center">
            <Link
              href="/competitions"
              className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black text-lg sm:text-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 border-2 border-red-500"
            >
              대회 참가하기
            </Link>
          </div>
        </div>
      </section>

      {/* RUN10 티어 - 카드 스타일 */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-red-600 mb-2">
              RUN10 티어
            </h2>
            <p className="text-base text-gray-700 font-medium">
              나의 RUN10 티어를 확인해 보세요
            </p>
          </div>

          {/* 티어 카드 그리드 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 치타족 */}
            <Link href="/mypage" className="bg-white rounded-2xl shadow-xl overflow-hidden active:shadow-2xl transform active:scale-95 transition-all border-2 border-red-100">
              <img
                src="/images/grades/main_cheetah.png"
                alt="치타족"
                className="w-full h-auto"
              />
            </Link>

            {/* 홀스족 */}
            <Link href="/mypage" className="bg-white rounded-2xl shadow-xl overflow-hidden active:shadow-2xl transform active:scale-95 transition-all border-2 border-blue-100">
              <img
                src="/images/grades/main_house.png"
                alt="홀스족"
                className="w-full h-auto"
              />
            </Link>

            {/* 울프족 */}
            <Link href="/mypage" className="bg-white rounded-2xl shadow-xl overflow-hidden active:shadow-2xl transform active:scale-95 transition-all border-2 border-gray-100">
              <img
                src="/images/grades/main_wolf.png"
                alt="울프족"
                className="w-full h-auto"
              />
            </Link>

            {/* 터틀족 */}
            <Link href="/mypage" className="bg-white rounded-2xl shadow-xl overflow-hidden active:shadow-2xl transform active:scale-95 transition-all border-2 border-green-100">
              <img
                src="/images/grades/main_turtle.png"
                alt="터틀족"
                className="w-full h-auto"
              />
            </Link>
          </div>

          <p className="text-center text-sm text-gray-600 mt-5 font-medium">
            마이페이지에서 언제든지 수정 가능합니다
          </p>
        </div>
      </section>

    </div>
  )
}
