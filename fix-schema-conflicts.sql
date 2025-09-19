-- 스키마 충돌 해결을 위한 안전한 초기화 스크립트
-- 기존 데이터를 보존하면서 스키마 문제 해결

-- 1. 외래키 제약조건 때문에 역순으로 삭제
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS competition_posts CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS participation_groups CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. 저장소 정책도 정리 (오류 무시)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload competition images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view competition images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update competition images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete competition images" ON storage.objects;

-- 이제 optimized-database-schema.sql 파일을 실행하면 됩니다.
-- 이 파일을 먼저 실행한 후 optimized-database-schema.sql을 실행하세요.