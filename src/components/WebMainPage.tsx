'use client'

import Link from 'next/link'
import PagePopup from '@/components/PagePopup'
import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function WebMainPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [currentMaleRanker, setCurrentMaleRanker] = useState(0)
  const [currentFemaleRanker, setCurrentFemaleRanker] = useState(0)
  const [showAppBanner, setShowAppBanner] = useState(false)
  const [mobileOS, setMobileOS] = useState<'ios' | 'android' | null>(null)

  const slideImages = [
    '/images/main_s01.png',
    '/images/main_s02.png',
    '/images/main_s03.png'
  ]

  const maleRankers = [
    '/images/rank/r01.png',
    '/images/rank/r02.png',
    '/images/rank/r03.png',
    '/images/rank/r04.png'
  ]

  const femaleRankers = [
    '/images/rank/r05.png',
    '/images/rank/r06.png',
    '/images/rank/r07.png',
    '/images/rank/r08.png'
  ]

  // 모바일 OS 감지 및 배너 표시 로직
  useEffect(() => {
    const enableAppBanner = false // 임시로 앱 다운로드 배너/모달 비활성화 (복구시 true로 변경)
    if (!enableAppBanner) return

    if (typeof window === 'undefined') return

    // 배너 숨김 시간 확인 (30분)
    const hiddenUntil = localStorage.getItem('appBannerHiddenUntil')

    if (hiddenUntil) {
      const hiddenTime = parseInt(hiddenUntil)
      const currentTime = new Date().getTime()

      // 30분(1800000ms)이 지나지 않았으면 배너 표시 안 함
      if (currentTime < hiddenTime) {
        setShowAppBanner(false)
        return
      } else {
        // 30분이 지났으면 localStorage에서 제거
        localStorage.removeItem('appBannerHiddenUntil')
      }
    }

    // 모바일 OS 감지
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1 || userAgent.indexOf('ipod') !== -1) {
      setMobileOS('ios')
      setShowAppBanner(true)
    } else if (userAgent.indexOf('android') !== -1) {
      setMobileOS('android')
      setShowAppBanner(true)
    } else {
      // 데스크톱은 배너 표시 안 함
      setShowAppBanner(false)
    }
  }, [])

  // 배너 닫기 (10분 동안 보지 않기)
  const handleCloseBanner = () => {
    // 현재 시간 + 10분(600000ms) 타임스탬프 저장
    const hideUntilTime = new Date().getTime() + 600000
    localStorage.setItem('appBannerHiddenUntil', hideUntilTime.toString())
    setShowAppBanner(false)
  }

  // X 버튼 클릭 (단순 닫기, 저장하지 않음)
  const handleDismiss = () => {
    setShowAppBanner(false)
  }

  // 앱 다운로드 링크
  const getAppStoreLink = () => {
    if (mobileOS === 'ios') {
      return 'https://apps.apple.com/kr/app/%EB%9F%B0%ED%85%90/id6755452057'
    } else if (mobileOS === 'android') {
      return 'https://play.google.com/store/apps/details?id=com.runten.app'
    }
    return '#'
  }

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length)
    }, 2500) // 2.5초마다 전환

    return () => clearInterval(interval)
  }, [isPaused, slideImages.length])

  // 남성 랭커 슬라이드 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMaleRanker((prev) => (prev + 1) % maleRankers.length)
    }, 3000) // 3초마다 전환

    return () => clearInterval(interval)
  }, [maleRankers.length])

  // 여성 랭커 슬라이드 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFemaleRanker((prev) => (prev + 1) % femaleRankers.length)
    }, 3000) // 3초마다 전환

    return () => clearInterval(interval)
  }, [femaleRankers.length])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 메인 페이지 팝업 */}
      <PagePopup pageId="home" />
      {/* Hero Section - 러너 이미지 배경 + 런텐프로젝트 */}
      <section className="relative h-[50vh] min-h-[400px] sm:h-[60vh] flex items-center justify-center sm:justify-end">
        {/* 배경 이미지 - 러너들의 다리와 신발 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/runners-bg.jpg')", // 러너 이미지 경로
            backgroundPosition: 'center bottom'
          }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>

        {/* 텍스트 오버레이 */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full">
          {/* 모바일 레이아웃 - 가운데 정렬 */}
          <div className="md:hidden flex flex-col items-center justify-center h-full text-center text-white">
            {/* 1. 전국 러닝 협회가 인증하는... */}
            <div className="mb-10">
              <div className="space-y-2 text-lg font-medium leading-relaxed">
                <p className="opacity-90">전국 러닝 협회가 인증하는</p>
                <p className="opacity-90">10km 러너들의 공식 플랫폼</p>
              </div>
            </div>

            {/* 2. we are RUN10 */}
            <div className="mb-10">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
                <span className="block mb-2">we are</span>
                <span className="block text-red-600">RUN10</span>
              </h1>
            </div>

            {/* 3. 전국 10km 러닝 대회... */}
            <div>
              <div className="space-y-1 text-base font-normal leading-relaxed">
                <p className="opacity-90">전국 10km 러닝 대회 개최</p>
                <p className="opacity-90">전국 10km 러너 랭커 등록</p>
                <p className="opacity-90">전국 10km 러닝 문화 확대</p>
              </div>
            </div>
          </div>

          {/* 웹/태블릿 레이아웃 - 기존 디자인 */}
          <div className="hidden md:block">
            {/* 텍스트2 - 왼쪽 상단 텍스트 */}
            <div className="absolute top-16 left-4 lg:left-8">
              <div className="text-left text-white">
                <div className="space-y-2 text-lg md:text-2xl font-medium leading-relaxed">
                  <p className="opacity-90">전국 러닝 협회가 인증하는</p>
                  <p className="opacity-90">10km 러너들의 공식 플랫폼</p>
                </div>
                <div className="mt-6 space-y-1 text-base md:text-lg font-normal leading-relaxed">
                  <p className="opacity-90">전국 10km 러닝 대회 개최</p>
                  <p className="opacity-90">전국 10km 러너 랭커 등록</p>
                  <p className="opacity-90">전국 10km 러닝 문화 확대</p>
                </div>
              </div>
            </div>

            {/* 텍스트1 - 오른쪽 하단 텍스트 */}
            <div className="flex justify-end absolute bottom-16 lg:bottom-20 right-4 lg:right-8">
              <div className="text-right text-white">
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 tracking-tight">
                  <span className="block">we are</span>
                  <span className="block text-red-600">RUN10</span>
                </h1>
                <div className="space-y-1 text-base sm:text-lg md:text-xl font-light tracking-wider">
                  <p className="opacity-90">10km는 누구나 도전할 수 있는</p>
                  <p className="opacity-90">러너의 기준입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 런텐프로젝트 슬로건 Section */}
      <section className="py-8 sm:py-12 bg-[#051735]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* 모바일용 이미지 */}
          <div className="block md:hidden max-w-md mx-auto">
            <img
              src="/images/grades/subtitle_m.png"
              alt="런텐프로젝트 슬로건"
              className="mx-auto max-w-full h-auto"
            />
          </div>
          {/* 웹용 이미지 */}
          <div className="hidden md:block max-w-3xl mx-auto">
            <img
              src="/images/grades/subtitle.png"
              alt="런텐프로젝트 슬로건"
              className="mx-auto max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* 현재 모집중인 대회 Section - 대회 홍보 */}
      <section className="py-12 sm:py-16 lg:py-20 bg-black text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* 대회 이미지 슬라이드쇼 */}
            <div className="mb-8 sm:mb-12">
              <div
                className="w-full h-64 sm:h-80 md:h-96 lg:h-96 xl:h-[450px] rounded-lg shadow-2xl relative border-2 border-white overflow-hidden"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
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
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4 sm:p-6 z-20">
                  <div className="text-center space-y-6 sm:space-y-8">
                    <div className="space-y-1 text-base sm:text-lg md:text-xl lg:text-2xl font-medium" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                      <p>전국 러닝 성지에서 펼쳐지는 수천명의</p>
                      <p>가장 안전하고 깔끔한 10km 레이스</p>
                    </div>
                    <div className="space-y-1 text-base sm:text-lg md:text-xl lg:text-2xl font-medium" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                      <p>주말, 소중한 사람들과 전국을 누비며</p>
                      <p>도시관광도 즐기고 PB에 도전하세요!</p>
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                      <p>2026 2.28 세종에서 열립니다</p>
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
                        currentSlide === index ? 'bg-red-600 w-6' : 'bg-white/50'
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
                className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-2xl font-black text-lg sm:text-xl md:text-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-red-500"
              >
                대회 참가하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RUN 10 티어 Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-red-600 mb-3 sm:mb-4">
              RUN10 티어
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-black mb-2 sm:mb-3">
              나의 RUN10 티어를 확인해 보세요.
            </p>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 lg:mb-12">
              마이페이지에서 언제든지 수정 가능합니다.
            </p>
          </div>

          {/* 모바일/앱용 단일 이미지 */}
          <div className="block md:hidden">
            <img
              src="/images/grades/main_m.png"
              alt="RUN10 티어"
              className="w-full h-auto mx-auto"
            />
          </div>

          {/* 웹용 4개 부족 이미지 */}
          <div className="hidden md:grid grid-cols-4 gap-6">
            {/* 치타족 */}
            <div className="text-center">
              <img
                src="/images/grades/main_cheetah.png"
                alt="치타족"
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* 홀스족 */}
            <div className="text-center">
              <img
                src="/images/grades/main_house.png"
                alt="홀스족"
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* 울프족 */}
            <div className="text-center">
              <img
                src="/images/grades/main_wolf.png"
                alt="울프족"
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* 터틀족 */}
            <div className="text-center">
              <img
                src="/images/grades/main_turtle.png"
                alt="터틀족"
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* RUN10 랭커 Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-red-600 mb-3 sm:mb-4">
              RUN10 랭커
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 lg:mb-12">
              RUN10 랭커에 도전하세요.
            </p>
          </div>

          {/* 모바일용 슬라이드 */}
          <div className="block md:hidden space-y-8 mb-12">
            {/* 남성 랭커 슬라이드 */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">남성 랭커</h3>
              <div className="relative w-full max-w-sm mx-auto">
                <div className="relative rounded-lg overflow-hidden shadow-xl">
                  {maleRankers.map((image, index) => (
                    <div
                      key={index}
                      className="transition-opacity duration-700"
                      style={{
                        opacity: currentMaleRanker === index ? 1 : 0,
                        position: currentMaleRanker === index ? 'relative' : 'absolute',
                        top: currentMaleRanker === index ? 'auto' : 0,
                        left: currentMaleRanker === index ? 'auto' : 0,
                        width: '100%',
                        zIndex: currentMaleRanker === index ? 1 : 0
                      }}
                    >
                      <img
                        src={image}
                        alt={`남성 랭커 ${index + 1}위`}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  ))}
                </div>
                {/* 슬라이드 인디케이터 */}
                <div className="flex justify-center gap-2 mt-4">
                  {maleRankers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMaleRanker(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentMaleRanker === index ? 'bg-red-600 w-6' : 'bg-white/50'
                      }`}
                      aria-label={`남성 랭커 ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 여성 랭커 슬라이드 */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">여성 랭커</h3>
              <div className="relative w-full max-w-sm mx-auto">
                <div className="relative rounded-lg overflow-hidden shadow-xl">
                  {femaleRankers.map((image, index) => (
                    <div
                      key={index}
                      className="transition-opacity duration-700"
                      style={{
                        opacity: currentFemaleRanker === index ? 1 : 0,
                        position: currentFemaleRanker === index ? 'relative' : 'absolute',
                        top: currentFemaleRanker === index ? 'auto' : 0,
                        left: currentFemaleRanker === index ? 'auto' : 0,
                        width: '100%',
                        zIndex: currentFemaleRanker === index ? 1 : 0
                      }}
                    >
                      <img
                        src={image}
                        alt={`여성 랭커 ${index + 1}위`}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  ))}
                </div>
                {/* 슬라이드 인디케이터 */}
                <div className="flex justify-center gap-2 mt-4">
                  {femaleRankers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFemaleRanker(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentFemaleRanker === index ? 'bg-red-600 w-6' : 'bg-white/50'
                      }`}
                      aria-label={`여성 랭커 ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 웹용 2행 4열 그리드 */}
          <div className="hidden md:block">
            {/* 남성 랭커 */}
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <img
                  src="/images/rank/r01.png"
                  alt="남성 랭커 1위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <img
                  src="/images/rank/r02.png"
                  alt="남성 랭커 2위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <img
                  src="/images/rank/r03.png"
                  alt="남성 랭커 3위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <img
                  src="/images/rank/r04.png"
                  alt="남성 랭커 4위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* 여성 랭커 */}
            <div className="grid grid-cols-4 gap-6 mb-8 sm:mb-12">
              <div className="text-center">
                <img
                  src="/images/rank/r05.png"
                  alt="여성 랭커 1위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <img
                  src="/images/rank/r06.png"
                  alt="여성 랭커 2위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <img
                  src="/images/rank/r07.png"
                  alt="여성 랭커 3위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <img
                  src="/images/rank/r08.png"
                  alt="여성 랭커 4위"
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* 더보기 버튼 */}
          <div className="text-center">
            <Link
              href="/rank"
              className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-2xl font-black text-lg sm:text-xl md:text-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-red-500"
            >
              더보기 +
            </Link>
          </div>
        </div>
      </section>

      {/* 모바일 앱 다운로드 모달 */}
      {showAppBanner && mobileOS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ backgroundColor: '#00000031' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-[230px] w-full overflow-hidden relative">
            {/* X 닫기 버튼 */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 모달 내용 */}
            <div className="p-2.5 text-center">
              {/* 아이콘 + RUN10 로고 */}
              <div className="flex items-center justify-center gap-2.5 mb-5">
                <img
                  src="/images/app_icon.png"
                  alt="런텐 앱 아이콘"
                  className="w-12 h-12 rounded-lg shadow-md"
                />
                <h2 className="text-xl font-black text-red-600">런텐 RUN10</h2>
              </div>

              {/* 제목 */}
              <h3 className="text-base font-bold text-gray-900 mb-1">
                런텐 앱에서 더 편리하게!
              </h3>

              {/* 설명 */}
              <h3 className="text-sm text-gray-600 mb-5">
                더 많은 기능을 이용해보세요.
              </h3>

              {/* 앱 다운로드 버튼 */}
              <a
                href={getAppStoreLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 rounded-lg text-xs font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl mb-2"
              >
                런텐 앱에서 보기
              </a>

              {/* 웹으로 볼게요 버튼 */}
              <button
                onClick={handleCloseBanner}
                className="w-full text-xs text-gray-600 hover:text-gray-800 py-0.5 transition-colors"
              >
                괜찮습니다. 모바일 웹으로 볼게요.
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
