'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { KOREA_REGIONS, SIDO_LIST } from '@/lib/korea-regions'
import { MapPin, Calendar, Plus, Zap, X, FileText } from 'lucide-react'

interface FlashRun {
  id: string
  creator_id: string
  sido: string
  sigungu: string
  location_detail: string
  title: string
  run_date: string
  run_time: string
  max_participants: number
  current_participants: number
  distance: string | null
  status: 'open' | 'cancelled'
  image_url: string | null
  tier: string[] | null
}

interface FavoriteRegion {
  id: string
  sido: string
  sigungu: string
}

type GroupFilter = 'flash' | 'my'
type FlashTab = 'interest' | 'all'
type MyTab = 'created' | 'joined'

const MAX_REGIONS = 3

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  open:      { label: '모집중', cls: 'bg-[#CEECD3] text-[#063E18]' },
  closed:    { label: '마감',   cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '완료',   cls: 'bg-gray-100 text-gray-500' },
  cancelled: { label: '취소',   cls: 'bg-red-100 text-red-700' },
}

function getDisplayStatus(run: Pick<FlashRun, 'status' | 'run_date' | 'run_time' | 'current_participants' | 'max_participants'>): string {
  if (run.status === 'cancelled') return 'cancelled'
  const dt = new Date(`${run.run_date}T${run.run_time}`)
  if (dt < new Date()) return 'completed'
  if (run.current_participants >= run.max_participants) return 'closed'
  return 'open'
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null

  const getPageNumbers = () => {
    let start = Math.max(1, current - 2)
    const end   = Math.min(total, start + 4)
    start = Math.max(1, end - 4)
    const pages: number[] = []
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors'
  const active  = 'bg-[#E60012] text-white'
  const inactive = 'text-[#1F2937] border border-[#E5E7EB] bg-white hover:border-[#E60012] hover:text-[#E60012]'
  const disabled = 'text-[#E5E7EB] border border-[#E5E7EB] bg-white cursor-not-allowed'

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {/* 데스크탑 */}
      <div className="hidden sm:flex items-center gap-1">
        <button onClick={() => onChange(1)} disabled={current === 1} className={`${btnBase} ${current === 1 ? disabled : inactive}`}>«</button>
        <button onClick={() => onChange(current - 1)} disabled={current === 1} className={`${btnBase} ${current === 1 ? disabled : inactive}`}>‹</button>
        {getPageNumbers().map(p => (
          <button key={p} onClick={() => onChange(p)} className={`${btnBase} ${p === current ? active : inactive}`}>{p}</button>
        ))}
        <button onClick={() => onChange(current + 1)} disabled={current === total} className={`${btnBase} ${current === total ? disabled : inactive}`}>›</button>
        <button onClick={() => onChange(total)} disabled={current === total} className={`${btnBase} ${current === total ? disabled : inactive}`}>»</button>
      </div>
      {/* 모바일 */}
      <div className="flex sm:hidden items-center gap-5">
        <button onClick={() => onChange(current - 1)} disabled={current === 1} className={`${btnBase} ${current === 1 ? disabled : inactive}`}>‹</button>
        <span className="text-sm font-medium text-[#1F2937] min-w-[4rem] text-center">{current} / {total}</span>
        <button onClick={() => onChange(current + 1)} disabled={current === total} className={`${btnBase} ${current === total ? disabled : inactive}`}>›</button>
      </div>
    </div>
  )
}

function StatusBadge({ run }: { run: FlashRun }) {
  const key = getDisplayStatus(run)
  const s = STATUS_BADGE[key] || STATUS_BADGE.open
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-base font-semibold flex-shrink-0 whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  )
}

const TIER_LETTER: Record<string, string> = {
  '치타족': 'c',
  '홀스족': 'h',
  '울프족': 'w',
  '터틀족': 't',
}
const TIER_ORDER = ['치타족', '홀스족', '울프족', '터틀족']

function getTierImage(tier: string[] | null): string {
  const tiers = (tier && tier.length > 0) ? tier : TIER_ORDER
  const sorted = TIER_ORDER.filter(t => tiers.includes(t))
  const letters = sorted.map(t => TIER_LETTER[t]).join('')
  return `/images/flash/tire/${sorted.length}flash_${letters}.jpg`
}

function RunCard({ run }: { run: FlashRun }) {
  const tierLabel = (run.tier && run.tier.length > 0) ? run.tier.join(', ') : '모든러너'
  const sidoShortLocal = (s: string) =>
    s.replace('특별시','').replace('광역시','').replace('특별자치시','').replace('특별자치도','').replace('특별자치','')

  return (
    <Link
      href={`/flash/${run.id}`}
      className="flex items-center gap-3 sm:gap-6 bg-white rounded-lg border border-[#E5E7EB] p-3 sm:p-4 min-h-[110px] sm:min-h-[144px] hover:border-red-200 transition-colors active:bg-gray-50"
    >
      <img src={getTierImage(run.tier)} alt="" className="w-[60px] h-[66px] sm:w-[86px] sm:h-[95px] object-contain flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 sm:gap-1">
        <p className="text-xs sm:text-sm font-semibold text-[#444444]">{tierLabel}</p>
        <p className="font-semibold text-sm sm:text-xl text-black leading-snug truncate">
          {run.title.length > 20 ? run.title.slice(0, 20) + '…' : run.title}
        </p>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-[#555555]">
          <MapPin className="w-3 h-3 sm:w-[18px] sm:h-[18px] flex-shrink-0 text-[#888888]" />
          <span className="truncate">{sidoShortLocal(run.sido)} {run.sigungu} · {run.location_detail}</span>
        </div>
        <div className="flex items-center gap-x-2 sm:gap-x-3 text-xs sm:text-sm text-[#555555]">
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Calendar className="w-3 h-3 sm:w-[18px] sm:h-[18px] text-[#888888]" />
            {run.run_date.slice(5).replace('-', '/')} {run.run_time.slice(0, 5)}
          </span>
          <span>{run.current_participants}/{run.max_participants}명</span>
          {run.distance && <span>{run.distance}</span>}
        </div>
      </div>
      <StatusBadge run={run} />
    </Link>
  )
}

function FlashPageContent() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // 이용가이드 모달
  const [guideOpen, setGuideOpen]   = useState(false)
  const [guideIndex, setGuideIndex] = useState(0)

  // 그룹 & 탭
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('flash')
  const [flashTab, setFlashTab]       = useState<FlashTab>('all')
  const [myTab, setMyTab]             = useState<MyTab>('created')
  const [showEnded, setShowEnded]     = useState(true)

  // 런텐플래시 데이터
  const [flashRuns, setFlashRuns]     = useState<FlashRun[]>([])
  const [isLoadingFlash, setIsLoadingFlash] = useState(true)

  // 마이플래시 데이터
  const [createdRuns, setCreatedRuns] = useState<FlashRun[]>([])
  const [joinedRuns, setJoinedRuns]   = useState<FlashRun[]>([])
  const [isLoadingMy, setIsLoadingMy] = useState(false)

  // 관심 지역
  const [favoriteRegions, setFavoriteRegions] = useState<FavoriteRegion[]>([])
  const [addSido, setAddSido]         = useState('')
  const [addSigungu, setAddSigungu]   = useState('')
  const [isAddingRegion, setIsAddingRegion] = useState(false)

  // 전체지역 필터
  const [filterSido, setFilterSido]   = useState('')
  const [filterSigungu, setFilterSigungu] = useState('')

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [myCurrentPage, setMyCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (authLoading) return
    if (!user) router.push('/')
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    loadFavoriteRegions()
  }, [user, authLoading])

  // 필터/탭 변경 시 1페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [flashTab, showEnded, filterSido, filterSigungu, groupFilter])

  useEffect(() => {
    setMyCurrentPage(1)
  }, [myTab])

  // 런텐플래시 탭 데이터 로드
  useEffect(() => {
    if (authLoading || !user || groupFilter !== 'flash') return
    loadFlashRuns()
  }, [user, authLoading, groupFilter, flashTab, showEnded, favoriteRegions, filterSido, filterSigungu])

  // 마이플래시 탭 데이터 로드
  useEffect(() => {
    if (authLoading || !user || groupFilter !== 'my') return
    loadMyRuns()
  }, [user, authLoading, groupFilter])

  const getTodayStr = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }

  const loadFavoriteRegions = async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_favorite_regions')
      .select('id, sido, sigungu')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setFavoriteRegions(data || [])
  }

  const loadFlashRuns = async () => {
    setIsLoadingFlash(true)
    try {
      const today = getTodayStr()
      const selectFields = 'id, creator_id, sido, sigungu, location_detail, title, run_date, run_time, max_participants, current_participants, distance, status, image_url, tier'

      let query = supabase.from('flash_runs').select(selectFields)

      if (!showEnded) {
        // 진행 중인 모임만 (기본값)
        query = query
          .gte('run_date', today)
          .in('status', ['open', 'closed'])
          .order('run_date', { ascending: true })
          .order('run_time', { ascending: true })
      } else {
        // 진행 + 종료 모두
        query = query
          .order('run_date', { ascending: true })
          .order('run_time', { ascending: true })
      }

      if (flashTab === 'all') {
        if (filterSido)    query = query.eq('sido', filterSido)
        if (filterSigungu) query = query.eq('sigungu', filterSigungu)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data || []) as FlashRun[]

      // 날짜+시간 기준 정확한 진행/종료 분리 (오늘 날짜 모임 시간 처리)
      result = result.filter(r => {
        const ds = getDisplayStatus(r)
        return showEnded
          ? true
          : (ds === 'open' || ds === 'closed')
      })

      if (flashTab === 'interest') {
        if (favoriteRegions.length === 0) {
          result = []
        } else {
          result = result.filter(r =>
            favoriteRegions.some(fav => fav.sido === r.sido && fav.sigungu === r.sigungu)
          )
        }
      }

      setFlashRuns(result)
    } catch (err) {
      console.error('모임 목록 조회 오류:', err)
    } finally {
      setIsLoadingFlash(false)
    }
  }

  const loadMyRuns = async () => {
    if (!user) return
    setIsLoadingMy(true)
    try {
      const selectFields = 'id, creator_id, sido, sigungu, location_detail, title, run_date, run_time, max_participants, current_participants, distance, status, image_url, tier'

      // 내가 만든 모임
      const { data: created } = await supabase
        .from('flash_runs')
        .select(selectFields)
        .eq('creator_id', user.id)
        .order('run_date', { ascending: true })
      setCreatedRuns((created || []) as FlashRun[])

      // 참여한 모임 (타인이 만든 것만)
      const { data: participations } = await supabase
        .from('flash_participants')
        .select('flash_run_id')
        .eq('user_id', user.id)

      const runIds = (participations || []).map(p => p.flash_run_id)

      if (runIds.length > 0) {
        const { data: joined } = await supabase
          .from('flash_runs')
          .select(selectFields)
          .in('id', runIds)
          .neq('creator_id', user.id)
          .order('run_date', { ascending: true })
        setJoinedRuns((joined || []) as FlashRun[])
      } else {
        setJoinedRuns([])
      }
    } catch (err) {
      console.error('마이플래시 조회 오류:', err)
    } finally {
      setIsLoadingMy(false)
    }
  }

  const handleAddRegion = async () => {
    if (!user || !addSido || !addSigungu) return
    if (favoriteRegions.some(r => r.sido === addSido && r.sigungu === addSigungu)) return
    if (favoriteRegions.length >= MAX_REGIONS) return
    setIsAddingRegion(true)
    try {
      await supabase.from('user_favorite_regions').insert({
        user_id: user.id, sido: addSido, sigungu: addSigungu,
      })
      await loadFavoriteRegions()
      setAddSido('')
      setAddSigungu('')
    } catch (err) {
      console.error('관심 지역 추가 오류:', err)
    } finally {
      setIsAddingRegion(false)
    }
  }

  const handleRemoveRegion = async (id: string) => {
    try {
      await supabase.from('user_favorite_regions').delete().eq('id', id)
      await loadFavoriteRegions()
    } catch (err) {
      console.error('관심 지역 삭제 오류:', err)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  const sidoShort = (s: string) =>
    s.replace('특별시','').replace('광역시','').replace('특별자치시','').replace('특별자치도','').replace('특별자치','')

  const iParticle = (name: string) => {
    const code = name.charCodeAt(name.length - 1)
    return code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 !== 0 ? '이' : '가'
  }

  const addSigunguList    = addSido    ? KOREA_REGIONS[addSido]    || [] : []
  const filterSigunguList = filterSido ? KOREA_REGIONS[filterSido] || [] : []

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(flashRuns.length / PAGE_SIZE))
  const pagedRuns  = flashRuns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // 런텐플래시 목록을 지역별 그룹핑
  const grouped = pagedRuns.reduce((acc, run) => {
    const key = `${run.sido} ${run.sigungu}`
    if (!acc[key]) acc[key] = []
    acc[key].push(run)
    return acc
  }, {} as Record<string, FlashRun[]>)

  const currentMyRuns = myTab === 'created' ? createdRuns : joinedRuns
  const myTotalPages = Math.max(1, Math.ceil(currentMyRuns.length / PAGE_SIZE))
  const pagedMyRuns = currentMyRuns.slice((myCurrentPage - 1) * PAGE_SIZE, myCurrentPage * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/flash-hero-bg.jpg"
            alt="런텐플래시 배경"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">런텐플래시</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto">
            갑자기 뛰고 싶을 때, 원하는 시간 장소에서 같이 러닝해요
          </p>
        </div>
      </section>

      {/* 이용가이드 */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <button
            onClick={() => { setGuideIndex(0); setGuideOpen(true) }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white rounded-lg border border-red-100 hover:border-red-300 active:bg-red-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">이용가이드</span>
          </button>
        </div>

        {/* 이용가이드 모달 */}
        {guideOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4"
            onClick={() => setGuideOpen(false)}
          >
            <div
              className="bg-white w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
              style={{ maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* 드래그 핸들 — 모바일 바텀시트 */}
              <div className="flex justify-center pt-3 pb-0 flex-shrink-0 sm:hidden">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* 모달 헤더 — 고정 */}
              <div className="flex items-center justify-between px-4 pt-3 sm:pt-4 pb-0 flex-shrink-0">
                <span className="text-sm font-bold text-gray-800">이용가이드</span>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 탭 — 고정, 균등 분할 */}
              <div className="flex border-b border-gray-200 mt-3 flex-shrink-0">
                {['런텐플래시 안내', '신고하기 안내', '운영정책 안내'].map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setGuideIndex(i)}
                    className={`flex-1 py-2.5 text-[11px] sm:text-xs font-medium border-b-2 transition-colors text-center leading-tight px-1 ${
                      guideIndex === i
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 이미지 — 스크롤 */}
              <div className="overflow-y-auto flex-1 p-3 sm:p-4">
                <img
                  src={`/images/flash/anno/0${guideIndex + 1}.jpg`}
                  alt="이용가이드"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 상위 그룹 선택 + 모임 만들기 버튼 */}
        <div className="flex items-end justify-between border-b border-gray-200">
          <div className="flex">
            {([
              { key: 'flash', label: '런텐플래시' },
              { key: 'my',    label: '마이플래시' },
            ] as { key: GroupFilter; label: string }[]).map(g => (
              <button
                key={g.key}
                onClick={() => setGroupFilter(g.key)}
                className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  groupFilter === g.key
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <Link
            href="/flash/new"
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            플래시 만들기
          </Link>
        </div>

        {/* 하위 필터 */}
        <div className="flex items-center gap-2 pt-3 pb-1 flex-wrap">
          {groupFilter === 'flash' && (
            <>
              {([
                { key: 'all',      label: '전체지역' },
                { key: 'interest', label: '관심지역' },
              ] as { key: FlashTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setFlashTab(t.key)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                    flashTab === t.key
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showEnded}
                  onChange={e => setShowEnded(e.target.checked)}
                  className="w-3.5 h-3.5 accent-red-600"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">종료 포함</span>
              </label>
            </>
          )}
          {groupFilter === 'my' && (
            <>
              {([
                { key: 'created', label: '내가만든플래시' },
                { key: 'joined',  label: '내가참여한플래시' },
              ] as { key: MyTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setMyTab(t.key)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                    myTab === t.key
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* 섹션 타이틀 */}
        <div className="mt-3 mb-4">
          <p className="text-sm font-semibold text-gray-700">
            {groupFilter === 'flash'
              ? (flashTab === 'all' ? '전체지역의 플래시' : '관심지역에서의 플래시')
              : (myTab === 'created'
                  ? `${user.name}${iParticle(user.name)} 만든 플래시`
                  : `${user.name}${iParticle(user.name)} 참여한 타인의 플래시`)}
          </p>
        </div>

        {/* ── 런텐플래시 영역 ── */}
        {groupFilter === 'flash' && (
          <>
            {/* 관심지역 설정 패널 */}
            {flashTab === 'interest' && (
              <div className="bg-white rounded-lg border border-gray-100 mb-4 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">관심 지역</span>
                  <span className="text-xs text-gray-400">({favoriteRegions.length}/{MAX_REGIONS})</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {favoriteRegions.map(r => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"
                    >
                      {sidoShort(r.sido)} {r.sigungu}
                      <button onClick={() => handleRemoveRegion(r.id)} className="ml-0.5 hover:text-red-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {favoriteRegions.length === 0 && (
                    <span className="text-xs text-gray-400">관심 지역을 추가하면 해당 지역 플래시가 표시됩니다</span>
                  )}
                </div>
                {favoriteRegions.length < MAX_REGIONS && (
                  <div className="flex gap-2">
                    <select
                      value={addSido}
                      onChange={e => { setAddSido(e.target.value); setAddSigungu('') }}
                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="">시/도</option>
                      {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                      value={addSigungu}
                      onChange={e => setAddSigungu(e.target.value)}
                      disabled={!addSido}
                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:opacity-50"
                    >
                      <option value="">구/군</option>
                      {addSigunguList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={handleAddRegion}
                      disabled={!addSido || !addSigungu || isAddingRegion}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 전체지역 필터 */}
            {flashTab === 'all' && (
              <div className="flex gap-2 mb-4">
                <select
                  value={filterSido}
                  onChange={e => { setFilterSido(e.target.value); setFilterSigungu('') }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">전체 시/도</option>
                  {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={filterSigungu}
                  onChange={e => setFilterSigungu(e.target.value)}
                  disabled={!filterSido}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:opacity-50"
                >
                  <option value="">전체 구/군</option>
                  {filterSigunguList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* 런텐플래시 목록 */}
            {isLoadingFlash ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : flashRuns.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {flashTab === 'interest' && favoriteRegions.length === 0
                    ? '위에서 관심 지역을 추가하면 해당 지역 플래시가 표시됩니다'
                    : flashTab === 'interest'
                    ? '관심 지역에 진행 중인 플래시가 없어요'
                    : '진행 중인 플래시가 없어요'}
                </p>
                {favoriteRegions.length > 0 && (
                  <Link href="/flash/new" className="inline-flex items-center gap-1 text-red-600 text-sm font-medium hover:underline">
                    <Plus className="w-4 h-4" />첫 플래시 만들기
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {Object.entries(grouped).map(([region, regionRuns]) => (
                    <div key={region}>
                      <h2 className="text-xs font-semibold text-gray-400 tracking-wide mb-2 px-1">{region}</h2>
                      <div className="space-y-2">
                        {regionRuns.map(run => <RunCard key={run.id} run={run} />)}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
              </>
            )}
          </>
        )}

        {/* ── 마이플래시 영역 ── */}
        {groupFilter === 'my' && (
          <>
            {isLoadingMy ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : currentMyRuns.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {myTab === 'created' ? '만든 플래시가 없어요' : '참여한 플래시가 없어요'}
                </p>
                {myTab === 'created' && (
                  <Link href="/flash/new" className="inline-flex items-center gap-1 text-red-600 text-sm font-medium hover:underline">
                    <Plus className="w-4 h-4" />플래시 만들기
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {pagedMyRuns.map(run => <RunCard key={run.id} run={run} />)}
                </div>
                <Pagination current={myCurrentPage} total={myTotalPages} onChange={setMyCurrentPage} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function FlashPage() {
  return (
    <Suspense>
      <FlashPageContent />
    </Suspense>
  )
}
