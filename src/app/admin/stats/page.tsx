'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, Search, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { formatKST } from '@/lib/dateUtils'

async function fetchAllUserIds(
  competitionIds: string[],
  single: boolean
): Promise<Set<string>> {
  const PAGE = 1000
  let from = 0
  const ids: string[] = []
  while (true) {
    let q = supabase
      .from('registrations')
      .select('user_id')
      .neq('payment_status', 'cancelled')
      .not('user_id', 'is', null)
      .range(from, from + PAGE - 1)
    q = single
      ? q.eq('competition_id', competitionIds[0])
      : q.in('competition_id', competitionIds)
    const { data } = await q
    if (!data || data.length === 0) break
    ids.push(...(data.map(r => r.user_id) as string[]))
    if (data.length < PAGE) break
    from += PAGE
  }
  return new Set(ids)
}

export default function AdminStatsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [confirmedCounts, setConfirmedCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [primaryIds, setPrimaryIds] = useState<string[]>([])
  const [secondaryId, setSecondaryId] = useState<string>('')

  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    primaryUnique: number
    secondaryTotal: number
    overlap: number
    rate: number
  } | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') router.push('/')
  }, [user, authLoading])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const load = async () => {
      setLoading(true)
      const { data: comps } = await supabase
        .from('competitions')
        .select('*')
        .order('date', { ascending: true })
      const list = comps || []
      setCompetitions(list)
      const counts: Record<string, number> = {}
      await Promise.all(
        list.map(async c => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('competition_id', c.id)
            .eq('payment_status', 'confirmed')
          counts[c.id] = count ?? 0
        })
      )
      setConfirmedCounts(counts)
      setLoading(false)
    }
    load()
  }, [user])

  const togglePrimary = (id: string) => {
    setPrimaryIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (primaryIds.length === 0 || !secondaryId) return
    setAnalyzing(true)
    setResult(null)
    const [primarySet, secondarySet] = await Promise.all([
      fetchAllUserIds(primaryIds, false),
      fetchAllUserIds([secondaryId], true),
    ])
    const overlapCount = [...secondarySet].filter(id => primarySet.has(id)).length
    const rate = secondarySet.size > 0 ? (overlapCount / secondarySet.size) * 100 : 0
    setResult({
      primaryUnique: primarySet.size,
      secondaryTotal: secondarySet.size,
      overlap: overlapCount,
      rate,
    })
    setAnalyzing(false)
  }

  const secondaryComp = competitions.find(c => c.id === secondaryId)
  const primaryComps = competitions.filter(c => primaryIds.includes(c.id))
  const canAnalyze = primaryIds.length > 0 && !!secondaryId && !analyzing

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 헤더 */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <BarChart2 className="w-3.5 h-3.5 text-red-200" />
              <span className="text-xs text-red-200">관리자</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">통계</h1>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium border border-white/20 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            관리자
          </Link>
        </div>
      </section>

      {/* 서브탭 */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex border-b border-gray-200 bg-white">
          <button className="px-5 py-3 text-sm font-medium border-b-2 border-red-600 text-red-600">
            중복참여 분석
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* 대회 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* 1차 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">
                1차 대회
                <span className="text-gray-400 font-normal ml-1 text-xs">(복수 선택)</span>
              </p>
              {primaryIds.length > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                  {primaryIds.length}개
                </span>
              )}
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
              {competitions.map(c => (
                <label
                  key={c.id}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                    primaryIds.includes(c.id)
                      ? 'bg-red-50 border border-red-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={primaryIds.includes(c.id)}
                    onChange={() => togglePrimary(c.id)}
                    className="mt-0.5 w-4 h-4 text-red-600 rounded border-gray-300 flex-shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-gray-800 text-xs font-medium truncate">{c.title}</span>
                    <span className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatKST(c.date, 'yyyy.MM.dd')}</span>
                      <span className="text-xs font-semibold text-green-600">
                        확인 {(confirmedCounts[c.id] ?? 0).toLocaleString()}명
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 2차 */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              2차 대회
              <span className="text-gray-400 font-normal ml-1 text-xs">(1개 선택)</span>
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
              {competitions.map(c => (
                <label
                  key={c.id}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                    secondaryId === c.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="secondary"
                    checked={secondaryId === c.id}
                    onChange={() => { setSecondaryId(c.id); setResult(null) }}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 flex-shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-gray-800 text-xs font-medium truncate">{c.title}</span>
                    <span className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatKST(c.date, 'yyyy.MM.dd')}</span>
                      <span className="text-xs font-semibold text-green-600">
                        확인 {(confirmedCounts[c.id] ?? 0).toLocaleString()}명
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 선택 요약 */}
        {(primaryIds.length > 0 || secondaryId) && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">선택된 대회</p>

            {/* 1차 선택 */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5">1차</p>
              {primaryIds.length === 0 ? (
                <p className="text-xs text-gray-300 italic">선택 없음</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {primaryComps.map(c => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {c.title}
                      <button
                        onClick={() => togglePrimary(c.id)}
                        className="text-red-400 hover:text-red-600 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2차 선택 */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5">2차</p>
              {!secondaryId ? (
                <p className="text-xs text-gray-300 italic">선택 없음</p>
              ) : (
                <span
                  className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {secondaryComp?.title}
                  <button
                    onClick={() => { setSecondaryId(''); setResult(null) }}
                    className="text-blue-400 hover:text-blue-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* 분석 버튼 */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4" />
          {analyzing ? '분석 중...' : '중복참여 분석하기'}
        </button>

        {/* 결과 */}
        {result && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">분석 결과</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">1차 유니크</p>
                <p className="text-2xl font-bold text-gray-800">
                  {result.primaryUnique.toLocaleString()}
                  <span className="text-sm font-normal text-gray-400 ml-1">명</span>
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">2차 참가자</p>
                <p className="text-2xl font-bold text-blue-700">
                  {result.secondaryTotal.toLocaleString()}
                  <span className="text-sm font-normal text-blue-300 ml-1">명</span>
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">중복 참가</p>
                <p className="text-2xl font-bold text-red-600">
                  {result.overlap.toLocaleString()}
                  <span className="text-sm font-normal text-red-300 ml-1">명</span>
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">중복 비율</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.rate.toFixed(1)}
                  <span className="text-sm font-normal text-green-400 ml-1">%</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">2차 대비</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
