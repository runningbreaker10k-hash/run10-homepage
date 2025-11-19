'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { ErrorHandler } from '@/lib/errorHandler'
import { useSubmit } from '@/hooks/useAsync'
import { useMessageModal } from '@/contexts/ModalContext'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Search } from 'lucide-react'

// 다음 우편번호 서비스 타입 정의
declare global {
  interface Window {
    daum: any
  }
}

const membershipSchema = z.object({
  user_id: z.string()
    .min(1, '아이디를 입력해주세요')
    .min(4, '아이디는 최소 4자 이상이어야 합니다')
    .max(15, '아이디는 최대 15자까지 가능합니다')
    .regex(/^[a-z][a-z0-9]*$/, '아이디는 영문 소문자로 시작하고, 영문 소문자와 숫자만 사용 가능합니다')
    .transform(val => val.toLowerCase()),
  password: z.string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 모두 포함해야 합니다'),
  password_confirm: z.string()
    .min(1, '비밀번호 확인을 입력해주세요'),
  name: z.string()
    .min(1, '성명을 입력해주세요')
    .min(2, '성명은 최소 2자 이상이어야 합니다')
    .max(10, '성명은 최대 10자까지 가능합니다'),
  postal_code: z.string()
    .min(1, '우편번호 찾기 버튼을 클릭하여 주소를 입력해주세요')
    .min(5, '올바른 우편번호를 입력해주세요 (5자리)'),
  address1: z.string()
    .min(1, '우편번호 찾기 버튼을 클릭하여 주소를 입력해주세요'),
  address2: z.string()
    .min(1, '상세주소를 입력해주세요 (예: 101동 101호)'),
  phone: z.string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^010-\d{4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요 (하이픈 포함)'),
  phone_marketing_agree: z.boolean(),
  email: z.string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 주소를 입력해주세요 (예: example@email.com)'),
  email_marketing_agree: z.boolean(),
  birth_date: z.string()
    .min(1, '생년월일을 입력해주세요 (6자리 숫자)')
    .regex(/^\d{6}$/, '생년월일은 6자리 숫자로 입력해주세요 (예: 901225)'),
  gender_digit: z.string()
    .min(1, '주민번호 뒷자리 첫 번째 숫자를 입력해주세요 (1~4)')
    .regex(/^[1-4]$/, '주민번호 뒷자리는 1, 2, 3, 4 중 하나를 입력해주세요'),
  gender: z.string()
    .min(1, '성별을 선택해주세요 (남성 또는 여성)')
    .refine((val) => val === 'male' || val === 'female', {
      message: '성별을 선택해주세요 (남성 또는 여성)'
    }),
  record_range: z.string()
    .min(1, '10K 기록을 선택해주세요 (기록이 없으면 "기록없음" 선택)')
    .refine((val) => ['30', '40', '50', '60', '70', 'none'].includes(val), {
      message: '10K 기록을 선택해주세요 (기록이 없으면 "기록없음" 선택)'
    }),
  etc: z.string().optional(),
  privacy_agree: z.boolean()
    .refine(val => val === true, {
      message: '[필수] 개인정보 처리방침에 동의해주세요'
    }),
  terms_agree: z.boolean()
    .refine(val => val === true, {
      message: '[필수] 이용약관에 동의해주세요'
    })
}).refine((data) => data.password === data.password_confirm, {
  message: '비밀번호가 일치하지 않습니다. 동일한 비밀번호를 입력해주세요',
  path: ['password_confirm']
})

type MembershipFormData = z.infer<typeof membershipSchema>

interface MembershipFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function MembershipForm({ onSuccess, onCancel }: MembershipFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [idCheckStatus, setIdCheckStatus] = useState<'none' | 'checking' | 'available' | 'taken'>('none')
  const [emailCheckStatus, setEmailCheckStatus] = useState<'none' | 'checking' | 'available' | 'taken'>('none')
  const [postCodeModalOpen, setPostCodeModalOpen] = useState(false)
  const [noRecord, setNoRecord] = useState(false)
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web')

  const { showError, showSuccess } = useMessageModal()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      phone_marketing_agree: false,
      email_marketing_agree: false,
      privacy_agree: false,
      terms_agree: false,
      gender: '',
      record_range: ''
    }
  })

  const watchedUserId = watch('user_id')
  const watchedEmail = watch('email')
  const watchedRecordRange = watch('record_range')
  const watchedGender = watch('gender')
  const watchedGenderDigit = watch('gender_digit')

  // 플랫폼 구분 (웹 vs 앱)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 테스트용: URL 쿼리 파라미터 확인 (?platform=ios 또는 ?platform=android)
    const urlParams = new URLSearchParams(window.location.search)
    const platformParam = urlParams.get('platform')

    if (platformParam === 'android' || platformParam === 'ios') {
      setPlatform(platformParam)
      return
    }

    // 실제 UserAgent 확인
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.indexOf('androidapp') !== -1) {
      setPlatform('android')
    } else if (userAgent.indexOf('iosapp') !== -1) {
      setPlatform('ios')
    } else {
      setPlatform('web')
    }
  }, [])

  // 앱 접속 시 개인정보 필드 기본값 자동 설정
  useEffect(() => {
    if (platform === 'android' || platform === 'ios') {
      // 개인정보 필드에 기본값 설정 (스토어 심사용)
      setValue('name', '앱사용자')
      setValue('postal_code', '00000')
      setValue('address1', '주소미입력')
      setValue('address2', '주소미입력')
      setValue('phone', '010-0000-0000')
      setValue('birth_date', '000000')
      setValue('gender_digit', '1')
      setValue('gender', 'male')

      // 앱에서는 연락처 마케팅 동의 기본값을 false로 설정
      setValue('phone_marketing_agree', false)
      setValue('email_marketing_agree', false)

      // 폼 검증 트리거
      trigger(['name', 'postal_code', 'address1', 'address2', 'phone', 'birth_date', 'gender_digit', 'gender'])
    }
  }, [platform, setValue, trigger])

  // 기록 범위와 성별에 따른 등급 표시
  const getGradeDisplay = (recordRange?: string, gender?: string) => {
    if (!recordRange || !gender) {
      return { grade: 'turtle', display: '성별과 기록을 선택하세요', icon: '/images/grades/turtle.png', color: 'text-gray-400' }
    }

    if (recordRange === 'none') {
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    }

    const recordMinutes = parseInt(recordRange)

    if (gender === 'male') {
      // 남성 기준
      if (recordMinutes <= 30) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      if (recordMinutes <= 40) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      if (recordMinutes <= 50) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    } else {
      // 여성 기준
      if (recordMinutes <= 40) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      if (recordMinutes <= 50) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      if (recordMinutes <= 60) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    }
  }

  // 아이디 중복 확인
  const checkUserId = async () => {
    if (!watchedUserId || watchedUserId.length < 4) {
      setIdCheckStatus('none')
      return
    }

    setIdCheckStatus('checking')

    try {
      // 소문자로 변환하여 중복 확인
      const lowerCaseUserId = watchedUserId.toLowerCase()
      const { data, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', lowerCaseUserId)
        .single()

      if (error && error.code === 'PGRST116') {
        // 데이터가 없음 - 사용 가능
        setIdCheckStatus('available')
      } else if (data) {
        // 데이터가 있음 - 이미 사용 중
        setIdCheckStatus('taken')
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      ErrorHandler.logError(appError, 'MembershipForm.checkUserId')
      setIdCheckStatus('none')
      ErrorHandler.showUserMessage(appError)
    }
  }

  // 이메일 중복 확인
  const checkEmail = async () => {
    if (!watchedEmail || !watchedEmail.includes('@')) {
      setEmailCheckStatus('none')
      return
    }

    setEmailCheckStatus('checking')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', watchedEmail)
        .single()

      if (error && error.code === 'PGRST116') {
        // 데이터가 없음 - 사용 가능
        setEmailCheckStatus('available')
      } else if (data) {
        // 데이터가 있음 - 이미 사용 중
        setEmailCheckStatus('taken')
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      ErrorHandler.logError(appError, 'MembershipForm.checkEmail')
      setEmailCheckStatus('none')
      ErrorHandler.showUserMessage(appError)
    }
  }

  // 우편번호 찾기
  const openPostCodeModal = () => {
    if (typeof window === 'undefined') return

    // Daum 우편번호 스크립트 동적 로드
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          setValue('postal_code', data.zonecode)
          setValue('address1', data.address)
          setValue('address2', '')
          trigger(['postal_code', 'address1'])
          setPostCodeModalOpen(false)
        },
        onclose: function() {
          setPostCodeModalOpen(false)
        }
      }).open()
    }
    
    if (!document.querySelector('script[src*="postcode.v2.js"]')) {
      document.head.appendChild(script)
    } else {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          setValue('postal_code', data.zonecode)
          setValue('address1', data.address)
          setValue('address2', '')
          trigger(['postal_code', 'address1'])
          setPostCodeModalOpen(false)
        },
        onclose: function() {
          setPostCodeModalOpen(false)
        }
      }).open()
    }
  }

  // 전화번호 자동 하이픈 추가
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }

  // 주민번호 뒷자리로 성별 자동 설정
  const handleGenderDigitChange = (value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1)
    setValue('gender_digit', digit)

    if (digit === '1' || digit === '3') {
      setValue('gender', 'male')
      trigger('gender')
    } else if (digit === '2' || digit === '4') {
      setValue('gender', 'female')
      trigger('gender')
    }
  }

  const onSubmit = async (data: MembershipFormData) => {
    // 웹 접속 시에만 중복 확인 검증
    if (platform === 'web') {
      if (idCheckStatus !== 'available') {
        showError('아이디 중복확인을 완료해주세요')
        return
      }

      if (emailCheckStatus !== 'available') {
        showError('이메일 중복확인을 완료해주세요')
        return
      }
    } else {
      // 앱 접속 시에는 제출 전 자동으로 중복 확인
      if (!data.user_id || data.user_id.length < 4) {
        showError('아이디를 입력해주세요')
        return
      }

      if (!data.email || !data.email.includes('@')) {
        showError('이메일을 입력해주세요')
        return
      }

      // 아이디 중복 확인
      const lowerCaseUserId = data.user_id.toLowerCase()
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', lowerCaseUserId)
        .single()

      if (existingUser) {
        showError('이미 사용 중인 아이디입니다')
        return
      }

      // 이메일 중복 확인
      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', data.email)
        .single()

      if (existingEmail) {
        showError('이미 사용 중인 이메일입니다')
        return
      }
    }

    setIsLoading(true)

    try {
      // 선택한 기록 범위를 실제 기록 시간으로 변환 (분:초)
      let recordTime = 0
      if (data.record_range === 'none') {
        recordTime = 100 * 60 // 100분 = 6000초
      } else {
        recordTime = parseInt(data.record_range) * 60 // 선택한 분 * 60초
      }

      // 등급 계산
      const gradeInfo = getGradeDisplay(data.record_range, data.gender)
      const grade = gradeInfo.grade

      const insertData = {
        user_id: data.user_id.toLowerCase(),
        password: data.password,
        name: data.name,
        postal_code: data.postal_code,
        address1: data.address1,
        address2: data.address2,
        phone: data.phone,
        phone_marketing_agree: !!data.phone_marketing_agree,
        email: data.email,
        email_marketing_agree: !!data.email_marketing_agree,
        birth_date: data.birth_date,
        gender_digit: data.gender_digit,
        gender: data.gender,
        record_time: recordTime,
        grade: grade,
        etc: data.etc || null
      }


      const { data: result, error } = await supabase
        .from('users')
        .insert([insertData])
        .select()


      if (error) throw error

      showSuccess('회원가입이 완료되었습니다!')
      onSuccess()
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      ErrorHandler.logError(appError, 'MembershipForm.onSubmit')
      ErrorHandler.showUserMessage(appError)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">회원가입</h2>
        <p className="text-gray-600 text-sm sm:text-base text-center">
          {platform === 'web'
            ? '런텐에 가입하여 다양한 러닝 대회에 참여해보세요!'
            : '간편하게 가입하여 러닝 대회에 참여해보세요!'}
        </p>
        {platform !== 'web' && (
          <p className="text-blue-600 text-xs sm:text-sm text-center mt-2">
            앱 사용자는 간소화된 정보만 입력하시면 됩니다.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            아이디 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              {...register('user_id')}
              type="text"
              className="flex-1 px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="영문+숫자 조합, 4-15자"
              onChange={(e) => {
                // 입력값을 자동으로 소문자로 변환
                e.target.value = e.target.value.toLowerCase()
                register('user_id').onChange(e)
                setIdCheckStatus('none')
              }}
            />
            <button
              type="button"
              onClick={checkUserId}
              disabled={!watchedUserId || watchedUserId.length < 4 || idCheckStatus === 'checking'}
              className="px-4 py-2 sm:py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base font-medium touch-manipulation"
            >
              {idCheckStatus === 'checking' ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                '중복확인'
              )}
            </button>
          </div>
          {idCheckStatus === 'available' && (
            <p className="text-green-600 text-xs sm:text-sm mt-1 flex items-center gap-1 break-words">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              사용 가능한 아이디입니다
            </p>
          )}
          {idCheckStatus === 'taken' && (
            <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1 break-words">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              이미 사용 중인 아이디입니다
            </p>
          )}
          {errors.user_id && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.user_id.message}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="영문, 숫자 포함 8자 이상"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
            >
              {showPassword ? <EyeOff className="w-4 h-4 flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.password.message}</p>}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              {...register('password_confirm')}
              type={showPasswordConfirm ? 'text' : 'password'}
              className="w-full px-3 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 다시 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
            >
              {showPasswordConfirm ? <EyeOff className="w-4 h-4 flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
            </button>
          </div>
          {errors.password_confirm && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.password_confirm.message}</p>}
        </div>

        {/* 성명 - 웹에서만 표시 */}
        {platform === 'web' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성명 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="실명을 입력하세요"
            />
            {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.name.message}</p>}
          </div>
        ) : (
          <input type="hidden" {...register('name')} />
        )}

        {/* 주소 - 웹에서만 표시 */}
        {platform === 'web' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주소 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  {...register('postal_code')}
                  type="text"
                  readOnly
                  className="w-full sm:w-32 px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md bg-gray-50"
                  placeholder="우편번호"
                />
                <button
                  type="button"
                  onClick={openPostCodeModal}
                  className="px-4 py-2 sm:py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center gap-2 text-sm sm:text-base font-medium touch-manipulation"
                >
                  <Search className="w-4 h-4 flex-shrink-0" />
                  <span>우편번호 찾기</span>
                </button>
              </div>
              <input
                {...register('address1')}
                type="text"
                readOnly
                className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md bg-gray-50"
                placeholder="주소"
              />
              <input
                {...register('address2')}
                type="text"
                className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="상세주소를 입력하세요"
              />
            </div>
            {errors.postal_code && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.postal_code.message}</p>}
            {errors.address1 && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.address1.message}</p>}
            {errors.address2 && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.address2.message}</p>}
          </div>
        ) : (
          <>
            <input type="hidden" {...register('postal_code')} />
            <input type="hidden" {...register('address1')} />
            <input type="hidden" {...register('address2')} />
          </>
        )}

        {/* 연락처 - 웹에서만 표시 */}
        {platform === 'web' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('phone')}
              type="text"
              className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setValue('phone', formatted)
              }}
            />
            <div className="mt-2 sm:mt-3">
              <label className="flex items-center">
                <input
                  {...register('phone_marketing_agree')}
                  type="checkbox"
                  className="mr-2 touch-manipulation"
                  onChange={(e) => {
                    setValue('phone_marketing_agree', e.target.checked)
                    setValue('email_marketing_agree', e.target.checked)
                  }}
                />
                <span className="text-sm text-gray-600 break-words">마케팅 정보 수신에 동의합니다</span>
              </label>
            </div>
            {errors.phone && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.phone.message}</p>}
          </div>
        ) : (
          <input type="hidden" {...register('phone')} />
        )}

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이메일 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              {...register('email')}
              type="email"
              className="flex-1 px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
              onChange={(e) => {
                register('email').onChange(e)
                setEmailCheckStatus('none')
              }}
            />
            <button
              type="button"
              onClick={checkEmail}
              disabled={!watchedEmail || !watchedEmail.includes('@') || emailCheckStatus === 'checking'}
              className="px-4 py-2 sm:py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base font-medium touch-manipulation"
            >
              {emailCheckStatus === 'checking' ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                '중복확인'
              )}
            </button>
          </div>
          {emailCheckStatus === 'available' && (
            <p className="text-green-600 text-xs sm:text-sm mt-1 flex items-center gap-1 break-words">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              사용 가능한 이메일입니다
            </p>
          )}
          {emailCheckStatus === 'taken' && (
            <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1 break-words">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              이미 사용 중인 이메일입니다
            </p>
          )}
          {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.email.message}</p>}
        </div>

        {/* 주민번호 앞자리 (생년월일 + 성별) - 웹에서만 표시 */}
        {platform === 'web' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주민번호(앞 7자리) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                {...register('birth_date')}
                type="text"
                className="flex-1 px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                placeholder="000000"
                maxLength={6}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setValue('birth_date', cleaned)
                }}
              />
              <span className="text-lg sm:text-xl font-bold text-gray-400">-</span>
              <input
                {...register('gender_digit')}
                type="text"
                className="w-12 sm:w-14 px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                placeholder="0"
                maxLength={1}
                onChange={(e) => handleGenderDigitChange(e.target.value)}
              />
              <div className="flex-1 flex items-center gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 rounded-full"></div>
                ))}
              </div>
            </div>
            {errors.birth_date && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.birth_date.message}</p>}
            {errors.gender_digit && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.gender_digit.message}</p>}
          </div>
        ) : (
          <>
            <input type="hidden" {...register('birth_date')} />
            <input type="hidden" {...register('gender_digit')} />
          </>
        )}

        {/* 성별 (자동 선택되지만 수정 가능) - 웹에서만 표시 */}
        {platform === 'web' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성별 {watchedGenderDigit && '(자동 선택됨, 수정 가능)'} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3 sm:gap-4">
              <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-all cursor-pointer border-2 ${
                watchedGender === 'male' ? 'bg-blue-100 border-blue-500 font-semibold' : 'bg-white border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  {...register('gender')}
                  type="radio"
                  value="male"
                  className="mr-2"
                />
                <span className="text-sm sm:text-base">남성</span>
              </label>
              <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition-all cursor-pointer border-2 ${
                watchedGender === 'female' ? 'bg-pink-100 border-pink-500 font-semibold' : 'bg-white border-gray-300 hover:border-pink-300'
              }`}>
                <input
                  {...register('gender')}
                  type="radio"
                  value="female"
                  className="mr-2"
                />
                <span className="text-sm sm:text-base">여성</span>
              </label>
            </div>
            {errors.gender && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.gender.message}</p>}
          </div>
        ) : (
          <input type="hidden" {...register('gender')} />
        )}

        {/* 기록 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            10K 기록 (마이페이지에서 정확한 기록 수정가능) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 touch-manipulation">
              <input
                {...register('record_range')}
                type="radio"
                value="30"
                className="mr-2"
              />
              <span className="text-sm sm:text-base font-medium">30분대</span>
            </label>
            <label className="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 touch-manipulation">
              <input
                {...register('record_range')}
                type="radio"
                value="40"
                className="mr-2"
              />
              <span className="text-sm sm:text-base font-medium">40분대</span>
            </label>
            <label className="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 touch-manipulation">
              <input
                {...register('record_range')}
                type="radio"
                value="50"
                className="mr-2"
              />
              <span className="text-sm sm:text-base font-medium">50분대</span>
            </label>
            <label className="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 touch-manipulation">
              <input
                {...register('record_range')}
                type="radio"
                value="60"
                className="mr-2"
              />
              <span className="text-sm sm:text-base font-medium">60분대</span>
            </label>
            <label className="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 touch-manipulation">
              <input
                {...register('record_range')}
                type="radio"
                value="70"
                className="mr-2"
              />
              <span className="text-sm sm:text-base font-medium">70분이상</span>
            </label>
            <label className="flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 touch-manipulation">
              <input
                {...register('record_range')}
                type="radio"
                value="none"
                className="mr-2"
              />
              <span className="text-sm sm:text-base font-medium">기록없음</span>
            </label>
          </div>
          {errors.record_range && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.record_range.message}</p>}

          {watchedRecordRange && watchedGender && (
            <div className={`flex items-center gap-2 text-sm sm:text-base mt-3 ${
              getGradeDisplay(watchedRecordRange, watchedGender).color
            }`}>
              <img
                src={getGradeDisplay(watchedRecordRange, watchedGender).icon}
                alt={getGradeDisplay(watchedRecordRange, watchedGender).display}
                className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
              />
              → {getGradeDisplay(watchedRecordRange, watchedGender).display}
            </div>
          )}
        </div>

        {/* 기타 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">기타</label>
          <textarea
            {...register('etc')}
            rows={3}
            className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="추가로 전달하고 싶은 내용이 있다면 입력하세요"
          />
        </div>

        {/* 약관 동의 */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border border-gray-200 rounded-md bg-gray-50">
          <div>
            <label className="flex items-start touch-manipulation">
              <input
                {...register('privacy_agree')}
                type="checkbox"
                className="mr-2 mt-0.5 touch-manipulation"
              />
              <div className="text-sm sm:text-base">
                <span className="font-medium">[필수] 개인정보 처리방침에 동의합니다</span>
                <div className="text-gray-600 mt-1 text-xs sm:text-sm break-words">
                  수집목적: 회원 관리, 대회 참가 관리, 공지사항 전달<br />
                  수집항목: 아이디, 성명, 연락처, 이메일, 주소, 생년월일, 성별<br />
                  보유기간: 회원 탈퇴시까지
                </div>
              </div>
            </label>
            {errors.privacy_agree && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.privacy_agree.message}</p>}
          </div>

          <div>
            <label className="flex items-start touch-manipulation">
              <input
                {...register('terms_agree')}
                type="checkbox"
                className="mr-2 mt-0.5 touch-manipulation"
              />
              <div className="text-sm sm:text-base">
                <span className="font-medium">[필수] 이용약관에 동의합니다</span>
                <div className="text-gray-600 mt-1 text-xs sm:text-sm break-words">
                  회원은 대회 참가 시 안전수칙을 준수해야 하며, 허위정보 제공 시 회원자격이 박탈될 수 있습니다.
                </div>
              </div>
            </label>
            {errors.terms_agree && <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.terms_agree.message}</p>}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 sm:py-4 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base font-medium touch-manipulation"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 sm:py-4 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium touch-manipulation"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>가입 중...</span>
              </>
            ) : (
              '회원가입'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}