'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Registration, Competition, RegistrationWithCompetition } from '@/types'
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

// 참가 관련 정보만 수정 가능 (회원정보는 마이페이지에서 수정)
const updateSchema = z.object({
  shirt_size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
  depositor_name: z.string().min(2, '입금자명을 입력해주세요'),
  notes: z.string().optional()
})

type LookupFormData = z.infer<typeof lookupSchema>
type UpdateFormData = z.infer<typeof updateSchema>

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
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

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

      // 수정 폼에 기존 데이터 설정 (참가 관련 정보만)
      resetUpdate({
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

      // 수정 폼에 기존 데이터 설정 (참가 관련 정보만)
      resetUpdate({
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
      const updateData = {
        shirt_size: data.shirt_size,
        depositor_name: data.depositor_name,
        notes: data.notes
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

      // 업데이트된 데이터로 상태 갱신
      setRegistration(prev => prev ? {
        ...prev,
        ...updateData
      } : null)
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

  // 신청 취소 처리
  const handleCancelRegistration = async () => {
    if (!registration || isCancelling) return

    // 입금 대기 상태가 아니면 취소 불가
    if (registration.payment_status !== 'pending') {
      alert('입금 대기 상태인 신청만 취소할 수 있습니다.')
      return
    }

    setIsCancelling(true)

    try {
      // 1. 신청 정보 삭제
      const { error: deleteError } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registration.id)

      if (deleteError) {
        console.error('신청 삭제 오류:', deleteError)
        alert('신청 취소 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      // 2. 대회 참가자 수 감소
      const { error: updateCompError } = await supabase
        .from('competitions')
        .update({
          current_participants: competition.current_participants - 1
        })
        .eq('id', competition.id)

      if (updateCompError) {
        console.error('대회 참가자 수 업데이트 오류:', updateCompError)
      }

      // 3. 참가 그룹 참가자 수 감소 (participation_group_id가 있는 경우만)
      if (registration.participation_group_id) {
        // 현재 참가 그룹 정보 조회
        const { data: groupData, error: groupFetchError } = await supabase
          .from('participation_groups')
          .select('current_participants')
          .eq('id', registration.participation_group_id)
          .single()

        if (!groupFetchError && groupData) {
          const { error: updateGroupError } = await supabase
            .from('participation_groups')
            .update({
              current_participants: Math.max(0, groupData.current_participants - 1)
            })
            .eq('id', registration.participation_group_id)

          if (updateGroupError) {
            console.error('참가 그룹 참가자 수 업데이트 오류:', updateGroupError)
          }
        }
      }

      // 4. 성공 처리
      alert('신청이 성공적으로 취소되었습니다.')
      setShowCancelModal(false)
      handleReset()

      // 5. 페이지 새로고침 (참가자 수 업데이트 반영)
      window.location.reload()

    } catch (error) {
      console.error('신청 취소 오류:', error)
      alert('신청 취소 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsCancelling(false)
    }
  }

  // 대회 신청 마감 여부 확인
  const isRegistrationOpen = () => {
    const now = new Date()
    const registrationStart = new Date(competition.registration_start)
    const registrationEnd = new Date(competition.registration_end)

    return now >= registrationStart &&
           now <= registrationEnd &&
           competition.current_participants < competition.max_participants &&
           competition.status === 'published'
  }

  // 수정 버튼 클릭 핸들러
  const handleEditClick = () => {
    // 이미 수정 모드인 경우 (취소 버튼) - 바로 수정 모드 종료
    if (isEditing) {
      setIsEditing(false)
      return
    }

    // 수정 모드 진입 시 - 대회 마감 여부 확인
    if (!isRegistrationOpen()) {
      alert('신청이 마감된 대회의 정보 수정은 불가능 합니다')
      return
    }

    setIsEditing(true)
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
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
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

            {/* 취소 버튼 */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-3 px-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm sm:text-base touch-manipulation flex items-center justify-center"
              >
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                신청 취소하기
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                ⚠️ 입금 전에만 취소할 수 있습니다
              </p>
            </div>
          </>
        )}

        {registration.payment_status === 'confirmed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-1">입금 확인 완료</h4>
                <p className="text-xs sm:text-sm text-blue-700">
                  입금이 확인되어 참가가 확정되었습니다.<br/>
                  취소가 필요한 경우 대회 요청게시판을 통해 문의해주세요.
                </p>
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
                onClick={handleEditClick}
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
              {/* 회원정보 안내 */}
              {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-800">
                    💡 <strong>회원정보(이름, 연락처, 이메일, 주소 등)</strong>는 마이페이지에서 수정하실 수 있습니다.
                    여기서는 <strong>참가 관련 정보만 수정</strong>할 수 있습니다.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* 참가 종목 (수정 불가) */}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    참가 종목 (수정 불가)
                  </label>
                  <div className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm sm:text-base">
                    {registration.participation_groups?.name || registration.distance || '미설정'}
                    {registration.participation_groups?.distance && (
                      <span className="text-gray-500 ml-2">({registration.participation_groups.distance})</span>
                    )}
                    {(registration.participation_groups?.entry_fee || registration.entry_fee) && (
                      <span className="text-gray-600 ml-2">- ₩{(registration.participation_groups?.entry_fee || registration.entry_fee || 0).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">참가 종목 변경을 원하시면 문의(게시판, 유선) 해 주세요</p>
                </div>

                {/* 티셔츠 사이즈 */}
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

                {/* 입금자명 */}
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

                {/* 기타사항 */}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    기타사항 (선택)
                  </label>
                  <textarea
                    {...registerUpdate('notes')}
                    rows={3}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="특이사항이나 요청사항이 있으시면 입력해주세요"
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

      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">신청을 취소하시겠습니까?</h3>
              <p className="text-sm text-gray-600 mb-4">
                취소된 신청은 복구할 수 없습니다.<br/>
                다시 참가하시려면 새로 신청하셔야 합니다.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>주의사항</strong><br/>
                  • 입금 후에는 직접 취소할 수 없습니다<br/>
                  • 취소 시 자리가 다른 참가자에게 제공됩니다
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancelRegistration}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {isCancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    취소 처리 중...
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 mr-2" />
                    신청 취소
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}