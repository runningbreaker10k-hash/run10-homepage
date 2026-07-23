'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { KOREA_REGIONS, SIDO_LIST } from '@/lib/korea-regions'
import { MapPin, Users, Calendar, Plus, Zap, ChevronRight, X } from 'lucide-react'

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
}

interface FavoriteRegion {
  id: string
  sido: string
  sigungu: string
}

type GroupFilter = 'flash' | 'my'
type FlashTab = 'interest' | 'all'
type MyTab = 'created' | 'joined'
type StatusFilter = 'ongoing' | 'ended'

const MAX_REGIONS = 3

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  open:      { label: '모집중', cls: 'bg-green-100 text-green-800' },
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

function StatusBadge({ run }: { run: FlashRun }) {
  const key = getDisplayStatus(run)
  const s = STATUS_BADGE[key] || STATUS_BADGE.open
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>
      {s.label}
    </span>
  )
}

function RunCard({ run }: { run: FlashRun }) {
  return (
    <Link
      href={`/flash/${run.id}`}
      className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-4 hover:border-red-200 transition-colors active:bg-gray-50"
    >
      {run.image_url && (
        <img src={run.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 truncate text-sm">{run.title}</span>
          <StatusBadge run={run} />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{run.sido.replace('특별시','').replace('광역시','').replace('특별자치시','').replace('특별자치도','')} {run.sigungu} · {run.location_detail}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {run.run_date.slice(5).replace('-', '/')} {run.run_time.slice(0, 5)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {run.current_participants}/{run.max_participants}명
          </span>
          {run.distance && <span>{run.distance}</span>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </Link>
  )
}

function FlashPageContent() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // 그룹 & 탭
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('flash')
  const [flashTab, setFlashTab]       = useState<FlashTab>('interest')
  const [myTab, setMyTab]             = useState<MyTab>('created')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ongoing')

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

  useEffect(() => {
    if (authLoading) return
    if (!user) router.push('/')
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    loadFavoriteRegions()
  }, [user, authLoading])

  // 런텐플래시 탭 데이터 로드
  useEffect(() => {
    if (authLoading || !user || groupFilter !== 'flash') return
    loadFlashRuns()
  }, [user, authLoading, groupFilter, flashTab, statusFilter, favoriteRegions, filterSido, filterSigungu])

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
      const selectFields = 'id, creator_id, sido, sigungu, location_detail, title, run_date, run_time, max_participants, current_participants, distance, status, image_url'

      let query = supabase.from('flash_runs').select(selectFields)

      if (statusFilter === 'ongoing') {
        query = query
          .gte('run_date', today)
          .eq('status', 'open')
          .order('run_date', { ascending: true })
          .order('run_time', { ascending: true })
      } else {
        query = query
          .or(`run_date.lt.${today},status.eq.cancelled`)
          .order('run_date', { ascending: false })
      }

      if (flashTab === 'all') {
        if (filterSido)    query = query.eq('sido', filterSido)
        if (filterSigungu) query = query.eq('sigungu', filterSigungu)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data || []) as FlashRun[]

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
      const selectFields = 'id, creator_id, sido, sigungu, location_detail, title, run_date, run_time, max_participants, current_participants, distance, status, image_url'

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

  const addSigunguList    = addSido    ? KOREA_REGIONS[addSido]    || [] : []
  const filterSigunguList = filterSido ? KOREA_REGIONS[filterSido] || [] : []

  // 런텐플래시 목록을 지역별 그룹핑
  const grouped = flashRuns.reduce((acc, run) => {
    const key = `${run.sido} ${run.sigungu}`
    if (!acc[key]) acc[key] = []
    acc[key].push(run)
    return acc
  }, {} as Record<string, FlashRun[]>)

  const currentMyRuns = myTab === 'created' ? createdRuns : joinedRuns
  const isLoadingCurrent = groupFilter === 'flash' ? isLoadingFlash : isLoadingMy

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
            전국 어디서든, 우리 동네 러닝 번개
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 모임 만들기 버튼 */}
        <div className="flex justify-end mb-4">
          <Link
            href="/flash/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            모임 만들기
          </Link>
        </div>

        {/* 상위 그룹 선택 */}
        <div className="flex gap-2 mb-1">
          {([
            { key: 'flash', label: '런텐플래시' },
            { key: 'my',    label: '마이플래시' },
          ] as { key: GroupFilter; label: string }[]).map(g => (
            <button
              key={g.key}
              onClick={() => setGroupFilter(g.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                groupFilter === g.key
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 하위 탭 */}
        <div className="flex border-b border-gray-200 mb-4">
          {groupFilter === 'flash' && (
            <>
              {([
                { key: 'interest', label: '관심지역' },
                { key: 'all',      label: '전체지역' },
              ] as { key: FlashTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setFlashTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    flashTab === t.key
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </>
          )}
          {groupFilter === 'my' && (
            <>
              {([
                { key: 'created', label: '내가만든모임' },
                { key: 'joined',  label: '참여한 모임' },
              ] as { key: MyTab; label: string }[]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setMyTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    myTab === t.key
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </>
          )}
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
                    <span className="text-xs text-gray-400">관심 지역을 추가하면 해당 지역 모임이 표시됩니다</span>
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

            {/* 진행/종료 필터 */}
            <div className="flex gap-2 mb-5">
              {([
                { key: 'ongoing', label: '진행' },
                { key: 'ended',   label: '종료' },
              ] as { key: StatusFilter; label: string }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === f.key
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 런텐플래시 목록 */}
            {isLoadingFlash ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : flashRuns.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {flashTab === 'interest' && favoriteRegions.length === 0
                    ? '위에서 관심 지역을 추가하면 해당 지역 모임이 표시됩니다'
                    : flashTab === 'interest'
                    ? '관심 지역에 진행 중인 모임이 없어요'
                    : statusFilter === 'ongoing' ? '진행 중인 모임이 없어요' : '종료된 모임이 없어요'}
                </p>
                {statusFilter === 'ongoing' && favoriteRegions.length > 0 && (
                  <Link href="/flash/new" className="inline-flex items-center gap-1 text-red-600 text-sm font-medium hover:underline">
                    <Plus className="w-4 h-4" />첫 모임 만들기
                  </Link>
                )}
              </div>
            ) : (
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
            )}
          </>
        )}

        {/* ── 마이플래시 영역 ── */}
        {groupFilter === 'my' && (
          <>
            {/* 사용자 헤더 */}
            <div className="mb-4">
              <p className="text-base font-semibold text-gray-800">{user.name}님의 플래시</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {myTab === 'created' ? '내가 만든 모임 목록' : '타인의 모임에 참여한 목록'}
              </p>
            </div>

            {isLoadingMy ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : currentMyRuns.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-3">
                  {myTab === 'created' ? '만든 모임이 없어요' : '참여한 모임이 없어요'}
                </p>
                {myTab === 'created' && (
                  <Link href="/flash/new" className="inline-flex items-center gap-1 text-red-600 text-sm font-medium hover:underline">
                    <Plus className="w-4 h-4" />모임 만들기
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {currentMyRuns.map(run => <RunCard key={run.id} run={run} />)}
              </div>
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
