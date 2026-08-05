'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Flag, Loader2, Upload, X } from 'lucide-react'

const REPORT_REASONS = [
  '욕설 및 비하 발언',
  '성적 발언 또는 성희롱',
  '개인정보 무단 공유',
  '스팸 또는 광고',
  '노쇼 (참여 후 무단 불참)',
  '부적절한 신체 접촉',
  '위협 또는 협박',
  '허위 정보 제공',
  '혐오 발언 (인종, 성별, 종교 등)',
  '불법 행위',
  '기타',
]

function maskName(name: string) {
  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function FlashReportPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const flashRunId = params.id as string
  const targetUserId = params.targetUserId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [accessError, setAccessError] = useState('')

  // 대상 정보
  const [targetName, setTargetName] = useState('')
  const [runTitle, setRunTitle] = useState('')
  const [runDate, setRunDate] = useState('')

  // 폼
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [content, setContent] = useState('')
  const [phone, setPhone] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidencePreview, setEvidencePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/'); return }
    validateAndLoad()
  }, [user, authLoading])

  const validateAndLoad = async () => {
    try {
      const { data: run } = await supabase
        .from('flash_runs')
        .select('id, status, run_date, run_time, title')
        .eq('id', flashRunId)
        .single()

      if (!run) { setAccessError('모임을 찾을 수 없습니다'); setIsLoading(false); return }

      const runDateTime = new Date(`${run.run_date}T${run.run_time}`)
      const isCompleted = runDateTime < new Date() && run.status !== 'cancelled'
      const isCancelled = run.status === 'cancelled'

      if (!isCompleted && !isCancelled) {
        setAccessError('종료된 모임에서만 신고할 수 있습니다')
        setIsLoading(false)
        return
      }

      const { data: myParticipation } = await supabase
        .from('flash_participants')
        .select('id')
        .eq('flash_run_id', flashRunId)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (!myParticipation) {
        setAccessError('모임 참여자만 신고할 수 있습니다')
        setIsLoading(false)
        return
      }

      if (targetUserId === user!.id) {
        setAccessError('자기 자신을 신고할 수 없습니다')
        setIsLoading(false)
        return
      }

      const { data: targetParticipation } = await supabase
        .from('flash_participants')
        .select('user_id')
        .eq('flash_run_id', flashRunId)
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (!targetParticipation) {
        setAccessError('신고 대상을 찾을 수 없습니다')
        setIsLoading(false)
        return
      }

      const { data: existingReport } = await supabase
        .from('flash_reports')
        .select('id')
        .eq('flash_run_id', flashRunId)
        .eq('reporter_id', user!.id)
        .eq('target_user_id', targetUserId)
        .maybeSingle()

      if (existingReport) {
        setAccessError('이미 신고한 참여자입니다')
        setIsLoading(false)
        return
      }

      const { data: targetProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', targetUserId)
        .single()

      if (targetProfile) setTargetName(maskName(targetProfile.name))
      setRunTitle(run.title)
      setRunDate(run.run_date.replace(/-/g, '.'))
      setIsLoading(false)
    } catch (err) {
      console.error('신고 페이지 오류:', err)
      setAccessError('오류가 발생했습니다')
      setIsLoading(false)
    }
  }

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('이미지 파일만 업로드 가능합니다'); return }
    if (file.size > 5 * 1024 * 1024) { alert('파일 크기는 5MB 이하여야 합니다'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `flash-reports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('competition-images').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('competition-images').getPublicUrl(path)
      setEvidenceUrl(publicUrl)
      setEvidencePreview(publicUrl)
    } catch (err) {
      alert('이미지 업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
  }

  const removeEvidence = () => {
    setEvidenceUrl('')
    setEvidencePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!reason) { setFormError('신고 사유를 선택해주세요'); return }
    if (reason === '기타' && !customReason.trim()) { setFormError('기타 사유를 입력해주세요'); return }
    if (!content.trim()) { setFormError('신고 내용을 입력해주세요'); return }
    const phoneDigits = phone.replace(/\D/g, '')
    if (!phoneDigits || phoneDigits.length < 10) { setFormError('올바른 전화번호를 입력해주세요'); return }
    if (!agreed) { setFormError('확인 사항에 동의해주세요'); return }

    const finalReason = reason === '기타' ? `기타: ${customReason.trim()}` : reason

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('flash_reports').insert({
        flash_run_id: flashRunId,
        reporter_id: user!.id,
        target_user_id: targetUserId,
        reason: finalReason,
        content: content.trim(),
        phone: phone.trim(),
        evidence_url: evidenceUrl || null,
        status: 'pending',
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('신고 오류:', err)
      setFormError('신고 제출에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
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
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Flag className="w-3.5 h-3.5 text-red-200" />
              <span className="text-xs text-red-200">런텐플래시 / 신고하기</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">신고하기</h1>
          </div>
          <Link
            href={`/flash/${flashRunId}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium border border-white/20 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            뒤로
          </Link>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5">
        {accessError ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">{accessError}</p>
            <Link
              href={`/flash/${flashRunId}`}
              className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              모임으로 돌아가기
            </Link>
          </div>
        ) : submitted ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flag className="w-6 h-6 text-orange-500" />
            </div>
            <p className="font-medium text-gray-800 mb-1">신고가 접수되었습니다</p>
            <p className="text-sm text-gray-500 mb-5">검토 후 운영 정책에 따라 처리됩니다</p>
            <Link
              href={`/flash/${flashRunId}`}
              className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              모임으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {/* 안내 섹션 */}
            <div className="flex items-center gap-4 py-6 mb-2">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-black text-red-500">!</span>
              </div>
              <p className="text-lg font-bold text-gray-800 leading-snug">
                건전한 러닝 문화를 위해<br />
                신고 내용을 확인 후 접수해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-5">

              {/* 신고 대상 정보 */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">신고 대상 참여자</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-12 flex-shrink-0">모임</span>
                    <span className="text-gray-700 font-medium">{runTitle}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-12 flex-shrink-0">대상</span>
                    <span className="text-gray-700">{targetName}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-12 flex-shrink-0">모임일</span>
                    <span className="text-gray-700">{runDate}</span>
                  </div>
                </div>
              </div>

              {/* 신고 사유 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  신고 사유 <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={e => { setReason(e.target.value); setCustomReason('') }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">신고 사유를 선택해 주세요</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {reason === '기타' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    maxLength={100}
                    placeholder="기타 사유를 직접 입력해주세요"
                    className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
              </div>

              {/* 신고 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  신고 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="신고의 사유와 발생 상황을 구체적으로 작성해 주세요"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{content.length}/500</p>
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-400 mt-1">처리 결과 안내를 위해 연락처가 필요합니다</p>
              </div>

              {/* 증빙자료 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  증빙자료 <span className="text-xs text-gray-400">(선택)</span>
                </label>
                {evidencePreview ? (
                  <div className="relative">
                    <img
                      src={evidencePreview}
                      alt="증빙자료"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeEvidence}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEvidenceUpload}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        <p className="text-xs text-gray-400">업로드 중...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <p className="text-xs text-gray-500">이미지 업로드</p>
                        <p className="text-xs text-gray-400">JPG, PNG, GIF 최대 5MB</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 확인 동의 */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 flex-shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  신고 내용을 사실에 근거하여 작성했음을 확인합니다.
                  <span className="text-gray-400"> 허위 신고 시 이용이 제한될 수 있습니다.</span>
                </span>
              </label>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/flash/${flashRunId}`}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm text-center transition-colors"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />제출 중...</>
                    : '신고 접수하기'
                  }
                </button>
              </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
