'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Zap, ArrowLeft, Flag, Loader2,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Clock,
  MapPin, Calendar, Users, Shuffle,
} from 'lucide-react'

type FlashSubTab = 'runs' | 'reports' | 'seed'
type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

interface FlashRun {
  id: string
  creator_id: string
  creator_name?: string
  sido: string
  sigungu: string
  title: string
  run_date: string
  run_time: string
  max_participants: number
  current_participants: number
  status: 'open' | 'cancelled'
  tier: string[] | null
}

interface FlashReport {
  id: string
  created_at: string
  flash_run_id: string
  reporter_id: string
  target_user_id: string
  reason: string
  detail: string | null
  status: ReportStatus
  admin_note: string | null
  reporter_name?: string
  target_name?: string
  run_title?: string
  run_date?: string
}

function getDisplayStatus(run: Pick<FlashRun, 'status' | 'run_date' | 'run_time' | 'current_participants' | 'max_participants'>): string {
  if (run.status === 'cancelled') return 'cancelled'
  const dt = new Date(`${run.run_date}T${run.run_time}`)
  if (dt < new Date()) return 'completed'
  if (run.current_participants >= run.max_participants) return 'closed'
  return 'open'
}

const RUN_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  open:      { label: '모집중', cls: 'bg-green-100 text-green-700' },
  closed:    { label: '마감',   cls: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '완료',   cls: 'bg-gray-100 text-gray-500' },
  cancelled: { label: '취소',   cls: 'bg-red-100 text-red-700' },
}

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending:   '접수',
  reviewing: '확인중',
  resolved:  '처리완료',
  dismissed: '기각',
}

const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-blue-100 text-blue-700',
  resolved:  'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

const sidoShort = (s: string) =>
  s.replace('특별시','').replace('광역시','').replace('특별자치시','').replace('특별자치도','').replace('특별자치','')

export default function FlashAdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [subTab, setSubTab] = useState<FlashSubTab>('runs')
  const [authorized, setAuthorized] = useState(false)

  // 플래시 목록
  const [runs, setRuns] = useState<FlashRun[]>([])
  const [isLoadingRuns, setIsLoadingRuns] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // 샘플 생성
  const [seedCreatorIds, setSeedCreatorIds]       = useState('')
  const [seedTitles, setSeedTitles]               = useState('')
  const [seedRegions, setSeedRegions]             = useState('')
  const [seedTimes, setSeedTimes]                 = useState('')
  const [seedMaxParticipants, setSeedMaxParticipants] = useState(10)
  const [seedKakaoUrls, setSeedKakaoUrls]         = useState('')
  const [seedDistances, setSeedDistances]         = useState('')
  const [seedDayStart, setSeedDayStart]       = useState(0)
  const [seedDayEnd, setSeedDayEnd]           = useState(7)
  const [seedCount, setSeedCount]             = useState(10)
  const [isGenerating, setIsGenerating]       = useState(false)
  const [seedResult, setSeedResult]           = useState<{ success: number; failed: number } | null>(null)

  // 신고 관리
  const [reports, setReports] = useState<FlashReport[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | 'all'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/'); return }
    checkAdmin()
  }, [user, authLoading])

  useEffect(() => {
    if (!authorized) return
    if (subTab === 'reports' && reports.length === 0) loadReports()
  }, [subTab, authorized])

  const checkAdmin = async () => {
    const { data } = await supabase.from('users').select('role').eq('id', user!.id).single()
    if (!data || data.role !== 'admin') { router.push('/'); return }
    setAuthorized(true)
    loadRuns()
  }

  const loadRuns = async () => {
    setIsLoadingRuns(true)
    try {
      const { data, error } = await supabase
        .from('flash_runs')
        .select('id, creator_id, sido, sigungu, title, run_date, run_time, max_participants, current_participants, status, tier')
        .order('run_date', { ascending: false })
      if (error) throw error

      const creatorIds = [...new Set((data || []).map(r => r.creator_id))]
      const { data: profiles } = await supabase.from('users').select('id, name').in('id', creatorIds)
      const profileMap: Record<string, string> = {}
      for (const p of profiles || []) profileMap[p.id] = p.name

      setRuns((data || []).map(r => ({ ...r, creator_name: profileMap[r.creator_id] || '알 수 없음' })))
    } catch (err) {
      console.error('플래시 목록 조회 오류:', err)
    }
    setIsLoadingRuns(false)
  }

  const handleCancel = async (runId: string) => {
    if (!confirm('이 모임을 강제 취소하시겠습니까?')) return
    setProcessingId(runId)
    try {
      await supabase.from('flash_runs').update({ status: 'cancelled' }).eq('id', runId)
      setRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'cancelled' } : r))
    } catch (err) {
      console.error('취소 오류:', err)
    }
    setProcessingId(null)
  }

  const handleDelete = async (runId: string) => {
    if (!confirm('이 모임을 삭제하시겠습니까? 복구할 수 없습니다.')) return
    setProcessingId(runId)
    try {
      await Promise.all([
        supabase.from('flash_participants').delete().eq('flash_run_id', runId),
        supabase.from('flash_likes').delete().eq('flash_run_id', runId),
        supabase.from('flash_reports').delete().eq('flash_run_id', runId),
      ])
      await supabase.from('flash_runs').delete().eq('id', runId)
      setRuns(prev => prev.filter(r => r.id !== runId))
    } catch (err) {
      console.error('삭제 오류:', err)
    }
    setProcessingId(null)
  }

  const handleGenerate = async () => {
    setSeedResult(null)
    const parse = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean)

    const creatorIdList  = parse(seedCreatorIds)
    const titleList      = parse(seedTitles)
    const regionList     = parse(seedRegions).map(r => {
      const parts = r.split('/')
      if (parts.length < 3) return null
      return { sido: parts[0].trim(), sigungu: parts[1].trim(), location_detail: parts[2].trim() }
    }).filter(Boolean) as { sido: string; sigungu: string; location_detail: string }[]
    const timeList       = parse(seedTimes)
    const kakaoList      = parse(seedKakaoUrls)
    const distanceList   = parse(seedDistances)

    if (!creatorIdList.length || !titleList.length || !regionList.length ||
        !timeList.length || !kakaoList.length) {
      alert('예상 거리를 제외한 모든 항목을 입력해주세요')
      return
    }

    setIsGenerating(true)
    try {
      // 회원 ID 검증 및 grade 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, grade, user_id')
        .in('user_id', creatorIdList)

      if (userError || !userData || userData.length === 0) {
        alert('유효한 회원 ID가 없습니다. 로그인 ID를 확인해주세요.')
        setIsGenerating(false)
        return
      }

      const notFound = creatorIdList.filter(cid => !userData.some(u => u.user_id === cid))
      if (notFound.length > 0) alert(`다음 ID는 존재하지 않아 제외됩니다: ${notFound.join(', ')}`)

      const GRADE_TO_TIER: Record<string, string> = {
        cheetah: '치타족', horse: '홀스족', wolf: '울프족', turtle: '터틀족',
      }
      const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

      const today = new Date()
      const getRandomDate = () => {
        const d = new Date(today)
        const range = Math.max(0, seedDayEnd - seedDayStart)
        d.setDate(d.getDate() + seedDayStart + Math.floor(Math.random() * (range + 1)))
        const p = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      }

      let success = 0, failed = 0
      for (let i = 0; i < seedCount; i++) {
        try {
          const creator  = rand(userData)
          const tierName = creator.grade ? GRADE_TO_TIER[creator.grade] : null
          const region   = rand(regionList)
          const distance = distanceList.length > 0 ? rand(distanceList) : null
          const timeVal  = rand(timeList)
          const runTime  = timeVal.includes(':') ? timeVal + ':00' : timeVal + ':00:00'
          const maxVal   = Math.floor(Math.random() * (seedMaxParticipants - 2 + 1)) + 2

          const { data: newRun, error: insertError } = await supabase
            .from('flash_runs')
            .insert({
              creator_id:           creator.id,
              sido:                 region.sido,
              sigungu:              region.sigungu,
              location_detail:      region.location_detail,
              title:                rand(titleList),
              run_date:             getRandomDate(),
              run_time:             runTime,
              max_participants:     maxVal,
              current_participants: 1,
              kakao_chat_url:       rand(kakaoList),
              description:          null,
              distance:             distance,
              tier:                 tierName ? [tierName] : null,
              image_url:            null,
              status:               'open',
            })
            .select('id')
            .single()

          if (insertError) throw insertError

          await supabase.from('flash_participants').insert({
            flash_run_id: newRun.id,
            user_id:      creator.id,
          })
          success++
        } catch (err) {
          console.error(`생성 오류 (${i + 1}번째):`, err)
          failed++
        }
      }

      setSeedResult({ success, failed })
      if (success > 0) loadRuns()
    } catch (err) {
      console.error('샘플 생성 오류:', err)
      alert('생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadReports = async () => {
    setIsLoadingReports(true)
    try {
      const { data } = await supabase
        .from('flash_reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (!data) { setIsLoadingReports(false); return }

      const reporterIds = [...new Set(data.map(r => r.reporter_id))]
      const targetIds   = [...new Set(data.map(r => r.target_user_id))]
      const runIds      = [...new Set(data.map(r => r.flash_run_id))]

      const [profilesRes, runsRes] = await Promise.all([
        supabase.from('users').select('id, name').in('id', [...reporterIds, ...targetIds]),
        supabase.from('flash_runs').select('id, title, run_date').in('id', runIds),
      ])

      const profileMap: Record<string, string> = {}
      for (const p of profilesRes.data || []) profileMap[p.id] = p.name

      const runMap: Record<string, { title: string; run_date: string }> = {}
      for (const r of runsRes.data || []) runMap[r.id] = { title: r.title, run_date: r.run_date }

      const enriched = data.map(r => ({
        ...r,
        reporter_name: profileMap[r.reporter_id]        || '알 수 없음',
        target_name:   profileMap[r.target_user_id]     || '알 수 없음',
        run_title:     runMap[r.flash_run_id]?.title    || '',
        run_date:      runMap[r.flash_run_id]?.run_date || '',
      }))

      setReports(enriched)
      const noteMap: Record<string, string> = {}
      for (const r of enriched) noteMap[r.id] = r.admin_note || ''
      setAdminNote(noteMap)
    } catch (err) {
      console.error('신고 목록 로딩 오류:', err)
    }
    setIsLoadingReports(false)
  }

  const handleUpdateReportStatus = async (reportId: string, newStatus: ReportStatus) => {
    setUpdatingId(reportId)
    try {
      await supabase.from('flash_reports').update({
        status:     newStatus,
        admin_note: adminNote[reportId] || null,
      }).eq('id', reportId)
      setReports(prev =>
        prev.map(r => r.id === reportId
          ? { ...r, status: newStatus, admin_note: adminNote[reportId] || null }
          : r
        )
      )
    } catch (err) {
      console.error('상태 업데이트 오류:', err)
    }
    setUpdatingId(null)
  }

  const filteredReports = reportStatusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === reportStatusFilter)

  const reportCounts = {
    all:       reports.length,
    pending:   reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved:  reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  if (authLoading || !authorized) {
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
              <Zap className="w-3.5 h-3.5 text-red-200" />
              <span className="text-xs text-red-200">관리자</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">플래시 관리</h1>
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
          {([
            { key: 'runs',    label: '플래시 목록' },
            { key: 'reports', label: `신고 관리${reportCounts.pending > 0 ? ` (${reportCounts.pending})` : ''}` },
            { key: 'seed',    label: '샘플 생성' },
          ] as { key: FlashSubTab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                subTab === t.key
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* ── 플래시 목록 ── */}
        {subTab === 'runs' && (
          isLoadingRuns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : runs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">플래시 모임이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map(run => {
                const ds = getDisplayStatus(run)
                const badge = RUN_STATUS_BADGE[ds]
                return (
                  <div key={run.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                          <span className="text-xs text-gray-400">{run.creator_name}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{run.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{sidoShort(run.sido)} {run.sigungu}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />{run.run_date.slice(5).replace('-','/')} {run.run_time.slice(0,5)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />{run.current_participants}/{run.max_participants}명
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link
                          href={`/flash/${run.id}`}
                          className="px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          보기
                        </Link>
                        {run.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(run.id)}
                            disabled={processingId === run.id}
                            className="px-2.5 py-1.5 text-xs text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-40"
                          >
                            {processingId === run.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : '취소'
                            }
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(run.id)}
                          disabled={processingId === run.id}
                          className="px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {processingId === run.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : '삭제'
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── 샘플 생성 ── */}
        {subTab === 'seed' && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Shuffle className="w-4 h-4 text-red-500" />
              <p className="text-sm font-semibold text-gray-800">플래시 샘플 데이터 생성</p>
            </div>
            <p className="text-xs text-gray-400">각 항목에 후보값을 줄바꿈으로 구분해 입력하세요. 생성 시 랜덤 조합됩니다.</p>

            {/* 회원 ID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">회원 로그인 ID <span className="text-red-500">*</span> <span className="text-gray-400">(줄바꿈 구분)</span></label>
              <textarea rows={3} value={seedCreatorIds} onChange={e => setSeedCreatorIds(e.target.value)}
                placeholder={"user01\nuser02\nuser03"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-0.5">티어는 해당 회원의 등급으로 자동 설정됩니다</p>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">제목 후보 <span className="text-red-500">*</span></label>
              <textarea rows={4} value={seedTitles} onChange={e => setSeedTitles(e.target.value)}
                placeholder={"한강 야경 러닝\n마포 새벽 번개런\n홍대 저녁 러닝\n잠실 주말 러닝"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {/* 지역 / 상세장소 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">지역 / 상세장소 <span className="text-red-500">*</span> <span className="text-gray-400">(시도/시군구/상세장소 슬래시 구분)</span></label>
              <textarea rows={5} value={seedRegions} onChange={e => setSeedRegions(e.target.value)}
                placeholder={"서울특별시/마포구/한강공원 광장 앞\n서울특별시/송파구/잠실 올림픽공원 입구\n부산광역시/해운대구/해운대해수욕장 중앙\n충청북도/청주시 상당구/충북대학교 정문 앞"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-0.5">예: 충청북도/청주시 상당구/충북대학교 정문 앞</p>
            </div>

            {/* 날짜 범위 + 시간 후보 */}
            <div className="border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">날짜 / 시간 설정</p>

              {/* 날짜 범위 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">날짜 범위 <span className="text-red-500">*</span> <span className="text-gray-400">(오늘 기준)</span></label>
                <div className="flex items-center gap-2">
                  <select value={seedDayStart} onChange={e => setSeedDayStart(Number(e.target.value))}
                    className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {[0,1,2,3,4,5,6,7].map(d => (
                      <option key={d} value={d}>+{d}일{d === 0 ? ' (오늘)' : ''}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm flex-shrink-0">~</span>
                  <select value={seedDayEnd} onChange={e => setSeedDayEnd(Number(e.target.value))}
                    className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {[0,1,2,3,4,5,6,7].filter(d => d >= seedDayStart).map(d => (
                      <option key={d} value={d}>+{d}일{d === 0 ? ' (오늘)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 시간 후보 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">시간 후보 <span className="text-red-500">*</span> <span className="text-gray-400">(HH:MM 형식, 줄바꿈 구분)</span></label>
                <textarea rows={3} value={seedTimes} onChange={e => setSeedTimes(e.target.value)}
                  placeholder={"06:00\n07:00\n18:30\n19:00"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-mono bg-white"
                />
              </div>
            </div>

            {/* 최대 인원 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">최대 인원 <span className="text-red-500">*</span> <span className="text-gray-400">(2 ~ 선택값 사이 랜덤)</span></label>
              <select value={seedMaxParticipants} onChange={e => setSeedMaxParticipants(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {[2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>{n}명 (2~{n}명 랜덤)</option>
                ))}
              </select>
            </div>

            {/* 카카오 URL */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">카카오 오픈채팅 URL <span className="text-red-500">*</span></label>
              <textarea rows={2} value={seedKakaoUrls} onChange={e => setSeedKakaoUrls(e.target.value)}
                placeholder={"https://open.kakao.com/o/sample1\nhttps://open.kakao.com/o/sample2"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-mono"
              />
            </div>

            {/* 예상 거리 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">예상 거리 <span className="text-gray-400">(선택)</span></label>
              <textarea rows={2} value={seedDistances} onChange={e => setSeedDistances(e.target.value)}
                placeholder={"5km\n10km"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-mono"
              />
            </div>

            {/* 생성 개수 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">생성 개수</label>
              <input type="number" min={1} max={100} value={seedCount} onChange={e => setSeedCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* 결과 */}
            {seedResult && (
              <div className={`p-3 rounded-lg text-sm font-medium ${seedResult.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                ✓ {seedResult.success}개 생성 완료{seedResult.failed > 0 ? ` / ${seedResult.failed}개 실패` : ''}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isGenerating
                ? <><Loader2 className="w-4 h-4 animate-spin" />생성 중...</>
                : <><Shuffle className="w-4 h-4" />{seedCount}개 플래시 생성</>
              }
            </button>
          </div>
        )}

        {/* ── 신고 관리 ── */}
        {subTab === 'reports' && (
          <>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setReportStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    reportStatusFilter === s
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {s === 'all' ? '전체' : REPORT_STATUS_LABELS[s]}{reportCounts[s] > 0 ? ` (${reportCounts[s]})` : ''}
                </button>
              ))}
            </div>

            {isLoadingReports ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <Flag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">신고 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReports.map(report => (
                  <div key={report.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REPORT_STATUS_COLORS[report.status]}`}>
                              {REPORT_STATUS_LABELS[report.status]}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(report.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{report.reason}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            신고자: {report.reporter_name} → 대상: {report.target_name}
                            {report.run_title && ` | ${report.run_title}`}
                          </p>
                        </div>
                        {expandedId === report.id
                          ? <ChevronUp   className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        }
                      </div>
                    </button>

                    {expandedId === report.id && (
                      <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div><span className="font-medium">모임:</span> {report.run_title || '-'}</div>
                          <div><span className="font-medium">날짜:</span> {report.run_date || '-'}</div>
                          <div><span className="font-medium">신고자:</span> {report.reporter_name}</div>
                          <div><span className="font-medium">신고 대상:</span> {report.target_name}</div>
                        </div>

                        {report.detail && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">상세 내용</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{report.detail}</p>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">관리자 메모</label>
                          <textarea
                            value={adminNote[report.id] || ''}
                            onChange={e => setAdminNote(prev => ({ ...prev, [report.id]: e.target.value }))}
                            rows={2}
                            placeholder="처리 내용을 메모하세요 (선택)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'reviewing')}
                            disabled={updatingId === report.id || report.status === 'reviewing'}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                          >
                            {updatingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                            확인중
                          </button>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                            disabled={updatingId === report.id || report.status === 'resolved'}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                          >
                            {updatingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            처리완료
                          </button>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                            disabled={updatingId === report.id || report.status === 'dismissed'}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                          >
                            {updatingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            기각
                          </button>
                        </div>

                        <div className="flex justify-end">
                          <Link
                            href={`/flash/${report.flash_run_id}`}
                            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            모임 페이지 보기 →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
