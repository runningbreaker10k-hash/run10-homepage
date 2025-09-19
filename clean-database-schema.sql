-- 런텐(RUN10) 통합 게시판 시스템 데이터베이스 스키마
-- 회원게시판 + 대회별게시판 통합 구조

-- =============================================================================
-- 기존 데이터 완전 삭제
-- =============================================================================

-- 뷰 삭제
DROP VIEW IF EXISTS community_posts_with_author CASCADE;
DROP VIEW IF EXISTS competition_posts_with_author CASCADE;
DROP VIEW IF EXISTS post_comments_with_author CASCADE;

-- 테이블 삭제 (외래키 순서대로)
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS competition_posts CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS participation_groups CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 트리거 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_post_views(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_competition_participants() CASCADE;

-- 저장소 정책 삭제
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload competition images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view competition images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update competition images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete competition images" ON storage.objects;

-- =============================================================================
-- 1. 회원 테이블 (users) - 회원가입 폼 기준
-- =============================================================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date VARCHAR(8) NOT NULL, -- YYMMDD 형식
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  address1 TEXT NOT NULL, -- 기본주소
  address2 TEXT, -- 상세주소
  postal_code VARCHAR(10) NOT NULL, -- 우편번호
  phone_marketing_agree BOOLEAN DEFAULT false, -- 연락처 마케팅 동의
  email_marketing_agree BOOLEAN DEFAULT false, -- 이메일 마케팅 동의
  grade VARCHAR(20) DEFAULT 'turtle' CHECK (grade IN ('cheetah', 'horse', 'wolf', 'turtle', 'bolt')),
  record_time INTEGER NOT NULL DEFAULT 999, -- 기록 시간 (초 단위)
  etc TEXT, -- 기타 사항
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. 대회 테이블 (competitions) - 대회 등록 폼 기준
-- =============================================================================
CREATE TABLE competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date VARCHAR(50) NOT NULL, -- datetime-local 형식 지원
  location VARCHAR(255) NOT NULL,
  registration_start VARCHAR(50) NOT NULL, -- 신청 시작일
  registration_end VARCHAR(50) NOT NULL, -- 신청 마감일
  entry_fee INTEGER DEFAULT 0,
  course_description TEXT, -- 코스 설명
  course_image_url TEXT, -- 코스 이미지
  prizes TEXT, -- 시상 내역
  prizes_image_url TEXT, -- 시상품 이미지
  image_url TEXT, -- 대회 대표 이미지
  organizer VARCHAR(255), -- 주최
  supervisor VARCHAR(255), -- 주관
  sponsor VARCHAR(255), -- 후원
  max_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. 참가 그룹 테이블 (participation_groups)
-- =============================================================================
CREATE TABLE participation_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  distance VARCHAR(20) NOT NULL,
  entry_fee INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. 참가 신청 테이블 (registrations)
-- =============================================================================
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  participation_group_id UUID REFERENCES participation_groups(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date VARCHAR(8) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL,
  address TEXT NOT NULL,
  shirt_size VARCHAR(5) NOT NULL CHECK (shirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  depositor_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  distance VARCHAR(20),
  entry_fee INTEGER,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'cancelled')),
  is_member_registration BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. 통합 게시판 테이블 (community_posts)
-- 회원게시판 + 대회별게시판을 하나의 테이블로 통합
-- competition_id가 NULL이면 회원게시판, 값이 있으면 대회별게시판
-- =============================================================================
CREATE TABLE community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 회원만 작성 가능
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,  -- NULL: 회원게시판, 값: 대회별게시판
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  views INTEGER DEFAULT 0,
  is_notice BOOLEAN DEFAULT false,  -- 공지글 기능
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. 댓글 테이블 (post_comments) - 통합 게시판용
-- =============================================================================
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 인덱스 생성
-- =============================================================================
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_grade ON users(grade);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_date ON competitions(date);

CREATE INDEX idx_participation_groups_competition_id ON participation_groups(competition_id);

CREATE INDEX idx_registrations_competition_id ON registrations(competition_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_participation_group_id ON registrations(participation_group_id);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);

CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_competition_id ON community_posts(competition_id);
CREATE INDEX idx_community_posts_is_notice ON community_posts(is_notice);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

-- =============================================================================
-- RLS 정책 설정 (개발용 - 모든 접근 허용)
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON competitions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE participation_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON participation_groups FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON registrations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON community_posts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for all users" ON post_comments FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 트리거 함수 생성
-- =============================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 게시글 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_posts
  SET views = views + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 대회 참가자 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_competition_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'confirmed' THEN
    UPDATE competitions
    SET current_participants = current_participants + 1
    WHERE id = NEW.competition_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.payment_status != 'confirmed' AND NEW.payment_status = 'confirmed' THEN
      UPDATE competitions
      SET current_participants = current_participants + 1
      WHERE id = NEW.competition_id;
    ELSIF OLD.payment_status = 'confirmed' AND NEW.payment_status != 'confirmed' THEN
      UPDATE competitions
      SET current_participants = current_participants - 1
      WHERE id = NEW.competition_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.payment_status = 'confirmed' THEN
    UPDATE competitions
    SET current_participants = current_participants - 1
    WHERE id = OLD.competition_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 트리거 생성
-- =============================================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competition_participants_trigger AFTER INSERT OR UPDATE OR DELETE ON registrations FOR EACH ROW EXECUTE FUNCTION update_competition_participants();

-- =============================================================================
-- 뷰 생성 (조인 편의용)
-- =============================================================================

-- 통합 게시글과 작성자 정보 조인 뷰
CREATE VIEW community_posts_with_author AS
SELECT
    cp.id,
    cp.user_id,
    cp.competition_id,
    cp.title,
    cp.content,
    cp.image_url,
    cp.views,
    cp.is_notice,
    cp.created_at,
    cp.updated_at,
    u.name as author_name,
    u.grade as author_grade,
    CASE
      WHEN u.grade = 'cheetah' THEN '/images/grades/cheetah.png'
      WHEN u.grade = 'horse' THEN '/images/grades/horse.png'
      WHEN u.grade = 'wolf' THEN '/images/grades/wolf.png'
      WHEN u.grade = 'bolt' THEN '/images/grades/bolt.png'
      ELSE '/images/grades/turtle.png'
    END as author_grade_icon,
    (
      SELECT COUNT(*)
      FROM post_comments pc
      WHERE pc.post_id = cp.id
    ) as comment_count
FROM community_posts cp
JOIN users u ON cp.user_id = u.id;

-- 댓글과 작성자 정보 조인 뷰
CREATE VIEW post_comments_with_author AS
SELECT
    pc.id,
    pc.post_id,
    pc.user_id,
    pc.content,
    pc.created_at,
    pc.updated_at,
    u.name as author_name,
    u.grade as author_grade,
    CASE
      WHEN u.grade = 'cheetah' THEN '/images/grades/cheetah.png'
      WHEN u.grade = 'horse' THEN '/images/grades/horse.png'
      WHEN u.grade = 'wolf' THEN '/images/grades/wolf.png'
      WHEN u.grade = 'bolt' THEN '/images/grades/bolt.png'
      ELSE '/images/grades/turtle.png'
    END as author_grade_icon
FROM post_comments pc
JOIN users u ON pc.user_id = u.id;

-- =============================================================================
-- 저장소 정책 설정
-- =============================================================================
CREATE POLICY "Anyone can upload competition images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'competition-images');

CREATE POLICY "Anyone can view competition images" ON storage.objects
FOR SELECT USING (bucket_id = 'competition-images');

CREATE POLICY "Anyone can update competition images" ON storage.objects
FOR UPDATE USING (bucket_id = 'competition-images');

CREATE POLICY "Anyone can delete competition images" ON storage.objects
FOR DELETE USING (bucket_id = 'competition-images');