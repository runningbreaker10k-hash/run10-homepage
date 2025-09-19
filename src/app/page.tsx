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
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'published')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1)

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
      <section className="relative h-[60vh] flex items-center justify-end">
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
        
        {/* 텍스트 오버레이 - 우측 하단 */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-end">
            <div className="text-right text-white">
              <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight">
                <span className="block">we are</span>
                <span className="block text-red-500">run 10</span>
              </h1>
              <div className="space-y-1 text-lg md:text-xl font-light">
                <p className="opacity-90">we can run 10</p>
                <p className="opacity-90">we must run 10</p>
                <p className="opacity-90">we like run 10</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 런텐프로젝트 슬로건 Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-red-600 mb-4 tracking-tight">
              런텐프로젝트
            </h2>
            <p className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              국민 모두 10km 뛸 수 있다
            </p>
            <div className="w-16 h-1 bg-red-600 mx-auto"></div>
          </div>
        </div>
      </section>

      {/* 현재 모집중인 대회 Section - 대회 홍보 */}
      <section className="py-20 bg-red-600 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* 대회 이미지 */}
              <div className="order-2 lg:order-1">
                <div 
                  className="w-full h-96 bg-cover bg-center bg-no-repeat rounded-lg shadow-2xl"
                  style={{
                    backgroundImage: upcomingCompetitions.length > 0 && upcomingCompetitions[0]?.image_url 
                      ? `url('${upcomingCompetitions[0].image_url}')` 
                      : "url('/images/competition-bg.jpg')"
                  }}
                >
                  <div className="w-full h-full rounded-lg flex items-end">
                    <div className="p-6 text-white">
                      <div className="bg-red-600 px-4 py-2 rounded-lg inline-block mb-4">
                        <span className="text-sm font-bold">
                          {upcomingCompetitions.length > 0 ? '접수중' : 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 대회 정보 */}
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">
                  <span className="block text-white">
                    {upcomingCompetitions.length > 0 && upcomingCompetitions[0] 
                      ? upcomingCompetitions[0].title 
                      : 'JUST RUN 10'
                    }
                  </span>
                </h2>
                
                {upcomingCompetitions.length > 0 && upcomingCompetitions[0] ? (
                  <div className="space-y-5 mb-8">
                    <div className="flex items-center justify-center lg:justify-start text-xl">
                      <Calendar className="h-6 w-6 mr-3" />
                      <span>{format(new Date(upcomingCompetitions[0].date), 'yyyy년 M월 d일')}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-xl">
                      <MapPin className="h-6 w-6 mr-3" />
                      <span>{upcomingCompetitions[0].location}</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-xl">
                      <Clock className="h-6 w-6 mr-3" />
                      <span>신청마감: {format(new Date(upcomingCompetitions[0].registration_end), 'M월 d일')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 mb-8">
                    <div className="flex items-center justify-center lg:justify-start text-xl">
                      <Calendar className="h-6 w-6 mr-3" />
                      <span>2025년 10월 11일</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-xl">
                      <MapPin className="h-6 w-6 mr-3" />
                      <span>한강공원 일원</span>
                    </div>
                    <div className="flex items-center justify-center lg:justify-start text-xl">
                      <Clock className="h-6 w-6 mr-3" />
                      <span>신청마감: 9월 27일</span>
                    </div>
                  </div>
                )}
                
                <Link
                  href={upcomingCompetitions.length > 0 && upcomingCompetitions[0] 
                    ? `/competitions/${upcomingCompetitions[0].id}` 
                    : '/competitions'
                  }
                  className="bg-white text-red-600 px-12 py-4 rounded-lg font-bold text-xl inline-block"
                >
                  대회 참가하기
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RUN 10 티어 Section - 볼타족 크게 + 4개 순차 배치 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-red-600 mb-4">
              RUN 10 티어
            </h2>
          </div>
          
          {/* 볼타족 - 상단에 크게 배치 */}
          <div className="flex justify-center mb-16">
            <div className="bg-black text-white p-12 text-center max-w-lg">
              <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Zap className="h-16 w-16 text-black" />
              </div>
              <h3 className="text-4xl font-bold mb-4">볼타족</h3>
              <p className="text-yellow-400 text-xl mb-6">Volta Tribe</p>
              <h4 className="text-2xl font-semibold mb-4">전설의 러닝 지배자</h4>
              <p className="text-gray-300 text-lg">전국 10km 대회에서 우승한 러너만 획득할 수 있는 런텐 탑티어</p>
            </div>
          </div>

          {/* 나머지 4개 족 - 하단에 한 줄로 배치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 터틀족 */}
            <div className="bg-black text-white p-6 text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/grades/turtle.png" alt="터틀족" className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">터틀족</h3>
              <p className="text-yellow-400 text-sm mb-3">Turtle Tribe</p>
              <h4 className="text-lg font-semibold mb-2">완주의 수호자</h4>
              <p className="text-gray-300 text-xs">끈기의 상징, 느리지만 반드시 결승선을 밟는 자들</p>
            </div>

            {/* 울프족 */}
            <div className="bg-black text-white p-6 text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/grades/wolf.png" alt="울프족" className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">울프족</h3>
              <p className="text-yellow-400 text-sm mb-3">Wolf Tribe</p>
              <h4 className="text-lg font-semibold mb-2">달리는 전사들</h4>
              <p className="text-gray-300 text-xs">무리의 힘, 끈기와 협동으로 완주하는 자들</p>
            </div>

            {/* 홀스족 */}
            <div className="bg-black text-white p-6 text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/grades/horse.png" alt="홀스족" className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">홀스족</h3>
              <p className="text-yellow-400 text-sm mb-3">Horse Tribe</p>
              <h4 className="text-lg font-semibold mb-2">강철의 다리</h4>
              <p className="text-gray-300 text-xs">강인한 지구력, 끝까지 흔들림 없는 질주</p>
            </div>

            {/* 치타족 */}
            <div className="bg-black text-white p-6 text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/grades/cheetah.png" alt="치타족" className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">치타족</h3>
              <p className="text-yellow-400 text-sm mb-3">Cheetah Tribe</p>
              <h4 className="text-lg font-semibold mb-2">스피드의 왕자들</h4>
              <p className="text-gray-300 text-xs">속도의 화신, 치타처럼 가장 빠른 자들</p>
            </div>
          </div>
        </div>
      </section>

      {/* RUN 10 수칙 5 Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-red-600 mb-4">
              RUN 10 수칙 5
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="border-2 border-gray-300 p-6 text-center rounded-lg">
              <div className="text-4xl font-black text-red-600 mb-4">1</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Warm-up</h3>
              <p className="text-gray-600">워밍업을 해라</p>
            </div>
            
            <div className="border-2 border-gray-300 p-6 text-center rounded-lg">
              <div className="text-4xl font-black text-red-600 mb-4">2</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pace</h3>
              <p className="text-gray-600">페이스를 지켜라</p>
            </div>
            
            <div className="border-2 border-gray-300 p-6 text-center rounded-lg">
              <div className="text-4xl font-black text-red-600 mb-4">3</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hydrate</h3>
              <p className="text-gray-600">물을 마셔라</p>
            </div>
            
            <div className="border-2 border-gray-300 p-6 text-center rounded-lg">
              <div className="text-4xl font-black text-red-600 mb-4">4</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rest</h3>
              <p className="text-gray-600">힘들면 멈춰라</p>
            </div>
            
            <div className="border-2 border-gray-300 p-6 text-center rounded-lg">
              <div className="text-4xl font-black text-red-600 mb-4">5</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stretch</h3>
              <p className="text-gray-600">스트레칭으로 끝내라</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}