import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RUN10(런텐) | 전국 러닝 협회 인증 10km 러닝 플랫폼",
  description: "전국 러닝 협회가 인증하는 10km 러너들의 공식 플랫폼. 정확한 기록 측정과 체계적인 등급 시스템으로 러닝 실력을 향상시키세요. 치타족부터 터틀족까지 나의 RUN10 티어를 확인하고 도전하세요.",
  keywords: "런닝, 마라톤, 10km, 러닝대회, 런텐, RUN10, 러닝협회, 티어시스템, 치타족, 홀스족, 울프족, 터틀족",
  authors: [{ name: "RUN10" }],
  creator: "RUN10",
  publisher: "RUN10",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "RUN10(런텐) | 전국 러닝 협회 인증 10km 러닝 플랫폼",
    description: "전국 러닝 협회가 인증하는 10km 러너들의 공식 플랫폼. 정확한 기록 측정과 체계적인 등급 시스템으로 러닝 실력을 향상시키세요.",
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
    title: "RUN10(런텐) | 전국 러닝 협회 인증 10km 러닝 플랫폼",
    description: "전국 러닝 협회가 인증하는 10km 러너들의 공식 플랫폼",
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
        <AuthProvider>
          <Header />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
