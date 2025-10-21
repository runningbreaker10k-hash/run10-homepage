# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**RUN10 (런텐)**은 Next.js 15.5.2와 TypeScript로 구축된 한국 러닝 협회 웹사이트입니다. 러닝 대회 관리, 참가자 등록, 관리자 대시보드, 회원 시스템 기능을 제공합니다.

### 기술 스택
- **프레임워크**: Next.js 15.5.2 with TypeScript, App Router
- **스타일링**: Tailwind CSS v4
- **데이터베이스**: Supabase (PostgreSQL + Storage)
- **폼 처리**: React Hook Form + Zod 검증
- **상태 관리**: React Context API (AuthContext, ModalContext)
- **아이콘**: Lucide React
- **날짜 처리**: date-fns
- **배포**: Vercel

## Development Commands

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

### Client-Side Data Architecture
**중요**: 이 프로젝트는 Next.js API Routes를 사용하지 않습니다. 모든 데이터 작업은 클라이언트 사이드에서 Supabase JS 클라이언트를 통해 직접 수행됩니다.

```typescript
// 표준 패턴: 컴포넌트에서 직접 Supabase 호출
'use client'

const { data, error } = await supabase
  .from('competitions')
  .select('*')
  .eq('status', 'active')
```

### State Management Pattern

#### Global State (Context API)
1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - 사용자 인증 상태 관리
   - `sessionStorage`에 사용자 정보 저장 및 복원
   - 등급 시스템 메타데이터 제공 (display, icon, color)
   - Hook: `useAuth()`

2. **ModalContext** (`src/contexts/ModalContext.tsx`)
   - 중앙 집중식 모달 큐 관리
   - 메시지 모달과 확인 모달 별도 관리
   - 자동 ID 생성 및 콜백 기반 액션 처리
   - Hooks: `useMessageModal()`, `useConfirmModal()`

#### Component State (useState)
- **Form state**: React Hook Form이 처리
- **UI state**: 모달 가시성, 메뉴 토글, 로딩 표시
- **Data state**: useEffect로 페칭한 데이터 로컬 저장
- **Pagination**: currentPage, searchTerm 필터링

### Key Utilities & Hooks

#### Custom Hooks
- **useAsync** (`src/hooks/useAsync.ts`): 비동기 작업 처리, 자동 에러 핸들링
- **useAuth**: 인증 컨텍스트 접근, 사용자 정보 및 등급 관리
- **useMessageModal / useConfirmModal**: 모달 표시 헬퍼

#### Utility Libraries
- **ErrorHandler** (`src/lib/errorHandler.ts`): Supabase 에러 코드를 사용자 친화적 메시지로 변환
  - `23505`: 중복 키
  - `PGRST116`: 데이터 없음
  - `42501`: 권한 없음
- **dateUtils** (`src/lib/dateUtils.ts`): KST 타임존 변환 및 상대 시간 포맷팅
- **supabase** (`src/lib/supabase.ts`): TypeScript 타입 정의 및 클라이언트

### App Router 구조
```
src/app/
├── page.tsx                    # 메인 홈페이지
├── layout.tsx                  # 루트 레이아웃 (Header/Footer, Context Providers)
├── globals.css                 # 글로벌 스타일 및 Tailwind 임포트
├── competitions/
│   ├── page.tsx               # 대회 목록 (필터, 검색, 페이지네이션)
│   └── [id]/page.tsx          # 대회 상세 (탭: 개요, 신청, 게시판)
├── community/
│   ├── page.tsx               # 커뮤니티 게시판 목록
│   ├── write/page.tsx         # 글 작성
│   └── [id]/
│       ├── page.tsx           # 글 상세
│       └── edit/page.tsx      # 글 수정
├── mypage/page.tsx            # 마이페이지 (회원 정보, 신청 내역)
├── admin/
│   ├── page.tsx               # 관리자 대시보드
│   ├── members/page.tsx       # 회원 관리
│   ├── community/page.tsx     # 커뮤니티 관리
│   └── competitions/
│       ├── new/page.tsx       # 새 대회 생성
│       ├── [id]/edit/page.tsx # 대회 수정
│       └── [id]/registrations/page.tsx # 참가자 관리
└── (정적 페이지들)/            # 소개, FAQ, 개인정보보호 등
```

### 주요 컴포넌트 구조
```
src/components/
├── Header.tsx                 # 반응형 네비게이션, 로그인 상태별 메뉴
├── Footer.tsx                 # 사이트 푸터
├── MembershipForm.tsx         # 회원가입 폼 (우편번호 API 연동)
├── LoginForm.tsx              # 로그인 폼
├── MemberRegistrationForm.tsx # 회원 전용 대회 신청 폼 (정보 자동 입력)
├── NewRegistrationForm.tsx    # 비회원 대회 신청 폼 (전체 정보 입력)
├── ConsentForm.tsx            # 참가신청 동의서
├── RegistrationLookup.tsx     # 이름/생년월일/비밀번호로 신청 내역 조회
├── ImageUpload.tsx            # 단일 이미지 업로드 (드래그앤드롭)
├── ContentImageUpload.tsx     # 이미지 + 텍스트 업로드 (게시판용)
├── PostWriteModal.tsx         # 대회 게시판 글 작성
├── PostDetailModal.tsx        # 글 보기/수정/삭제
├── Modal.tsx                  # 범용 모달 컴포넌트
├── MessageModal.tsx           # 메시지 표시 모달
└── ConfirmModal.tsx           # 확인/취소 모달
```

## 데이터베이스 스키마

### 핵심 테이블
1. **users** - 회원 정보 및 등급 관리
   - `user_id`: 로그인 아이디 (unique)
   - `password`: **중요: 평문 저장** (프로덕션 미준비)
   - `grade`: 등급 (cheetah, horse, wolf, turtle, bolt)
   - `record_time`: 10km 기록 시간 (초 단위)
   - `role`: 권한 (user, admin)

2. **competitions** - 대회 데이터
   - 코스/시상품 이미지 URL 포함
   - `status`: draft, active, closed
   - `max_participants`, `current_participants`

3. **registrations** - 참가 신청
   - `is_member_registration`: 회원/비회원 구분
   - `payment_status`: pending, completed, cancelled
   - `password`: 비밀번호 보호 조회

4. **community_posts** - 커뮤니티 게시판
   - `is_notice`: 공지글 여부
   - `views`: 조회수
   - `user_id`: 작성자 (users 테이블 참조)

5. **competition_posts** - 대회별 게시판
   - `post_password`: 비밀번호 보호 수정

6. **post_comments** - 댓글 시스템
   - `post_id`: community_posts 참조
   - `user_id`: 작성자

### Supabase Storage
- **Bucket**: `competition-images`
- **용도**: 대회 이미지, 게시글 이미지
- **제약**: 5MB 이하, image/* 타입만
- **파일명 패턴**: `${timestamp}-${random}.${ext}`

## 인증 및 접근 제어

### 회원 인증 시스템
**중요 제한사항**: Supabase Auth 미사용, 커스텀 세션 관리

#### 인증 플로우
1. 로그인: `user_id`와 `password` 평문 비교
2. 세션 저장: `sessionStorage.setItem('user', JSON.stringify(userData))`
3. 세션 복원: `AuthContext`가 컴포넌트 마운트 시 `sessionStorage` 읽기
4. 로그아웃: `sessionStorage.clear()`

#### 세션 제한사항
- 새 탭에서 세션 유지 안 됨 (localStorage 대신 sessionStorage 사용)
- 페이지 새로고침 시 일부 시나리오에서 세션 손실 가능
- XSS 취약점 (평문 데이터 저장)

### 관리자 접근 제어
- **방식**: 간단한 비밀번호 체크 (하드코딩: `admin2024!`)
- **보호 경로**: `/admin` 하위 모든 페이지
- **제한사항**: 역할 기반 접근 제어 없음, JWT 없음

### Row Level Security (RLS)
- Supabase 정책 적용
- 참가신청: 본인/관리자만 조회
- 대회: 공개 대회만 일반 사용자 조회
- 회원: 본인 정보만 수정, 관리자는 전체 조회

## 회원 등급 시스템

### 등급 분류 (10km 기록 기준)
| 등급 | 한글명 | 시간 범위 | 아이콘 경로 | 색상 |
|------|--------|----------|------------|------|
| cheetah | 치타족 | 30분 - 39분 59초 | `/images/grades/cheetah.png` | orange |
| horse | 홀스족 | 40분 - 49분 59초 | `/images/grades/horse.png` | blue |
| wolf | 울프족 | 50분 - 59분 59초 | `/images/grades/wolf.png` | gray |
| turtle | 터틀족 | 60분 이상 또는 미기록 | `/images/grades/turtle.png` | green |
| bolt | 볼타족 | 관리자 직접 지정 | `/images/grades/bolt.png` | purple |

### 등급 정보 접근
```typescript
const { user, getGradeInfo } = useAuth()
const gradeInfo = getGradeInfo(user?.grade)
// { display: '치타족', icon: '/images/grades/cheetah.png', color: 'text-orange-600' }
```

## 폼 처리 및 검증

### React Hook Form + Zod 패턴
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  user_id: z.string()
    .min(4, '아이디는 4자 이상이어야 합니다')
    .max(15, '아이디는 15자 이하여야 합니다')
    .regex(/^[a-z][a-z0-9]*$/, '영문 소문자로 시작, 영문 소문자/숫자만 사용'),
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '영문과 숫자를 모두 포함해야 합니다')
}).refine((data) => data.password === data.password_confirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['password_confirm']
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
})
```

### 주요 검증 규칙
- **User ID**: 영문 소문자 시작, 4-15자, 영문/숫자만
- **Password**: 8자 이상, 영문+숫자 조합
- **Phone**: 010-XXXX-XXXX 형식
- **Birth Date**: YYYYMMDD 8자리
- **Email**: 이메일 형식 검증

## 이미지 업로드 시스템

### 파일 제약사항
- **크기**: 최대 5MB
- **타입**: image/* 만 허용
- **파일명 충돌 방지**: `${Date.now()}-${Math.random().toString(36)}.${ext}`

### 업로드 플로우
1. 파일 선택/드래그앤드롭
2. 클라이언트 검증 (크기, 타입)
3. Supabase Storage 업로드: `supabase.storage.from('competition-images').upload(path, file)`
4. 공개 URL 자동 반환
5. URL을 데이터베이스에 저장

### 업로드 컴포넌트
- **ImageUpload.tsx**: 단일 이미지, 미리보기, 삭제 기능
- **ContentImageUpload.tsx**: 이미지 + 텍스트 결합 (게시판용)

### 제한사항
- 서버 사이드 이미지 리사이징 없음
- 이미지 최적화 없음
- 원본 파일 그대로 저장

## Supabase 쿼리 패턴

### 기본 SELECT
```typescript
const { data, error } = await supabase
  .from('competitions')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

### 페이지네이션
```typescript
const from = (currentPage - 1) * PAGE_SIZE
const to = from + PAGE_SIZE - 1

const { data, error, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .range(from, to)
```

### 검색 (다중 필드)
```typescript
const { data } = await supabase
  .from('community_posts')
  .select('*')
  .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
```

### INSERT with SELECT
```typescript
const { data, error } = await supabase
  .from('registrations')
  .insert(formData)
  .select()
```

### UPDATE
```typescript
const { error } = await supabase
  .from('users')
  .update({ name: newName })
  .eq('id', userId)
```

### DELETE
```typescript
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

### 에러 핸들링
```typescript
import { ErrorHandler } from '@/lib/errorHandler'

const { error } = await supabase.from('users').insert(data)
if (error) {
  const appError = ErrorHandler.handle(error)
  alert(appError.message) // 사용자 친화적 메시지
}
```

## 개발 가이드라인

### 코드 작성 패턴
1. **기존 파일 우선 수정**: 새 파일 생성보다 기존 파일 확장 선호
2. **TypeScript 엄격 모드**: `src/lib/supabase.ts`의 `Database` 타입 활용
3. **한국어 주석 및 UI**: 기존 패턴 유지 (메시지, 레이블 등)
4. **폼 검증 일관성**: React Hook Form + Zod 패턴 따르기
5. **에러 처리 표준화**: ErrorHandler 클래스 사용

### 상태 관리 지침
- **전역 상태**: AuthContext, ModalContext만 사용
- **컴포넌트 상태**: useState로 UI 및 로딩 상태 관리
- **폼 상태**: React Hook Form이 처리
- **데이터 페칭**: useEffect + useState 패턴

### 파일 구조 규칙
- **컴포넌트**: 기능별 구성 (`src/components/`)
- **유틸리티**: `src/lib/`에 보관
- **타입**: `src/types/`에 공통 타입 정의
- **페이지**: Next.js App Router 규칙 (`src/app/`)
- **훅**: `src/hooks/`에 커스텀 훅

### 스타일링 지침
- **Tailwind CSS**: 모바일 우선 반응형
- **커스텀 유틸리티**: `globals.css`에 정의 (line-clamp, dark mode 처리)
- **폼 입력**: 라이트 모드 강제 (`[color-scheme:light]`)

## 일반적인 개발 작업

### 새로운 대회 필드 추가
1. `src/lib/supabase.ts`의 `Database['public']['Tables']['competitions']` 타입 업데이트
2. Supabase에서 SQL 실행하여 컬럼 추가
3. `src/app/admin/competitions/new/page.tsx` 및 `[id]/edit/page.tsx` 폼 업데이트
4. `src/app/competitions/[id]/page.tsx` 상세 페이지 표시 로직 추가
5. 기존 데이터 마이그레이션 고려

### 새로운 게시판 기능 추가
- 비밀번호 보호 CRUD 패턴 참고: `competition_posts` 테이블
- 이미지 첨부: `ContentImageUpload` 컴포넌트 활용
- 페이지네이션: 기존 `community/page.tsx` 패턴 따르기
- 검색: `.or()` 쿼리 패턴 사용

### 참가신청 폼 확장
- 회원: `MemberRegistrationForm.tsx` 수정 (정보 자동 입력)
- 비회원: `NewRegistrationForm.tsx` 수정 (전체 정보 입력)
- 데이터베이스 스키마 업데이트 필수
- 동의서 플로우 유지 (`ConsentForm.tsx`)

### CSV 내보내기 추가
```typescript
// UTF-8 BOM 인코딩 (엑셀 호환)
const BOM = '\uFEFF'
const csv = BOM + headers.join(',') + '\n' + rows.join('\n')
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
```

## 관리자 기능

### 대회 관리
- 대회 생성/수정: 코스 및 시상품 이미지 업로드 포함
- 참가자 관리: 필터링 (결제 상태별), 검색, CSV 내보내기
- 상태 변경: draft → active → closed

### 회원 관리 (`/admin/members`)
- 회원 검색: 이름, 아이디, 이메일
- 등급별 필터: cheetah, horse, wolf, turtle, bolt
- 권한 관리: 관리자 권한 부여/해제
- 회원 삭제
- CSV 내보내기

### 커뮤니티 관리 (`/admin/community`)
- 전체 게시글 조회 및 검색
- 공지글 설정/해제
- 게시글 삭제 (비밀번호 없이)
- 통계: 총 게시글 수, 공지글 수

### 게시판 관리
- 대회별 게시판: 비밀번호 없이 모든 글 수정/삭제
- 일반 사용자: 비밀번호 입력 필요

## 중요 제한사항 (프로덕션 미준비)

### 보안
1. **평문 비밀번호 저장**: 암호화/해싱 없음
2. **간단한 관리자 인증**: 하드코딩된 비밀번호
3. **sessionStorage 기반 인증**: XSS 취약점, 탭 간 세션 공유 안 됨
4. **클라이언트 사이드 쿼리**: API 키 노출 (Supabase RLS로 일부 보호)

### 기능
1. **이미지 최적화 없음**: 원본 파일 그대로 저장
2. **실시간 협업 없음**: Supabase Realtime 구독 미사용
3. **이메일 알림 없음**: 수동 확인 필요
4. **결제 연동 없음**: 계좌 이체 + 입금자명 수동 확인

### 성능
1. **클라이언트 사이드 페이징**: 대량 데이터 시 성능 저하
2. **이미지 리사이징 없음**: 대용량 이미지 로딩 느림
3. **캐싱 없음**: 모든 데이터 매번 페칭

## 배포

### Vercel 배포
- 자동 빌드 및 배포
- 환경 변수 설정 필수
- 정적 페이지: 빌드 시 생성
- 동적 페이지: 관리자 영역, 대회 상세

### Supabase
- URL: https://wylklwgubweeemglaczr.supabase.co
- 버킷: `competition-images`
- RLS 정책 적용 확인 필수

## 외부 서비스 의존성

1. **Daum 우편번호 서비스**: 회원가입 시 주소 입력
2. **Supabase**: 데이터베이스, 인증(미사용), Storage
3. **Vercel**: 호스팅 및 배포

## 참고 사항

- **언어**: UI 전반 한국어
- **타임존**: KST (UTC+9) 변환 유틸리티 사용
- **반응형**: 모바일 우선 디자인
- **브라우저 지원**: 모던 브라우저 (ES2017+)
