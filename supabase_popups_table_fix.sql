-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Anyone can view active popups" ON public.popups;
DROP POLICY IF EXISTS "Admins can insert popups" ON public.popups;
DROP POLICY IF EXISTS "Admins can update popups" ON public.popups;
DROP POLICY IF EXISTS "Admins can delete popups" ON public.popups;

-- RLS 비활성화 (이 프로젝트는 Supabase Auth를 사용하지 않으므로)
ALTER TABLE public.popups DISABLE ROW LEVEL SECURITY;

-- 또는 모든 작업 허용 정책 (RLS를 유지하고 싶다면 이것 사용)
/*
-- 모든 사용자가 활성화된 팝업 조회 가능
CREATE POLICY "Anyone can view active popups"
ON public.popups
FOR SELECT
USING (is_active = true);

-- 모든 사용자가 팝업 생성 가능 (관리자 페이지에서 별도로 권한 체크)
CREATE POLICY "Anyone can insert popups"
ON public.popups
FOR INSERT
WITH CHECK (true);

-- 모든 사용자가 팝업 수정 가능 (관리자 페이지에서 별도로 권한 체크)
CREATE POLICY "Anyone can update popups"
ON public.popups
FOR UPDATE
USING (true);

-- 모든 사용자가 팝업 삭제 가능 (관리자 페이지에서 별도로 권한 체크)
CREATE POLICY "Anyone can delete popups"
ON public.popups
FOR DELETE
USING (true);
*/
