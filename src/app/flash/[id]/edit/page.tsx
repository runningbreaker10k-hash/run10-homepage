'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { KOREA_REGIONS, SIDO_LIST } from '@/lib/korea-regions'
import ImageUpload from '@/components/ImageUpload'
import { ArrowLeft, Zap, Loader2 } from 'lucide-react'

const DISTANCE_OPTIONS = ['3km', '5km', '7km', '10km', '15km', '21km', '기타']
const TIER_OPTIONS = [
  { value: '치타족', label: '치타', color: 'text-amber-500',  activeBg: 'bg-amber-50',  activeBorder: 'border-amber-300'  },
  { value: '홀스족', label: '홀스', color: 'text-rose-700',   activeBg: 'bg-rose-50',   activeBorder: 'border-rose-300'   },
  { value: '울프족', label: '울프', color: 'text-blue-700',   activeBg: 'bg-blue-50',   activeBorder: 'border-blue-300'   },
  { value: '터틀족', label: '터틀', color: 'text-green-600',  activeBg: 'bg-green-50',  activeBorder: 'border-green-300'  },
]

function getTimeOptions() {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return times
}

export default function FlashEditPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [title, setTitle] = useState('')
  const [runDate, setRunDate] = useState('')
  const [runTime, setRunTime] = useState('07:00')
  const [maxParticipants, setMaxParticipants] = useState(6)
  const [kakaoUrl, setKakaoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [distance, setDistance] = useState('')
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [currentParticipants, setCurrentParticipants] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const timeOptions = getTimeOptions()

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/'); return }
    loadRun()
  }, [user, authLoading, id])

  const loadRun = async () => {
    if (!user) return
    setIsLoadingData(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('flash_runs')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !data) { router.push('/flash'); return }

      // 작성자 또는 관리자만 수정 가능
      if (data.creator_id !== user.id && user.role !== 'admin') {
        router.push(`/flash/${id}`)
        return
      }

      // 종료/취소 상태는 수정 불가
      const isPast = new Date(`${data.run_date}T${data.run_time}`) < new Date()
      if (data.status === 'cancelled' || isPast) {
        router.push(`/flash/${id}`)
        return
      }

      setSido(data.sido)
      setSigungu(data.sigungu)
      setLocationDetail(data.location_detail)
      setTitle(data.title)
      setRunDate(data.run_date)
      setRunTime(data.run_time.slice(0, 5))
      setMaxParticipants(data.max_participants)
      setKakaoUrl(data.kakao_chat_url)
      setDescription(data.description || '')
      setDistance(data.distance || '')
      setSelectedTiers(data.tier || [])
      setImageUrl(data.image_url || '')
      setCurrentParticipants(data.current_participants)
    } catch (err) {
      console.error('모임 조회 오류:', err)
      router.push('/flash')
    } finally {
      setIsLoadingData(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    )
  }

  const sigunguList = sido ? KOREA_REGIONS[sido] || [] : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!sido || !sigungu) { setError('시/도와 구/군을 선택해주세요'); return }
    if (!locationDetail.trim()) { setError('상세 장소를 입력해주세요'); return }
    if (!title.trim()) { setError('제목을 입력해주세요'); return }
    if (!runDate) { setError('날짜를 선택해주세요'); return }
    const selectedDateTime = new Date(`${runDate}T${runTime}`)
    const minDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
    if (selectedDateTime < minDateTime) { setError('플래시 시간은 현재 시간보다 2시간 이후여야 합니다'); return }
    if (!kakaoUrl.trim()) { setError('카카오 오픈채팅 URL을 입력해주세요'); return }
    if (!kakaoUrl.startsWith('http')) { setError('올바른 URL을 입력해주세요'); return }
    if (maxParticipants < currentParticipants) {
      setError(`현재 ${currentParticipants}명이 참여 중입니다. 최대 인원은 ${currentParticipants}명 이상이어야 합니다`)
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase
        .from('flash_runs')
        .update({
          sido,
          sigungu,
          location_detail: locationDetail.trim(),
          title: title.trim(),
          run_date: runDate,
          run_time: runTime + ':00',
          max_participants: maxParticipants,
          kakao_chat_url: kakaoUrl.trim(),
          description: description.trim() || null,
          distance: distance || null,
          tier: selectedTiers.length > 0 ? selectedTiers : null,
          image_url: imageUrl || null,
        })
        .eq('id', id)

      if (updateError) throw updateError
      router.push(`/flash/${id}`)
    } catch (err) {
      console.error('모임 수정 오류:', err)
      setError('수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap className="w-3.5 h-3.5 text-red-200" />
              <span className="text-xs text-red-200">런텐플래시</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">플래시 수정</h1>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium border border-white/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            뒤로
          </button>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5">

          {/* 함께 달릴 티어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">함께 달릴 티어</label>
            <div className="grid grid-cols-3 gap-2">
              {TIER_OPTIONS.map(t => {
                const checked = selectedTiers.includes(t.value)
                return (
                  <label
                    key={t.value}
                    className={`flex items-center gap-1.5 px-2 py-2 sm:px-3 sm:py-2.5 border rounded-lg cursor-pointer transition-colors ${
                      checked ? `${t.activeBorder} ${t.activeBg}` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedTiers(prev => {
                          const next = prev.includes(t.value) ? prev.filter(x => x !== t.value) : [...prev, t.value]
                          return next.length === TIER_OPTIONS.length ? [] : next
                        })
                      }
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-gray-300 rounded flex-shrink-0"
                    />
                    <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${checked ? t.color : 'text-gray-500'}`}>{t.label}</span>
                  </label>
                )
              })}
              <label
                className={`flex items-center gap-1.5 px-2 py-2 sm:px-3 sm:py-2.5 border rounded-lg cursor-pointer transition-colors ${
                  selectedTiers.length === 0 ? 'border-gray-400 bg-gray-100' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTiers.length === 0}
                  onChange={() => setSelectedTiers([])}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-gray-300 rounded flex-shrink-0"
                />
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${selectedTiers.length === 0 ? 'text-gray-700' : 'text-gray-500'}`}>모든티어</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">비슷한 페이스의 러너 또는 전체 러너와 함께 달릴 수 있습니다</p>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              지역 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={sido}
                onChange={e => { setSido(e.target.value); setSigungu('') }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              >
                <option value="">시/도</option>
                {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={sigungu}
                onChange={e => setSigungu(e.target.value)}
                disabled={!sido}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:opacity-50"
                required
              >
                <option value="">구/군</option>
                {sigunguList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* 상세 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상세 장소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={locationDetail}
              onChange={e => setLocationDetail(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* 날짜/시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              날짜/시간 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={runDate}
                onChange={e => setRunDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                required
              />
              <select
                value={runTime}
                onChange={e => setRunTime(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 최대 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              최대 인원 <span className="text-red-500">*</span>
            </label>
            <select
              value={maxParticipants}
              onChange={e => setMaxParticipants(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              {[2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n} disabled={n < currentParticipants}>
                  {n}명{n < currentParticipants ? ' (현재 인원 초과)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">현재 {currentParticipants}명 참여 중</p>
          </div>

          {/* 카카오 오픈채팅 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              카카오 오픈채팅 URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={kakaoUrl}
              onChange={e => setKakaoUrl(e.target.value)}
              placeholder="https://open.kakao.com/..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* 선택 사항 */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wide">선택 사항</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">소개글</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{description.length}/200</p>
            </div>

            {/* 예상 거리 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">예상 거리</label>
              <select
                value={distance}
                onChange={e => setDistance(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">선택 안함</option>
                {DISTANCE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이미지</label>
              <ImageUpload
                onImageUploaded={url => setImageUrl(url)}
                currentImageUrl={imageUrl}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />저장 중...</>
            ) : '수정 완료'}
          </button>
        </form>
      </div>
    </div>
  )
}
