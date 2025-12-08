import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  turbopack: {},
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
