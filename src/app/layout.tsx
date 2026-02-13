import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayoutContent from "@/components/RootLayoutContent";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "런텐 / 전국러닝협회 인증 10K 러닝대회",
  description: "전국 10K 러너들의 공식 플랫폼, JUST run 10 전국 러닝대회 개최 일정",
  keywords: "런닝, 마라톤, 10km, 러닝대회, 런텐, RUN10, 전국러닝협회, 저스트런텐",
  authors: [{ name: "RUN10" }],
  creator: "RUN10",
  publisher: "RUN10",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "런텐 / 전국러닝협회 인증 10K 러닝대회",
    description: "전국 10K 러너들의 공식 플랫폼, JUST run 10 전국 러닝대회 개최 일정",
    url: "https://runten.co.kr",
    siteName: "RUN10",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RUN10 런텐 러닝 플랫폼",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "런텐 / 전국러닝협회 인증 10K 러닝대회",
    description: "전국 10K 러너들의 공식 플랫폼, JUST run 10 전국 러닝대회 개최 일정",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'bE3ww29ySpmBFNjsT3jH5zYE-u60C5w1KdAchC8F5kk',
    other: {
      'naver-site-verification': 'bfb49d12d1b9336b386b36b0082e9cf7bcecc0e5',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 네이버 웹마스터 도구 사이트 확인 메타태그 */}
        <meta name="naver-site-verification" content="bfb49d12d1b9336b386b36b0082e9cf7bcecc0e5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "RUN10",
              "alternateName": "런텐",
              "url": "https://runten.co.kr",
              "logo": "https://runten.co.kr/images/logo.png",
              "description": "전국 러닝 협회가 인증하는 10km 러너들의 공식 플랫폼",
              "foundingDate": "2024",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "availableLanguage": "Korean"
              },
              "areaServed": "KR",
              "knowsAbout": ["러닝", "마라톤", "10km", "러닝대회", "스포츠"],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "러닝 대회",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Event",
                      "name": "JUST RUN 10",
                      "description": "전국 러닝 협회 인증 10km 대회"
                    }
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}
