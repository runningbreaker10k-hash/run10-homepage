'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Search, Plus, Eye, MessageSquare, Pin, Edit, Trash2, Lock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Post {
  id: string
  title: string
  content: string
  image_url?: string
  views: number
  is_notice: boolean
  created_at: string
  updated_at: string
  author_id: string
  author_name: string
  author_grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
  author_grade_icon: string
  comment_count: number
}

export default function CommunityPage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const postsPerPage = 15

  useEffect(() => {
    loadPosts()
  }, [currentPage, searchTerm])

  const loadPosts = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('community_posts_with_author')
        .select('*', { count: 'exact' })
        .is('competition_id', null)  // 대회 ID가 없는 글만 표시 (회원게시판)

      // 검색 필터
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffHours = Math.floor(diff / (1000 * 60 * 60))

    if (diffHours < 24) {
      return format(date, 'HH:mm')
    } else {
      return format(date, 'MM.dd')
    }
  }

  const totalPages = Math.ceil(totalPosts / postsPerPage)

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20 overflow-hidden">
        {/* 배경 이미지 공간 */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/community-hero-bg.jpg"
            alt="회원게시판 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">회원게시판</h1>
          <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            런텐 회원들과 자유롭게 소통해보세요
          </p>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 상단 액션 바 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {/* 검색 */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="제목, 작성자, 내용으로 검색..."
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
            <button
              onClick={handleWritePost}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>글쓰기</span>
            </button>
          </div>


      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">제목</div>
            <div className="col-span-2 text-center">작성자</div>
            <div className="col-span-2 text-center">작성일</div>
            <div className="col-span-1 text-center">조회</div>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>게시글을 불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" />
              <p>게시글이 없습니다.</p>
              {!searchTerm && (
                <p className="text-xs mt-1">첫 번째 글을 작성해보세요!</p>
              )}
            </div>
          ) : (
            posts.map((post, index) => (
              <div
                key={post.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* 번호 */}
                  <div className="col-span-1 text-center text-sm text-gray-500">
                    {post.is_notice ? (
                      <Pin className="w-4 h-4 text-red-600 mx-auto" />
                    ) : (
                      totalPosts - (currentPage - 1) * postsPerPage - index
                    )}
                  </div>

                  {/* 제목 */}
                  <div className="col-span-6">
                    <div className="flex items-center space-x-2">
                      {post.is_notice && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          공지
                        </span>
                      )}
                      <span className="font-medium text-gray-900 hover:text-red-600">
                        {post.title}
                      </span>
                      {post.comment_count > 0 && (
                        <span className="flex items-center text-xs text-red-600">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {post.comment_count}
                        </span>
                      )}
                      {post.image_url && (
                        <span className="text-xs text-blue-600">📷</span>
                      )}
                    </div>
                  </div>

                  {/* 작성자 */}
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <img
                        src={getGradeInfo(post.author_grade).icon}
                        alt="등급"
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{maskName(post.author_name)}</span>
                    </div>
                  </div>

                  {/* 작성일 */}
                  <div className="col-span-2 text-center text-sm text-gray-500">
                    {formatDate(post.created_at)}
                  </div>

                  {/* 조회수 */}
                  <div className="col-span-1 text-center text-sm text-gray-500">
                    {post.views}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                처음
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
                      className={`px-3 py-1 text-sm border rounded ${
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
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                다음
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                마지막
              </button>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-2">
              {currentPage} / {totalPages} 페이지 (총 {totalPosts}개)
            </div>
          </div>
        )}
      </div>

          {/* 안내 메시지 */}
          {!user && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 text-center">
                🔒 게시글 작성은 회원만 가능합니다. <strong>회원가입</strong> 후 이용해주세요!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}