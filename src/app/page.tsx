'use client'

import Link from 'next/link'
import { Calendar, Users, Trophy, MapPin, Clock, Star, Zap, Target, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'

export default function Home() {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingCompetitions()
  }, [])

  const fetchUpcomingCompetitions = async () => {
    try {
      const now = new Date()
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'published')
        .gte('registration_end', now.toISOString()) // 신청 마감일이 현재 시점보다 나중인 것
        .order('registration_end', { ascending: true }) // 마감일이 가까운 순서로 정렬
        .limit(1) // 하나의 대회만 가져오기

      if (error) {
        console.error('Error fetching competitions:', error)
        setUpcomingCompetitions([])
      } else {
        setUpcomingCompetitions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
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

        {/* 텍스트 오버레이 - 모바일에서는 중앙, 데스크톱에서는 우측 */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-center sm:justify-end">
            <div className="text-center sm:text-right text-white">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 sm:mb-6 tracking-tight">
                <span className="block">we are</span>
                <span className="block text-red-500">RUN10</span>
              </h1>
              <div className="space-y-1 text-base sm:text-lg md:text-xl font-light">
                <p className="opacity-90">we can RUN10</p>
                <p className="opacity-90">we must RUN10</p>
                <p className="opacity-90">we like RUN10</p>
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
            <div className="flex justify-center py-12 sm:py-20">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* 대회 이미지 */}
              <div className="order-2 lg:order-1">
                <div
                  className="w-full h-64 sm:h-80 lg:h-96 bg-cover bg-center bg-no-repeat rounded-lg shadow-2xl"
                  style={{
                    backgroundImage: upcomingCompetitions.length > 0 && upcomingCompetitions[0]?.image_url
                      ? `url('${upcomingCompetitions[0].image_url}')`
                      : "url('/images/competition-bg.jpg')"
                  }}
                >
                  <div className="w-full h-full rounded-lg flex items-end">
                    <div className="p-4 sm:p-6 text-white">
                      <div className="bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg inline-block">
                        <span className="text-xs sm:text-sm font-bold">
                          {upcomingCompetitions.length > 0 ? '접수중' : 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 대회 정보 */}
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-6 sm:mb-8 tracking-tight leading-tight">
                  <span className="block text-white">
                    {upcomingCompetitions.length > 0 && upcomingCompetitions[0]
                      ? upcomingCompetitions[0].title
                      : 'JUST RUN 10'
                    }
                  </span>
                </h2>

                {upcomingCompetitions.length > 0 && upcomingCompetitions[0] ? (
                  <div className="space-y-3 sm:space-y-5 mb-6 sm:mb-8">
                    <div className="flex items-center justify-center lg:justify-start text-base sm:text-lg lg:text-xl">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="break-words">{format(new Date(upcomingCompetitions[0].date), 'yyyy년 M월 d일')}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-base sm:text-lg lg:text-xl">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="break-words">{upcomingCompetitions[0].location}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-base sm:text-lg lg:text-xl">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="break-words">신청마감: {format(new Date(upcomingCompetitions[0].registration_end), 'M월 d일')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-5 mb-6 sm:mb-8">
                    <div className="flex items-center justify-center lg:justify-start text-base sm:text-lg lg:text-xl">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>새로운 대회가 곧 공개됩니다</span>
                    </div>
                  </div>
                )}

                <Link
                  href={upcomingCompetitions.length > 0 && upcomingCompetitions[0]
                    ? `/competitions/${upcomingCompetitions[0].id}`
                    : '/competitions'
                  }
                  className="bg-white text-red-600 px-8 py-3 sm:px-12 sm:py-4 rounded-lg font-bold text-lg sm:text-xl inline-block hover:bg-gray-100 transition-colors"
                >
                  대회 참가하기
                </Link>
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
            <p className="text-lg sm:text-xl md:text-2xl text-black mb-6 sm:mb-8 lg:mb-12">
              나의 RUN10 티어를 확인해 보세요.
            </p>
          </div>

          {/* 4개 부족 이미지 - 반응형 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-6">
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
