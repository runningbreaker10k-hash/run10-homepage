-- 기존 회원들의 기록 시간에 따라 등급 업데이트
UPDATE users
SET grade = CASE
  WHEN record_time / 60.0 >= 30 AND record_time / 60.0 < 40 THEN 'cheetah'
  WHEN record_time / 60.0 >= 40 AND record_time / 60.0 < 50 THEN 'horse'
  WHEN record_time / 60.0 >= 50 AND record_time / 60.0 < 60 THEN 'wolf'
  ELSE 'turtle'
END
WHERE role != 'admin';

-- 관리자는 볼타족으로 설정 (관리자가 아닌 경우에만)
UPDATE users
SET grade = 'bolt'
WHERE role = 'admin' AND grade != 'bolt';