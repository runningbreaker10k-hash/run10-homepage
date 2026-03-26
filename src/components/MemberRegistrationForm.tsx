'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, Shirt, CreditCard, FileText, User, MapPin } from 'lucide-react'

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

// 티셔츠 사이즈 라벨 매핑
const getShirtSizeLabel = (size: string) => {
  const labels: { [key: string]: string } = {
    'S': 'S(90)',
    'M': 'M(95)',
    'L': 'L(100)',
    'XL': 'XL(105)',
    'XXL': 'XXL(110)'
  }
  return labels[size] || size
}

const memberRegistrationSchema = z.object({
  participation_group_id: z.string().min(1, '참가 그룹을 선택해주세요'),
  depositor_name: z.string().min(2, '입금자명을 입력해주세요'),
  shirt_size: z.enum(['S', 'M', 'L', 'XL', 'XXL'], { message: '티셔츠 사이즈를 선택해주세요' }),
  notes: z.string().optional()
})

type MemberRegistrationFormData = z.infer<typeof memberRegistrationSchema>

interface Competition {
  id: string
  title: string
  date: string
  location: string
  entry_fee: number
  categories?: string[]
  registration_categories?: string[]
  distances?: string[]
  max_participants: number
  current_participants: number
  bank_name?: string
  bank_account?: string
  account_holder?: string
}

interface MemberRegistrationFormProps {
  competition: Competition
  participationGroups: any[]
  user: any
  onSuccess: () => void
}

export default function MemberRegistrationForm({
  competition,
  participationGroups,
  user,
  onSuccess
}: MemberRegistrationFormProps) {
  const { getGradeInfo } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<MemberRegistrationFormData>({
    resolver: zodResolver(memberRegistrationSchema)
  })

  // 사용자 상세 정보 로드
  useEffect(() => {
    if (user) {
      loadUserDetails()
    }
  }, [user])

  // 사용자 정보 로드 후 입금자명 자동 설정
  useEffect(() => {
    if (userDetails?.name) {
      setValue('depositor_name', userDetails.name)
    }
  }, [userDetails, setValue])

  const loadUserDetails = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserDetails(data)
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error)
    }
  }

  // 나이 계산 (YYMMDD 형식)
  const calculateAge = (birthDate: string) => {
    if (!birthDate || birthDate.length !== 6) return 0

    const year = parseInt(birthDate.substring(0, 2))   // YY
    const month = parseInt(birthDate.substring(2, 4))  // MM
    const day = parseInt(birthDate.substring(4, 6))    // DD

    // 2000년대/1900년대 구분 (현재 연도 기준)
    const currentYear = new Date().getFullYear()
    const century = year <= (currentYear % 100) ? 2000 : 1900
    const fullYear = century + year

    const today = new Date()
    let age = today.getFullYear() - fullYear

    if (today.getMonth() + 1 < month ||
        (today.getMonth() + 1 === month && today.getDate() < day)) {
      age--
    }

    return age
  }

  const onSubmit = async (data: MemberRegistrationFormData) => {

    if (!user || !userDetails) {
      alert('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // 확인 단계로 이동
    setFormData(data)
    setShowConfirmation(true)
  }

  const handleFinalSubmit = async () => {
    if (!formData || !user || !userDetails) return

    setIsSubmitting(true)

    try {
      // 중복 신청 확인
      const { data: existingRegistration, error: checkError } = await supabase
        .from('registrations')
        .select('id')
        .eq('competition_id', competition.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (checkError) {
        console.error('중복 신청 확인 오류:', checkError)
        alert('신청 확인 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      if (existingRegistration) {
        alert('이미 이 대회에 신청하셨습니다.')
        return
      }

      // 선택된 그룹 정보 가져오기
      const selectedGroup = participationGroups.find(group => group.id === formData.participation_group_id)
      if (!selectedGroup) {
        alert('선택된 참가 그룹을 찾을 수 없습니다.')
        return
      }

      // 참가자 수 확인 (그룹별)
      if (selectedGroup.current_participants >= selectedGroup.max_participants) {
        alert('선택한 그룹의 신청 가능한 인원이 초과되었습니다.')
        return
      }

      const age = calculateAge(userDetails.birth_date)

      // 회원 정보로 신청 등록 (누락된 필드들 추가)
      const { error: insertError } = await supabase
        .from('registrations')
        .insert([{
          competition_id: competition.id,
          user_id: user.id,  // 누락된 필드 추가
          participation_group_id: formData.participation_group_id,  // 누락된 필드 추가
          name: userDetails.name,
          email: userDetails.email,
          phone: userDetails.phone,
          birth_date: userDetails.birth_date,
          gender: userDetails.gender,
          address: `${userDetails.address1} ${userDetails.address2}`,
          shirt_size: formData.shirt_size,
          depositor_name: formData.depositor_name,
          password: 'member_' + user.user_id,
          age: age,
          distance: selectedGroup.distance,  // 누락된 필드 추가
          entry_fee: selectedGroup.entry_fee,  // 누락된 필드 추가
          is_member_registration: true  // 회원 신청임을 표시
        }])

      if (insertError) {
        console.error('Supabase 삽입 오류:', insertError)
        alert(`신청 중 오류가 발생했습니다: ${insertError.message}`)
        return
      }

      // 대회 전체 참가자 수 업데이트
      const { error: updateCompError } = await supabase
        .from('competitions')
        .update({
          current_participants: competition.current_participants + 1
        })
        .eq('id', competition.id)

      if (updateCompError) throw updateCompError

      // 선택한 그룹의 참가자 수 업데이트
      const { error: updateGroupError } = await supabase
        .from('participation_groups')
        .update({
          current_participants: selectedGroup.current_participants + 1
        })
        .eq('id', selectedGroup.id)

      if (updateGroupError) throw updateGroupError

      // 대회 신청 완료 알림톡 발송
      try {
        const bankAccount = `${competition.bank_name || '하나은행'} ${competition.bank_account || '734-910008-72504'}`
        const alimtalkResponse = await fetch('/api/alimtalk/competition-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: userDetails.phone,
            name: userDetails.name,
            competitionName: competition.title,
            distance: selectedGroup.distance,
            fee: selectedGroup.entry_fee.toLocaleString(),
            bankAccount: bankAccount,
            accountHolder: competition.account_holder || '(주)러닝브레이커',
            depositorName: formData.depositor_name,
          }),
        });

        if (!alimtalkResponse.ok) {
          const errorData = await alimtalkResponse.json();
          console.error('대회 신청 알림톡 발송 실패:', errorData);
        } else {
          const successData = await alimtalkResponse.json();
          console.log('대회 신청 알림톡 발송 성공:', successData);
        }
      } catch (alimtalkError) {
        console.error('대회 신청 알림톡 발송 중 오류:', alimtalkError);
      }

      reset()
      onSuccess()
    } catch (error) {
      console.error('신청 오류:', error)
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">로그인이 필요한 서비스입니다.</p>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-gray-600 mt-4">사용자 정보를 불러오는 중...</p>
      </div>
    )
  }

  const gradeInfo = getGradeInfo(user.grade, user.role)

  // 확인 단계 UI
  if (showConfirmation && formData) {
    const selectedGroup = participationGroups.find(group => group.id === formData.participation_group_id)

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            신청 내용 확인
          </h3>

          {/* 신청자 정보 */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base sm:text-lg font-medium text-blue-900">신청자 정보</h4>
            </div>
            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 text-sm">
              <div className="break-words">
                <span className="text-blue-700 font-medium">성명:</span> {userDetails.name}
              </div>
              <div className="flex items-center space-x-2">
                <span><span className="text-blue-700 font-medium">등급:</span> {gradeInfo.display}</span>
                <img
                  src={gradeInfo.icon}
                  alt={gradeInfo.display}
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                />
              </div>
              <div className="break-all">
                <span className="text-blue-700 font-medium">연락처:</span> {userDetails.phone}
              </div>
              <div className="break-all">
                <span className="text-blue-700 font-medium">이메일:</span> {userDetails.email}
              </div>
              <div className="sm:col-span-2 break-words">
                <span className="text-blue-700 font-medium">주소:</span> {userDetails.address1} {userDetails.address2}
              </div>
            </div>
          </div>

          {/* 참가 정보 */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3">참가 정보</h4>
            <div className="space-y-3 text-sm">
              <div className="break-words">
                <span className="text-gray-700 font-medium">참가 종목 및 거리:</span> {getDistanceLabel(selectedGroup?.distance || '')}
              </div>
              <div>
                <span className="text-gray-700 font-medium">참가비:</span> ₩{selectedGroup?.entry_fee.toLocaleString()}
              </div>
              <div>
                <span className="text-gray-700 font-medium">티셔츠 사이즈:</span> {getShirtSizeLabel(formData.shirt_size)}
              </div>
              <div className="break-words">
                <span className="text-gray-700 font-medium">입금자명:</span> {formData.depositor_name}
              </div>
              <div className="break-all">
                <span className="text-gray-700 font-medium">계좌번호:</span> {competition.bank_name || '하나은행'} {competition.bank_account || '734-910008-72504'}
              </div>
              <div className="break-words">
                <span className="text-gray-700 font-medium">예금주:</span> {competition.account_holder || '(주)러닝브레이커'}
              </div>
              {formData.notes && (
                <div className="break-words">
                  <span className="text-gray-700 font-medium">기타사항:</span> {formData.notes}
                </div>
              )}
            </div>
          </div>

          {/* 확인 버튼들 */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors text-center touch-manipulation"
            >
              수정하기
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors font-semibold touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span>신청 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span>최종 신청</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 회원 정보 확인 */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-medium text-blue-900">신청자 정보</h3>
        </div>
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 text-sm">
          <div className="break-words">
            <span className="text-blue-700 font-medium">성명:</span> {userDetails.name}
          </div>
          <div className="flex items-center space-x-2">
            <span><span className="text-blue-700 font-medium">등급:</span> {gradeInfo.display}</span>
            <img
              src={gradeInfo.icon}
              alt={gradeInfo.display}
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            />
          </div>
          <div className="break-all">
            <span className="text-blue-700 font-medium">연락처:</span> {userDetails.phone}
          </div>
          <div className="break-all">
            <span className="text-blue-700 font-medium">이메일:</span> {userDetails.email}
          </div>
          <div className="sm:col-span-2 break-words">
            <span className="text-blue-700 font-medium">주소:</span> {userDetails.address1} {userDetails.address2}
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-5">
          ※ 회원 정보가 자동으로 입력됩니다. 정보가 잘못된 경우 마이페이지에서 수정해주세요.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          ※ 신청순서: 참가 신청 후 입금 / 입금 시 아래 입금자명과 동일하게 해주세요. 
        </p>
      </div>

      {/* 참가 신청 폼 */}
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
      })} className="space-y-4 sm:space-y-6">
        {/* 참가 그룹 선택 */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>참가 종목 <span className="text-red-500 ml-1">*</span></span>
          </label>
          <select
            {...register('participation_group_id')}
            onChange={(e) => {
              const group = participationGroups.find(g => g.id === e.target.value)
              setSelectedGroup(group)
              setValue('participation_group_id', e.target.value)
            }}
            className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">참가 종목을 선택하세요</option>
            {participationGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {getDistanceLabel(group.distance)}
              </option>
            ))}
          </select>
          {errors.participation_group_id && (
            <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.participation_group_id.message}</p>
          )}
        </div>

        {/* 티셔츠 사이즈 */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Shirt className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>티셔츠 사이즈 <span className="text-red-500 ml-1">*</span></span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <label key={size} className="relative">
                <input
                  {...register('shirt_size')}
                  type="radio"
                  value={size}
                  className="sr-only peer"
                />
                <div className="w-full py-2 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm font-medium border rounded-md cursor-pointer peer-checked:bg-blue-500 peer-checked:text-white peer-checked:border-blue-500 transition-colors">
                  {getShirtSizeLabel(size)}
                </div>
              </label>
            ))}
          </div>
          {errors.shirt_size && (
            <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.shirt_size.message}</p>
          )}
        </div>

        {/* 입금자명 */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>입금자명 <span className="text-red-500 ml-1">*</span></span>
          </label>
          <input
            {...register('depositor_name')}
            type="text"
            className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={userDetails?.name ? `기본값: ${userDetails.name}` : "입금하실 분의 성명을 입력하세요"}
          />
          {errors.depositor_name && (
            <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.depositor_name.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            ※ 입금자명을 반드시 확인해 주세요.
          </p>
        </div>

        {/* 기타 사항 - 숨김 처리 */}
        <div className="hidden">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>기타 사항 (선택)</span>
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="특이사항이나 요청사항이 있으시면 입력해주세요"
          />
        </div>

        {/* 참가비 정보 */}
        <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">💰 참가비 안내</h4>
          <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
            {selectedGroup ? (
              <>
                <p className="break-words"><strong>선택된 종목:</strong> {getDistanceLabel(selectedGroup.distance)}</p>
                <p><strong>참가비:</strong> ₩{selectedGroup.entry_fee.toLocaleString()}</p>
              </>
            ) : (
              <p><strong>참가비:</strong> 종목 선택 후 확인 가능</p>
            )}
            <p className="break-all"><strong>계좌번호:</strong> {competition.bank_name || '하나은행'} {competition.bank_account || '734-910008-72504'}</p>
            <p className="break-words"><strong>예금주:</strong> {competition.account_holder || '(주)러닝브레이커'}</p>
            <p className="text-xs mt-2">
              ※ 입금 확인 후 참가 확정됩니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors text-base sm:text-lg font-semibold touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                <span>신청 중...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                <span>참가 신청</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 안내사항 */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">📋 신청 안내사항</h4>
        <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
          <li>• 회원 신청은 마이페이지에서 조회 및 관리할 수 있습니다</li>
          <li>• 신청 조회 시 [입금확인]이 되면 별도 안내가 없더라도 참가 확정이 된 상태입니다. </li>
          <li>• 개인정보는 대회 운영 목적으로만 사용됩니다</li>
        </ul>
      </div>
    </div>
  )
}