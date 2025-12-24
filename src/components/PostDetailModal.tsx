'use client'

import { useState, useEffect } from 'react'
import { X, Edit, Trash2, MessageSquare, Send, Eye, Pin, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatKST } from '@/lib/dateUtils'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AdminReplyModal from './AdminReplyModal'
import MessageModal from './MessageModal'
import PasswordCheckModal from './PasswordCheckModal'

const commentSchema = z.object({
  content: z.string()
    .min(2, '댓글은 최소 2자 이상이어야 합니다')
    .max(1000, '댓글은 최대 1,000자까지 가능합니다')
})

type CommentFormData = z.infer<typeof commentSchema>

interface PostDetailModalProps {
  isOpen: boolean
  onClose: () => void
  post: any
  onPostUpdated: () => void
  onPostDeleted: () => void
  isAdminView?: boolean
}

export default function PostDetailModal({ isOpen, onClose, post, onPostUpdated, onPostDeleted, isAdminView = false }: PostDetailModalProps) {
  const { user, getGradeInfo } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    is_private: post?.is_private || false,
    post_password: post?.post_password || ''
  })
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdminReply, setShowAdminReply] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [messageProps, setMessageProps] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    message: '',
    showCancel: false,
    onConfirm: undefined as (() => void) | undefined
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  })

  const isAdmin = () => {
    return isAdminView || (typeof window !== 'undefined' && window.location.pathname.includes('/admin/'))
  }

  // post가 변경될 때마다 editFormData 업데이트 및 댓글 로드
  useEffect(() => {
    if (post) {
      const newFormData = {
        title: post.title || '',
        content: post.content || '',
        is_private: post.is_private || false,
        post_password: post.post_password || ''
      }
      setEditFormData(newFormData)

      // 비밀글 접근 권한 확인
      if (post.is_private) {
        // 관리자는 바로 통과
        if (user?.role === 'admin') {
          setIsPasswordVerified(true)
          loadComments()
        }
        // 작성자는 바로 통과
        else if (user?.id === post.user_id) {
          setIsPasswordVerified(true)
          loadComments()
        }
        // 그 외에는 비밀번호 확인 필요
        else {
          setIsPasswordVerified(false)
          setShowPasswordModal(true)
        }
      } else {
        setIsPasswordVerified(true)
        loadComments()
      }
    }
  }, [post, user])

  // 통합 시스템에서는 답글 시스템 대신 댓글 시스템만 사용
  const fetchReplies = async () => {
    // 더 이상 사용하지 않음 - 댓글 시스템으로 통합됨
    setReplies([])
  }

  const loadComments = async () => {
    if (!post) return

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          users (
            user_id,
            name,
            grade,
            role
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (error) {
      console.error('댓글 로드 오류:', error)
    }
  }

  const onCommentSubmit = async (data: CommentFormData) => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      return
    }

    setIsSubmittingComment(true)

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: post.id,
          user_id: user.id,
          content: data.content
        }])

      if (error) throw error

      reset()
      await loadComments()
      onPostUpdated() // 댓글 추가 시 부모 컴포넌트에 알림
    } catch (error) {
      console.error('댓글 등록 오류:', error)
      alert('댓글 등록 중 오류가 발생했습니다')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user) return

    const canDelete = user.role === 'admin' || user.id === commentUserId

    if (!canDelete) {
      alert('댓글 삭제 권한이 없습니다')
      return
    }

    if (confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('post_comments')
          .delete()
          .eq('id', commentId)

        if (error) throw error

        await loadComments()
        onPostUpdated() // 댓글 삭제 시 부모 컴포넌트에 알림
      } catch (error) {
        console.error('댓글 삭제 오류:', error)
        alert('댓글 삭제 중 오류가 발생했습니다')
      }
    }
  }

  // 수정 모드 상태 변경 시 로그
  useEffect(() => {
    if (isEditing) {
    }
  }, [isEditing, editFormData])

  if (!isOpen || !post) return null

  // 디버깅을 위한 콘솔 로그


  const handlePasswordCheck = (inputPassword: string) => {

    if (post.post_password === inputPassword) {
      setIsPasswordVerified(true)
      setShowPasswordModal(false)
      setPasswordError('')
      loadComments()
    } else {
      setPasswordError('비밀번호가 일치하지 않습니다')
    }
  }

  const handleEdit = () => {
    const newFormData = {
      title: post.title || '',
      content: post.content || '',
      is_private: post.is_private || false,
      post_password: post.post_password || ''
    }
    setEditFormData(newFormData)
    setEditPasswordConfirm(post.post_password || '')
    setIsEditing(true)
  }

  const handleDeleteRequest = () => {
    setMessageProps({
      type: 'warning',
      message: '정말로 이 게시글을 삭제하시겠습니까?',
      showCancel: true,
      onConfirm: handleDelete
    })
    setShowMessage(true)
  }

  const handleDelete = async () => {
    try {
      // 통합 시스템에서는 모든 게시글이 community_posts 테이블에 저장됨
      // 댓글도 함께 삭제 (CASCADE 설정으로 자동 삭제되지만 명시적으로 처리)
      await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', post.id)

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      onPostDeleted()
      onClose()
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      setMessageProps({
        type: 'error',
        message: '게시글 삭제 중 오류가 발생했습니다.',
        showCancel: false,
        onConfirm: undefined
      })
      setShowMessage(true)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 비밀글인 경우 비밀번호 체크
    if (editFormData.is_private) {
      if (!editFormData.post_password.trim()) {
        setMessageProps({
          type: 'error',
          message: '비밀번호를 입력해주세요',
          showCancel: false,
          onConfirm: undefined
        })
        setShowMessage(true)
        return
      }
      if (editFormData.post_password.length !== 4 || !/^\d+$/.test(editFormData.post_password)) {
        setMessageProps({
          type: 'error',
          message: '비밀번호는 4자리 숫자여야 합니다',
          showCancel: false,
          onConfirm: undefined
        })
        setShowMessage(true)
        return
      }
      if (!editPasswordConfirm.trim()) {
        setMessageProps({
          type: 'error',
          message: '비밀번호 확인을 입력해주세요',
          showCancel: false,
          onConfirm: undefined
        })
        setShowMessage(true)
        return
      }
      if (editFormData.post_password !== editPasswordConfirm) {
        setMessageProps({
          type: 'error',
          message: '비밀번호가 일치하지 않습니다',
          showCancel: false,
          onConfirm: undefined
        })
        setShowMessage(true)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // 통합 시스템에서는 모든 게시글이 community_posts 테이블에 저장됨
      const { error } = await supabase
        .from('community_posts')
        .update({
          title: editFormData.title,
          content: editFormData.content,
          is_private: editFormData.is_private,
          post_password: editFormData.is_private ? editFormData.post_password : null,
          // 로컬 타임존으로 업데이트 시간 설정 (UTC 변환 방지)
          updated_at: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString()
        })
        .eq('id', post.id)

      if (error) throw error

      onPostUpdated()
      setIsEditing(false)
      onClose()
    } catch (error) {
      console.error('게시글 수정 오류:', error)
      setMessageProps({
        type: 'error',
        message: '게시글 수정 중 오류가 발생했습니다.',
        showCancel: false,
        onConfirm: undefined
      })
      setShowMessage(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 통합 시스템에서는 답글 대신 댓글 시스템만 사용

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setEditFormData(prev => ({
        ...prev,
        [name]: checked,
        // 비밀글 체크 해제시 비밀번호도 초기화
        ...(name === 'is_private' && !checked ? { post_password: '' } : {})
      }))
      if (name === 'is_private' && !checked) {
        setEditPasswordConfirm('')
      }
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const formatDate = (dateString: string) => {
    return formatKST(dateString, 'yyyy년 MM월 dd일 HH:mm')
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index !== content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  // 통합 시스템에서는 모든 게시글이 community_posts에 저장됨
  // competition_id가 있으면 대회별 게시글, 없으면 일반 커뮤니티 게시글
  const isCompetitionPost = post?.competition_id
  const isCommunityPost = !post?.competition_id

  return (
    <>
      {/* 메인 모달 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCompetitionPost ? '대회 게시판' : '회원게시판'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* 비밀글 옵션 */}
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-is_private"
                      name="is_private"
                      checked={editFormData.is_private}
                      onChange={handleEditInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-is_private" className="text-sm font-medium text-blue-900 cursor-pointer">
                      🔒 비밀글로 설정
                    </label>
                  </div>

                  {editFormData.is_private && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <label htmlFor="edit-post_password" className="block text-xs font-medium text-blue-800 mb-1">
                          비밀번호 (4자리 숫자)
                        </label>
                        <input
                          type="password"
                          id="edit-post_password"
                          name="post_password"
                          value={editFormData.post_password}
                          onChange={handleEditInputChange}
                          maxLength={4}
                          placeholder="4자리 숫자 입력"
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-post_password_confirm" className="block text-xs font-medium text-blue-800 mb-1">
                          비밀번호 확인
                        </label>
                        <input
                          type="password"
                          id="edit-post_password_confirm"
                          value={editPasswordConfirm}
                          onChange={(e) => setEditPasswordConfirm(e.target.value)}
                          maxLength={4}
                          placeholder="비밀번호 재입력"
                          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {editFormData.post_password && editPasswordConfirm && editFormData.post_password !== editPasswordConfirm && (
                          <p className="mt-1 text-xs text-red-600">
                            비밀번호가 일치하지 않습니다
                          </p>
                        )}
                        {editFormData.post_password && editPasswordConfirm && editFormData.post_password === editPasswordConfirm && (
                          <p className="mt-1 text-xs text-green-600">
                            비밀번호가 일치합니다
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-blue-700">
                        작성자와 관리자만 게시글을 볼 수 있습니다
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <textarea
                    id="edit-content"
                    name="content"
                    value={editFormData.content}
                    onChange={handleEditInputChange}
                    required
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? '수정 중...' : '수정완료'}
                  </button>
                </div>
              </form>
            ) : !isPasswordVerified ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-gray-600">비밀번호 확인이 필요합니다</p>
                </div>
              </div>
            ) : (
              <>
                {/* 게시글 */}
                <article className="bg-white rounded-lg shadow overflow-hidden mb-8">
                  {/* 게시글 헤더 */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isCommunityPost && post.is_notice && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <Pin className="w-3 h-3 mr-1" />
                            공지
                          </span>
                        )}
                        {post.is_private && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            🔒 비밀글
                          </span>
                        )}
                        <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
                      </div>
                      {user && (user.role === 'admin' || user.id === post.user_id) && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleEdit}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleDeleteRequest}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {post.users ? (
                            <>
                              <img
                                src={getGradeInfo(post.users.grade).icon}
                                alt="등급"
                                className="w-5 h-5"
                              />
                              <span className="font-medium">{post.users.name}</span>
                              <span className="text-xs opacity-75">({getGradeInfo(post.users.grade).display})</span>
                            </>
                          ) : (
                            <span className="font-medium">알 수 없는 사용자</span>
                          )}
                        </div>
                        <span>•</span>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span>{post.views || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* 게시글 내용 */}
                  <div className="px-6 py-6">
                    {post.image_url && (
                      <div className="mb-6">
                        <img
                          src={post.image_url}
                          alt="첨부 이미지"
                          className="max-w-full h-auto rounded-lg shadow-md"
                        />
                      </div>
                    )}

                    <div className="text-gray-800 leading-relaxed">
                      {formatContent(post.content)}
                    </div>
                  </div>
                </article>

                {/* 댓글 섹션 - 모든 게시글에서 사용 */}
                {(
                  <section className="bg-white rounded-lg shadow">
                    {/* 댓글 헤더 */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-medium text-gray-900">
                          댓글 {comments.length}개
                        </h2>
                      </div>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="divide-y divide-gray-200">
                      {comments.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>첫 번째 댓글을 작성해보세요!</p>
                        </div>
                      ) : (
                        comments.map((comment) => {
                          const canDeleteComment = user && (user.role === 'admin' || user.id === comment.user_id)
                          const commenterGradeInfo = comment.users ? getGradeInfo(comment.users.grade) : null

                          return (
                            <div key={comment.id} className="px-6 py-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    {commenterGradeInfo ? (
                                      <>
                                        <img
                                          src={commenterGradeInfo.icon}
                                          alt="등급"
                                          className="w-5 h-5"
                                        />
                                        <span className="font-medium text-gray-900">{comment.users.name}</span>
                                        <span className="text-xs text-gray-500">({commenterGradeInfo.display})</span>
                                      </>
                                    ) : (
                                      <span className="font-medium text-gray-900">알 수 없는 사용자</span>
                                    )}
                                    <span className="text-sm text-gray-500">
                                      {formatDate(comment.created_at)}
                                    </span>
                                  </div>
                                  <div className="text-gray-800 text-sm leading-relaxed">
                                    {formatContent(comment.content)}
                                  </div>
                                </div>
                                {canDeleteComment && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                                    className="text-gray-400 hover:text-red-500 ml-2 p-1"
                                    title="댓글 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* 댓글 작성 */}
                    {user ? (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <form onSubmit={handleSubmit(onCommentSubmit)} className="space-y-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <img
                              src={getGradeInfo(user.grade).icon}
                              alt="등급"
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-medium text-gray-700">{user.name}</span>
                          </div>
                          <textarea
                            {...register('content')}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            placeholder="댓글을 입력하세요..."
                          />
                          {errors.content && (
                            <p className="text-red-500 text-sm">{errors.content.message}</p>
                          )}
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={isSubmittingComment}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                              <span>{isSubmittingComment ? '등록 중...' : '댓글 등록'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="px-6 py-4 border-t border-gray-200 bg-yellow-50">
                        <p className="text-center text-yellow-800">
                          댓글을 작성하려면 <strong>로그인</strong>이 필요합니다.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* 답글 목록 - 더 이상 사용하지 않음 */}
                {false && (
                  <div className="mt-8 border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">댓글 ({replies.length})</h4>
                    <div className="space-y-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="bg-blue-50 rounded-lg p-4 ml-8">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-blue-800">
                                {reply.is_admin_reply ? '👑 관리자' : reply.author}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatKST(reply.created_at, 'yyyy.MM.dd HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {reply.is_admin_reply && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  관리자 댓글
                                </span>
                              )}
                              {isAdmin() && reply.is_admin_reply && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleEditReply(reply)}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReply(reply)}
                                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {reply.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 관리자 댓글 작성 버튼 - 대회 게시글에서만 별도 버튼 제공 */}
                {isCompetitionPost && isAdmin() && !post.parent_id && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAdminReply(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>관리자 댓글 작성</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>


      {/* 관리자 댓글 작성 모달 */}
      <AdminReplyModal
        isOpen={showAdminReply}
        onClose={() => setShowAdminReply(false)}
        parentPost={post}
        onReplyCreated={() => {
          loadComments()
          onPostUpdated()
        }}
      />


      <MessageModal
        isOpen={showMessage}
        onClose={() => setShowMessage(false)}
        type={messageProps.type}
        message={messageProps.message}
        showCancel={messageProps.showCancel}
        onConfirm={messageProps.onConfirm}
      />

      <PasswordCheckModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          onClose()
        }}
        onConfirm={handlePasswordCheck}
        errorMessage={passwordError}
      />
    </>
  )
}