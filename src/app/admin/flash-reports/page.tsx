'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Flag, ArrowLeft, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react'

type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

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

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: '접수',
  reviewing: '확인중',
  resolved: '처리완료',
  dismissed: '기각',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

export default function FlashReportsAdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [reports, setReports] = useState<FlashReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/'); return }
    checkAdminAndLoad()
  }, [user, authLoading])

  const checkAdminAndLoad = async () => {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()
    if (!profile || profile.role !== 'admin') { router.push('/'); return }
    await loadReports()
  }

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('flash_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (!data) { setIsLoading(false); return }

      // 사용자 이름 및 모임 정보 병렬 조회
      const reporterIds = [...new Set(data.map(r => r.reporter_id))]
      const targetIds = [...new Set(data.map(r => r.target_user_id))]
      const runIds = [...new Set(data.map(r => r.flash_run_id))]

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
        reporter_name: profileMap[r.reporter_id] || '알 수 없음',
        target_name: profileMap[r.target_user_id] || '알 수 없음',
        run_title: runMap[r.flash_run_id]?.title || '',
        run_date: runMap[r.flash_run_id]?.run_date || '',
      }))

      setReports(enriched)
      const noteMap: Record<string, string> = {}
      for (const r of enriched) noteMap[r.id] = r.admin_note || ''
      setAdminNote(noteMap)
    } catch (err) {
      console.error('신고 목록 로딩 오류:', err)
    }
    setIsLoading(false)
  }

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    setUpdatingId(reportId)
    try {
      await supabase.from('flash_reports').update({
        status: newStatus,
        admin_note: adminNote[reportId] || null,
      }).eq('id', reportId)
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus, admin_note: adminNote[reportId] || null } : r))
    } catch (err) {
      console.error('상태 업데이트 오류:', err)
    }
    setUpdatingId(null)
  }

  const filteredReports = statusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === statusFilter)

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Flag className="w-3.5 h-3.5 text-red-200" />
              <span className="text-xs text-red-200">관리자</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">플래시 신고 관리</h1>
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

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* 상태 필터 탭 */}
        <div className="flex gap-1.5 mb-4">
          {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {s === 'all' ? '전체' : STATUS_LABELS[s]} {counts[s] > 0 && `(${counts[s]})`}
            </button>
          ))}
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Flag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">신고 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReports.map(report => (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status]}`}>
                          {STATUS_LABELS[report.status]}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{report.reason}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        신고자: {report.reporter_name} → 대상: {report.target_name}
                        {report.run_title && ` | ${report.run_title}`}
                      </p>
                    </div>
                    {expandedId === report.id
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
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
                        onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                        disabled={updatingId === report.id || report.status === 'reviewing'}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {updatingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                        확인중
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                        disabled={updatingId === report.id || report.status === 'resolved'}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {updatingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        처리완료
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        disabled={updatingId === report.id || report.status === 'dismissed'}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
      </div>
    </div>
  )
}
