-- =====================================================================
-- 대회별 게시판을 회원게시판과 통합하는 DB 수정 스크립트
-- =====================================================================
-- 목적: competition_posts 테이블을 제거하고 community_posts에 competition_id 필드를 추가하여
--       회원게시판과 대회별 게시판을 하나의 테이블로 통합
-- =====================================================================

-- 1단계: 기존 competition_posts 데이터 백업 (있다면)
CREATE TABLE IF NOT EXISTS competition_posts_backup AS
SELECT * FROM competition_posts;

-- 2단계: community_posts 테이블에 competition_id 컬럼 추가
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE;

-- 3단계: 기존 competition_posts 데이터를 community_posts로 마이그레이션 (있다면)
INSERT INTO community_posts (
  title,
  content,
  image_url,
  views,
  is_notice,
  competition_id,
  user_id,
  created_at,
  updated_at
)
SELECT
  title,
  content,
  image_url,
  views,
  false as is_notice,  -- 대회 게시글은 공지가 아님
  competition_id,
  user_id,
  created_at,
  updated_at
FROM competition_posts
ON CONFLICT DO NOTHING;

-- 4단계: competition_posts 관련 객체 제거
DROP VIEW IF EXISTS competition_posts_with_author CASCADE;
DROP TRIGGER IF EXISTS update_competition_posts_updated_at ON competition_posts;
DROP TABLE IF EXISTS competition_posts CASCADE;

-- 5단계: community_posts_with_author 뷰를 competition_id 포함하도록 재생성
DROP VIEW IF EXISTS community_posts_with_author CASCADE;

CREATE VIEW community_posts_with_author AS
SELECT
    cp.id,
    cp.title,
    cp.content,
    cp.image_url,
    cp.views,
    cp.is_notice,
    cp.competition_id,  -- 추가된 필드
    cp.user_id,
    cp.created_at,
    cp.updated_at,
    u.name as author_name,
    u.grade as author_grade,
    CASE
        WHEN u.grade = 'cheetah' THEN '/images/grades/cheetah.png'
        WHEN u.grade = 'horse' THEN '/images/grades/horse.png'
        WHEN u.grade = 'wolf' THEN '/images/grades/wolf.png'
        WHEN u.grade = 'turtle' THEN '/images/grades/turtle.png'
        WHEN u.grade = 'bolt' THEN '/images/grades/bolt.png'
        ELSE '/images/grades/turtle.png'
    END as author_grade_icon,
    u.id as author_id,
    -- 댓글 수 계산 (community 타입만)
    COALESCE(
        (SELECT COUNT(*)
         FROM post_comments pc
         WHERE pc.post_id = cp.id
         AND pc.post_type = 'community'), 0
    ) as comment_count
FROM community_posts cp
LEFT JOIN users u ON cp.user_id = u.id;

-- 6단계: 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_community_posts_competition_id ON community_posts(competition_id);

-- 7단계: 함수 생성 - 게시글 조회수 증가
CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts
    SET views = views + 1
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8단계: 백업 테이블 제거 (선택사항 - 안전을 위해 유지 권장)
-- DROP TABLE IF EXISTS competition_posts_backup;

-- =====================================================================
-- 완료!
-- =====================================================================
-- 사용법:
-- - 전체 회원게시판: WHERE competition_id IS NULL
-- - 특정 대회 게시판: WHERE competition_id = '대회ID'
-- =====================================================================