'use client'

import { usePathname, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { ModalProvider } from '@/contexts/ModalContext'
import ModalInitializer from '@/components/ModalInitializer'
import StickyButtonsContainer from '@/components/StickyButtonsContainer'

export default function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  const router = useRouter()

  // Check if on competition detail page
  const isCompetitionDetail = /^\/competitions\/[^/]+$/.test(pathname)

  // Configure sticky buttons
  const buttons: Array<{ id: string; type: 'registration' | 'kakao'; position: 'bottom-4 right-4' | 'bottom-24 right-4' | 'bottom-16 right-4'; condition?: boolean; href?: string; onClick?: () => void }> = [
    // Registration button - only show on competition detail pages (positioned above kakao)
    {
      id: 'registration',
      type: 'registration',
      position: 'bottom-24 right-4',
      condition: isCompetitionDetail,
      onClick: () => router.push(`${pathname}?tab=register`)
    },
    // Kakao button - show on all pages (always at bottom)
    {
      id: 'kakao',
      type: 'kakao',
      position: 'bottom-4 right-4',
      href: 'http://pf.kakao.com/_xdxdxaxkn'
    }
  ]

  return (
    <AuthProvider>
      <ModalProvider>
        <ModalInitializer />
        <Header />
        <main className="pt-16 min-h-screen">
          {children}
        </main>
        <Footer />
        <StickyButtonsContainer buttons={buttons} />
      </ModalProvider>
    </AuthProvider>
  )
}
