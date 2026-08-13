'use client'

import Link from 'next/link'
import Image from 'next/image'
import PagePopup from '@/components/PagePopup'
import { useState, useEffect } from 'react'
import { X, Zap, Medal, ChartNoAxesColumnIncreasing, Trophy } from 'lucide-react'

export default function WebMainPage() {
  const [currentMaleRanker, setCurrentMaleRanker] = useState(0)
  const [currentFemaleRanker, setCurrentFemaleRanker] = useState(0)
  const [showAppBanner, setShowAppBanner] = useState(false)
  const [mobileOS, setMobileOS] = useState<'ios' | 'android' | null>(null)

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
      {/* Hero Section */}
      <section className="relative">
        {/* 모바일: 세로 전체 이미지, 텍스트 하단 */}
        <div className="md:hidden relative w-full">
          <Image
            src="/images/main_bg_m.jpg"
            alt="러너 배경"
            width={800}
            height={1200}
            className="w-full h-auto"
            quality={75}
            priority
          />
          <div className="hidden absolute bottom-0 left-0 right-0 px-6 pb-10 text-center text-white">
            <div className="mb-4">
              <div className="space-y-1 text-base font-medium leading-relaxed">
                <p className="opacity-90">전국 러닝 협회가 인증하는</p>
                <p className="opacity-90">10km 러너들의 공식 플랫폼</p>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              <span className="text-red-600">런텐 RUN10</span>
            </h1>
            <div className="space-y-1 text-sm font-normal leading-relaxed w-max mx-auto">
              <p className="opacity-90 w-full [text-align-last:justify]">런텐 대회 개최</p>
              <p className="opacity-90 w-full [text-align-last:justify]">런텐 플래시 활동</p>
              <p className="opacity-90 w-full [text-align-last:justify]">런텐 티어 시스템</p>
              <p className="opacity-90 w-full [text-align-last:justify]">런텐 랭커 등록</p>
            </div>
          </div>
        </div>

        {/* 웹: 1800:500 비율 고정, 좌우 미세 크롭 */}
        <div className="hidden md:block relative w-full" style={{ aspectRatio: '1800/500' }}>
          <Image
            src="/images/main_bg.jpg"
            alt="러너 배경"
            fill
            className="object-cover"
            quality={75}
            priority
          />
          <div className="hidden absolute inset-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex">
              {/* 좌측: A(상단) + B(하단) */}
              <div className="flex flex-col justify-between py-6 md:py-8 lg:py-10 text-white">
                {/* A - 슬로건 */}
                <div className="text-left">
                  <div className="space-y-1 text-base md:text-lg lg:text-xl font-medium leading-relaxed">
                    <p className="opacity-90">전국 러닝 협회가 인증하는</p>
                    <p className="opacity-90">10km 러너들의 공식 플랫폼</p>
                  </div>
                </div>
                {/* B - 서비스 목록 */}
                <div className="text-left">
                  <div className="space-y-0.5 text-sm md:text-base lg:text-lg font-normal leading-relaxed w-max">
                    <p className="opacity-90 w-full [text-align-last:justify]">런텐 대회 개최</p>
                    <p className="opacity-90 w-full [text-align-last:justify]">런텐 플래시 활동</p>
                    <p className="opacity-90 w-full [text-align-last:justify]">런텐 티어 시스템</p>
                    <p className="opacity-90 w-full [text-align-last:justify]">런텐 랭커 등록</p>
                  </div>
                </div>
              </div>
              {/* 우측: C - B와 동일 선상 우하단 */}
              <div className="flex-1 flex items-end justify-end pb-6 md:pb-8 lg:pb-10 text-white">
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-red-600">RUN10</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 런텐 대회 Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#051735] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="flex items-center justify-center gap-2 text-3xl sm:text-4xl md:text-5xl font-black text-red-600 mb-3 sm:mb-4">
            <Medal className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0" />
            런텐 대회
          </h2>
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <p className="text-base sm:text-lg text-gray-300 mb-1">전국 러닝 성지에서 펼쳐지는 수천명의</p>
            <p className="text-base sm:text-lg text-gray-300">가장 안전하고 깔끔한 10km 레이스</p>
          </div>
          {/* 모바일용 이미지 */}
          <div className="block md:hidden max-w-md mx-auto mb-8 sm:mb-10">
            <Image
              src="/images/grades/subtitle_m.png"
              alt="런텐프로젝트 슬로건"
              width={500}
              height={200}
              className="mx-auto max-w-full h-auto"
              quality={75}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 85vw"
            />
          </div>
          {/* 웹용 이미지 */}
          <div className="hidden md:block max-w-[58rem] mx-auto mb-10 lg:mb-12">
            <Image
              src="/images/grades/subtitle.png"
              alt="런텐프로젝트 슬로건"
              width={1100}
              height={367}
              className="mx-auto max-w-full h-auto"
              quality={75}
              sizes="(max-width: 1024px) 90vw, 85vw"
            />
          </div>
          <Link
            href="/competitions"
            className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-2xl font-black text-lg sm:text-xl md:text-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-red-500"
          >
            대회 확인하기
          </Link>
        </div>
      </section>

      {/* RUN 10 티어 Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#0F0F0F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="flex items-center justify-center gap-2 text-3xl sm:text-4xl md:text-5xl font-black text-red-600 mb-3 sm:mb-4">
              <ChartNoAxesColumnIncreasing className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0" />
              런텐 티어
            </h2>
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <p className="text-base sm:text-lg text-gray-300 mb-1">나의 RUN10 티어를 확인해 보세요.</p>
              <p className="text-base sm:text-lg text-gray-300">마이페이지에서 언제든지 수정 가능합니다.</p>
            </div>
          </div>

          {/* 모바일/앱용 단일 이미지 */}
          <div className="block md:hidden">
            <Image
              src="/images/grades/main_m.png"
              alt="RUN10 티어"
              width={500}
              height={600}
              className="w-full h-auto mx-auto"
              quality={75}
              sizes="100vw"
            />
          </div>

          {/* 웹용 4개 부족 이미지 */}
          <div className="hidden md:grid grid-cols-4 gap-6">
            {/* 치타족 */}
            <div className="text-center">
              <Image
                src="/images/grades/main_cheetah.png"
                alt="치타족"
                width={300}
                height={350}
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                quality={75}
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>

            {/* 홀스족 */}
            <div className="text-center">
              <Image
                src="/images/grades/main_house.png"
                alt="홀스족"
                width={300}
                height={350}
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                quality={75}
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>

            {/* 울프족 */}
            <div className="text-center">
              <Image
                src="/images/grades/main_wolf.png"
                alt="울프족"
                width={300}
                height={350}
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                quality={75}
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>

            {/* 터틀족 */}
            <div className="text-center">
              <Image
                src="/images/grades/main_turtle.png"
                alt="터틀족"
                width={300}
                height={350}
                className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                quality={75}
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 런텐 플래시 Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="flex items-center justify-center gap-2 text-3xl sm:text-4xl md:text-5xl font-black text-red-600 mb-3 sm:mb-4">
              <Zap className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0" fill="currentColor" />
              런텐 플래시
            </h2>
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <p className="text-base sm:text-lg text-gray-600 mb-1">갑자기 동네에서 10명 이하로 함께 뛰고 싶을때</p>
              <p className="text-base sm:text-lg text-gray-600">신개념 러닝번개</p>
            </div>
          </div>

          {/* 모바일용 이미지 */}
          <div className="block md:hidden mb-8">
            <Image
              src="/images/grades/flash_m.png"
              alt="런텐 플래시"
              width={500}
              height={600}
              className="w-full h-auto mx-auto"
              quality={75}
              sizes="100vw"
            />
          </div>

          {/* 웹용 이미지 */}
          <div className="hidden md:block mb-10 lg:mb-12">
            <Image
              src="/images/grades/flash.png"
              alt="런텐 플래시"
              width={1200}
              height={500}
              className="w-full h-auto mx-auto rounded-lg"
              quality={75}
              sizes="(max-width: 1024px) 90vw, 85vw"
            />
          </div>

          <div className="text-center">
            <Link
              href="/flash"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-2xl font-black text-lg sm:text-xl md:text-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-red-500"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="currentColor" />
              런텐플래시 GO
            </Link>
          </div>
        </div>
      </section>

      {/* RUN10 랭커 Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="flex items-center justify-center gap-2 text-3xl sm:text-4xl md:text-5xl font-black text-red-600 mb-3 sm:mb-4">
              <Trophy className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0" />
              런텐 랭커
            </h2>
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <p className="text-base sm:text-lg text-white mb-1">RUN10 랭커에 도전하세요.</p>
              <p className="text-base sm:text-lg text-white">모든 대회 기록을 반영한 현재 시점 통합 랭킹입니다.</p>
            </div>
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
                      <Image
                        src={image}
                        alt={`남성 랭커 ${index + 1}위`}
                        width={400}
                        height={500}
                        className="w-full h-auto rounded-lg"
                        quality={75}
                        sizes="100vw"
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
                      <Image
                        src={image}
                        alt={`여성 랭커 ${index + 1}위`}
                        width={400}
                        height={500}
                        className="w-full h-auto rounded-lg"
                        quality={75}
                        sizes="100vw"
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
                <Image
                  src="/images/rank/r01.png"
                  alt="남성 랭커 1위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <Image
                  src="/images/rank/r02.png"
                  alt="남성 랭커 2위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <Image
                  src="/images/rank/r03.png"
                  alt="남성 랭커 3위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <Image
                  src="/images/rank/r04.png"
                  alt="남성 랭커 4위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </div>

            {/* 여성 랭커 */}
            <div className="grid grid-cols-4 gap-6 mb-8 sm:mb-12">
              <div className="text-center">
                <Image
                  src="/images/rank/r05.png"
                  alt="여성 랭커 1위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <Image
                  src="/images/rank/r06.png"
                  alt="여성 랭커 2위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <Image
                  src="/images/rank/r07.png"
                  alt="여성 랭커 3위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <Image
                  src="/images/rank/r08.png"
                  alt="여성 랭커 4위"
                  width={300}
                  height={350}
                  className="w-full h-auto max-w-full mx-auto rounded-lg shadow-lg"
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
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
                <Image
                  src="/images/app_icon.png"
                  alt="런텐 앱 아이콘"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg shadow-md"
                  quality={75}
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
