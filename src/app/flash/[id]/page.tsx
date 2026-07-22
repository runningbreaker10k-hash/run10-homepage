'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MapPin, Users, Calendar, User, ArrowLeft, MessageCircle, Zap, Loader2, Activity, Pencil } from 'lucide-react'

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
  description: string | null
  distance: string | null
  pace: string | null
  status: 'open' | 'cancelled'
  image_url: string | null
  kakao_chat_url: string
  created_at: string
  creator_name?: string
}

interface Participant {
  user_id: string
  joined_at: string
  name: string
}

function FlashDetailContent() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [run, setRun] = useState<FlashRun | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) router.push('/')
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) return
    loadData()
  }, [user, authLoading, id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: runData, error: runError } = await supabase
        .from('flash_runs')
        .select('*')
        .eq('id', id)
        .single()

      if (runError || !runData) {
        router.push('/flash')
        return
      }

      const { data: creatorData } = await supabase
        .from('users')
        .select('name')
        .eq('id', runData.creator_id)
        .single()

      setRun({ ...runData, creator_name: creatorData?.name || '알 수 없음' })

      const { data: participantData } = await supabase
        .from('flash_participants')
        .select('user_id, joined_at')
        .eq('flash_run_id', id)
        .order('joined_at', { ascending: true })

      if (participantData && participantData.length > 0) {
        const userIds = participantData.map(p => p.user_id)
        const { data: userData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds)

        const nameMap = new Map(userData?.map(u => [u.id, u.name]) || [])
        setParticipants(participantData.map(p => ({
          user_id: p.user_id,
          joined_at: p.joined_at,
          name: nameMap.get(p.user_id) || '알 수 없음',
        })))
      } else {
        setParticipants([])
      }
    } catch (err) {
      console.error('모임 조회 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const isParticipant = user ? participants.some(p => p.user_id === user.id) : false
  const isCreator = user ? run?.creator_id === user.id : false
  const isAdmin = user?.role === 'admin'

  function getDisplayStatus(r: FlashRun): string {
    if (r.status === 'cancelled') return 'cancelled'
    const dt = new Date(`${r.run_date}T${r.run_time}`)
    if (dt < new Date()) return 'completed'
    if (r.current_participants >= r.max_participants) return 'closed'
    return 'open'
  }

  const canEdit = (isCreator || isAdmin) && run?.status !== 'cancelled'

  const handleJoin = async () => {
    if (!user || !run) return
    setIsJoining(true)
    setError('')
    try {
      if (run.current_participants >= run.max_participants) {
        setError('이미 마감된 모임입니다')
        return
      }
      const { error: joinError } = await supabase
        .from('flash_participants')
        .insert({ flash_run_id: run.id, user_id: user.id })
      if (joinError) throw joinError

      const newCount = run.current_participants + 1
      await supabase
        .from('flash_runs')
        .update({ current_participants: newCount })
        .eq('id', run.id)
      await loadData()
    } catch (err) {
      console.error('참여 오류:', err)
      setError('참여 처리 중 오류가 발생했습니다')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !run) return
    setIsLeaving(true)
    setError('')
    try {
      const { error: leaveError } = await supabase
        .from('flash_participants')
        .delete()
        .eq('flash_run_id', run.id)
        .eq('user_id', user.id)
      if (leaveError) throw leaveError

      const newCount = Math.max(0, run.current_participants - 1)
      await supabase
        .from('flash_runs')
        .update({ current_participants: newCount })
        .eq('id', run.id)
      await loadData()
    } catch (err) {
      console.error('참여 취소 오류:', err)
      setError('참여 취소 중 오류가 발생했습니다')
    } finally {
      setIsLeaving(false)
    }
  }

  const handleCancel = async () => {
    if (!run) return
    if (!confirm('모임을 취소하시겠습니까?')) return
    setIsCancelling(true)
    try {
      await supabase.from('flash_runs').update({ status: 'cancelled' }).eq('id', run.id)
      router.push('/flash')
    } catch (err) {
      console.error('취소 오류:', err)
      setError('취소 처리 중 오류가 발생했습니다')
    } finally {
      setIsCancelling(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  if (!run) return null

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    open:      { label: '모집중', cls: 'bg-green-100 text-green-800' },
    closed:    { label: '마감',   cls: 'bg-yellow-100 text-yellow-800' },
    completed: { label: '완료',   cls: 'bg-gray-100 text-gray-600' },
    cancelled: { label: '취소됨', cls: 'bg-red-100 text-red-700' },
  }
  const displayStatus = getDisplayStatus(run)
  const statusInfo = STATUS_MAP[displayStatus] || STATUS_MAP.open

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap className="w-3.5 h-3.5 text-red-200 flex-shrink-0" />
            <span className="text-xs text-red-200 truncate">런텐플래시</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <Link
                href={`/flash/${run.id}/edit`}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium border border-white/20 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                수정
              </Link>
            )}
            {(isCreator || isAdmin) && displayStatus !== 'cancelled' && displayStatus !== 'completed' && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium border border-white/20 transition-colors"
              >
                {isCancelling && <Loader2 className="w-3 h-3 animate-spin" />}
                취소
              </button>
            )}
            <Link
              href="/flash"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium border border-white/20 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              목록
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {run.image_url && (
            <img src={run.image_url} alt={run.title} className="w-full h-48 object-cover" />
          )}

          <div className="p-4 sm:p-5">
            {/* 제목 + 상태 */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{run.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusInfo.cls}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-2 text-sm text-gray-600 mb-5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div>{run.sido} {run.sigungu}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{run.location_detail}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{run.run_date.replace(/-/g, '.')} {run.run_time.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {run.current_participants}/{run.max_participants}명 참여 중
                  <span className="ml-1.5 text-xs text-gray-400">선착순 마감</span>
                </span>
              </div>
              {(run.distance || run.pace) && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{[run.distance, run.pace].filter(Boolean).join(' · ')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>주최: {run.creator_name}</span>
              </div>
            </div>

            {/* 소개글 */}
            {run.description && (
              <div className="border-t border-gray-100 pt-4 mb-5">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{run.description}</p>
              </div>
            )}

            {/* 참여자 목록 */}
            <div className="border-t border-gray-100 pt-4 mb-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
                <Users className="w-4 h-4" />
                참여자 ({participants.length}/{run.max_participants}명)
              </h2>
              {participants.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {participants.map((p, idx) => (
                    <div key={p.user_id} className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-400 w-4 text-center">{idx + 1}</span>
                      <span className="truncate">{p.name}</span>
                      {p.user_id === run.creator_id && (
                        <span className="text-xs text-red-500 font-medium flex-shrink-0">주최</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">아직 참여자가 없습니다</p>
              )}
            </div>

            {/* 에러 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {error}
              </div>
            )}

            {/* 액션 버튼 */}
            {displayStatus !== 'cancelled' && displayStatus !== 'completed' && (
              <div className="space-y-2">
                {isParticipant ? (
                  <>
                    <a
                      href={run.kakao_chat_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium text-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      카카오 오픈채팅 참여하기
                    </a>
                    {!isCreator && (
                      <button
                        onClick={handleLeave}
                        disabled={isLeaving}
                        className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {isLeaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        참여 취소
                      </button>
                    )}
                  </>
                ) : displayStatus === 'open' ? (
                  <button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                    참여하기
                  </button>
                ) : (
                  <div className="text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-lg">
                    마감된 모임입니다
                  </div>
                )}
              </div>
            )}

            {(displayStatus === 'cancelled' || displayStatus === 'completed') && (
              <div className="text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-lg">
                {displayStatus === 'cancelled' ? '취소된 모임입니다' : '완료된 모임입니다'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FlashDetailPage() {
  return (
    <Suspense>
      <FlashDetailContent />
    </Suspense>
  )
}
