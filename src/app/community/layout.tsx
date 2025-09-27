import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "런텐 커뮤니티 | RUN10 러너들의 소통 공간",
  description: "RUN10 러너들이 함께 정보를 공유하고 소통하는 커뮤니티입니다. 러닝 팁, 대회 후기, 훈련 방법 등을 나누며 함께 성장해요.",
  keywords: "런텐커뮤니티, RUN10커뮤니티, 러닝커뮤니티, 러닝팁, 마라톤후기, 러닝정보",
  openGraph: {
    title: "런텐 커뮤니티 | RUN10 러너들의 소통 공간",
    description: "RUN10 러너들이 함께 정보를 공유하고 소통하는 커뮤니티입니다.",
    url: "https://runten.co.kr/community",
  },
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}