import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wylklwgubweeemglaczr.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// RLS를 우회하는 서버 전용 클라이언트 (API Route에서만 사용)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
