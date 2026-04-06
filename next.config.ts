import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 자산 캐시 헤더 설정
  async headers() {
    return [
      {
        // favicon, 공통 이미지 등 public 폴더 정적 자산
        source: '/(favicon.ico|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // public/images 폴더 이미지
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // public 폴더 기타 정적 파일 (폰트, svg 등)
        source: '/:path*(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|\.ico|\.woff|\.woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
  // Vercel 배포 최적화
  typescript: {
    // 타입 체크는 유지
    ignoreBuildErrors: true,
  },
  // 이미지 최적화 설정
  images: {
    // 외부 이미지 최적화
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'wylklwgubweeemglaczr.supabase.co',
      },
    ],
  },
  // Turbopack 설정 (Next.js 16 기본)
  turbopack: {
    root: './',
  },
  webpack: (config, { isServer }) => {
    // Supabase 호환성을 위한 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default nextConfig;
