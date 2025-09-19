'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Calendar, Settings, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

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
  birth_date: z.string().regex(/^\d{6}$/, '생년월일은 YYMMDD 형식으로 입력해주세요'),
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
  category?: string
  payment_status: string
  created_at: string
  competitions: {
    title: string
    date: string
    location: string
  }
}

export default function MyPage() {
  const { user, updateUser, getGradeInfo } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'registrations'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])
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
        console.log('DB에서 받은 데이터:', data)
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
          gender: data.gender || 'male',
          record_minutes: Math.floor((data.record_time || 3600) / 60),
          record_seconds: (data.record_time || 3600) % 60,
          etc: data.etc || ''
        }
        console.log('폼에 설정할 데이터:', formData)
        profileForm.reset(formData)
      }
    } catch (error) {
      alert('사용자 정보 로드 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadRegistrations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          competition_id,
          category,
          payment_status,
          created_at,
          competitions!inner (
            title,
            date,
            location
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRegistrations((data || []) as unknown as Registration[])
    } catch (error) {
      console.error('신청 내역 로드 오류:', error)
    }
  }


  // 전화번호 자동 하이픈 추가
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }

  // 기록에 따른 등급 표시 (범위 기반으로 수정)
  const getGradeDisplayLocal = (minutes: number, seconds: number = 0) => {
    const totalMinutes = minutes + (seconds / 60)
    if (totalMinutes >= 30 && totalMinutes < 40) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
    if (totalMinutes >= 40 && totalMinutes < 50) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
    if (totalMinutes >= 50 && totalMinutes < 60) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
    return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
  }

  // 회원 정보 수정
  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)

    try {
      console.log('폼에서 받은 데이터:', data)

      // 분과 초를 초 단위로 변환
      const updateData = {
        ...data,
        record_time: (data.record_minutes * 60) + data.record_seconds
      }

      // record_minutes, record_seconds 제거 (DB에 없는 필드)
      const { record_minutes, record_seconds, ...dbData } = updateData

      console.log('DB에 저장할 데이터:', dbData)

      await updateUser(dbData)
      alert('회원 정보가 수정되었습니다.')

      // 데이터 다시 로드
      await loadUserDetails()
    } catch (error) {
      console.error('수정 오류:', error)
      alert('회원 정보 수정 중 오류가 발생했습니다.')
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

  const gradeInfo = getGradeInfo(user.grade)

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20 overflow-hidden">
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">마이페이지</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            회원정보 수정 및 대회 신청 내역을 관리하세요
          </p>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 탭 네비게이션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`p-6 rounded-lg shadow-md transition-colors ${
                activeTab === 'profile'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="w-6 h-6" />
                <span className="font-medium">회원정보 수정</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`p-6 rounded-lg shadow-md transition-colors ${
                activeTab === 'password'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-6 h-6" />
                <span className="font-medium">비밀번호 변경</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`p-6 rounded-lg shadow-md transition-colors ${
                activeTab === 'registrations'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-6 h-6" />
                <span className="font-medium">신청 내역</span>
              </div>
            </button>
          </div>


      {/* 회원정보 수정 */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-6">회원정보 수정</h2>
          
          {isLoadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">회원 정보를 불러오는 중...</p>
            </div>
          ) : (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            {/* 성명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">성명</label>
              <input
                {...profileForm.register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {profileForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
              <div className="space-y-2">
                <input
                  {...profileForm.register('postal_code')}
                  type="text"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="우편번호"
                />
                <input
                  {...profileForm.register('address1')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="기본주소"
                />
                <input
                  {...profileForm.register('address2')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
              <input
                {...profileForm.register('phone')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">연락처로 마케팅 정보 수신에 동의합니다</span>
                </label>
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                {...profileForm.register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="mt-2">
                <label className="flex items-center">
                  <input
                    {...profileForm.register('email_marketing_agree')}
                    type="checkbox"
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">이메일로 마케팅 정보 수신에 동의합니다</span>
                </label>
              </div>
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
              <input
                {...profileForm.register('birth_date')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="YYMMDD (예: 901225)"
                maxLength={6}
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    {...profileForm.register('gender')}
                    type="radio"
                    value="male"
                    className="mr-2"
                  />
                  <span>남성</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...profileForm.register('gender')}
                    type="radio"
                    value="female"
                    className="mr-2"
                  />
                  <span>여성</span>
                </label>
              </div>
            </div>

            {/* 기록 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">10K 기록</label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    {...profileForm.register('record_minutes', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="분"
                    min="1"
                    max="200"
                  />
                </div>
                <span className="text-gray-500">분</span>
                <div className="flex-1">
                  <input
                    type="number"
                    {...profileForm.register('record_seconds', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="초"
                    min="0"
                    max="59"
                  />
                </div>
                <span className="text-gray-500">초</span>
              </div>
              {profileForm.watch('record_minutes') && (
                <div className={`flex items-center gap-2 text-sm mt-2 ${getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0).color}`}>
                  <img
                    src={getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0).icon}
                    alt={getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0).display}
                    className="w-5 h-5"
                  />
                  → {getGradeDisplayLocal(profileForm.watch('record_minutes'), profileForm.watch('record_seconds') || 0).display}
                </div>
              )}
            </div>

            {/* 기타 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기타</label>
              <textarea
                {...profileForm.register('etc')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="추가 정보가 있다면 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '수정 중...' : '회원정보 수정'}
            </button>
          </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">회원 탈퇴</h3>
              <p className="text-sm text-red-600 mb-4">
                탈퇴 시 모든 회원 정보와 대회 신청 내역이 삭제되며, 복구할 수 없습니다.
              </p>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 */}
      {activeTab === 'password' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-6">비밀번호 변경</h2>
          
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
            {/* 현재 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
              <div className="relative">
                <input
                  {...passwordForm.register('current_password')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.current_password.message}</p>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
              <div className="relative">
                <input
                  {...passwordForm.register('new_password')}
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="영문, 숫자 포함 8자 이상"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
              <div className="relative">
                <input
                  {...passwordForm.register('confirm_password')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      )}

      {/* 신청 내역 */}
      {activeTab === 'registrations' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">신청 내역</h2>
            <p className="text-sm text-gray-600 mt-1">참가 신청한 대회 목록입니다.</p>
          </div>
          
          {registrations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>참가 신청한 대회가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {registrations.map((registration) => {
                const status = getPaymentStatusDisplay(registration.payment_status)
                return (
                  <div key={registration.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {registration.competitions.title}
                        </h3>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>📅 {new Date(registration.competitions.date).toLocaleDateString('ko-KR')}</span>
                          <span>📍 {registration.competitions.location}</span>
                          {registration.category && <span>🏃 {registration.category}</span>}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          신청일: {new Date(registration.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
        </div>
      </section>
    </div>
  )
}