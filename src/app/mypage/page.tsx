'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Calendar, Settings, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { formatKST } from '@/lib/dateUtils'

// 회원 정보 수정 스키마
const profileSchema = z.object({
  name: z.string().min(2, '성명은 최소 2자 이상이어야 합니다'),
  postal_code: z.string().min(5, '우편번호를 입력해주세요'),
  address1: z.string().min(1, '주소를 입력해주세요'),
  address2: z.string().min(1, '상세주소를 입력해주세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요'),
  phone_marketing_agree: z.boolean(),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  email_marketing_agree: z.boolean(),
  birth_date: z.string().regex(/^\d{6}$/, '생년월일은 6자리 숫자로 입력해주세요'),
  gender_digit: z.string().regex(/^[1-8]$/, '주민번호 뒷자리 첫 번째 숫자를 입력해주세요 (1-8)'),
  gender: z.enum(['male', 'female']),
  record_minutes: z.number().min(1, '최소 1분은 입력해주세요').max(200, '최대 200분까지 입력 가능합니다'),
  record_seconds: z.number().min(0, '초는 0~59 사이여야 합니다').max(59, '초는 0~59 사이여야 합니다'),
  etc: z.string().optional()
})

// 비밀번호 변경 스키마
const passwordSchema = z.object({
  current_password: z.string().min(1, '현재 비밀번호를 입력해주세요'),
  new_password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 포함해야 합니다'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirm_password']
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface Registration {
  id: string
  competition_id: string
  distance?: string
  payment_status: string
  created_at: string
  competitions: {
    title: string
    date: string
    location: string
  }
}

interface ReceiptRequest {
  id: string
  competition_id: string
  name: string
  phone: string
  amount: number
  distance: string
  status: string
  receipt_type: string
  business_number: string
  created_at: string
  competitions: {
    title: string
  }
}

interface RefundRequest {
  id: string
  competition_id: string
  name: string
  phone: string
  amount: number
  distance: string
  bank_name: string
  account_number: string
  account_holder: string
  status: string
  created_at: string
  competitions: {
    title: string
  }
}

export default function MyPage() {
  const { user, updateUser, getGradeInfo } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'registrations'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [receiptRequests, setReceiptRequests] = useState<ReceiptRequest[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // 회원 정보 수정 폼
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: user ? {
      name: user.name,
      postal_code: '',
      address1: '',
      address2: '',
      phone: user.phone,
      phone_marketing_agree: false,
      email: user.email,
      email_marketing_agree: false,
      birth_date: '',
      gender: 'male' as const,
      record_minutes: 60,
      record_seconds: 0,
      etc: ''
    } : undefined
  })

  // 비밀번호 변경 폼
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  // 로그인하지 않은 경우 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    // 사용자 상세 정보 로드
    loadUserDetails()
    loadRegistrations()
    loadReceiptRequests()
    loadRefundRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router])


  const loadUserDetails = async () => {
    if (!user) return

    try {
      setIsLoadingData(true)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        alert('사용자 정보를 불러올 수 없습니다.')
        return
      }

      if (data) {
        // DB에 저장된 gender_digit 사용, 없으면 성별에서 추출 (기존 데이터 호환성)
        let genderDigit = data.gender_digit || ''
        if (!genderDigit) {
          // gender_digit이 없는 경우에만 기본값 사용
          if (data.gender === 'male') {
            genderDigit = '1' // 기본값
          } else if (data.gender === 'female') {
            genderDigit = '2' // 기본값
          }
        }

        const formData = {
          name: data.name || '',
          postal_code: data.postal_code || '',
          address1: data.address1 || '',
          address2: data.address2 || '',
          phone: data.phone || '',
          phone_marketing_agree: data.phone_marketing_agree || false,
          email: data.email || '',
          email_marketing_agree: data.email_marketing_agree || false,
          birth_date: data.birth_date || '',
          gender_digit: genderDigit,
          gender: data.gender || 'male',
          record_minutes: Math.floor((data.record_time || 3600) / 60),
          record_seconds: (data.record_time || 3600) % 60,
          etc: data.etc || ''
        }
        profileForm.reset(formData)
      }
    } catch {
      alert('사용자 정보 로드 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadRegistrations = async () => {
    if (!user) {
      return
    }


    try {
      // Step 1: registrations 데이터 먼저 가져오기
      const { data: registrationData, error: registrationError } = await supabase
        .from('registrations')
        .select(`
          id,
          competition_id,
          distance,
          payment_status,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (registrationError) {
        console.error('신청 내역 조회 오류:', registrationError)
        throw new Error(`신청 내역 조회 실패: ${registrationError.message}`)
      }


      if (!registrationData || registrationData.length === 0) {
        setRegistrations([])
        return
      }

      // Step 2: 각 신청의 대회 정보 가져오기
      const competitionIds = [...new Set(registrationData.map(r => r.competition_id))]

      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .select('id, title, date, location')
        .in('id', competitionIds)

      if (competitionError) {
        console.error('대회 정보 조회 오류:', competitionError)
        throw new Error(`대회 정보 조회 실패: ${competitionError.message}`)
      }


      // Step 3: 데이터 결합
      const registrationsWithCompetitions = registrationData.map(registration => {
        const competition = competitionData?.find(c => c.id === registration.competition_id)
        return {
          ...registration,
          competitions: competition || {
            title: '알 수 없는 대회',
            date: '',
            location: ''
          }
        }
      })

      setRegistrations(registrationsWithCompetitions as unknown as Registration[])

    } catch (error) {
      console.error('신청 내역 로드 오류:', error)
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message)
      }
      // 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setRegistrations([])
    }
  }


  const loadReceiptRequests = async () => {
    if (!user) return

    try {
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipt_requests')
        .select('id, competition_id, name, phone, amount, distance, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (receiptError) {
        console.error('현금영수증 내역 조회 오류:', receiptError)
        return
      }

      if (!receiptData || receiptData.length === 0) {
        setReceiptRequests([])
        return
      }

      const competitionIds = [...new Set(receiptData.map(r => r.competition_id))]

      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .select('id, title')
        .in('id', competitionIds)

      if (competitionError) {
        console.error('대회 정보 조회 오류:', competitionError)
        return
      }

      const receiptsWithCompetitions = receiptData.map(receipt => {
        const competition = competitionData?.find(c => c.id === receipt.competition_id)
        return {
          ...receipt,
          competitions: competition || { title: '알 수 없는 대회' }
        }
      })

      setReceiptRequests(receiptsWithCompetitions as unknown as ReceiptRequest[])
    } catch (error) {
      console.error('현금영수증 내역 로드 오류:', error)
      setReceiptRequests([])
    }
  }

  // 현금영수증 신청 취소
  const cancelReceiptRequest = async (receiptId: string) => {
    if (!confirm('현금영수증 신청을 취소하시겠습니까?')) return
    try {
      const { error } = await supabase
        .from('receipt_requests')
        .delete()
        .eq('id', receiptId)
        .eq('status', 'pending')

      if (error) throw error
      alert('신청이 취소되었습니다.')
      loadReceiptRequests()
    } catch (error) {
      console.error('현금영수증 신청 취소 오류:', error)
      alert('신청 취소에 실패했습니다.')
    }
  }

  // 현금영수증 상태 표시
  const getReceiptStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: '발급완료', color: 'text-green-600 bg-green-100' }
      case 'pending':
        return { text: '신청완료', color: 'text-yellow-600 bg-yellow-100' }
      case 'rejected':
        return { text: '신청완료', color: 'text-yellow-600 bg-yellow-100' }
      default:
        return { text: status, color: 'text-gray-600 bg-gray-100' }
    }
  }

  // 환불 요청 내역 로드
  const loadRefundRequests = async () => {
    if (!user) return
    try {
      const { data: refundData, error: refundError } = await supabase
        .from('refund_requests')
        .select('id, competition_id, name, phone, amount, distance, bank_name, account_number, account_holder, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (refundError) {
        console.error('환불 내역 조회 오류:', refundError)
        return
      }

      if (!refundData || refundData.length === 0) {
        setRefundRequests([])
        return
      }

      const competitionIds = [...new Set(refundData.map(r => r.competition_id))]
      const { data: competitionData } = await supabase
        .from('competitions')
        .select('id, title')
        .in('id', competitionIds)

      const refundsWithCompetitions = refundData.map(refund => {
        const competition = competitionData?.find(c => c.id === refund.competition_id)
        return {
          ...refund,
          competitions: competition || { title: '알 수 없는 대회' }
        }
      })

      setRefundRequests(refundsWithCompetitions as unknown as RefundRequest[])
    } catch (error) {
      console.error('환불 내역 로드 오류:', error)
      setRefundRequests([])
    }
  }

  // 환불 요청 취소
  const cancelRefundRequest = async (refundId: string) => {
    if (!confirm('환불 요청을 취소하시겠습니까?')) return
    try {
      const { error } = await supabase
        .from('refund_requests')
        .delete()
        .eq('id', refundId)
        .eq('status', 'pending')

      if (error) throw error
      alert('요청이 취소되었습니다.')
      loadRefundRequests()
    } catch (error) {
      console.error('환불 요청 취소 오류:', error)
      alert('요청 취소에 실패했습니다.')
    }
  }

  // 환불 상태 표시
  const getRefundStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: '환불완료', color: 'text-green-600 bg-green-100' }
      case 'pending':
        return { text: '환불대기', color: 'text-yellow-600 bg-yellow-100' }
      default:
        return { text: status, color: 'text-gray-600 bg-gray-100' }
    }
  }

  // 전화번호 자동 하이픈 추가
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }

  // 기록에 따른 등급 표시 (성별별 다른 기준 적용)
  const getGradeDisplayLocal = (minutes: number, seconds: number = 0, gender?: string) => {
    const totalMinutes = minutes + (seconds / 60)

    // 범위 벗어남 처리 (성별 무관)
    if (totalMinutes < 30) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
    if (totalMinutes >= 70) return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }

    if (gender === 'male') {
      // 남성 기준 (30분~69분)
      if (totalMinutes < 40) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      if (totalMinutes < 50) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      if (totalMinutes < 60) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    } else if (gender === 'female') {
      // 여성 기준 (30분~69분)
      if (totalMinutes < 50) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      if (totalMinutes < 60) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      if (totalMinutes < 70) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    } else {
      // 성별 정보가 없을 때는 기본 터틀족
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    }
  }

  // 회원 정보 수정
  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return

    setIsLoading(true)

    try {
      // 1. 배송 상태 체크 - 참가신청한 대회 조회
      const { data: registrationsData, error: regError } = await supabase
        .from('registrations')
        .select('competition_id')
        .eq('user_id', user.id)

      if (regError) {
        console.error('참가신청 조회 오류:', regError)
      }

      // 참가신청이 있는 경우에만 대회 정보 확인
      if (registrationsData && registrationsData.length > 0) {
        const competitionIds = [...new Set(registrationsData.map(r => r.competition_id))]

        // 2. 대회 정보 조회 (배송 상태, 마감일, 대회일)
        const { data: competitionsData, error: compError } = await supabase
          .from('competitions')
          .select('id, title, registration_end, date, shipping_status')
          .in('id', competitionIds)

        if (compError) {
          console.error('대회 정보 조회 오류:', compError)
        }

        if (competitionsData) {
          const today = new Date()

          // 3. 각 대회별로 배송 상태 확인
          for (const competition of competitionsData) {
            const competitionDate = new Date(competition.date)

            // 배송완료 & 대회일 전 → 수정 불가
            if (competition.shipping_status === 'completed' && today < competitionDate) {
              alert(
                `[${competition.title}] 대회 사전물품 발송 업무 진행 중으로 인하여\n` +
                `대회일(${competitionDate.toLocaleDateString('ko-KR')})까지 회원정보 수정이 불가합니다.\n\n` +
                `긴급한 경우 관리자(게시판)에게 문의해주세요.`
              )
              return
            }

            // 그 외 모든 경우 → 수정 가능
            // - 마감일 전
            // - 마감일 후 + 배송대기(pending)
            // - 대회일 이후
          }
        }
      }

      // 4. 배송 상태 체크 통과 → 회원정보 수정 진행

      // 기록에 따른 등급 계산 (성별에 따라 다른 기준 적용)
      const recordTime = (data.record_minutes * 60) + data.record_seconds
      const totalMinutes = recordTime / 60

      let grade = 'turtle'

      // 범위 벗어남 처리 (성별 무관)
      if (totalMinutes < 30) {
        grade = 'cheetah'  // 30분 미만 = 치타
      } else if (totalMinutes >= 70) {
        grade = 'turtle'   // 70분 이상 = 터틀
      } else if (data.gender === 'male') {
        // 남성 기준 (30분~69분)
        if (totalMinutes < 40) grade = 'cheetah'          // 30:00~39:59
        else if (totalMinutes < 50) grade = 'horse'       // 40:00~49:59
        else if (totalMinutes < 60) grade = 'wolf'        // 50:00~59:59
        else grade = 'turtle'                             // 60:00~69:59
      } else {
        // 여성 기준 (30분~69분)
        if (totalMinutes < 50) grade = 'cheetah'          // 30:00~49:59
        else if (totalMinutes < 60) grade = 'horse'       // 50:00~59:59
        else grade = 'wolf'                               // 60:00~69:59
      }

      // 분과 초를 초 단위로 변환하고 등급 포함
      const updateData = {
        ...data,
        record_time: recordTime,
        grade: grade
      }

      // record_minutes, record_seconds 제거 (DB에 없는 필드)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { record_minutes, record_seconds, ...dbData } = updateData

      await updateUser(dbData)
      alert('회원 정보가 수정되었습니다.')

      // 데이터 다시 로드
      await loadUserDetails()
    } catch (error) {
      console.error('회원정보 수정 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      alert(`회원 정보 수정 중 오류가 발생했습니다.\n${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 변경
  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user) return

    setIsLoading(true)

    try {
      // 현재 비밀번호 확인 (평문으로 비교)
      const { data: userData, error: checkError } = await supabase
        .from('users')
        .select('password')
        .eq('id', user.id)
        .eq('password', data.current_password)
        .single()

      if (checkError || !userData) {
        alert('현재 비밀번호가 올바르지 않습니다.')
        return
      }

      // 새 비밀번호로 업데이트 (평문으로 저장)
      const { error } = await supabase
        .from('users')
        .update({ password: data.new_password })
        .eq('id', user.id)

      if (error) throw error

      alert('비밀번호가 변경되었습니다.')
      passwordForm.reset()
    } catch (error) {
      alert('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 회원 탈퇴
  const handleWithdraw = async () => {
    if (!user) return

    const isConfirmed = confirm(
      '정말로 탈퇴하시겠습니까?\n\n탈퇴 시 모든 회원 정보와 대회 신청 내역이 삭제되며,\n이 작업은 되돌릴 수 없습니다.'
    )

    if (!isConfirmed) return

    const secondConfirm = confirm(
      '마지막 확인입니다.\n\n탈퇴를 진행하시겠습니까?'
    )

    if (!secondConfirm) return

    setIsLoading(true)

    try {
      // 회원 데이터 삭제 (cascade로 연관 데이터도 함께 삭제됨)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      alert('회원 탈퇴가 완료되었습니다.')

      // 로그아웃 처리 (AuthContext에서 세션 클리어)
      sessionStorage.removeItem('user')
      router.push('/')

    } catch (error) {
      console.error('탈퇴 처리 오류:', error)
      alert('탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 결제 상태 표시
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { text: '입금확인', color: 'text-green-600 bg-green-100' }
      case 'pending':
        return { text: '입금대기', color: 'text-yellow-600 bg-yellow-100' }
      case 'cancelled':
        return { text: '취소', color: 'text-red-600 bg-red-100' }
      default:
        return { text: status, color: 'text-gray-600 bg-gray-100' }
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pt-14 md:pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-10 md:py-16 overflow-hidden">
        {/* 배경 이미지 공간 */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/mypage-hero-bg.jpg"
            alt="마이페이지 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">마이페이지</h1>
          <p className="text-sm md:text-lg text-red-100 max-w-3xl mx-auto">
            회원정보 수정 및 대회 신청 내역을 관리하세요
          </p>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 탭 네비게이션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`p-3 md:p-6 rounded-lg shadow-md transition-colors ${
                activeTab === 'profile'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="w-5 md:w-6 h-5 md:h-6" />
                <span className="font-medium text-sm md:text-base">회원정보 수정</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`p-3 md:p-6 rounded-lg shadow-md transition-colors ${
                activeTab === 'password'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-5 md:w-6 h-5 md:h-6" />
                <span className="font-medium text-sm md:text-base">비밀번호 변경</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`p-3 md:p-6 rounded-lg shadow-md transition-colors ${
                activeTab === 'registrations'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-5 md:w-6 h-5 md:h-6" />
                <span className="font-medium text-sm md:text-base">신청 내역</span>
              </div>
            </button>
          </div>


      {/* 회원정보 수정 */}
      {activeTab === 'profile' && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4 md:mb-6">회원정보 수정</h2>
          
          {isLoadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">회원 정보를 불러오는 중...</p>
            </div>
          ) : (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            {/* 성명 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">성명</label>
              <input
                {...profileForm.register('name')}
                type="text"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="성명을 입력하세요"
              />
              {profileForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">주소</label>
              <div className="space-y-2">
                <input
                  {...profileForm.register('postal_code')}
                  type="text"
                  className="w-28 md:w-32 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="우편번호"
                />
                <input
                  {...profileForm.register('address1')}
                  type="text"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="기본주소"
                />
                <input
                  {...profileForm.register('address2')}
                  type="text"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="상세주소"
                />
              </div>
              {profileForm.formState.errors.postal_code && (
                <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.postal_code.message}</p>
              )}
              {profileForm.formState.errors.address1 && (
                <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.address1.message}</p>
              )}
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">연락처</label>
              <input
                {...profileForm.register('phone')}
                type="text"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                placeholder="010-0000-0000"
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  profileForm.setValue('phone', formatted)
                }}
              />
              <div className="mt-2">
                <label className="flex items-center">
                  <input
                    {...profileForm.register('phone_marketing_agree')}
                    type="checkbox"
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-xs md:text-sm text-gray-600">연락처로 마케팅 정보 수신에 동의합니다</span>
                </label>
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                {...profileForm.register('email')}
                type="email"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
              />
              <div className="mt-2">
                <label className="flex items-center">
                  <input
                    {...profileForm.register('email_marketing_agree')}
                    type="checkbox"
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-xs md:text-sm text-gray-600">이메일로 마케팅 정보 수신에 동의합니다</span>
                </label>
              </div>
            </div>

            {/* 주민번호 앞자리 (생년월일 + 성별) */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">주민번호 앞 7자리</label>
              <div className="flex items-center gap-1 md:gap-2">
                <input
                  {...profileForm.register('birth_date')}
                  type="text"
                  className="flex-1 px-2 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-sm"
                  placeholder="000000"
                  maxLength={6}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
                    profileForm.setValue('birth_date', cleaned)
                  }}
                />
                <span className="text-lg md:text-2xl font-bold text-gray-400">-</span>
                <input
                  {...profileForm.register('gender_digit')}
                  type="text"
                  className="w-10 md:w-14 px-2 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-medium text-sm"
                  placeholder="0"
                  maxLength={1}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '').slice(0, 1)
                    profileForm.setValue('gender_digit', digit)

                    if (digit === '1' || digit === '3' || digit === '5' || digit === '7') {
                      profileForm.setValue('gender', 'male')
                      profileForm.trigger('gender')
                    } else if (digit === '2' || digit === '4' || digit === '6' || digit === '8') {
                      profileForm.setValue('gender', 'female')
                      profileForm.trigger('gender')
                    }
                  }}
                />
                <div className="flex-1 flex items-center gap-0.5 md:gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-2 md:w-3 h-2 md:h-3 bg-gray-300 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* 성별 (자동 선택되지만 수정 가능) */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                성별 {profileForm.watch('gender_digit') && '(자동 선택됨, 수정 가능)'}
              </label>
              <div className="flex gap-2 md:gap-4">
                <label className={`flex-1 flex items-center justify-center px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all cursor-pointer border-2 text-sm ${
                  profileForm.watch('gender') === 'male' ? 'bg-blue-100 border-blue-500 font-semibold' : 'bg-white border-gray-300 hover:border-blue-300'
                }`}>
                  <input
                    {...profileForm.register('gender')}
                    type="radio"
                    value="male"
                    className="mr-1 md:mr-2"
                  />
                  <span>남성</span>
                </label>
                <label className={`flex-1 flex items-center justify-center px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all cursor-pointer border-2 text-sm ${
                  profileForm.watch('gender') === 'female' ? 'bg-pink-100 border-pink-500 font-semibold' : 'bg-white border-gray-300 hover:border-pink-300'
                }`}>
                  <input
                    {...profileForm.register('gender')}
                    type="radio"
                    value="female"
                    className="mr-1 md:mr-2"
                  />
                  <span>여성</span>
                </label>
              </div>
            </div>

            {/* 기록 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">10K 기록</label>
              <div className="flex gap-1 md:gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    {...profileForm.register('record_minutes', { valueAsNumber: true })}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                    placeholder="분"
                    min="1"
                    max="200"
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-500">분</span>
                <div className="flex-1">
                  <input
                    type="number"
                    {...profileForm.register('record_seconds', { valueAsNumber: true })}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                    placeholder="초"
                    min="0"
                    max="59"
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-500">초</span>
              </div>
              {profileForm.watch('record_minutes') && (
                <div className={`flex items-center gap-2 text-sm mt-2 ${getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0, profileForm.watch('gender')).color}`}>
                  <img
                    src={getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0, profileForm.watch('gender')).icon}
                    alt={getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0, profileForm.watch('gender')).display}
                    className="w-5 h-5"
                  />
                  → {getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0, profileForm.watch('gender')).display}
                </div>
              )}
            </div>

            {/* 기타 - 숨김 처리 */}
            {/*
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기타</label>
              <textarea
                {...profileForm.register('etc')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="추가 정보가 있다면 입력하세요"
              />
            </div>
            */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 md:py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium"
            >
              {isLoading ? '수정 중...' : '회원정보 수정'}
            </button>
          </form>
          )}

          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
            <div className="bg-red-50 p-3 md:p-4 rounded-lg">
              <h3 className="text-xs md:text-sm font-medium text-red-800 mb-2">회원 탈퇴</h3>
              <p className="text-xs md:text-sm text-red-600 mb-3 md:mb-4">
                탈퇴 시 모든 회원 정보와 대회 신청 내역이 삭제되며, 복구할 수 없습니다.
              </p>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isLoading}
                className="flex items-center px-3 md:px-4 py-2 md:py-2.5 bg-red-600 text-white text-xs md:text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
                {isLoading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 */}
      {activeTab === 'password' && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-base md:text-lg font-medium text-gray-900 mb-4 md:mb-6">비밀번호 변경</h2>
          
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 md:space-y-6">
            {/* 현재 비밀번호 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
              <div className="relative">
                <input
                  {...passwordForm.register('current_password')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="현재 비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 md:w-5 h-4 md:h-5" /> : <Eye className="w-4 md:w-5 h-4 md:h-5" />}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.current_password.message}</p>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
              <div className="relative">
                <input
                  {...passwordForm.register('new_password')}
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="영문, 숫자 포함 8자 이상"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 md:w-5 h-4 md:h-5" /> : <Eye className="w-4 md:w-5 h-4 md:h-5" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
              <div className="relative">
                <input
                  {...passwordForm.register('confirm_password')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 md:w-5 h-4 md:h-5" /> : <Eye className="w-4 md:w-5 h-4 md:h-5" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 md:py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      )}

      {/* 신청 내역 */}
      {activeTab === 'registrations' && (
        <>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 border-l-4 border-l-blue-500">
            <h2 className="text-base md:text-lg font-medium text-gray-900">대회 신청 내역</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">참가 신청한 대회 목록입니다.</p>
          </div>
          
          {registrations.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-gray-500">
              <Calendar className="w-10 md:w-12 h-10 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" />
              <p className="text-sm md:text-base">참가 신청한 대회가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {registrations.map((registration) => {
                const status = getPaymentStatusDisplay(registration.payment_status)
                return (
                  <div
                    key={registration.id}
                    className="group p-4 md:p-6 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => router.push(`/competitions/${registration.competition_id}?tab=lookup`)}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                          {registration.competitions.title}
                        </h3>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs md:text-sm text-gray-500">
                          <span className="flex items-center">📅 {formatKST(registration.competitions.date, 'yyyy.MM.dd')}</span>
                          <span className="flex items-center">📍 {registration.competitions.location}</span>
                          {registration.distance && <span className="flex items-center">🏃 {registration.distance}</span>}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          신청일: {formatKST(registration.created_at, 'yyyy.MM.dd')}
                        </div>
                        <div className="mt-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          👆 클릭하여 상세 신청 내역 보기
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center md:items-end gap-2 md:gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                        <div className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors hidden md:block">
                          상세 보기 →
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 입금완료된 대회가 있을 때만 현금영수증/환불 요청 내역 표시 */}
        {registrations.some(r => r.payment_status === 'confirmed') && (<>
        {/* 현금영수증 신청 내역 */}
        <div className="bg-white rounded-lg shadow mt-5 md:mt-6 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 border-l-4 border-l-emerald-500">
            <h2 className="text-base md:text-lg font-medium text-gray-900">현금영수증 신청 내역</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">현금영수증 발급 신청 내역입니다.</p>
          </div>

          {receiptRequests.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-gray-500">
              <p className="text-sm md:text-base">현금영수증 신청 내역이 없습니다.</p>
              <button
                onClick={() => router.push('/request/receipt')}
                className="mt-3 md:mt-4 px-4 py-2 bg-red-600 text-white text-xs md:text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                현금영수증 신청하기
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {receiptRequests.map((receipt) => {
                  const receiptStatus = getReceiptStatusDisplay(receipt.status)
                  return (
                    <div key={receipt.id} className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">
                            {receipt.competitions.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              receipt.receipt_type === 'business' ? 'text-blue-700 bg-blue-100' : 'text-gray-600 bg-gray-100'
                            }`}>
                              {receipt.receipt_type === 'business' ? '사업자' : '개인'}
                            </span>
                            <span className="flex items-center">🏃 {receipt.distance}</span>
                            <span className="flex items-center">💰 {receipt.amount.toLocaleString()}원</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            신청일: {formatKST(receipt.created_at, 'yyyy.MM.dd')}
                          </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${receiptStatus.color}`}>
                            {receiptStatus.text}
                          </span>
                          {receipt.status === 'pending' && (
                            <button
                              onClick={() => cancelReceiptRequest(receipt.id)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              신청 취소
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3 md:p-4 border-t border-gray-200 text-center">
                <button
                  onClick={() => router.push('/request/receipt')}
                  className="px-4 py-2 bg-red-600 text-white text-xs md:text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  추가 신청하기
                </button>
              </div>
            </>
          )}
        </div>

        {/* 환불 요청 내역 */}
        <div className="bg-white rounded-lg shadow mt-5 md:mt-6 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 border-l-4 border-l-orange-500">
            <h2 className="text-base md:text-lg font-medium text-gray-900">환불 요청 내역</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">참가비 환불 요청 내역입니다.</p>
          </div>

          {refundRequests.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-gray-500">
              <p className="text-sm md:text-base">환불 요청 내역이 없습니다.</p>
              <button
                onClick={() => router.push('/request/refund')}
                className="mt-3 md:mt-4 px-4 py-2 bg-red-600 text-white text-xs md:text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                환불 요청하기
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {refundRequests.filter(r => r.status === 'pending').map((refund) => {
                  const refundStatus = getRefundStatusDisplay(refund.status)
                  return (
                    <div key={refund.id} className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">
                            {refund.competitions.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500">
                            <span className="flex items-center">🏃 {refund.distance}</span>
                            <span className="flex items-center">💰 {refund.amount.toLocaleString()}원</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400 break-all">
                            {refund.bank_name} {refund.account_number} ({refund.account_holder})
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            요청일: {formatKST(refund.created_at, 'yyyy.MM.dd')}
                          </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${refundStatus.color}`}>
                            {refundStatus.text}
                          </span>
                          {refund.status === 'pending' && (
                            <button
                              onClick={() => cancelRefundRequest(refund.id)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              요청 취소
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3 md:p-4 border-t border-gray-200 text-center">
                <button
                  onClick={() => router.push('/request/refund')}
                  className="px-4 py-2 bg-red-600 text-white text-xs md:text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  환불 요청하기
                </button>
              </div>
            </>
          )}
        </div>
        </>)}
        </>
      )}
        </div>
      </section>
    </div>
  )
}