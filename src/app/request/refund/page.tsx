'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Undo2, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import AuthModal from '@/components/AuthModal'

interface Registration {
  id: string
  competition_id: string
  distance: string
  entry_fee: number
  payment_status: string
  competition_title: string
  already_requested: boolean
}

const BANK_LIST = [
  '카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '케이뱅크',
  'NH농협은행', 'IBK기업은행', 'SC제일은행', '씨티은행',
  '경남은행', '광주은행', '대구은행', '부산은행', '전북은행', '제주은행',
  '새마을금고', '신협', '우체국', '수협은행', 'KDB산업은행'
]

export default function RefundRequestPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedRegId, setSelectedRegId] = useState('')
  const [bankName, setBankName] = useState('')
  const [customBankName, setCustomBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<{ competition: string; distance: string; amount: string; bankName: string; accountNumber: string; accountHolder: string } | null>(null)
  const [error, setError] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
      setAccountHolder(user.name || '')
      loadRegistrations()
    } else {
      setIsDataLoading(false)
    }
  }, [user])

  const loadRegistrations = async () => {
    if (!user) return
    setIsDataLoading(true)

    try {
      const { data: regData } = await supabase
        .from('registrations')
        .select('id, competition_id, distance, entry_fee, payment_status')
        .eq('user_id', user.id)
        .neq('payment_status', 'cancelled')
        .order('created_at', { ascending: false })

      if (!regData || regData.length === 0) {
        setRegistrations([])
        setIsDataLoading(false)
        return
      }

      const competitionIds = [...new Set(regData.map(r => r.competition_id))]
      const { data: compData } = await supabase
        .from('competitions')
        .select('id, title')
        .in('id', competitionIds)

      const compMap = new Map(compData?.map(c => [c.id, c.title]) || [])

      const { data: refundData } = await supabase
        .from('refund_requests')
        .select('registration_id')
        .eq('user_id', user.id)

      const requestedRegIds = new Set(refundData?.map(r => r.registration_id) || [])

      setRegistrations(
        regData.map(r => ({
          ...r,
          competition_title: compMap.get(r.competition_id) || '알 수 없는 대회',
          already_requested: requestedRegIds.has(r.id)
        }))
      )
    } catch (err) {
      console.error('참가 내역 조회 오류:', err)
    } finally {
      setIsDataLoading(false)
    }
  }

  const selectedReg = registrations.find(r => r.id === selectedRegId)
  const availableRegistrations = registrations.filter(r => !r.already_requested)

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (!selectedRegId) {
      setError('환불을 요청할 대회를 선택해주세요')
      return
    }

    if (!name || !phone || !amount || !bankName || !accountNumber || !accountHolder) {
      setError('모든 항목을 입력해주세요')
      return
    }

    if (bankName === '기타' && !customBankName) {
      setError('은행명을 입력해주세요')
      return
    }

    if (!selectedReg) return

    // 확인 모달 표시
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    if (!user || !selectedReg) return

    setIsLoading(true)
    setShowConfirmModal(false)

    try {
      const finalBankName = bankName === '기타' ? customBankName : bankName

      const response = await fetch('/api/request/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          registration_id: selectedRegId,
          competition_id: selectedReg.competition_id,
          name,
          phone: phone.replace(/-/g, ''),
          amount: amount.replace(/,/g, ''),
          distance: selectedReg.distance,
          bank_name: finalBankName,
          account_number: accountNumber,
          account_holder: accountHolder
        })
      })

      const result = await response.json()

      if (result.success) {
        setSubmittedData({
          competition: selectedReg.competition_title,
          distance: selectedReg.distance,
          amount,
          bankName,
          accountNumber,
          accountHolder
        })
        setIsSubmitted(true)
      } else {
        setError(result.error || '요청 처리 중 오류가 발생했습니다')
      }
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted && submittedData) {
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
                환불 요청이 완료되었습니다
              </h2>
              <p className="text-gray-600 mb-6">
                요청하신 내용이 정상적으로 접수되었습니다.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">이름</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">연락처</span>
                    <span className="font-medium">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">참가대회</span>
                    <span className="font-medium">{submittedData.competition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">거리</span>
                    <span className="font-medium">{submittedData.distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">환불금액</span>
                    <span className="font-medium">{submittedData.amount}원</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">환불은행</span>
                    <span className="font-medium">{submittedData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">계좌번호</span>
                    <span className="font-medium">{submittedData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">예금주</span>
                    <span className="font-medium">{submittedData.accountHolder}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/mypage')}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  마이페이지에서 확인하기
                </button>
                <button
                  onClick={() => {
                    setIsSubmitted(false)
                    setSelectedRegId('')
                    setAmount('')
                    setBankName('')
                    setAccountNumber('')
                    setAccountHolder(user?.name || '')
                    setSubmittedData(null)
                    loadRegistrations()
                  }}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  추가 요청하기
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
              <h1 className="text-4xl md:text-6xl font-bold mb-4">환불 요청</h1>
              <p className="text-lg md:text-xl text-red-100">
                대회 참가비 환불을 요청합니다
              </p>
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
          {!user && !isDataLoading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Undo2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
              <p className="text-gray-600 mb-6">환불 요청은 로그인 후 이용 가능합니다.</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                로그인하기
              </button>
            </div>
          )}

          {isDataLoading && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          )}

          {user && !isDataLoading && registrations.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Undo2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">신청한 대회가 없습니다</h2>
              <p className="text-gray-600 mb-6">대회에 참가 신청 후 환불을 요청할 수 있습니다.</p>
              <button
                onClick={() => router.push('/competitions')}
                className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                대회 둘러보기
              </button>
            </div>
          )}

          {user && !isDataLoading && registrations.length > 0 && availableRegistrations.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">모든 대회의 환불 요청이 완료되었습니다</h2>
              <p className="text-gray-600 mb-6">신청한 모든 대회에 대해 환불 요청을 완료하셨습니다.</p>
              <button
                onClick={() => router.push('/mypage')}
                className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                마이페이지에서 확인하기
              </button>
            </div>
          )}

          {user && !isDataLoading && availableRegistrations.length > 0 && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Undo2 className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-gray-900">환불 요청 정보 입력</h2>
              </div>

              {/* 대회 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대회 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRegId}
                  onChange={(e) => {
                    setSelectedRegId(e.target.value)
                    const reg = availableRegistrations.find(r => r.id === e.target.value)
                    if (reg) {
                      setAmount(reg.entry_fee.toLocaleString())
                    } else {
                      setAmount('')
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  required
                >
                  <option value="">환불을 요청할 대회를 선택하세요</option>
                  {availableRegistrations.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.competition_title} - {reg.distance}
                    </option>
                  ))}
                </select>
                {registrations.some(r => r.already_requested) && (
                  <p className="text-xs text-gray-400 mt-1">
                    이미 요청한 대회는 목록에서 제외됩니다
                  </p>
                )}
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              {/* 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  placeholder="010-0000-0000"
                  required
                />
              </div>

              {/* 선택된 대회 정보 표시 */}
              {selectedReg && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">대회명</span>
                    <span className="font-medium">{selectedReg.competition_title}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">거리</span>
                    <span className="font-medium">{selectedReg.distance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">환불금액</span>
                    <span className="font-medium text-red-600">{selectedReg.entry_fee.toLocaleString()}원</span>
                  </div>
                </div>
              )}

              {/* 환불 계좌 정보 */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">환불 계좌 정보</h3>

                {/* 은행 선택 */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value)
                      if (e.target.value !== '기타') {
                        setCustomBankName('')
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    required
                  >
                    <option value="">은행을 선택하세요</option>
                    {BANK_LIST.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                    <option value="기타">기타 (직접 입력)</option>
                  </select>
                </div>

                {/* 기타 은행 직접 입력 */}
                {bankName === '기타' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      은행명 입력 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      placeholder="은행명을 입력하세요 (예: 외환은행)"
                      required
                    />
                  </div>
                )}

                {/* 계좌번호 */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="계좌번호를 입력하세요 (- 포함 가능)"
                    required
                  />
                </div>

                {/* 예금주 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예금주 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="예금주를 입력하세요"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    요청 중...
                  </>
                ) : (
                  '환불 요청하기'
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          defaultTab="login"
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* 환불 요청 확인 모달 */}
      {showConfirmModal && selectedReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            {/* 모달 헤더 */}
            <div className="border-b p-4">
              <h2 className="text-lg font-bold text-gray-900">환불 요청 확인</h2>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">입력하신 정보를 확인해주세요.</p>

              {/* 정보 목록 */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">대회:</span>
                  <span className="font-medium text-gray-900">{selectedReg.competition_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">거리:</span>
                  <span className="font-medium text-gray-900">{selectedReg.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이름:</span>
                  <span className="font-medium text-gray-900">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">연락처:</span>
                  <span className="font-medium text-gray-900">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">환불 금액:</span>
                  <span className="font-medium text-gray-900">{amount}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">은행:</span>
                  <span className="font-medium text-gray-900">{bankName === '기타' ? customBankName : bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">계좌번호:</span>
                  <span className="font-medium text-gray-900">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예금주:</span>
                  <span className="font-medium text-gray-900">{accountHolder}</span>
                </div>
              </div>

              <p className="text-gray-700 font-medium">최종 신청하시겠습니까?</p>
            </div>

            {/* 모달 푸터 - 버튼 */}
            <div className="border-t p-4 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                아니요
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isLoading ? '처리 중...' : '예'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
