# 📋 데이터베이스 마이그레이션 실행 가이드

## 🎯 현재 상황
- ✅ **회원게시판**: 정상 작동
- ✅ **대회별 게시판 코드**: 이미 올바르게 구현됨
- ❌ **데이터베이스**: 통합 스키마로 업데이트 필요

## 🚀 실행 단계

### 1. Supabase 대시보드 접속
1. https://supabase.com 로그인
2. 프로젝트 선택
3. 좌측 메뉴 **SQL Editor** 클릭

### 2. 데이터베이스 리셋 및 재구축
1. **New query** 버튼 클릭
2. `clean-database-schema.sql` 파일 내용 복사 후 붙여넣기
3. **Run** 버튼 클릭 (또는 Ctrl + Enter)

### 3. 샘플 데이터 추가
1. **New query** 버튼 클릭
2. `sample-data.sql` 파일 내용 복사 후 붙여넣기
3. **Run** 버튼 클릭

## ✅ 완료 후 결과

### 통합 게시판 시스템
- **회원게시판**: `community_posts` 테이블에서 `competition_id = NULL`
- **대회별게시판**: `community_posts` 테이블에서 `competition_id = 특정대회ID`
- **동일한 CRUD 기능**: 글쓰기, 수정, 삭제, 댓글 모두 같은 방식

### 즉시 사용 가능
- 회원게시판: 기존과 동일하게 작동
- 대회별게시판: 각 대회 상세페이지 → 게시판 탭에서 정상 작동
- 모든 기능 (등록/수정/삭제/댓글) 즉시 사용 가능

## 🔧 기술적 변경사항
1. `competition_posts` 테이블 제거
2. `community_posts` 테이블에 `competition_id` 필드 추가
3. `community_posts_with_author` 뷰 업데이트
4. 기존 코드는 수정 없이 그대로 작동

## 📞 문제 발생 시
SQL 실행 중 오류가 발생하면 오류 메시지를 알려주세요.