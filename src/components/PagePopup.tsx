'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Popup } from '@/types'
import { X } from 'lucide-react'
import Image from 'next/image'

interface PagePopupProps {
  pageId: 'home' | 'competition'
  competitionId?: string
}

export default function PagePopup({ pageId, competitionId }: PagePopupProps) {
  const [popups, setPopups] = useState<Popup[]>([])
  const [visiblePopups, setVisiblePopups] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPopups()
  }, [pageId, competitionId])

  const fetchPopups = async () => {
    const now = new Date().toISOString()

    let query = supabase
      .from('popups')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })

    // 페이지별 필터링
    if (pageId === 'home') {
      query = query.eq('display_page', 'home')
    } else if (pageId === 'competition' && competitionId) {
      query = query.eq('display_page', 'competition').eq('competition_id', competitionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('팝업 조회 오류:', error)
      return
    }

    if (data && data.length > 0) {
      // localStorage에서 "하루 동안 보지 않기" 체크
      const filteredPopups = data.filter((popup) => {
        const closedAt = localStorage.getItem(`popup_closed_${popup.id}`)
        if (closedAt) {
          const closedTime = new Date(closedAt)
          const now = new Date()
          const hoursDiff = (now.getTime() - closedTime.getTime()) / (1000 * 60 * 60)

          // 24시간 이내면 표시 안 함
          if (hoursDiff < 24) {
            return false
          } else {
            // 24시간 지났으면 localStorage에서 제거
            localStorage.removeItem(`popup_closed_${popup.id}`)
          }
        }
        return true
      })

      if (filteredPopups.length > 0) {
        setPopups(filteredPopups)
        const initialVisible = new Set(filteredPopups.map(p => p.id))
        setVisiblePopups(initialVisible)
      }
    }
  }

  const handleClose = (popupId: string) => {
    setVisiblePopups(prev => {
      const newSet = new Set(prev)
      newSet.delete(popupId)
      return newSet
    })
  }

  const handleDoNotShowToday = (popupId: string) => {
    localStorage.setItem(`popup_closed_${popupId}`, new Date().toISOString())
    handleClose(popupId)
  }

  const displayedPopups = popups.filter(p => visiblePopups.has(p.id))

  if (displayedPopups.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-24 pb-8">
        <div className="relative w-full max-w-7xl">
          {/* 여러 팝업을 그리드로 표시 */}
          <div className={`grid gap-6 ${
            displayedPopups.length === 1 ? 'grid-cols-1 max-w-[600px] mx-auto' :
            'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
          }`}>
            {displayedPopups.map((popup) => (
              <div key={popup.id} className="bg-white rounded-lg shadow-xl overflow-hidden">
                {/* 제목 */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{popup.title}</h2>
                  <button
                    onClick={() => handleClose(popup.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 이미지 내용 */}
                <div className="bg-gray-100">
                  <div className="relative w-full h-[350px]">
                    <Image
                      src={popup.content_image_url}
                      alt={popup.title}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                {/* 하단 버튼 */}
                <div className="bg-white border-t px-4 py-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDoNotShowToday(popup.id)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    하루 동안 보지 않기
                  </button>
                  <button
                    onClick={() => handleClose(popup.id)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 전체 닫기 버튼 (여러 개일 경우) */}
          {displayedPopups.length > 1 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  displayedPopups.forEach(popup => handleClose(popup.id))
                }}
                className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-lg"
              >
                모두 닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
