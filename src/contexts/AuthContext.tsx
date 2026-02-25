'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getUTMData } from '@/hooks/useUTMTracking'

export interface User {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
  role: 'admin' | 'user'
  gender?: string
  gender_digit?: string
  birth_date?: string
  postal_code?: string
  address1?: string
  address2?: string
  phone_marketing_agree?: boolean
  email_marketing_agree?: boolean
  record_time?: number
  etc?: string
  utm?: Record<string, any>
  created_at: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isLoading: boolean
  updateUser: (userData: Partial<User> | Record<string, any>) => void
  getGradeInfo: (grade: string, role?: string) => { display: string; icon: string; color: string }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 등급 정보 반환 함수 (role 파라미터 추가: admin이면 자동으로 bolt)
  const getGradeInfo = (grade: string, role?: string) => {
    // 관리자인 경우 항상 bolt 아이콘 표시
    if (role === 'admin') {
      return { display: '관리자', icon: '/images/grades/bolt.png', color: 'text-purple-600' }
    }

    switch (grade) {
      case 'cheetah':
        return { display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
      case 'horse':
        return { display: '홀스족', icon: '/images/grades/horse.png', color: 'text-blue-600' }
      case 'wolf':
        return { display: '울프족', icon: '/images/grades/wolf.png', color: 'text-green-600' }
      case 'turtle':
        return { display: '터틀족', icon: '/images/grades/turtle.png', color: 'text-gray-600' }
      case 'bolt':
        return { display: '볼타족', icon: '/images/grades/bolt.png', color: 'text-purple-600' }
      default:
        return { display: '일반회원', icon: '👤', color: 'text-gray-500' }
    }
  }

  // 컴포넌트 마운트 시 저장된 사용자 정보 복원
  // 우선순위: localStorage (자동 로그인) → sessionStorage
  useEffect(() => {
    // 1. 자동 로그인 확인 (localStorage)
    const autoLoginUser = localStorage.getItem('user')
    if (autoLoginUser) {
      try {
        const userData = JSON.parse(autoLoginUser)
        setUser(userData)
        setIsLoading(false)
        return
      } catch (error) {
        console.error('자동 로그인 복원 오류:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('autoLogin')
      }
    }

    // 2. 일반 세션 확인 (sessionStorage)
    const savedUser = sessionStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error('사용자 정보 복원 오류:', error)
        sessionStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  // 사용자가 로그인되면 localStorage의 UTM 데이터를 DB에 저장
  useEffect(() => {
    if (!user) return

    const saveUTMData = async () => {
      if (typeof window === 'undefined') return

      try {
        const utmDataStr = localStorage.getItem('utm_data')
        if (!utmDataStr) return

        const utmData = JSON.parse(utmDataStr)
        if (Object.keys(utmData).length === 0) return

        // 먼저 DB에서 현재 utm 확인
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('utm')
          .eq('id', user.id)
          .single()

        if (selectError) {
          console.error('UTM 조회 실패:', selectError)
          return
        }

        // 이미 실제 데이터가 저장되어 있으면 저장하지 않음
        // "{}"는 빈 객체이므로 저장 진행
        if (existingUser?.utm && Object.keys(existingUser.utm).length > 0) {
          localStorage.removeItem('utm_data')
          return
        }

        // utm이 없거나 "{}"이면 저장
        const { error: updateError } = await supabase
          .from('users')
          .update({ utm: utmData })
          .eq('id', user.id)

        if (updateError) {
          console.error('UTM 저장 실패:', updateError)
        } else {
          // 저장 완료 후 로컬스토리지에서 제거
          localStorage.removeItem('utm_data')
        }
      } catch (err) {
        console.error('UTM 데이터 저장 중 오류:', err)
      }
    }

    saveUTMData()
  }, [user?.id])

  // 로그인 함수 (UTM 저장은 useEffect에서 자동 처리)
  const login = async (userData: User) => {
    setUser(userData)
  }

  // 로그아웃 함수
  const logout = () => {
    setUser(null)
    // 모든 저장소에서 사용자 정보 삭제
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
    localStorage.removeItem('autoLogin')
  }

  // 사용자 정보 업데이트 함수
  const updateUser = async (userData: Partial<User> | Record<string, any>) => {
    if (!user) return

    try {
      console.log('업데이트할 데이터:', userData)

      // UTM 데이터가 없으면 세션에서 가져오기
      const utmData = userData.utm || getUTMData()
      const updateData = { ...userData }

      // UTM 데이터가 있으면 추가
      if (utmData && Object.keys(utmData).length > 0) {
        updateData.utm = utmData
      }

      // 데이터베이스 업데이트
      const { error, data } = await supabase
        .from('users')
        .update(updateData as any)
        .eq('id', user.id)
        .select()

      console.log('Supabase 응답:', { error, data })

      if (error) {
        console.error('Supabase 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // 일반적인 업데이트의 경우 기존 방식 사용
      const updatedUser = { ...user, ...updateData }
      setUser(updatedUser)
      sessionStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (error) {
      console.error('사용자 정보 업데이트 오류:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    updateUser,
    getGradeInfo
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}