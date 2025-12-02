-- 댓글 테이블에 report_count 컬럼 추가
ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.post_comments.report_count IS '댓글 신고 횟수';

-- 기존 댓글의 report_count를 0으로 설정 (NULL 방지)
UPDATE public.post_comments
SET report_count = 0
WHERE report_count IS NULL;
