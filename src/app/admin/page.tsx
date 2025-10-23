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
  Download,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition, Registration, CompetitionPost, User, Popup } from '@/types'
import { format } from 'date-fns'
import { formatKST, toDatetimeLocal, fromDatetimeLocal } from '@/lib/dateUtils'
import PostDetailModal from '@/components/PostDetailModal'
import AuthModal from '@/components/AuthModal'
import ImageUpload from '@/components/ImageUpload'
import PopupImageUpload from '@/components/PopupImageUpload'

export default function AdminPage() {
  const { user, getGradeInfo } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'competitions' | 'community' | 'members' | 'popups'>('competitions')
  const [competitionSubTab, setCompetitionSubTab] = useState<'management' | 'participants' | 'boards'>('management')
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 팝업 관리 관련 상태
  const [popups, setPopups] = useState<Popup[]>([])
  const [popupsLoading, setPopupsLoading] = useState(false)
  const [showPopupModal, setShowPopupModal] = useState(false)
  const [selectedPopup, setSelectedPopup] = useState<Popup | null>(null)
  const [isEditingPopup, setIsEditingPopup] = useState(false)
  const [popupTitle, setPopupTitle] = useState('')
  const [popupImageUrl, setPopupImageUrl] = useState('')
  const [popupStartDate, setPopupStartDate] = useState('')
  const [popupEndDate, setPopupEndDate] = useState('')
  const [popupDisplayPage, setPopupDisplayPage] = useState<'all' | 'home' | 'competition'>('all')
  const [popupCompetitionId, setPopupCompetitionId] = useState<string>('')
  const [popupIsActive, setPopupIsActive] = useState(true)

  // 대회 관리 관련 상태
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionsLoading, setCompetitionsLoading] = useState(false)
  const [selectedCompetitionForGroups, setSelectedCompetitionForGroups] = useState<Competition | null>(null)
  const [showGroupsModal, setShowGroupsModal] = useState(false)
  const [participationGroups, setParticipationGroups] = useState<any[]>([])

  // 참가자 관리 관련 상태
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [selectedCompetitionForParticipants, setSelectedCompetitionForParticipants] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [distanceFilter, setDistanceFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [ageFilter, setAgeFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [shirtSizeFilter, setShirtSizeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'distance'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null)
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [isEditingParticipant, setIsEditingParticipant] = useState(false)
  const [editedParticipant, setEditedParticipant] = useState<Registration | null>(null)
  const [currentRegistrationPage, setCurrentRegistrationPage] = useState(1)
  const [totalRegistrations, setTotalRegistrations] = useState(0)
  const [registrationsPerPage, setRegistrationsPerPage] = useState(20)
  const [participantSearchTerm, setParticipantSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [availableParticipationGroups, setAvailableParticipationGroups] = useState<any[]>([])

  // 회원 상세 정보 모달
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [isEditingMember, setIsEditingMember] = useState(false)
  const [editedMember, setEditedMember] = useState<User | null>(null)

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
  const [memberGradeFilter, setMemberGradeFilter] = useState<string>('all')

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
      } else if (activeTab === 'popups') {
        fetchPopups()
        // 팝업 관리에서도 대회 목록이 필요 (대회 선택용)
        fetchCompetitions()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, competitionSubTab, selectedCompetitionForParticipants, selectedCompetitionForPosts, paymentStatusFilter, distanceFilter, regionFilter, ageFilter, genderFilter, gradeFilter, shirtSizeFilter, sortBy, sortOrder, currentRegistrationPage, participantSearchTerm, registrationsPerPage])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'community') {
      fetchCommunityPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPostPage, user, activeTab])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'competitions' && competitionSubTab === 'boards') {
      fetchCompetitionPosts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPostPage, user, activeTab, competitionSubTab, selectedCompetitionForPosts])

  useEffect(() => {
    if (user && user.role === 'admin' && activeTab === 'members') {
      fetchMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberPage, membersPerPage, user, activeTab, searchTerm, memberCompetitionFilter, memberRegionFilter, memberAgeFilter, memberGenderFilter, memberGradeFilter])


  // 팝업 관리 함수들
  const fetchPopups = async () => {
    setPopupsLoading(true)
    try {
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPopups(data || [])
    } catch (error) {
      console.error('팝업 조회 오류:', error)
      alert('팝업을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setPopupsLoading(false)
    }
  }

  const handleCreatePopup = () => {
    setIsEditingPopup(false)
    setSelectedPopup(null)
    setPopupTitle('')
    setPopupImageUrl('')
    setPopupStartDate('')
    setPopupEndDate('')
    setPopupDisplayPage('home')
    setPopupCompetitionId('')
    setPopupIsActive(true)
    setShowPopupModal(true)
  }

  const handleEditPopup = (popup: Popup) => {
    setIsEditingPopup(true)
    setSelectedPopup(popup)
    setPopupTitle(popup.title)
    setPopupImageUrl(popup.content_image_url)
    setPopupStartDate(toDatetimeLocal(popup.start_date))
    setPopupEndDate(toDatetimeLocal(popup.end_date))
    setPopupDisplayPage(popup.display_page)
    setPopupCompetitionId(popup.competition_id || '')
    setPopupIsActive(popup.is_active)
    setShowPopupModal(true)
  }

  const handleSavePopup = async () => {
    if (!popupTitle.trim()) {
      alert('팝업 제목을 입력해주세요.')
      return
    }
    if (!popupImageUrl.trim()) {
      alert('팝업 이미지를 업로드해주세요.')
      return
    }
    if (!popupStartDate) {
      alert('시작 일시를 선택해주세요.')
      return
    }
    if (!popupEndDate) {
      alert('종료 일시를 선택해주세요.')
      return
    }
    if (new Date(popupStartDate) >= new Date(popupEndDate)) {
      alert('종료 일시는 시작 일시보다 나중이어야 합니다.')
      return
    }
    if (popupDisplayPage === 'competition' && !popupCompetitionId) {
      alert('대회를 선택해주세요.')
      return
    }

    try {
      const popupData = {
        title: popupTitle,
        content_image_url: popupImageUrl,
        start_date: fromDatetimeLocal(popupStartDate),
        end_date: fromDatetimeLocal(popupEndDate),
        display_page: popupDisplayPage,
        competition_id: popupDisplayPage === 'competition' ? popupCompetitionId : null,
        is_active: popupIsActive
      }

      if (isEditingPopup && selectedPopup) {
        const { error } = await supabase
          .from('popups')
          .update(popupData)
          .eq('id', selectedPopup.id)

        if (error) throw error
        alert('팝업이 수정되었습니다.')
      } else {
        const { error } = await supabase
          .from('popups')
          .insert(popupData)

        if (error) throw error
        alert('팝업이 등록되었습니다.')
      }

      setShowPopupModal(false)
      fetchPopups()
    } catch (error) {
      console.error('팝업 저장 오류:', error)
      alert('팝업 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDeletePopup = async (popupId: string) => {
    if (!confirm('정말 이 팝업을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', popupId)

      if (error) throw error
      alert('팝업이 삭제되었습니다.')
      fetchPopups()
    } catch (error) {
      console.error('팝업 삭제 오류:', error)
      alert('팝업 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleTogglePopupActive = async (popup: Popup) => {
    try {
      const { error } = await supabase
        .from('popups')
        .update({ is_active: !popup.is_active })
        .eq('id', popup.id)

      if (error) throw error
      fetchPopups()
    } catch (error) {
      console.error('팝업 활성화 토글 오류:', error)
      alert('팝업 활성화 상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 대회 관리 함수들
  const fetchCompetitions = async () => {
    setCompetitionsLoading(true)
    try {
      // Supabase는 한 번에 최대 1000개만 반환하므로 여러 번 나눠서 가져오기
      let allCompetitions: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allCompetitions = [...allCompetitions, ...data]
          offset += pageSize

          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      // 각 대회별 실제 참가자 수 계산
      const competitionsWithCount = await Promise.all(
        allCompetitions.map(async (competition) => {
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

  // 종목별 참가자 수 조회
  const showParticipationGroups = async (competition: Competition) => {
    try {
      // 참가 그룹 정보 가져오기 (1000개씩 여러 번 조회)
      let allGroups: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('participation_groups')
          .select('*')
          .eq('competition_id', competition.id)
          .order('distance', { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allGroups = [...allGroups, ...data]
          offset += pageSize

          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      // 각 그룹별 실제 DB 참가자 수 계산
      const groupsWithCount = await Promise.all(
        allGroups.map(async (group) => {
          const { count, error: countError } = await supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .eq('competition_id', competition.id)
            .eq('participation_group_id', group.id)
            .neq('payment_status', 'cancelled')

          if (countError) {
            console.error(`그룹 ${group.id} 참가자 수 계산 오류:`, countError)
            return { ...group, actual_participants: 0 }
          }

          return { ...group, actual_participants: count || 0 }
        })
      )

      // participation_group_id가 NULL인 레코드 확인
      const { count: nullGroupCount, error: nullCountError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', competition.id)
        .is('participation_group_id', null)
        .neq('payment_status', 'cancelled')

      if (nullCountError) {
        console.error('NULL 그룹 참가자 수 계산 오류:', nullCountError)
      }

      // NULL 그룹이 있으면 목록에 추가
      const finalGroups = [...groupsWithCount]
      if (nullGroupCount && nullGroupCount > 0) {
        finalGroups.push({
          id: 'null-group',
          name: '미분류 (그룹 미지정)',
          distance: '-',
          entry_fee: 0,
          max_participants: 0,
          current_participants: 0,
          actual_participants: nullGroupCount,
          competition_id: competition.id
        })
      }

      setParticipationGroups(finalGroups)
      setSelectedCompetitionForGroups(competition)
      setShowGroupsModal(true)
    } catch (error) {
      console.error('종목별 참가자 수 조회 오류:', error)
      alert('종목별 참가자 수 조회 중 오류가 발생했습니다.')
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
        countQuery = countQuery.or(`name.ilike.%${participantSearchTerm}%,email.ilike.%${participantSearchTerm}%,phone.ilike.%${participantSearchTerm}%`)
      }

      const { count } = await countQuery
      setTotalRegistrations(count || 0)

      // Supabase는 한 번에 최대 1000개만 반환하므로 여러 번 나눠서 가져오기
      let allData: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            *,
            competitions (
              title,
              date
            ),
            users (
              grade
            )
          `)
          .range(offset, offset + pageSize - 1)

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          offset += pageSize

          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      // 정렬 처리 및 클라이언트 필터링
      let filtered = allData

      // 대회 필터
      if (selectedCompetitionForParticipants) {
        filtered = filtered.filter(reg => reg.competition_id === selectedCompetitionForParticipants)
      }

      // 결제 상태 필터
      if (paymentStatusFilter !== 'all') {
        filtered = filtered.filter(reg => reg.payment_status === paymentStatusFilter)
      }

      // 거리 필터
      if (distanceFilter !== 'all') {
        filtered = filtered.filter(reg => reg.distance === distanceFilter)
      }

      // 성별 필터
      if (genderFilter !== 'all') {
        filtered = filtered.filter(reg => reg.gender === genderFilter)
      }

      // 종족(grade) 필터 - users 테이블 JOIN 데이터 사용
      if (gradeFilter !== 'all') {
        filtered = filtered.filter(reg => {
          // users가 있고 grade가 일치하는 경우만
          return reg.users && reg.users.grade === gradeFilter
        })
      }

      // 티셔츠 사이즈 필터
      if (shirtSizeFilter !== 'all') {
        filtered = filtered.filter(reg => reg.shirt_size === shirtSizeFilter)
      }

      // 검색어 필터
      if (participantSearchTerm) {
        const searchLower = participantSearchTerm.toLowerCase()
        filtered = filtered.filter(reg =>
          reg.name?.toLowerCase().includes(searchLower) ||
          reg.email?.toLowerCase().includes(searchLower) ||
          reg.phone?.includes(participantSearchTerm)
        )
      }

      // 지역 필터 (address 필드에서 검색)
      if (regionFilter !== 'all') {
        filtered = filtered.filter(reg => reg.address?.includes(regionFilter))
      }

      // 나이 필터
      if (ageFilter !== 'all') {
        filtered = filtered.filter(reg => {
          const age = reg.age || 0
          if (ageFilter === '0-19') return age <= 19
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

  // 대회 게시글 관리 함수들 (요청게시판 - competition_id가 있는 글)
  const fetchCompetitionPosts = async () => {
    setPostsLoading(true)
    try {
      const from = (currentPostPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      let query = supabase
        .from('community_posts_with_author')
        .select('*, competitions(title)', { count: 'exact' })
        .not('competition_id', 'is', null)  // 요청게시판: competition_id가 있는 게시글만
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
      // 삭제 전 competition_id, participation_group_id, payment_status 가져오기
      const { data: registration, error: fetchError } = await supabase
        .from('registrations')
        .select('competition_id, participation_group_id, payment_status')
        .eq('id', registrationId)
        .single()

      if (fetchError) throw fetchError

      // 참가 신청 삭제
      const { error: deleteError } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)

      if (deleteError) throw deleteError

      // current_participants 자동 감소 (취소된 신청이 아닌 경우만)
      if (registration?.competition_id && registration?.payment_status !== 'cancelled') {
        // 대회 전체 참가자 수 감소
        const { data: competition, error: fetchCompError } = await supabase
          .from('competitions')
          .select('current_participants')
          .eq('id', registration.competition_id)
          .single()

        if (!fetchCompError && competition) {
          const newCount = Math.max(0, competition.current_participants - 1)

          const { error: updateError } = await supabase
            .from('competitions')
            .update({ current_participants: newCount })
            .eq('id', registration.competition_id)

          if (updateError) {
            console.error('대회 참가자 수 업데이트 오류:', updateError)
          }
        }

        // 참가 그룹 참가자 수 감소
        if (registration?.participation_group_id) {
          const { data: group, error: fetchGroupError } = await supabase
            .from('participation_groups')
            .select('current_participants')
            .eq('id', registration.participation_group_id)
            .single()

          if (!fetchGroupError && group) {
            const newGroupCount = Math.max(0, group.current_participants - 1)

            const { error: updateGroupError } = await supabase
              .from('participation_groups')
              .update({ current_participants: newGroupCount })
              .eq('id', registration.participation_group_id)

            if (updateGroupError) {
              console.error('그룹 참가자 수 업데이트 오류:', updateGroupError)
            }
          }
        }
      }

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
  const openParticipantModal = async (registration: Registration) => {
    setSelectedParticipant(registration)
    setShowParticipantModal(true)

    // 해당 대회의 참가 그룹 정보 가져오기
    if (registration.competition_id) {
      try {
        const { data, error } = await supabase
          .from('participation_groups')
          .select('*')
          .eq('competition_id', registration.competition_id)
          .order('distance', { ascending: true })

        if (error) {
          console.error('참가 그룹 조회 오류:', error)
        } else {
          setAvailableParticipationGroups(data || [])
        }
      } catch (error) {
        console.error('참가 그룹 조회 중 오류:', error)
      }
    }
  }

  // 참가자 상세 정보 모달 닫기
  const closeParticipantModal = () => {
    setSelectedParticipant(null)
    setShowParticipantModal(false)
    setIsEditingParticipant(false)
    setEditedParticipant(null)
    setAvailableParticipationGroups([])
  }

  // 참가자 정보 수정 시작
  const startEditingParticipant = () => {
    setIsEditingParticipant(true)
    setEditedParticipant(selectedParticipant)
  }

  // 참가자 정보 수정 취소
  const cancelEditingParticipant = () => {
    setIsEditingParticipant(false)
    setEditedParticipant(null)
  }

  // 나이 계산 함수 (YYMMDD 또는 YYYYMMDD 형식 지원)
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0

    // 공백 제거
    birthDate = birthDate.trim()

    let year: number, month: number, day: number

    // 8자리 (YYYYMMDD) 형식인 경우
    if (birthDate.length === 8) {
      year = parseInt(birthDate.substring(0, 4))
      month = parseInt(birthDate.substring(4, 6))
      day = parseInt(birthDate.substring(6, 8))
    }
    // 6자리 (YYMMDD) 형식인 경우
    else if (birthDate.length === 6) {
      const yy = parseInt(birthDate.substring(0, 2))
      month = parseInt(birthDate.substring(2, 4))
      day = parseInt(birthDate.substring(4, 6))

      // 2000년대/1900년대 구분 (현재 연도 기준)
      const currentYear = new Date().getFullYear()
      const century = yy <= (currentYear % 100) ? 2000 : 1900
      year = century + yy
    } else {
      return 0
    }

    const today = new Date()
    const birthDateObj = new Date(year, month - 1, day)

    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    return age
  }

  // 생년월일 변경 핸들러 (나이 자동 재계산)
  const handleBirthDateChange = (birthDate: string) => {
    if (!editedParticipant) return

    // 숫자만 입력 허용
    const numericValue = birthDate.replace(/[^0-9]/g, '')

    // 6자리 또는 8자리로 제한
    const limitedValue = numericValue.slice(0, 8)

    // 8자리(YYYYMMDD)인 경우 6자리(YYMMDD)로 변환
    let finalValue = limitedValue
    if (limitedValue.length === 8) {
      // YYYY를 YY로 변환 (뒤의 두 자리만 사용)
      finalValue = limitedValue.substring(2)
    }

    // 나이 계산 (원본 8자리 또는 6자리로 계산)
    const calculatedAge = calculateAge(limitedValue)

    setEditedParticipant({
      ...editedParticipant,
      birth_date: finalValue,
      age: calculatedAge
    })
  }

  // 신청 종목 변경 핸들러
  const handleParticipationGroupChange = (groupId: string) => {
    if (!editedParticipant) return

    const selectedGroup = availableParticipationGroups.find(g => g.id === groupId)

    if (selectedGroup) {
      setEditedParticipant({
        ...editedParticipant,
        participation_group_id: groupId,
        entry_fee: selectedGroup.entry_fee,
        distance: selectedGroup.distance
      })
    }
  }

  // 참가자 정보 저장
  const saveParticipantChanges = async () => {
    if (!editedParticipant || !selectedParticipant) return

    // 생년월일 유효성 검사 (6자리 형식만 저장됨)
    if (editedParticipant.birth_date) {
      const birthDate = editedParticipant.birth_date.trim()
      if (birthDate.length !== 6) {
        alert('생년월일은 6자리(YYMMDD) 형식이어야 합니다.')
        return
      }
    }

    try {
      // 신청 종목이 변경되었는지 확인
      const groupChanged = selectedParticipant.participation_group_id !== editedParticipant.participation_group_id

      if (groupChanged && selectedParticipant.participation_group_id) {
        // 기존 그룹의 참가자 수 감소
        const { data: oldGroup, error: fetchOldGroupError } = await supabase
          .from('participation_groups')
          .select('current_participants')
          .eq('id', selectedParticipant.participation_group_id)
          .single()

        if (!fetchOldGroupError && oldGroup) {
          await supabase
            .from('participation_groups')
            .update({ current_participants: Math.max(0, oldGroup.current_participants - 1) })
            .eq('id', selectedParticipant.participation_group_id)
        }
      }

      // 참가자 정보 업데이트
      const { error } = await supabase
        .from('registrations')
        .update({
          email: editedParticipant.email,
          phone: editedParticipant.phone,
          birth_date: editedParticipant.birth_date,
          age: editedParticipant.age,
          gender: editedParticipant.gender,
          address: editedParticipant.address,
          shirt_size: editedParticipant.shirt_size,
          depositor_name: editedParticipant.depositor_name,
          notes: editedParticipant.notes,
          participation_group_id: editedParticipant.participation_group_id,
          entry_fee: editedParticipant.entry_fee,
          distance: editedParticipant.distance
        })
        .eq('id', editedParticipant.id)

      if (error) throw error

      if (groupChanged && editedParticipant.participation_group_id) {
        // 새 그룹의 참가자 수 증가
        const { data: newGroup, error: fetchNewGroupError } = await supabase
          .from('participation_groups')
          .select('current_participants')
          .eq('id', editedParticipant.participation_group_id)
          .single()

        if (!fetchNewGroupError && newGroup) {
          await supabase
            .from('participation_groups')
            .update({ current_participants: newGroup.current_participants + 1 })
            .eq('id', editedParticipant.participation_group_id)
        }
      }

      alert('참가자 정보가 수정되었습니다.')
      setSelectedParticipant(editedParticipant)
      setIsEditingParticipant(false)
      fetchRegistrations() // 목록 새로고침
    } catch (error) {
      console.error('Error updating participant:', error)
      alert('참가자 정보 수정 중 오류가 발생했습니다.')
    }
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
    setIsEditingMember(false)
    setEditedMember(null)
  }

  // 회원 정보 수정 시작
  const startEditingMember = () => {
    setIsEditingMember(true)
    setEditedMember(selectedMember)
  }

  // 회원 정보 수정 취소
  const cancelEditingMember = () => {
    setIsEditingMember(false)
    setEditedMember(null)
  }

  // 회원 정보 저장
  const saveMemberChanges = async () => {
    if (!editedMember) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: editedMember.email,
          phone: editedMember.phone,
          birth_date: editedMember.birth_date,
          gender: editedMember.gender,
          postal_code: editedMember.postal_code,
          address1: editedMember.address1,
          address2: editedMember.address2,
        })
        .eq('id', editedMember.id)

      if (error) throw error

      alert('회원 정보가 수정되었습니다.')
      setSelectedMember(editedMember)
      setIsEditingMember(false)
      fetchMembers() // 목록 새로고침
    } catch (error) {
      console.error('Error updating member:', error)
      alert('회원 정보 수정 중 오류가 발생했습니다.')
    }
  }

  // 회원 관리 함수들
  const fetchMembers = async () => {
    setMembersLoading(true)
    try {
      // Supabase는 한 번에 최대 1000개만 반환하므로 여러 번 나눠서 가져오기
      let allData: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          offset += pageSize

          // 가져온 데이터가 pageSize보다 적으면 마지막 페이지
          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      let filtered = allData

      // 검색어 필터 (클라이언트 측)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(member =>
          member.name?.toLowerCase().includes(searchLower) ||
          member.user_id?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.phone?.includes(searchTerm)
        )
      }

      // 성별 필터 (클라이언트 측)
      if (memberGenderFilter !== 'all') {
        filtered = filtered.filter(member => member.gender === memberGenderFilter)
      }

      // 종족(grade) 필터 (클라이언트 측)
      if (memberGradeFilter !== 'all') {
        filtered = filtered.filter(member => member.grade === memberGradeFilter)
      }

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

          if (memberAgeFilter === '0-19') return age <= 19
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
        // 선택된 대회의 참가자 목록 가져오기 (1000개씩 여러 번 조회)
        let allRegistrations: any[] = []
        let offset = 0
        const pageSize = 1000
        let hasMore = true

        while (hasMore) {
          const { data, error } = await supabase
            .from('registrations')
            .select('user_id')
            .eq('competition_id', memberCompetitionFilter)
            .range(offset, offset + pageSize - 1)

          if (error) {
            console.error('참가자 조회 오류:', error)
            break
          }

          if (data && data.length > 0) {
            allRegistrations = [...allRegistrations, ...data]
            offset += pageSize

            if (data.length < pageSize) {
              hasMore = false
            }
          } else {
            hasMore = false
          }
        }

        // 참가한 회원의 UUID(id) 배열
        const participantIds = new Set(
          allRegistrations
            .map(reg => reg.user_id)
            .filter(Boolean)
        )

        // 참가하지 않은 회원만 필터링 (users.id와 registrations.user_id 비교)
        filtered = filtered.filter(member => !participantIds.has(member.id))
      }

      // 페이지네이션 적용
      setTotalMembers(filtered.length)
      const startIndex = (currentMemberPage - 1) * membersPerPage
      const endIndex = startIndex + membersPerPage
      setMembers(filtered.slice(startIndex, endIndex))
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

      // Supabase는 한 번에 최대 1000개만 반환하므로 여러 번 나눠서 가져오기
      let allData: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1)

        if (error) throw error

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          offset += pageSize

          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      let filtered = allData

      // 검색어 필터 (클라이언트 측)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter(member =>
          member.name?.toLowerCase().includes(searchLower) ||
          member.user_id?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.phone?.includes(searchTerm)
        )
      }

      // 성별 필터 (클라이언트 측)
      if (memberGenderFilter !== 'all') {
        filtered = filtered.filter(member => member.gender === memberGenderFilter)
      }

      // 종족(grade) 필터 (클라이언트 측)
      if (memberGradeFilter !== 'all') {
        filtered = filtered.filter(member => member.grade === memberGradeFilter)
      }

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

          if (memberAgeFilter === '0-19') return age <= 19
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
        // 선택된 대회의 참가자 목록 가져오기 (1000개씩 여러 번 조회)
        let allRegistrations: any[] = []
        let regOffset = 0
        const regPageSize = 1000
        let regHasMore = true

        while (regHasMore) {
          const { data, error } = await supabase
            .from('registrations')
            .select('user_id')
            .eq('competition_id', memberCompetitionFilter)
            .range(regOffset, regOffset + regPageSize - 1)

          if (error) {
            console.error('참가자 조회 오류:', error)
            break
          }

          if (data && data.length > 0) {
            allRegistrations = [...allRegistrations, ...data]
            regOffset += regPageSize

            if (data.length < regPageSize) {
              regHasMore = false
            }
          } else {
            regHasMore = false
          }
        }

        // 참가한 회원의 UUID(id) 배열
        const participantIds = new Set(
          allRegistrations
            .map(reg => reg.user_id)
            .filter(Boolean)
        )

        // 참가하지 않은 회원만 필터링 (users.id와 registrations.user_id 비교)
        filtered = filtered.filter(member => !participantIds.has(member.id))
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

      // Supabase는 한 번에 최대 1000개만 반환하므로 여러 번 나눠서 가져오기
      let allData: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from('registrations')
          .select(`
            *,
            competitions (
              title,
              date
            ),
            users (
              grade
            )
          `)
          .range(offset, offset + pageSize - 1)

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
          query = query.or(`name.ilike.%${participantSearchTerm}%,email.ilike.%${participantSearchTerm}%,phone.ilike.%${participantSearchTerm}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          offset += pageSize

          if (data.length < pageSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      let filtered = allData

      // 종족(grade) 필터
      if (gradeFilter !== 'all') {
        filtered = filtered.filter(reg => {
          return reg.users && reg.users.grade === gradeFilter
        })
      }

      // 지역 필터
      if (regionFilter !== 'all') {
        filtered = filtered.filter(reg => reg.address?.includes(regionFilter))
      }

      // 나이 필터
      if (ageFilter !== 'all') {
        filtered = filtered.filter(reg => {
          const age = reg.age || 0
          if (ageFilter === '0-19') return age <= 19
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mr-2 sm:mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs sm:text-sm text-gray-600">
                관리자: <span className="font-medium text-gray-900">{user.name}</span>
              </div>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('competitions')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                  activeTab === 'competitions'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                대회 관리
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                  activeTab === 'community'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                게시판 관리
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                  activeTab === 'members'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                회원 관리
              </button>
              <button
                onClick={() => setActiveTab('popups')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                  activeTab === 'popups'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                팝업 관리
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'competitions' && (
          <div className="bg-white rounded-lg shadow">
            {/* 대회관리 서브탭 */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
              <nav className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => setCompetitionSubTab('management')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    competitionSubTab === 'management'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 inline" />
                  대회
                </button>
                <button
                  onClick={() => setCompetitionSubTab('participants')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    competitionSubTab === 'participants'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 inline" />
                  참가자
                </button>
                <button
                  onClick={() => setCompetitionSubTab('boards')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    competitionSubTab === 'boards'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 inline" />
  요청게시판
                </button>
              </nav>
            </div>

            {/* 대회 관리 */}
            {competitionSubTab === 'management' && (
              <>
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">대회 관리</h2>
                  <Link
                    href="/admin/competitions/new"
                    className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center text-xs sm:text-sm w-full sm:w-auto justify-center"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
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
                                <button
                                  onClick={() => showParticipationGroups(competition)}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                >
                                  {(competition as any).actual_participants || 0} / {competition.max_participants}
                                </button>
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
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">참가자 관리 ({totalRegistrations})</h2>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={exportParticipantsToCSV}
                        disabled={registrationsLoading || totalRegistrations === 0}
                        className="flex items-center space-x-1.5 sm:space-x-2 bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>CSV 내보내기</span>
                      </button>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 sm:px-0"
                      >
                        {showFilters ? '필터 숨기기' : '필터 보기'}
                        <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 검색 바 */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                    <div className="relative flex-1 sm:max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="참가자 이름, 이메일, 연락처로 검색..."
                        value={participantSearchTerm}
                        onChange={(e) => setParticipantSearchTerm(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setCurrentRegistrationPage(1)
                            fetchRegistrations()
                          }
                        }}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base text-gray-900 placeholder-gray-500 bg-white"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setCurrentRegistrationPage(1)
                        fetchRegistrations()
                      }}
                      className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
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
                              { value: '0-19', label: '19세 이하' },
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">종족</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'all', label: '전체' },
                              { value: 'cheetah', label: '치타족' },
                              { value: 'horse', label: '홀스족' },
                              { value: 'wolf', label: '울프족' },
                              { value: 'turtle', label: '터틀족' }
                            ].map((grade) => (
                              <button
                                key={grade.value}
                                onClick={() => setGradeFilter(grade.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  gradeFilter === grade.value
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {grade.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">티셔츠 사이즈</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 'all', label: '전체' },
                              { value: 'S', label: 'S' },
                              { value: 'M', label: 'M' },
                              { value: 'L', label: 'L' },
                              { value: 'XL', label: 'XL' },
                              { value: 'XXL', label: 'XXL' }
                            ].map((size) => (
                              <button
                                key={size.value}
                                onClick={() => setShirtSizeFilter(size.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  shirtSizeFilter === size.value
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {size.label}
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
                  <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="text-xs sm:text-sm text-gray-700">
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
                          className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white w-full sm:w-auto"
                        >
                          <option value={20}>20개씩</option>
                          <option value={50}>50개씩</option>
                          <option value={100}>100개씩</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 justify-center sm:justify-end w-full sm:w-auto">
                        <button
                          onClick={() => setCurrentRegistrationPage(prev => Math.max(1, prev - 1))}
                          disabled={currentRegistrationPage === 1}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                            currentRegistrationPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          이전
                        </button>
                        <span className="text-xs sm:text-sm text-gray-700">
                          {currentRegistrationPage} / {Math.ceil(totalRegistrations / registrationsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentRegistrationPage(prev =>
                            Math.min(Math.ceil(totalRegistrations / registrationsPerPage), prev + 1)
                          )}
                          disabled={currentRegistrationPage >= Math.ceil(totalRegistrations / registrationsPerPage)}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
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
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">요청게시판 관리</h2>
                    <div className="flex items-center w-full sm:w-auto">
                      <select
                        value={selectedCompetitionForPosts}
                        onChange={(e) => setSelectedCompetitionForPosts(e.target.value)}
                        className="border border-gray-300 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white w-full sm:w-auto"
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
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">
                            제목
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                            작성자
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                            대회명
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                            작성일
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-start space-x-2">
                                  {post.is_notice && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                      <Pin className="w-3 h-3 mr-1" />
                                      공지
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedPost(post)
                                      setShowPostDetail(true)
                                    }}
                                    className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors text-left break-words"
                                  >
                                    {post.title}
                                  </button>
                                  {post.image_url && (
                                    <span className="text-xs text-blue-600 flex-shrink-0">📷</span>
                                  )}
                                </div>
                                {/* 모바일에서 추가 정보 표시 */}
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span className="sm:hidden">{post.author_name}</span>
                                  <span className="md:hidden">• {post.competitions ? post.competitions.title : '대회명 없음'}</span>
                                  <span className="sm:hidden">• {formatKST(post.created_at, 'MM.dd')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <div className="text-sm font-medium text-gray-900">{post.author_name}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div className="text-sm text-gray-900">
                                {post.competitions ? post.competitions.title : '대회명 없음'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm text-gray-900">
                                {formatKST(post.created_at, 'yyyy.MM.dd')}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                <button
                                  onClick={() => toggleNotice(post.id, post.is_notice || false)}
                                  className={`inline-flex items-center justify-center px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    post.is_notice
                                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  }`}
                                >
                                  <Pin className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">{post.is_notice ? '공지해제' : '공지설정'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setShowPostDetail(true)
                                  }}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                                >
                                  <Eye className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">보기</span>
                                </button>
                                <button
                                  onClick={() => deletePost(post.id)}
                                  className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                                >
                                  <Trash2 className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">삭제</span>
                                </button>
                              </div>
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

                {/* 페이지네이션 */}
                {!postsLoading && totalPosts > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        전체 {totalPosts}개 중 {((currentPostPage - 1) * postsPerPage) + 1}-{Math.min(currentPostPage * postsPerPage, totalPosts)}개 표시
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPostPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPostPage === 1}
                          className={`px-3 py-1 rounded ${
                            currentPostPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          이전
                        </button>
                        <span className="text-sm text-gray-700">
                          {currentPostPage} / {Math.ceil(totalPosts / postsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPostPage(prev =>
                            Math.min(Math.ceil(totalPosts / postsPerPage), prev + 1)
                          )}
                          disabled={currentPostPage >= Math.ceil(totalPosts / postsPerPage)}
                          className={`px-3 py-1 rounded ${
                            currentPostPage >= Math.ceil(totalPosts / postsPerPage)
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
          </div>
        )}
        {activeTab === 'community' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">자유게시판 관리</h2>
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
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-full">
                        제목
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                        작성자
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                        통계
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                        작성일
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-start space-x-2">
                                {post.is_notice && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                                    <Pin className="w-3 h-3 mr-1" />
                                    공지
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setShowPostDetail(true)
                                  }}
                                  className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors text-left break-words"
                                >
                                  {post.title}
                                </button>
                                {post.image_url && (
                                  <span className="text-xs text-blue-600 flex-shrink-0">📷</span>
                                )}
                              </div>
                              {/* 모바일에서 추가 정보 표시 */}
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {gradeInfo && (
                                  <span className="lg:hidden">{post.users.name} ({gradeInfo.display})</span>
                                )}
                                <span className="md:hidden">• 조회 {post.views} • 댓글 {commentCount}</span>
                                <span className="sm:hidden">• {formatKST(post.created_at, 'MM.dd')}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="flex items-center space-x-2">
                              {gradeInfo && (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{post.users.name}</div>
                                  <div className="text-xs text-gray-500">{gradeInfo.display}</div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
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
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-900">
                              {formatKST(post.created_at, 'yyyy.MM.dd')}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                              <button
                                onClick={() => toggleNotice(post.id, post.is_notice || false)}
                                className={`inline-flex items-center justify-center px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  post.is_notice
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                <Pin className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">{post.is_notice ? '공지해제' : '공지설정'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPost(post)
                                  setShowPostDetail(true)
                                }}
                                className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
                              >
                                <Eye className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">보기</span>
                              </button>
                              <button
                                onClick={() => deletePost(post.id)}
                                className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                              >
                                <Trash2 className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">삭제</span>
                              </button>
                            </div>
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

        {/* 팝업 관리 섹션 */}
        {activeTab === 'popups' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">팝업 관리 ({popups.length})</h2>
              <button
                onClick={handleCreatePopup}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>팝업 등록</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {popupsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                </div>
              ) : popups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  등록된 팝업이 없습니다.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시 페이지
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {popups.map((popup) => {
                      const competition = popup.competition_id
                        ? competitions.find(c => c.id === popup.competition_id)
                        : null
                      const now = new Date()
                      const startDate = new Date(popup.start_date)
                      const endDate = new Date(popup.end_date)
                      const isActive = popup.is_active && now >= startDate && now <= endDate

                      return (
                        <tr key={popup.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{popup.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {popup.display_page === 'all' && '모든 페이지'}
                              {popup.display_page === 'home' && '메인 페이지'}
                              {popup.display_page === 'competition' && (
                                <div>
                                  <div>대회 상세</div>
                                  {competition && (
                                    <div className="text-xs text-gray-500">{competition.title}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div>{formatKST(popup.start_date, 'yyyy.MM.dd HH:mm')}</div>
                              <div className="text-gray-500">~ {formatKST(popup.end_date, 'yyyy.MM.dd HH:mm')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePopupActive(popup)}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {isActive ? '활성화' : '비활성화'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPopup(popup)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePopup(popup.id)}
                                className="text-red-600 hover:text-red-900"
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
                        placeholder="이름, 아이디, 이메일, 연락처로 검색..."
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
                          { value: '0-19', label: '19세 이하' },
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">종족</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: '전체' },
                          { value: 'cheetah', label: '치타족' },
                          { value: 'horse', label: '홀스족' },
                          { value: 'wolf', label: '울프족' },
                          { value: 'turtle', label: '터틀족' }
                        ].map((grade) => (
                          <button
                            key={grade.value}
                            onClick={() => {
                              setMemberGradeFilter(grade.value)
                              setCurrentMemberPage(1)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              memberGradeFilter === grade.value
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {grade.label}
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
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="text-xs sm:text-sm text-gray-700">
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
                      className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white w-full sm:w-auto"
                    >
                      <option value={20}>20개씩</option>
                      <option value={50}>50개씩</option>
                      <option value={100}>100개씩</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 justify-center sm:justify-end w-full sm:w-auto">
                    <button
                      onClick={() => setCurrentMemberPage(prev => Math.max(1, prev - 1))}
                      disabled={currentMemberPage === 1}
                      className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                        currentMemberPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      이전
                    </button>
                    <span className="text-xs sm:text-sm text-gray-700">
                      {currentMemberPage} / {Math.ceil(totalMembers / membersPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentMemberPage(prev =>
                        Math.min(Math.ceil(totalMembers / membersPerPage), prev + 1)
                      )}
                      disabled={currentMemberPage >= Math.ceil(totalMembers / membersPerPage)}
                      className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
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
                    {isEditingMember && editedMember ? (
                      <input
                        type="email"
                        value={editedMember.email}
                        onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900 break-all">{selectedMember.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">연락처</label>
                    {isEditingMember && editedMember ? (
                      <input
                        type="tel"
                        value={editedMember.phone}
                        onChange={(e) => setEditedMember({...editedMember, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{selectedMember.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">생년월일</label>
                    {isEditingMember && editedMember ? (
                      <input
                        type="text"
                        value={editedMember.birth_date}
                        onChange={(e) => setEditedMember({...editedMember, birth_date: e.target.value})}
                        placeholder="YYYYMMDD"
                        maxLength={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{selectedMember.birth_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">성별</label>
                    {isEditingMember && editedMember ? (
                      <select
                        value={editedMember.gender}
                        onChange={(e) => setEditedMember({...editedMember, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                      </select>
                    ) : (
                      <p className="text-base text-gray-900">
                        {selectedMember.gender === 'male' ? '남성' : '여성'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 주소 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">주소</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">우편번호</label>
                    {isEditingMember && editedMember ? (
                      <input
                        type="text"
                        value={editedMember.postal_code}
                        onChange={(e) => setEditedMember({...editedMember, postal_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{selectedMember.postal_code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">주소</label>
                    {isEditingMember && editedMember ? (
                      <>
                        <input
                          type="text"
                          value={editedMember.address1}
                          onChange={(e) => setEditedMember({...editedMember, address1: e.target.value})}
                          placeholder="기본 주소"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white mb-2"
                        />
                        <input
                          type="text"
                          value={editedMember.address2 || ''}
                          onChange={(e) => setEditedMember({...editedMember, address2: e.target.value})}
                          placeholder="상세 주소 (선택)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-base text-gray-900">{selectedMember.address1}</p>
                        {selectedMember.address2 && (
                          <p className="text-base text-gray-900 mt-1">{selectedMember.address2}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              {isEditingMember ? (
                <>
                  <button
                    onClick={cancelEditingMember}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={saveMemberChanges}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditingMember}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    수정
                  </button>
                  <button
                    onClick={closeMemberModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    닫기
                  </button>
                </>
              )}
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
                    {isEditingParticipant && editedParticipant ? (
                      <input
                        type="email"
                        value={editedParticipant.email}
                        onChange={(e) => setEditedParticipant({...editedParticipant, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900 break-all">{selectedParticipant.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">연락처</label>
                    {isEditingParticipant && editedParticipant ? (
                      <input
                        type="tel"
                        value={editedParticipant.phone}
                        onChange={(e) => setEditedParticipant({...editedParticipant, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{selectedParticipant.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">생년월일</label>
                    {isEditingParticipant && editedParticipant ? (
                      <div>
                        <input
                          type="text"
                          value={editedParticipant.birth_date || ''}
                          onChange={(e) => handleBirthDateChange(e.target.value)}
                          placeholder="YYMMDD 또는 YYYYMMDD"
                          maxLength={8}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          6자리(YYMMDD) 또는 8자리(YYYYMMDD) 입력 가능 (자동으로 6자리로 저장됨)
                        </p>
                      </div>
                    ) : (
                      <p className="text-base text-gray-900">{selectedParticipant.birth_date || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">나이</label>
                    {isEditingParticipant && editedParticipant ? (
                      <p className="text-base text-gray-900 font-medium text-blue-600">{editedParticipant.age}세</p>
                    ) : (
                      <p className="text-base text-gray-900">{selectedParticipant.age}세</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">성별</label>
                    {isEditingParticipant && editedParticipant ? (
                      <select
                        value={editedParticipant.gender}
                        onChange={(e) => setEditedParticipant({...editedParticipant, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                      </select>
                    ) : (
                      <p className="text-base text-gray-900">
                        {selectedParticipant.gender === 'male' ? '남성' : '여성'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 주소 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">주소</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">주소</label>
                  {isEditingParticipant && editedParticipant ? (
                    <textarea
                      value={editedParticipant.address || ''}
                      onChange={(e) => setEditedParticipant({...editedParticipant, address: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{selectedParticipant.address || '-'}</p>
                  )}
                </div>
              </div>

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
                    {isEditingParticipant && editedParticipant ? (
                      <select
                        value={editedParticipant.participation_group_id || ''}
                        onChange={(e) => handleParticipationGroupChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="">종목 선택</option>
                        {availableParticipationGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name} - {group.distance} (₩{group.entry_fee.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-base text-blue-600 font-medium">
                        {selectedParticipant.distance ? getDistanceLabel(selectedParticipant.distance) : '-'}
                      </p>
                    )}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">티셔츠 사이즈</label>
                    {isEditingParticipant && editedParticipant ? (
                      <select
                        value={editedParticipant.shirt_size || ''}
                        onChange={(e) => setEditedParticipant({...editedParticipant, shirt_size: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="">선택 안함</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="2XL">2XL</option>
                      </select>
                    ) : (
                      <p className="text-base text-gray-900">{selectedParticipant.shirt_size || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">입금자명</label>
                    {isEditingParticipant && editedParticipant ? (
                      <input
                        type="text"
                        value={editedParticipant.depositor_name || ''}
                        onChange={(e) => setEditedParticipant({...editedParticipant, depositor_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{selectedParticipant.depositor_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">참가비</label>
                    {isEditingParticipant && editedParticipant ? (
                      <p className="text-base text-blue-600 font-semibold">
                        {editedParticipant.entry_fee ? `₩${editedParticipant.entry_fee.toLocaleString()}` : '-'}
                      </p>
                    ) : (
                      <p className="text-base text-gray-900">
                        {selectedParticipant.entry_fee ? `₩${selectedParticipant.entry_fee.toLocaleString()}` : '-'}
                      </p>
                    )}
                  </div>
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">기타 내용</h3>
                <div>
                  {isEditingParticipant && editedParticipant ? (
                    <textarea
                      value={editedParticipant.notes || ''}
                      onChange={(e) => setEditedParticipant({...editedParticipant, notes: e.target.value})}
                      rows={4}
                      placeholder="기타 내용 입력..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-base text-gray-900 whitespace-pre-wrap">
                        {selectedParticipant.notes || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              {isEditingParticipant ? (
                <>
                  <button
                    onClick={cancelEditingParticipant}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={saveParticipantChanges}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditingParticipant}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    수정
                  </button>
                  <button
                    onClick={closeParticipantModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 종목별 참가자 수 모달 */}
      {showGroupsModal && selectedCompetitionForGroups && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {selectedCompetitionForGroups.title} - 종목별 참가자 현황
              </h3>

              <div className="space-y-4">
                {participationGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    등록된 참가 그룹이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            종목/거리
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            참가비
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            참가자
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            최대 인원
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            진행률
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participationGroups.map((group) => {
                          const progress = group.max_participants > 0
                            ? ((group.actual_participants / group.max_participants) * 100).toFixed(1)
                            : 0

                          return (
                            <tr key={group.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {group.name || group.distance}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₩{group.entry_fee.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-600">
                                {group.actual_participants}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                {group.max_participants}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        Number(progress) >= 100 ? 'bg-red-500' :
                                        Number(progress) >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(Number(progress), 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">{progress}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="font-semibold">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            전체 합계
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            -
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-blue-600 font-bold">
                            {participationGroups.reduce((sum, g) => sum + (g.actual_participants || 0), 0)}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900 font-bold">
                            {participationGroups.reduce((sum, g) => sum + (g.max_participants || 0), 0)}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">
                            {participationGroups.reduce((sum, g) => sum + (g.max_participants || 0), 0) > 0
                              ? ((participationGroups.reduce((sum, g) => sum + (g.actual_participants || 0), 0) /
                                  participationGroups.reduce((sum, g) => sum + (g.max_participants || 0), 0)) * 100).toFixed(1)
                              : 0}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowGroupsModal(false)
                    setSelectedCompetitionForGroups(null)
                    setParticipationGroups([])
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 팝업 등록/수정 모달 */}
      {showPopupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditingPopup ? '팝업 수정' : '팝업 등록'}
              </h2>
              <button
                onClick={() => setShowPopupModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팝업 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="팝업 제목을 입력하세요"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  팝업 이미지 <span className="text-red-500">*</span>
                </label>
                <PopupImageUpload
                  currentImageUrl={popupImageUrl}
                  onImageUploaded={setPopupImageUrl}
                />
              </div>

              {/* 표시 페이지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  표시 페이지 <span className="text-red-500">*</span>
                </label>
                <select
                  value={popupDisplayPage}
                  onChange={(e) => {
                    setPopupDisplayPage(e.target.value as 'home' | 'competition')
                    if (e.target.value !== 'competition') {
                      setPopupCompetitionId('')
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="home">메인 페이지</option>
                  <option value="competition">대회 상세 페이지</option>
                </select>
              </div>

              {/* 대회 선택 (표시 페이지가 competition일 때만) */}
              {popupDisplayPage === 'competition' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대회 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={popupCompetitionId}
                    onChange={(e) => setPopupCompetitionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">대회를 선택하세요</option>
                    {competitions.map((competition) => (
                      <option key={competition.id} value={competition.id}>
                        {competition.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 시작 일시 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 일시 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={popupStartDate}
                  onChange={(e) => setPopupStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* 종료 일시 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 일시 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={popupEndDate}
                  onChange={(e) => setPopupEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* 활성화 여부 */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={popupIsActive}
                    onChange={(e) => setPopupIsActive(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">활성화</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  체크 해제 시 설정된 기간이어도 팝업이 표시되지 않습니다.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPopupModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSavePopup}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {isEditingPopup ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}