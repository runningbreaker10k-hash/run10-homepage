'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Users, Calendar, Trophy, User, LogOut, MessageCircle, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './AuthModal'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout, getGradeInfo } = useAuth()

  const handleAuthClick = (tab: 'login' | 'signup') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    setIsMenuOpen(false)
  }

  const gradeInfo = user ? getGradeInfo(user.grade) : null

  return (
    <>
      <header className="bg-red-600 shadow-lg fixed w-full top-0 z-[9999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                {/* 로고 이미지 - 러너 실루엣 */}
                <div 
                  className="w-16 h-10"
                  style={{
                    backgroundImage: "url('/images/runner-logo.png')", // 러너 로고 이미지 경로
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    margin: '0'
                  }}
                >
                </div>
                <span className="text-xl font-bold text-white">런텐 RUN10</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/about"
                className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>런텐 소개</span>
                </div>
              </Link>
              <Link
                href="/competitions"
                className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>런텐 대회</span>
                </div>
              </Link>
              <Link
                href="/community"
                className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>자유게시판</span>
                </div>
              </Link>

              {/* Auth Section */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-red-200 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {gradeInfo && (
                      <img
                        src={gradeInfo.icon}
                        alt={gradeInfo.display}
                        className="w-5 h-5"
                      />
                    )}
                    <span>{user.name}</span>
                    <span className="text-xs opacity-80">({gradeInfo?.display})</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[10000]">
                      <Link
                        href="/mypage"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        마이페이지
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          관리자
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-white hover:text-red-200 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-red-200 focus:outline-none focus:text-red-200"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-red-700 border-t border-red-500">
                <Link
                  href="/about"
                  className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>런텐 소개</span>
                  </div>
                </Link>
                <Link
                  href="/competitions"
                  className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>런텐 대회</span>
                  </div>
                </Link>
                <Link
                  href="/community"
                  className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>자유게시판</span>
                  </div>
                </Link>

                {/* Mobile Auth Section */}
                <div className="border-t border-red-500 pt-3 mt-3">
                  {user ? (
                    <>
                      <div className="px-3 py-2 text-white text-sm">
                        <div className="flex items-center space-x-2">
                          {gradeInfo && (
                            <img
                              src={gradeInfo.icon}
                              alt={gradeInfo.display}
                              className="w-5 h-5"
                            />
                          )}
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs opacity-80">({gradeInfo?.display})</span>
                        </div>
                      </div>
                      <Link
                        href="/mypage"
                        className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>마이페이지</span>
                        </div>
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4" />
                            <span>관리자</span>
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="text-red-200 hover:text-white block px-3 py-2 text-base font-medium w-full text-left"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="h-4 w-4" />
                          <span>로그아웃</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleAuthClick('login')
                          setIsMenuOpen(false)
                        }}
                        className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium w-full text-left"
                      >
                        로그인
                      </button>
                      <button
                        onClick={() => {
                          handleAuthClick('signup')
                          setIsMenuOpen(false)
                        }}
                        className="text-white hover:text-red-200 block px-3 py-2 text-base font-medium w-full text-left"
                      >
                        회원가입
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false)
          // 모달 닫을 때 상태 초기화는 하지 않음 (다음 열 때 올바른 탭이 표시되도록)
        }}
        defaultTab={authModalTab}
      />
    </>
  )
}