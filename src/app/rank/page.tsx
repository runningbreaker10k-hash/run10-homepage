'use client'

import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'

type RankData = {
  rank: number
  name: string
  tier: string
  record: string
  birth_date: string
}

type RankResponse = {
  updated_at: string
  data: RankData[]
}

export default function RankPage() {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [rankData, setRankData] = useState<RankData[]>([])
  const [updatedAt, setUpdatedAt] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankData(gender)
  }, [gender])

  const fetchRankData = async (selectedGender: 'male' | 'female') => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/data/rank-${selectedGender}.json?t=${timestamp}`)

      if (!response.ok) {
        console.error('Failed to fetch rank data')
        setRankData([])
        setUpdatedAt('')
        return
      }

      const result: RankResponse = await response.json()
      setRankData(result.data || [])
      setUpdatedAt(result.updated_at || '')
    } catch (error) {
      console.error('Error fetching rank data:', error)
      setRankData([])
      setUpdatedAt('')
    } finally {
      setLoading(false)
    }
  }

  const getTierImage = (tier: string) => {
    return `/images/grades/${tier}.png`
  }

  const getTierName = (tier: string) => {
    const tierNames: Record<string, string> = {
      cheetah: '치타족',
      horse: '홀스족',
      wolf: '울프족',
      turtle: '터틀족',
      bolt: '볼타족'
    }
    return tierNames[tier] || tier
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/rank-hero-bg.jpg"
            alt="런텐 랭커 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">RUN10 랭크</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">
            전국 러닝 협회 공식 인증 10km 랭커
          </p>
        </div>
      </section>

      {/* 필터 및 랭킹 섹션 */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 티어 소개 제목 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">런텐 랭커에 도전하세요</h2>
          </div>

          {/* 티어 소개 섹션 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {/* 치타족 */}
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mb-3 md:mb-4">
                <img
                  src="/images/grades/cheetah.png"
                  alt="치타족"
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">치타족</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Cheetah Tribe
              </p>
              <div className="text-xs md:text-sm text-gray-700 mb-2">
                <div className="mb-1">남성 30분대 / 여성 40분대</div>
              </div>
              <p className="text-xs text-gray-500">
                스피드의 왕자들
              </p>
            </div>

            {/* 홀스족 */}
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mb-3 md:mb-4">
                <img
                  src="/images/grades/horse.png"
                  alt="홀스족"
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">홀스족</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Horse Tribe
              </p>
              <div className="text-xs md:text-sm text-gray-700 mb-2">
                <div className="mb-1">남성 40분대 / 여성 50분대</div>
              </div>
              <p className="text-xs text-gray-500">
                강철의 다리
              </p>
            </div>

            {/* 울프족 */}
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mb-3 md:mb-4">
                <img
                  src="/images/grades/wolf.png"
                  alt="울프족"
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">울프족</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Wolf Tribe
              </p>
              <div className="text-xs md:text-sm text-gray-700 mb-2">
                <div className="mb-1">남성 50분대 / 여성 60분대</div>
              </div>
              <p className="text-xs text-gray-500">
                달리는 전사들
              </p>
            </div>

            {/* 터틀족 */}
            <div className="text-center p-4 md:p-6 bg-white rounded-lg shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full mb-3 md:mb-4">
                <img
                  src="/images/grades/turtle.png"
                  alt="터틀족"
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">터틀족</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Turtle Tribe
              </p>
              <div className="text-xs md:text-sm text-gray-700 mb-2">
                <div className="mb-1">남성 60분 이상 / 여성 70분 이상</div>
              </div>
              <p className="text-xs text-gray-500">
                완주의 수호자
              </p>
            </div>
          </div>

          {/* 런텐 랭커 등록 수칙 */}
          <div className="mb-8 max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-700 space-y-1.5">
              <p>• 엘리트선수(육상단체등록선수)는 랭킹에서 제외 (단, 선수 해지 후 7년 경과자는 가능)</p>
              <p>• 매 대회마다 기록에 따라 새롭게 갱신</p>
            </div>
          </div>

          {/* 성별 필터 */}
          <div className="flex gap-3 md:gap-4 mb-8 max-w-2xl mx-auto">
            <button
              onClick={() => setGender('male')}
              className={`flex-1 px-6 md:px-12 py-3 md:py-4 rounded-lg font-bold text-base md:text-xl transition-all ${
                gender === 'male'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
              }`}
            >
              남성
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex-1 px-6 md:px-12 py-3 md:py-4 rounded-lg font-bold text-base md:text-xl transition-all ${
                gender === 'female'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
              }`}
            >
              여성
            </button>
          </div>

          {/* 랭킹 테이블 */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : rankData.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">랭킹 데이터가 없습니다</h3>
              <p className="text-gray-600">곧 랭킹 데이터가 업데이트될 예정입니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* 테이블 헤더 */}
              <div className="bg-gray-100 border-b">
                <div className="grid grid-cols-4 gap-2 px-4 py-4 text-center font-bold text-gray-700">
                  <div className="text-sm md:text-base">순위</div>
                  <div className="text-sm md:text-base">티어</div>
                  <div className="text-sm md:text-base">이름</div>
                  <div className="text-sm md:text-base">기록</div>
                </div>
              </div>

              {/* 테이블 바디 */}
              <div className="divide-y divide-gray-200">
                {rankData.map((item, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-4 gap-2 px-4 py-4 text-center items-center transition-colors hover:bg-blue-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {/* 순위 */}
                    <div className="text-lg md:text-xl font-bold text-gray-900">
                      {item.rank}
                    </div>

                    {/* 티어 */}
                    <div className="flex justify-center">
                      <img
                        src={getTierImage(item.tier)}
                        alt={getTierName(item.tier)}
                        className="w-6 h-6 md:w-8 md:h-8"
                        title={getTierName(item.tier)}
                      />
                    </div>

                    {/* 이름 */}
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      {item.name}
                    </div>

                    {/* 기록 */}
                    <div className="text-sm md:text-base font-semibold text-red-600">
                      {item.record}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
