'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  CreditCard,
  ArrowLeft,
  MessageCircle,
  Route,
  Award,
  Search,
  CheckCircle,
  Pin,
  X,
  MessageSquare,
  Plus,
  Camera
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import { format } from 'date-fns'
import { formatKST } from '@/lib/dateUtils'
import MemberRegistrationForm from '@/components/MemberRegistrationForm'
import RegistrationLookup from '@/components/RegistrationLookup'
import PostWriteModal from '@/components/PostWriteModal'
import PostDetailModal from '@/components/PostDetailModal'
import MessageModal from '@/components/MessageModal'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import PagePopup from '@/components/PagePopup'

export default function CompetitionDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const competitionId = params.id as string
  const { user, getGradeInfo } = useAuth()
  
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [participationGroups, setParticipationGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'lookup' | 'board' | 'photos'>('overview')
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [userRegistration, setUserRegistration] = useState<any>(null)
  const [registrationLoading, setRegistrationLoading] = useState(false)

  // URL 파라미터에서 tab 감지 (스티키 버튼 클릭 시)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'register') {
      setActiveTab('register')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])

  // 게시판 관련 상태
  const [boardPosts, setBoardPosts] = useState<any[]>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const postsPerPage = 10
  const [showMessage, setShowMessage] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{url: string, alt: string} | null>(null)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('signup')
  const [galleryPhotos, setGalleryPhotos] = useState<Array<{
    id: string
    image_url: string
    caption: string | null
    display_order: number
  }>>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [galleryPage, setGalleryPage] = useState(1)
  const GALLERY_ITEMS_PER_PAGE = 12

  // 키보드 이벤트 처리 (ESC, 좌우 화살표)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!lightboxOpen) return

      if (e.key === 'Escape') {
        setLightboxOpen(false)
      } else if (e.key === 'ArrowLeft' && currentPhotoIndex > 0) {
        setCurrentPhotoIndex(prev => prev - 1)
      } else if (e.key === 'ArrowRight' && currentPhotoIndex < galleryPhotos.length - 1) {
        setCurrentPhotoIndex(prev => prev + 1)
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [lightboxOpen, currentPhotoIndex, galleryPhotos.length])

  // 탭 변경 시 신청 프로세스 초기화
  useEffect(() => {
    if (activeTab !== 'register') {
      setShowRegistrationForm(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (competitionId) {
      fetchCompetitionData()
      checkUserRegistration()
    }
  }, [competitionId, user])

  // 쿼리 파라미터로 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'register', 'lookup', 'board', 'photos'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  // 게시판 탭 활성화 시 게시글 데이터 가져오기
  useEffect(() => {
    if (activeTab === 'board') {
      fetchBoardPosts()
    }
  }, [activeTab, currentPage, searchKeyword])

  // 사진 탭 활성화 시 사진 데이터 가져오기
  useEffect(() => {
    if (activeTab === 'photos') {
      fetchGalleryPhotos()
    }
  }, [activeTab])

  // SEO용 Event 스키마를 head에 동적으로 추가
  useEffect(() => {
    if (!competition) return

    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": competition.title,
      "description": competition.description,
      "startDate": competition.date,
      "location": {
        "@type": "Place",
        "name": competition.location,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": competition.location,
          "addressCountry": "KR"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": competition.organizer || "RUN10",
        "url": "https://runten.co.kr"
      },
      "offers": {
        "@type": "Offer",
        "price": competition.entry_fee,
        "priceCurrency": "KRW",
        "availability": isRegistrationOpen(competition) ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        "validFrom": competition.registration_start,
        "validThrough": competition.registration_end
      },
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": competition.status === 'published' ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
      "maximumAttendeeCapacity": competition.max_participants,
      "typicalAgeRange": "18-99",
      "sport": "러닝",
      "performer": {
        "@type": "SportsTeam",
        "name": "참가자들"
      },
      "image": competition.image_url || "https://runten.co.kr/images/og-image.jpg"
    }

    // 기존 스키마가 있으면 제거
    const existingScript = document.querySelector('script[data-schema="event"]')
    if (existingScript) {
      existingScript.remove()
    }

    // 새 스키마 스크립트 추가
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-schema', 'event')
    script.textContent = JSON.stringify(eventSchema)
    document.head.appendChild(script)

    // 컴포넌트 언마운트 시 스크립트 제거
    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="event"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [competition])


  // 사용자의 신청 상태 확인
  const checkUserRegistration = async () => {
    if (!user) {
      setUserRegistration(null)
      return
    }

    setRegistrationLoading(true)
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          participation_groups (
            name,
            distance
          )
        `)
        .eq('competition_id', competitionId)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking registration:', error)
        return
      }

      setUserRegistration(data || null)
    } catch (error) {
      console.error('Error checking registration:', error)
    } finally {
      setRegistrationLoading(false)
    }
  }

  const fetchCompetitionData = async () => {
    try {
      // Fetch competition details
      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single()

      if (competitionError) {
        console.error('Error fetching competition:', competitionError)
        return
      }

      setCompetition(competitionData)

      // Fetch participation groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('participation_groups')
        .select('*')
        .eq('competition_id', competitionId)

      if (groupsError) {
        console.error('Error fetching participation groups:', groupsError)
      } else {
        // 거리 값을 숫자로 변환하여 오름차순 정렬 (3km, 5km, 10km, 21km, 42km 순)
        const sortedGroups = (groupsData || []).sort((a, b) => {
          // "10km", "하프마라톤(21km)", "풀마라톤(42km)" 등에서 숫자 추출
          const matchA = a.distance.match(/(\d+)km/)
          const matchB = b.distance.match(/(\d+)km/)
          const distanceA = matchA ? parseInt(matchA[1]) : 0
          const distanceB = matchB ? parseInt(matchB[1]) : 0
          return distanceA - distanceB
        })
        setParticipationGroups(sortedGroups)
      }

      // Fetch competition posts - 여기는 실제로 필요한 경우에만 사용
      // const { data: postsData, error: postsError } = await supabase
      //   .from('competition_posts')
      //   .select('*')
      //   .eq('competition_id', competitionId)
      //   .order('created_at', { ascending: true })

      // if (postsError) {
      //   console.error('Error fetching posts:', postsError)
      //   // 에러가 발생해도 계속 진행하도록 변경
      // } else {
      //   setPosts(postsData || [])
      // }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleryPhotos = async () => {
    setGalleryLoading(true)
    try {
      const { data, error } = await supabase
        .from('competition_photos')
        .select('*')
        .eq('competition_id', competitionId)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching gallery photos:', error)
        return
      }

      setGalleryPhotos(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setGalleryLoading(false)
    }
  }

  const fetchBoardPosts = async () => {
    try {
      setBoardLoading(true)

      let query = supabase
        .from('community_posts')
        .select(`
          id, title, content, created_at, updated_at, views, is_notice, is_private, post_password,
          user_id, users(user_id, name, grade, role),
          post_comments(id)
        `, { count: 'exact' })
        .eq('competition_id', competitionId)

      // 검색 키워드가 있으면 필터링
      if (searchKeyword.trim()) {
        query = query.or(`title.ilike.%${searchKeyword}%,content.ilike.%${searchKeyword}%`)
      }

      // 페이지네이션
      const from = (currentPage - 1) * postsPerPage
      const to = from + postsPerPage - 1

      const { data, error, count } = await query
        .order('is_notice', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('게시글 조회 오류:', error)
        return
      }

      setBoardPosts(data || [])
      setTotalPosts(count || 0)
    } catch (error) {
      console.error('게시글 조회 중 오류:', error)
    } finally {
      setBoardLoading(false)
    }
  }

  const isAdmin = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.includes('/admin/')
    }
    return false
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

  const handlePostClick = async (post: any) => {
    // 조회수 증가
    const { error } = await supabase
      .from('community_posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', post.id)

    if (error) {
      console.error('조회수 업데이트 오류:', error)
    }

    // 업데이트된 조회수로 상태 업데이트
    const updatedPost = { ...post, views: (post.views || 0) + 1 }
    setSelectedPost(updatedPost)
    setShowPostDetail(true)
  }

  const getStatusBadge = (competition: Competition) => {
    const now = new Date()
    const registrationStart = new Date(competition.registration_start)
    const registrationEnd = new Date(competition.registration_end)
    const competitionDate = new Date(competition.date)

    // 대회 종료
    if (competition.status === 'closed' || competitionDate < now) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          대회 종료
        </span>
      )
    }

    // 신청 시작 전
    if (registrationStart > now) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          신청 예정
        </span>
      )
    }

    // 정원 마감 또는 기한 마감
    if (registrationEnd < now || competition.current_participants >= competition.max_participants) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-red-700">
          접수 마감
        </span>
      )
    }

    // 마감 임박 (7일 이내 또는 모집 인원의 절반 이상)
    const hoursUntilEnd = (registrationEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
    if ((hoursUntilEnd <= 168 && hoursUntilEnd > 0) || (competition.current_participants >= competition.max_participants / 2)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-red-700">
          <span className="animate-pulse">마감 임박</span>
        </span>
      )
    }

    // 접수 중
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        접수 중
      </span>
    )
  }

  const isRegistrationOpen = (competition: Competition) => {
    const now = new Date()
    const registrationStart = new Date(competition.registration_start)
    const registrationEnd = new Date(competition.registration_end)

    return now >= registrationStart &&
           now <= registrationEnd &&
           competition.current_participants < competition.max_participants &&
           competition.status === 'published'
  }

  const isCompetitionEnded = (competition: Competition) => {
    const now = new Date()
    const competitionDate = new Date(competition.date)
    return competitionDate < now
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">대회를 찾을 수 없습니다</h1>
          <Link href="/competitions" className="text-blue-600 hover:text-blue-800">
            대회 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const tabContent = {
    overview: (
      <div className="space-y-8">
        <div>
          <div className="flex items-center mb-4">
            <Trophy className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">대회 개요</h3>
          </div>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {competition.description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">일시</p>
                      <p className="text-gray-900 font-medium">
                        {format(new Date(competition.date), 'yyyy년 M월 d일 HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">장소</p>
                      <p className="text-gray-900 font-medium">{competition.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Route className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">참가 종목</p>
                      <div className="text-gray-900 font-medium">
                        {participationGroups.length > 0 ? (
                          <div className="space-y-1">
                            {participationGroups.map((group, index) => (
                              <div key={group.id} className="text-sm">
                                <span className="font-medium">{group.name}</span>
                                <span className="text-gray-500 ml-2">
                                  (₩{group.entry_fee.toLocaleString()})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>참가 그룹 정보 없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {competition.organizer && (
                    <div className="flex items-start space-x-3">
                      <Trophy className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">주최</p>
                        <p className="text-gray-900 font-medium">{competition.organizer}</p>
                      </div>
                    </div>
                  )}
                  {competition.supervisor && (
                    <div className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">주관</p>
                        <p className="text-gray-900 font-medium">{competition.supervisor}</p>
                      </div>
                    </div>
                  )}
                  {competition.sponsor && (
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">후원</p>
                        <p className="text-gray-900 font-medium">{competition.sponsor}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* 코스 이미지 */}
        {competition.course_image_url && (
          <div className="space-y-4">
            <div className="flex items-center">
              <Route className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">코스 안내</h3>
            </div>
            <div className="w-full max-w-4xl mx-auto">
              <img
                src={competition.course_image_url}
                alt="코스 이미지"
                className="w-full h-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        )}

        {/* 상금/상품 이미지 */}
        {competition.prizes_image_url && (
          <div className="space-y-4">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">시상 내역</h3>
            </div>
            <div className="w-full max-w-4xl mx-auto">
              <img
                src={competition.prizes_image_url}
                alt="시상품 이미지"
                className="w-full h-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        )}
      </div>
    ),

    register: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">참가 신청</h3>
        {registrationLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">신청 상태 확인 중...</p>
          </div>
        ) : userRegistration ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-green-900 mb-4">
                ✅ 신청완료
              </h3>
              <p className="text-gray-700 mb-6">
                이미 이 대회에 참가 신청하셨습니다.<br />
                자세한 신청 내역은 "조회" 탭에서 확인하실 수 있습니다.
              </p>
              <div className="bg-white rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>대회명:</span>
                    <span className="font-semibold">{competition.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>거리:</span>
                    <span className="font-semibold">{userRegistration.participation_groups?.distance || '미설정'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>결제 상태:</span>
                    <span className={`font-semibold ${
                      userRegistration.payment_status === 'confirmed' ? 'text-green-600' :
                      userRegistration.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {userRegistration.payment_status === 'confirmed' ? '입금확인' :
                       userRegistration.payment_status === 'pending' ? '입금대기' : '취소됨'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('lookup')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
              >
                신청 내역 상세 보기
              </button>
            </div>
          </div>
        ) : isRegistrationOpen(competition) ? (
          <>
            {user ? (
              <MemberRegistrationForm
                competition={competition}
                participationGroups={participationGroups}
                user={user}
                onSuccess={() => {
                  fetchCompetitionData()
                  checkUserRegistration()
                  router.push(`/signup-complete?competitionId=${competitionId}&competitionName=${encodeURIComponent(competition.title)}`)
                }}
              />
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                  <Users className="h-16 w-16 text-blue-400 mx-auto mb-6" />
                  <h4 className="text-2xl font-bold text-blue-900 mb-4">
                    대회 참가를 위해 아주 간단한 회원가입이 필요합니다.
                  </h4>
                  <p className="text-blue-700 text-lg mb-6">                    
                    주소와 전번이 정확히 기재되어야 기록칩과 사전 기념품이 발송됩니다.
                  </p>

                  <div className="bg-white rounded-lg p-6 mb-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">회원가입 혜택</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        간편한 대회 신청
                      </div>
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        마이페이지 관리
                      </div>
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        문의 게시판 이용
                      </div>
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        대회 일정 공유
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        setAuthDefaultTab('signup')
                        setShowAuthModal(true)
                      }}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      회원가입하고 신청하기
                    </button>
                    <button
                      onClick={() => {
                        setAuthDefaultTab('login')
                        setShowAuthModal(true)
                      }}
                      className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      로그인
                    </button>
                  </div>
                </div>
              )}
            </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              현재 참가 신청을 받지 않습니다
            </h4>
            <p className="text-gray-600">
              {competition.status === 'closed'
                ? '이 대회는 종료되었습니다.'
                : competition.current_participants >= competition.max_participants
                ? '참가 신청이 마감되었습니다.'
                : '신청 기간이 아닙니다.'}
            </p>
          </div>
        )}
      </div>
    ),

    lookup: (
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          
          <h3 className="text-xl font-semibold text-gray-900">신청 조회</h3>
        </div>
        {!user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <Search className="h-16 w-16 text-blue-400 mx-auto mb-6" />
            <h4 className="text-2xl font-bold text-blue-900 mb-4">
              회원만 신청 조회가 가능합니다
            </h4>
            <p className="text-blue-700 text-lg mb-6">
              회원가입 후 마이페이지에서 신청 내역을 간편하게 확인하실 수 있습니다.
            </p>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">마이페이지에서 가능한 서비스</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  대회 신청 내역 조회
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  결제 상태 확인
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  개인정보 수정
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  참가 기록 관리
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setAuthDefaultTab('signup')
                  setShowAuthModal(true)
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                회원가입하기
              </button>
              <button
                onClick={() => {
                  setAuthDefaultTab('login')
                  setShowAuthModal(true)
                }}
                className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                로그인
              </button>
            </div>
          </div>
        ) : userRegistration ? (
          <>
            <p className="text-gray-600 mb-6">
              회원님의 대회 신청 내역을 조회하고 관리할 수 있습니다.
            </p>
            <RegistrationLookup
              competition={competition}
              onCancelRequest={() => setActiveTab('board')}
            />
          </>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
            <Search className="h-16 w-16 text-orange-400 mx-auto mb-6" />
            <h4 className="text-2xl font-bold text-orange-900 mb-4">
              먼저 신청해 주세요
            </h4>
            <p className="text-orange-700 text-lg mb-6">
              아직 이 대회에 참가 신청을 하지 않으셨습니다.<br />
              "신청" 탭에서 대회 참가를 신청해주세요.
            </p>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">신청 후 이용 가능한 서비스</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  신청 정보 조회 및 수정
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  결제 상태 실시간 확인
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  개인정보 변경 가능
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  대회 관련 알림 수신
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('register')}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors shadow-lg"
            >
              대회 신청하러 가기
            </button>
          </div>
        )}
      </div>
    ),

    board: (
      <div className="space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">요청게시판</h3>
          </div>
          {user && (
            <button
              onClick={() => setShowPostForm(true)}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium touch-manipulation flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>글쓰기</span>
            </button>
          )}
        </div>

        {!user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-8 text-center">
            <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 mx-auto mb-4 sm:mb-6" />
            <h4 className="text-lg sm:text-2xl font-bold text-blue-900 mb-2 sm:mb-4">
              회원만 게시판을 이용할 수 있습니다
            </h4>
            <p className="text-blue-700 text-sm sm:text-lg mb-4 sm:mb-6">
              회원가입 후 대회 관련 소통에 참여하고 다른 참가자들과 정보를 공유하세요.
            </p>

            <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h5 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">게시판에서 가능한 활동</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                  대회 관련 질문과 답변
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                  참가자들과 정보 공유
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                  운영진 공지사항 확인
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
                  대회 후기 및 사진 공유
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => {
                  setAuthDefaultTab('signup')
                  setShowAuthModal(true)
                }}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-center touch-manipulation"
              >
                회원가입하기
              </button>
              <button
                onClick={() => {
                  setAuthDefaultTab('login')
                  setShowAuthModal(true)
                }}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-sm sm:text-lg font-semibold hover:bg-blue-50 transition-colors text-center touch-manipulation"
              >
                로그인
              </button>
            </div>
          </div>
        ) : (
          <>

        {/* 검색 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="제목 또는 작성자로 검색..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right whitespace-nowrap">
            총 {totalPosts}개의 게시글
          </div>
        </div>

        {/* 게시글 목록 */}
        {boardLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : boardPosts.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
            <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchKeyword ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
            </h4>
            <p className="text-sm text-gray-600">
              {searchKeyword ? '다른 키워드로 검색해보세요.' : '첫 번째 글을 작성해보세요.'}
            </p>
          </div>
        ) : (
          <>
            {/* 게시글 목록 헤더 */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1 text-center">번호</div>
                  <div className="col-span-9 sm:col-span-6">제목</div>
                  <div className="col-span-2 text-center hidden sm:block">작성자</div>
                  <div className="col-span-2 text-center hidden sm:block">작성일</div>
                  <div className="col-span-1 text-center hidden sm:block">조회</div>
                </div>
              </div>

              {/* 게시글 목록 */}
              <div className="divide-y divide-gray-200">
                {boardPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handlePostClick(post)}
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
                      <div className="col-span-9 sm:col-span-6 min-w-0">
                        <div className="flex flex-col space-y-1">
                          {/* 제목 줄 */}
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {post.is_notice && (
                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                                공지
                              </span>
                            )}
                            {post.is_private && (
                              <span className="text-blue-600 flex-shrink-0">🔒</span>
                            )}
                            <span className="font-medium text-gray-900 hover:text-blue-600 text-sm sm:text-base truncate">
                              {post.title}
                            </span>
                            {(post.post_comments?.length || 0) > 0 && (
                              <span className="flex items-center text-xs text-red-600 flex-shrink-0">
                                <MessageSquare className="w-3 h-3 mr-0.5" />
                                {post.post_comments?.length || 0}
                              </span>
                            )}
                            {post.image_url && (
                              <span className="text-xs text-blue-600 flex-shrink-0">📷</span>
                            )}
                          </div>
                          {/* 정보 줄 - 모바일에서만 */}
                          <div className="sm:hidden flex items-center space-x-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              {post.users?.grade && (
                                <Image
                                  src={getGradeInfo(post.users.grade, post.users.role).icon}
                                  alt="등급"
                                  width={12}
                                  height={12}
                                  className="w-3 h-3"
                                />
                              )}
                              <span>{post.users?.name ? maskName(post.users.name) : '삭제된 사용자'}</span>
                            </div>
                            <span>•</span>
                            <span>{formatKST(post.created_at, 'MM.dd')}</span>
                            <span>•</span>
                            <span>조회 {post.views || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* 작성자 - 데스크톱만 */}
                      <div className="col-span-2 text-center hidden sm:block">
                        <div className="flex items-center justify-center space-x-2">
                          {post.users?.grade && (
                            <Image
                              src={getGradeInfo(post.users.grade, post.users.role).icon}
                              alt="등급"
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                          )}
                          <span className="text-sm text-gray-700">
                            {post.users?.name ? maskName(post.users.name) : '삭제된 사용자'}
                          </span>
                        </div>
                      </div>

                      {/* 작성일 - 데스크톱만 */}
                      <div className="col-span-2 text-center text-sm text-gray-500 hidden sm:block">
                        {formatKST(post.created_at, 'yyyy.MM.dd')}
                      </div>

                      {/* 조회수 - 데스크톱만 */}
                      <div className="col-span-1 text-center text-sm text-gray-500 hidden sm:block">
                        {post.views || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 페이지네이션 */}
            {Math.ceil(totalPosts / postsPerPage) > 1 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                  >
                    처음
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                  >
                    이전
                  </button>

                  {/* 페이지 번호 */}
                  {Array.from({ length: Math.min(5, Math.ceil(totalPosts / postsPerPage)) }, (_, i) => {
                    const startPage = Math.max(1, currentPage - 2)
                    const pageNumber = startPage + i
                    const totalPages = Math.ceil(totalPosts / postsPerPage)

                    if (pageNumber <= totalPages) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded touch-manipulation ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white border-blue-600'
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
                    disabled={currentPage === Math.ceil(totalPosts / postsPerPage)}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                  >
                    다음
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(totalPosts / postsPerPage))}
                    disabled={currentPage === Math.ceil(totalPosts / postsPerPage)}
                    className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 touch-manipulation"
                  >
                    끝
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 글쓰기 모달 */}
        <PostWriteModal
          isOpen={showPostForm}
          onClose={() => setShowPostForm(false)}
          competitionId={competitionId}
          onPostCreated={() => {
            fetchBoardPosts()
          }}
        />


        {/* 게시글 상세 모달 */}
        <PostDetailModal
          isOpen={showPostDetail}
          onClose={() => {
            setShowPostDetail(false)
            setSelectedPost(null)
          }}
          post={selectedPost}
          onPostUpdated={() => {
            fetchBoardPosts()
          }}
          onPostDeleted={() => {
            fetchBoardPosts()
          }}
        />

        <MessageModal
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
          type={messageProps.type}
          message={messageProps.message}
        />
        </>
        )}
      </div>
    ),

    photos: (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">대회 사진</h3>
          {galleryPhotos.length > 0 && (
            <span className="text-sm text-gray-500">{galleryPhotos.length}장</span>
          )}
        </div>

        {galleryLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : galleryPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">아직 업로드된 사진이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">대회 종료 후 사진이 업로드됩니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryPhotos
                .slice((galleryPage - 1) * GALLERY_ITEMS_PER_PAGE, galleryPage * GALLERY_ITEMS_PER_PAGE)
                .map((photo, idx) => {
                  const actualIndex = (galleryPage - 1) * GALLERY_ITEMS_PER_PAGE + idx
                  const showRanking = galleryPage === 1 && actualIndex < 5
                  return (
                    <div
                      key={photo.id}
                      onClick={() => {
                        setCurrentPhotoIndex(actualIndex)
                        setLightboxOpen(true)
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
                    >
                      <Image
                        src={photo.image_url}
                        alt={photo.caption || `대회 사진 ${actualIndex + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        quality={75}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {showRanking && (
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10">
                          {/* Best 표시 배지 */}
                          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-full px-2 py-1 sm:px-4 sm:py-2 shadow-xl border-2 border-white/40 backdrop-blur-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-white font-bold text-[10px] sm:text-base tracking-tight drop-shadow-lg" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
                                Best
                              </span>
                              <span className="text-white font-black text-xs sm:text-lg drop-shadow-lg" style={{textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
                                {String(actualIndex + 1).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3 pointer-events-none">
                          <p className="text-white text-xs sm:text-sm line-clamp-2">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>

            {/* 페이지네이션 */}
            {galleryPhotos.length > GALLERY_ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8">
                <button
                  onClick={() => setGalleryPage(prev => Math.max(1, prev - 1))}
                  disabled={galleryPage === 1}
                  className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {/* 페이지 번호들 - 모바일에서는 현재 페이지 기준 앞뒤 2개씩만 표시 */}
                {(() => {
                  const totalPages = Math.ceil(galleryPhotos.length / GALLERY_ITEMS_PER_PAGE)
                  const maxVisible = 5 // 모바일: 최대 5개 페이지만 표시
                  let startPage = Math.max(1, galleryPage - 2)
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

                  // 끝에서 2페이지 이내면 시작 페이지 조정
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1)
                  }

                  const pages = Array.from(
                    { length: endPage - startPage + 1 },
                    (_, i) => startPage + i
                  )

                  return pages.map(page => (
                    <button
                      key={page}
                      onClick={() => setGalleryPage(page)}
                      className={`px-2 sm:px-3 py-2 text-sm border rounded-lg ${
                        page === galleryPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                })()}

                <button
                  onClick={() => setGalleryPage(prev => Math.min(Math.ceil(galleryPhotos.length / GALLERY_ITEMS_PER_PAGE), prev + 1))}
                  disabled={galleryPage === Math.ceil(galleryPhotos.length / GALLERY_ITEMS_PER_PAGE)}
                  className="px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 대회 상세 페이지 팝업 */}
      <PagePopup pageId="competition" competitionId={competitionId} />
        {/* Hero Section */}
      <div className="relative">
        <div className="relative w-full h-64 md:h-80 overflow-hidden">
          {competition.image_url ? (
            <>
              <Image
                src={competition.image_url}
                alt={competition.title}
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-black" style={{ opacity: 0.3 }}></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy className="h-24 w-24 text-white" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-2xl">
              {competition.title}
            </h1>
            <div className="flex items-center space-x-4">
              {getStatusBadge(competition)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {(isCompetitionEnded(competition) ? [
              { key: 'overview', label: '개요', icon: Trophy },
              { key: 'photos', label: '베스트포토100', icon: Camera }
            ] : [
              { key: 'overview', label: '개요', icon: Trophy },
              { key: 'register', label: '신청', icon: Users },
              { key: 'lookup', label: '조회', icon: Search },
              { key: 'board', label: '요청게시판', icon: MessageCircle }
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {tabContent[activeTab]}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authDefaultTab}
      />

      {/* 이미지 확대 모달 */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={() => {
                setShowImageModal(false)
                setSelectedImage(null)
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt}
              width={1920}
              height={1080}
              quality={90}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div
            className="absolute inset-0"
            onClick={() => {
              setShowImageModal(false)
              setSelectedImage(null)
            }}
          />
        </div>
      )}

      {/* 갤러리 라이트박스 */}
      {lightboxOpen && galleryPhotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={() => setLightboxOpen(false)}
        >
          {/* 메인 이미지 영역 */}
          <div className="flex-1 relative flex items-center justify-center px-2 sm:px-12 lg:px-20 py-8 sm:py-20 pb-20 sm:pb-40">
            {/* 이전 버튼 */}
            {currentPhotoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPhotoIndex(prev => prev - 1)
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 sm:p-3 transition-all hover:scale-110 z-10 touch-manipulation"
              >
                <svg className="h-5 w-5 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 이미지 */}
            <div
              className="max-w-full max-h-full flex flex-col items-center px-8 sm:px-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryPhotos[currentPhotoIndex].image_url}
                alt={galleryPhotos[currentPhotoIndex].caption || `대회 사진 ${currentPhotoIndex + 1}`}
                width={1920}
                height={1080}
                quality={90}
                className="max-w-full max-h-[calc(100vh-140px)] sm:max-h-[70vh] w-auto h-auto object-contain"
                priority
              />
              {galleryPhotos[currentPhotoIndex].caption && (
                <div className="mt-3 sm:mt-4 bg-black bg-opacity-75 rounded-lg px-3 sm:px-6 py-2 sm:py-3 max-w-full sm:max-w-2xl">
                  <p className="text-white text-center text-xs sm:text-base line-clamp-3">
                    {galleryPhotos[currentPhotoIndex].caption}
                  </p>
                </div>
              )}
            </div>

            {/* 다음 버튼 */}
            {currentPhotoIndex < galleryPhotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentPhotoIndex(prev => prev + 1)
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 sm:p-3 transition-all hover:scale-110 z-10 touch-manipulation"
              >
                <svg className="h-5 w-5 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* 하단 썸네일 네비게이션 */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 backdrop-blur-sm p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
              {/* 썸네일 영역 */}
              <div className="flex-1 flex items-center justify-center gap-1 sm:gap-3 overflow-x-auto scrollbar-hide">
                {(() => {
                  // 모바일: 전후 2개씩 (총 5개), 데스크톱: 전후 3개씩 (총 7개)
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
                  const offset = isMobile ? 2 : 3
                  const start = Math.max(0, currentPhotoIndex - offset)
                  const end = Math.min(galleryPhotos.length, currentPhotoIndex + offset + 1)
                  const visiblePhotos = galleryPhotos.slice(start, end)

                  return visiblePhotos.map((photo, idx) => {
                    const actualIndex = start + idx
                    return (
                      <button
                        key={photo.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentPhotoIndex(actualIndex)
                        }}
                        className={`relative flex-shrink-0 w-10 h-10 sm:w-20 sm:h-20 rounded overflow-hidden transition-all ${
                          actualIndex === currentPhotoIndex
                            ? 'ring-2 sm:ring-4 ring-white scale-110'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={photo.image_url}
                          alt={`썸네일 ${actualIndex + 1}`}
                          fill
                          sizes="80px"
                          quality={60}
                          className="object-cover"
                        />
                      </button>
                    )
                  })
                })()}
              </div>

              {/* 페이지 정보 및 닫기 버튼 */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">
                  {currentPhotoIndex + 1} / {galleryPhotos.length}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxOpen(false)
                  }}
                  className="text-white hover:text-gray-300 transition-all touch-manipulation"
                >
                  <X className="h-5 w-5 sm:h-8 sm:w-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}