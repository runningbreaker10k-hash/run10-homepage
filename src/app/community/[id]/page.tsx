'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, Trash2, MessageSquare, Send, Eye, Pin, AlertTriangle, Ban, MoreVertical } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { formatKST } from '@/lib/dateUtils'

const commentSchema = z.object({
  content: z.string()
    .min(2, '댓글은 최소 2자 이상이어야 합니다')
    .max(1000, '댓글은 최대 1,000자까지 가능합니다')
})

type CommentFormData = z.infer<typeof commentSchema>

interface Post {
  id: string
  title: string
  content: string
  image_url?: string
  views: number
  is_notice: boolean
  report_count: number
  created_at: string
  updated_at: string
  user_id: string
  users: {
    user_id: string
    name: string
    grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
    role: 'admin' | 'user'
  }
}

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  users: {
    user_id: string
    name: string
    grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
    role: 'admin' | 'user'
  }
}

export default function CommunityPostPage() {
  const { user, getGradeInfo } = useAuth()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema)
  })

  useEffect(() => {
    if (postId) {
      loadPost()
      loadComments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.menu-container')) {
        setShowPostMenu(false)
        setOpenCommentMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadPost = async () => {
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
          )
        `)
        .eq('id', postId)
        .single()

      if (error) throw error

      setPost(data)
    } catch (error) {
      console.error('게시글 로드 오류:', error)
      alert('게시글을 찾을 수 없습니다')
      router.push('/community')
    }
  }

  const loadComments = async () => {
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
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (error) {
      console.error('댓글 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post || !user) return

    const canDelete = user.role === 'admin' || user.id === post.user_id

    if (!canDelete) {
      alert('게시글 삭제 권한이 없습니다')
      return
    }

    if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      try {
        // 이미지가 있는 경우 Storage에서도 삭제
        if (post.image_url) {
          const imagePath = post.image_url.split('/').pop()
          if (imagePath) {
            await supabase.storage
              .from('competition-images')
              .remove([`community/${imagePath}`])
          }
        }

        const { error } = await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId)

        if (error) throw error

        alert('게시글이 삭제되었습니다')
        router.push('/community')
      } catch (error) {
        console.error('게시글 삭제 오류:', error)
        alert('게시글 삭제 중 오류가 발생했습니다')
      }
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
          post_id: postId,
          user_id: user.id,
          content: data.content
        }])

      if (error) throw error

      reset()
      await loadComments()
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
      } catch (error) {
        console.error('댓글 삭제 오류:', error)
        alert('댓글 삭제 중 오류가 발생했습니다')
      }
    }
  }

  const handleReportComment = async (commentId: string, currentReportCount: number) => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      return
    }

    if (confirm('해당 댓글을 신고하겠습니까?\n신고된 댓글은 24시간내에 운영자가 검토후 삭제등 조치가 됩니다.')) {
      try {
        const { error } = await supabase
          .from('post_comments')
          .update({ report_count: (currentReportCount || 0) + 1 })
          .eq('id', commentId)

        if (error) throw error

        alert('신고처리 완료되었습니다.')
        await loadComments()
      } catch (error) {
        console.error('댓글 신고 오류:', error)
        alert('신고 처리 중 오류가 발생했습니다')
      }
    }
  }

  const handleBlockCommentUser = () => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      return
    }

    if (confirm('해당 사용자의 댓글을 모두 차단하시겠습니까?')) {
      alert('차단처리 완료되었습니다.')
    }
  }

  const handleReportPost = async () => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      return
    }

    if (!post) return

    if (confirm('해당 게시글을 신고하겠습니까?\n신고된 글은 24시간내에 운영자가 검토후 삭제등 조치가 됩니다.')) {
      try {
        const { error } = await supabase
          .from('community_posts')
          .update({ report_count: (post.report_count || 0) + 1 })
          .eq('id', postId)

        if (error) throw error

        alert('신고처리 완료되었습니다.')
        await loadPost()
      } catch (error) {
        console.error('신고 처리 오류:', error)
        alert('신고 처리 중 오류가 발생했습니다')
      }
    }
  }

  const handleBlockUser = () => {
    if (!user) {
      alert('로그인 후 이용해주세요')
      return
    }

    if (confirm('해당 사용자의 게시글을 모두 차단하시겠습니까?')) {
      alert('차단처리 완료되었습니다.')
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

  if (isLoading || !post) {
    return (
      <div className="min-h-screen pt-16 bg-gray-50">
        {/* 히어로 섹션 로딩 */}
        <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-12 sm:py-20">
          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-6 sm:h-12 bg-white/20 rounded w-1/3 mb-2 sm:mb-4"></div>
              <div className="h-4 sm:h-6 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        </section>

        {/* 메인 컨텐츠 로딩 */}
        <section className="py-6 sm:py-8">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="animate-pulse bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const canEditPost = user && (user.role === 'admin' || user.id === post.user_id)
  const authorGradeInfo = getGradeInfo(post.users.grade)

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-12 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/community-hero-bg.jpg"
            alt="게시글 상세 배경"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-6">게시글</h1>
              <p className="text-sm sm:text-xl md:text-2xl text-red-100 leading-relaxed">
                런텐 회원들과 함께하는 소통공간
              </p>
            </div>
            <button
              onClick={() => router.push('/community')}
              className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm sm:text-base font-medium touch-manipulation backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
              <span>목록으로</span>
            </button>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* 게시글 */}
          <article className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-6 sm:mb-8">
            {/* 게시글 헤더 */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-red-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  {post.is_notice && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white w-fit">
                      <Pin className="w-3 h-3 mr-1 flex-shrink-0" />
                      공지
                    </span>
                  )}
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{post.title}</h1>
                </div>
                {canEditPost && (
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => router.push(`/community/${postId}/edit`)}
                      className="text-gray-500 hover:text-red-600 p-1 sm:p-2 rounded-lg hover:bg-white/50 transition-colors touch-manipulation"
                      title="수정"
                    >
                      <Edit className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="text-red-500 hover:text-red-700 p-1 sm:p-2 rounded-lg hover:bg-white/50 transition-colors touch-manipulation"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-gray-600">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <img
                      src={authorGradeInfo.icon}
                      alt="등급"
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    />
                    <span className="font-medium break-words">{post.users.name}</span>
                    <span className="text-xs opacity-75">({authorGradeInfo.display})</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span className="break-words">{formatDate(post.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 text-gray-500">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{post.views}</span>

                  {/* 신고/차단 메뉴 - 공지글이 아닐 때만 표시 */}
                  {!post.is_notice && user && (
                    <div className="relative menu-container ml-2">
                      <button
                        onClick={() => setShowPostMenu(!showPostMenu)}
                        className="p-1 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                        aria-label="메뉴"
                      >
                        <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      {showPostMenu && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => {
                              setShowPostMenu(false)
                              handleReportPost()
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                          >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>신고</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowPostMenu(false)
                              handleBlockUser()
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                          >
                            <Ban className="w-4 h-4 flex-shrink-0" />
                            <span>차단</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 게시글 내용 */}
            <div className="px-3 sm:px-6 py-4 sm:py-6">
              {post.image_url && (
                <div className="mb-4 sm:mb-6">
                  <img
                    src={post.image_url}
                    alt="첨부 이미지"
                    className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                  />
                </div>
              )}

              <div className="text-sm sm:text-base text-gray-800 leading-relaxed break-words">
                {formatContent(post.content)}
              </div>
            </div>
          </article>

          {/* 댓글 섹션 */}
          <section className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* 댓글 헤더 */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                <h2 className="text-sm sm:text-lg font-medium text-gray-900">
                  댓글 {comments.length}개
                </h2>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="divide-y divide-gray-200">
              {comments.length === 0 ? (
                <div className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">첫 번째 댓글을 작성해보세요!</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const canDeleteComment = user && (user.role === 'admin' || user.id === comment.user_id)
                  const commenterGradeInfo = getGradeInfo(comment.users.grade)

                  return (
                    <div key={comment.id} className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex justify-between items-start gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                            <img
                              src={commenterGradeInfo.icon}
                              alt="등급"
                              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                            />
                            <span className="font-medium text-gray-900 text-xs sm:text-sm break-words">{comment.users.name}</span>
                            <span className="text-xs text-gray-500">({commenterGradeInfo.display})</span>
                            <span className="text-xs sm:text-sm text-gray-500 break-words">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <div className="text-gray-800 text-xs sm:text-sm leading-relaxed break-words">
                            {formatContent(comment.content)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* 신고/차단 메뉴 */}
                          {user && user.id !== comment.user_id && (
                            <div className="relative menu-container">
                              <button
                                onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}
                                className="p-1 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                                aria-label="메뉴"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openCommentMenuId === comment.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                  <button
                                    onClick={() => {
                                      setOpenCommentMenuId(null)
                                      handleReportComment(comment.id, comment.report_count)
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                                  >
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    <span>신고</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenCommentMenuId(null)
                                      handleBlockCommentUser()
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                  >
                                    <Ban className="w-3 h-3 flex-shrink-0" />
                                    <span>차단</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {/* 삭제 버튼 */}
                          {canDeleteComment && (
                            <button
                              onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                              className="text-gray-400 hover:text-red-500 p-1 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation flex-shrink-0"
                              title="댓글 삭제"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 댓글 작성 */}
            {user ? (
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                <form onSubmit={handleSubmit(onCommentSubmit)} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={getGradeInfo(user.grade).icon}
                      alt="등급"
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 break-words">{user.name}</span>
                  </div>
                  <textarea
                    {...register('content')}
                    rows={3}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    placeholder="댓글을 입력하세요..."
                  />
                  {errors.content && (
                    <p className="text-red-500 text-xs sm:text-sm break-words">{errors.content.message}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span>{isSubmittingComment ? '등록 중...' : '댓글 등록'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-red-50">
                <p className="text-center text-red-800 text-xs sm:text-sm">
                  댓글을 작성하려면 <strong>로그인</strong>이 필요합니다.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}