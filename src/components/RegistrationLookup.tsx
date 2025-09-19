'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Registration, Competition } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Search, 
  User, 
  Calendar, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Clock, 
  XCircle,
  Edit,
  Phone,
  Mail,
  MapPin,
  Shirt,
  CreditCard,
  Lock,
  AlertCircle
} from 'lucide-react'

const lookupSchema = z.object({
  name: z.string().min(2, '이름을 입력해주세요'),
  birth_date: z.string().regex(/^[0-9]{6}$/, '생년월일 6자리를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요')
})

const updateSchema = z.object({
  phone: z.string().regex(/^[0-9-+().\s]+$/, '올바른 전화번호 형식을 입력해주세요'),
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  depositor_name: z.string().min(2, '입금자명을 입력해주세요'),
  notes: z.string().optional()
})

type LookupFormData = z.infer<typeof lookupSchema>
type UpdateFormData = z.infer<typeof updateSchema>

interface RegistrationWithCompetition extends Registration {
  competitions?: {
    title: string
    entry_fee: number
    date: string
  }
}

interface RegistrationLookupProps {
  competition: Competition
  onCancelRequest?: () => void
}

export default function RegistrationLookup({ competition, onCancelRequest }: RegistrationLookupProps) {
  const { user } = useAuth()
  const [isLooking, setIsLooking] = useState(false)
  const [registration, setRegistration] = useState<RegistrationWithCompetition | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [autoSearchAttempted, setAutoSearchAttempted] = useState(false)

  const {
    register: registerLookup,
    handleSubmit: handleSubmitLookup,
    formState: { errors: lookupErrors },
    reset: resetLookup
  } = useForm<LookupFormData>({
    resolver: zodResolver(lookupSchema)
  })

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: updateErrors },
    reset: resetUpdate
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema)
  })

  // 회원이 로그인한 상태에서 자동으로 신청 내역 찾기
  useEffect(() => {
    if (user && !autoSearchAttempted) {
      searchMemberRegistration()
      setAutoSearchAttempted(true)
    }
  }, [user, autoSearchAttempted])

  const searchMemberRegistration = async () => {
    if (!user) return

    try {
      const { data: registrationData, error } = await supabase
        .from('registrations')
        .select(`
          *,
          competitions (
            title,
            entry_fee,
            date
          )
        `)
        .eq('competition_id', competition.id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error searching member registration:', error)
        }
        return
      }

      setRegistration(registrationData as RegistrationWithCompetition)

      // 수정 폼에 기존 데이터 설정
      resetUpdate({
        phone: registrationData.phone,
        email: registrationData.email,
        address: registrationData.address,
        shirt_size: registrationData.shirt_size,
        depositor_name: registrationData.depositor_name,
        notes: registrationData.notes || ''
      })
    } catch (error) {
      console.error('Error searching member registration:', error)
    }
  }

  const onLookupSubmit = async (data: LookupFormData) => {
    if (isLooking) return
    
    setIsLooking(true)

    try {
      const { data: registrationData, error } = await supabase
        .from('registrations')
        .select(`
          *,
          competitions (
            title,
            entry_fee,
            date
          )
        `)
        .eq('competition_id', competition.id)
        .eq('name', data.name)
        .eq('birth_date', data.birth_date)
        .eq('password', data.password)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          alert('입력한 정보와 일치하는 신청 내역을 찾을 수 없습니다.')
        } else {
          console.error('Error looking up registration:', error)
          alert('조회 중 오류가 발생했습니다. 다시 시도해주세요.')
        }
        return
      }

      setRegistration(registrationData as RegistrationWithCompetition)
      
      // 수정 폼에 기존 데이터 설정
      resetUpdate({
        phone: registrationData.phone,
        email: registrationData.email,
        address: registrationData.address,
        shirt_size: registrationData.shirt_size,
        depositor_name: registrationData.depositor_name,
        notes: registrationData.notes || ''
      })
      
    } catch (error) {
      console.error('Error:', error)
      alert('조회 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLooking(false)
    }
  }

  const onUpdateSubmit = async (data: UpdateFormData) => {
    if (isUpdating || !registration) return
    
    setIsUpdating(true)

    try {
      const { error } = await supabase
        .from('registrations')
        .update(data)
        .eq('id', registration.id)

      if (error) {
        console.error('Error updating registration:', error)
        alert('수정 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      // 업데이트된 데이터로 상태 갱신
      setRegistration(prev => prev ? { ...prev, ...data } : null)
      setIsEditing(false)
      alert('신청 정보가 성공적으로 수정되었습니다!')
      
    } catch (error) {
      console.error('Error:', error)
      alert('수정 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReset = () => {
    setRegistration(null)
    setIsEditing(false)
    resetLookup()
    resetUpdate()
  }

  const getPaymentStatusBadge = (status: string) => {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          입금 확인
        </span>
      )
    } else if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="h-4 w-4 mr-1" />
          취소
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <Clock className="h-4 w-4 mr-1" />
        입금 대기
      </span>
    )
  }


  if (!registration) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">신청 조회</h3>
            {user ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  {user.name}님으로 로그인 중 - 회원 신청 내역을 자동 조회했습니다
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                신청시 입력한 정보로 조회할 수 있습니다
              </p>
            )}
          </div>

          <form onSubmit={handleSubmitLookup(onLookupSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...registerLookup('name')}
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="홍길동"
                />
              </div>
              {lookupErrors.name && (
                <p className="mt-1 text-sm text-red-600">{lookupErrors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                생년월일 (6자리) *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...registerLookup('birth_date')}
                  type="text"
                  maxLength={6}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="901234"
                />
              </div>
              {lookupErrors.birth_date && (
                <p className="mt-1 text-sm text-red-600">{lookupErrors.birth_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...registerLookup('password')}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                  placeholder="신청시 설정한 비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {lookupErrors.password && (
                <p className="mt-1 text-sm text-red-600">{lookupErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLooking}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLooking ? '조회 중...' : '신청 조회'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 신청 상태 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">신청 현황</h3>
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            다시 조회하기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">참가 신청</p>
            <p className="text-lg font-semibold text-blue-600">완료</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">입금 상태</p>
            <div className="mt-1">
              {getPaymentStatusBadge(registration.payment_status)}
            </div>
          </div>
        </div>

        {registration.payment_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-2">입금 안내</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>은행: 국민은행</p>
                  <p>계좌: 123-456-789012</p>
                  <p>예금주: RUN10(런텐)</p>
                  <p>입금액: ₩{registration.competitions?.entry_fee.toLocaleString()}</p>
                  <p className="font-medium">입금자명: {registration.depositor_name}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 신청 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">신청 정보</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? '취소' : '수정'}
              </button>
              {onCancelRequest && (
                <button
                  onClick={onCancelRequest}
                  className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  취소신청
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">이름</p>
                    <p className="font-medium">{registration.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">생년월일 / 나이</p>
                    <p className="font-medium">{registration.birth_date} / {registration.age}세</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">성별</p>
                    <p className="font-medium">{registration.gender === 'male' ? '남성' : '여성'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">연락처</p>
                    <p className="font-medium">{registration.phone}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">이메일</p>
                    <p className="font-medium">{registration.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">주소</p>
                    <p className="font-medium">{registration.address}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Shirt className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">티셔츠 사이즈</p>
                    <p className="font-medium">{registration.shirt_size}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">입금자명</p>
                    <p className="font-medium">{registration.depositor_name}</p>
                  </div>
                </div>
                {registration.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">특이사항</p>
                    <p className="font-medium text-sm bg-gray-50 p-3 rounded">{registration.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitUpdate(onUpdateSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 *
                  </label>
                  <input
                    {...registerUpdate('phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {updateErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{updateErrors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 *
                  </label>
                  <input
                    {...registerUpdate('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {updateErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{updateErrors.email.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소 *
                  </label>
                  <textarea
                    {...registerUpdate('address')}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {updateErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{updateErrors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    티셔츠 사이즈 *
                  </label>
                  <select
                    {...registerUpdate('shirt_size')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                  {updateErrors.shirt_size && (
                    <p className="mt-1 text-sm text-red-600">{updateErrors.shirt_size.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입금자명 *
                  </label>
                  <input
                    {...registerUpdate('depositor_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {updateErrors.depositor_name && (
                    <p className="mt-1 text-sm text-red-600">{updateErrors.depositor_name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    특이사항 (선택)
                  </label>
                  <textarea
                    {...registerUpdate('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? '수정 중...' : '수정 완료'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}