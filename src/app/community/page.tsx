'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Search, Plus, MessageSquare, Pin } from 'lucide-react'
import { formatPostDate } from '@/lib/dateUtils'
import AuthModal from '@/components/AuthModal'

interface Post {
  id: string
  title: string
  content: string
  image_url?: string
  views: number
  is_notice: boolean
  created_at: string
  updated_at: string
  user_id: string
  users: {
    name: string
    grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
    role: 'admin' | 'user'
  }
  post_comments: { id: string }[]
}

function CommunityPageContent() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
      <CommunityContent />
    </Suspense>
  )
}

function CommunityContent() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [totalPosts, setTotalPosts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('login')
  const postsPerPage = 15

  // URL에서 페이지 번호 읽기
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // 페이지 변경 함수 (URL 업데이트)
  const setCurrentPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    const query = params.toString()
    router.push(`/community${query ? `?${query}` : ''}`, { scroll: false })
  }

  useEffect(() => {
    loadPosts()
  }, [currentPage, searchTerm])

  const loadPosts = async () => {
    setIsLoading(true)

    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          users (
            name,
            grade,
            role
          ),
          post_comments (id)
        `, { count: 'exact' })
        .is('competition_id', null)  // 대회 ID가 없는 글만 표시 (회원게시판)

      // 검색 필터
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      }

      // 페이지네이션
      const from = (currentPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      const { data, error, count } = await query
        .range(from, to)
        .order('is_notice', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setPosts(data || [])
      setTotalPosts(count || 0)
    } catch (error) {
      console.error('게시글 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWritePost = () => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      return
    }
    router.push('/community/write')
  }

  const handlePostClick = async (postId: string) => {
    // 조회수 증가
    try {
      const { error } = await supabase.rpc('increment_post_views', { post_id: postId })
      if (error) console.error('조회수 증가 오류:', error)
    } catch (error) {
      console.error('조회수 증가 오류:', error)
    }

    router.push(`/community/${postId}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadPosts()
  }

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (!name || name.length <= 1) return name

    if (name.length === 2) {
      // 2글자: 첫글자 + *
      return name[0] + '*'
    } else if (name.length === 3) {
      // 3글자: 첫글자 + * + 마지막글자
      return name[0] + '*' + name[2]
    } else {
      // 4글자 이상: 첫글자 + * + 마지막글자
      return name[0] + '*' + name[name.length - 1]
    }
  }


  const totalPages = Math.ceil(totalPosts / postsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-16 overflow-hidden">
        {/* 배경 이미지 공간 */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/community-hero-bg.jpg"
            alt="자유게시판 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">자유게시판</h1>
          <p className="text-lg md:text-xl text-red-100 max-w-3xl mx-auto">
            런텐 회원들과 자유롭게 소통해보세요
          </p>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-2 flex-shrink-0" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">자유게시판</h3>
            </div>
            {user && (
              <button
                onClick={handleWritePost}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium touch-manipulation flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>글쓰기</span>
              </button>
            )}
          </div>

          {!user ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-8 text-center mb-6">
              <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mx-auto mb-4 sm:mb-6" />
              <h4 className="text-lg sm:text-2xl font-bold text-red-900 mb-2 sm:mb-4">
                회원만 게시판을 이용할 수 있습니다
              </h4>
              <p className="text-red-700 text-sm sm:text-lg mb-4 sm:mb-6">
                회원가입 후 자유롭게 소통하고 다른 회원들과 정보를 공유하세요.
              </p>

              <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h5 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">게시판에서 가능한 활동</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center text-gray-700">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                    자유로운 소통과 대화
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                    러닝 정보 및 팁 공유
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                    운영진 공지사항 확인
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                    후기 및 사진 공유
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    setAuthDefaultTab('signup')
                    setShowAuthModal(true)
                  }}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-red-600 text-white rounded-lg text-sm sm:text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg text-center touch-manipulation"
                >
                  회원가입하기
                </button>
                <button
                  onClick={() => {
                    setAuthDefaultTab('login')
                    setShowAuthModal(true)
                  }}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg text-sm sm:text-lg font-semibold hover:bg-red-50 transition-colors text-center touch-manipulation"
                >
                  로그인
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 검색 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                <div className="flex-1">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="제목, 작성자, 내용으로 검색..."
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center touch-manipulation"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </form>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right whitespace-nowrap">
                  총 {totalPosts}개의 게시글
                </div>
              </div>


              {/* 게시글 목록 */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-red-600"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {searchTerm ? '다른 키워드로 검색해보세요.' : '첫 번째 글을 작성해보세요.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* 게시글 목록 헤더 */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-2 sm:gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-1 text-center">번호</div>
                        <div className="col-span-11 sm:col-span-6">제목</div>
                        <div className="col-span-2 text-center hidden sm:block">작성자</div>
                        <div className="col-span-2 text-center hidden sm:block">작성일</div>
                        <div className="col-span-1 text-center hidden sm:block">조회</div>
                      </div>
                    </div>

                    {/* 게시글 목록 */}
                    <div className="divide-y divide-gray-200">
                      {posts.map((post, index) => (
                        <div
                          key={post.id}
                          className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handlePostClick(post.id)}
                        >
                          <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                            {/* 번호 */}
                            <div className="col-span-1 text-center text-xs sm:text-sm text-gray-500">
                              {post.is_notice ? (
                                <Pin className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mx-auto" />
                              ) : (
                                totalPosts - (currentPage - 1) * postsPerPage - index
                              )}
                            </div>

                            {/* 제목 */}
                            <div className="col-span-11 sm:col-span-6 min-w-0">
                              <div className="flex flex-col space-y-1">
                                {/* 제목 줄 */}
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  {post.is_notice && (
                                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                                      공지
                                    </span>
                                  )}
                                  <span className="font-medium text-gray-900 hover:text-red-600 text-sm sm:text-base truncate">
                                    {post.title}
                                  </span>
                                  {post.post_comments?.length > 0 && (
                                    <span className="flex items-center text-xs text-red-600 flex-shrink-0">
                                      <MessageSquare className="w-3 h-3 mr-0.5" />
                                      {post.post_comments.length}
                                    </span>
                                  )}
                                  {post.image_url && (
                                    <span className="text-xs text-blue-600 flex-shrink-0">📷</span>
                                  )}
                                </div>
                                {/* 정보 줄 - 모바일에서만 */}
                                <div className="sm:hidden flex items-center space-x-2 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <img
                                      src={getGradeInfo(post.users?.grade || 'turtle', post.users?.role).icon}
                                      alt="등급"
                                      className="w-3 h-3"
                                    />
                                    <span>{maskName(post.users?.name || '')}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{formatPostDate(post.created_at)}</span>
                                  <span>•</span>
                                  <span>조회 {post.views}</span>
                                </div>
                              </div>
                            </div>

                            {/* 작성자 - 데스크톱만 */}
                            <div className="col-span-2 text-center hidden sm:block">
                              <div className="flex items-center justify-center space-x-2">
                                <img
                                  src={getGradeInfo(post.users?.grade || 'turtle', post.users?.role).icon}
                                  alt="등급"
                                  className="w-4 h-4 flex-shrink-0"
                                />
                                <span className="text-sm text-gray-700 break-words">
                                  {maskName(post.users?.name || '')}
                                </span>
                              </div>
                            </div>

                            {/* 작성일 - 데스크톱만 */}
                            <div className="col-span-2 text-center text-sm text-gray-500 hidden sm:block">
                              {formatPostDate(post.created_at)}
                            </div>

                            {/* 조회수 - 데스크톱만 */}
                            <div className="col-span-1 text-center text-sm text-gray-500 hidden sm:block">
                              {post.views}
                            </div>

                            {/* 모바일 정보 컬럼 - 실제로는 사용하지 않음 */}
                            <div className="col-span-3 sm:hidden"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                        >
                          처음
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                        >
                          이전
                        </button>

                        {/* 페이지 번호 */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const startPage = Math.max(1, currentPage - 2)
                          const pageNumber = startPage + i

                          if (pageNumber <= totalPages) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded touch-manipulation ${
                                  currentPage === pageNumber
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            )
                          }
                          return null
                        })}

                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                        >
                          다음
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                        >
                          마지막
                        </button>
                      </div>

                      <div className="text-center text-xs text-gray-500 mt-2">
                        {currentPage} / {totalPages} 페이지 (총 {totalPosts}개)
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authDefaultTab}
        onSuccess={() => {
          setShowAuthModal(false)
          // 로그인 성공 시 페이지 새로고침으로 상태 업데이트
          window.location.reload()
        }}
      />
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityPageContent />
    </Suspense>
  )
}