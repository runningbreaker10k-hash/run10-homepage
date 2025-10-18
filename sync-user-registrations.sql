-- ============================================================================
-- 회원정보(users) - 참가자정보(registrations) 자동 동기화 설정
-- ============================================================================
-- 목적: 마이페이지에서 회원정보 수정 시 registrations 테이블도 자동 동기화
-- 작성일: 2025-10-18
-- ============================================================================

-- ============================================================================
-- 1단계: 트리거 함수 생성
-- ============================================================================
-- users 테이블이 UPDATE될 때 해당 user_id의 모든 registrations를 동기화

CREATE OR REPLACE FUNCTION sync_user_to_registrations()
RETURNS TRIGGER AS $$
BEGIN
  -- 회원정보가 변경되면 해당 회원의 모든 참가신청 정보도 함께 업데이트
  UPDATE registrations
  SET
    name = NEW.name,
    email = NEW.email,
    phone = NEW.phone,
    birth_date = NEW.birth_date,
    gender = NEW.gender,
    address = CONCAT(NEW.address1, ' ', COALESCE(NEW.address2, '')),
    -- age는 birth_date로 다시 계산
    age = CASE
      WHEN NEW.birth_date IS NOT NULL AND LENGTH(NEW.birth_date) = 6 THEN
        EXTRACT(YEAR FROM CURRENT_DATE) -
        (CASE
          WHEN CAST(SUBSTRING(NEW.birth_date, 1, 2) AS INTEGER) <= EXTRACT(YEAR FROM CURRENT_DATE) % 100
          THEN 2000 + CAST(SUBSTRING(NEW.birth_date, 1, 2) AS INTEGER)
          ELSE 1900 + CAST(SUBSTRING(NEW.birth_date, 1, 2) AS INTEGER)
        END)
      ELSE 0
    END
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2단계: 트리거 생성
-- ============================================================================
-- users 테이블 UPDATE 후 자동으로 트리거 함수 실행

DROP TRIGGER IF EXISTS trigger_sync_user_to_registrations ON users;

CREATE TRIGGER trigger_sync_user_to_registrations
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_to_registrations();

-- ============================================================================
-- 3단계: 기존 데이터 일괄 동기화 (한 번만 실행)
-- ============================================================================
-- 현재 저장된 모든 registrations 데이터를 users 테이블 기준으로 동기화

-- 동기화 전 상태 확인 (선택사항)
-- SELECT
--   r.id,
--   r.name as reg_name,
--   u.name as user_name,
--   r.email as reg_email,
--   u.email as user_email,
--   r.phone as reg_phone,
--   u.phone as user_phone
-- FROM registrations r
-- LEFT JOIN users u ON r.user_id = u.id
-- WHERE r.user_id IS NOT NULL
-- LIMIT 10;

-- 일괄 동기화 실행
UPDATE registrations r
SET
  name = u.name,
  email = u.email,
  phone = u.phone,
  birth_date = u.birth_date,
  gender = u.gender,
  address = CONCAT(u.address1, ' ', COALESCE(u.address2, '')),
  age = CASE
    WHEN u.birth_date IS NOT NULL AND LENGTH(u.birth_date) = 6 THEN
      EXTRACT(YEAR FROM CURRENT_DATE) -
      (CASE
        WHEN CAST(SUBSTRING(u.birth_date, 1, 2) AS INTEGER) <= EXTRACT(YEAR FROM CURRENT_DATE) % 100
        THEN 2000 + CAST(SUBSTRING(u.birth_date, 1, 2) AS INTEGER)
        ELSE 1900 + CAST(SUBSTRING(u.birth_date, 1, 2) AS INTEGER)
      END)
    ELSE 0
  END
FROM users u
WHERE r.user_id = u.id;

-- 동기화 결과 확인
SELECT
  COUNT(*) as total_synced,
  COUNT(DISTINCT user_id) as unique_users
FROM registrations
WHERE user_id IS NOT NULL;

-- ============================================================================
-- 4단계: 동기화 확인 쿼리 (테스트용)
-- ============================================================================
-- 동기화가 잘 되었는지 확인

-- 특정 회원의 users와 registrations 정보 비교
-- SELECT
--   u.id as user_id,
--   u.name as user_name,
--   u.email as user_email,
--   u.phone as user_phone,
--   r.id as registration_id,
--   r.name as reg_name,
--   r.email as reg_email,
--   r.phone as reg_phone,
--   c.title as competition_title
-- FROM users u
-- LEFT JOIN registrations r ON r.user_id = u.id
-- LEFT JOIN competitions c ON r.competition_id = c.id
-- WHERE u.id = 'YOUR_USER_ID_HERE'
-- ORDER BY r.created_at DESC;

-- ============================================================================
-- 롤백 방법 (필요시)
-- ============================================================================
-- 트리거를 제거하고 싶을 때:
-- DROP TRIGGER IF EXISTS trigger_sync_user_to_registrations ON users;
-- DROP FUNCTION IF EXISTS sync_user_to_registrations();

-- ============================================================================
-- 사용 방법
-- ============================================================================
-- 1. Supabase SQL Editor에서 이 스크립트 전체를 복사하여 실행
-- 2. 1~3단계가 모두 실행되면 설정 완료
-- 3. 이후 마이페이지에서 회원정보를 수정하면 자동으로 registrations도 동기화됨

-- ============================================================================
-- 주의사항
-- ============================================================================
-- 1. 트리거는 users 테이블 UPDATE 시에만 작동 (INSERT/DELETE는 영향 없음)
-- 2. registrations의 user_id가 NULL인 레코드는 동기화되지 않음 (비회원 신청)
-- 3. 참가 관련 정보(shirt_size, depositor_name, notes 등)는 변경되지 않음
-- 4. 일괄 동기화(3단계)는 최초 1회만 실행하면 됨

-- ============================================================================
-- 동작 예시
-- ============================================================================
-- 마이페이지에서 연락처 변경:
--
-- UPDATE users SET phone = '010-3333-4444' WHERE id = 'abc123';
--
-- → 트리거 자동 실행 →
--
-- UPDATE registrations SET phone = '010-3333-4444' WHERE user_id = 'abc123';
-- (해당 회원의 모든 대회 신청 레코드가 자동 업데이트됨)
-- ============================================================================

COMMENT ON FUNCTION sync_user_to_registrations() IS '회원정보 변경 시 참가신청 정보 자동 동기화';
COMMENT ON TRIGGER trigger_sync_user_to_registrations ON users IS '회원정보 수정 시 registrations 테이블 자동 동기화';
