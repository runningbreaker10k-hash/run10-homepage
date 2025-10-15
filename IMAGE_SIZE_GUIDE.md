# 🖼️ 웹 이미지 최적 크기 가이드 (화질 유지)

## 📏 용도별 권장 크기

### 1. 대회 메인 이미지 (Hero Image)
**표시 위치:** 대회 상세 페이지 상단
**현재 크기:** 풀 HD (1920x1080) 이상, 3-5MB

#### ✅ 권장 크기
- **해상도:** 1600x900px (16:9 비율)
- **파일 크기:** 200-400KB
- **품질:** JPEG 85% 또는 WebP 80%

**이유:**
- 대부분 모니터가 1920px 이하
- 브라우저가 자동으로 화면에 맞춤
- 레티나 디스플레이도 충분히 커버

```
원본: 4000x2250px, 3.5MB
최적화: 1600x900px, 300KB
화질 차이: 육안으로 거의 구분 불가 ✅
용량 감소: 약 92% ⬇️
```

---

### 2. 대회 목록 썸네일
**표시 위치:** 대회 목록 페이지의 카드 이미지
**현재 크기:** 원본 그대로 사용 (낭비)

#### ✅ 권장 크기
- **해상도:** 600x400px (3:2 비율)
- **파일 크기:** 50-100KB
- **품질:** JPEG 80% 또는 WebP 75%

**이유:**
- 목록에서는 작은 크기로 표시
- 빠른 로딩이 더 중요

```
원본: 3.5MB
썸네일: 80KB
화질: 목록에서는 완벽하게 보임 ✅
용량 감소: 약 98% ⬇️
```

---

### 3. 코스 지도 이미지
**표시 위치:** 대회 상세 페이지 코스 안내
**현재 크기:** 고해상도 지도, 1-3MB

#### ✅ 권장 크기
- **해상도:** 1200x800px
- **파일 크기:** 150-250KB
- **품질:** JPEG 85% (텍스트가 있어서 조금 높게)

**이유:**
- 지도는 확대해서 볼 수 있어야 함
- 하지만 1200px면 충분히 선명

```
원본: 3000x2000px, 2.5MB
최적화: 1200x800px, 200KB
화질: 텍스트도 선명하게 읽힘 ✅
용량 감소: 약 92% ⬇️
```

---

### 4. 시상품 이미지
**표시 위치:** 대회 상세 페이지 시상 내역
**현재 크기:** 1-2MB

#### ✅ 권장 크기
- **해상도:** 1200x800px
- **파일 크기:** 150-200KB
- **품질:** JPEG 85%

---

### 5. 게시판 첨부 이미지
**표시 위치:** 커뮤니티/게시판 본문
**현재 크기:** 제한 없음

#### ✅ 권장 크기
- **해상도:** 1200x900px (최대)
- **파일 크기:** 200KB 이하
- **품질:** JPEG 80%

---

## 🎯 최종 권장 설정

### 용도별 요약표

| 용도 | 너비(px) | 파일크기 | JPEG 품질 | WebP 품질 |
|------|----------|----------|-----------|-----------|
| **대회 메인 이미지** | 1600 | 200-400KB | 85% | 80% |
| **대회 목록 썸네일** | 600 | 50-100KB | 80% | 75% |
| **코스/시상 이미지** | 1200 | 150-250KB | 85% | 80% |
| **게시판 이미지** | 1200 | 200KB 이하 | 80% | 75% |

---

## 📱 반응형 고려사항

### 모바일 vs 데스크톱

실제로 사용자가 보는 크기:

```
데스크톱 (1920px 모니터):
- 대회 상세: 최대 1200-1400px로 표시
- 목록 카드: 300-400px로 표시

모바일 (375px):
- 대회 상세: 전체 너비 375px
- 목록 카드: 전체 너비 375px

→ 1600px 이미지면 모든 환경에서 충분!
```

---

## 🔬 화질 비교 테스트

### JPEG 품질별 차이

**100% (무압축)**
- 파일 크기: 매우 큼 (3-5MB)
- 화질: 완벽
- 웹 용도: 과도함 ❌

**90%**
- 파일 크기: 큼 (1-2MB)
- 화질: 거의 완벽
- 웹 용도: 여전히 과도함 ⚠️

**85%** ⭐ 권장
- 파일 크기: 적당 (300-500KB)
- 화질: 육안으로 구분 불가
- 웹 용도: 최적 ✅

**80%**
- 파일 크기: 작음 (200-300KB)
- 화질: 매우 좋음
- 웹 용도: 썸네일에 적합 ✅

**70%**
- 파일 크기: 매우 작음 (150KB)
- 화질: 약간 열화 눈에 보임
- 웹 용도: 작은 이미지만 ⚠️

---

## 💾 파일 포맷 비교

### JPEG vs WebP

**JPEG**
- 호환성: 모든 브라우저 ✅
- 압축률: 좋음
- 파일 크기: 기준

**WebP**
- 호환성: 최신 브라우저만 (95%+)
- 압축률: 매우 좋음 (JPEG 대비 25-35% 작음)
- 파일 크기: JPEG 대비 30% 작음 ⭐

**권장: WebP + JPEG 폴백**
```jsx
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="...">
</picture>
```

---

## 🛠️ 실제 적용 코드

### 1. 이미지 리사이징 함수 (최종 버전)

```typescript
interface ResizeOptions {
  maxWidth: number
  maxHeight?: number
  quality: number
  format?: 'jpeg' | 'webp'
}

const resizeImage = async (
  file: File,
  options: ResizeOptions
): Promise<File> => {
  const {
    maxWidth,
    maxHeight = maxWidth * 0.75, // 3:4 비율 기본
    quality,
    format = 'jpeg'
  } = options

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 비율 유지하면서 리사이징
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width
          const heightRatio = maxHeight / height
          const ratio = Math.min(widthRatio, heightRatio)

          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!

        // 고품질 렌더링 설정
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, width, height)

        // 파일로 변환
        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              })
              resolve(resizedFile)
            }
          },
          mimeType,
          quality / 100
        )
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}
```

### 2. 용도별 적용

```typescript
// 대회 메인 이미지
const resizedMainImage = await resizeImage(file, {
  maxWidth: 1600,
  maxHeight: 900,
  quality: 85,
  format: 'jpeg'
})

// 썸네일
const resizedThumbnail = await resizeImage(file, {
  maxWidth: 600,
  maxHeight: 400,
  quality: 80,
  format: 'jpeg'
})

// 코스 이미지 (텍스트가 있어서 품질 높게)
const resizedCourseImage = await resizeImage(file, {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 85,
  format: 'jpeg'
})
```

---

## 📊 예상 절감 효과

### Before (현재)
```
대회 1개:
- 메인: 3.5MB
- 코스: 2.5MB
- 시상: 2MB
총: 8MB

1,000명 방문: 8GB
월간 10,000명: 80GB
```

### After (최적화)
```
대회 1개:
- 메인: 300KB (92% ⬇️)
- 코스: 200KB (92% ⬇️)
- 시상: 180KB (91% ⬇️)
총: 680KB

1,000명 방문: 680MB
월간 10,000명: 6.8GB

절감률: 91.5% ⬇️
```

---

## ✅ 최종 권장사항

### RUN10 프로젝트 적용 기준

1. **대회 메인 이미지**
   - 1600x900px, JPEG 85%, 목표 300-400KB

2. **목록 썸네일**
   - 600x400px, JPEG 80%, 목표 80-100KB

3. **코스/시상 이미지**
   - 1200x800px, JPEG 85%, 목표 200-250KB

4. **파일 크기 제한**
   - 업로드 전: 최대 5MB (사용자 편의)
   - 업로드 후: 자동 리사이징으로 목표 크기로 축소

5. **포맷**
   - 우선: JPEG (호환성)
   - 향후: WebP 지원 추가 (30% 추가 절감)

---

## 🔍 화질 확인 방법

실제로 적용 후 화질이 괜찮은지 확인하려면:

1. **원본 이미지 저장**
2. **리사이징 적용**
3. **두 이미지를 브라우저에서 나란히 비교**
4. **100% 확대해서 비교**

대부분의 경우 **85% 품질**이면 육안으로 차이를 거의 구분할 수 없습니다!

---

## 💡 추가 최적화 팁

### 1. Progressive JPEG
- 이미지가 점진적으로 로드
- 사용자 경험 개선

### 2. 적응형 품질
```typescript
// 파일 크기에 따라 품질 조절
const getOptimalQuality = (fileSize: number): number => {
  if (fileSize < 1024 * 1024) return 85      // 1MB 미만
  if (fileSize < 3 * 1024 * 1024) return 80  // 3MB 미만
  return 75                                   // 3MB 이상
}
```

### 3. Blur Placeholder
- 로딩 중 블러 처리된 미리보기 표시
- 10KB 이하의 작은 이미지 사용
