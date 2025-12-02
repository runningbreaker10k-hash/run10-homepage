-- 팝업 테이블에 link_url 컬럼 추가
ALTER TABLE public.popups
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.popups.link_url IS '팝업 클릭 시 이동할 URL (선택 사항)';
