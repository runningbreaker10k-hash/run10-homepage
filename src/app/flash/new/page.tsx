'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

  // 오늘이면 현재 시각 +2시간 이후만 허용
  const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const minH = minTime.getHours()
  const minM = minTime.getMinutes()
  return allTimes.filter(t => {
    const [h, m] = t.split(':').map(Number)
    return h > minH || (h === minH && m >= minM)
  })
}

export default function FlashNewPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [title, setTitle] = useState('')
  const [runDate, setRunDate] = useState(getTodayStr())
  const [runTime, setRunTime] = useState(() => getAvailableTimeOptions(getTodayStr())[0] ?? '00:00')
  const [maxParticipants, setMaxParticipants] = useState(6)
  const [kakaoUrl, setKakaoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [distance, setDistance] = useState('')
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const timeOptions = getAvailableTimeOptions(runDate)

  const handleDateChange = (newDate: string) => {
    setRunDate(newDate)
    const available = getAvailableTimeOptions(newDate)
    if (!available.includes(runTime)) {
      setRunTime(available[0] ?? '00:00')
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) router.push('/')
  }, [user, authLoading, router])


  if (authLoading || !user) {
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
    const selectedDateTime = new Date(`${runDate}T${runTime}:00`)
    if (selectedDateTime < new Date(Date.now() + 2 * 60 * 60 * 1000)) {
      setError('모임 시간은 현재 시간으로부터 2시간 이후여야 합니다')
      return
    }
    if (!kakaoUrl.trim()) { setError('카카오 오픈채팅 URL을 입력해주세요'); return }
    if (!kakaoUrl.startsWith('http')) { setError('올바른 URL을 입력해주세요'); return }

    setIsSubmitting(true)
    try {
      const { data: newRun, error: insertError } = await supabase
        .from('flash_runs')
        .insert({
          creator_id: user.id,
          sido,
          sigungu,
          location_detail: locationDetail.trim(),
          title: title.trim(),
          run_date: runDate,
          run_time: runTime + ':00',
          max_participants: maxParticipants,
          current_participants: 1,
          kakao_chat_url: kakaoUrl.trim(),
          description: description.trim() || null,
          distance: distance || null,
          tier: selectedTiers.length > 0 ? selectedTiers : null,
          image_url: imageUrl || null,
          status: 'open',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      await supabase.from('flash_participants').insert({
        flash_run_id: newRun.id,
        user_id: user.id,
      })

      router.push(`/flash/${newRun.id}`)
    } catch (err) {
      console.error('모임 생성 오류:', err)
      setError('모임 생성에 실패했습니다. 다시 시도해주세요.')
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
            <h1 className="text-xl sm:text-2xl font-bold">모임 만들기</h1>
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
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${selectedTiers.length === 0 ? 'text-gray-700' : 'text-gray-500'}`}>모든러너</span>
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
              placeholder="예) 한강 야경 러닝"
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
              placeholder="예) 한강공원 광장 앞"
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
                min={getTodayStr()}
                onChange={e => handleDateChange(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white [color-scheme:light]"
                required
              />
              <select
                value={runTime}
                onChange={e => setRunTime(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">현재 시각 기준 2시간 이후부터 선택 가능</p>
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
                <option key={n} value={n}>{n}명</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">설정 인원 도달 시 선착순 자동 마감</p>
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
            <p className="text-xs text-gray-400 mt-1">참여자에게만 공개됩니다</p>
          </div>

          {/* 선택 사항 구분선 */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wide">선택 사항</p>

            {/* 소개글 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">소개글</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="모임에 대해 간단히 소개해주세요"
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

            {/* 이미지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이미지</label>
              <ImageUpload
                onImageUploaded={url => setImageUrl(url)}
                currentImageUrl={imageUrl}
                folder="flash"
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
              <><Loader2 className="w-4 h-4 animate-spin" />등록 중...</>
            ) : '모임 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}
