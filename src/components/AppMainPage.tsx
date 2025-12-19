'use client'

import Link from 'next/link'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { ErrorHandler } from '@/lib/errorHandler'
import { SectionLoading } from '@/components/LoadingSpinner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import PagePopup from '@/components/PagePopup'

export default function AppMainPage() {
  type UpcomingCompetition = {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    registration_end: string;
    image_url?: string;
    entry_fee: number;
    max_participants: number;
    current_participants: number;
  }

  const [upcomingCompetitions, setUpcomingCompetitions] = useState<UpcomingCompetition[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const slideImages = [
    '/images/main_s01.png',
    '/images/main_s02.png',
    '/images/main_s03.png'
  ]

  useEffect(() => {
    fetchUpcomingCompetitions()
  }, [])

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length)
    }, 2500) // 7초마다 전환

    return () => clearInterval(interval)
  }, [isPaused, slideImages.length])

  const fetchUpcomingCompetitions = async () => {
    try {
      const now = new Date()
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString()
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, description, date, location, registration_end, image_url, entry_fee, max_participants, current_participants')
        .eq('status', 'published')
        .gte('registration_end', localNow)
        .order('registration_end', { ascending: true })
        .limit(1)

      if (error) {
        const appError = ErrorHandler.handle(error)
        ErrorHandler.logError(appError, 'AppMainPage.fetchUpcomingCompetitions')
        setUpcomingCompetitions([])
      } else {
        setUpcomingCompetitions(data || [])
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      ErrorHandler.logError(appError, 'AppMainPage.fetchUpcomingCompetitions')
      setUpcomingCompetitions([])
    } finally {
      setLoading(false)
    }
  }

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
      <section className="py-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <div className="max-w-md mx-auto px-4 text-center">
          <img
            src="/images/grades/subtitle.png"
            alt="런텐프로젝트 슬로건"
            className="mx-auto max-w-full h-auto"
          />
        </div>
      </section>

      {/* 현재 모집중인 대회 - 카드 스타일 */}
      <section className="py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              모집중인 대회
            </h2>
            <p className="text-sm text-gray-600">
              지금 바로 참가 신청하세요!
            </p>
          </div>

          {loading ? (
            <SectionLoading height="h-96" text="대회 정보를 불러오는 중..." />
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {upcomingCompetitions.length > 0 && upcomingCompetitions[0] ? (
                <>
                  {/* 대회 이미지 슬라이드쇼 */}
                  <div
                    className="relative h-56 overflow-hidden"
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
                    <div className="absolute inset-0 z-10" style={{backgroundColor: '#000000B3'}}></div>

                    {/* 대회 특장점 텍스트 */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4 z-20">
                      <div className="text-center space-y-3">
                        <div className="space-y-2 text-sm sm:text-base font-medium" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                          <p>가족과 친구와 함께 전국 명소를 누비며</p>
                          <p>매달 전국 각지에서 펼쳐지는 레이스</p>
                          <p>3~4천명 규모의 적지도, 많지도 않은</p>
                          <p>전국러닝협회 기록 인증 10km 대회</p>
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

                  {/* 대회 정보 */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <Calendar className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-gray-900 text-lg">
                          {format(new Date(upcomingCompetitions[0].date), 'yyyy년 M월 d일 (E)', { locale: ko })}
                        </div>
                        <div className="text-base text-red-600 font-bold mt-1">
                          {format(new Date(upcomingCompetitions[0].date), 'HH:mm')} 시작
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <MapPin className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-base">{upcomingCompetitions[0].location}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Clock className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <span className="text-gray-900 font-bold text-base">
                        신청마감: {format(new Date(upcomingCompetitions[0].registration_end), 'M월 d일')}
                      </span>
                    </div>

                    {/* 대회 확인 버튼 */}
                    <Link
                      href={`/competitions/${upcomingCompetitions[0].id}`}
                      className="block mt-6 bg-gradient-to-r from-red-600 to-red-700 text-white py-5 rounded-2xl font-black text-center text-xl shadow-xl active:from-red-700 active:to-red-800 active:shadow-2xl transform active:scale-95 transition-all duration-300 border-2 border-red-500"
                    >
                      대회 확인하기
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-900 font-bold text-lg mb-2">
                    2025 대회 접수가 마감되었습니다
                  </p>
                  <p className="text-gray-600 text-base mb-6">
                    새로운 2월 대회가 곧 공개됩니다
                  </p>
                  <Link
                    href="/competitions"
                    className="block bg-gray-700 text-white py-4 rounded-2xl font-bold text-center text-lg shadow-lg active:shadow-md transform active:scale-98 transition-all"
                  >
                    대회 목록 보기
                  </Link>
                </div>
              )}
            </div>
          )}
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
