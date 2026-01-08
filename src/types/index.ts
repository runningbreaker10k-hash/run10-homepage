import { Database } from '@/lib/supabase'

export type Competition = Database['public']['Tables']['competitions']['Row']
export type CompetitionInsert = Database['public']['Tables']['competitions']['Insert']
export type CompetitionUpdate = Database['public']['Tables']['competitions']['Update']

export type Registration = Database['public']['Tables']['registrations']['Row']
export type RegistrationInsert = Database['public']['Tables']['registrations']['Insert']
export type RegistrationUpdate = Database['public']['Tables']['registrations']['Update']

// CompetitionPost는 이제 CommunityPost와 통합됨 (competition_id로 구분)
export type CommunityPost = Database['public']['Tables']['community_posts']['Row']
export type CommunityPostInsert = Database['public']['Tables']['community_posts']['Insert']
export type CommunityPostUpdate = Database['public']['Tables']['community_posts']['Update']

// 편의를 위한 별칭 (기존 코드 호환성)
export type CompetitionPost = CommunityPost

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Popup = Database['public']['Tables']['popups']['Row']
export type PopupInsert = Database['public']['Tables']['popups']['Insert']
export type PopupUpdate = Database['public']['Tables']['popups']['Update']

// Extended types with joined table data (for Supabase joins)

// Registration with joined tables
export interface RegistrationWithCompetition extends Registration {
  competitions?: {
    title: string
    date: string
  }
  users?: {
    grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
  }
  participation_groups?: {
    name: string
    distance: string
    entry_fee: number
  }
}

// CommunityPost with joined tables
export interface CommunityPostWithRelations extends CommunityPost {
  users?: {
    id: string
    user_id: string
    name: string
    email: string
    grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
    role: 'admin' | 'user'
  }
  competitions?: {
    title: string
  }
}