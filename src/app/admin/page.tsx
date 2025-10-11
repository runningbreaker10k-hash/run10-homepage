'use client'

import { useState, useEffect } from 'react'
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
  MessageSquare,
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition, Registration, CompetitionPost, User } from '@/types'
import { format } from 'date-fns'
import { formatKST } from '@/lib/dateUtils'
import PostDetailModal from '@/components/PostDetailModal'
import AuthModal from '@/components/AuthModal'

export default function AdminPage() {
  const { user, getGradeInfo } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'competitions' | 'community' | 'members'>('competitions')
  const [competitionSubTab, setCompetitionSubTab] = useState<'management' | 'participants' | 'boards'>('management')
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 대회 관리 관련 상태
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionsLoading, setCompetitionsLoading] = useState(false)

  // 참가자 관리 관련 상태
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [selectedCompetitionForParticipants, setSelectedCompetitionForParticipants] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [distanceFilter, setDistanceFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [ageFilter, setAgeFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'distance'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null)
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [currentRegistrationPage, setCurrentRegistrationPage] = useState(1)
  const [totalRegistrations, setTotalRegistrations] = useState(0)
  const [registrationsPerPage, setRegistrationsPerPage] = useState(20)
  const [participantSearchTerm, setParticipantSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  // 회원 상세 정보 모달
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)

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
  const [membersPerPage, setMembersPerPage] = useState(20)
  const [memberCompetitionFilter, setMemberCompetitionFilter] = useState<string>('all')
  const [memberRegionFilter, setMemberRegionFilter] = useState<string>('all')
  const [memberAgeFilter, setMemberAgeFilter] = useState<string>('all')
  const [memberGenderFilter, setMemberGenderFilter] = useState<string>('all')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (user.role !== 'admin') {
      setLoading(false)
      return
    }
    setLoading(false)
    setShowAuthModal(false)
  }, [user])

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
        // 회원관리 탭에서도 대회 목록이 필요 (대회 필터용)
        fetchCompetitions()
        setCurrentMemberPage(1)
        fetchMembers()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, competitionSubTab, selectedCompetitionForParticipants, selectedCompetitionForPosts, paymentStatusFilter, distanceFilter, regionFilter, ageFilter, genderFilter, sortBy, sortOrder, currentRegistrationPage, participantSearchTerm, registrationsPerPage])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'community') {
      fetchCommunityPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPostPage, user, activeTab])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'members') {
      fetchMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberPage, membersPerPage, user, activeTab, searchTerm, memberCompetitionFilter, memberRegionFilter, memberAgeFilter, memberGenderFilter])


  // 대회 관리 함수들
  const fetchCompetitions = async () => {
    setCompetitionsLoading(true)
    try {
      // 대회 목록과 실제 참가자 수 조회
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })

      if (competitionsError) throw competitionsError

      // 각 대회별 실제 참가자 수 계산
      const competitionsWithCount = await Promise.all(
        (competitionsData || []).map(async (competition) => {
          const { count, error: countError } = await supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .eq('competition_id', competition.id)
            .neq('payment_status', 'cancelled') // 취소된 참가자는 제외

          if (countError) {
            console.error(`대회 ${competition.id} 참가자 수 계산 오류:`, countError)
            return { ...competition, actual_participants: 0 }
          }

          return { ...competition, actual_participants: count || 0 }
        })
      )

      setCompetitions(competitionsWithCount)
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

  // 대회의 current_participants를 실제 DB 값으로 동기화
  const syncParticipantCount = async (competitionId: string) => {
    try {
      const { count, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', competitionId)
        .neq('payment_status', 'cancelled')

      if (countError) throw countError

      const { error: updateError } = await supabase
        .from('competitions')
        .update({ current_participants: count || 0 })
        .eq('id', competitionId)

      if (updateError) throw updateError

      fetchCompetitions()
      alert(`참가자 수가 ${count || 0}명으로 동기화되었습니다.`)
    } catch (error) {
      console.error('참가자 수 동기화 오류:', error)
      alert('참가자 수 동기화 중 오류가 발생했습니다.')
    }
  }

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

  // 참가자 관리 함수들
  const fetchRegistrations = async () => {
    setRegistrationsLoading(true)
    try {
      // 먼저 총 개수를 가져옴 (count)
      let countQuery = supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })

      if (selectedCompetitionForParticipants) {
        countQuery = countQuery.eq('competition_id', selectedCompetitionForParticipants)
      }

      if (paymentStatusFilter !== 'all') {
        countQuery = countQuery.eq('payment_status', paymentStatusFilter)
      }

      if (distanceFilter !== 'all') {
        countQuery = countQuery.eq('distance', distanceFilter)
      }

      if (genderFilter !== 'all') {
        countQuery = countQuery.eq('gender', genderFilter)
      }

      if (participantSearchTerm) {
        countQuery = countQuery.ilike('name', `%${participantSearchTerm}%`)
      }

      const { count } = await countQuery
      setTotalRegistrations(count || 0)

      // 데이터 가져오기
      let query = supabase
        .from('registrations')
        .select(`
          *,
          competitions (
            title,
            date
          )
        `)

      if (selectedCompetitionForParticipants) {
        query = query.eq('competition_id', selectedCompetitionForParticipants)
      }

      if (paymentStatusFilter !== 'all') {
        query = query.eq('payment_status', paymentStatusFilter)
      }

      if (distanceFilter !== 'all') {
        query = query.eq('distance', distanceFilter)
      }

      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter)
      }

      if (participantSearchTerm) {
        query = query.ilike('name', `%${participantSearchTerm}%`)
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // 정렬 처리 및 클라이언트 필터링 (지역, 나이)
      let filtered = data || []

      // 지역 필터 (address 필드에서 검색)
      if (regionFilter !== 'all') {
        filtered = filtered.filter(reg => reg.address?.includes(regionFilter))
      }

      // 나이 필터
      if (ageFilter !== 'all') {
        filtered = filtered.filter(reg => {
          const age = reg.age || 0
          if (ageFilter === '20-29') return age >= 20 && age <= 29
          if (ageFilter === '30-39') return age >= 30 && age <= 39
          if (ageFilter === '40-49') return age >= 40 && age <= 49
          if (ageFilter === '50-59') return age >= 50 && age <= 59
          if (ageFilter === '60+') return age >= 60
          return true
        })
      }

      // 정렬
      if (sortBy === 'created_at') {
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
      } else if (sortBy === 'distance') {
        const distanceOrder = ['3km', '5km', '10km', 'half', 'full']
        filtered.sort((a, b) => {
          const indexA = a.distance ? distanceOrder.indexOf(a.distance) : 999
          const indexB = b.distance ? distanceOrder.indexOf(b.distance) : 999
          return sortOrder === 'asc' ? indexA - indexB : indexB - indexA
        })
      }

      // 페이지네이션 적용
      const startIndex = (currentRegistrationPage - 1) * registrationsPerPage
      const endIndex = startIndex + registrationsPerPage
      setRegistrations(filtered.slice(startIndex, endIndex))
      setTotalRegistrations(filtered.length)
    } catch (error) {
      console.error('참가자 로드 오류:', error)
      setRegistrations([])
      setTotalRegistrations(0)
    } finally {
      setRegistrationsLoading(false)
    }
  }

  // 커뮤니티 게시글 관리 함수들 (회원게시판 - competition_id가 없는 글)
  const fetchCommunityPosts = async () => {
    setPostsLoading(true)
    try {
      const from = (currentPostPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      const { data, error, count } = await supabase
        .from('community_posts_with_author')
        .select('*', { count: 'exact' })
        .is('competition_id', null)  // 회원게시판: competition_id가 null인 게시글만
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

  // 대회 게시글 관리 함수들 (대회별게시판 - competition_id가 있는 글)
  const fetchCompetitionPosts = async () => {
    setPostsLoading(true)
    try {
      const from = (currentPostPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      let query = supabase
        .from('community_posts_with_author')
        .select('*, competitions(title)', { count: 'exact' })
        .not('competition_id', 'is', null)  // 대회별게시판: competition_id가 있는 게시글만
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
      // 모든 게시글은 community_posts 테이블에 저장됨 (competition_id로 구분)

      // 댓글 먼저 삭제
      await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', postId)

      const { error } = await supabase
        .from('community_posts')
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
      const { error } = await supabase
        .from('community_posts')
        .update({ is_notice: !currentStatus })
        .eq('id', postId)

      if (error) throw error

      if (activeTab === 'community') {
        fetchCommunityPosts()
      } else {
        fetchCompetitionPosts()
      }
      alert(`${!currentStatus ? '공지글로 설정' : '일반글로 변경'}되었습니다.`)
    } catch (error) {
      console.error('공지글 설정 오류:', error)
      alert('공지글 설정 중 오류가 발생했습니다.')
    }
  }

  // 참가자 결제 상태 변경
  const updatePaymentStatus = async (registrationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ payment_status: newStatus })
        .eq('id', registrationId)

      if (error) throw error
      fetchRegistrations()
      alert('결제 상태가 변경되었습니다.')
    } catch (error) {
      console.error('결제 상태 변경 오류:', error)
      alert('결제 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 참가 신청 삭제
  const deleteRegistration = async (registrationId: string, registrationName: string) => {
    if (!confirm(`'${registrationName}' 님의 참가 신청을 취소하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      // 페이지에 데이터가 없으면 이전 페이지로
      if (registrations.length === 1 && currentRegistrationPage > 1) {
        setCurrentRegistrationPage(prev => prev - 1)
      } else {
        fetchRegistrations()
      }

      alert('참가 신청이 취소되었습니다.')
    } catch (error) {
      console.error('참가 신청 취소 오류:', error)
      alert('참가 신청 취소 중 오류가 발생했습니다.')
    }
  }

  // 참가자 상세 정보 모달 열기
  const openParticipantModal = (registration: Registration) => {
    setSelectedParticipant(registration)
    setShowParticipantModal(true)
  }

  // 참가자 상세 정보 모달 닫기
  const closeParticipantModal = () => {
    setSelectedParticipant(null)
    setShowParticipantModal(false)
  }

  // 회원 상세 정보 모달 열기
  const openMemberModal = (member: User) => {
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  // 회원 상세 정보 모달 닫기
  const closeMemberModal = () => {
    setSelectedMember(null)
    setShowMemberModal(false)
  }

  // 회원 관리 함수들
  const fetchMembers = async () => {
    setMembersLoading(true)
    try {
      // 먼저 전체 데이터를 가져온 후 클라이언트에서 필터링
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      if (memberGenderFilter !== 'all') {
        query = query.eq('gender', memberGenderFilter)
      }

      const { data, error } = await query
      if (error) throw error

      let filtered = data || []

      // 지역 필터 (클라이언트 측)
      if (memberRegionFilter !== 'all') {
        filtered = filtered.filter(member => member.address1?.includes(memberRegionFilter))
      }

      // 나이 필터 (클라이언트 측)
      if (memberAgeFilter !== 'all') {
        filtered = filtered.filter(member => {
          if (!member.birth_date) return false

          // birth_date 형식: YYMMDD (6자리)
          const yy = parseInt(member.birth_date.substring(0, 2))
          // 2000년대생과 1900년대생 구분
          const birthYear = yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy
          const currentYear = new Date().getFullYear()
          const age = currentYear - birthYear

          if (memberAgeFilter === '20-29') return age >= 20 && age <= 29
          if (memberAgeFilter === '30-39') return age >= 30 && age <= 39
          if (memberAgeFilter === '40-49') return age >= 40 && age <= 49
          if (memberAgeFilter === '50-59') return age >= 50 && age <= 59
          if (memberAgeFilter === '60+') return age >= 60
          return true
        })
      }

      // 대회 미참가자 필터 (클라이언트 측)
      if (memberCompetitionFilter !== 'all') {
        // 선택된 대회의 참가자 목록 가져오기
        const { data: registrationData, error: regError } = await supabase
          .from('registrations')
          .select('user_id')
          .eq('competition_id', memberCompetitionFilter)

        if (regError) {
          console.error('참가자 조회 오류:', regError)
        } else {
          // 참가한 회원의 UUID(id) 배열
          const participantIds = new Set(
            (registrationData || [])
              .map(reg => reg.user_id)
              .filter(Boolean)
          )

          // 참가하지 않은 회원만 필터링 (users.id와 registrations.user_id 비교)
          filtered = filtered.filter(member => !participantIds.has(member.id))
        }
      }

      // 페이지네이션 적용
      setTotalMembers(filtered.length)
      const from = (currentMemberPage - 1) * membersPerPage
      const to = from + membersPerPage
      setMembers(filtered.slice(from, to))
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

  // 회원 목록 CSV 내보내기
  const exportMembersToCSV = async () => {
    try {
      setMembersLoading(true)

      // 필터링된 전체 데이터 가져오기 (페이지네이션 없이)
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      if (memberGenderFilter !== 'all') {
        query = query.eq('gender', memberGenderFilter)
      }

      const { data, error } = await query
      if (error) throw error

      let filtered = data || []

      // 지역 필터
      if (memberRegionFilter !== 'all') {
        filtered = filtered.filter(member => member.address1?.includes(memberRegionFilter))
      }

      // 나이 필터
      if (memberAgeFilter !== 'all') {
        filtered = filtered.filter(member => {
          if (!member.birth_date) return false
          const yy = parseInt(member.birth_date.substring(0, 2))
          const birthYear = yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy
          const currentYear = new Date().getFullYear()
          const age = currentYear - birthYear

          if (memberAgeFilter === '20-29') return age >= 20 && age <= 29
          if (memberAgeFilter === '30-39') return age >= 30 && age <= 39
          if (memberAgeFilter === '40-49') return age >= 40 && age <= 49
          if (memberAgeFilter === '50-59') return age >= 50 && age <= 59
          if (memberAgeFilter === '60+') return age >= 60
          return true
        })
      }

      // 대회 미참가자 필터
      if (memberCompetitionFilter !== 'all') {
        // 선택된 대회의 참가자 목록 가져오기
        const { data: registrationData, error: regError } = await supabase
          .from('registrations')
          .select('user_id')
          .eq('competition_id', memberCompetitionFilter)

        if (regError) {
          console.error('참가자 조회 오류:', regError)
        } else {
          // 참가한 회원의 UUID(id) 배열
          const participantIds = new Set(
            (registrationData || [])
              .map(reg => reg.user_id)
              .filter(Boolean)
          )

          // 참가하지 않은 회원만 필터링 (users.id와 registrations.user_id 비교)
          filtered = filtered.filter(member => !participantIds.has(member.id))
        }
      }

      // CSV 생성
      const csvHeader = '이름,아이디,이메일,전화번호,생년월일,성별,주소,우편번호,등급,기록시간(초),권한,가입일시\n'
      const csvContent = filtered.map(member => {
        const gradeMap: { [key: string]: string } = {
          'cheetah': '치타족',
          'horse': '홀스족',
          'wolf': '울프족',
          'turtle': '터틀족',
          'bolt': '볼타족'
        }
        return [
          member.name || '',
          member.user_id || '',
          member.email || '',
          member.phone || '',
          member.birth_date || '',
          member.gender === 'male' ? '남성' : member.gender === 'female' ? '여성' : '',
          `"${(member.address1 || '') + ' ' + (member.address2 || '')}"`,
          member.postcode || '',
          gradeMap[member.grade] || member.grade || '',
          member.record_time === 999 ? '미기록' : member.record_time || '',
          member.role === 'admin' ? '관리자' : '일반회원',
          formatKST(member.created_at, 'yyyy-MM-dd HH:mm:ss')
        ].join(',')
      }).join('\n')

      // 파일 다운로드
      const blob = new Blob(['\uFEFF' + csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `회원목록_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      alert(`${filtered.length}명의 회원 정보가 다운로드되었습니다.`)
    } catch (error) {
      console.error('CSV 내보내기 오류:', error)
      alert('CSV 내보내기 중 오류가 발생했습니다.')
    } finally {
      setMembersLoading(false)
    }
  }

  // 참가자 목록 CSV 내보내기
  const exportParticipantsToCSV = async () => {
    try {
      setRegistrationsLoading(true)

      // 필터링된 전체 데이터 가져오기 (페이지네이션 없이)
      let query = supabase
        .from('registrations')
        .select(`
          *,
          competitions (
            title,
            date
          )
        `)

      if (selectedCompetitionForParticipants) {
        query = query.eq('competition_id', selectedCompetitionForParticipants)
      }

      if (paymentStatusFilter !== 'all') {
        query = query.eq('payment_status', paymentStatusFilter)
      }

      if (distanceFilter !== 'all') {
        query = query.eq('distance', distanceFilter)
      }

      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter)
      }

      if (participantSearchTerm) {
        query = query.ilike('name', `%${participantSearchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error

      let filtered = data || []

      // 지역 필터
      if (regionFilter !== 'all') {
        filtered = filtered.filter(reg => reg.address?.includes(regionFilter))
      }

      // 나이 필터
      if (ageFilter !== 'all') {
        filtered = filtered.filter(reg => {
          const age = reg.age || 0
          if (ageFilter === '20-29') return age >= 20 && age <= 29
          if (ageFilter === '30-39') return age >= 30 && age <= 39
          if (ageFilter === '40-49') return age >= 40 && age <= 49
          if (ageFilter === '50-59') return age >= 50 && age <= 59
          if (ageFilter === '60+') return age >= 60
          return true
        })
      }

      // CSV 생성
      const csvHeader = '대회명,대회일자,이름,생년월일,나이,성별,전화번호,이메일,주소,신청거리,티셔츠사이즈,결제상태,입금자명,신청일시\n'
      const csvContent = filtered.map(reg => {
        const distanceMap: { [key: string]: string } = {
          '3km': '3km',
          '5km': '5km',
          '10km': '10km',
          'half': '하프',
          'full': '풀코스'
        }
        const paymentMap: { [key: string]: string } = {
          'pending': '대기',
          'confirmed': '확인',
          'cancelled': '취소'
        }
        return [
          `"${reg.competitions?.title || ''}"`,
          reg.competitions?.date || '',
          reg.name || '',
          reg.birth_date || '',
          reg.age || '',
          reg.gender === 'male' ? '남성' : reg.gender === 'female' ? '여성' : '',
          reg.phone || '',
          reg.email || '',
          `"${reg.address || ''}"`,
          distanceMap[reg.distance] || reg.distance || '',
          reg.tshirt_size || '',
          paymentMap[reg.payment_status] || reg.payment_status || '',
          reg.depositor_name || '',
          formatKST(reg.created_at, 'yyyy-MM-dd HH:mm:ss')
        ].join(',')
      }).join('\n')

      // 파일 다운로드
      const blob = new Blob(['\uFEFF' + csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const competitionTitle = selectedCompetitionForParticipants
        ? competitions.find(c => c.id === selectedCompetitionForParticipants)?.title || '전체대회'
        : '전체대회'
      link.download = `참가자목록_${competitionTitle}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      alert(`${filtered.length}명의 참가자 정보가 다운로드되었습니다.`)
    } catch (error) {
      console.error('CSV 내보내기 오류:', error)
      alert('CSV 내보내기 중 오류가 발생했습니다.')
    } finally {
      setRegistrationsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Settings className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">관리자 페이지에 접근하려면 먼저 로그인해주세요.</p>

          <div className="space-y-3">

            <Link
              href="/"
              className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 관리자 권한이 없는 경우
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Settings className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-6">관리자 권한이 있는 회원만 접근할 수 있습니다.</p>
          <p className="text-sm text-gray-500 mb-6">현재 로그인: {user.name} ({user.role === 'user' ? '일반회원' : user.role})</p>

          <div className="space-y-3">
            <Link
              href="/mypage"
              className="block w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              마이페이지로
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
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {(competition as any).actual_participants || 0} / {competition.max_participants}
                                </span>
                                {(competition as any).actual_participants !== competition.current_participants && (
                                  <span className="text-xs text-red-500">
                                    (DB: {(competition as any).actual_participants}, 설정: {competition.current_participants})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(competition.date), 'yyyy.MM.dd')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/competitions/${competition.id}`}
                                  className="text-purple-600 hover:text-purple-800"
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
                                {(competition as any).actual_participants !== competition.current_participants && (
                                  <button
                                    onClick={() => syncParticipantCount(competition.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="참가자 수 동기화"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </button>
                                )}
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">참가자 관리 ({totalRegistrations})</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={exportParticipantsToCSV}
                        disabled={registrationsLoading || totalRegistrations === 0}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Download className="h-4 w-4" />
                        <span>CSV 내보내기</span>
                      </button>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                      >
                        {showFilters ? '필터 숨기기' : '필터 보기'}
                        <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 검색 바 */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="참가자 이름으로 검색..."
                        value={participantSearchTerm}
                        onChange={(e) => setParticipantSearchTerm(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setCurrentRegistrationPage(1)
                            fetchRegistrations()
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setCurrentRegistrationPage(1)
                        fetchRegistrations()
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                    >
                      검색
                    </button>
                    <button
                      onClick={() => {
                        setParticipantSearchTerm('')
                        setSelectedCompetitionForParticipants('')
                        setPaymentStatusFilter('all')
                        setDistanceFilter('all')
                        setRegionFilter('all')
                        setAgeFilter('all')
                        setGenderFilter('all')
                        setSortBy('created_at')
                        setSortOrder('desc')
                        setCurrentRegistrationPage(1)
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
                    >
                      전체 초기화
                    </button>
                  </div>

                  {/* 필터 섹션 */}
                  {showFilters && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      {/* 대회 선택 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">대회</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedCompetitionForParticipants('')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedCompetitionForParticipants === ''
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            전체
                          </button>
                          {competitions.map((competition) => (
                            <button
                              key={competition.id}
                              onClick={() => setSelectedCompetitionForParticipants(competition.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                selectedCompetitionForParticipants === competition.id
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {competition.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 거리 / 결제 상태 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">거리</label>
                          <div className="flex flex-wrap gap-2">
                            {['all', '3km', '5km', '10km', 'half', 'full'].map((distance) => (
                              <button
                                key={distance}
                                onClick={() => setDistanceFilter(distance)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  distanceFilter === distance
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {distance === 'all' ? '전체' : getDistanceLabel(distance)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">결제 상태</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'all', label: '전체' },
                              { value: 'pending', label: '입금대기' },
                              { value: 'confirmed', label: '입금확인' },
                              { value: 'cancelled', label: '취소' }
                            ].map((status) => (
                              <button
                                key={status.value}
                                onClick={() => setPaymentStatusFilter(status.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  paymentStatusFilter === status.value
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 지역 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'all', label: '전체' },
                            { value: '서울', label: '서울' },
                            { value: '경기', label: '경기' },
                            { value: '인천', label: '인천' },
                            { value: '강원', label: '강원' },
                            { value: '충북', label: '충북' },
                            { value: '충남', label: '충남' },
                            { value: '대전', label: '대전' },
                            { value: '세종', label: '세종' },
                            { value: '전북', label: '전북' },
                            { value: '전남', label: '전남' },
                            { value: '광주', label: '광주' },
                            { value: '경북', label: '경북' },
                            { value: '경남', label: '경남' },
                            { value: '대구', label: '대구' },
                            { value: '울산', label: '울산' },
                            { value: '부산', label: '부산' },
                            { value: '제주', label: '제주' }
                          ].map((region) => (
                            <button
                              key={region.value}
                              onClick={() => setRegionFilter(region.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                regionFilter === region.value
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {region.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 나이 / 성별 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">나이</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'all', label: '전체' },
                              { value: '20-29', label: '20-29세' },
                              { value: '30-39', label: '30-39세' },
                              { value: '40-49', label: '40-49세' },
                              { value: '50-59', label: '50-59세' },
                              { value: '60+', label: '60세 이상' }
                            ].map((age) => (
                              <button
                                key={age.value}
                                onClick={() => setAgeFilter(age.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  ageFilter === age.value
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {age.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'all', label: '전체' },
                              { value: 'male', label: '남성' },
                              { value: 'female', label: '여성' }
                            ].map((gender) => (
                              <button
                                key={gender.value}
                                onClick={() => setGenderFilter(gender.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  genderFilter === gender.value
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {gender.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 정렬 옵션 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSortBy('created_at')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sortBy === 'created_at'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              신청일순
                            </button>
                            <button
                              onClick={() => setSortBy('distance')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sortBy === 'distance'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              거리순
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">정렬 순서</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSortOrder('desc')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sortOrder === 'desc'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              내림차순
                            </button>
                            <button
                              onClick={() => setSortOrder('asc')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sortOrder === 'asc'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              오름차순
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                            신청 종목
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            신청일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            결제 상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registrations.map((registration) => {
                          const isNameMismatch = registration.depositor_name &&
                                                 registration.name !== registration.depositor_name
                          return (
                            <tr key={registration.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openParticipantModal(registration)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                  >
                                    {registration.name}
                                  </button>
                                  {isNameMismatch && (
                                    <div className="relative group">
                                      <span className="text-yellow-600 cursor-help">⚠️</span>
                                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-max">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                          입금자: {registration.depositor_name}
                                        </div>
                                        <div className="absolute left-2 top-full w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {registration.competitions?.title || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {registration.distance ? getDistanceLabel(registration.distance) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatKST(registration.created_at, 'yyyy.MM.dd HH:mm')}
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={registration.payment_status}
                                    onChange={(e) => updatePaymentStatus(registration.id, e.target.value)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  >
                                    <option value="pending">입금대기</option>
                                    <option value="confirmed">입금확인</option>
                                    <option value="cancelled">취소</option>
                                  </select>
                                  <button
                                    onClick={() => deleteRegistration(registration.id, registration.name)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="참가 신청 취소"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
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

                {/* 페이지네이션 */}
                {totalRegistrations > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-700">
                          전체 <span className="font-medium">{totalRegistrations}</span>명 중{' '}
                          <span className="font-medium">
                            {(currentRegistrationPage - 1) * registrationsPerPage + 1}
                          </span>
                          -{' '}
                          <span className="font-medium">
                            {Math.min(currentRegistrationPage * registrationsPerPage, totalRegistrations)}
                          </span>
                          명
                        </div>
                        <select
                          value={registrationsPerPage}
                          onChange={(e) => {
                            setRegistrationsPerPage(Number(e.target.value))
                            setCurrentRegistrationPage(1)
                          }}
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                        >
                          <option value={20}>20개씩</option>
                          <option value={50}>50개씩</option>
                          <option value={100}>100개씩</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentRegistrationPage(prev => Math.max(1, prev - 1))}
                          disabled={currentRegistrationPage === 1}
                          className={`px-3 py-1 rounded ${
                            currentRegistrationPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          이전
                        </button>
                        <span className="text-sm text-gray-700">
                          {currentRegistrationPage} / {Math.ceil(totalRegistrations / registrationsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentRegistrationPage(prev =>
                            Math.min(Math.ceil(totalRegistrations / registrationsPerPage), prev + 1)
                          )}
                          disabled={currentRegistrationPage >= Math.ceil(totalRegistrations / registrationsPerPage)}
                          className={`px-3 py-1 rounded ${
                            currentRegistrationPage >= Math.ceil(totalRegistrations / registrationsPerPage)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          다음
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                              <div className="flex items-start space-x-3">
                                {post.is_notice && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                    <Pin className="w-3 h-3 mr-1" />
                                    공지
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setShowPostDetail(true)
                                  }}
                                  className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors text-left"
                                >
                                  {post.title}
                                </button>
                                {post.image_url && (
                                  <span className="text-xs text-blue-600">📷</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{post.author_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {post.competitions ? post.competitions.title : '대회명 없음'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatKST(post.created_at, 'yyyy.MM.dd')}
                              </div>
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
                      const commentCount = (post as any).comment_count || 0
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
                              {formatKST(post.created_at, 'yyyy.MM.dd')}
                            </div>
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">회원 관리 ({totalMembers})</h2>
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
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setMemberCompetitionFilter('all')
                        setMemberRegionFilter('all')
                        setMemberAgeFilter('all')
                        setMemberGenderFilter('all')
                        setCurrentMemberPage(1)
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
                    >
                      전체 초기화
                    </button>
                    <button
                      onClick={exportMembersToCSV}
                      disabled={membersLoading || totalMembers === 0}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    >
                      <Download className="h-4 w-4" />
                      <span>CSV 내보내기</span>
                    </button>
                  </div>
                </div>

                {/* 필터 영역 */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* 대회 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      대회 (미참가자 필터)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setMemberCompetitionFilter('all')
                          setCurrentMemberPage(1)
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          memberCompetitionFilter === 'all'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        전체
                      </button>
                      {competitions.map((competition) => (
                        <button
                          key={competition.id}
                          onClick={() => {
                            setMemberCompetitionFilter(competition.id)
                            setCurrentMemberPage(1)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            memberCompetitionFilter === competition.id
                              ? 'bg-red-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {competition.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 지역 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: '전체' },
                        { value: '서울', label: '서울' },
                        { value: '경기', label: '경기' },
                        { value: '인천', label: '인천' },
                        { value: '강원', label: '강원' },
                        { value: '충북', label: '충북' },
                        { value: '충남', label: '충남' },
                        { value: '대전', label: '대전' },
                        { value: '세종', label: '세종' },
                        { value: '전북', label: '전북' },
                        { value: '전남', label: '전남' },
                        { value: '광주', label: '광주' },
                        { value: '경북', label: '경북' },
                        { value: '경남', label: '경남' },
                        { value: '대구', label: '대구' },
                        { value: '울산', label: '울산' },
                        { value: '부산', label: '부산' },
                        { value: '제주', label: '제주' }
                      ].map((region) => (
                        <button
                          key={region.value}
                          onClick={() => {
                            setMemberRegionFilter(region.value)
                            setCurrentMemberPage(1)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            memberRegionFilter === region.value
                              ? 'bg-red-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {region.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 나이 / 성별 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">나이</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: '전체' },
                          { value: '20-29', label: '20-29세' },
                          { value: '30-39', label: '30-39세' },
                          { value: '40-49', label: '40-49세' },
                          { value: '50-59', label: '50-59세' },
                          { value: '60+', label: '60세 이상' }
                        ].map((age) => (
                          <button
                            key={age.value}
                            onClick={() => {
                              setMemberAgeFilter(age.value)
                              setCurrentMemberPage(1)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              memberAgeFilter === age.value
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {age.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: '전체' },
                          { value: 'male', label: '남성' },
                          { value: 'female', label: '여성' }
                        ].map((gender) => (
                          <button
                            key={gender.value}
                            onClick={() => {
                              setMemberGenderFilter(gender.value)
                              setCurrentMemberPage(1)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              memberGenderFilter === gender.value
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {gender.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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
                          <button
                            onClick={() => openMemberModal(member)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                          >
                            {member.name}
                          </button>
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
                          {formatKST(member.created_at, 'yyyy.MM.dd')}
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

            {totalMembers > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-700">
                      전체 <span className="font-medium">{totalMembers}</span>명 중{' '}
                      <span className="font-medium">
                        {(currentMemberPage - 1) * membersPerPage + 1}
                      </span>
                      -{' '}
                      <span className="font-medium">
                        {Math.min(currentMemberPage * membersPerPage, totalMembers)}
                      </span>
                      명
                    </div>
                    <select
                      value={membersPerPage}
                      onChange={(e) => {
                        setMembersPerPage(Number(e.target.value))
                        setCurrentMemberPage(1)
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                      <option value={20}>20개씩</option>
                      <option value={50}>50개씩</option>
                      <option value={100}>100개씩</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentMemberPage(prev => Math.max(1, prev - 1))}
                      disabled={currentMemberPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentMemberPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-700">
                      {currentMemberPage} / {Math.ceil(totalMembers / membersPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentMemberPage(prev =>
                        Math.min(Math.ceil(totalMembers / membersPerPage), prev + 1)
                      )}
                      disabled={currentMemberPage >= Math.ceil(totalMembers / membersPerPage)}
                      className={`px-3 py-1 rounded ${
                        currentMemberPage >= Math.ceil(totalMembers / membersPerPage)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      다음
                    </button>
                  </div>
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
          if (activeTab === 'community') {
            fetchCommunityPosts()
          } else {
            fetchCompetitionPosts()
          }
        }}
        onPostDeleted={() => {
          if (activeTab === 'community') {
            fetchCommunityPosts()
          } else {
            fetchCompetitionPosts()
          }
        }}
        isAdminView={true}
      />

      {/* 로그인 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
        onSuccess={() => setShowAuthModal(false)}
      />

      {/* 회원 상세 정보 모달 */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">회원 상세 정보</h2>
              <button
                onClick={closeMemberModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">이름</label>
                    <p className="text-base text-gray-900">{selectedMember.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">아이디</label>
                    <p className="text-base text-gray-900">{selectedMember.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
                    <p className="text-base text-gray-900 break-all">{selectedMember.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">연락처</label>
                    <p className="text-base text-gray-900">{selectedMember.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">생년월일</label>
                    <p className="text-base text-gray-900">{selectedMember.birth_date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">성별</label>
                    <p className="text-base text-gray-900">
                      {selectedMember.gender === 'male' ? '남성' : '여성'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 주소 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">주소</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">우편번호</label>
                    <p className="text-base text-gray-900">{selectedMember.postal_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">주소</label>
                    <p className="text-base text-gray-900">{selectedMember.address1}</p>
                    {selectedMember.address2 && (
                      <p className="text-base text-gray-900 mt-1">{selectedMember.address2}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeMemberModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 참가자 상세 정보 모달 */}
      {showParticipantModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">참가자 상세 정보</h2>
              <button
                onClick={closeParticipantModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">이름</label>
                    <p className="text-base text-gray-900">{selectedParticipant.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
                    <p className="text-base text-gray-900 break-all">{selectedParticipant.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">연락처</label>
                    <p className="text-base text-gray-900">{selectedParticipant.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">생년월일</label>
                    <p className="text-base text-gray-900">{selectedParticipant.birth_date || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">나이</label>
                    <p className="text-base text-gray-900">{selectedParticipant.age}세</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">성별</label>
                    <p className="text-base text-gray-900">
                      {selectedParticipant.gender === 'male' ? '남성' : '여성'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 주소 정보 */}
              {selectedParticipant.address && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">주소</h3>
                  <div>
                    <p className="text-base text-gray-900">{selectedParticipant.address}</p>
                  </div>
                </div>
              )}

              {/* 대회 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">대회 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">대회명</label>
                    <p className="text-base text-gray-900">
                      {selectedParticipant.competitions?.title || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">신청 종목</label>
                    <p className="text-base text-blue-600 font-medium">
                      {selectedParticipant.distance ? getDistanceLabel(selectedParticipant.distance) : '-'}
                    </p>
                  </div>
                  {selectedParticipant.competitions?.date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">대회 일자</label>
                      <p className="text-base text-gray-900">
                        {format(new Date(selectedParticipant.competitions.date), 'yyyy년 MM월 dd일')}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">신청일시</label>
                    <p className="text-base text-gray-900">
                      {formatKST(selectedParticipant.created_at, 'yyyy.MM.dd HH:mm')}
                    </p>
                  </div>
                  {selectedParticipant.shirt_size && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">티셔츠 사이즈</label>
                      <p className="text-base text-gray-900">{selectedParticipant.shirt_size}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">입금자명</label>
                    <p className="text-base text-gray-900">{selectedParticipant.depositor_name || '-'}</p>
                  </div>
                  {selectedParticipant.entry_fee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">참가비</label>
                      <p className="text-base text-gray-900">
                        {selectedParticipant.entry_fee.toLocaleString()}원
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">결제 상태</label>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedParticipant.payment_status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : selectedParticipant.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedParticipant.payment_status === 'confirmed' ? '입금확인' :
                         selectedParticipant.payment_status === 'pending' ? '입금대기' : '취소'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 기타 정보 */}
              {selectedParticipant.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">기타 내용</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-base text-gray-900 whitespace-pre-wrap">
                      {selectedParticipant.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeParticipantModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}