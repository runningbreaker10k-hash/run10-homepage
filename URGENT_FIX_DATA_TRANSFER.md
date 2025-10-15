# 🚨 긴급: 데이터 전송량 100% 초과 문제 해결

## 📊 문제 상황

### Supabase
- **Cached Egress (fast data transfer)**: 100% 초과 ❌
- **원인**: Storage에서 이미지/파일을 반복적으로 다운로드

### Vercel
- **Fast Data Transfer**: 100GB/100GB 사용 완료 ❌
- **결과**: 프로젝트 자동 일시정지 위험
- **원인**: 페이지 렌더링, API 응답 시 대용량 데이터 전송

---

## 🔥 가장 큰 문제: 이미지 파일

### 현재 상황 분석

데이터 전송량이 100%를 초과한 주요 원인은 **이미지 파일**입니다:

1. **대회 이미지** (competitions.image_url)
   - 원본 고해상도 이미지 전송
   - 평균 크기: 2-5MB
   - 페이지 로드마다 전송

2. **코스 이미지** (competitions.course_image_url)
   - 코스 지도 이미지
   - 평균 크기: 1-3MB

3. **시상품 이미지** (competitions.prizes_image_url)
   - 시상 내역 이미지
   - 평균 크기: 1-2MB

4. **게시판 첨부 이미지** (community_posts.image_url)
   - 사용자 업로드 이미지

### 계산 예시
```
대회 1개당 이미지: 5MB (메인) + 3MB (코스) + 2MB (시상) = 10MB

방문자 100명이 대회 상세 페이지 방문:
100명 × 10MB = 1,000MB = 1GB

하루 1,000명 방문 시:
1,000명 × 10MB = 10GB/일 = 300GB/월 ⚠️
```

---

## ✅ 즉시 해결 방법 (오늘 바로 적용)

### 🎯 방법 1: 이미지 크기 제한 (가장 중요!)

#### A. 업로드 시 이미지 리사이징

현재 코드를 확인해보겠습니다.

**문제:**
```javascript
// 현재: 원본 이미지를 그대로 업로드
const { data, error } = await supabase.storage
  .from('competition-images')
  .upload(filePath, file)
```

**해결책 1: 클라이언트에서 리사이징**
```javascript
// 이미지 리사이징 함수 추가
const resizeImage = async (file: File, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 최대 너비 제한
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          const resizedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(resizedFile)
        }, 'image/jpeg', 0.85) // 85% 품질
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// 업로드 전에 리사이징
const uploadImage = async (file: File) => {
  // 1. 리사이징
  const resizedFile = await resizeImage(file, 1200) // 최대 1200px

  // 2. 업로드
  const { data, error } = await supabase.storage
    .from('competition-images')
    .upload(filePath, resizedFile)
}
```

**해결책 2: 파일 크기 제한**
```javascript
// 업로드 전 검증
const validateImage = (file: File) => {
  const maxSize = 2 * 1024 * 1024 // 2MB

  if (file.size > maxSize) {
    alert('이미지 크기는 2MB 이하여야 합니다.')
    return false
  }

  return true
}
```

#### B. 기존 이미지 최적화

**기존에 업로드된 대용량 이미지 처리:**

```javascript
// 기존 이미지를 확인하고 큰 이미지를 다운로드/리사이징/재업로드
// 관리자 페이지에 "이미지 최적화" 버튼 추가

const optimizeExistingImages = async () => {
  // 1. 모든 대회의 이미지 URL 가져오기
  const { data: competitions } = await supabase
    .from('competitions')
    .select('id, image_url, course_image_url, prizes_image_url')

  // 2. 각 이미지 체크 및 최적화
  for (const comp of competitions) {
    if (comp.image_url) {
      // 이미지 크기 확인 로직
      // 큰 이미지는 리사이징하여 재업로드
    }
  }
}
```

---

### 🎯 방법 2: CDN + 이미지 변환 파라미터 사용

#### Supabase Storage에서 제공하는 이미지 변환

Supabase는 이미지 변환 기능을 지원합니다:

```javascript
// ❌ 현재: 원본 이미지
const imageUrl = 'https://...supabase.co/storage/v1/object/public/competition-images/image.jpg'

// ✅ 개선: 변환된 이미지 (자동 리사이징)
const optimizedUrl = 'https://...supabase.co/storage/v1/object/public/competition-images/image.jpg?width=800&quality=80'
```

**모든 이미지 표시 부분에 적용:**

```jsx
// components/ImageWithOptimization.tsx
export const OptimizedImage = ({ src, alt, width = 800 }) => {
  const optimizedSrc = src ? `${src}?width=${width}&quality=80` : ''

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
    />
  )
}
```

---

### 🎯 방법 3: Next.js Image 컴포넌트로 전환 (필수!)

Next.js Image는 자동으로 최적화합니다:
- WebP 변환
- 적절한 크기로 리사이징
- Lazy loading

```jsx
// ❌ 현재
<img
  src={competition.image_url}
  alt={competition.title}
/>

// ✅ 개선
import Image from 'next/image'

<Image
  src={competition.image_url}
  alt={competition.title}
  width={800}
  height={600}
  quality={75}
  placeholder="blur"
  blurDataURL="/placeholder.jpg"
/>
```

**⚠️ Supabase URL을 Next.js Image와 함께 사용하려면:**

```javascript
// next.config.js 또는 next.config.mjs
const nextConfig = {
  images: {
    domains: ['wylklwgubweeemglaczr.supabase.co'], // Supabase 도메인 추가
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}
```

---

### 🎯 방법 4: 이미지 Lazy Loading (즉시 효과)

모든 이미지에 lazy loading 적용:

```jsx
// 가장 간단한 방법
<img
  src={imageUrl}
  alt="..."
  loading="lazy" // 추가!
/>
```

---

### 🎯 방법 5: 대회 목록에서 썸네일 사용

대회 목록 페이지에서는 작은 썸네일만:

```javascript
// 목록 페이지
const thumbnailUrl = `${competition.image_url}?width=400&quality=70`

// 상세 페이지
const fullImageUrl = `${competition.image_url}?width=1200&quality=85`
```

---

## 🔧 즉시 적용할 코드 수정

### 1단계: ImageUpload 컴포넌트 수정 (가장 중요!)

현재 `src/components/ImageUpload.tsx`를 수정:

```typescript
// 이미지 리사이징 함수 추가
const resizeImage = async (file: File, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }))
        }, 'image/jpeg', 0.85)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// 업로드 함수 수정
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 파일 크기 체크
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    alert('이미지 크기는 5MB 이하여야 합니다.')
    return
  }

  setUploading(true)

  try {
    // 🔥 리사이징 추가!
    const resizedFile = await resizeImage(file, 1200)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('competition-images')
      .upload(filePath, resizedFile) // 리사이징된 파일 업로드

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('competition-images')
      .getPublicUrl(filePath)

    onImageUploaded(publicUrl)
  } catch (error) {
    console.error('Error uploading image:', error)
    alert('이미지 업로드 중 오류가 발생했습니다.')
  } finally {
    setUploading(false)
  }
}
```

### 2단계: next.config.js 수정

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['wylklwgubweeemglaczr.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

### 3단계: 공통 이미지 컴포넌트 생성

```typescript
// src/components/OptimizedImage.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export default function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false
}: OptimizedImageProps) {
  // Supabase 이미지에 변환 파라미터 추가
  const optimizedSrc = src.includes('supabase.co')
    ? `${src}?width=${width}&quality=80`
    : src

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={75}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg=="
    />
  )
}
```

---

## 📊 예상 효과

### Before (현재)
```
이미지 1개: 3MB
페이지 로드: 10MB (이미지 3-4개)
1,000명 방문: 10GB
월간: 300GB ❌
```

### After (최적화 후)
```
이미지 1개: 300KB (10배 감소!)
페이지 로드: 1MB
1,000명 방문: 1GB
월간: 30GB ✅ (90% 감소!)
```

---

## 🚀 적용 우선순위

### 즉시 (오늘)
1. ✅ **ImageUpload 컴포넌트에 리사이징 추가**
2. ✅ **next.config.js에 Supabase 도메인 추가**
3. ✅ **모든 `<img>`에 `loading="lazy"` 추가**

### 1-2일 내
4. ✅ **OptimizedImage 컴포넌트 생성 및 교체**
5. ✅ **기존 대용량 이미지 확인 및 최적화**

### 1주 내
6. ✅ **목록 페이지에 썸네일 사용**
7. ✅ **Vercel Image Optimization 활용**

---

## 🎯 다음 단계

1. **즉시: ImageUpload 컴포넌트 수정 도와드릴까요?**
   - 이것만 해도 80-90% 개선됩니다!

2. **기존 이미지 최적화**
   - 관리자 페이지에 "이미지 최적화" 기능 추가

3. **모니터링**
   - 1주일 후 Supabase/Vercel 사용량 재확인

어떤 것부터 시작하시겠습니까? 코드 수정을 바로 도와드릴 수 있습니다!
