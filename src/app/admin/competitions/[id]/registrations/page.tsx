'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Users, 
  Download, 
  Search,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Eye,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition, Registration } from '@/types'
import { format } from 'date-fns'

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

interface RegistrationWithCompetition extends Registration {
  competitions?: {
    title: string
  }
}

export default function CompetitionRegistrationsPage() {
  const params = useParams()
  const competitionId = params.id as string
  
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationWithCompetition[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationWithCompetition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDistance, setSelectedDistance] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [competitionId, fetchData])

  useEffect(() => {
    filterRegistrations()
  }, [registrations, searchTerm, selectedStatus, selectedDistance, filterRegistrations])

  const fetchData = async () => {
    try {
      // Fetch competition info
      const { data: competitionData, error: competitionError } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single()

      if (competitionError) {
        console.error('Error fetching competition:', competitionError)
        alert('대회 정보를 불러오는 중 오류가 발생했습니다.')
        return
      }

      setCompetition(competitionData)

      // Fetch registrations
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          *,
          competitions (
            title
          )
        `)
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false })

      if (registrationsError) {
        console.error('Error fetching registrations:', registrationsError)
        setRegistrations([])
      } else {
        setRegistrations(registrationsData || [])
      }
    } catch (error) {
      console.error('Error:', error)
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterRegistrations = () => {
    let filtered = [...registrations]

    // Search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(reg => 
        reg.name.toLowerCase().includes(lowercaseSearch) ||
        reg.email.toLowerCase().includes(lowercaseSearch) ||
        reg.phone.includes(searchTerm)
      )
    }

    // Payment status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(reg => reg.payment_status === selectedStatus)
    }

    // Distance filter
    if (selectedDistance !== 'all') {
      filtered = filtered.filter(reg => reg.distance === selectedDistance)
    }

    setFilteredRegistrations(filtered)
  }

  const exportToCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    const headers = [
      'No',
      '이름',
      '이메일',
      '전화번호',
      '나이',
      '성별',
      '참가거리',
      '신청일',
      '상태',
      '특이사항'
    ]

    const csvData = filteredRegistrations.map((reg, index) => [
      index + 1,
      reg.name,
      reg.email,
      reg.phone,
      reg.age,
      reg.gender === 'male' ? '남성' : '여성',
      reg.distance ? getDistanceLabel(reg.distance) : '',
      format(new Date(reg.created_at), 'yyyy-MM-dd HH:mm'),
      reg.payment_status === 'confirmed' ? '입금확인' :
      reg.payment_status === 'pending' ? '입금대기' : '취소',
      reg.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${competition?.title || '대회'}_참가자명단_${format(new Date(), 'yyyyMMdd')}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const updatePaymentStatus = async (registrationId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ payment_status: newStatus })
        .eq('id', registrationId)

      if (error) {
        console.error('Error updating payment status:', error)
        alert('입금 상태 업데이트 중 오류가 발생했습니다.')
        return
      }

      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId ? { ...reg, payment_status: newStatus } : reg
        )
      )
    } catch (error) {
      console.error('Error:', error)
      alert('입금 상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  const confirmPayment = async (registrationId: string) => {
    if (confirm('입금을 확인하시겠습니까?')) {
      await updatePaymentStatus(registrationId, 'confirmed')
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    if (paymentStatus === 'confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          입금확인
        </span>
      )
    } else if (paymentStatus === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          취소
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        입금대기
      </span>
    )
  }

  if (isLoading) {
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
          <p className="text-gray-600 mb-4">대회를 찾을 수 없습니다.</p>
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800"
          >
            관리자 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">참가자 관리</h1>
                <p className="text-gray-600">{competition.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/competitions/${competitionId}`}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-4 w-4 mr-1" />
                대회 보기
              </Link>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV 내보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Competition Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 신청자</p>
                <p className="text-2xl font-semibold text-gray-900">{registrations.length}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">입금확인</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {registrations.filter(reg => reg.payment_status === 'confirmed').length}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대회 날짜</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(competition.date), 'yyyy.MM.dd')}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">장소</p>
                <p className="text-lg font-semibold text-gray-900">{competition.location}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">정원</p>
                <p className="text-lg font-semibold text-gray-900">
                  {registrations.length} / {competition.max_participants}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="이름, 이메일, 전화번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                <option value="confirmed">입금확인</option>
                <option value="pending">입금대기</option>
                <option value="cancelled">취소</option>
              </select>
              <select
                value={selectedDistance}
                onChange={(e) => setSelectedDistance(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">모든 거리</option>
                {competition?.categories?.map((distance) => (
                  <option key={distance} value={distance}>
                    {getDistanceLabel(distance)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            총 {filteredRegistrations.length}명의 참가자 (전체 {registrations.length}명 중)
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    참가자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    세부 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
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
                {filteredRegistrations.map((registration, index) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {registration.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {registration.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {registration.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{registration.age}세</div>
                        <div className="text-gray-500">
                          {registration.gender === 'male' ? '남성' : '여성'}
                        </div>
                        {registration.distance && (
                          <div className="text-blue-600 font-medium">
                            {getDistanceLabel(registration.distance)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(registration.created_at), 'MM.dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(registration.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <select
                          value={registration.payment_status}
                          onChange={(e) => updatePaymentStatus(
                            registration.id, 
                            e.target.value as 'pending' | 'confirmed' | 'cancelled'
                          )}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">입금대기</option>
                          <option value="confirmed">입금확인</option>
                          <option value="cancelled">취소</option>
                        </select>
                        {registration.payment_status === 'pending' && (
                          <button
                            onClick={() => confirmPayment(registration.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            입금확인
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRegistrations.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || selectedStatus !== 'all' 
                    ? '검색 조건에 맞는 참가자가 없습니다.' 
                    : '아직 참가자가 없습니다.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {registrations.some(reg => reg.notes) && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">특이사항이 있는 참가자</h3>
            <div className="space-y-4">
              {registrations
                .filter(reg => reg.notes)
                .map((registration) => (
                  <div key={registration.id} className="border-l-4 border-yellow-400 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {registration.name} ({registration.email})
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {registration.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}