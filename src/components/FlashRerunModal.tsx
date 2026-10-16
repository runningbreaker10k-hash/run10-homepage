'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { KOREA_REGIONS, SIDO_LIST } from '@/lib/korea-regions'
import ImageUpload from '@/components/ImageUpload'
import { X, Loader2, AlertTriangle, RotateCcw } from 'lucide-react'

const DISTANCE_OPTIONS = ['3km', '5km', '7km', '10km', '15km', '21km', '기타']
const TIER_OPTIONS = ['치타족', '홀스족', '울프족', '터틀족']
const PARTICIPANT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10]

type FieldKey =
  | 'creator' | 'title' | 'region' | 'location' | 'maxParticipants'
  | 'distance' | 'tier' | 'kakaoUrl' | 'description' | 'image'

interface FormValues {
  creatorUserId: string
  title: string
  sido: string
  sigungu: string
  locationDetail: string
  maxParticipants: number
  distance: string
  tier: string[]
  kakaoUrl: string
  description: string
  imageUrl: string
}

function getTodayStr() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function getAvailableTimeOptions(selectedDate: string) {
  const allTimes: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      allTimes.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  if (selectedDate !== getTodayStr()) return allTimes
  const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const minH = minTime.getHours()
  const minM = minTime.getMinutes()
  return allTimes.filter(t => {
    const [h, m] = t.split(':').map(Number)
    return h > minH || (h === minH && m >= minM)
  })
}

export async function deleteFlashRunCascade(runId: string) {
  await Promise.all([
    supabase.from('flash_participants').delete().eq('flash_run_id', runId),
    supabase.from('flash_likes').delete().eq('flash_run_id', runId),
    supabase.from('flash_reports').delete().eq('flash_run_id', runId),
  ])
  const { error } = await supabase.from('flash_runs').delete().eq('id', runId)
  if (error) throw error
}

interface Props {
  runId: string
  openReportCount: number
  onClose: () => void
  onDone: () => void
}

export default function FlashRerunModal({ runId, openReportCount, onClose, onDone }: Props) {
  const [loading, setLoading] = useState(true)
  const [original, setOriginal] = useState<FormValues | null>(null)
  const [values, setValues] = useState<FormValues | null>(null)
  const [creatorName, setCreatorName] = useState('')
  const [checked, setChecked] = useState<Set<FieldKey>>(new Set())
  const [runDate, setRunDate] = useState(getTodayStr())
  const [runTime, setRunTime] = useState(() => getAvailableTimeOptions(getTodayStr())[0] ?? '00:00')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: run } = await supabase.from('flash_runs').select('*').eq('id', runId).single()
      if (!run) { setError('플래시를 찾을 수 없습니다'); setLoading(false); return }
      const { data: creator } = await supabase
        .from('users').select('user_id, name').eq('id', run.creator_id).single()
      const v: FormValues = {
        creatorUserId:   creator?.user_id || '',
        title:           run.title,
        sido:            run.sido,
        sigungu:         run.sigungu,
        locationDetail:  run.location_detail || '',
        maxParticipants: run.max_participants,
        distance:        run.distance || '',
        tier:            run.tier || [],
        kakaoUrl:        run.kakao_chat_url || '',
        description:     run.description || '',
        imageUrl:        run.image_url || '',
      }
      setCreatorName(creator?.name || '알 수 없음')
      setOriginal(v)
      setValues(v)
      setLoading(false)
    }
    load()
  }, [runId])

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues(prev => (prev ? { ...prev, [key]: value } : prev))

  const toggleField = (key: FieldKey) => {
    // 체크 해제 시 원래 값으로 복원
    if (checked.has(key) && original) setValues(v => v && restoreField(v, original, key))
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleDateChange = (d: string) => {
    setRunDate(d)
    const available = getAvailableTimeOptions(d)
    if (!available.includes(runTime)) setRunTime(available[0] ?? '00:00')
  }

  const handleSubmit = async () => {
    if (!values) return
    setError('')

    if (!values.title.trim()) { setError('제목을 입력해주세요'); return }
    if (!values.sido || !values.sigungu) { setError('시/도와 구/군을 선택해주세요'); return }
    if (!values.locationDetail.trim()) { setError('상세 장소를 입력해주세요'); return }
    if (!values.kakaoUrl.trim().startsWith('http')) { setError('올바른 오픈채팅 URL을 입력해주세요'); return }
    if (new Date(`${runDate}T${runTime}:00`) < new Date(Date.now() + 2 * 60 * 60 * 1000)) {
      setError('플래시 시간은 현재 시간으로부터 2시간 이후여야 합니다'); return
    }

    const { data: creator } = await supabase
      .from('users').select('id').eq('user_id', values.creatorUserId.trim().toLowerCase()).single()
    if (!creator) { setError(`회원 ID "${values.creatorUserId}"를 찾을 수 없습니다`); return }

    const warn = openReportCount > 0
      ? `\n\n⚠ 처리되지 않은 신고 ${openReportCount}건도 함께 삭제됩니다.`
      : ''
    if (!confirm(`새 플래시로 재등록하고 기존 플래시를 삭제합니다.\n기존 참여자·좋아요·신고 기록이 모두 삭제됩니다.${warn}\n\n진행하시겠습니까?`)) return

    setSubmitting(true)
    try {
      const { data: newRun, error: insertError } = await supabase
        .from('flash_runs')
        .insert({
          creator_id:           creator.id,
          sido:                 values.sido,
          sigungu:              values.sigungu,
          location_detail:      values.locationDetail.trim(),
          title:                values.title.trim(),
          run_date:             runDate,
          run_time:             runTime + ':00',
          max_participants:     values.maxParticipants,
          current_participants: 1,
          kakao_chat_url:       values.kakaoUrl.trim(),
          description:          values.description.trim() || null,
          distance:             values.distance || null,
          tier:                 values.tier.length > 0 ? values.tier : null,
          image_url:            values.imageUrl || null,
          status:               'open',
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      await supabase.from('flash_participants').insert({ flash_run_id: newRun.id, user_id: creator.id })

      // 새 플래시 생성이 성공한 뒤에만 기존 플래시 삭제
      await deleteFlashRunCascade(runId)

      onDone()
    } catch (err) {
      console.error('재등록 오류:', err)
      setError('재등록에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  const sigunguList = values?.sido ? KOREA_REGIONS[values.sido] || [] : []
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:bg-gray-50 disabled:text-gray-500'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-600" />
            <h2 className="font-bold text-gray-900">플래시 재등록</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !values ? (
          <div className="flex items-center justify-center py-16">
            {error
              ? <p className="text-sm text-red-600">{error}</p>
              : <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-5 py-4 space-y-3">
              {openReportCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>처리되지 않은 신고 <strong>{openReportCount}건</strong>이 있습니다. 재등록하면 신고 기록도 함께 삭제됩니다.</span>
                </div>
              )}
              <p className="text-xs text-gray-500">수정할 항목만 체크하세요. 체크하지 않은 항목은 기존 내용 그대로 등록됩니다.</p>

              {/* 날짜·시간 (항상 수정) */}
              <Field label="날짜 · 시간" checked locked>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={runDate} min={getTodayStr()} onChange={e => handleDateChange(e.target.value)} className={inputCls} />
                  <select value={runTime} onChange={e => setRunTime(e.target.value)} className={inputCls}>
                    {getAvailableTimeOptions(runDate).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </Field>

              <Field label="작성자 (회원 ID)" checked={checked.has('creator')} onToggle={() => toggleField('creator')}>
                <input
                  value={values.creatorUserId}
                  onChange={e => set('creatorUserId', e.target.value)}
                  disabled={!checked.has('creator')}
                  placeholder="회원 ID"
                  className={inputCls}
                />
                {!checked.has('creator') && (
                  <p className="text-xs text-gray-400 mt-1">현재 작성자: {creatorName}</p>
                )}
              </Field>

              <Field label="제목" checked={checked.has('title')} onToggle={() => toggleField('title')}>
                <input value={values.title} onChange={e => set('title', e.target.value)} disabled={!checked.has('title')} className={inputCls} />
              </Field>

              <Field label="지역" checked={checked.has('region')} onToggle={() => toggleField('region')}>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={values.sido}
                    onChange={e => { set('sido', e.target.value); set('sigungu', '') }}
                    disabled={!checked.has('region')}
                    className={inputCls}
                  >
                    <option value="">시/도</option>
                    {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={values.sigungu}
                    onChange={e => set('sigungu', e.target.value)}
                    disabled={!checked.has('region')}
                    className={inputCls}
                  >
                    <option value="">구/군</option>
                    {sigunguList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </Field>

              <Field label="상세 장소" checked={checked.has('location')} onToggle={() => toggleField('location')}>
                <input value={values.locationDetail} onChange={e => set('locationDetail', e.target.value)} disabled={!checked.has('location')} className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="최대 인원" checked={checked.has('maxParticipants')} onToggle={() => toggleField('maxParticipants')}>
                  <select
                    value={values.maxParticipants}
                    onChange={e => set('maxParticipants', Number(e.target.value))}
                    disabled={!checked.has('maxParticipants')}
                    className={inputCls}
                  >
                    {PARTICIPANT_OPTIONS.map(n => <option key={n} value={n}>{n}명</option>)}
                  </select>
                </Field>
                <Field label="거리" checked={checked.has('distance')} onToggle={() => toggleField('distance')}>
                  <select
                    value={values.distance}
                    onChange={e => set('distance', e.target.value)}
                    disabled={!checked.has('distance')}
                    className={inputCls}
                  >
                    <option value="">선택 안 함</option>
                    {DISTANCE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="등급" checked={checked.has('tier')} onToggle={() => toggleField('tier')}>
                <div className="flex flex-wrap gap-1.5">
                  {TIER_OPTIONS.map(t => {
                    const on = values.tier.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={!checked.has('tier')}
                        onClick={() => set('tier', on ? values.tier.filter(x => x !== t) : [...values.tier, t])}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors disabled:cursor-not-allowed ${
                          on ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                  {values.tier.length === 0 && <span className="text-xs text-gray-400 self-center">전체</span>}
                </div>
              </Field>

              <Field label="오픈채팅 URL" checked={checked.has('kakaoUrl')} onToggle={() => toggleField('kakaoUrl')}>
                <input value={values.kakaoUrl} onChange={e => set('kakaoUrl', e.target.value)} disabled={!checked.has('kakaoUrl')} className={inputCls} />
              </Field>

              <Field label="설명" checked={checked.has('description')} onToggle={() => toggleField('description')}>
                <textarea
                  value={values.description}
                  onChange={e => set('description', e.target.value)}
                  disabled={!checked.has('description')}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              <Field label="이미지" checked={checked.has('image')} onToggle={() => toggleField('image')}>
                {checked.has('image') ? (
                  <ImageUpload onImageUploaded={url => set('imageUrl', url)} currentImageUrl={values.imageUrl} folder="flash" />
                ) : values.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={values.imageUrl} alt="" className="h-20 rounded-lg object-cover" />
                ) : (
                  <p className="text-xs text-gray-400">이미지 없음</p>
                )}
              </Field>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />재등록 중...</> : '재등록'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function restoreField(v: FormValues, o: FormValues, key: FieldKey): FormValues {
  switch (key) {
    case 'creator':         return { ...v, creatorUserId: o.creatorUserId }
    case 'title':           return { ...v, title: o.title }
    case 'region':          return { ...v, sido: o.sido, sigungu: o.sigungu }
    case 'location':        return { ...v, locationDetail: o.locationDetail }
    case 'maxParticipants': return { ...v, maxParticipants: o.maxParticipants }
    case 'distance':        return { ...v, distance: o.distance }
    case 'tier':            return { ...v, tier: o.tier }
    case 'kakaoUrl':        return { ...v, kakaoUrl: o.kakaoUrl }
    case 'description':     return { ...v, description: o.description }
    case 'image':           return { ...v, imageUrl: o.imageUrl }
  }
}

function Field({
  label, checked, locked, onToggle, children,
}: {
  label: string
  checked: boolean
  locked?: boolean
  onToggle?: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-lg border p-3 ${checked ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
      <label className={`flex items-center gap-2 mb-2 ${locked ? '' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={onToggle}
          className="w-4 h-4 text-red-600 rounded border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {locked && <span className="text-xs text-red-500">필수 변경</span>}
      </label>
      {children}
    </div>
  )
}
