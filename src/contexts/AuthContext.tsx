'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

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
  created_at: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isLoading: boolean
  updateUser: (userData: Partial<User> | Record<string, any>) => void
  getGradeInfo: (grade: string) => { display: string; icon: string; color: string }
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

  // 등급 정보 반환 함수
  const getGradeInfo = (grade: string) => {
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

  // 컴포넌트 마운트 시 세션에서 사용자 정보 복원
  useEffect(() => {
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

  // 로그인 함수
  const login = (userData: User) => {
    setUser(userData)
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  // 로그아웃 함수
  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('user')
  }

  // 사용자 정보 업데이트 함수
  const updateUser = async (userData: Partial<User> | Record<string, any>) => {
    if (!user) return

    try {
      // 데이터베이스 업데이트
      const { error } = await supabase
        .from('users')
        .update(userData as any)
        .eq('id', user.id)

      if (error) throw error

      // 일반적인 업데이트의 경우 기존 방식 사용
      const updatedUser = { ...user, ...userData }
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