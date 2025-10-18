# 회원정보-참가자정보 자동 동기화 가이드

## 개요

마이페이지에서 회원정보를 수정하면 해당 회원의 모든 대회 참가신청 정보가 자동으로 동기화되도록 설정합니다.

## 해결하는 문제

### 현재 문제
```
마이페이지에서 연락처 변경: 010-1111-2222 → 010-3333-4444

users 테이블 ✅
phone: 010-3333-4444

registrations 테이블 ❌
대회1 신청: phone: 010-1111-2222 (옛날 정보)
대회2 신청: phone: 010-1111-2222 (옛날 정보)
대회3 신청: phone: 010-1111-2222 (옛날 정보)

→ 각각 따로 수정해야 하는 문제!
```

### 해결 후
```
마이페이지에서 연락처 변경: 010-1111-2222 → 010-3333-4444

users 테이블 ✅
phone: 010-3333-4444

↓ 자동 동기화 (트리거)

registrations 테이블 ✅
대회1 신청: phone: 010-3333-4444 (자동 업데이트!)
대회2 신청: phone: 010-3333-4444 (자동 업데이트!)
대회3 신청: phone: 010-3333-4444 (자동 업데이트!)

→ 한 번 수정으로 모든 곳에 자동 반영!
```

## 구현 방식

### 데이터베이스 트리거 사용

**장점:**
- ✅ 마이페이지에서 수정하면 자동 동기화
- ✅ 관리자가 직접 DB 수정해도 동기화
- ✅ 애플리케이션 코드 수정 불필요
- ✅ 데이터 무결성 보장

**동작 방식:**
```
사용자가 마이페이지에서 수정
  ↓
users 테이블 UPDATE
  ↓
트리거 자동 실행
  ↓
registrations 테이블 자동 UPDATE (해당 user_id의 모든 레코드)
```

## 실행 방법

### 1단계: 백업 (중요!)

Supabase 대시보드에서 데이터베이스 백업을 생성하세요.

### 2단계: SQL 스크립트 실행

1. Supabase 프로젝트 접속
2. SQL Editor 열기
3. `sync-user-registrations.sql` 파일 내용 전체 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭

### 3단계: 실행 결과 확인

스크립트 실행 후 다음과 같은 결과가 표시됩니다:

```
✅ Function sync_user_to_registrations created
✅ Trigger trigger_sync_user_to_registrations created
✅ UPDATE registrations... (X rows affected)
✅ SELECT COUNT(*)...
   total_synced: 150
   unique_users: 45
```

## 동기화되는 정보

### ✅ 동기화 대상 (users → registrations)
- `name` - 이름
- `email` - 이메일
- `phone` - 연락처
- `birth_date` - 생년월일
- `gender` - 성별
- `address` - 주소 (address1 + address2 결합)
- `age` - 나이 (birth_date로 자동 계산)

### ❌ 동기화 제외 (참가 관련 정보)
- `participation_group_id` - 참가 그룹
- `shirt_size` - 티셔츠 사이즈
- `depositor_name` - 입금자명
- `notes` - 기타사항
- `distance` - 참가 거리
- `entry_fee` - 참가비
- `payment_status` - 결제 상태

## 테스트 방법

### 1. 트리거 동작 테스트

```sql
-- 1. 테스트용 회원 정보 확인
SELECT id, name, phone, email FROM users WHERE user_id = 'test_user';

-- 2. 해당 회원의 참가신청 정보 확인
SELECT name, phone, email FROM registrations WHERE user_id = '[회원ID]';

-- 3. 회원정보 수정 (연락처 변경)
UPDATE users SET phone = '010-9999-8888' WHERE id = '[회원ID]';

-- 4. 참가신청 정보 자동 동기화 확인
SELECT name, phone, email FROM registrations WHERE user_id = '[회원ID]';
-- → phone이 010-9999-8888로 변경되어 있어야 함
```

### 2. 마이페이지에서 테스트

1. 회원 로그인
2. 마이페이지 → 회원정보 수정
3. 연락처나 이메일 변경
4. 저장
5. 대회 페이지 → 신청 조회
6. **변경된 정보가 자동 반영되었는지 확인**

## 주의사항

### 1. 비회원 신청
- `registrations`의 `user_id`가 NULL인 레코드는 동기화되지 않음
- 비회원 신청은 영향 없음

### 2. 기존 데이터
- 스크립트 실행 전 데이터: 일괄 동기화로 정리됨
- 스크립트 실행 후: 자동 동기화 작동

### 3. 성능
- 회원정보 수정 시 해당 회원의 모든 registrations 업데이트
- 대부분의 회원은 참가신청이 많지 않아 성능 영향 미미
- 만약 한 회원이 100개 이상의 대회 신청이 있다면 약간의 지연 가능

### 4. 롤백
트리거를 제거하고 싶을 때:
```sql
DROP TRIGGER IF EXISTS trigger_sync_user_to_registrations ON users;
DROP FUNCTION IF EXISTS sync_user_to_registrations();
```

## 동작 흐름도

```
┌─────────────────────────────────────────────────────────┐
│ 사용자 시나리오                                           │
└─────────────────────────────────────────────────────────┘

1. 회원이 3개 대회에 신청함
   ├─ 대회A 신청 (name: 홍길동, phone: 010-1111-2222)
   ├─ 대회B 신청 (name: 홍길동, phone: 010-1111-2222)
   └─ 대회C 신청 (name: 홍길동, phone: 010-1111-2222)

2. 마이페이지에서 연락처 변경
   └─ phone: 010-1111-2222 → 010-3333-4444

3. 트리거 자동 실행
   └─ UPDATE users SET phone = '010-3333-4444' WHERE id = 'xxx'
      ↓
   └─ 트리거 발동
      ↓
   └─ UPDATE registrations SET phone = '010-3333-4444'
      WHERE user_id = 'xxx'

4. 결과: 모든 참가신청 정보 자동 업데이트
   ├─ 대회A 신청 (name: 홍길동, phone: 010-3333-4444) ✅
   ├─ 대회B 신청 (name: 홍길동, phone: 010-3333-4444) ✅
   └─ 대회C 신청 (name: 홍길동, phone: 010-3333-4444) ✅
```

## 기대 효과

### 1. 사용자 경험 개선
- 한 번만 수정하면 모든 곳에 반영
- 정보 불일치 걱정 없음

### 2. 데이터 무결성
- users와 registrations 항상 일치
- 관리자가 DB 직접 수정해도 동기화

### 3. 유지보수 편의성
- 별도 동기화 로직 불필요
- 자동으로 관리됨

## 문제 발생 시

### 트리거가 작동하지 않는 경우

1. 트리거 존재 확인:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_user_to_registrations';
```

2. 함수 존재 확인:
```sql
SELECT * FROM pg_proc WHERE proname = 'sync_user_to_registrations';
```

3. 트리거 재생성:
```sql
-- sync-user-registrations.sql 파일을 다시 실행
```

### 동기화가 안 되는 경우

- `user_id`가 NULL인지 확인
- users 테이블에 해당 회원이 존재하는지 확인
- 에러 로그 확인 (Supabase Logs)

## 추가 고려사항

### 향후 개선 가능 사항

1. **선택적 동기화**: 특정 필드만 동기화하도록 설정 가능
2. **동기화 로그**: 언제, 어떤 정보가 동기화되었는지 기록
3. **동기화 알림**: 대량 업데이트 시 관리자에게 알림

### 현재 구현의 장점

- 단순하고 안정적
- 추가 테이블이나 로직 불필요
- 성능 영향 최소화

## 참고 파일

- `sync-user-registrations.sql` - 트리거 생성 및 일괄 동기화 스크립트
- `SYNC_GUIDE.md` - 이 문서
- `RegistrationLookup.tsx` - 참가자 정보 조회/수정 컴포넌트
- `src/app/mypage/page.tsx` - 마이페이지 (회원정보 수정)

## 문의

구현 관련 문의:
- 트리거 동작 원리: `sync-user-registrations.sql` 주석 참고
- 테스트 방법: 이 문서의 "테스트 방법" 섹션 참고
