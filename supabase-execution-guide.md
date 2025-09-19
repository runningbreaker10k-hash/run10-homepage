# Supabase DB 수정 실행 가이드

## 🎯 목적
대회별 게시판을 회원게시판과 통합하여 `competition_posts` 테이블 오류 해결

## 📋 실행 순서

### 1. Supabase 대시보드 접속
1. https://supabase.com 접속
2. 프로젝트 선택 (wylklwgubweeemglaczr)
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2. 스크립트 실행

#### 방법 A: 전체 스크립트 한번에 실행 (권장)
1. **New query** 버튼 클릭
2. `fix-competition-board.sql` 파일의 내용을 전체 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭 (Ctrl + Enter)

#### 방법 B: 단계별 실행 (안전한 방법)
다음 순서대로 각각 실행:

**1단계: 백업 생성**
```sql
CREATE TABLE IF NOT EXISTS competition_posts_backup AS
SELECT * FROM competition_posts;
```

**2단계: 컬럼 추가**
```sql
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE;
```

**3단계: 데이터 마이그레이션**
```sql
INSERT INTO community_posts (
  title, content, image_url, views, is_notice, competition_id, user_id, created_at, updated_at
)
SELECT
  title, content, image_url, views, false as is_notice, competition_id, user_id, created_at, updated_at
FROM competition_posts
ON CONFLICT DO NOTHING;
```

**4단계: 기존 객체 제거**
```sql
DROP VIEW IF EXISTS competition_posts_with_author CASCADE;
DROP TRIGGER IF EXISTS update_competition_posts_updated_at ON competition_posts;
DROP TABLE IF EXISTS competition_posts CASCADE;
```

**5단계: 뷰 재생성**
```sql
DROP VIEW IF EXISTS community_posts_with_author CASCADE;

CREATE VIEW community_posts_with_author AS
SELECT
    cp.id, cp.title, cp.content, cp.image_url, cp.views, cp.is_notice, cp.competition_id,
    cp.user_id, cp.created_at, cp.updated_at, u.name as author_name, u.grade as author_grade,
    CASE
        WHEN u.grade = 'cheetah' THEN '/images/grades/cheetah.png'
        WHEN u.grade = 'horse' THEN '/images/grades/horse.png'
        WHEN u.grade = 'wolf' THEN '/images/grades/wolf.png'
        WHEN u.grade = 'turtle' THEN '/images/grades/turtle.png'
        WHEN u.grade = 'bolt' THEN '/images/grades/bolt.png'
        ELSE '/images/grades/turtle.png'
    END as author_grade_icon,
    u.id as author_id,
    COALESCE(
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id AND pc.post_type = 'community'), 0
    ) as comment_count
FROM community_posts cp
LEFT JOIN users u ON cp.user_id = u.id;
```

**6단계: 인덱스 및 함수 생성**
```sql
CREATE INDEX IF NOT EXISTS idx_community_posts_competition_id ON community_posts(competition_id);

CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts SET views = views + 1 WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;
```

### 3. 실행 확인

#### 성공 확인 방법:
```sql
-- 1. community_posts 테이블에 competition_id 컬럼이 있는지 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'community_posts' AND column_name = 'competition_id';

-- 2. 뷰가 제대로 생성되었는지 확인
SELECT * FROM community_posts_with_author LIMIT 1;

-- 3. competition_posts 테이블이 제거되었는지 확인 (오류가 나와야 정상)
SELECT * FROM competition_posts LIMIT 1;
```

#### 오류 발생 시:
- 각 단계별로 오류 메시지 확인
- `competition_posts` 테이블이 없다면 3단계는 건너뛰기
- 오류 메시지를 복사해서 문제 해결

### 4. 애플리케이션 테스트
1. 개발 서버 재시작: `npm run dev`
2. 대회 상세페이지 → 게시판 탭 접속
3. 오류 없이 로딩되는지 확인

## ⚠️ 주의사항
- **백업**: 중요한 데이터가 있다면 먼저 백업 권장
- **트랜잭션**: 문제 발생 시 `ROLLBACK` 가능
- **권한**: Supabase 프로젝트 소유자 권한 필요

## 🔄 롤백 방법 (문제 발생 시)
```sql
-- 백업에서 복원
DROP TABLE IF EXISTS competition_posts;
CREATE TABLE competition_posts AS SELECT * FROM competition_posts_backup;

-- community_posts에서 competition_id 컬럼 제거
ALTER TABLE community_posts DROP COLUMN IF EXISTS competition_id;
```

## ✅ 완료 후 결과
- ✅ `competition_posts` 테이블 제거
- ✅ `community_posts`에 `competition_id` 필드 추가
- ✅ `community_posts_with_author` 뷰 업데이트
- ✅ 대회별 게시판 오류 해결
- ✅ 회원게시판과 대회게시판 통합 완료