-- =============================================================================
-- 생년월일로부터 자동으로 나이를 계산하는 시스템
-- =============================================================================
--
-- 현재 문제점:
-- 1. registrations 테이블의 age 필드는 신청 시점의 나이가 고정 값으로 저장됨
-- 2. 시간이 지나도 나이가 자동으로 업데이트되지 않음
-- 3. 예: 2024년에 25세로 신청 → 2025년에도 여전히 25세로 표시
--
-- 해결 방법 3가지:
-- 옵션 1: PostgreSQL Function으로 실시간 계산 (추천)
-- 옵션 2: Trigger로 주기적 업데이트
-- 옵션 3: Generated Column (PostgreSQL 12+)
-- =============================================================================

-- =============================================================================
-- 옵션 1: PostgreSQL Function으로 실시간 나이 계산 (추천)
-- =============================================================================
-- 이 방법은 age 필드를 유지하면서, 조회 시에만 실시간 계산된 나이를 반환합니다.
-- 기존 코드 변경 최소화, 성능 우수

-- 1-1. 생년월일로부터 나이를 계산하는 함수 생성
CREATE OR REPLACE FUNCTION calculate_age_from_birth_date(birth_date_str VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  birth_year INTEGER;
  birth_month INTEGER;
  birth_day INTEGER;
  current_year INTEGER;
  current_month INTEGER;
  current_day INTEGER;
  full_year INTEGER;
  age INTEGER;
BEGIN
  -- birth_date_str이 NULL이거나 길이가 6 또는 8이 아니면 0 반환
  IF birth_date_str IS NULL OR (LENGTH(birth_date_str) != 6 AND LENGTH(birth_date_str) != 8) THEN
    RETURN 0;
  END IF;

  -- 현재 날짜 정보
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_day := EXTRACT(DAY FROM CURRENT_DATE);

  -- YYMMDD 형식 (6자리)
  IF LENGTH(birth_date_str) = 6 THEN
    birth_year := SUBSTRING(birth_date_str FROM 1 FOR 2)::INTEGER;
    birth_month := SUBSTRING(birth_date_str FROM 3 FOR 2)::INTEGER;
    birth_day := SUBSTRING(birth_date_str FROM 5 FOR 2)::INTEGER;

    -- 2000년대/1900년대 구분
    IF birth_year <= (current_year % 100) THEN
      full_year := 2000 + birth_year;
    ELSE
      full_year := 1900 + birth_year;
    END IF;

  -- YYYYMMDD 형식 (8자리)
  ELSIF LENGTH(birth_date_str) = 8 THEN
    full_year := SUBSTRING(birth_date_str FROM 1 FOR 4)::INTEGER;
    birth_month := SUBSTRING(birth_date_str FROM 5 FOR 2)::INTEGER;
    birth_day := SUBSTRING(birth_date_str FROM 7 FOR 2)::INTEGER;
  ELSE
    RETURN 0;
  END IF;

  -- 만 나이 계산
  age := current_year - full_year;

  -- 생일이 지나지 않았으면 -1
  IF current_month < birth_month OR (current_month = birth_month AND current_day < birth_day) THEN
    age := age - 1;
  END IF;

  RETURN age;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1-2. View 생성: registrations 테이블에 실시간 계산된 나이 포함
DROP VIEW IF EXISTS registrations_with_age CASCADE;

CREATE VIEW registrations_with_age AS
SELECT
  r.*,
  calculate_age_from_birth_date(r.birth_date) AS calculated_age
FROM registrations r;

-- 사용 예시:
-- SELECT * FROM registrations_with_age WHERE calculated_age >= 20 AND calculated_age < 30;
-- SELECT name, birth_date, calculated_age FROM registrations_with_age;

-- =============================================================================
-- 옵션 2: Trigger로 기존 age 필드를 자동 업데이트
-- =============================================================================
-- 이 방법은 INSERT/UPDATE 시 age 필드를 자동으로 계산해서 저장합니다.
-- 단, 한번 저장된 후에는 시간이 지나도 자동으로 변하지 않습니다.

-- 2-1. registrations 테이블 INSERT/UPDATE 시 age 자동 계산
CREATE OR REPLACE FUNCTION auto_update_age_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age := calculate_age_from_birth_date(NEW.birth_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2-2. Trigger 생성
DROP TRIGGER IF EXISTS trigger_auto_update_age ON registrations;

CREATE TRIGGER trigger_auto_update_age
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_age_on_registration();

-- =============================================================================
-- 옵션 3: 기존 데이터의 age를 재계산하여 업데이트
-- =============================================================================
-- 이미 저장된 registrations 데이터의 age를 현재 시점 기준으로 재계산합니다.
-- 주의: 이 작업은 한 번만 실행하거나 주기적으로 실행해야 합니다.

-- 3-1. 모든 registrations 데이터의 age를 재계산
UPDATE registrations
SET age = calculate_age_from_birth_date(birth_date);

-- 3-2. 특정 대회의 참가자만 재계산
-- UPDATE registrations
-- SET age = calculate_age_from_birth_date(birth_date)
-- WHERE competition_id = 'YOUR_COMPETITION_ID';

-- =============================================================================
-- 테스트 쿼리
-- =============================================================================

-- 함수 테스트
SELECT
  '990101' AS birth_date,
  calculate_age_from_birth_date('990101') AS age,
  'Expected: 만 26세 (2025년 기준)' AS note
UNION ALL
SELECT
  '20000315',
  calculate_age_from_birth_date('20000315'),
  'Expected: 만 24세 또는 25세 (생일 전/후)'
UNION ALL
SELECT
  '851225',
  calculate_age_from_birth_date('851225'),
  'Expected: 만 39세 또는 40세';

-- View 테스트
SELECT
  name,
  birth_date,
  age AS stored_age,
  calculated_age AS real_age,
  calculated_age - age AS age_diff
FROM registrations_with_age
LIMIT 10;

-- =============================================================================
-- 롤백 방법 (원래대로 되돌리기)
-- =============================================================================

-- View 삭제
-- DROP VIEW IF EXISTS registrations_with_age CASCADE;

-- Trigger 삭제
-- DROP TRIGGER IF EXISTS trigger_auto_update_age ON registrations;

-- Function 삭제
-- DROP FUNCTION IF EXISTS auto_update_age_on_registration();
-- DROP FUNCTION IF EXISTS calculate_age_from_birth_date(VARCHAR);

-- =============================================================================
-- 추천 적용 방법
-- =============================================================================
--
-- 1단계: Function 생성 (필수)
--   - calculate_age_from_birth_date 함수 실행
--
-- 2단계: Trigger 적용 (선택 - 새로운 신청부터 자동 계산)
--   - auto_update_age_on_registration 함수 + Trigger 실행
--
-- 3단계: 기존 데이터 업데이트 (선택)
--   - UPDATE registrations SET age = calculate_age_from_birth_date(birth_date);
--
-- 4단계: 클라이언트 코드 수정 (선택)
--   - 클라이언트에서 나이를 표시할 때 calculate_age_from_birth_date() 사용
--   - 또는 registrations_with_age View 사용
--
-- =============================================================================
