'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { CheckCircle, User, Mail, Phone, Calendar, Shield, Shirt } from 'lucide-react'

const registrationSchema = z.object({
  name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  phone: z.string().regex(/^[0-9-+().\s]+$/, '올바른 전화번호 형식을 입력해주세요'),
  birth_date: z.string().min(1, '생년월일을 선택해주세요'),
  gender: z.enum(['male', 'female'], { required_error: '성별을 선택해주세요' }),
  emergency_contact: z.string().min(2, '비상연락처 이름을 입력해주세요'),
  emergency_phone: z.string().regex(/^[0-9-+().\s]+$/, '올바른 전화번호 형식을 입력해주세요'),
  medical_conditions: z.string().optional(),
  shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'], { required_error: '티셔츠 사이즈를 선택해주세요' }),
  agreement: z.boolean().refine(val => val === true, '참가 동의서에 동의해주세요')
})

type RegistrationFormData = z.infer<typeof registrationSchema>

interface RegistrationFormProps {
  competition: Competition
  onSuccess: () => void
}

export default function RegistrationForm({ competition, onSuccess }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema)
  })

  const onSubmit = async (data: RegistrationFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)

    try {
      const { agreement, ...registrationData } = data
      
      const { error } = await supabase
        .from('registrations')
        .insert({
          ...registrationData,
          competition_id: competition.id
        })

      if (error) {
        console.error('Error submitting registration:', error)
        alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      setIsSuccess(true)
      reset()
      onSuccess()
      
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Error:', error)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          참가 신청이 완료되었습니다!
        </h3>
        <p className="text-green-700 mb-4">
          신청해주셔서 감사합니다. 확인 후 연락드리겠습니다.
        </p>
        <p className="text-sm text-green-600">
          신청 내역은 입력하신 이메일로 확인 가능합니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          기본 정보
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              placeholder="이름을 입력해주세요"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              전화번호 *
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
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
              생년월일 *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('birth_date')}
                type="date"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              />
            </div>
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
            <label htmlFor="shirt_size" className="block text-sm font-medium text-gray-700 mb-1">
              티셔츠 사이즈 *
            </label>
            <div className="relative">
              <Shirt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('shirt_size')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
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

      {/* 비상연락처 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          비상연락처
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-1">
              비상연락처 이름 *
            </label>
            <input
              {...register('emergency_contact')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              placeholder="비상연락처 이름"
            />
            {errors.emergency_contact && (
              <p className="mt-1 text-sm text-red-600">{errors.emergency_contact.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 mb-1">
              비상연락처 전화번호 *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('emergency_phone')}
                type="tel"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                placeholder="010-1234-5678"
              />
            </div>
            {errors.emergency_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.emergency_phone.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700 mb-1">
            특이사항 (선택)
          </label>
          <textarea
            {...register('medical_conditions')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="알레르기, 지병 등 특이사항이 있으시면 입력해주세요"
          />
        </div>
      </div>

      {/* 약관 동의 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">참가 동의서</h4>
        <div className="text-sm text-gray-700 mb-4 space-y-2">
          <p>• 본 대회 참가 시 발생할 수 있는 부상에 대한 책임은 참가자 본인에게 있습니다.</p>
          <p>• 대회 중 촬영된 사진 및 영상은 홍보 목적으로 사용될 수 있습니다.</p>
          <p>• 기상악화 등 불가피한 사유로 대회가 취소될 수 있습니다.</p>
          <p>• 참가비는 대회 시작 7일 전까지만 환불 가능합니다.</p>
        </div>
        
        <label className="flex items-center">
          <input
            {...register('agreement')}
            type="checkbox"
            className="mr-2 text-blue-600 focus:ring-blue-500 rounded"
          />
          <span className="text-sm text-gray-700">
            위 내용을 확인하였으며 참가에 동의합니다 *
          </span>
        </label>
        {errors.agreement && (
          <p className="mt-1 text-sm text-red-600">{errors.agreement.message}</p>
        )}
      </div>

      {/* 참가비 정보 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">참가비</span>
          <span className="text-2xl font-bold text-blue-600">
            ₩{competition.entry_fee.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          신청 완료 후 안내된 계좌로 참가비를 입금해주세요.
        </p>
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '신청 중...' : '참가 신청하기'}
      </button>
    </form>
  )
}