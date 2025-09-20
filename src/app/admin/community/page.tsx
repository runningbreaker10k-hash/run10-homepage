'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare,
  Search,
  Edit,
  Trash2,
  Eye,
  Pin,
  Download
} from 'lucide-react'
import { format } from 'date-fns'

interface CommunityPost {
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
    user_id: string
    name: string
    grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
    role: 'admin' | 'user'
  }
  comments?: { count: number }[]
}

export default function AdminCommunityPage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [noticeFilter, setNoticeFilter] = useState<string>('all')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    loadPosts()
  }, [user, router])

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users (
            user_id,
            name,
            grade,
            role
          ),
          post_comments!inner (count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('게시글 목록 로드 오류:', error)
      alert('게시글 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (confirm(`정말 "${postTitle}" 게시글을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        // 먼저 댓글 삭제
        await supabase
          .from('post_comments')
          .delete()
          .eq('post_id', postId)

        // 게시글 삭제
        const { error } = await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId)

        if (error) throw error

        alert('게시글이 삭제되었습니다.')
        loadPosts()
      } catch (error) {
        console.error('게시글 삭제 오류:', error)
        alert('게시글 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const toggleNotice = async (postId: string, currentStatus: boolean, postTitle: string) => {
    const message = currentStatus 
      ? '공지글 설정을 해제하시겠습니까?' 
      : '공지글로 설정하시겠습니까?'

    if (confirm(message)) {
      try {
        const { error } = await supabase
          .from('community_posts')
          .update({ is_notice: !currentStatus })
          .eq('id', postId)

        if (error) throw error

        alert(`"${postTitle}"이(가) ${!currentStatus ? '공지글로 설정' : '일반글로 변경'}되었습니다.`)
        loadPosts()
      } catch (error) {
        console.error('공지글 설정 오류:', error)
        alert('공지글 설정 중 오류가 발생했습니다.')
      }
    }
  }

  const exportToCSV = () => {
    const csvHeader = '제목,작성자,등급,공지여부,조회수,댓글수,작성일\n'
    const csvContent = filteredPosts.map(post => {
      const gradeInfo = getGradeInfo(post.users.grade)
      const commentCount = post.comments?.[0]?.count || 0
      return [
        `"${post.title.replace(/"/g, '""')}"`, // 따옴표 이스케이프
        post.users.name,
        gradeInfo.display,
        post.is_notice ? '공지' : '일반',
        post.views,
        commentCount,
        format(new Date(post.created_at), 'yyyy.MM.dd')
      ].join(',')
    }).join('\n')

    const blob = new Blob(['\uFEFF' + csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `커뮤니티게시글_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesNotice = 
      noticeFilter === 'all' || 
      (noticeFilter === 'notice' && post.is_notice) ||
      (noticeFilter === 'normal' && !post.is_notice)

    return matchesSearch && matchesNotice
  })

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="h-8 w-8 mr-3 text-red-600" />
                회원게시판 관리
              </h1>
              <p className="text-gray-600 mt-2">
                전체 게시글: {posts.length}개 
                (공지: {posts.filter(p => p.is_notice).length}개, 
                일반: {posts.filter(p => !p.is_notice).length}개)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>CSV 내보내기</span>
              </button>
              <Link
                href="/community/write"
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>글쓰기</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="제목, 작성자, 내용으로 검색..."
                />
              </div>
            </div>
            <div>
              <select
                value={noticeFilter}
                onChange={(e) => setNoticeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">전체 게시글</option>
                <option value="notice">공지글만</option>
                <option value="normal">일반글만</option>
              </select>
            </div>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => {
                  const gradeInfo = getGradeInfo(post.users.grade)
                  const commentCount = post.comments?.[0]?.count || 0
                  return (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {post.is_notice && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                              <Pin className="w-3 h-3 mr-1" />
                              공지
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/community/${post.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors block"
                            >
                              {post.title}
                            </Link>
                            {post.image_url && (
                              <span className="inline-flex items-center text-xs text-gray-500 mt-1">
                                <Eye className="w-3 h-3 mr-1" />
                                이미지 첨부
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{gradeInfo.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{post.users.name}</div>
                            <div className="text-xs text-gray-500">{gradeInfo.display}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-500">
                            <Eye className="h-3 w-3 mr-1" />
                            <span>{post.views}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span>{commentCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(post.created_at), 'yyyy.MM.dd')}
                        </div>
                        {post.created_at !== post.updated_at && (
                          <div className="text-xs text-gray-500">(수정됨)</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleNotice(post.id, post.is_notice, post.title)}
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                            post.is_notice
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          <Pin className="h-3 w-3 mr-1" />
                          {post.is_notice ? '공지해제' : '공지설정'}
                        </button>
                        <Link
                          href={`/community/${post.id}/edit`}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          수정
                        </Link>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          삭제
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || noticeFilter !== 'all' 
                  ? '검색 조건에 맞는 게시글이 없습니다.' 
                  : '등록된 게시글이 없습니다.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}