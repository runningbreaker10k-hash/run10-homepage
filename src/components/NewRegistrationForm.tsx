'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { CheckCircle, User, Mail, Phone, Calendar, MapPin, Shirt, CreditCard, Lock, Eye, EyeOff } from 'lucide-react'

// 거리 라벨 매핑
const getDistanceLabel = (distance: string) => {
  const labels: { [key: string]: string } = {
    '3km': '3km',
    '5km': '5km',
    '10km': '10km',
    'half': '하프마라톤 (21km)',
    'full': '풀마라톤 (42km)'
  }
  return labels[distance] || distance
}

const registrationSchema = z.object({
  name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다'),
  birth_date: z.string().regex(/^[0-9]{6}$/, '생년월일은 6자리 숫자(YYMMDD)로 입력해주세요'),
  gender: z.enum(['male', 'female'], { message: '성별을 선택해주세요' }),
  address: z.string().min(5, '주소를 입력해주세요'),
  phone: z.string().regex(/^[0-9-+().\s]+$/, '올바른 전화번호 형식을 입력해주세요'),
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], { message: '티셔츠 사이즈를 선택해주세요' }),
  participation_group_id: z.string().min(1, '참가 그룹을 선택해주세요'),
  depositor_name: z.string().min(2, '입금자명을 입력해주세요'),
  password: z.string().min(4, '비밀번호는 최소 4자리 이상이어야 합니다'),
  password_confirm: z.string().min(4, '비밀번호 확인을 입력해주세요'),
  notes: z.string().optional()
}).refine((data) => data.password === data.password_confirm, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["password_confirm"],
})

type RegistrationFormData = z.infer<typeof registrationSchema>

interface NewRegistrationFormProps {
  competition: Competition
  participationGroups: any[]
  onSuccess: () => void
}

export default function NewRegistrationForm({ competition, participationGroups, onSuccess }: NewRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  })

  const watchBirthDate = watch('birth_date')
  const watchGender = watch('gender')

  // 생년월일과 성별로 나이 계산
  const calculateAge = (birthDate: string, gender: string) => {
    if (!birthDate || birthDate.length !== 6) return 0
    
    const year = parseInt(birthDate.substring(0, 2))
    const currentYear = new Date().getFullYear()
    const century = year <= (currentYear % 100) ? 2000 : 1900
    const fullYear = century + year
    
    return currentYear - fullYear
  }

  const onSubmit = async (data: RegistrationFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)

    try {
      const { password_confirm, ...registrationData } = data
      const age = calculateAge(data.birth_date, data.gender)
      
      // 중복 신청 체크 (이름 + 생년월일 + 대회 ID)
      const { data: existingRegistration, error: checkError } = await supabase
        .from('registrations')
        .select('id, name, birth_date')
        .eq('competition_id', competition.id)
        .eq('name', data.name)
        .eq('birth_date', data.birth_date)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
        console.error('Error checking duplicate registration:', checkError)
        alert('중복 신청 확인 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      if (existingRegistration) {
        alert('이미 동일한 이름과 생년월일로 신청된 내역이 있습니다. 중복 신청은 불가능합니다.')
        setIsSubmitting(false)
        return
      }
      
      // 선택된 그룹 정보 가져오기
      const selectedGroup = participationGroups.find(group => group.id === data.participation_group_id)
      if (!selectedGroup) {
        alert('선택된 참가 그룹을 찾을 수 없습니다.')
        return
      }

      const { error } = await supabase
        .from('registrations')
        .insert({
          ...registrationData,
          competition_id: competition.id,
          participation_group_id: selectedGroup.id,
          distance: selectedGroup.distance,
          entry_fee: selectedGroup.entry_fee,
          age,
          payment_status: 'pending',
          is_member_registration: false
        })

      if (error) {
        console.error('Error submitting registration:', error)
        if (error.message.includes('duplicate key')) {
          alert('이미 등록된 정보입니다. 중복 신청은 불가능합니다.')
        } else {
          alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
        }
        return
      }

      // 대회 참가자 수 업데이트
      const { error: updateError } = await supabase
        .from('competitions')
        .update({ 
          current_participants: competition.current_participants + 1 
        })
        .eq('id', competition.id)

      if (updateError) {
        console.error('Error updating competition:', updateError)
      }

      reset()
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }


  const calculatedAge = calculateAge(watchBirthDate, watchGender)

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          기본 정보
        </h4>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              placeholder="홍길동"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
              생년월일 (주민번호 앞 6자리) *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('birth_date')}
                type="text"
                maxLength={6}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="901234"
              />
            </div>
            {calculatedAge > 0 && (
              <p className="mt-1 text-sm text-gray-500">나이: {calculatedAge}세</p>
            )}
            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              성별 *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  {...register('gender')}
                  type="radio"
                  value="male"
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                남성
              </label>
              <label className="flex items-center">
                <input
                  {...register('gender')}
                  type="radio"
                  value="female"
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                여성
              </label>
            </div>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="participation_group_id" className="block text-sm font-medium text-gray-700 mb-1">
              참가 종목 *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('participation_group_id')}
                onChange={(e) => {
                  const group = participationGroups.find(g => g.id === e.target.value)
                  setSelectedGroup(group)
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">참가 종목 선택</option>
                {participationGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} - ₩{group.entry_fee.toLocaleString()} ({group.current_participants}/{group.max_participants}명)
                  </option>
                ))}
              </select>
            </div>
            {errors.participation_group_id && (
              <p className="mt-1 text-sm text-red-600">{errors.participation_group_id.message}</p>
            )}
            {selectedGroup && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">{selectedGroup.name}</div>
                  <div>거리: {getDistanceLabel(selectedGroup.distance)}</div>
                  <div>참가비: ₩{selectedGroup.entry_fee.toLocaleString()}</div>
                  <div>정원: {selectedGroup.current_participants}/{selectedGroup.max_participants}명</div>
                  {selectedGroup.description && (
                    <div className="mt-1 text-xs">{selectedGroup.description}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="shirt_size" className="block text-sm font-medium text-gray-700 mb-1">
              기념품 티셔츠 사이즈 *
            </label>
            <div className="relative">
              <Shirt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('shirt_size')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">사이즈 선택</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            {errors.shirt_size && (
              <p className="mt-1 text-sm text-red-600">{errors.shirt_size.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          연락처 정보
        </h4>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              연락처 *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('phone')}
                type="tel"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="010-1234-5678"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="email@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              주소 *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                {...register('address')}
                rows={2}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="서울특별시 강남구 테헤란로 123 (우편번호 포함)"
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 입금 정보 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          입금 정보
        </h4>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="depositor_name" className="block text-sm font-medium text-gray-700 mb-1">
              입금자명 *
            </label>
            <input
              {...register('depositor_name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              placeholder="실제 입금할 때 사용할 이름"
            />
            {errors.depositor_name && (
              <p className="mt-1 text-sm text-red-600">{errors.depositor_name.message}</p>
            )}
          </div>

          <div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">참가비</span>
                <span className="text-lg font-bold text-blue-600">
                  ₩{competition.entry_fee.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 보안 정보 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          신청 조회용 비밀번호
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          신청 내역 조회 및 수정 시 사용할 비밀번호를 설정해주세요.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="최소 4자리"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('password_confirm')}
                type={showPasswordConfirm ? "text" : "password"}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="비밀번호 재입력"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="mt-1 text-sm text-red-600">{errors.password_confirm.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 특이사항 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">특이사항 (선택)</h4>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
          placeholder="알레르기, 지병, 기타 전달사항 등이 있으시면 입력해주세요"
        />
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? '신청 중...' : '참가 신청하기'}
      </button>
      </form>
    </div>
  )
}