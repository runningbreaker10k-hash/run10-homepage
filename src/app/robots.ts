import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://runten.co.kr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/_next',
          '/private',
          '/mypage',
          '/login',
          '/signup',
          '/request/*',
          '*.png$',
          '*.jpg$',
          '*.jpeg$',
        ],
        crawlDelay: 1, // 봇 요청 간 최소 1초 대기
      },
      {
        userAgent: 'GPTBot', // ChatGPT 크롤러 차단
        disallow: '/',
      },
      {
        userAgent: 'CCBot', // Commoncrawl 차단
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai', // Claude 크롤러 차단
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}