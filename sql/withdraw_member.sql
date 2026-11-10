BEGIN;

ALTER TABLE receipt_requests
  ALTER COLUMN user_id DROP NOT NULL,
  DROP CONSTRAINT receipt_requests_user_id_fkey,
  ADD CONSTRAINT receipt_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE registration_change_requests
  ALTER COLUMN user_id DROP NOT NULL,
  DROP CONSTRAINT registration_change_requests_user_id_fkey,
  ADD CONSTRAINT registration_change_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- refund_requests는 users 외래키가 없어 withdraw_member에서 user_id를 직접 비운다
ALTER TABLE refund_requests
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN registration_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION get_withdraw_blockers(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT '예정된 대회: ' || c.title || ' (' || to_char(x.event_date, 'MM/DD') || ')'
    FROM registrations r
    JOIN competitions c ON c.id = r.competition_id
    CROSS JOIN LATERAL (
      SELECT CASE
        -- 시간대가 붙은 값은 KST로 변환, datetime-local 값은 이미 KST
        WHEN c.date::text ~ '\d{2}:\d{2}.*(Z|[+-]\d{2}(:?\d{2})?)$'
          THEN (c.date::text::timestamptz AT TIME ZONE 'Asia/Seoul')::date
        ELSE left(c.date::text, 10)::date
      END AS event_date
    ) x
    WHERE r.user_id = p_user_id
      AND r.payment_status = 'confirmed'
      AND x.event_date >= (now() AT TIME ZONE 'Asia/Seoul')::date
      AND NOT EXISTS (
        SELECT 1 FROM refund_requests rf
        WHERE rf.registration_id = r.id AND rf.status = 'completed'
      )

    UNION ALL

    SELECT '환불 ' || CASE WHEN q.status = 'processing' THEN '처리중' ELSE '처리대기' END
      || ': ' || COALESCE(c.title, '알 수 없는 대회')
    FROM refund_requests q
    LEFT JOIN competitions c ON c.id = q.competition_id
    WHERE q.user_id = p_user_id AND q.status IS DISTINCT FROM 'completed'

    UNION ALL

    SELECT '현금영수증 ' || CASE WHEN q.status = 'processing' THEN '처리중' ELSE '처리대기' END
      || ': ' || COALESCE(c.title, '알 수 없는 대회')
    FROM receipt_requests q
    LEFT JOIN competitions c ON c.id = q.competition_id
    WHERE q.user_id = p_user_id AND q.status IS DISTINCT FROM 'completed'

    UNION ALL

    SELECT '종목변경 처리대기: ' || COALESCE(c.title, '알 수 없는 대회')
    FROM registration_change_requests q
    LEFT JOIN competitions c ON c.id = q.competition_id
    WHERE q.user_id = p_user_id AND q.status NOT IN ('approved', 'rejected')
  );
$$;

-- 탈퇴 불가 사유가 있으면 아무것도 변경하지 않고 사유를 반환, 빈 배열이면 탈퇴 완료
CREATE OR REPLACE FUNCTION withdraw_member(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blockers TEXT[];
BEGIN
  PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'member not found: %', p_user_id;
  END IF;

  v_blockers := get_withdraw_blockers(p_user_id);
  IF cardinality(v_blockers) > 0 THEN
    RETURN v_blockers;
  END IF;

  UPDATE refund_requests SET user_id = NULL WHERE user_id = p_user_id;
  DELETE FROM registrations WHERE user_id = p_user_id AND payment_status = 'pending';
  DELETE FROM users WHERE id = p_user_id;

  RETURN ARRAY[]::TEXT[];
END;
$$;

GRANT EXECUTE ON FUNCTION get_withdraw_blockers(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION withdraw_member(UUID) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
