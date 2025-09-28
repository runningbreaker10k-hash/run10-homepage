'use client'

import Link from 'next/link'
import { Calendar, Users, Trophy, MapPin, Clock, Star, Zap, Target, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { ErrorHandler } from '@/lib/errorHandler'
import { SectionLoading } from '@/components/LoadingSpinner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingCompetitions()
  }, [])

  const fetchUpcomingCompetitions = async () => {
    try {
      const now = new Date()
      // 로컬 타임존으로 날짜 비교 (UTC 변환 방지)
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString()
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, description, date, location, registration_end, image_url, entry_fee')
        .eq('status', 'published')
        .gte('registration_end', localNow) // 신청 마감일이 현재 시점보다 나중인 것
        .order('registration_end', { ascending: true }) // 마감일이 가까운 순서로 정렬
        .limit(1) // 하나의 대회만 가져오기

      if (error) {
        const appError = ErrorHandler.handle(error)
        ErrorHandler.logError(appError, 'Home.fetchUpcomingCompetitions')
        setUpcomingCompetitions([])
      } else {
        setUpcomingCompetitions(data || [])
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      ErrorHandler.logError(appError, 'Home.fetchUpcomingCompetitions')
      setUpcomingCompetitions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
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

        {/* 텍스트 오버레이 - 텍스트2(왼쪽 상단), 텍스트1(오른쪽 하단) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full">
          {/* 텍스트2 - 왼쪽 상단 텍스트 */}
          <div className="absolute top-16 left-4 lg:left-8">
            <div className="text-left text-white">
              <div className="space-y-2 text-lg md:text-2xl font-medium leading-relaxed">
                <p className="opacity-90">전국 러닝 협회가 인증하는</p>
                <p className="opacity-90">10km 러너들의 공식 플랫폼</p>
              </div>
            </div>
          </div>

          {/* 텍스트1 - 오른쪽 하단 텍스트 */}
          <div className="flex justify-end absolute bottom-16 lg:bottom-20 right-4 lg:right-8">
            <div className="text-right text-white">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 tracking-tight">
                <span className="block">we are</span>
                <span className="block text-red-500">RUN10</span>
              </h1>
              <div className="space-y-1 text-base sm:text-lg md:text-xl font-light tracking-wider">
                <p className="opacity-90">we&ensp; can RUN10</p>
                <p className="opacity-90">we must RUN10</p>
                <p className="opacity-90">we&ensp; like RUN10</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 런텐프로젝트 슬로건 Section */}
      <section className="py-8 sm:py-12 bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-xs sm:max-w-lg md:max-w-3xl mx-auto">
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
          {loading ? (
            <SectionLoading height="h-80" text="대회 정보를 불러오는 중..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* 대회 이미지 */}
              <div className="order-2 lg:order-1">
                <div
                  className="w-full h-64 sm:h-80 lg:h-96 bg-cover bg-center bg-no-repeat rounded-lg shadow-2xl relative"
                  style={{
                    backgroundImage: upcomingCompetitions.length > 0 && upcomingCompetitions[0]?.image_url
                      ? `url('${upcomingCompetitions[0].image_url}')`
                      : "url('/images/competition-bg.jpg')"
                  }}
                >
                  {/* 배경 오버레이 */}
                  <div className="absolute inset-0 rounded-lg" style={{backgroundColor: '#00000090'}}></div>

                  {/* 대회 특장점 텍스트 */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-4 sm:p-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">
                        JUST RUN 10 대회 특장점
                      </h3>
                      <div className="space-y-2 text-sm sm:text-base lg:text-lg">
                        <p>1. 평지코스 정확한 기록 인증</p>
                        <p>2. 깨끗하고 쾌적한 러닝코스</p>
                        <p>3. 70명 대상 국내 최고 경품</p>
                        <p>4. 수준별 출발 안정적 레이스</p>
                      </div>
                    </div>
                  </div>

                  {/* 접수중/Coming Soon 배지 */}
                  <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                    <div className="bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg inline-block">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        {upcomingCompetitions.length > 0 ? '접수중' : 'Coming Soon'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 대회 정보 */}
              <div className="order-1 lg:order-2 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                <div className="space-y-4 sm:space-y-5">
                  {/* 대회명 */}
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                    {upcomingCompetitions.length > 0 && upcomingCompetitions[0]
                      ? upcomingCompetitions[0].title
                      : 'JUST RUN 10'
                    }
                  </h2>

                  {/* 대회설명 */}
                  {upcomingCompetitions.length > 0 && upcomingCompetitions[0] ? (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-5 sm:p-6 border-l-4 border-red-500 shadow-lg">
                      <div className="flex items-start text-base sm:text-lg mb-3">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-3 flex-shrink-0 text-red-600 mt-1" />
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900">
                            {format(new Date(upcomingCompetitions[0].date), 'yyyy년 M월 d일 (E)', { locale: ko })}
                          </div>
                          <div className="text-red-600 font-semibold text-sm sm:text-base">
                            시작시간: {format(new Date(upcomingCompetitions[0].date), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm sm:text-base mb-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0 text-red-600" />
                        <span className="font-medium text-gray-800">{upcomingCompetitions[0].location}</span>
                      </div>
                      <div className="flex items-center text-sm sm:text-base">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0 text-red-600" />
                        <span className="font-medium text-gray-800">신청마감: {format(new Date(upcomingCompetitions[0].registration_end), 'M월 d일')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 sm:p-6 border-l-4 border-gray-400">
                      <div className="flex items-center text-base sm:text-lg">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-3 flex-shrink-0 text-gray-600" />
                        <span className="font-medium text-gray-800">새로운 대회가 곧 공개됩니다</span>
                      </div>
                    </div>
                  )}

                  {/* 대회참가버튼 */}
                  <Link
                    href={upcomingCompetitions.length > 0 && upcomingCompetitions[0]
                      ? `/competitions/${upcomingCompetitions[0].id}`
                      : '/competitions'
                    }
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-2xl font-black text-lg sm:text-xl md:text-2xl block hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-red-500 w-full text-center"
                  >
                    대회 참가하기
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RUN 10 티어 Section - 4개 부족 이미지 배치 */}
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

          {/* 4개 부족 이미지 - 반응형 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-6">
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

    </div>
  )
}
