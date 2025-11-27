'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Eye, Trash2, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Competition } from '@/types'
import ImageUpload from '@/components/ImageUpload'
import ContentImageUpload from '@/components/ContentImageUpload'
import MultipleImageUpload from '@/components/MultipleImageUpload'

// 거리 옵션 상수
const DISTANCE_OPTIONS = [
  { value: '3km', label: '3km' },
  { value: '5km', label: '5km' },
  { value: '10km', label: '10km' },
  { value: 'half', label: '하프마라톤 (21km)' },
  { value: 'full', label: '풀마라톤 (42km)' }
]

const competitionSchema = z.object({
  title: z.string().min(5, '대회명은 최소 5글자 이상이어야 합니다'),
  description: z.string().min(20, '대회 설명은 최소 20글자 이상이어야 합니다'),
  date: z.string().min(1, '대회 일시를 선택해주세요'),
  location: z.string().min(2, '대회 장소를 입력해주세요'),
  registration_start: z.string().min(1, '신청 시작일을 선택해주세요'),
  registration_end: z.string().min(1, '신청 마감일을 선택해주세요'),
  entry_fee: z.number().min(0, '참가비는 0원 이상이어야 합니다'),
  course_description: z.string(),
  course_image_url: z.string().optional(),
  prizes: z.string(),
  prizes_image_url: z.string().optional(),
  image_url: z.string().optional(),
  organizer: z.string().optional(),
  supervisor: z.string().optional(),
  sponsor: z.string().optional(),
  status: z.enum(['draft', 'published'])
})

type CompetitionFormData = z.infer<typeof competitionSchema>

export default function EditCompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.id as string

  const [activeTab, setActiveTab] = useState<'info' | 'photos'>('info')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [courseImageUrl, setCourseImageUrl] = useState('')
  const [prizesDescription, setPrizesDescription] = useState('')
  const [prizesImageUrl, setPrizesImageUrl] = useState('')
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [participationGroups, setParticipationGroups] = useState<Array<{
    id?: string
    name: string
    distance: string
    maxParticipants: number
    entryFee: number
    description?: string
  }>>([])
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null)
  const [photos, setPhotos] = useState<Array<{
    id: string
    image_url: string
    caption: string | null
    display_order: number
  }>>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosPage, setPhotosPage] = useState(1)
  const PHOTOS_PER_PAGE = 20
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema)
  })

  const watchStatus = watch('status')

  const addParticipationGroup = (group: {
    name: string
    distance: string
    maxParticipants: number
    entryFee: number
    description?: string
  }) => {
    if (editingGroupIndex !== null) {
      const updatedGroups = [...participationGroups]
      updatedGroups[editingGroupIndex] = group
      setParticipationGroups(updatedGroups)
      setEditingGroupIndex(null)
    } else {
      setParticipationGroups([...participationGroups, group])
    }
    setShowGroupForm(false)
  }

  const editParticipationGroup = (index: number) => {
    setEditingGroupIndex(index)
    setShowGroupForm(true)
  }

  const deleteParticipationGroup = (index: number) => {
    const updatedGroups = participationGroups.filter((_, i) => i !== index)
    setParticipationGroups(updatedGroups)
  }

  const fetchPhotos = async () => {
    setPhotosLoading(true)
    try {
      const { data, error } = await supabase
        .from('competition_photos')
        .select('*')
        .eq('competition_id', competitionId)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching photos:', error)
        return
      }

      setPhotos(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setPhotosLoading(false)
    }
  }

  const deletePhoto = async (photoId: string, imageUrl: string) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return

    try {
      // Storage에서 파일 삭제
      const filePath = imageUrl.split('/').slice(-3).join('/')
      const { error: storageError } = await supabase.storage
        .from('competition-images')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }

      // DB에서 삭제
      const { error: dbError } = await supabase
        .from('competition_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) {
        alert('사진 삭제 중 오류가 발생했습니다.')
        return
      }

      // 목록 새로고침
      fetchPhotos()
    } catch (error) {
      console.error('Delete error:', error)
      alert('사진 삭제 중 오류가 발생했습니다.')
    }
  }

  const updatePhotoOrder = async (photoId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('competition_photos')
        .update({ display_order: newOrder })
        .eq('id', photoId)

      if (error) {
        console.error('Update order error:', error)
        alert('순서 변경 중 오류가 발생했습니다.')
        return
      }

      fetchPhotos()
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    const currentPagePhotos = photos.slice((photosPage - 1) * PHOTOS_PER_PAGE, photosPage * PHOTOS_PER_PAGE)
    const currentPageIds = currentPagePhotos.map(p => p.id)
    const allSelected = currentPageIds.every(id => selectedPhotoIds.has(id))

    setSelectedPhotoIds(prev => {
      const newSet = new Set(prev)
      if (allSelected) {
        currentPageIds.forEach(id => newSet.delete(id))
      } else {
        currentPageIds.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }

  const deleteSelectedPhotos = async () => {
    if (selectedPhotoIds.size === 0) {
      alert('삭제할 사진을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedPhotoIds.size}개의 사진을 삭제하시겠습니까?`)) return

    try {
      const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id))

      // Storage에서 파일 삭제
      for (const photo of selectedPhotos) {
        const filePath = photo.image_url.split('/').slice(-3).join('/')
        const { error: storageError } = await supabase.storage
          .from('competition-images')
          .remove([filePath])

        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }

      // DB에서 삭제
      const { error: dbError } = await supabase
        .from('competition_photos')
        .delete()
        .in('id', Array.from(selectedPhotoIds))

      if (dbError) {
        alert('사진 삭제 중 오류가 발생했습니다.')
        return
      }

      alert(`${selectedPhotoIds.size}개의 사진이 삭제되었습니다.`)
      setSelectedPhotoIds(new Set())
      fetchPhotos()
    } catch (error) {
      console.error('Delete error:', error)
      alert('사진 삭제 중 오류가 발생했습니다.')
    }
  }

  const fetchCompetition = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single()

      if (error) {
        console.error('Error fetching competition:', error)
        alert('대회 정보를 불러오는 중 오류가 발생했습니다.')
        router.push('/admin')
        return
      }

      // 참가 그룹 정보 가져오기
      const { data: groupsData, error: groupsError } = await supabase
        .from('participation_groups')
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: true })

      if (groupsError) {
        console.error('Error fetching participation groups:', groupsError)
      }

      setCompetition(data)
      setImageUrl(data.image_url || '')
      setCourseDescription(data.course_description || '')
      setCourseImageUrl(data.course_image_url || '')
      setPrizesDescription(data.prizes || '')
      setPrizesImageUrl(data.prizes_image_url || '')

      // 참가 그룹 정보 설정
      if (groupsData) {
        const formattedGroups = groupsData.map(group => ({
          id: group.id,
          name: group.name,
          distance: group.distance,
          maxParticipants: group.max_participants,
          entryFee: group.entry_fee,
          description: group.description || undefined
        }))
        setParticipationGroups(formattedGroups)
      }

      // Convert dates to the format expected by datetime-local inputs
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString)
        // 로컬 타임존 유지하여 변환 (UTC 변환 방지)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      reset({
        title: data.title,
        description: data.description,
        date: formatDateForInput(data.date),
        location: data.location,
        registration_start: formatDateForInput(data.registration_start),
        registration_end: formatDateForInput(data.registration_end),
        entry_fee: data.entry_fee,
        course_description: data.course_description,
        course_image_url: data.course_image_url || '',
        prizes: data.prizes,
        prizes_image_url: data.prizes_image_url || '',
        image_url: data.image_url || '',
        organizer: data.organizer || '',
        supervisor: data.supervisor || '',
        sponsor: data.sponsor || '',
        status: data.status
      })
    } catch (error) {
      console.error('Error:', error)
      alert('대회 정보를 불러오는 중 오류가 발생했습니다.')
      router.push('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompetition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId])

  useEffect(() => {
    if (activeTab === 'photos') {
      fetchPhotos()
    }
  }, [activeTab])

  const handleImageUploaded = (url: string) => {
    setImageUrl(url)
    setValue('image_url', url)
  }

  const handleCourseContentChange = (description: string, imageUrl?: string) => {
    setCourseDescription(description)
    setCourseImageUrl(imageUrl || '')
    setValue('course_description', description)
    setValue('course_image_url', imageUrl || '')
  }

  const handlePrizesContentChange = (description: string, imageUrl?: string) => {
    setPrizesDescription(description)
    setPrizesImageUrl(imageUrl || '')
    setValue('prizes', description)
    setValue('prizes_image_url', imageUrl || '')
  }

  const onSubmit = async (data: CompetitionFormData) => {
    if (isSubmitting) return

    if (participationGroups.length === 0) {
      alert('최소 하나의 참가 그룹을 추가해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 대회 기본 정보 업데이트
      const competitionData = {
        ...data,
        max_participants: participationGroups.reduce((sum, group) => sum + group.maxParticipants, 0)
      }

      const { error } = await supabase
        .from('competitions')
        .update(competitionData)
        .eq('id', competitionId)

      if (error) {
        console.error('Error updating competition:', error)
        alert('대회 수정 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      // 2. 기존 참가 그룹 가져오기
      const { data: existingGroups, error: fetchError } = await supabase
        .from('participation_groups')
        .select('*')
        .eq('competition_id', competitionId)

      if (fetchError) {
        console.error('Error fetching existing groups:', fetchError)
        alert('참가 그룹 조회 중 오류가 발생했습니다.')
        return
      }

      // 3. 참가 그룹 UPSERT (distance 기준으로 매칭하여 기존 ID 유지)
      const groupsData = participationGroups.map(group => {
        // distance 기준으로 기존 그룹 찾기 (ID 유지)
        const existingGroup = existingGroups?.find(eg => eg.distance === group.distance)

        if (existingGroup) {
          // 기존 그룹 업데이트 (ID 유지)
          return {
            id: existingGroup.id,
            competition_id: competitionId,
            name: group.name,
            distance: group.distance,
            max_participants: group.maxParticipants,
            entry_fee: group.entryFee,
            description: group.description || null,
            created_at: existingGroup.created_at
          }
        } else {
          // 새 그룹 추가
          return {
            competition_id: competitionId,
            name: group.name,
            distance: group.distance,
            max_participants: group.maxParticipants,
            entry_fee: group.entryFee,
            description: group.description || null
          }
        }
      })

      // UPSERT 실행 (id가 있으면 update, 없으면 insert)
      const { error: upsertError } = await supabase
        .from('participation_groups')
        .upsert(groupsData, { onConflict: 'id' })

      if (upsertError) {
        console.error('Error upserting groups:', upsertError)
        alert('참가 그룹 수정 중 오류가 발생했습니다.')
        return
      }

      // 4. 삭제된 그룹 처리 (UI에서 제거된 distance는 DB에서도 삭제)
      const currentDistances = participationGroups.map(g => g.distance)
      const groupsToDelete = existingGroups?.filter(eg => !currentDistances.includes(eg.distance))

      if (groupsToDelete && groupsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('participation_groups')
          .delete()
          .in('id', groupsToDelete.map(g => g.id))

        if (deleteError) {
          console.error('Error deleting removed groups:', deleteError)
          // 경고만 표시하고 계속 진행
          console.warn('일부 그룹 삭제 중 오류가 발생했습니다.')
        }
      }

      alert('대회가 성공적으로 수정되었습니다!')
      router.push('/admin')
    } catch (error) {
      console.error('Error:', error)
      alert('대회 수정 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">대회 수정</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/competitions/${competitionId}`}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-4 w-4 mr-1" />
                미리보기
              </Link>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                watchStatus === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {watchStatus === 'published' ? '공개' : '임시저장'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              기본 정보
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'photos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              사진 관리
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'info' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">기본 정보</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  대회명 *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 2024 봄맞이 한강 러닝 대회"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  대회 설명 *
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="대회에 대한 자세한 설명을 입력하세요..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    대회 일시 *
                  </label>
                  <input
                    {...register('date')}
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    대회 장소 *
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 한강공원 반포지구"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImageUrl={imageUrl}
                className="col-span-full"
              />
            </div>
          </div>

          {/* 주최/주관/후원 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">주최/주관/후원 정보</h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-2">
                  주최
                </label>
                <input
                  {...register('organizer')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 런텐(RUN10)"
                />
              </div>

              <div>
                <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700 mb-2">
                  주관
                </label>
                <input
                  {...register('supervisor')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 대한러닝협회"
                />
              </div>

              <div>
                <label htmlFor="sponsor" className="block text-sm font-medium text-gray-700 mb-2">
                  후원
                </label>
                <input
                  {...register('sponsor')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 나이키, 아디다스"
                />
              </div>
            </div>
          </div>

          {/* 참가 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">참가 정보</h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    참가 그룹 설정 *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroupIndex(null)
                      setShowGroupForm(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    그룹 추가
                  </button>
                </div>

                {participationGroups.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">참가 그룹을 추가해주세요</p>
                    <p className="text-xs text-gray-400 mt-1">각 그룹마다 거리, 참가자 수, 참가비를 설정할 수 있습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participationGroups.map((group, index) => (
                      <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{group.name}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="inline-block mr-4">
                                거리: {DISTANCE_OPTIONS.find(d => d.value === group.distance)?.label || group.distance}
                              </span>
                              <span className="inline-block mr-4">
                                정원: {group.maxParticipants}명
                              </span>
                              <span className="inline-block">
                                참가비: ₩{group.entryFee.toLocaleString()}
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-xs text-gray-500 mt-2">{group.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => editParticipationGroup(index)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteParticipationGroup(index)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 mt-2">
                      총 참가자 정원: {participationGroups.reduce((sum, group) => sum + group.maxParticipants, 0)}명
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="registration_start" className="block text-sm font-medium text-gray-700 mb-2">
                  신청 시작일 *
                </label>
                <input
                  {...register('registration_start')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.registration_start && (
                  <p className="mt-1 text-sm text-red-600">{errors.registration_start.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="registration_end" className="block text-sm font-medium text-gray-700 mb-2">
                  신청 마감일 *
                </label>
                <input
                  {...register('registration_end')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.registration_end && (
                  <p className="mt-1 text-sm text-red-600">{errors.registration_end.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">상세 정보</h2>
            
            <div className="space-y-8">
              <ContentImageUpload
                title="코스 설명"
                description="대회 코스에 대한 상세한 설명과 코스 지도나 사진을 함께 업로드할 수 있습니다."
                currentDescription={courseDescription}
                currentImageUrl={courseImageUrl}
                onContentChange={handleCourseContentChange}
              />
              {errors.course_description && (
                <p className="mt-1 text-sm text-red-600">{errors.course_description.message}</p>
              )}

              <ContentImageUpload
                title="시상 내역"
                description="시상 내역과 기념품 정보, 시상품 사진을 함께 업로드할 수 있습니다."
                currentDescription={prizesDescription}
                currentImageUrl={prizesImageUrl}
                onContentChange={handlePrizesContentChange}
              />
              {errors.prizes && (
                <p className="mt-1 text-sm text-red-600">{errors.prizes.message}</p>
              )}
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">공개 설정</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  {...register('status')}
                  id="draft"
                  type="radio"
                  value="draft"
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="draft" className="text-sm text-gray-700">
                  <span className="font-medium">임시저장</span> - 관리자만 볼 수 있습니다
                </label>
              </div>
              <div className="flex items-center">
                <input
                  {...register('status')}
                  id="published"
                  type="radio"
                  value="published"
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="published" className="text-sm text-gray-700">
                  <span className="font-medium">공개</span> - 모든 사용자가 볼 수 있고 신청할 수 있습니다
                </label>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* 새 사진 업로드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">사진 업로드</h2>
              <MultipleImageUpload
                competitionId={competitionId}
                onUploadComplete={() => {
                  fetchPhotos()
                }}
              />
            </div>

            {/* 기존 사진 목록 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  업로드된 사진 ({photos.length}장)
                  {selectedPhotoIds.size > 0 && (
                    <span className="ml-3 text-sm font-normal text-blue-600">
                      {selectedPhotoIds.size}개 선택됨
                    </span>
                  )}
                </h2>
                {photos.length > 0 && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          photos.slice((photosPage - 1) * PHOTOS_PER_PAGE, photosPage * PHOTOS_PER_PAGE)
                            .every(p => selectedPhotoIds.has(p.id)) &&
                          photos.slice((photosPage - 1) * PHOTOS_PER_PAGE, photosPage * PHOTOS_PER_PAGE).length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">현재 페이지 전체 선택</span>
                    </label>
                    {selectedPhotoIds.size > 0 && (
                      <button
                        onClick={deleteSelectedPhotos}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        선택 삭제 ({selectedPhotoIds.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {photosLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 업로드된 사진이 없습니다.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {photos
                      .slice((photosPage - 1) * PHOTOS_PER_PAGE, photosPage * PHOTOS_PER_PAGE)
                      .map((photo, idx) => {
                        const actualIndex = (photosPage - 1) * PHOTOS_PER_PAGE + idx
                        return (
                          <div
                            key={photo.id}
                            className={`bg-gray-50 border-2 rounded-lg overflow-hidden transition-all ${
                              selectedPhotoIds.has(photo.id)
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="relative aspect-video">
                              <img
                                src={photo.image_url}
                                alt={photo.caption || `사진 ${actualIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                                {actualIndex + 1}번째
                              </div>
                              <div className="absolute top-2 right-2">
                                <input
                                  type="checkbox"
                                  checked={selectedPhotoIds.has(photo.id)}
                                  onChange={() => togglePhotoSelection(photo.id)}
                                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              {photo.caption && (
                                <p className="text-sm text-gray-700 line-clamp-2">{photo.caption}</p>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updatePhotoOrder(photo.id, Math.max(0, photo.display_order - 1))}
                                    disabled={actualIndex === 0}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    ←
                                  </button>
                                  <button
                                    onClick={() => updatePhotoOrder(photo.id, Math.min(photos.length - 1, photo.display_order + 1))}
                                    disabled={actualIndex === photos.length - 1}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    →
                                  </button>
                                </div>

                                <button
                                  onClick={() => deletePhoto(photo.id, photo.image_url)}
                                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 inline mr-1" />
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* 페이지네이션 */}
                  {photos.length > PHOTOS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPhotosPage(prev => Math.max(1, prev - 1))}
                        disabled={photosPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      {Array.from({ length: Math.ceil(photos.length / PHOTOS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setPhotosPage(page)}
                          className={`px-3 py-2 border rounded-lg ${
                            page === photosPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPhotosPage(prev => Math.min(Math.ceil(photos.length / PHOTOS_PER_PAGE), prev + 1))}
                        disabled={photosPage === Math.ceil(photos.length / PHOTOS_PER_PAGE)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 참가 그룹 추가/수정 모달 */}
      {showGroupForm && (
        <ParticipationGroupModal
          group={editingGroupIndex !== null ? participationGroups[editingGroupIndex] : undefined}
          onSave={addParticipationGroup}
          onCancel={() => {
            setShowGroupForm(false)
            setEditingGroupIndex(null)
          }}
        />
      )}
    </div>
  )
}

// 참가 그룹 추가/수정 모달 컴포넌트
function ParticipationGroupModal({
  group,
  onSave,
  onCancel
}: {
  group?: {
    name: string
    distance: string
    maxParticipants: number
    entryFee: number
    description?: string
  }
  onSave: (group: {
    name: string
    distance: string
    maxParticipants: number
    entryFee: number
    description?: string
  }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    distance: group?.distance || '',
    maxParticipants: group?.maxParticipants || 50,
    entryFee: group?.entryFee || 30000,
    description: group?.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('그룹명을 입력해주세요.')
      return
    }

    if (!formData.distance) {
      alert('거리를 선택해주세요.')
      return
    }

    if (formData.maxParticipants <= 0) {
      alert('참가자 수는 1명 이상이어야 합니다.')
      return
    }

    if (formData.entryFee < 0) {
      alert('참가비는 0원 이상이어야 합니다.')
      return
    }

    onSave({
      name: formData.name.trim(),
      distance: formData.distance,
      maxParticipants: formData.maxParticipants,
      entryFee: formData.entryFee,
      description: formData.description.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {group ? '참가 그룹 수정' : '참가 그룹 추가'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              그룹명 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="예: 5km 일반부, 10km 엘리트"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거리 *
            </label>
            <select
              value={formData.distance}
              onChange={(e) => setFormData({...formData, distance: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">거리 선택</option>
              {DISTANCE_OPTIONS.map((distance) => (
                <option key={distance.value} value={distance.value}>
                  {distance.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              최대 참가자 수 *
            </label>
            <input
              type="number"
              min="1"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              참가비 (원) *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.entryFee}
              onChange={(e) => setFormData({...formData, entryFee: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 (선택사항)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="그룹에 대한 추가 설명..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {group ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}