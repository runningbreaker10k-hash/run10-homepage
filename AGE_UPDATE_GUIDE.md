# 나이 자동 업데이트 가이드

## 📊 현재 상황

### 1. 회원가입 시 (users 테이블)
```typescript
// src/components/MembershipForm.tsx:402
birth_date: data.birth_date  // 6자리만 저장 (예: "990101")
```
- **users 테이블에는 age 필드가 없습니다**
- 생년월일(`birth_date`)만 저장됩니다

### 2. 대회 참가 신청 시 (registrations 테이블)
```typescript
// src/components/MemberRegistrationForm.tsx:181-199
const age = calculateAge(userDetails.birth_date)  // 신청 시점의 나이 계산
age: age  // 데이터베이스에 고정 값으로 저장
```
- **신청 시점의 나이**가 계산되어 `INTEGER`로 저장
- **시간이 지나도 자동으로 업데이트되지 않음**

### 3. 사용되는 곳
| 위치 | 파일 | 라인 | 용도 |
|------|------|------|------|
| 관리자 필터 | `src/app/admin/page.tsx` | 658-664 | 나이대별 참가자 필터링 |
| CSV 내보내기 | `src/app/admin/page.tsx` | 1626-1652 | 엑셀 다운로드 시 나이 포함 |
| 신청 조회 | `src/components/RegistrationLookup.tsx` | 501-502 | 참가자 나이 표시 |
| 참가자 상세 | `src/app/admin/page.tsx` | 3719-3721 | 참가자 정보 표시 |

## ⚠️ 문제점

**예시:**
- 2024년 3월에 만 25세로 대회 신청
- 2025년 3월이 되어 실제로는 만 26세
- 하지만 시스템에는 여전히 **25세로 표시**됨

## 🔧 해결 방법

### 옵션 1: PostgreSQL Function으로 실시간 계산 ⭐ (추천)

**장점:**
- 기존 코드 변경 최소화
- 항상 정확한 나이 반환
- 성능 우수 (DB 레벨에서 계산)

**단점:**
- Supabase SQL 편집기에서 실행 필요

**적용 방법:**

#### 1단계: Supabase에서 SQL 실행

`auto-calculate-age.sql` 파일의 다음 부분을 실행:

```sql
-- 1. 나이 계산 함수 생성
CREATE OR REPLACE FUNCTION calculate_age_from_birth_date(birth_date_str VARCHAR)
RETURNS INTEGER AS $$
-- (함수 내용은 auto-calculate-age.sql 참조)
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger로 신청 시 자동 계산
CREATE OR REPLACE FUNCTION auto_update_age_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age := calculate_age_from_birth_date(NEW.birth_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_age
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_age_on_registration();

-- 3. 기존 데이터 업데이트
UPDATE registrations
SET age = calculate_age_from_birth_date(birth_date);
```

#### 2단계: 확인

Supabase SQL Editor에서 실행:
```sql
-- 특정 참가자 나이 확인
SELECT
  name,
  birth_date,
  age AS old_age,
  calculate_age_from_birth_date(birth_date) AS new_age
FROM registrations
LIMIT 10;
```

### 옵션 2: 클라이언트에서 계산 (코드 수정 필요)

**장점:**
- DB 변경 불필요
- 항상 최신 나이 표시

**단점:**
- 모든 관련 파일 수정 필요
- 필터링/정렬 성능 저하 가능

**적용 방법:**

#### 1. 공통 유틸리티 함수 생성

`src/lib/ageUtils.ts` 파일 생성:
```typescript
export function calculateAge(birthDate: string): number {
  if (!birthDate || (birthDate.length !== 6 && birthDate.length !== 8)) {
    return 0;
  }

  const year = birthDate.length === 6
    ? parseInt(birthDate.substring(0, 2))
    : parseInt(birthDate.substring(0, 4));
  const month = birthDate.length === 6
    ? parseInt(birthDate.substring(2, 4))
    : parseInt(birthDate.substring(4, 6));
  const day = birthDate.length === 6
    ? parseInt(birthDate.substring(4, 6))
    : parseInt(birthDate.substring(6, 8));

  const currentYear = new Date().getFullYear();
  const fullYear = birthDate.length === 6
    ? (year <= (currentYear % 100) ? 2000 + year : 1900 + year)
    : year;

  const today = new Date();
  let age = today.getFullYear() - fullYear;

  if (today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }

  return age;
}
```

#### 2. 관련 파일 수정

**수정 필요 파일 목록:**
1. `src/app/admin/page.tsx` (필터링, CSV, 표시)
2. `src/components/RegistrationLookup.tsx` (표시)
3. 기타 `reg.age`를 사용하는 모든 곳

**수정 예시:**
```typescript
// Before
const age = reg.age || 0

// After
import { calculateAge } from '@/lib/ageUtils'
const age = calculateAge(reg.birth_date)
```

### 옵션 3: Cron Job으로 주기적 업데이트 (비추천)

**장점:**
- 기존 구조 유지

**단점:**
- Supabase Pro 플랜 필요 (pg_cron 사용)
- 실시간 업데이트 아님
- 추가 비용 발생

## 📝 추천 적용 순서

### 방법 A: DB Function 사용 (추천)

1. ✅ Supabase SQL Editor 접속
2. ✅ `auto-calculate-age.sql` 파일 내용 복사
3. ✅ 1단계: Function 생성 실행
4. ✅ 2단계: Trigger 생성 실행
5. ✅ 3단계: 기존 데이터 업데이트 실행
6. ✅ 테스트 쿼리 실행하여 확인
7. ⚠️ 웹사이트에서 참가자 정보 확인 (정상 작동 확인)

### 방법 B: 클라이언트 계산 (DB 수정 불가능한 경우)

1. ✅ `src/lib/ageUtils.ts` 생성
2. ✅ 모든 `reg.age` 사용 위치를 `calculateAge(reg.birth_date)`로 변경
3. ✅ 테스트 및 확인

## 🧪 테스트 방법

### 1. SQL 테스트 (옵션 1 선택 시)

```sql
-- 함수 직접 테스트
SELECT
  calculate_age_from_birth_date('990101') AS age_1,
  calculate_age_from_birth_date('20000315') AS age_2;

-- 실제 데이터 확인
SELECT
  name,
  birth_date,
  age AS stored_age,
  calculate_age_from_birth_date(birth_date) AS calculated_age
FROM registrations
WHERE age != calculate_age_from_birth_date(birth_date)
LIMIT 20;
```

### 2. 웹사이트 테스트

1. 관리자 페이지 → 참가자 관리
2. 나이대별 필터링 테스트
3. CSV 다운로드 후 나이 확인
4. 참가 신청 조회에서 나이 확인

## 🔄 롤백 방법

만약 문제가 생기면 다음 SQL을 실행하여 원래대로 되돌릴 수 있습니다:

```sql
-- Trigger 삭제
DROP TRIGGER IF EXISTS trigger_auto_update_age ON registrations;

-- Function 삭제
DROP FUNCTION IF EXISTS auto_update_age_on_registration();
DROP FUNCTION IF EXISTS calculate_age_from_birth_date(VARCHAR);
```

## 📌 주의사항

1. **백업 필수**: Supabase에서 SQL 실행 전 데이터 백업 권장
2. **운영 중 실행**: UPDATE 쿼리는 참가자 수가 많으면 시간이 걸릴 수 있음
3. **테스트 환경**: 가능하면 테스트 환경에서 먼저 적용 후 운영 반영

## ❓ FAQ

### Q: 기존에 신청한 사람들의 나이도 자동으로 변경되나요?
A: 예, 옵션 1을 선택하면 Trigger가 자동으로 계산하며, UPDATE 쿼리를 실행하면 기존 데이터도 업데이트됩니다.

### Q: 새로 신청하는 사람은 자동으로 적용되나요?
A: 예, Trigger를 생성하면 새로운 신청은 자동으로 정확한 나이가 계산됩니다.

### Q: 클라이언트 코드도 수정해야 하나요?
A: 옵션 1을 선택하면 클라이언트 코드 수정이 필요 없습니다. Trigger가 자동으로 처리합니다.

### Q: CSV 내보내기에서도 정확한 나이가 나오나요?
A: 예, registrations 테이블의 age 필드가 업데이트되므로 기존 코드 그대로 정확한 나이가 출력됩니다.

## 📧 도움이 필요하시면

1. Supabase Dashboard → SQL Editor에서 직접 실행
2. 문제 발생 시 에러 메시지 확인
3. 롤백 SQL로 원상복구 가능
