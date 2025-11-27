-- 대회 사진 갤러리 테이블
CREATE TABLE IF NOT EXISTS competition_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_competition_photos_competition_id ON competition_photos(competition_id);
CREATE INDEX idx_competition_photos_order ON competition_photos(competition_id, display_order);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE competition_photos ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view competition photos"
  ON competition_photos
  FOR SELECT
  USING (true);

-- 정책 2: 인증된 사용자라면 누구나 삽입 가능 (클라이언트에서 관리자 체크)
-- 참고: 이 프로젝트는 Supabase Auth를 사용하지 않으므로 클라이언트 레벨에서 권한 제어
CREATE POLICY "Anyone can insert competition photos"
  ON competition_photos
  FOR INSERT
  WITH CHECK (true);

-- 정책 3: 누구나 수정 가능 (클라이언트에서 관리자 체크)
CREATE POLICY "Anyone can update competition photos"
  ON competition_photos
  FOR UPDATE
  USING (true);

-- 정책 4: 누구나 삭제 가능 (클라이언트에서 관리자 체크)
CREATE POLICY "Anyone can delete competition photos"
  ON competition_photos
  FOR DELETE
  USING (true);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_competition_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_competition_photos_timestamp
  BEFORE UPDATE ON competition_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_photos_updated_at();
