'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import AuthModal from '@/components/AuthModal'

interface Registration {
  id: string
  competition_id: string
  distance: string
  shirt_size: string
  entry_fee: number
  payment_status: string
  competition_title: string
  bank_name: string
  bank_account: string
  account_holder: string
}

interface ParticipationGroup {
  id: string
  distance: string
  entry_fee: number
}

const BANK_LIST = [
  '카카오뱅크', '케이뱅크', '토스뱅크', '기업은행', 
  '국민은행', '우리은행', '신한은행', '하나은행', '농협은행', 
  '지역농축협', 'SC은행', '한국씨티은행', '우체국', '경남은행', 
  '광주은행', 'iM[구 대구은행]', '부산은행', '산림조합', '산업은행', 
  '저축은행', '새마을금고', '수협', '신협', '전북은행', '제주은행'
]

function RegistrationChangeRequestPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registration_id')
  const changeTypeParam = searchParams.get('change_type')

  const [registration, setRegistration] = useState<Registration | null>(null)
  const [participationGroups, setParticipationGroups] = useState<ParticipationGroup[]>([])

  const [changeType, setChangeType] = useState<'distance' | 'shirt_size'>(
    changeTypeParam === 'shirt_size' ? 'shirt_size' : 'distance'
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [requestedDistance, setRequestedDistance] = useState('')
  const [requestedEntryFee, setRequestedEntryFee] = useState(0)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  const [requestedShirtSize, setRequestedShirtSize] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (user && registrationId) {
      loadRegistrationData()
    } else if (!user) {
      setIsDataLoading(false)
    }
  }, [user, registrationId])

  const loadRegistrationData = async () => {
    if (!user || !registrationId) return
    setIsDataLoading(true)

    try {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select(`
          id,
          competition_id,
          distance,
          shirt_size,
          entry_fee,
          payment_status,
          competitions(title, bank_name, bank_account, account_holder)
        `)
        .eq('id', registrationId)
        .eq('user_id', user.id)
        .single()

      if (regError || !regData) {
        setError('신청 정보를 찾을 수 없습니다')
        setIsDataLoading(false)
        return
      }

      if (regData.payment_status !== 'confirmed') {
        setError('입금 확인된 신청만 정보 변경을 신청할 수 있습니다')
        setIsDataLoading(false)
        return
      }

      const competition = Array.isArray(regData.competitions) ? regData.competitions[0] : regData.competitions

      const reg = {
        ...regData,
        competition_title: competition?.title || '',
        bank_name: competition?.bank_name || '',
        bank_account: competition?.bank_account || '',
        account_holder: competition?.account_holder || ''
      } as Registration

      setRegistration(reg)
      setName(user.name || '')
      setPhone(user.phone || '')
      setAccountHolder(user.name || '')

      const { data: groupData } = await supabase
        .from('participation_groups')
        .select('id, distance, entry_fee')
        .eq('competition_id', reg.competition_id)
        .order('distance', { ascending: true })

      setParticipationGroups(groupData || [])
    } catch (err) {
      console.error('데이터 조회 오류:', err)
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setIsDataLoading(false)
    }
  }

  const handleDistanceChange = (groupId: string) => {
    const group = participationGroups.find(g => g.id === groupId)
    if (group) {
      setRequestedDistance(group.distance)
      setRequestedEntryFee(group.entry_fee)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (!registration) {
      setError('신청 정보를 찾을 수 없습니다')
      return
    }

    if (!name || !phone) {
      setError('이름과 연락처를 입력해주세요')
      return
    }

    if (changeType === 'distance') {
      if (!requestedDistance) {
        setError('변경할 종목을 선택해주세요')
        return
      }
      if (requestedDistance === registration.distance) {
        setError('현재 종목과 다른 종목을 선택해주세요')
        return
      }
      if (requestedEntryFee < registration.entry_fee) {
        if (!bankName || !accountNumber || !accountHolder) {
          setError('환불받을 계좌 정보를 모두 입력해주세요')
          return
        }
      }

      // 중복 종목 변경 요청 확인
      const { data: existingRequests, error: queryError } = await supabase
        .from('registration_change_requests')
        .select('id')
        .eq('registration_id', registration.id)
        .eq('change_type', 'distance')
        .eq('status', 'pending')
        .single()

      if (!queryError && existingRequests) {
        setError('이미 종목 변경 요청이 진행 중입니다. 관리자의 처리를 기다려주세요.')
        return
      }
    }

    if (changeType === 'shirt_size') {
      if (!requestedShirtSize) {
        setError('변경할 티셔츠 사이즈를 선택해주세요')
        return
      }
      if (requestedShirtSize === registration.shirt_size) {
        setError('현재 사이즈와 다른 사이즈를 선택해주세요')
        return
      }
    }

    submitRequest()
  }

  const submitRequest = async () => {
    if (!user || !registration) return
    setIsLoading(true)

    try {
      // 1. 종목 변경: DB에 요청 저장
      if (changeType === 'distance') {
        const { error: insertError } = await supabase
          .from('registration_change_requests')
          .insert({
            user_id: user.id,
            registration_id: registration.id,
            competition_id: registration.competition_id,
            change_type: 'distance',
            current_distance: registration.distance,
            requested_distance: requestedDistance,
            requested_entry_fee: requestedEntryFee,
            bank_name: requestedEntryFee < registration.entry_fee ? bankName : null,
            account_number: requestedEntryFee < registration.entry_fee ? accountNumber : null,
            account_holder: requestedEntryFee < registration.entry_fee ? accountHolder : null,
            status: 'pending'
          })

        if (insertError) {
          setError('신청 중 오류가 발생했습니다')
          return
        }
      }

      // 2. 티셔츠 변경: 바로 registrations 업데이트
      if (changeType === 'shirt_size') {
        const { error: updateError } = await supabase
          .from('registrations')
          .update({ shirt_size: requestedShirtSize })
          .eq('id', registration.id)

        if (updateError) {
          setError('변경 중 오류가 발생했습니다')
          return
        }
      }

      setIsSubmitted(true)
    } catch (err) {
      setError('처리 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <AuthModal isOpen={true} onClose={() => router.back()} />
  }

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">신청정보 변경</h1>
          </div>
        </section>
        <section className="py-8 sm:py-12">
          <div className="max-w-lg mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">요청 완료</h1>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {changeType === 'distance' ? '신청이 완료되었습니다' : '변경이 완료되었습니다'}
              </h2>
              <p className="text-gray-600 mb-6">
                {changeType === 'distance'
                  ? '신청하신 종목 변경이 정상적으로 접수되었습니다.'
                  : '티셔츠 사이즈가 정상적으로 변경되었습니다.'}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/competitions/${registration?.competition_id}`)}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  대회 상세보기로 이동
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">신청정보 변경</h1>
              <p className="text-lg md:text-xl text-red-100">입금 완료 후 신청 정보를 변경합니다</p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm sm:text-base font-medium touch-manipulation backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span>뒤로가기</span>
            </button>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="max-w-lg mx-auto px-4">
          {!registration && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-red-600">{error || '신청 정보를 찾을 수 없습니다'}</p>
            </div>
          )}

          {registration && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-900">신청정보 변경 요청</h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* 신청 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">대회명</span>
                  <span className="font-medium">{registration.competition_title}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">현재 종목</span>
                  <span className="font-medium">{registration.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">이름</span>
                  <span className="font-medium">{name}</span>
                </div>
              </div>

              {/* 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="010-0000-0000"
                  required
                />
              </div>

              {/* 변경 신청 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  변경 신청 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="changeType"
                      value="distance"
                      checked={changeType === 'distance'}
                      onChange={(e) => setChangeType(e.target.value as 'distance')}
                      className="h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">종목 변경(약 1-2일 소요)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="changeType"
                      value="shirt_size"
                      checked={changeType === 'shirt_size'}
                      onChange={(e) => setChangeType(e.target.value as 'shirt_size')}
                      className="h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">티셔츠 변경(바로 수정)</span>
                  </label>
                </div>
              </div>

              {/* 종목 변경 */}
              {changeType === 'distance' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      변경할 종목 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requestedDistance}
                      onChange={(e) => handleDistanceChange(
                        participationGroups.find(g => g.distance === e.target.value)?.id || ''
                      )}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="">종목을 선택해주세요</option>
                      {participationGroups
                        .filter(g => g.distance !== registration.distance)
                        .map((group) => (
                          <option key={group.id} value={group.distance}>
                            {group.distance} - ₩{group.entry_fee?.toLocaleString()}
                          </option>
                        ))}
                    </select>
                  </div>

                  {requestedDistance && (
                    <div className="bg-red-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-600 mb-1">차액</p>
                      <p className="font-medium text-gray-900">
                        {requestedEntryFee > registration.entry_fee
                          ? `+₩${(requestedEntryFee - registration.entry_fee).toLocaleString()} (추가 입금)`
                          : `-₩${(registration.entry_fee - requestedEntryFee).toLocaleString()} (환불 예정)`
                        }
                      </p>
                    </div>
                  )}

                  {requestedDistance && requestedEntryFee > registration.entry_fee && (
                    <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-700 font-medium mb-2">대회 입금 계좌</p>
                      <div className="space-y-1 text-gray-900">
                        <div className="flex justify-between">
                          <span className="text-gray-600">은행</span>
                          <span className="font-medium">{registration.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">계좌번호</span>
                          <span className="font-medium">{registration.bank_account}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">예금주</span>
                          <span className="font-medium">{registration.account_holder}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {requestedDistance && requestedEntryFee < registration.entry_fee && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          환불 은행 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        >
                          <option value="">은행을 선택해주세요</option>
                          {BANK_LIST.map((bank) => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          계좌번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="계좌번호를 입력하세요 (- 포함 가능)"
                          className="w-full px-3 py-2.5 border-2 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-semibold bg-yellow-50"
                        />
                        <p className="text-xs text-red-600 mt-2">
                          ⚠️ 계좌번호가 정확하지 않을 시 환불이 되지 않습니다. 다시 한번 확인해 주세요.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          예금주 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="예금주명"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 티셔츠 변경 */}
              {changeType === 'shirt_size' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      변경할 티셔츠 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setRequestedShirtSize(size)}
                          disabled={size === registration.shirt_size}
                          className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                            requestedShirtSize === size
                              ? 'bg-red-600 text-white'
                              : size === registration.shirt_size
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {requestedShirtSize && (
                    <div className="bg-red-50 rounded-lg p-3 text-sm">
                      <p className="text-gray-900 font-medium">
                        {registration.shirt_size} → {requestedShirtSize}로 변경됩니다
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {changeType === 'distance' ? '요청 중...' : '변경 중...'}
                    </>
                  ) : changeType === 'distance' ? (
                    '요청하기'
                  ) : (
                    '변경하기'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

export default function RegistrationChangeRequestPage() {
  return (
    <Suspense>
      <RegistrationChangeRequestPageContent />
    </Suspense>
  )
}
