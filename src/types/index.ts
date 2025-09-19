import { Database } from '@/lib/supabase'

export type Competition = Database['public']['Tables']['competitions']['Row']
export type CompetitionInsert = Database['public']['Tables']['competitions']['Insert']
export type CompetitionUpdate = Database['public']['Tables']['competitions']['Update']

export type Registration = Database['public']['Tables']['registrations']['Row']
export type RegistrationInsert = Database['public']['Tables']['registrations']['Insert']
export type RegistrationUpdate = Database['public']['Tables']['registrations']['Update']

export type CompetitionPost = Database['public']['Tables']['competition_posts']['Row']
export type CompetitionPostInsert = Database['public']['Tables']['competition_posts']['Insert']
export type CompetitionPostUpdate = Database['public']['Tables']['competition_posts']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']