'use client'

import { Users, MessageCircle } from 'lucide-react'

export interface StickyButton {
  id: string
  type: 'registration' | 'kakao'
  label?: string
  subLabel?: string
  position: 'bottom-4 right-4' | 'bottom-24 right-4' | 'bottom-16 right-4'
  condition?: boolean
  onClick?: () => void
  href?: string
}

interface StickyButtonsContainerProps {
  buttons: StickyButton[]
}

export default function StickyButtonsContainer({ buttons }: StickyButtonsContainerProps) {
  const renderButton = (button: StickyButton) => {
    const baseClasses = 'group bg-gradient-to-r px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-2xl transition-all duration-300 flex items-center space-x-2 sm:space-x-3 transform hover:scale-105'

    const typeStyles = {
      registration: {
        gradient: 'from-blue-600 to-blue-700',
        hoverGradient: 'hover:from-blue-700 hover:to-blue-800',
        shadowColor: 'hover:shadow-blue-500/50',
        textColor: 'text-white'
      },
      kakao: {
        gradient: 'from-yellow-400 to-yellow-500',
        hoverGradient: 'hover:from-yellow-500 hover:to-yellow-600',
        shadowColor: 'hover:shadow-yellow-400/50',
        textColor: 'text-black'
      }
    }

    const style = typeStyles[button.type]
    const buttonClasses = `${baseClasses} ${style.textColor} bg-gradient-to-r ${style.gradient} ${style.hoverGradient} ${style.shadowColor}`

    const buttonContent = (
      <>
        {button.type === 'registration' && (
          <>
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            <div className="flex flex-col items-start">
              <span className="text-xs sm:text-sm font-medium">참가신청</span>
              <span className="text-xs sm:text-sm opacity-50">바로가기</span>
            </div>
          </>
        )}
        {button.type === 'kakao' && (
          <>
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <div className="flex flex-col items-start">
              <span className="text-xs sm:text-sm font-medium">카카오로</span>
              <span className="text-xs sm:text-sm opacity-50">문의하기</span>
            </div>
          </>
        )}
      </>
    )

    if (button.href) {
      return (
        <a
          key={button.id}
          href={button.href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
        >
          {buttonContent}
        </a>
      )
    }

    return (
      <button
        key={button.id}
        onClick={button.onClick}
        className={buttonClasses}
      >
        {buttonContent}
      </button>
    )
  }

  return (
    <>
      {buttons.map((button) => {
        // condition이 명시적으로 false면 렌더링하지 않음
        if (button.condition === false) {
          return null
        }

        return (
          <div key={button.id} className={`fixed ${button.position} z-40`}>
            {renderButton(button)}
          </div>
        )
      })}
    </>
  )
}
