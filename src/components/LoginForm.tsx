'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, EyeOff, UserPlus, Search, Key } from 'lucide-react'

const loginSchema = z.object({
  user_id: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요')
})

const findIdSchema = z.object({
  name: z.string().min(2, '성명을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '연락처는 010-0000-0000 형식으로 입력해주세요')
})

const findPasswordSchema = z.object({
  user_id: z.string().min(1, '아이디를 입력해주세요'),
  name: z.string().min(2, '성명을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요')
})

const changePasswordSchema = z.object({
  new_password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 포함해야 합니다'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirm_password']
})

type LoginFormData = z.infer<typeof loginSchema>
type FindIdFormData = z.infer<typeof findIdSchema>
type FindPasswordFormData = z.infer<typeof findPasswordSchema>
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface LoginFormProps {
  onSuccess: (user: any) => void
  onShowSignup: () => void
}

export default function LoginForm({ onSuccess, onShowSignup }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [currentView, setCurrentView] = useState<'login' | 'find-id' | 'find-password' | 'change-password'>('login')
  const [findResult, setFindResult] = useState('')
  const [verifiedUserId, setVerifiedUserId] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const {
    register: registerFindId,
    handleSubmit: handleSubmitFindId,
    formState: { errors: errorsFindId },
    setValue: setValueFindId
  } = useForm<FindIdFormData>({
    resolver: zodResolver(findIdSchema)
  })

  const {
    register: registerFindPassword,
    handleSubmit: handleSubmitFindPassword,
    formState: { errors: errorsFindPassword }
  } = useForm<FindPasswordFormData>({
    resolver: zodResolver(findPasswordSchema)
  })

  const {
    register: registerChangePassword,
    handleSubmit: handleSubmitChangePassword,
    formState: { errors: errorsChangePassword }
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError('')

    try {
      // 사용자 조회 (평문 비밀번호 비교)
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          user_id,
          name,
          email,
          phone,
          grade,
          role,
          created_at
        `)
        .eq('user_id', data.user_id)
        .eq('password', data.password)
        .single()

      if (error || !user) {
        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다')
        return
      }

      // 로그인 성공 - 세션 저장
      sessionStorage.setItem('user', JSON.stringify(user))
      
      onSuccess(user)
    } catch (error) {
      console.error('로그인 오류:', error)
      setLoginError('로그인 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 전화번호 자동 하이픈 추가
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }

  // 아이디 찾기
  const onSubmitFindId = async (data: FindIdFormData) => {
    setIsLoading(true)
    setFindResult('')

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('name', data.name)
        .eq('email', data.email)
        .eq('phone', data.phone)
        .single()

      if (error || !user) {
        setFindResult('입력하신 정보와 일치하는 회원을 찾을 수 없습니다.')
        return
      }

      setFindResult(`찾으신 아이디는 "${user.user_id}" 입니다.`)
    } catch (error) {
      console.error('아이디 찾기 오류:', error)
      setFindResult('아이디 찾기 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 찾기 (회원 정보 확인)
  const onSubmitFindPassword = async (data: FindPasswordFormData) => {
    setIsLoading(true)
    setFindResult('')

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('name', data.name)
        .eq('email', data.email)
        .single()

      if (error || !user) {
        setFindResult('입력하신 정보와 일치하는 회원을 찾을 수 없습니다.')
        return
      }

      // 회원 정보가 확인되면 비밀번호 변경 화면으로 이동
      setVerifiedUserId(data.user_id)
      setCurrentView('change-password')
      setFindResult('')
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error)
      setFindResult('비밀번호 찾기 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 변경
  const onSubmitChangePassword = async (data: ChangePasswordFormData) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({ password: data.new_password })
        .eq('user_id', verifiedUserId)

      if (error) throw error

      alert('비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.')
      changeView('login')
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      alert('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 뷰 변경 시 초기화
  const changeView = (view: 'login' | 'find-id' | 'find-password' | 'change-password') => {
    setCurrentView(view)
    setFindResult('')
    setLoginError('')
    if (view === 'login') {
      setVerifiedUserId('')
    }
    reset()
  }

  if (currentView === 'find-id') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">아이디 찾기</h2>
          <p className="text-gray-600">가입 시 입력한 정보를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmitFindId(onSubmitFindId)} className="space-y-4">
          {/* 성명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">성명</label>
            <input
              {...registerFindId('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="실명을 입력하세요"
            />
            {errorsFindId.name && <p className="text-red-500 text-sm mt-1">{errorsFindId.name.message}</p>}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              {...registerFindId('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="가입 시 입력한 이메일"
            />
            {errorsFindId.email && <p className="text-red-500 text-sm mt-1">{errorsFindId.email.message}</p>}
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
            <input
              {...registerFindId('phone')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-0000-0000"
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setValueFindId('phone', formatted)
              }}
            />
            {errorsFindId.phone && <p className="text-red-500 text-sm mt-1">{errorsFindId.phone.message}</p>}
          </div>

          {/* 결과 메시지 */}
          {findResult && (
            <div className={`p-3 border rounded-md ${findResult.includes('찾을 수 없습니다') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-sm ${findResult.includes('찾을 수 없습니다') ? 'text-red-600' : 'text-green-600'}`}>{findResult}</p>
            </div>
          )}

          {/* 찾기 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                찾는 중...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                아이디 찾기
              </>
            )}
          </button>
        </form>

        {/* 뒤로가기 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => changeView('login')}
            className="text-gray-600 text-sm hover:text-gray-800"
          >
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (currentView === 'find-password') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">비밀번호 찾기</h2>
          <p className="text-gray-600">가입 시 입력한 정보를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmitFindPassword(onSubmitFindPassword)} className="space-y-4">
          {/* 아이디 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
            <input
              {...registerFindPassword('user_id')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="아이디를 입력하세요"
            />
            {errorsFindPassword.user_id && <p className="text-red-500 text-sm mt-1">{errorsFindPassword.user_id.message}</p>}
          </div>

          {/* 성명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">성명</label>
            <input
              {...registerFindPassword('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="실명을 입력하세요"
            />
            {errorsFindPassword.name && <p className="text-red-500 text-sm mt-1">{errorsFindPassword.name.message}</p>}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              {...registerFindPassword('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="가입 시 입력한 이메일"
            />
            {errorsFindPassword.email && <p className="text-red-500 text-sm mt-1">{errorsFindPassword.email.message}</p>}
          </div>

          {/* 결과 메시지 */}
          {findResult && (
            <div className={`p-3 border rounded-md ${findResult.includes('찾을 수 없습니다') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-sm ${findResult.includes('찾을 수 없습니다') ? 'text-red-600' : 'text-green-600'}`}>{findResult}</p>
            </div>
          )}

          {/* 찾기 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                찾는 중...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                비밀번호 찾기
              </>
            )}
          </button>
        </form>

        {/* 뒤로가기 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => changeView('login')}
            className="text-gray-600 text-sm hover:text-gray-800"
          >
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (currentView === 'change-password') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">새 비밀번호 설정</h2>
          <p className="text-gray-600">{verifiedUserId}님의 새 비밀번호를 설정해주세요</p>
        </div>

        <form onSubmit={handleSubmitChangePassword(onSubmitChangePassword)} className="space-y-4">
          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
            <div className="relative">
              <input
                {...registerChangePassword('new_password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="영문, 숫자 포함 8자 이상"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorsChangePassword.new_password && <p className="text-red-500 text-sm mt-1">{errorsChangePassword.new_password.message}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
            <input
              {...registerChangePassword('confirm_password')}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="새 비밀번호를 다시 입력하세요"
            />
            {errorsChangePassword.confirm_password && <p className="text-red-500 text-sm mt-1">{errorsChangePassword.confirm_password.message}</p>}
          </div>

          {/* 변경 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                변경 중...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                비밀번호 변경
              </>
            )}
          </button>
        </form>

        {/* 뒤로가기 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => changeView('login')}
            className="text-gray-600 text-sm hover:text-gray-800"
          >
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">로그인</h2>
        <p className="text-gray-600">런텐에 오신 것을 환영합니다!</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            아이디
          </label>
          <input
            {...register('user_id')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="아이디를 입력하세요"
          />
          {errors.user_id && <p className="text-red-500 text-sm mt-1">{errors.user_id.message}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비밀번호
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {/* 로그인 오류 메시지 */}
        {loginError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{loginError}</p>
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </button>
      </form>

      {/* 아이디/비밀번호 찾기 */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => changeView('find-id')}
          className="flex-1 py-2 px-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Search className="w-4 h-4 inline mr-1" />
          아이디 찾기
        </button>
        <button
          onClick={() => changeView('find-password')}
          className="flex-1 py-2 px-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Key className="w-4 h-4 inline mr-1" />
          비밀번호 찾기
        </button>
      </div>

      {/* 회원가입 링크 */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm mb-3">아직 회원이 아니신가요?</p>
        <button
          onClick={onShowSignup}
          className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          회원가입
        </button>
      </div>
    </div>
  )
}