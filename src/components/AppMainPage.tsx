'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import PagePopup from '@/components/PagePopup'
import { useUTMTracking } from '@/hooks/useUTMTracking'

export default function AppMainPage() {
  // UTM 파라미터 추적
  useUTMTracking()
  const [currentMaleRanker, setCurrentMaleRanker] = useState(0)
  const [currentFemaleRanker, setCurrentFemaleRanker] = useState(0)

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 메인 페이지 팝업 */}
      <PagePopup pageId="home" />

      {/* Hero Section */}
      <section className="relative w-full">
        <Image
          src="/images/main_bg_m.jpg"
          alt="러너 배경"
          width={800}
          height={1200}
          className="w-full h-auto"
          quality={75}
          priority
        />
      </section>

      {/* 런텐 대회 Section */}
      <section className="py-8 px-4 bg-[#051735] text-white">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-black text-red-600 mb-2">
            런텐 대회
          </h2>
          <div className="mb-6">
            <p className="text-sm sm:text-base text-gray-300 mb-0.5">전국 러닝 성지에서 펼쳐지는</p>
            <p className="text-sm sm:text-base text-gray-300">10km 공식 인증 대회</p>
          </div>
          <div className="mb-6">
            <Image
              src="/images/grades/subtitle_m.png"
              alt="런텐프로젝트 슬로건"
              width={500}
              height={200}
              className="mx-auto max-w-full h-auto"
              quality={75}
              sizes="100vw"
            />
          </div>
          <Link
            href="/competitions"
            className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black text-lg sm:text-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 border-2 border-red-500"
          >
            대회 일정 확인하기
          </Link>
        </div>
      </section>

      {/* RUN10 티어 */}
      <section className="py-8 px-4 bg-[#0F0F0F] text-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-red-600 mb-2">
              런텐 티어
            </h2>
            <div className="mt-2">
              <p className="text-sm sm:text-base text-gray-300 mb-0.5">나의 RUN10 티어를 확인해 보세요.</p>
              <p className="text-sm sm:text-base text-gray-300">마이페이지에서 언제든지 수정 가능합니다.</p>
            </div>
          </div>

          {/* 티어 단일 이미지 */}
          <div>
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
        </div>
      </section>

      {/* 런텐 플래시 Section */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-red-600 mb-2">
              런텐 플래시
            </h2>
            <div className="mt-2">
              <p className="text-sm sm:text-base text-gray-600 mb-0.5">갑자기 동네에서 10명 이하로 함께 뛰고 싶을때</p>
              <p className="text-sm sm:text-base text-gray-600">신개념 러닝번개</p>
            </div>
          </div>

          <div className="mb-6">
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

          <div className="text-center">
            <Link
              href="/flash"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black text-lg sm:text-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 border-2 border-red-500"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
              런텐플래시 GO
            </Link>
          </div>
        </div>
      </section>

      {/* RUN10 랭커 Section */}
      <section className="py-8 px-4 bg-black text-white">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-red-600 mb-2">
              런텐 랭커
            </h2>
            <div className="mt-2">
              <p className="text-sm sm:text-base text-white mb-0.5">RUN10 랭커에 도전하세요.</p>
              <p className="text-sm sm:text-base text-white">모든 대회 기록을 반영한 현재 시점 통합 랭킹입니다.</p>
            </div>
          </div>

          {/* 남성 랭커 슬라이드 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 text-center">남성 랭커</h3>
            <div className="relative w-full">
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
          <div className="mb-12">
            <h3 className="text-lg font-bold text-white mb-4 text-center">여성 랭커</h3>
            <div className="relative w-full">
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

          {/* 더보기 버튼 */}
          <div className="text-center">
            <Link
              href="/rank"
              className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black text-lg sm:text-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 border-2 border-red-500"
            >
              더보기 +
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
