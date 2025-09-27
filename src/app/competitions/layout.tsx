import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "런텐 대회 | JUST RUN 10 전국 러닝 협회 인증 대회",
  description: "전국 러닝 협회가 공식 인증하는 10km 대회입니다. 평지코스 정확한 기록 인증, 깨끗하고 쾌적한 러닝코스, 70명 대상 국내 최고 경품, 수준별 출발 안정적 레이스를 제공합니다.",
  keywords: "런텐대회, JUST RUN 10, 10km대회, 러닝대회, 마라톤대회, 러닝협회인증, 평지코스, 러닝경품",
  openGraph: {
    title: "런텐 대회 | JUST RUN 10 전국 러닝 협회 인증 대회",
    description: "전국 러닝 협회가 공식 인증하는 10km 대회입니다.",
    url: "https://runten.co.kr/competitions",
  },
}

export default function CompetitionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}