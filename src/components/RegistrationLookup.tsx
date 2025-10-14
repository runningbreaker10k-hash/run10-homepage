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
  participation_group_id: z.string().min(1, '참가 종목을 선택해주세요'),
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
  participation_groups?: {
    name: string
    distance: string
    entry_fee: number
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
  const [participationGroups, setParticipationGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

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
    // 참가 그룹 목록 로드
    loadParticipationGroups()
  }, [user, autoSearchAttempted])

  const loadParticipationGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('participation_groups')
        .select('*')
        .eq('competition_id', competition.id)
        .order('distance')

      if (error) {
        console.error('Error loading participation groups:', error)
        return
      }

      setParticipationGroups(data || [])
    } catch (error) {
      console.error('Error loading participation groups:', error)
    }
  }

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
          ),
          participation_groups (
            name,
            distance,
            entry_fee
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
        participation_group_id: registrationData.participation_group_id || '',
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
          ),
          participation_groups (
            name,
            distance,
            entry_fee
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
        participation_group_id: registrationData.participation_group_id || '',
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
      // 선택된 참가 그룹 정보 가져오기
      const selectedGroup = participationGroups.find(group => group.id === data.participation_group_id)

      if (!selectedGroup) {
        alert('선택된 참가 종목을 찾을 수 없습니다.')
        return
      }

      // 참가종목 변경 시 검증
      const isGroupChanged = registration.participation_group_id !== data.participation_group_id

      if (isGroupChanged) {
        // 1. 참가비 차이 확인 및 안내
        const currentFee = registration.participation_groups?.entry_fee || registration.entry_fee || 0
        const newFee = selectedGroup.entry_fee
        const feeDifference = newFee - currentFee

        if (feeDifference !== 0) {
          const feeMessage = feeDifference > 0
            ? `참가비가 ₩${Math.abs(feeDifference).toLocaleString()} 증가합니다. 추가 입금이 필요합니다.`
            : `참가비가 ₩${Math.abs(feeDifference).toLocaleString()} 감소합니다. 환불 처리는 대회 문의처로 연락해주세요.`

          const confirmChange = confirm(
            `참가 종목을 "${selectedGroup.name} (${selectedGroup.distance})"로 변경하시겠습니까?\n\n${feeMessage}\n\n계속하시겠습니까?`
          )

          if (!confirmChange) {
            return
          }
        }

        // 2. 참가 그룹 정원 확인
        const { data: groupRegistrations, error: countError } = await supabase
          .from('registrations')
          .select('id')
          .eq('participation_group_id', selectedGroup.id)
          .eq('competition_id', competition.id)

        if (countError) {
          console.error('Error checking group capacity:', countError)
          alert('참가 종목 정원 확인 중 오류가 발생했습니다.')
          return
        }

        const currentGroupCount = groupRegistrations?.length || 0
        if (currentGroupCount >= selectedGroup.max_participants) {
          alert(`선택한 참가 종목의 정원이 마감되었습니다. (${currentGroupCount}/${selectedGroup.max_participants})`)
          return
        }

        // 3. 결제 상태에 따른 안내
        if (registration.payment_status === 'confirmed' && feeDifference !== 0) {
          alert(
            '이미 입금이 확인된 상태입니다.\n' +
            '참가비 변경에 따른 추가 입금 또는 환불은 대회 주최측에 별도 문의해주세요.\n\n' +
            '대회 문의: 대회 게시판 또는 주최측 연락처'
          )
        }
      }

      const updateData = {
        ...data,
        // 참가 그룹이 변경되면 distance와 entry_fee도 업데이트
        ...(selectedGroup && {
          distance: selectedGroup.distance,
          entry_fee: selectedGroup.entry_fee
        })
      }

      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', registration.id)

      if (error) {
        console.error('Error updating registration:', error)
        alert('수정 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      // 업데이트된 데이터로 상태 갱신 (participation_groups 정보도 업데이트)
      setRegistration(prev => prev ? {
        ...prev,
        ...updateData,
        participation_groups: selectedGroup
      } : null)
      setIsEditing(false)

      let successMessage = '신청 정보가 성공적으로 수정되었습니다!'
      if (isGroupChanged) {
        successMessage += '\n\n참가 종목이 변경되었습니다. 참가비 차이가 있는 경우 입금 안내를 확인해주세요.'
      }
      alert(successMessage)

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
        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
          입금 확인
        </span>
      )
    } else if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
          취소
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
        입금 대기
      </span>
    )
  }


  if (!registration) {
    return (
      <div className="max-w-md mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="text-center mb-4 sm:mb-6">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">신청 조회</h3>
            {user ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 sm:mb-4">
                <p className="text-blue-800 text-xs sm:text-sm break-words">
                  <CheckCircle className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  {user.name}님으로 로그인 중 - 회원 신청 내역을 자동 조회했습니다
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-xs sm:text-sm break-words">
                신청시 입력한 정보로 조회할 수 있습니다
              </p>
            )}
          </div>

          <form onSubmit={handleSubmitLookup(onLookupSubmit)} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <input
                  {...registerLookup('name')}
                  type="text"
                  className="w-full pl-10 sm:pl-11 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white text-sm sm:text-base"
                  placeholder="홍길동"
                />
              </div>
              {lookupErrors.name && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{lookupErrors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                생년월일 (6자리) *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <input
                  {...registerLookup('birth_date')}
                  type="text"
                  maxLength={6}
                  className="w-full pl-10 sm:pl-11 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white text-sm sm:text-base"
                  placeholder="901234"
                />
              </div>
              {lookupErrors.birth_date && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{lookupErrors.birth_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                비밀번호 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <input
                  {...registerLookup('password')}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white text-sm sm:text-base"
                  placeholder="신청시 설정한 비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
                </button>
              </div>
              {lookupErrors.password && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{lookupErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLooking}
              className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base touch-manipulation"
            >
              {isLooking ? '조회 중...' : '신청 조회'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 space-y-4 sm:space-y-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
      {/* 신청 상태 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">신청 현황</h3>
          <button
            onClick={handleReset}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 self-start sm:self-auto touch-manipulation"
          >
            다시 조회하기
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">참가 신청</p>
            <p className="text-base sm:text-lg font-semibold text-blue-600">완료</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">입금 상태</p>
            <div className="mt-1">
              {getPaymentStatusBadge(registration.payment_status)}
            </div>
          </div>
        </div>

        {registration.payment_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">입금 안내</h4>
                <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
                  <p className="break-words">은행: 하나은행</p>
                  <p className="break-all">계좌: 734-910008-72504</p>
                  <p className="break-words">예금주: (주)러닝브레이커</p>
                  <p className="break-words">입금액: ₩{(registration.participation_groups?.entry_fee || registration.entry_fee || registration.competitions?.entry_fee || 0).toLocaleString()}</p>
                  <p className="font-medium break-words">입금자명: {registration.depositor_name}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 신청 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">신청 정보</h3>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-3 py-2 sm:py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 touch-manipulation"
              >
                <Edit className="h-4 w-4 sm:h-5 sm:w-5 mr-1 flex-shrink-0" />
                {isEditing ? '취소' : '수정'}
              </button>
              {onCancelRequest && (
                <button
                  onClick={onCancelRequest}
                  className="flex items-center px-3 py-2 sm:py-1 text-xs sm:text-sm text-red-600 hover:text-red-800 touch-manipulation"
                >
                  {/* 취소신청 */}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">이름</p>
                    <p className="font-medium text-sm sm:text-base break-words">{registration.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">생년월일 / 나이</p>
                    <p className="font-medium text-sm sm:text-base break-words">{registration.birth_date} / {registration.age}세</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">성별</p>
                    <p className="font-medium text-sm sm:text-base break-words">{registration.gender === 'male' ? '남성' : '여성'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">연락처</p>
                    <p className="font-medium text-sm sm:text-base break-all">{registration.phone}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">이메일</p>
                    <p className="font-medium text-sm sm:text-base break-all">{registration.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">주소</p>
                    <p className="font-medium text-sm sm:text-base break-words">{registration.address}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">참가 종목</p>
                    <p className="font-medium text-sm sm:text-base break-words">
                      {registration.participation_groups?.name || registration.distance || '미설정'}
                      {registration.participation_groups?.distance && (
                        <span className="text-gray-500 ml-2">({registration.participation_groups.distance})</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">참가비</p>
                    <p className="font-medium text-sm sm:text-base break-words">
                      ₩{(registration.participation_groups?.entry_fee || registration.entry_fee || registration.competitions?.entry_fee || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Shirt className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">티셔츠 사이즈</p>
                    <p className="font-medium text-sm sm:text-base break-words">{registration.shirt_size}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">입금자명</p>
                    <p className="font-medium text-sm sm:text-base break-words">{registration.depositor_name}</p>
                  </div>
                </div>
                {registration.notes && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">특이사항</p>
                    <p className="font-medium text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded break-words">{registration.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitUpdate(onUpdateSubmit)} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    참가 종목 *
                  </label>
                  <select
                    {...registerUpdate('participation_group_id')}
                    onChange={(e) => {
                      const group = participationGroups.find(g => g.id === e.target.value)
                      setSelectedGroup(group)
                    }}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">참가 종목을 선택하세요</option>
                    {participationGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.distance}) - ₩{group.entry_fee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {updateErrors.participation_group_id && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{updateErrors.participation_group_id.message}</p>
                  )}
                  {selectedGroup && (
                    <div className="mt-2 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800 break-words">
                        <strong>선택된 종목:</strong> {selectedGroup.name} ({selectedGroup.distance})
                      </p>
                      <p className="text-xs sm:text-sm text-blue-800 break-words">
                        <strong>참가비:</strong> ₩{selectedGroup.entry_fee.toLocaleString()}
                      </p>
                      {registration.participation_groups?.entry_fee !== selectedGroup.entry_fee && (
                        <p className="text-xs sm:text-sm text-amber-700 mt-1 break-words">
                          ⚠️ 참가비가 변경됩니다. 차액에 대한 추가 입금 또는 환불 문의는 대회 주최측에 연락하세요.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    연락처 *
                  </label>
                  <input
                    {...registerUpdate('phone')}
                    type="tel"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                  {updateErrors.phone && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{updateErrors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    이메일 *
                  </label>
                  <input
                    {...registerUpdate('email')}
                    type="email"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                  {updateErrors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{updateErrors.email.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    주소 *
                  </label>
                  <textarea
                    {...registerUpdate('address')}
                    rows={2}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                  {updateErrors.address && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{updateErrors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    티셔츠 사이즈 *
                  </label>
                  <select
                    {...registerUpdate('shirt_size')}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                  {updateErrors.shirt_size && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{updateErrors.shirt_size.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    입금자명 *
                  </label>
                  <input
                    {...registerUpdate('depositor_name')}
                    type="text"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                  {updateErrors.depositor_name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600 break-words">{updateErrors.depositor_name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    특이사항 (선택)
                  </label>
                  <textarea
                    {...registerUpdate('notes')}
                    rows={3}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm sm:text-base touch-manipulation"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
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