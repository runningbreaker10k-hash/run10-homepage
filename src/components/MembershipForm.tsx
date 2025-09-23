'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Search } from 'lucide-react'

// 다음 우편번호 서비스 타입 정의
declare global {
  interface Window {
    daum: any
  }
}

const membershipSchema = z.object({
  user_id: z.string()
    .min(4, '아이디는 최소 4자 이상이어야 합니다')
    .max(15, '아이디는 최대 15자까지 가능합니다')
    .regex(/^[a-zA-Z0-9]+$/, '아이디는 영문과 숫자만 사용 가능합니다'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 포함해야 합니다'),
  password_confirm: z.string(),
  name: z.string()
    .min(2, '성명은 최소 2자 이상이어야 합니다')
    .max(10, '성명은 최대 10자까지 가능합니다'),
  postal_code: z.string()
    .min(5, '우편번호를 입력해주세요'),
  address1: z.string()
    .min(1, '주소를 입력해주세요'),
  address2: z.string()
    .min(1, '상세주소를 입력해주세요'),
  phone: z.string()
    .regex(/^010-\d{4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요'),
  phone_marketing_agree: z.boolean(),
  email: z.string()
    .email('올바른 이메일 주소를 입력해주세요'),
  email_marketing_agree: z.boolean(),
  birth_date: z.string()
    .regex(/^\d{6}$/, '생년월일은 YYMMDD 형식으로 입력해주세요'),
  gender: z.enum(['male', 'female'], {
    required_error: '성별을 선택해주세요'
  }),
  record_minutes: z.number().min(1, '최소 1분은 입력해주세요').max(200, '최대 200분까지 입력 가능합니다'),
  record_seconds: z.number().min(0, '초는 0~59 사이여야 합니다').max(59, '초는 0~59 사이여야 합니다'),
  etc: z.string().optional(),
  privacy_agree: z.boolean().refine(val => val === true, {
    message: '개인정보 처리방침에 동의해주세요'
  }),
  terms_agree: z.boolean().refine(val => val === true, {
    message: '이용약관에 동의해주세요'
  })
}).refine((data) => data.password === data.password_confirm, {
  message: '비밀번호가 일치하지 않습니다',
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
  const [postCodeModalOpen, setPostCodeModalOpen] = useState(false)

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
      terms_agree: false
    }
  })

  const watchedUserId = watch('user_id')
  const watchedRecordMinutes = watch('record_minutes')
  const watchedRecordSeconds = watch('record_seconds')
  const watchedGender = watch('gender')

  // 기록에 따른 등급 표시 (성별별 다른 기준 적용)
  const getGradeDisplay = (minutes: number, seconds: number = 0, gender?: string) => {
    const totalMinutes = minutes + (seconds / 60)

    if (gender === 'male') {
      // 남성 기준
      if (totalMinutes < 40) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      if (totalMinutes < 50) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      if (totalMinutes < 60) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    } else if (gender === 'female') {
      // 여성 기준
      if (totalMinutes < 50) return { grade: 'cheetah', display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      if (totalMinutes < 60) return { grade: 'horse', display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      if (totalMinutes < 70) return { grade: 'wolf', display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      return { grade: 'turtle', display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
    } else {
      // 성별 미선택 시 기본 안내
      return { grade: 'turtle', display: '성별을 선택하세요', icon: '/images/grades/turtle.png', color: 'text-gray-400' }
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
      const { data, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', watchedUserId)
        .single()

      if (error && error.code === 'PGRST116') {
        // 데이터가 없음 - 사용 가능
        setIdCheckStatus('available')
      } else if (data) {
        // 데이터가 있음 - 이미 사용 중
        setIdCheckStatus('taken')
      }
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error)
      setIdCheckStatus('none')
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

  const onSubmit = async (data: MembershipFormData) => {
    if (idCheckStatus !== 'available') {
      alert('아이디 중복확인을 완료해주세요')
      return
    }

    setIsLoading(true)

    try {
      // 기록 시간으로 등급 계산 (성별에 따라 다른 기준 적용)
      const recordTime = (data.record_minutes * 60) + data.record_seconds
      const totalMinutes = recordTime / 60

      let grade = 'turtle'

      if (data.gender === 'male') {
        // 남성 기준
        if (totalMinutes < 40) grade = 'cheetah'          // 00:00~39:59
        else if (totalMinutes < 50) grade = 'horse'       // 40:00~49:59
        else if (totalMinutes < 60) grade = 'wolf'        // 50:00~59:59
        else grade = 'turtle'                             // 60:00 이상
      } else {
        // 여성 기준
        if (totalMinutes < 50) grade = 'cheetah'          // 00:00~49:59
        else if (totalMinutes < 60) grade = 'horse'       // 50:00~59:59
        else if (totalMinutes < 70) grade = 'wolf'        // 60:00~69:59
        else grade = 'turtle'                             // 70:00 이상
      }

      const { error } = await supabase
        .from('users')
        .insert([{
          user_id: data.user_id,
          password: data.password,
          name: data.name,
          postal_code: data.postal_code,
          address1: data.address1,
          address2: data.address2,
          phone: data.phone,
          phone_marketing_agree: data.phone_marketing_agree,
          email: data.email,
          email_marketing_agree: data.email_marketing_agree,
          birth_date: data.birth_date,
          gender: data.gender,
          record_time: recordTime,
          grade: grade,
          etc: data.etc || null
        }])

      if (error) throw error

      alert('회원가입이 완료되었습니다!')
      onSuccess()
    } catch (error) {
      console.error('회원가입 오류:', error)
      alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">회원가입</h2>
        <p className="text-gray-600 text-center">런텐에 가입하여 다양한 러닝 대회에 참여해보세요!</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            아이디 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              {...register('user_id')}
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="영문/숫자 4-15자"
              onChange={(e) => {
                register('user_id').onChange(e)
                setIdCheckStatus('none')
              }}
            />
            <button
              type="button"
              onClick={checkUserId}
              disabled={!watchedUserId || watchedUserId.length < 4 || idCheckStatus === 'checking'}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {idCheckStatus === 'checking' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '중복확인'
              )}
            </button>
          </div>
          {idCheckStatus === 'available' && (
            <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              사용 가능한 아이디입니다
            </p>
          )}
          {idCheckStatus === 'taken' && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              이미 사용 중인 아이디입니다
            </p>
          )}
          {errors.user_id && <p className="text-red-500 text-sm mt-1">{errors.user_id.message}</p>}
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
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="영문, 숫자 포함 8자 이상"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
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
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 다시 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password_confirm && <p className="text-red-500 text-sm mt-1">{errors.password_confirm.message}</p>}
        </div>

        {/* 성명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성명 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="실명을 입력하세요"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                {...register('postal_code')}
                type="text"
                readOnly
                className="w-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                placeholder="우편번호"
              />
              <button
                type="button"
                onClick={openPostCodeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                우편번호 찾기
              </button>
            </div>
            <input
              {...register('address1')}
              type="text"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              placeholder="주소"
            />
            <input
              {...register('address2')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="상세주소를 입력하세요"
            />
          </div>
          {errors.postal_code && <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>}
          {errors.address1 && <p className="text-red-500 text-sm mt-1">{errors.address1.message}</p>}
          {errors.address2 && <p className="text-red-500 text-sm mt-1">{errors.address2.message}</p>}
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-0000-0000"
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value)
              setValue('phone', formatted)
            }}
          />
          <div className="mt-2">
            <label className="flex items-center">
              <input
                {...register('phone_marketing_agree')}
                type="checkbox"
                className="mr-2"
              />
              <span className="text-sm text-gray-600">연락처로 마케팅 정보 수신에 동의합니다</span>
            </label>
          </div>
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@email.com"
          />
          <div className="mt-2">
            <label className="flex items-center">
              <input
                {...register('email_marketing_agree')}
                type="checkbox"
                className="mr-2"
              />
              <span className="text-sm text-gray-600">이메일로 마케팅 정보 수신에 동의합니다</span>
            </label>
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        {/* 생년월일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            생년월일 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('birth_date')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="YYMMDD (예: 901225)"
            maxLength={6}
          />
          {errors.birth_date && <p className="text-red-500 text-sm mt-1">{errors.birth_date.message}</p>}
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            성별 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                {...register('gender')}
                type="radio"
                value="male"
                className="mr-2"
              />
              <span>남성</span>
            </label>
            <label className="flex items-center">
              <input
                {...register('gender')}
                type="radio"
                value="female"
                className="mr-2"
              />
              <span>여성</span>
            </label>
          </div>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
        </div>

        {/* 기록 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            10K 기록 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <input
                type="number"
                {...register('record_minutes', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="분"
                min="1"
                max="200"
              />
              {errors.record_minutes && <p className="text-red-500 text-xs mt-1">{errors.record_minutes.message}</p>}
            </div>
            <span className="text-gray-500">분</span>
            <div className="flex-1">
              <input
                type="number"
                {...register('record_seconds', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="초"
                min="0"
                max="59"
              />
              {errors.record_seconds && <p className="text-red-500 text-xs mt-1">{errors.record_seconds.message}</p>}
            </div>
            <span className="text-gray-500">초</span>
          </div>
          {watchedRecordMinutes && (
            <div className={`flex items-center gap-2 text-sm mt-2 ${getGradeDisplay(watchedRecordMinutes, watchedRecordSeconds || 0, watchedGender).color}`}>
              <img
                src={getGradeDisplay(watchedRecordMinutes, watchedRecordSeconds || 0, watchedGender).icon}
                alt={getGradeDisplay(watchedRecordMinutes, watchedRecordSeconds || 0, watchedGender).display}
                className="w-5 h-5"
              />
              → {getGradeDisplay(watchedRecordMinutes, watchedRecordSeconds || 0, watchedGender).display}
            </div>
          )}
        </div>

        {/* 기타 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">기타</label>
          <textarea
            {...register('etc')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="추가로 전달하고 싶은 내용이 있다면 입력하세요"
          />
        </div>

        {/* 약관 동의 */}
        <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
          <div>
            <label className="flex items-start">
              <input
                {...register('privacy_agree')}
                type="checkbox"
                className="mr-2 mt-0.5"
              />
              <div className="text-sm">
                <span className="font-medium">[필수] 개인정보 처리방침에 동의합니다</span>
                <div className="text-gray-600 mt-1 text-xs">
                  수집목적: 회원 관리, 대회 참가 관리, 공지사항 전달<br />
                  수집항목: 아이디, 성명, 연락처, 이메일, 주소, 생년월일, 성별<br />
                  보유기간: 회원 탈퇴시까지
                </div>
              </div>
            </label>
            {errors.privacy_agree && <p className="text-red-500 text-sm mt-1">{errors.privacy_agree.message}</p>}
          </div>
          
          <div>
            <label className="flex items-start">
              <input
                {...register('terms_agree')}
                type="checkbox"
                className="mr-2 mt-0.5"
              />
              <div className="text-sm">
                <span className="font-medium">[필수] 이용약관에 동의합니다</span>
                <div className="text-gray-600 mt-1 text-xs">
                  회원은 대회 참가 시 안전수칙을 준수해야 하며, 허위정보 제공 시 회원자격이 박탈될 수 있습니다.
                </div>
              </div>
            </label>
            {errors.terms_agree && <p className="text-red-500 text-sm mt-1">{errors.terms_agree.message}</p>}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                가입 중...
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