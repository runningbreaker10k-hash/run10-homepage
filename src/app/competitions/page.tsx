'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'


type CompetitionWithGroups = Competition & {
  participation_groups?: Array<{
    id: string
    name: string
    distance: string
    max_participants: number
    entry_fee: number
  }>
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<CompetitionWithGroups[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'closed' | 'upcoming'>('all')

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select(`
          *,
          participation_groups (
            id,
            name,
            distance,
            max_participants,
            entry_fee
          )
        `)
        .eq('status', 'published')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching competitions:', error)
        setCompetitions([])
        setLoading(false)
        return
      }

      setCompetitions(data || [])
    } catch (error) {
      console.error('Error:', error)
      setCompetitions([])
    } finally {
      setLoading(false)
    }
  }

  // 대회번호 생성 (YYYYMMDD 형식)
  const getCompetitionNumber = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  // 종목 표시 (거리만 모아서)
  const getDistancesText = (competition: CompetitionWithGroups) => {
    if (!competition.participation_groups || competition.participation_groups.length === 0) {
      return '10km 코스'
    }

    const distances = competition.participation_groups
      .map(group => group.distance)
      .filter((distance, index, self) => self.indexOf(distance) === index) // 중복 제거
      .sort()
      .map(distance => `${distance} 코스`)
      .join(' / ')

    return distances || '10km 코스'
  }

  const getActualCompetitionStatus = (competition: Competition) => {
    const now = new Date()
    const competitionDate = new Date(competition.date)
    const registrationStart = new Date(competition.registration_start)
    const registrationEnd = new Date(competition.registration_end)

    // 대회 종료
    if (competitionDate < now) {
      return 'closed'
    }

    // 신청 시작 전 (예정)
    if (registrationStart > now) {
      return 'upcoming'
    }

    // 신청 마감 또는 정원 마감
    if (registrationEnd < now || competition.current_participants >= competition.max_participants) {
      return 'registration_closed'
    }

    // 마감 임박 (7일 이내)
    const hoursUntilEnd = (registrationEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntilEnd <= 168 && hoursUntilEnd > 0) {
      return 'deadline_approaching'
    }

    // 신청 진행 중
    return 'ongoing'
  }

  const filteredCompetitions = competitions.filter(competition => {
    // 검색 필터
    const matchesSearch = competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competition.location.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // 상태 필터
    if (statusFilter === 'all') return true

    const actualStatus = getActualCompetitionStatus(competition)

    if (statusFilter === 'ongoing') {
      return actualStatus === 'ongoing' || actualStatus === 'deadline_approaching' || actualStatus === 'registration_closed'
    }

    if (statusFilter === 'closed') {
      return actualStatus === 'closed'
    }

    if (statusFilter === 'upcoming') {
      return actualStatus === 'upcoming'
    }

    return true
  })

  useEffect(() => {
    fetchCompetitions()
  }, [statusFilter])

  const getStatusBadge = (competition: Competition) => {
    const actualStatus = getActualCompetitionStatus(competition)

    // 종료
    if (actualStatus === 'closed') {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white text-gray-800 shadow-md">
          종료
        </span>
      )
    }

    // 예정
    if (actualStatus === 'upcoming') {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white text-blue-600 shadow-md">
          예정
        </span>
      )
    }

    // 마감 임박
    if (actualStatus === 'deadline_approaching') {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white text-amber-600 shadow-md">
          마감 임박
        </span>
      )
    }

    // 접수마감 (대회는 남았지만 신청 마감)
    if (actualStatus === 'registration_closed') {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white text-orange-600 shadow-md">
          접수마감
        </span>
      )
    }

    // 진행중
    return (
      <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white text-red-600 shadow-md">
        진행
      </span>
    )
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        {/* 배경 이미지 공간 */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/competitions-hero-bg.jpg"
            alt="런텐 대회 배경"
            fill
            quality={60}
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">런텐 대회</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">
            PB(Personal Best) 달성이 쉬운 가장 확실한 공식 대회
          </p>
        </div>
      </section>

      {/* 대회 소개 섹션 - 주석 처리 */}
      {/*
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">

            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Flag className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">병목 없는</h3>
              <p className="text-sm text-gray-600">
                티어 출발
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Minus className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">업힐 없는</h3>
              <p className="text-sm text-gray-600">
                평지 코스
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">차량 없는</h3>
              <p className="text-sm text-gray-600">
                안전 코스
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Waves className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">전국 강변</h3>
              <p className="text-sm text-gray-600">
                힐링 코스
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">100명 이상</h3>
              <p className="text-sm text-gray-600">
                경품 당첨
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">5km 러너</h3>
              <p className="text-sm text-gray-600">
                기록칩 제공
              </p>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* 대회 목록 섹션 */}
      <section className="pt-8 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">대회 일정 확인법</h2>
            
            <div className="text-base text-gray-600 space-y-1">
              <p><span className="font-bold text-gray-800">종료</span>: 이미 마감된 대회</p>
              <p><span className="font-bold text-red-600">진행</span>: 현재 접수중 대회</p>
              <p><span className="font-bold text-blue-600">예정</span>: 앞으로 열릴 대회</p>
            </div>
          </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* 검색창 */}
            <div className="w-full lg:flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="대회명 또는 지역으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                />
              </div>
            </div>

            {/* 필터 버튼 */}
            <div className="flex gap-2 lg:gap-3 lg:flex-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 px-4 lg:px-6 py-2 rounded-lg font-bold text-sm lg:text-base transition-all ${
                  statusFilter === 'all'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setStatusFilter('ongoing')}
                className={`flex-1 px-4 lg:px-6 py-2 rounded-lg font-bold text-sm lg:text-base transition-all ${
                  statusFilter === 'ongoing'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
                }`}
              >
                진행
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`flex-1 px-4 lg:px-6 py-2 rounded-lg font-bold text-sm lg:text-base transition-all ${
                  statusFilter === 'closed'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
                }`}
              >
                종료
              </button>
              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`flex-1 px-4 lg:px-6 py-2 rounded-lg font-bold text-sm lg:text-base transition-all ${
                  statusFilter === 'upcoming'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
                }`}
              >
                예정
              </button>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        {filteredCompetitions.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">대회가 없습니다</h3>
            <p className="text-gray-500">
              {searchTerm ? '검색 조건에 맞는 대회가 없습니다.' : '곧 새로운 대회가 공개될 예정입니다.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredCompetitions.map((competition) => {
              const actualStatus = getActualCompetitionStatus(competition)
              const isUpcoming = actualStatus === 'upcoming'
              const isOngoing = actualStatus === 'ongoing' || actualStatus === 'deadline_approaching' || actualStatus === 'registration_closed'
              const isClosed = actualStatus === 'closed'

              const cardContent = (
                <>
                  {/* 헤더 - 대회번호 (상태별 배경색) */}
                  <div className={`text-white py-2.5 px-4 text-center ${
                    isClosed ? 'bg-black' :
                    isOngoing ? 'bg-red-600' :
                    'bg-blue-600'
                  }`}>
                    <h4 className="text-base font-bold">
                      런텐대회 No. {getCompetitionNumber(competition.date)}
                    </h4>
                  </div>

                  {/* 대회 이미지 */}
                  <div className="relative h-48">
                    {competition.image_url ? (
                      <Image
                        src={competition.image_url}
                        alt={competition.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={80}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
                        <Trophy className="h-16 w-16 text-white" />
                      </div>
                    )}

                    {/* 좌측상단 - 상태배지 */}
                    <div className="absolute top-3 left-3 z-10">
                      {getStatusBadge(competition)}
                    </div>

                    {/* 우측하단 - 원형 + 버튼 (예정일 때는 표시 안함) */}
                    {!isUpcoming && (
                      <div className="absolute bottom-3 right-3 z-10">
                        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-red-600 font-black text-2xl">
                          +
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 하단 정보 */}
                  <div className="p-5 space-y-2.5">
                    {/* 1. 대회명 */}
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3">
                      {competition.title}
                    </h3>

                    {/* 2. 종목 */}
                    <div className="text-sm text-gray-600 flex">
                      <span className="font-medium text-gray-700 w-12">종목</span>
                      <span className="flex-1">{getDistancesText(competition)}</span>
                    </div>

                    {/* 3. 일시 */}
                    <div className="text-sm text-gray-600 flex">
                      <span className="font-medium text-gray-700 w-12">일시</span>
                      <span className="flex-1">
                        {format(new Date(competition.date), 'yyyy. M. d (E) HH:mm', { locale: ko })}
                      </span>
                    </div>

                    {/* 4. 장소 */}
                    <div className="text-sm text-gray-600 flex">
                      <span className="font-medium text-gray-700 w-12">장소</span>
                      <span className="flex-1">{competition.location}</span>
                    </div>

                    {/* 5. 신청 */}
                    <div className="text-sm text-gray-600 flex">
                      <span className="font-medium text-gray-700 w-12">신청</span>
                      <span className={`flex-1 ${isOngoing ? 'text-red-600 font-medium' : ''}`}>
                        {isUpcoming && (
                          <>
                            {format(new Date(competition.registration_start), 'yyyy. M. d (E)', { locale: ko })}
                            {' ~ 선착순 접수'}
                          </>
                        )}
                        {isClosed && '마감 종료'}
                        {isOngoing && '※ 선착순 3,500명 모집'}
                      </span>
                    </div>
                  </div>
                </>
              )

              return isUpcoming ? (
                <div
                  key={competition.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden transition-all cursor-not-allowed opacity-75"
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={competition.id}
                  href={`/competitions/${competition.id}`}
                  className="bg-white rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-xl"
                >
                  {cardContent}
                </Link>
              )
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  )
}