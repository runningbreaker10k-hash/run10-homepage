-- 핸드폰 인증번호 임시 저장 테이블
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires
ON phone_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone
ON phone_verifications(phone);

-- users 테이블에 핸드폰 인증 여부 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- SMS 설정 관리 테이블 (관리자용)
CREATE TABLE IF NOT EXISTS sms_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name VARCHAR(50) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 기본 설정 추가
INSERT INTO sms_settings (feature_name, enabled)
VALUES
  ('phone_verification', true),
  ('signup_complete', true),
  ('competition_registration', true),
  ('payment_confirm', true)
ON CONFLICT (feature_name) DO NOTHING;
