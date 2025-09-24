# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**RUN10 (런텐)**은 Next.js 15.5.2와 TypeScript로 구축된 한국 러닝 협회 웹사이트입니다. 러닝 대회 관리, 참가자 등록, 관리자 대시보드 기능을 제공합니다.

### 기술 스택
- **프레임워크**: Next.js 15.5.2 with TypeScript
- **스타일링**: Tailwind CSS v4
- **데이터베이스**: Supabase (PostgreSQL)
- **파일 저장소**: Supabase Storage
- **폼 처리**: React Hook Form + Zod 검증
- **아이콘**: Lucide React
- **배포**: Vercel

## 🎯 회원 시스템 구현 완료 (2025-09-15)

### 회원 관리 시스템
- **데이터베이스 스키마**: 회원, 커뮤니티, 댓글 테이블 추가
  - `users` 테이블: 회원 정보 및 등급 관리
  - `community_posts` 테이블: 전체 회원 게시판
  - `post_comments` 테이블: 댓글 시스템
  - RLS(Row Level Security) 정책 적용

- **회원가입 시스템**: 아이디 중복확인, 우편번호 찾기 API 연동
  - `src/components/MembershipForm.tsx` 구현
  - 다음 우편번호 서비스 연동
  - 실시간 ID 중복 체크
  - 기록 시간 기반 등급 미리보기

- **등급 시스템**: 기록 기반 자동 등급 분류 (범위 기반, 이미지 아이콘 사용)
  - 치타족 (30-39분59초)
  - 홀스족 (40-49분59초)
  - 울프족 (50-59분59초)
  - 터틀족 (60분 이상 또는 미기록)
  - 볼타족 (관리자 직접 지정)

### 사용자 인터페이스
- **인증 시스템**: 세션 기반 로그인/로그아웃
  - `src/contexts/AuthContext.tsx` - 전역 인증 상태 관리
  - SessionStorage를 활용한 클라이언트 세션 유지

- **헤더 메뉴 개선**: 로그인 상태별 동적 메뉴
  - 비로그인: 회원가입, 로그인 버튼
  - 로그인: 등급 아이콘, 사용자명, 드롭다운 메뉴
  - 반응형 모바일 메뉴 지원

- **마이페이지**: 개인정보 관리 및 신청내역 조회
  - `src/app/mypage/page.tsx` 구현
  - 회원정보 수정 (비밀번호 변경 포함)
  - 대회 신청 내역 조회 및 관리

### 커뮤니티 기능
- **전체 회원 게시판**: 글 작성 및 댓글 시스템
  - `src/app/community/` 전체 구현
  - 게시글 작성/수정/삭제 (이미지 첨부 지원)
  - 실시간 댓글 시스템
  - 조회수 카운터 및 검색 기능
  - 관리자 공지글 기능

### 대회 신청 개선
- **회원 전용 신청**: 정보 자동 입력 및 간소화
  - `src/components/MemberRegistrationForm.tsx` 구현
  - 로그인 회원: 기본 정보 자동 입력, 추가 정보만 수집
  - 비회원: 기존 전체 정보 입력 프로세스 유지

### 관리자 시스템 확장
- **회원 관리**: `src/app/admin/members/page.tsx`
  - 회원 검색, 필터링 (등급별, 권한별)
  - 관리자 권한 부여/해제, 회원 삭제
  - 회원 정보 CSV 내보내기

- **커뮤니티 관리**: `src/app/admin/community/page.tsx`
  - 전체 게시글 조회 및 검색
  - 공지글 설정/해제, 게시글 삭제
  - 커뮤니티 통계 조회

### 새로 추가된 주요 파일들
```
src/
├── contexts/AuthContext.tsx           # 전역 인증 상태 관리
├── components/
│   ├── MembershipForm.tsx            # 회원가입 폼
│   ├── LoginForm.tsx                 # 로그인 폼  
│   └── MemberRegistrationForm.tsx    # 회원 전용 대회 신청 폼
├── app/
│   ├── mypage/page.tsx              # 마이페이지
│   ├── community/                    # 커뮤니티 게시판
│   │   ├── page.tsx                 # 게시글 목록
│   │   ├── write/page.tsx           # 글 작성
│   │   └── [id]/                    # 글 상세/수정
│   └── admin/
│       ├── members/page.tsx         # 회원 관리
│       └── community/page.tsx       # 커뮤니티 관리
└── lib/supabase.ts                  # 확장된 DB 타입 정의
```

### 데이터베이스 스키마 추가사항
```sql
-- 회원 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date VARCHAR(8) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  address1 TEXT NOT NULL,
  address2 TEXT,
  postcode VARCHAR(10) NOT NULL,
  grade VARCHAR(20) DEFAULT 'turtle',
  record_time INTEGER NOT NULL DEFAULT 999,
  role VARCHAR(10) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커뮤니티 게시판
CREATE TABLE community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  views INTEGER DEFAULT 0,
  is_notice BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 시스템
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Development Commands

### Core Commands
```bash
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint code checking
```

### Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.5.2 with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Deployment**: Vercel

### App Router 구조
```
src/app/
├── page.tsx                    # 메인 홈페이지
├── layout.tsx                  # 루트 레이아웃 (Header/Footer 포함)
├── globals.css                 # 글로벌 스타일 및 Tailwind 임포트
├── competitions/
│   ├── page.tsx               # 대회 목록 (필터 기능)
│   └── [id]/page.tsx          # 대회 상세 (탭 구조)
├── admin/
│   ├── page.tsx               # 관리자 대시보드
│   └── competitions/
│       ├── new/page.tsx       # 새 대회 생성
│       ├── [id]/edit/page.tsx # 대회 수정
│       └── [id]/registrations/page.tsx # 참가자 관리
└── (정적 페이지들)/            # 소개, FAQ, 개인정보보호 등
```

### 주요 컴포넌트
```
src/components/
├── Header.tsx                 # 반응형 메뉴가 있는 네비게이션
├── Footer.tsx                 # 사이트 푸터
├── ConsentForm.tsx           # 참가신청 동의서
├── NewRegistrationForm.tsx   # 메인 참가신청 폼
├── RegistrationLookup.tsx    # 이름/생년월일/비밀번호로 신청내역 조회
├── ContentImageUpload.tsx    # 관리자용 이미지 + 텍스트 업로드
├── PostWriteModal.tsx        # 대회 게시판 글 작성
├── PostDetailModal.tsx       # 글 보기/수정/삭제
├── MessageModal.tsx          # 범용 모달
└── (기타 모달 및 폼들)
```

### 데이터베이스 레이어
- **설정**: `src/lib/supabase.ts`에 전체 TypeScript 타입 정의
- **주요 테이블**: competitions, registrations, competition_posts
- **저장소**: 파일 업로드용 `competition-images` 버킷

## 데이터베이스 스키마

### 핵심 테이블
- **competitions**: 코스/시상품 이미지, 상태 관리가 포함된 대회 데이터
- **registrations**: 결제 상태, 비밀번호 보호 조회가 포함된 참가자 데이터
- **competition_posts**: 비밀번호 기반 수정이 가능한 게시판 시스템

### 주요 스키마 파일
- `supabase-schema-updated.sql`: 샘플 데이터가 포함된 전체 데이터베이스 재설정
- `supabase-board-password.sql`: 게시글에 비밀번호 컬럼 추가 (증분 업데이트)
- `supabase-reply-system.sql`: 댓글 시스템 확장

## 기능 구현 패턴

### 폼 처리
- React Hook Form + Zod 검증 사용
- useState를 통한 다단계 폼 상태 관리
- 한국어 로케일 지원 및 커스텀 검증 메시지

### 이미지 업로드
- 5MB 파일 크기 제한이 있는 Supabase Storage 연동
- 자동 파일명 충돌 방지 (타임스탬프 + 랜덤)
- 관리자 기능용 이미지 + 텍스트 결합 업로드

### 접근 제어
- 간단한 비밀번호 기반 관리자 인증 (비밀번호: `admin2024!`)
- 신청내역 조회는 이름 + 생년월일 + 비밀번호 필요
- 게시판 글은 비밀번호 보호 수정/삭제

### 반응형 디자인
- 모바일 우선 Tailwind CSS 접근법
- 줄 생략 및 다크 모드 처리용 커스텀 CSS 유틸리티
- 시스템 설정과 관계없이 폼 입력은 라이트 모드 강제

## 개발 가이드라인

### 코드 패턴
- 새 파일 생성보다 기존 파일 수정 선호
- supabase.ts의 적절한 Database 타입과 함께 TypeScript 엄격 사용
- 기존 한국어 주석 및 UI 텍스트 패턴 따르기
- 현재 폼 검증 접근법과 일관성 유지

### 상태 관리
- 폼 플로우와 모달 상태는 useState 사용
- 실시간 데이터는 Supabase 실시간 구독 활용
- 로딩 상태와 에러 경계 일관되게 처리

### 파일 구조
- 컴포넌트는 기능별로 구성 (폼, 모달 등)
- 데이터베이스 유틸리티는 `src/lib/`에 보관
- 정적 페이지는 Next.js 앱 라우터 규칙 따름

## 관리자 기능

### 대회 관리
- 코스 및 시상품 이미지 업로드와 함께 대회 생성/수정
- UTF-8 BOM 인코딩으로 CSV 내보내기가 포함된 참가자 등록 관리
- 결제 상태별 참가자 필터링 및 검색

### 게시판 시스템
- 대회별 전용 메시지 게시판
- 일반 사용자는 비밀번호 보호 글 수정
- 관리자는 비밀번호 없이 모든 글 수정/삭제 가능

## 일반적인 작업

### 새로운 대회 필드 추가
1. `src/lib/supabase.ts`의 `Database` 타입 업데이트
2. SQL 스키마 파일 수정
3. 관리자 폼 및 표시 컴포넌트 업데이트
4. 기존 데이터 마이그레이션과 함께 테스트

### 게시판 시스템 확장
- 비밀번호 보호가 있는 기본 CRUD 지원
- Supabase Storage를 통한 이미지 첨부
- 페이지네이션 및 검색 기능 내장

### 참가신청 폼 변경
- 기존 패턴을 따라 `NewRegistrationForm.tsx` 확장
- 데이터베이스 스키마 및 TypeScript 타입 업데이트
- 동의 플로우 및 검증 로직 유지

## 배포

- Vercel 배포용으로 설계
- Supabase URL: https://wylklwgubweeemglaczr.supabase.co
- 배포 플랫폼에서 모든 환경 변수 구성 필요
- 공개 페이지는 정적 생성, 관리자 영역은 동적 생성

## 중요 사항

- UI 전반에 걸친 한국어 지원
- 결제 처리는 수동 (입금자명 추적이 있는 계좌 이체)
- 관리자 접근은 간단한 비밀번호 인증 (민감한 데이터에는 프로덕션 준비 안됨)
- 모든 사용자 입력은 클라이언트와 서버 양쪽에서 검증
- 데이터 보호를 위한 RLS (Row Level Security) 정책 적용