'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Trash2,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { formatKST } from '@/lib/dateUtils'

interface Member {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
  role: 'admin' | 'user'
  record_time: number
  created_at: string
}

export default function AdminMembersPage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/')
      return
    }
    loadMembers()
  }, [user, router])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('회원 목록 로드 오류:', error)
      alert('회원 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (memberId === user?.id) {
      alert('자신의 계정은 삭제할 수 없습니다.')
      return
    }

    if (confirm(`정말 "${memberName}" 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', memberId)

        if (error) throw error

        alert('회원이 삭제되었습니다.')
        loadMembers()
      } catch (error) {
        console.error('회원 삭제 오류:', error)
        alert('회원 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const toggleRole = async (memberId: string, currentRole: string) => {
    if (memberId === user?.id) {
      alert('자신의 권한은 변경할 수 없습니다.')
      return
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const message = newRole === 'admin' 
      ? '관리자 권한을 부여하시겠습니까?' 
      : '관리자 권한을 해제하시겠습니까?'

    if (confirm(message)) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role: newRole })
          .eq('id', memberId)

        if (error) throw error

        alert(`권한이 ${newRole === 'admin' ? '관리자로' : '일반 사용자로'} 변경되었습니다.`)
        loadMembers()
      } catch (error) {
        console.error('권한 변경 오류:', error)
        alert('권한 변경 중 오류가 발생했습니다.')
      }
    }
  }

  const exportToCSV = () => {
    const csvHeader = 'ID,이름,이메일,전화번호,등급,권한,기록시간,가입일\n'
    const csvContent = filteredMembers.map(member => {
      const gradeInfo = getGradeInfo(member.grade)
      return [
        member.user_id,
        member.name,
        member.email,
        member.phone,
        gradeInfo.display,
        member.role === 'admin' ? '관리자' : '일반회원',
        member.record_time === 999 ? '미기록' : `${member.record_time}분`,
        formatKST(member.created_at, 'yyyy.MM.dd')
      ].join(',')
    }).join('\n')

    const blob = new Blob(['\uFEFF' + csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `회원목록_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGrade = gradeFilter === 'all' || member.grade === gradeFilter
    const matchesRole = roleFilter === 'all' || member.role === roleFilter

    return matchesSearch && matchesGrade && matchesRole
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
                <Users className="h-8 w-8 mr-3 text-red-600" />
                회원 관리 ({members.length})
              </h1>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="이름, ID, 이메일로 검색..."
                />
              </div>
            </div>
            <div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">모든 등급</option>
                <option value="cheetah">치타족</option>
                <option value="horse">홀스족</option>
                <option value="wolf">울프족</option>
                <option value="turtle">터틀족</option>
                <option value="bolt">볼타족</option>
              </select>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">모든 권한</option>
                <option value="admin">관리자</option>
                <option value="user">일반회원</option>
              </select>
            </div>
          </div>
        </div>

        {/* 회원 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    회원정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기록시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const gradeInfo = getGradeInfo(member.grade)
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">ID: {member.user_id}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{gradeInfo.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{gradeInfo.display}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role === 'admin' ? '관리자' : '일반회원'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.record_time === 999 ? '미기록' : `${member.record_time}분`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatKST(member.created_at, 'yyyy.MM.dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleRole(member.id, member.role)}
                          disabled={member.id === user.id}
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                            member.id === user.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : member.role === 'admin'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {member.role === 'admin' ? '권한해제' : '관리자로'}
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          disabled={member.id === user.id}
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                            member.id === user.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
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

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || gradeFilter !== 'all' || roleFilter !== 'all' 
                  ? '검색 조건에 맞는 회원이 없습니다.' 
                  : '등록된 회원이 없습니다.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}