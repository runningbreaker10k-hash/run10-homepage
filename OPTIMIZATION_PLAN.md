# RUN10 트래픽 최적화 계획

## 📊 1단계: 현황 분석

### Supabase 트래픽 확인 항목
- **Database 읽기/쓰기 횟수**
  - Supabase Dashboard → Settings → Usage 확인
  - 어떤 쿼리가 가장 자주 실행되는지
  - 실시간(Realtime) 구독이 과도하게 사용되는지

- **Storage 사용량**
  - 이미지 파일 요청 횟수
  - 불필요한 중복 이미지 업로드 여부

- **Auth 요청**
  - 로그인/세션 확인 요청 빈도

### Vercel 트래픽 확인 항목
- **Function Execution**
  - 서버사이드 렌더링(SSR) 사용 빈도
  - API 라우트 호출 횟수

- **Bandwidth**
  - 페이지별 방문자 수
  - 정적 파일 전송량

---

## 🎯 2단계: 최적화 전략 (우선순위별)

### ⭐ 우선순위 1: 데이터베이스 쿼리 최적화 (즉시 효과)

#### A. 불필요한 쿼리 제거
**문제점:**
- 페이지 로드마다 동일한 데이터를 반복 조회
- 컴포넌트마다 중복 쿼리 실행

**해결책:**
```javascript
// ❌ 현재: 매번 DB 조회
useEffect(() => {
  fetchCompetitions() // 페이지 이동할 때마다 실행
}, [])

// ✅ 개선: 캐싱 적용
const CACHE_TIME = 5 * 60 * 1000 // 5분
let cachedData = null
let cacheTime = 0

const fetchCompetitions = async () => {
  const now = Date.now()
  if (cachedData && (now - cacheTime) < CACHE_TIME) {
    return cachedData // 캐시된 데이터 사용
  }

  const data = await supabase.from('competitions').select('*')
  cachedData = data
  cacheTime = now
  return data
}
```

**적용 대상:**
- 대회 목록 (자주 변경되지 않음)
- 회원 등급 정보
- 정적 컨텐츠

#### B. Select 쿼리 최적화
**문제점:**
```javascript
// ❌ 모든 컬럼을 가져옴 (낭비)
.select('*')

// ❌ 불필요한 Join
.select(`
  *,
  users (*),
  participation_groups (*),
  registrations (*)
`)
```

**해결책:**
```javascript
// ✅ 필요한 컬럼만 선택
.select('id, title, date, location, status')

// ✅ 필요한 관계만 Join
.select(`
  id, title, date,
  participation_groups!inner(name, distance)
`)
```

#### C. 페이지네이션 개선
**문제점:**
- 전체 데이터를 한 번에 로드
- count 쿼리를 별도로 실행

**해결책:**
```javascript
// ✅ 페이지네이션 + count를 한 번에
const { data, error, count } = await supabase
  .from('registrations')
  .select('id, name, email', { count: 'exact' })
  .range(0, 19) // 첫 20개만
```

---

### ⭐ 우선순위 2: 이미지 최적화 (Storage 비용 절감)

#### A. Next.js Image 컴포넌트 사용
**문제점:**
```jsx
// ❌ 원본 이미지를 그대로 로드
<img src={competition.image_url} alt="..." />
```

**해결책:**
```jsx
// ✅ Next.js Image로 자동 최적화
import Image from 'next/image'

<Image
  src={competition.image_url}
  alt="..."
  width={800}
  height={600}
  placeholder="blur" // 로딩 중 블러 처리
  loading="lazy" // 지연 로딩
/>
```

#### B. 이미지 CDN 활용
**해결책:**
- Supabase Storage URL에 변환 파라미터 추가
- 또는 Vercel Image Optimization 활용

```javascript
// ✅ 썸네일 생성
const thumbnailUrl = `${imageUrl}?width=400&quality=80`
```

#### C. WebP 형식 사용
```javascript
// 업로드 시 WebP로 변환하여 저장
// 파일 크기 약 30% 감소
```

---

### ⭐ 우선순위 3: 클라이언트 사이드 캐싱

#### A. React Query / SWR 도입
**장점:**
- 자동 캐싱
- 백그라운드 데이터 갱신
- 중복 요청 제거

**예시:**
```javascript
import useSWR from 'swr'

function CompetitionList() {
  const { data, error } = useSWR(
    '/api/competitions',
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 안 함
      dedupingInterval: 60000 // 1분간 중복 요청 방지
    }
  )
}
```

#### B. LocalStorage 활용
```javascript
// 자주 조회하는 데이터는 LocalStorage에 캐싱
const getCachedData = (key) => {
  const cached = localStorage.getItem(key)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < 5 * 60 * 1000) { // 5분
      return data
    }
  }
  return null
}
```

---

### ⭐ 우선순위 4: Static Generation 활용

#### A. getStaticProps 사용
**대상 페이지:**
- 홈페이지 (/)
- 소개 페이지
- FAQ 페이지

**예시:**
```javascript
// 정적으로 생성 (빌드 시 한 번만 생성)
export async function getStaticProps() {
  const competitions = await fetchCompetitions()

  return {
    props: { competitions },
    revalidate: 300 // 5분마다 재생성 (ISR)
  }
}
```

#### B. ISR (Incremental Static Regeneration)
```javascript
// 대회 상세 페이지
export async function getStaticProps({ params }) {
  return {
    props: { competition },
    revalidate: 600 // 10분마다 재생성
  }
}
```

---

### ⭐ 우선순위 5: API 라우트 최적화

#### A. Edge Functions 활용
```javascript
// Vercel Edge Functions로 전환 (더 빠르고 저렴)
export const config = {
  runtime: 'edge'
}

export default async function handler(req) {
  // ...
}
```

#### B. API 응답 캐싱
```javascript
export default async function handler(req, res) {
  // 5분간 캐싱
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')

  const data = await fetchData()
  res.json(data)
}
```

---

### ⭐ 우선순위 6: 실시간 기능 최적화

**문제점:**
- Supabase Realtime 구독이 과도하게 사용될 수 있음

**확인 방법:**
```javascript
// 현재 Realtime 구독이 있는지 확인
grep -r "subscribe" src/
```

**해결책:**
- 필요한 경우에만 구독
- 컴포넌트 언마운트 시 반드시 구독 해제

```javascript
useEffect(() => {
  const subscription = supabase
    .channel('registrations')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'registrations',
      filter: `competition_id=eq.${competitionId}` // 필터 적용
    }, handleNewRegistration)
    .subscribe()

  return () => {
    subscription.unsubscribe() // 정리
  }
}, [competitionId])
```

---

## 🔧 3단계: 구현 우선순위

### Phase 1: 즉시 적용 (1-2일)
1. ✅ Select 쿼리 최적화 (필요한 컬럼만 선택)
2. ✅ 중복 쿼리 제거
3. ✅ 페이지네이션 count 최적화
4. ✅ 이미지 lazy loading 적용

### Phase 2: 단기 적용 (1주)
5. ✅ 클라이언트 사이드 캐싱 (메모리)
6. ✅ Next.js Image 컴포넌트로 전환
7. ✅ 정적 페이지 ISR 적용

### Phase 3: 중장기 적용 (2-3주)
8. ✅ React Query/SWR 도입
9. ✅ 이미지 CDN/최적화 파이프라인 구축
10. ✅ Edge Functions 전환

---

## 📈 4단계: 모니터링

### 추적 지표
```javascript
// 간단한 성능 모니터링 추가
const measureQuery = async (name, queryFn) => {
  const start = performance.now()
  const result = await queryFn()
  const duration = performance.now() - start

  console.log(`[Query] ${name}: ${duration.toFixed(2)}ms`)

  // 개발 환경에서만 경고
  if (process.env.NODE_ENV === 'development' && duration > 1000) {
    console.warn(`⚠️ Slow query detected: ${name}`)
  }

  return result
}

// 사용 예시
const competitions = await measureQuery(
  'fetch_competitions',
  () => supabase.from('competitions').select('*')
)
```

### Vercel Analytics 활성화
```bash
npm install @vercel/analytics
```

```javascript
// _app.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics /> {/* 페이지 성능 추적 */}
    </>
  )
}
```

---

## 💰 5단계: 예상 효과

### 데이터베이스 쿼리 감소
- **현재:** 페이지 로드당 평균 5-10회 쿼리
- **개선 후:** 페이지 로드당 평균 1-3회 쿼리
- **감소율:** 50-70% ⬇️

### 이미지 전송량 감소
- **현재:** 원본 이미지 전송 (평균 2-3MB)
- **개선 후:** 최적화된 이미지 (평균 300-500KB)
- **감소율:** 80-85% ⬇️

### Function Execution 감소
- **현재:** SSR 페이지 많음
- **개선 후:** ISR/Static 페이지로 전환
- **감소율:** 60-80% ⬇️

### 예상 비용 절감
- **Supabase:** 월 $50-100 절감 가능
- **Vercel:** 월 $30-50 절감 가능

---

## 🚀 다음 단계

1. **먼저 Supabase/Vercel Dashboard에서 현재 사용량 확인**
   - 어떤 부분이 가장 많이 사용되는지 파악

2. **Phase 1 최적화부터 시작**
   - 가장 효과가 크고 쉬운 것부터

3. **2주 후 사용량 비교**
   - 최적화 효과 측정

4. **필요시 Phase 2, 3 진행**

---

## 📝 참고 자료

- [Supabase Performance Best Practices](https://supabase.com/docs/guides/performance)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [React Query Documentation](https://tanstack.com/query/latest)
