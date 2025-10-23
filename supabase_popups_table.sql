-- 팝업 관리 테이블 생성
CREATE TABLE IF NOT EXISTS public.popups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content_image_url TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    display_page TEXT NOT NULL CHECK (display_page IN ('all', 'home', 'competition')),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_popups_active ON public.popups(is_active);
CREATE INDEX IF NOT EXISTS idx_popups_dates ON public.popups(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_popups_display_page ON public.popups(display_page);
CREATE INDEX IF NOT EXISTS idx_popups_competition_id ON public.popups(competition_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화된 팝업 조회 가능
CREATE POLICY "Anyone can view active popups"
ON public.popups
FOR SELECT
USING (is_active = true);

-- 관리자만 팝업 생성 가능
CREATE POLICY "Admins can insert popups"
ON public.popups
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 관리자만 팝업 수정 가능
CREATE POLICY "Admins can update popups"
ON public.popups
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 관리자만 팝업 삭제 가능
CREATE POLICY "Admins can delete popups"
ON public.popups
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_popups_updated_at
BEFORE UPDATE ON public.popups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE public.popups IS '사이트 팝업 관리 테이블';
COMMENT ON COLUMN public.popups.title IS '팝업 제목';
COMMENT ON COLUMN public.popups.content_image_url IS '팝업 내용 이미지 URL';
COMMENT ON COLUMN public.popups.start_date IS '팝업 시작 일시';
COMMENT ON COLUMN public.popups.end_date IS '팝업 종료 일시';
COMMENT ON COLUMN public.popups.display_page IS '표시할 페이지 (all: 모든 페이지, home: 메인 페이지, competition: 대회 상세 페이지)';
COMMENT ON COLUMN public.popups.competition_id IS '대회 ID (display_page가 competition일 때만 사용)';
COMMENT ON COLUMN public.popups.is_active IS '활성화 여부';
