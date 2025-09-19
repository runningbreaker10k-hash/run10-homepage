'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, Trash2, MessageSquare, Send, Eye, Pin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

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
  }, [postId])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const canEditPost = user && (user.role === 'admin' || user.id === post.user_id)
  const authorGradeInfo = getGradeInfo(post.users.grade)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/community')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로
        </button>
      </div>

      {/* 게시글 */}
      <article className="bg-white rounded-lg shadow overflow-hidden mb-8">
        {/* 게시글 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {post.is_notice && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  <Pin className="w-3 h-3 mr-1" />
                  공지
                </span>
              )}
              <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
            </div>
            {canEditPost && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/community/${postId}/edit`)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="수정"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeletePost}
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
                <img
                  src={authorGradeInfo.icon}
                  alt="등급"
                  className="w-5 h-5"
                />
                <span className="font-medium">{post.users.name}</span>
                <span className="text-xs opacity-75">({authorGradeInfo.display})</span>
              </div>
              <span>•</span>
              <span>{formatDate(post.created_at)}</span>
              {post.created_at !== post.updated_at && (
                <>
                  <span>•</span>
                  <span className="text-xs">수정됨</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{post.views}</span>
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

      {/* 댓글 섹션 */}
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

        {/* 댓글 작성 */}
        {user ? (
          <div className="px-6 py-4 border-b border-gray-200">
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
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <p className="text-center text-yellow-800">
              댓글을 작성하려면 <strong>로그인</strong>이 필요합니다.
            </p>
          </div>
        )}

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
              const commenterGradeInfo = getGradeInfo(comment.users.grade)

              return (
                <div key={comment.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={commenterGradeInfo.icon}
                          alt="등급"
                          className="w-5 h-5"
                        />
                        <span className="font-medium text-gray-900">{comment.users.name}</span>
                        <span className="text-xs text-gray-500">({commenterGradeInfo.display})</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.created_at !== comment.updated_at && (
                          <span className="text-xs text-gray-400">(수정됨)</span>
                        )}
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
      </section>
    </div>
  )
}