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
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mypage`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/company-info`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/safety`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
  ]

  // 동적 대회 페이지들
  let competitionRoutes = []
  try {
    const { data: competitions } = await supabase
      .from('competitions')
      .select('id, updated_at, status')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    competitionRoutes = competitions?.map((competition) => ({
      url: `${baseUrl}/competitions/${competition.id}`,
      lastModified: new Date(competition.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []
  } catch (error) {
    console.error('Error fetching competitions for sitemap:', error)
  }

  // 동적 커뮤니티 게시글들 (최근 100개)
  let communityRoutes = []
  try {
    const { data: posts } = await supabase
      .from('community_posts')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100)

    communityRoutes = posts?.map((post) => ({
      url: `${baseUrl}/community/${post.id}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })) || []
  } catch (error) {
    console.error('Error fetching community posts for sitemap:', error)
  }

  return [
    ...staticRoutes,
    ...competitionRoutes,
    ...communityRoutes,
  ]
}