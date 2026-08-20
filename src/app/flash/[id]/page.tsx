'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MapPin, Users, Calendar, User, ArrowLeft, MessageCircle, Zap, Loader2, Activity, Pencil, X, ZoomIn, ThumbsUp, Siren } from 'lucide-react'

function isIosApp(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.userAgent.toLowerCase().includes('iosapp')
}

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
  tier: string[] | null
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
  grade: string | null
}


function maskName(name: string): string {
  if (!name || name.length <= 1 || name === '알 수 없음') return name
  return name[0] + '*' + name.slice(2)
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
  const [kickingUserId, setKickingUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [error, setError] = useState('')
  const [likesByUser, setLikesByUser] = useState<Record<string, number>>({})
  const [myLikedUserIds, setMyLikedUserIds] = useState<Set<string>>(new Set())
  const [myReportedUserIds, setMyReportedUserIds] = useState<Set<string>>(new Set())
  const [likingUserId, setLikingUserId] = useState<string | null>(null)
  const [reportTargetUserId, setReportTargetUserId] = useState<string | null>(null)
  const [showKakaoModal, setShowKakaoModal] = useState(false)

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
          .select('id, name, grade')
          .in('id', userIds)

        const userMap = new Map(userData?.map(u => [u.id, { name: u.name, grade: u.grade }]) || [])
        setParticipants(participantData.map(p => ({
          user_id: p.user_id,
          joined_at: p.joined_at,
          name: userMap.get(p.user_id)?.name || '알 수 없음',
          grade: userMap.get(p.user_id)?.grade || null,
        })))
      } else {
        setParticipants([])
      }

      // 좋아요 로드
      const participantIds = participantData?.map(p => p.user_id) || []

      // 현재 모임에서 내가 누른 좋아요 (ThumbsUp 활성화 여부)
      const { data: myLikesData } = await supabase
        .from('flash_likes')
        .select('liked_user_id')
        .eq('flash_run_id', id)
        .eq('liker_id', user!.id)

      const myLiked = new Set<string>()
      if (myLikesData) {
        for (const like of myLikesData) myLiked.add(like.liked_user_id)
      }
      setMyLikedUserIds(myLiked)

      // 전체 모임에서 각 참여자가 받은 좋아요 합산
      if (participantIds.length > 0) {
        const { data: totalLikesData } = await supabase
          .from('flash_likes')
          .select('liked_user_id')
          .in('liked_user_id', participantIds)

        const counts: Record<string, number> = {}
        if (totalLikesData) {
          for (const like of totalLikesData) {
            counts[like.liked_user_id] = (counts[like.liked_user_id] || 0) + 1
          }
        }
        setLikesByUser(counts)
      }

      // 내 신고 로드
      const { data: reportsData } = await supabase
        .from('flash_reports')
        .select('target_user_id')
        .eq('flash_run_id', id)
        .eq('reporter_id', user?.id)

      if (reportsData) {
        setMyReportedUserIds(new Set(reportsData.map(r => r.target_user_id)))
      }
    } catch (err) {
      console.error('모임 조회 오류:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async (targetUserId: string) => {
    if (!user || !run) return
    setLikingUserId(targetUserId)
    try {
      const isLiked = myLikedUserIds.has(targetUserId)
      if (isLiked) {
        await supabase
          .from('flash_likes')
          .delete()
          .eq('flash_run_id', run.id)
          .eq('liker_id', user.id)
          .eq('liked_user_id', targetUserId)
        setMyLikedUserIds(prev => { const n = new Set(prev); n.delete(targetUserId); return n })
        setLikesByUser(prev => ({ ...prev, [targetUserId]: Math.max(0, (prev[targetUserId] || 0) - 1) }))
      } else {
        await supabase
          .from('flash_likes')
          .insert({ flash_run_id: run.id, liker_id: user.id, liked_user_id: targetUserId })
        setMyLikedUserIds(prev => new Set(prev).add(targetUserId))
        setLikesByUser(prev => ({ ...prev, [targetUserId]: (prev[targetUserId] || 0) + 1 }))
      }
    } catch (err) {
      console.error('좋아요 오류:', err)
    } finally {
      setLikingUserId(null)
    }
  }

  const isParticipant = user ? participants.some(p => p.user_id === user.id) : false
  const isCreator = user ? run?.creator_id === user.id : false
  const isAdmin = user?.role === 'admin'
  const canManageParticipants = isCreator || isAdmin

  function getDisplayStatus(r: FlashRun): string {
    if (r.status === 'cancelled') return 'cancelled'
    const dt = new Date(`${r.run_date}T${r.run_time}`)
    if (dt < new Date()) return 'completed'
    if (r.current_participants >= r.max_participants) return 'closed'
    return 'open'
  }

  const GRADE_TO_TIER: Record<string, string> = {
    cheetah: '치타족',
    horse: '홀스족',
    wolf: '울프족',
    turtle: '터틀족',
    bolt: '볼타족',
  }

  const handleJoin = async () => {
    if (!user || !run) return

    // 티어 제한 체크
    if (run.tier && run.tier.length > 0) {
      const userTier = GRADE_TO_TIER[user.grade || '']
      if (!userTier || !run.tier.includes(userTier)) {
        setError(`이 플래시는 ${run.tier.join(', ')}만 참가 가능합니다`)
        return
      }
    }

    setIsJoining(true)
    setError('')
    try {
      // 최신 카운트를 DB에서 재확인 (race condition 방지)
      const { data: latest } = await supabase
        .from('flash_runs')
        .select('current_participants, max_participants')
        .eq('id', run.id)
        .single()
      if (!latest || latest.current_participants >= latest.max_participants) {
        setError('이미 마감된 플래시입니다')
        return
      }
      const { error: joinError } = await supabase
        .from('flash_participants')
        .insert({ flash_run_id: run.id, user_id: user.id })
      if (joinError) {
        if (joinError.code === '23505') { setError('이미 참여한 플래시입니다'); return }
        throw joinError
      }
      await supabase
        .from('flash_runs')
        .update({ current_participants: latest.current_participants + 1 })
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
    if (!confirm('플래시를 취소하시겠습니까?')) return
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

  const handleDelete = async () => {
    if (!run || !confirm('플래시를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return
    setIsDeleting(true)
    try {
      if (run.image_url) {
        const match = run.image_url.match(/competition-images\/(.+)$/)
        if (match) await supabase.storage.from('competition-images').remove([match[1]])
      }
      await supabase.from('flash_participants').delete().eq('flash_run_id', run.id)
      await supabase.from('flash_runs').delete().eq('id', run.id)
      router.push('/flash')
    } catch (err) {
      console.error('삭제 오류:', err)
      setError('삭제 처리 중 오류가 발생했습니다')
      setIsDeleting(false)
    }
  }

  const handleKickParticipant = async (targetUserId: string) => {
    if (!run || !confirm('해당 참여자를 취소 처리하시겠습니까?')) return
    setKickingUserId(targetUserId)
    try {
      await supabase
        .from('flash_participants')
        .delete()
        .eq('flash_run_id', run.id)
        .eq('user_id', targetUserId)

      const newCount = Math.max(0, run.current_participants - 1)
      await supabase
        .from('flash_runs')
        .update({ current_participants: newCount })
        .eq('id', run.id)

      await loadData()
    } catch (err) {
      console.error('참여자 취소 오류:', err)
      setError('참여자 취소 처리 중 오류가 발생했습니다')
    } finally {
      setKickingUserId(null)
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
    completed: { label: '완료',   cls: 'bg-gray-100 text-gray-500' },
    cancelled: { label: '취소', cls: 'bg-red-100 text-red-700' },
  }
  const displayStatus = getDisplayStatus(run)
  const statusInfo = STATUS_MAP[displayStatus] || STATUS_MAP.open
  const canEdit = (isCreator || isAdmin) && (displayStatus === 'open' || displayStatus === 'closed')
  const canDelete = (isCreator || isAdmin) && (displayStatus === 'cancelled' || displayStatus === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 이미지 라이트박스 */}
      {lightboxOpen && run.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >

          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={run.image_url}
            alt={run.title}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={() => setLightboxOpen(false)}
          />
        </div>
      )}

      {/* 카카오 오픈채팅 연결 모달 (iOS 앱 전용) */}
      {showKakaoModal && run && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-800">카카오 오픈채팅</p>
            </div>
            <p className="text-sm text-gray-600 mb-5">카카오톡 오픈채팅으로 연결하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowKakaoModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-yellow-900 text-sm font-medium text-center hover:bg-yellow-500"
                onClick={() => {
                  window.open(run.kakao_chat_url, '_system')
                  setShowKakaoModal(false)
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 확인 모달 */}
      {reportTargetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5">
            <div className="flex items-center gap-2 mb-3">
              <Siren className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-800">참가자 신고</p>
            </div>
            <p className="text-sm text-gray-600 mb-5">해당 참가자를 신고하시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setReportTargetUserId(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <Link
                href={`/flash/${run.id}/report/${reportTargetUserId}`}
                onClick={() => setReportTargetUserId(null)}
                className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium text-center hover:bg-orange-600 transition-colors"
              >
                확인
              </Link>
            </div>
          </div>
        </div>
      )}

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
                플래시 취소
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-red-500/60 rounded-lg text-xs font-medium border border-white/20 transition-colors"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                삭제
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
          {/* 이미지 (클릭 시 확대) */}
          {run.image_url && (
            <div
              className="relative cursor-zoom-in group"
              onClick={() => setLightboxOpen(true)}
            >
              <img src={run.image_url} alt={run.title} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <ZoomIn className="w-8 h-8 text-white drop-shadow" />
              </div>
            </div>
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
              {(run.distance || (run.tier && run.tier.length > 0)) && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{[run.distance, run.tier?.join(', ')].filter(Boolean).join(' · ')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>주최: {maskName(run.creator_name || '')}</span>
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
                <div className="space-y-1.5">
                  {participants.map((p, idx) => {
                    const isRunCreator = p.user_id === run.creator_id
                    const isKicking = kickingUserId === p.user_id
                    const isSelf = p.user_id === user.id
                    const isEnded = displayStatus === 'completed' || displayStatus === 'cancelled'
                    const showReview = isEnded && isParticipant && !isSelf
                    const isLiked = myLikedUserIds.has(p.user_id)
                    const isReported = myReportedUserIds.has(p.user_id)
                    const isLiking = likingUserId === p.user_id
                    return (
                      <div
                        key={p.user_id}
                        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5"
                      >
                        <span className="text-xs text-gray-400 w-5 text-center flex-shrink-0">{idx + 1}</span>
                        {p.grade && (
                          <img
                            src={`/images/grades/${p.grade}.png`}
                            alt={p.grade}
                            className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0"
                          />
                        )}
                        <span className="truncate flex-1">
                          {maskName(p.name)}
                          {isRunCreator && (
                            <span className="ml-1 text-xs text-red-500 font-medium">주최</span>
                          )}
                        </span>
                        {canManageParticipants && !isRunCreator && !isEnded && (
                          <button
                            onClick={() => handleKickParticipant(p.user_id)}
                            disabled={isKicking}
                            className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {isKicking ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          </button>
                        )}
                        {showReview && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleLike(p.user_id)}
                              disabled={isLiking}
                              className={`flex items-center gap-0.5 transition-colors disabled:opacity-50 ${
                                isLiked ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
                              <span className="text-xs">{likesByUser[p.user_id] || 0}</span>
                            </button>
                            {isReported ? (
                              <span className="text-xs text-gray-300">신고됨</span>
                            ) : (
                              <button
                                onClick={() => setReportTargetUserId(p.user_id)}
                                className="text-gray-400 hover:text-orange-500 transition-colors"
                              >
                                <Siren className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                    {isIosApp() ? (
                      <button
                        onClick={() => setShowKakaoModal(true)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        카카오 오픈채팅 대화하기
                      </button>
                    ) : (
                      <a
                        href={run.kakao_chat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        카카오 오픈채팅 대화하기
                      </a>
                    )}
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
                    마감된 플래시입니다
                  </div>
                )}
              </div>
            )}

            {(displayStatus === 'cancelled' || displayStatus === 'completed') && (
              <div className="text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-lg">
                {displayStatus === 'cancelled' ? '취소된 플래시입니다' : '완료된 플래시입니다'}
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
