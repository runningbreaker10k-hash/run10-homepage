'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Trophy,
  Users,
  MessageCircle,
  Settings,
  Eye,
  Edit,
  UserCheck,
  Trash2,
  Plus,
  Search,
  Pin,
  MessageSquare
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition, Registration, CompetitionPost, User } from '@/types'
import { format } from 'date-fns'
import PostDetailModal from '@/components/PostDetailModal'

export default function AdminPage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'competitions' | 'community' | 'members'>('competitions')
  const [competitionSubTab, setCompetitionSubTab] = useState<'management' | 'participants' | 'boards'>('management')

  // 대회 관리 관련 상태
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionsLoading, setCompetitionsLoading] = useState(false)

  // 참가자 관리 관련 상태
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [selectedCompetitionForParticipants, setSelectedCompetitionForParticipants] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')

  // 게시글 관리 관련 상태
  const [posts, setPosts] = useState<CompetitionPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [selectedPost, setSelectedPost] = useState<CompetitionPost | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [currentPostPage, setCurrentPostPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [selectedCompetitionForPosts, setSelectedCompetitionForPosts] = useState<string>('')
  const postsPerPage = 10

  // 회원 관리 관련 상태
  const [members, setMembers] = useState<User[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentMemberPage, setCurrentMemberPage] = useState(1)
  const [totalMembers, setTotalMembers] = useState(0)
  const membersPerPage = 20

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'admin') {
      router.push('/')
      return
    }
    setLoading(false)
  }, [user, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'competitions') {
        fetchCompetitions()
        if (competitionSubTab === 'participants') {
          fetchRegistrations()
        } else if (competitionSubTab === 'boards') {
          setCurrentPostPage(1)
          fetchCompetitionPosts()
        }
      } else if (activeTab === 'community') {
        setCurrentPostPage(1)
        fetchCommunityPosts()
      } else if (activeTab === 'members') {
        setCurrentMemberPage(1)
        fetchMembers()
      }
    }
  }, [activeTab, user, competitionSubTab, selectedCompetitionForParticipants, selectedCompetitionForPosts, paymentStatusFilter])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'community') {
      fetchCommunityPosts()
    }
  }, [currentPostPage, user, activeTab, fetchCommunityPosts])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'members') {
      fetchMembers()
    }
  }, [currentMemberPage, user, activeTab, fetchMembers])


  // 대회 관리 함수들
  const fetchCompetitions = async () => {
    setCompetitionsLoading(true)
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompetitions(data || [])
    } catch (error) {
      console.error('대회 로드 오류:', error)
      setCompetitions([])
    } finally {
      setCompetitionsLoading(false)
    }
  }

  const deleteCompetition = async (id: string) => {
    if (!confirm('정말로 이 대회를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchCompetitions()
      alert('대회가 삭제되었습니다.')
    } catch (error) {
      console.error('대회 삭제 오류:', error)
      alert('대회 삭제 중 오류가 발생했습니다.')
    }
  }

  // 참가자 관리 함수들
  const fetchRegistrations = async () => {
    setRegistrationsLoading(true)
    try {
      let query = supabase
        .from('registrations')
        .select(`
          *,
          competitions (
            title,
            date
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedCompetitionForParticipants) {
        query = query.eq('competition_id', selectedCompetitionForParticipants)
      }

      if (paymentStatusFilter !== 'all') {
        query = query.eq('payment_status', paymentStatusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setRegistrations(data || [])
    } catch (error) {
      console.error('참가자 로드 오류:', error)
      setRegistrations([])
    } finally {
      setRegistrationsLoading(false)
    }
  }

  // 커뮤니티 게시글 관리 함수들
  const fetchCommunityPosts = async () => {
    setPostsLoading(true)
    try {
      const from = (currentPostPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      const { data, error, count } = await supabase
        .from('community_posts_with_author')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
      setTotalPosts(count || 0)
    } catch (error) {
      console.error('게시글 로드 오류:', error)
      setPosts([])
      setTotalPosts(0)
    } finally {
      setPostsLoading(false)
    }
  }

  // 대회 게시글 관리 함수들
  const fetchCompetitionPosts = async () => {
    setPostsLoading(true)
    try {
      const from = (currentPostPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      let query = supabase
        .from('competition_posts_with_author')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (selectedCompetitionForPosts) {
        query = query.eq('competition_id', selectedCompetitionForPosts)
      }

      const { data, error, count } = await query
      if (error) throw error
      setPosts(data || [])
      setTotalPosts(count || 0)
    } catch (error) {
      console.error('게시글 로드 오류:', error)
      setPosts([])
      setTotalPosts(0)
    } finally {
      setPostsLoading(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      const tableName = activeTab === 'community' ? 'community_posts' : 'competition_posts'

      // 댓글 먼저 삭제
      if (activeTab === 'community') {
        await supabase
          .from('post_comments')
          .delete()
          .eq('post_id', postId)
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', postId)

      if (error) throw error

      if (activeTab === 'community') {
        fetchCommunityPosts()
      } else {
        fetchCompetitionPosts()
      }
      alert('게시글이 삭제되었습니다.')
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  const toggleNotice = async (postId: string, currentStatus: boolean) => {
    const message = currentStatus
      ? '공지글 설정을 해제하시겠습니까?'
      : '공지글로 설정하시겠습니까?'

    if (!confirm(message)) return

    try {
      if (activeTab === 'community') {
        const { error } = await supabase
          .from('community_posts')
          .update({ is_notice: !currentStatus })
          .eq('id', postId)

        if (error) throw error
      }

      fetchCommunityPosts()
      alert(`${!currentStatus ? '공지글로 설정' : '일반글로 변경'}되었습니다.`)
    } catch (error) {
      console.error('공지글 설정 오류:', error)
      alert('공지글 설정 중 오류가 발생했습니다.')
    }
  }

  // 회원 관리 함수들
  const fetchMembers = async () => {
    setMembersLoading(true)
    try {
      const from = (currentMemberPage - 1) * membersPerPage
      const to = from + membersPerPage - 1

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      setMembers(data || [])
      setTotalMembers(count || 0)
    } catch (error) {
      console.error('회원 로드 오류:', error)
      setMembers([])
      setTotalMembers(0)
    } finally {
      setMembersLoading(false)
    }
  }

  const updateMemberGrade = async (userId: string, newGrade: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ grade: newGrade })
        .eq('id', userId)

      if (error) throw error
      fetchMembers()
      alert('회원 등급이 변경되었습니다.')
    } catch (error) {
      console.error('등급 변경 오류:', error)
      alert('등급 변경 중 오류가 발생했습니다.')
    }
  }

  const updateMemberRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      fetchMembers()
      alert('회원 권한이 변경되었습니다.')
    } catch (error) {
      console.error('권한 변경 오류:', error)
      alert('권한 변경 중 오류가 발생했습니다.')
    }
  }

  const deleteMember = async (userId: string) => {
    if (!confirm('정말로 이 회원을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      fetchMembers()
      alert('회원이 삭제되었습니다.')
    } catch (error) {
      console.error('회원 삭제 오류:', error)
      alert('회원 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Settings className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-6">관리자 권한이 있는 회원만 접근할 수 있습니다.</p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              로그인 하기
            </Link>
            <Link
              href="/"
              className="block w-full text-red-600 hover:text-red-800 py-2 px-4 border border-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              메인 페이지로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: Competition['status']) => {
    const badges = {
      draft: { text: '임시저장', color: 'bg-gray-100 text-gray-800' },
      published: { text: '공개', color: 'bg-green-100 text-green-800' },
      closed: { text: '마감', color: 'bg-red-100 text-red-800' }
    }

    const badge = badges[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getGradeName = (grade: string) => {
    const gradeNames: { [key: string]: string } = {
      'cheetah': '치타족',
      'horse': '홀스족',
      'wolf': '울프족',
      'turtle': '터틀족',
      'bolt': '볼타족'
    }
    return gradeNames[grade] || grade
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                관리자: <span className="font-medium text-gray-900">{user.name}</span>
              </div>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 px-4 py-2"
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('competitions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'competitions'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="h-4 w-4 mr-2" />
                대회 관리
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'community'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                게시판 관리
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'members'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                회원 관리
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'competitions' && (
          <div className="bg-white rounded-lg shadow">
            {/* 대회관리 서브탭 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-3">
                <button
                  onClick={() => setCompetitionSubTab('management')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    competitionSubTab === 'management'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Trophy className="h-4 w-4 mr-2 inline" />
                  대회
                </button>
                <button
                  onClick={() => setCompetitionSubTab('participants')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    competitionSubTab === 'participants'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2 inline" />
                  참가자
                </button>
                <button
                  onClick={() => setCompetitionSubTab('boards')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    competitionSubTab === 'boards'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MessageCircle className="h-4 w-4 mr-2 inline" />
                  게시판(대회별)
                </button>
              </nav>
            </div>

            {/* 대회 관리 */}
            {competitionSubTab === 'management' && (
              <>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">대회 관리</h2>
                  <Link
                    href="/admin/competitions/new"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    대회 등록
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  {competitionsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            대회명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            참가자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            날짜
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {competitions.map((competition) => (
                          <tr key={competition.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {competition.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {competition.location}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(competition.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {competition.current_participants} / {competition.max_participants}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(competition.date), 'yyyy.MM.dd')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <Link
                                  href={`/competitions/${competition.id}`}
                                  className="text-red-600 hover:text-blue-800"
                                  title="대회 보기"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/admin/competitions/${competition.id}/edit`}
                                  className="text-green-600 hover:text-green-800"
                                  title="대회 수정"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/admin/competitions/${competition.id}/registrations`}
                                  className="text-purple-600 hover:text-purple-800"
                                  title="참가자 관리"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => deleteCompetition(competition.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="대회 삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {competitions.length === 0 && !competitionsLoading && (
                    <div className="text-center py-12">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">등록된 대회가 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 참가자 관리 */}
            {competitionSubTab === 'participants' && (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">참가자 관리</h2>
                    <div className="flex items-center space-x-4">
                      <select
                        value={selectedCompetitionForParticipants}
                        onChange={(e) => setSelectedCompetitionForParticipants(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="">전체 대회</option>
                        {competitions.map((competition) => (
                          <option key={competition.id} value={competition.id}>
                            {competition.title}
                          </option>
                        ))}
                      </select>
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="all">전체 상태</option>
                        <option value="pending">입금대기</option>
                        <option value="confirmed">입금확인</option>
                        <option value="cancelled">취소</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {registrationsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            참가자 정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            대회명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            결제 상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            신청일
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registrations.map((registration) => (
                          <tr key={registration.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {registration.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {registration.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {registration.competitions?.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                registration.payment_status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : registration.payment_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {registration.payment_status === 'confirmed' ? '입금확인' :
                                 registration.payment_status === 'pending' ? '입금대기' : '취소'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(registration.created_at), 'yyyy.MM.dd')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {registrations.length === 0 && !registrationsLoading && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">참가자가 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 대회 게시판 관리 */}
            {competitionSubTab === 'boards' && (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">대회 게시판 관리</h2>
                    <div className="flex items-center space-x-4">
                      <select
                        value={selectedCompetitionForPosts}
                        onChange={(e) => setSelectedCompetitionForPosts(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                      >
                        <option value="">전체 대회</option>
                        {competitions.map((competition) => (
                          <option key={competition.id} value={competition.id}>
                            {competition.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {postsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : (
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
                            대회명
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
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setSelectedPost(post)
                                  setShowPostDetail(true)
                                }}
                                className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors text-left"
                              >
                                {post.title}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{post.author_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{post.competition_title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(post.created_at).toLocaleDateString('ko-KR')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedPost(post)
                                  setShowPostDetail(true)
                                }}
                                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                보기
                              </button>
                              <button
                                onClick={() => deletePost(post.id)}
                                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {posts.length === 0 && !postsLoading && (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">게시글이 없습니다.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'community' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">회원게시판 관리</h2>
            </div>
            <div className="overflow-x-auto">
              {postsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : (
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
                    {posts.map((post) => {
                      const gradeInfo = post.users ? getGradeInfo(post.users.grade) : null
                      const commentCount = post.comments ? post.comments[0]?.count || 0 : 0
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
                                <button
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setShowPostDetail(true)
                                  }}
                                  className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors block text-left"
                                >
                                  {post.title}
                                </button>
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
                              {gradeInfo && (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{post.users.name}</div>
                                  <div className="text-xs text-gray-500">{gradeInfo.display}</div>
                                </div>
                              )}
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
                              {new Date(post.created_at).toLocaleDateString('ko-KR')}
                            </div>
                            {post.created_at !== post.updated_at && (
                              <div className="text-xs text-gray-500">(수정됨)</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => toggleNotice(post.id, post.is_notice || false)}
                              className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                                post.is_notice
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                            >
                              <Pin className="h-3 w-3 mr-1" />
                              {post.is_notice ? '공지해제' : '공지설정'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPost(post)
                                setShowPostDetail(true)
                              }}
                              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
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
              )}
              {posts.length === 0 && !postsLoading && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">등록된 게시글이 없습니다.</p>
                </div>
              )}

                {totalPosts > postsPerPage && (
                  <>
                    <div className="mt-6 flex justify-center items-center space-x-2">
                      <button
                        onClick={() => setCurrentPostPage(1)}
                        disabled={currentPostPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        처음
                      </button>
                      <button
                        onClick={() => setCurrentPostPage(currentPostPage - 1)}
                        disabled={currentPostPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        이전
                      </button>

                      {Array.from({ length: Math.min(5, Math.ceil(totalPosts / postsPerPage)) }, (_, i) => {
                        const startPage = Math.max(1, currentPostPage - 2)
                        const pageNumber = startPage + i
                        const totalPages = Math.ceil(totalPosts / postsPerPage)

                        if (pageNumber <= totalPages) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPostPage(pageNumber)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPostPage === pageNumber
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
                        onClick={() => setCurrentPostPage(currentPostPage + 1)}
                        disabled={currentPostPage === Math.ceil(totalPosts / postsPerPage)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => setCurrentPostPage(Math.ceil(totalPosts / postsPerPage))}
                        disabled={currentPostPage === Math.ceil(totalPosts / postsPerPage)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        마지막
                      </button>
                    </div>

                    <div className="text-center text-xs text-gray-500 mt-2">
                      {currentPostPage} / {Math.ceil(totalPosts / postsPerPage)} 페이지 (총 {totalPosts}개)
                    </div>
                  </>
                )}
            </div>
          </div>
        )}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">회원 관리</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="이름, 아이디, 이메일로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setCurrentMemberPage(1)
                          fetchMembers()
                        }
                      }}
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCurrentMemberPage(1)
                      fetchMembers()
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                  >
                    검색
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {membersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        회원정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등급
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        권한/관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <select
                              value={member.grade}
                              onChange={(e) => updateMemberGrade(member.id, e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="cheetah">치타족</option>
                              <option value="horse">홀스족</option>
                              <option value="wolf">울프족</option>
                              <option value="turtle">터틀족</option>
                              <option value="bolt">볼타족</option>
                            </select>
                            <div className="text-xs text-gray-500">
                              기록: {member.record_time !== 999 ? `${Math.floor(member.record_time / 60)}분 ${member.record_time % 60}초` : '미기록'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(member.created_at), 'yyyy.MM.dd')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <select
                              value={member.role}
                              onChange={(e) => updateMemberRole(member.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="user">일반회원</option>
                              <option value="admin">관리자</option>
                            </select>
                            <button
                              onClick={() => deleteMember(member.id)}
                              className="text-red-600 hover:text-red-800"
                              title="회원 삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {members.length === 0 && !membersLoading && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">회원이 없습니다.</p>
                </div>
              )}
            </div>

            {totalMembers > membersPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentMemberPage(1)}
                    disabled={currentMemberPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    처음
                  </button>
                  <button
                    onClick={() => setCurrentMemberPage(currentMemberPage - 1)}
                    disabled={currentMemberPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    이전
                  </button>

                  {Array.from({ length: Math.min(5, Math.ceil(totalMembers / membersPerPage)) }, (_, i) => {
                    const startPage = Math.max(1, currentMemberPage - 2)
                    const pageNumber = startPage + i
                    const totalPages = Math.ceil(totalMembers / membersPerPage)

                    if (pageNumber <= totalPages) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentMemberPage(pageNumber)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentMemberPage === pageNumber
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
                    onClick={() => setCurrentMemberPage(currentMemberPage + 1)}
                    disabled={currentMemberPage === Math.ceil(totalMembers / membersPerPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    다음
                  </button>
                  <button
                    onClick={() => setCurrentMemberPage(Math.ceil(totalMembers / membersPerPage))}
                    disabled={currentMemberPage === Math.ceil(totalMembers / membersPerPage)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    마지막
                  </button>
                </div>

                <div className="text-center text-xs text-gray-500 mt-2">
                  {currentMemberPage} / {Math.ceil(totalMembers / membersPerPage)} 페이지 (총 {totalMembers}명)
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PostDetailModal
        isOpen={showPostDetail}
        onClose={() => {
          setShowPostDetail(false)
          setSelectedPost(null)
        }}
        post={selectedPost}
        onPostUpdated={() => {
          if (currentMainTab === 'community') {
            fetchCommunityPosts()
          } else {
            fetchCompetitionPosts()
          }
        }}
        onPostDeleted={() => {
          if (currentMainTab === 'community') {
            fetchCommunityPosts()
          } else {
            fetchCompetitionPosts()
          }
        }}
        isAdminView={true}
      />
    </div>
  )
}