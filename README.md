# 전국러닝협회 홈페이지

전국 러닝 협회의 공식 홈페이지입니다. 매달 러닝 대회를 개최하고 참가신청을 받는 플랫폼입니다.

## 🎯 주요 기능

### 1. 메인 페이지
- 협회 소개 및 미션
- 통계 데이터 (참가자 수, 대회 수 등)
- 다가오는 대회 미리보기
- CTA (Call to Action) 섹션

### 2. 대회 게시판
- 공개된 모든 대회 목록 조회
- 검색 및 필터 기능 (상태별, 키워드)
- 대회 상태 표시 (접수중, 접수마감, 종료)
- 참가자 현황 및 진행률 표시

### 3. 대회 상세 페이지
- 대회 개요, 코스 안내, 시상 내역
- 참가신청 폼 (개인정보, 비상연락처, 동의서)
- 대회별 게시판 (관리자 공지사항)
- 실시간 참가자 현황

### 4. 관리자 시스템
- 관리자 대시보드 (통계, 최근 신청 현황)
- 대회 생성, 수정, 삭제 (CRUD)
- 참가신청 관리
- 간단한 비밀번호 인증

## 🛠 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time + Storage)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Date**: date-fns
- **Deployment**: Vercel (권장)

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.local` 파일에 Supabase 설정을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Supabase 데이터베이스 설정
`supabase-schema.sql` 파일의 SQL을 Supabase 콘솔에서 실행하세요.

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000에서 확인할 수 있습니다.

## 📝 사용 방법

### 일반 사용자
1. 메인 페이지에서 협회 정보 확인
2. '대회 안내' 메뉴에서 진행중인 대회 조회
3. 원하는 대회 클릭 후 상세 정보 확인
4. 참가신청 탭에서 신청서 작성 및 제출

### 관리자
1. `/admin` 경로 접속
2. 관리자 비밀번호 입력 (기본값: `admin2024!`)
3. 대시보드에서 현황 확인
4. '대회 등록' 버튼으로 새 대회 생성
5. 기존 대회 수정/삭제 관리

## 🗄 데이터베이스 구조

### competitions (대회)
- id, title, description, date, location
- max_participants, current_participants
- registration_start, registration_end
- entry_fee, course_description, prizes
- image_url, status, timestamps

### registrations (참가신청)
- id, competition_id, name, email, phone
- birth_date, gender, emergency_contact
- medical_conditions, shirt_size, status

### competition_posts (대회게시판)
- id, competition_id, title, content, author
- timestamps

### admin_users (관리자)
- id, email, name, role, timestamp

## 🔐 보안

- Row Level Security (RLS) 정책 적용
- 참가신청: 누구나 등록 가능, 본인/관리자만 조회
- 대회: 공개된 것만 일반 사용자 조회, 관리자는 모든 권한
- 관리자: 간단한 비밀번호 인증 (실제 환경에서는 더 안전한 방법 권장)

## 📱 반응형 디자인

- Mobile First 방식
- Tailwind CSS의 responsive utilities 활용
- 모든 화면 크기에서 최적화된 사용자 경험

## 🚀 배포

### Vercel 배포 (권장)
1. GitHub에 코드 푸시
2. Vercel 계정 연결
3. 환경변수 설정
4. 자동 배포

## 🔧 추가 개발 가능 기능

- 이메일 알림 시스템
- 결제 연동 (포트원, 토스페이먼츠 등)
- 이미지 업로드 기능
- 대회 결과 및 순위 시스템
- 더 강화된 관리자 인증 (OAuth, JWT)
- PWA 지원
- 다국어 지원

## 📞 관리자 정보

**기본 관리자 비밀번호**: `admin2024!`

보안을 위해 실제 운영시에는 반드시 변경하시기 바랍니다.
"# run10-homepage" 
"# run10-homepage" 
