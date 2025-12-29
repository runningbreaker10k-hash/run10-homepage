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
          '/about',
          '/_next',
          '/private',
          '/mypage',
          '/login',
          '/signup',
          '/competitions/',
          '/privacy',
          '/terms',
          '/safety',
          '/community',
          '/competitions'
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/about',
          '/_next',
          '/private',
          '/mypage',
          '/login',
          '/signup',
          '/competitions/',
          '/privacy',
          '/terms',
          '/safety',
          '/community',
          '/competitions'
        ],
      },
      {
        userAgent: 'Yeti', // 네이버봇
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/about',
          '/_next',
          '/private',
          '/mypage',
          '/login',
          '/signup',
          '/competitions/',
          '/privacy',
          '/terms',
          '/safety',
          '/community',
          '/competitions'
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/about',
          '/_next',
          '/private',
          '/mypage',
          '/login',
          '/signup',
          '/competitions/',
          '/privacy',
          '/terms',
          '/safety',
          '/community',
          '/competitions'
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}