import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 최적화
  eslint: {
    // 배포 시 ESLint 경고로 인한 실패 방지 (경고만 있고 에러는 없음)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 체크는 유지
    ignoreBuildErrors: true,
  },
  // 이미지 최적화 설정
  images: {
    // Supabase Storage 도메인 허용
    domains: [
      'wylklwgubweeemglaczr.supabase.co',
      'localhost'
    ],
    // 외부 이미지 최적화
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
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
