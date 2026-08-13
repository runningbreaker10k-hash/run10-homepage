'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'flash_popup_hidden_date'

export default function FlashPopup() {
  const [visible, setVisible] = useState(false)
  const [noShowToday, setNoShowToday] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const today  = new Date().toDateString()
    if (stored === today) return
    setVisible(true)
  }, [])

  const close = () => {
    if (noShowToday) {
      localStorage.setItem(STORAGE_KEY, new Date().toDateString())
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/60 px-4"
      style={{ paddingTop: 'calc(64px + 12px)', paddingBottom: '12px' }}
      onClick={close}
    >
      <div
        className="relative flex flex-col bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 64px - 24px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 — 이미지 위에 오버레이 */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* 이미지 — 스크롤 가능 */}
        <div className="overflow-y-auto flex-1">
          <img
            src="/images/flash/anno/01.jpg"
            alt="런텐 플래시 안내"
            className="w-full block"
          />
        </div>

        {/* 하단 — 항상 고정 */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noShowToday}
              onChange={e => setNoShowToday(e.target.checked)}
              className="w-4 h-4 accent-red-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600">오늘은 그만 보기</span>
          </label>
          <button
            onClick={close}
            className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
