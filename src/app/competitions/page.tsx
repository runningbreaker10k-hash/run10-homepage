'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, Trophy, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { format } from 'date-fns'

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'closed'>('published')

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
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

  const getActualCompetitionStatus = (competition: Competition) => {
    const now = new Date()
    const competitionDate = new Date(competition.date)
    const registrationEnd = new Date(competition.registration_end)
    
    if (competitionDate < now) {
      return 'closed'
    }
    
    if (registrationEnd < now || competition.current_participants >= competition.max_participants) {
      return 'registration_closed'
    }
    
    return 'published'
  }

  const filteredCompetitions = competitions.filter(competition => {
    // 검색 필터
    const matchesSearch = competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competition.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    // 상태 필터
    if (statusFilter === 'all') return true
    
    const actualStatus = getActualCompetitionStatus(competition)
    
    if (statusFilter === 'published') {
      return actualStatus === 'published' || actualStatus === 'registration_closed'
    }
    
    if (statusFilter === 'closed') {
      return actualStatus === 'closed'
    }
    
    return true
  })

  useEffect(() => {
    fetchCompetitions()
  }, [statusFilter])

  const getStatusBadge = (competition: Competition) => {
    const now = new Date()
    const registrationEnd = new Date(competition.registration_end)
    const competitionDate = new Date(competition.date)

    if (competition.status === 'closed' || competitionDate < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          종료
        </span>
      )
    }

    if (registrationEnd < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          접수마감
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        접수중
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
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20 overflow-hidden">
        {/* 배경 이미지 공간 */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/competitions-hero-bg.jpg"
            alt="런텐 대회 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">런텐 대회</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            전국 각지에서 개최되는 다양한 러닝 대회에 참여하세요
          </p>
        </div>
      </section>

      {/* 대회 소개 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">런텐 대회 소개</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              런텐(RUN10)은 전국 각지에서 개최되는 다양한 러닝 대회를 통해 러너들의 꿈과 도전을 응원합니다.
              초보자부터 전문 러너까지, 모든 분들이 함께 즐길 수 있는 대회를 준비했습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">다양한 대회</h3>
              <p className="text-gray-600">
                10km부터 하프마라톤까지 다양한 거리의 대회를 전국 각지에서 개최합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">커뮤니티</h3>
              <p className="text-gray-600">
                같은 목표를 가진 러너들과 함께 달리며 새로운 인연을 만들어보세요.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">정기 개최</h3>
              <p className="text-gray-600">
                매월 정기적으로 개최되는 대회를 통해 꾸준한 러닝 목표를 달성하세요.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">대회 참가 혜택</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="font-semibold text-blue-600 mb-2">완주메달</div>
                  <p className="text-sm text-gray-600">모든 완주자에게 기념품 제공</p>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600 mb-2">기록 측정</div>
                  <p className="text-sm text-gray-600">정확한 개인 기록 측정</p>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600 mb-2">시상품</div>
                  <p className="text-sm text-gray-600">연령대별 시상품 수여</p>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600 mb-2">참가증명서</div>
                  <p className="text-sm text-gray-600">공식 참가증명서 발급</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 대회 목록 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">참가 가능한 대회</h2>
            <p className="text-lg text-gray-600">지금 신청 가능한 대회를 확인하고 참가해보세요!</p>
          </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="대회명 또는 지역으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'closed')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">전체</option>
                <option value="published">진행중</option>
                <option value="closed">종료</option>
              </select>
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
              const isClosed = getActualCompetitionStatus(competition) === 'closed'
              
              return (
                <div key={competition.id} className={`rounded-xl shadow-lg overflow-hidden transition-shadow ${
                  isClosed 
                    ? 'bg-gray-100 opacity-60' 
                    : 'bg-white hover:shadow-xl'
                }`}>
                  {/* Image Placeholder */}
                  <div className="relative">
                    {competition.image_url ? (
                      <img
                        src={competition.image_url}
                        alt={competition.title}
                        className={`w-full h-48 object-cover ${isClosed ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className={`w-full h-48 flex items-center justify-center ${
                        isClosed 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
                          : 'bg-gradient-to-r from-blue-400 to-purple-500'
                      }`}>
                        <Trophy className={`h-16 w-16 ${isClosed ? 'text-gray-300' : 'text-white'}`} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      {getStatusBadge(competition)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${
                      isClosed ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {competition.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center ${isClosed ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">
                          {format(new Date(competition.date), 'yyyy년 M월 d일 HH:mm')}
                        </span>
                      </div>
                      <div className={`flex items-center ${isClosed ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{competition.location}</span>
                      </div>
                      <div className={`flex items-center ${isClosed ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">
                          신청마감: {format(new Date(competition.registration_end), 'M월 d일')}
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm mb-4 line-clamp-2 ${
                      isClosed ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {competition.description}
                    </p>

                    <div className="flex justify-end">
                      {isClosed ? (
                        <span className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed">
                          종료됨
                        </span>
                      ) : (
                        <Link
                          href={`/competitions/${competition.id}`}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          신청하기
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  )
}