-- 기존 트리거 및 함수 삭제
DROP TRIGGER IF EXISTS update_competition_participants_trigger ON registrations;
DROP TRIGGER IF EXISTS update_participation_group_participants_trigger ON registrations;
DROP FUNCTION IF EXISTS update_competition_participants() CASCADE;
DROP FUNCTION IF EXISTS update_participation_group_participants() CASCADE;

-- 대회 참가자 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_competition_participants()
RETURNS TRIGGER AS $$
DECLARE
  comp_id UUID;
  actual_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    comp_id := OLD.competition_id;
  ELSE
    comp_id := NEW.competition_id;
  END IF;

  SELECT COUNT(*) INTO actual_count
  FROM registrations
  WHERE competition_id = comp_id;

  UPDATE competitions
  SET current_participants = actual_count
  WHERE id = comp_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 참가 그룹 참가자 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_participation_group_participants()
RETURNS TRIGGER AS $$
DECLARE
  grp_id UUID;
  actual_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    grp_id := OLD.participation_group_id;
  ELSE
    grp_id := NEW.participation_group_id;
  END IF;

  IF grp_id IS NOT NULL THEN
    SELECT COUNT(*) INTO actual_count
    FROM registrations
    WHERE participation_group_id = grp_id;

    UPDATE participation_groups
    SET current_participants = actual_count
    WHERE id = grp_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_competition_participants_trigger
AFTER INSERT OR DELETE ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_competition_participants();

CREATE TRIGGER update_participation_group_participants_trigger
AFTER INSERT OR DELETE ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_participation_group_participants();

-- 기존 데이터 동기화
UPDATE competitions c
SET current_participants = (
  SELECT COUNT(*)
  FROM registrations r
  WHERE r.competition_id = c.id
);

UPDATE participation_groups pg
SET current_participants = (
  SELECT COUNT(*)
  FROM registrations r
  WHERE r.participation_group_id = pg.id
);
