'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Trophy,
  CreditCard,
  ArrowLeft,
  MessageCircle,
  Route,
  Award,
  Search,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition, CompetitionPost } from '@/types'
import { format } from 'date-fns'
import ConsentForm from '@/components/ConsentForm'
import MemberRegistrationForm from '@/components/MemberRegistrationForm'
import RegistrationLookup from '@/components/RegistrationLookup'
import PostWriteModal from '@/components/PostWriteModal'
import PostDetailModal from '@/components/PostDetailModal'
import MessageModal from '@/components/MessageModal'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/contexts/AuthContext'

export default function CompetitionDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const competitionId = params.id as string
  const { user } = useAuth()
  
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [participationGroups, setParticipationGroups] = useState<any[]>([])
  const [posts, setPosts] = useState<CompetitionPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'course' | 'prizes' | 'register' | 'lookup' | 'board'>('overview')
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userRegistration, setUserRegistration] = useState<any>(null)
  const [registrationLoading, setRegistrationLoading] = useState(false)

  // 게시판 관련 상태
  const [boardPosts, setBoardPosts] = useState<any[]>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const postsPerPage = 10
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('signup')

  // 탭 변경 시 신청 프로세스 초기화
  useEffect(() => {
    if (activeTab !== 'register') {
      setShowRegistrationForm(false)
      setRegistrationComplete(false)
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
    if (tab && ['overview', 'course', 'prizes', 'register', 'lookup', 'board'].includes(tab)) {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  // 게시판 탭 활성화 시 게시글 데이터 가져오기
  useEffect(() => {
    if (activeTab === 'board') {
      fetchBoardPosts()
    }
  }, [activeTab, currentPage, searchKeyword])


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
        .order('distance')

      if (groupsError) {
        console.error('Error fetching participation groups:', groupsError)
      } else {
        setParticipationGroups(groupsData || [])
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

  const fetchBoardPosts = async () => {
    try {
      setBoardLoading(true)

      let query = supabase
        .from('community_posts')
        .select(`
          id, title, content, created_at, updated_at,
          user_id, users(name)
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
        .order('created_at', { ascending: true })
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPost || !passwordInput) {
      setMessageProps({
        type: 'error',
        message: '비밀번호를 입력해주세요.'
      })
      setShowMessage(true)
      return
    }

    if (passwordInput !== selectedPost.password) {
      setMessageProps({
        type: 'error',
        message: '비밀번호가 일치하지 않습니다.'
      })
      setShowMessage(true)
      return
    }

    setShowPasswordPrompt(false)
    setPasswordInput('')
    setShowPostDetail(true)
  }

  const handlePostClick = (post: any) => {
    setSelectedPost(post)
    
    if (isAdmin()) {
      setShowPostDetail(true)
    } else {
      setShowPasswordPrompt(true)
    }
  }

  const getStatusBadge = (competition: Competition) => {
    const now = new Date()
    const registrationEnd = new Date(competition.registration_end)
    const competitionDate = new Date(competition.date)

    if (competition.status === 'closed' || competitionDate < now) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          대회 종료
        </span>
      )
    }

    if (registrationEnd < now) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          접수 마감
        </span>
      )
    }

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
          <h3 className="text-xl font-semibold text-gray-900 mb-4">대회 개요</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {competition.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
                <Trophy className="h-5 w-5 text-blue-600 mr-2" />
                대회 정보
              </h4>
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

          <div className="lg:col-span-1">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-gray-900">신청 기간</h4>
              </div>
              
              <div className="space-y-4">
                {/* 기간 표시 */}
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {format(new Date(competition.registration_start), 'M월 d일')} - {format(new Date(competition.registration_end), 'M월 d일')}
                  </div>
                </div>
                
                {/* 진행률 바 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{format(new Date(competition.registration_start), 'M/d')}</span>
                    <span>{format(new Date(competition.registration_end), 'M/d')}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(() => {
                          const now = new Date()
                          const start = new Date(competition.registration_start)
                          const end = new Date(competition.registration_end)
                          const total = end.getTime() - start.getTime()
                          const elapsed = now.getTime() - start.getTime()
                          return Math.min(Math.max((elapsed / total) * 100, 0), 100)
                        })()}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* 상태 표시 */}
                <div className="text-center">
                  {(() => {
                    const now = new Date()
                    const start = new Date(competition.registration_start)
                    const end = new Date(competition.registration_end)
                    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (now < start) {
                      return (
                        <div className="text-orange-600 text-sm font-medium">
                          신청 대기 중
                        </div>
                      )
                    } else if (now > end) {
                      return (
                        <div className="text-red-600 text-sm font-medium">
                          신청 마감
                        </div>
                      )
                     } else {
                       return (
                         <div>
                           <div className="text-green-600 text-sm font-medium">
                             신청 가능
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                             {daysLeft}일 남음
                           </div>
                         </div>
                       )
                     }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    course: (
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Route className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">코스 안내</h3>
        </div>
        
        {competition.course_image_url && (
          <div className="mb-6">
            <div className="relative w-full max-w-4xl mx-auto aspect-video">
              <Image
                src={competition.course_image_url}
                alt="코스 이미지"
                fill
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}
        
        <div className="prose max-w-none">
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {competition.course_description}
            </p>
          </div>
        </div>
      </div>
    ),

    prizes: (
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Award className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">시상 내역</h3>
        </div>
        
        {competition.prizes_image_url && (
          <div className="mb-6">
            <div className="relative w-full max-w-4xl mx-auto aspect-video">
              <Image
                src={competition.prizes_image_url}
                alt="시상품 이미지"
                fill
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {competition.prizes}
            </p>
          </div>
        </div>
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
                    <span>참가 그룹:</span>
                    <span className="font-semibold">{userRegistration.participation_groups?.name || '일반부'}</span>
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
                      {userRegistration.payment_status === 'confirmed' ? '결제완료' :
                       userRegistration.payment_status === 'pending' ? '결제대기' : '취소됨'}
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
          registrationComplete ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-green-900 mb-4">
                🎉 참가 신청이 완료되었습니다!
              </h3>

              <div className="bg-white rounded-lg p-6 mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">참가비 입금 안내</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">은행</span>
                    <span className="font-semibold text-gray-900">농협</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">계좌번호</span>
                    <span className="font-semibold text-gray-900">123-456-7890</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">예금주</span>
                    <span className="font-semibold text-gray-900">런텐</span>
                  </div>
                  <div className="py-2">
                    <span className="text-gray-600 font-medium block mb-2">입금액</span>
                    {participationGroups.length > 0 ? (
                      <div className="space-y-2">
                        {participationGroups.map((group) => (
                          <div key={group.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{group.name}</span>
                            <span className="font-bold text-blue-600">₩{group.entry_fee.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="font-bold text-blue-600 text-lg">₩{competition.entry_fee.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-yellow-800 mb-2">중요 안내사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>입금자명은 신청시 입력한 이름과 동일해야 합니다</li>
                  <li>입금 확인은 1-2일 정도 소요됩니다</li>
                  <li>마이페이지에서 신청 내역을 확인하실 수 있습니다</li>
                  <li>문의사항은 대회 문의처로 연락해 주세요</li>
                </ul>
              </div>

              <div className="text-center mb-6">
                <p className="text-green-700 text-lg mb-2">
                  신청해주셔서 감사합니다!
                </p>
                <p className="text-gray-600">
                  입금 확인 후 참가가 확정됩니다. 마이페이지에서 신청 내역을 확인하실 수 있습니다.
                </p>
              </div>

              <button
                onClick={() => {
                  setRegistrationComplete(false)
                  setShowRegistrationForm(false)
                  router.push('/mypage')
                }}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
              >
                마이페이지로 이동
              </button>
              </div>
            </div>
          ) : (
            <>
              {user ? (
                <MemberRegistrationForm
                  competition={competition}
                  participationGroups={participationGroups}
                  user={user}
                  onSuccess={() => {
                    fetchCompetitionData()
                    checkUserRegistration()
                    setRegistrationComplete(true)
                    // 조회 탭으로 이동
                    setActiveTab('lookup')
                    router.push(`/competitions/${competitionId}?tab=lookup`)
                  }}
                />
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                  <Users className="h-16 w-16 text-blue-400 mx-auto mb-6" />
                  <h4 className="text-2xl font-bold text-blue-900 mb-4">
                    회원만 참가 신청이 가능합니다
                  </h4>
                  <p className="text-blue-700 text-lg mb-6">
                    대회 참가를 위해서는 회원가입이 필요합니다.<br />
                    회원가입 후 간편하게 대회에 참가하실 수 있습니다.
                  </p>

                  <div className="bg-white rounded-lg p-6 mb-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">회원가입 혜택</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        기본정보 자동입력으로 간편한 신청
                      </div>
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        마이페이지에서 신청내역 관리
                      </div>
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        커뮤니티 게시판 이용
                      </div>
                      <div className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        등급별 맞춤 서비스
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
          )
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
          <Search className="h-6 w-6 text-blue-600 mr-2" />
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
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">대회 게시판</h3>
          </div>
          {user && (
            <button
              onClick={() => setShowPostForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              글쓰기
            </button>
          )}
        </div>

        {!user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <MessageCircle className="h-16 w-16 text-blue-400 mx-auto mb-6" />
            <h4 className="text-2xl font-bold text-blue-900 mb-4">
              회원만 게시판을 이용할 수 있습니다
            </h4>
            <p className="text-blue-700 text-lg mb-6">
              회원가입 후 대회 관련 소통에 참여하고 다른 참가자들과 정보를 공유하세요.
            </p>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">게시판에서 가능한 활동</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  대회 관련 질문과 답변
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  참가자들과 정보 공유
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  운영진 공지사항 확인
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  대회 후기 및 사진 공유
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
        ) : (
          <>

        {/* 검색 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="제목 또는 작성자로 검색..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            총 {totalPosts}개의 게시글
          </div>
        </div>

        {/* 게시글 목록 */}
        {boardLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : boardPosts.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {searchKeyword ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
            </h4>
            <p className="text-gray-600">
              {searchKeyword ? '다른 키워드로 검색해보세요.' : '첫 번째 글을 작성해보세요.'}
            </p>
          </div>
        ) : (
          <>
            {/* 게시글 테이블 */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">작성자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">작성일</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boardPosts.map((post, index) => (
                    <tr 
                      key={post.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePostClick(post)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {post.title}
                          {(post as any).replies && (post as any).replies[0]?.count > 0 && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              ({(post as any).replies[0].count})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{post.author}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(post.created_at), 'yyyy.MM.dd')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPosts > postsPerPage && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {Array.from({ length: Math.ceil(totalPosts / postsPerPage) }, (_, i) => i + 1)
                  .filter(page => Math.abs(page - currentPage) <= 2)
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(totalPosts / postsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(totalPosts / postsPerPage)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
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

        {/* 비밀번호 확인 모달 */}
        {showPasswordPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">게시글 접근 확인</h3>
                <button
                  onClick={() => {
                    setShowPasswordPrompt(false)
                    setPasswordInput('')
                    setSelectedPost(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    게시글 작성 시 설정한 비밀번호를 입력하세요
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordPrompt(false)
                      setPasswordInput('')
                      setSelectedPost(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    확인
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="relative w-full h-64 md:h-80 overflow-hidden">
          {competition.image_url ? (
            <>
              <Image
                src={competition.image_url}
                alt={competition.title}
                fill
                className="object-cover object-top"
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
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { key: 'overview', label: '개요', icon: Trophy },
              { key: 'course', label: '코스', icon: Route },
              { key: 'prizes', label: '시상', icon: Award },
              { key: 'register', label: '신청', icon: Users },
              { key: 'lookup', label: '조회', icon: Search },
              { key: 'board', label: '게시판', icon: MessageCircle }
            ].map(({ key, label, icon: Icon }) => (
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
    </div>
  )
}