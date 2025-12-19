import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://runten.co.kr'

  // 정적 페이지들
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/competitions`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.1,
    },
    {
      url: `${baseUrl}/mypage`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.1,
    },
    {
      url: `${baseUrl}/company-info`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.1,
    },
    {
      url: `${baseUrl}/safety`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.1,
    },
  ]

  // 정적 페이지만 반환 (동적 게시글 페이지 제외)
  return staticRoutes
}