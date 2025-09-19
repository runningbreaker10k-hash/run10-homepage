-- 런텐(RUN10) 최적화된 데이터베이스 스키마
-- 기존 데이터 모두 삭제 후 새로 구성

-- 기존 테이블 삭제 (역순)
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS competition_posts CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS participation_groups CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 저장소 버킷 삭제 (만약 있다면)
-- DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON storage.objects;

-- =============================================================================
-- 1. 회원 테이블 (users)
-- =============================================================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(15) UNIQUE NOT NULL, -- 로그인 ID
  password VARCHAR(255) NOT NULL, -- 해시된 비밀번호
  name VARCHAR(100) NOT NULL, -- 실명
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date VARCHAR(8) NOT NULL, -- YYYYMMDD 형식
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  address1 TEXT NOT NULL, -- 기본주소
  address2 TEXT, -- 상세주소
  postcode VARCHAR(10) NOT NULL, -- 우편번호
  grade VARCHAR(20) DEFAULT 'turtle' CHECK (grade IN ('cheetah', 'horse', 'wolf', 'turtle', 'bolt')),
  record_time INTEGER NOT NULL DEFAULT 999, -- 기록 시간 (분 단위)
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. 대회 테이블 (competitions)
-- =============================================================================
CREATE TABLE competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time VARCHAR(10), -- 시작 시간 (HH:MM)
  location VARCHAR(255) NOT NULL,
  organizer VARCHAR(255),
  entry_fee INTEGER DEFAULT 0, -- 기본 참가비
  max_participants INTEGER DEFAULT 0, -- 전체 정원
  current_participants INTEGER DEFAULT 0, -- 현재 참가자 수
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'completed')),
  course_image_url TEXT, -- 코스 이미지
  course_content TEXT, -- 코스 설명
  prizes_image_url TEXT, -- 시상품 이미지
  prizes_content TEXT, -- 시상 내용
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. 참가 그룹 테이블 (participation_groups) - 대회별 종목
-- =============================================================================
CREATE TABLE participation_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 그룹명 (예: "일반부", "학생부")
  distance VARCHAR(20) NOT NULL, -- 거리 (3km, 5km, 10km, half, full)
  entry_fee INTEGER NOT NULL, -- 그룹별 참가비
  max_participants INTEGER DEFAULT 0, -- 그룹별 정원
  current_participants INTEGER DEFAULT 0, -- 현재 참가자 수
  description TEXT, -- 그룹 설명
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. 참가 신청 테이블 (registrations)
-- =============================================================================
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 회원 ID (회원 신청시)
  participation_group_id UUID REFERENCES participation_groups(id) ON DELETE SET NULL,

  -- 신청자 기본 정보
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date VARCHAR(8) NOT NULL, -- YYYYMMDD 형식
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL,
  address TEXT NOT NULL,

  -- 신청 관련 정보
  shirt_size VARCHAR(5) NOT NULL CHECK (shirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  depositor_name VARCHAR(100) NOT NULL, -- 입금자명
  password VARCHAR(255) NOT NULL, -- 신청 조회용 비밀번호

  -- 대회 관련 정보
  distance VARCHAR(20), -- 참가 거리
  entry_fee INTEGER, -- 실제 납부한 참가비

  -- 상태 관리
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'cancelled')),
  is_member_registration BOOLEAN DEFAULT false, -- 회원 신청 여부

  -- 기타
  notes TEXT, -- 특이사항
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. 커뮤니티 게시판 테이블 (community_posts)
-- =============================================================================
CREATE TABLE community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT, -- 첨부 이미지
  views INTEGER DEFAULT 0, -- 조회수
  is_notice BOOLEAN DEFAULT false, -- 공지글 여부
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 작성자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. 대회별 게시판 테이블 (competition_posts)
-- =============================================================================
CREATE TABLE competition_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT, -- 첨부 이미지
  views INTEGER DEFAULT 0, -- 조회수
  password VARCHAR(255), -- 게시글 비밀번호 (비회원용)
  author_name VARCHAR(100), -- 작성자명 (비회원용)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 회원 작성자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 7. 댓글 테이블 (post_comments)
-- =============================================================================
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL, -- community_posts 또는 competition_posts ID
  post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('community', 'competition')), -- 게시글 타입
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 댓글 작성자
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 인덱스 생성 (성능 최적화)
-- =============================================================================

-- 회원 테이블 인덱스
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_grade ON users(grade);

-- 대회 테이블 인덱스
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_date ON competitions(date);

-- 참가 그룹 인덱스
CREATE INDEX idx_participation_groups_competition_id ON participation_groups(competition_id);

-- 신청 테이블 인덱스
CREATE INDEX idx_registrations_competition_id ON registrations(competition_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_participation_group_id ON registrations(participation_group_id);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);

-- 게시판 인덱스
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_is_notice ON community_posts(is_notice);
CREATE INDEX idx_competition_posts_competition_id ON competition_posts(competition_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

-- =============================================================================
-- RLS (Row Level Security) 정책 설정
-- =============================================================================

-- 회원 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- 커뮤니티 게시판 RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read community posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create community posts" ON community_posts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own posts" ON community_posts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own posts" ON community_posts FOR DELETE USING (auth.uid()::text = user_id::text);

-- 기타 테이블들은 필요에 따라 RLS 설정
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published competitions" ON competitions FOR SELECT USING (status = 'published');

ALTER TABLE participation_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read participation groups" ON participation_groups FOR SELECT USING (true);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert registrations" ON registrations FOR INSERT WITH CHECK (true);

ALTER TABLE competition_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read competition posts" ON competition_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create competition posts" ON competition_posts FOR INSERT WITH CHECK (true);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- =============================================================================
-- 트리거 함수 (자동 업데이트)
-- =============================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competition_posts_updated_at BEFORE UPDATE ON competition_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 뷰 생성 (편의를 위한 조인 뷰)
-- =============================================================================

-- 커뮤니티 게시글과 작성자 정보 조인 뷰
CREATE OR REPLACE VIEW community_posts_with_author AS
SELECT
    cp.*,
    u.name as author_name,
    u.grade as author_grade
FROM community_posts cp
LEFT JOIN users u ON cp.user_id = u.id;

-- 대회 게시글과 작성자 정보 조인 뷰
CREATE OR REPLACE VIEW competition_posts_with_author AS
SELECT
    cpp.*,
    u.name as author_name,
    u.grade as author_grade
FROM competition_posts cpp
LEFT JOIN users u ON cpp.user_id = u.id;

-- 댓글과 작성자 정보 조인 뷰
CREATE OR REPLACE VIEW post_comments_with_author AS
SELECT
    pc.*,
    u.name as author_name,
    u.grade as author_grade
FROM post_comments pc
LEFT JOIN users u ON pc.user_id = u.id;