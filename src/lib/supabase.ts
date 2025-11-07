import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wylklwgubweeemglaczr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 런타임에서 환경 변수 검증 (빌드 타임에는 체크하지 않음)
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key')

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          user_id: string
          password: string
          name: string
          postal_code: string
          address1: string
          address2: string
          phone: string
          phone_marketing_agree: boolean
          email: string
          email_marketing_agree: boolean
          birth_date: string
          gender_digit?: string
          gender: 'male' | 'female'
          record_time: number
          grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
          role: 'admin' | 'user'
          etc?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          password: string
          name: string
          postal_code: string
          address1: string
          address2: string
          phone: string
          phone_marketing_agree?: boolean
          email: string
          email_marketing_agree?: boolean
          birth_date: string
          gender_digit?: string
          gender: 'male' | 'female'
          record_time: number
          grade?: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
          role?: 'admin' | 'user'
          etc?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          password?: string
          name?: string
          postal_code?: string
          address1?: string
          address2?: string
          phone?: string
          phone_marketing_agree?: boolean
          email?: string
          email_marketing_agree?: boolean
          birth_date?: string
          gender_digit?: string
          gender?: 'male' | 'female'
          record_time?: number
          grade?: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
          role?: 'admin' | 'user'
          etc?: string
          created_at?: string
          updated_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          location: string
          max_participants: number
          current_participants: number
          registration_start: string
          registration_end: string
          entry_fee: number
          course_description: string
          course_image_url?: string
          prizes: string
          prizes_image_url?: string
          image_url?: string
          categories?: string[]
          registration_categories?: string[]
          organizer?: string
          supervisor?: string
          sponsor?: string
          created_at: string
          updated_at: string
          status: 'draft' | 'published' | 'closed'
          shipping_status: 'pending' | 'completed'
        }
        Insert: {
          id?: string
          title: string
          description: string
          date: string
          location: string
          max_participants: number
          current_participants?: number
          registration_start: string
          registration_end: string
          entry_fee: number
          course_description: string
          course_image_url?: string
          prizes: string
          prizes_image_url?: string
          image_url?: string
          categories?: string[]
          registration_categories?: string[]
          organizer?: string
          supervisor?: string
          sponsor?: string
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'published' | 'closed'
          shipping_status?: 'pending' | 'completed'
        }
        Update: {
          id?: string
          title?: string
          description?: string
          date?: string
          location?: string
          max_participants?: number
          current_participants?: number
          registration_start?: string
          registration_end?: string
          entry_fee?: number
          course_description?: string
          course_image_url?: string
          prizes?: string
          prizes_image_url?: string
          image_url?: string
          categories?: string[]
          registration_categories?: string[]
          organizer?: string
          supervisor?: string
          sponsor?: string
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'published' | 'closed'
          shipping_status?: 'pending' | 'completed'
        }
      }
      participation_groups: {
        Row: {
          id: string
          competition_id: string
          name: string
          distance: string
          max_participants: number
          current_participants: number
          entry_fee: number
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          name: string
          distance: string
          max_participants: number
          current_participants?: number
          entry_fee: number
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          name?: string
          distance?: string
          max_participants?: number
          current_participants?: number
          entry_fee?: number
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          competition_id: string
          user_id?: string
          name: string
          email: string
          phone: string
          birth_date: string
          gender: 'male' | 'female'
          address: string
          shirt_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
          depositor_name: string
          password: string
          payment_status: 'pending' | 'confirmed' | 'cancelled'
          participation_group_id?: string
          category?: string
          distance?: string
          entry_fee?: number
          is_member_registration: boolean
          notes?: string
          age: number
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          user_id?: string
          name: string
          email: string
          phone: string
          birth_date: string
          gender: 'male' | 'female'
          address: string
          shirt_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
          depositor_name: string
          password: string
          payment_status?: 'pending' | 'confirmed' | 'cancelled'
          participation_group_id?: string
          category?: string
          distance?: string
          entry_fee?: number
          is_member_registration?: boolean
          notes?: string
          age: number
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string
          birth_date?: string
          gender?: 'male' | 'female'
          address?: string
          shirt_size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
          depositor_name?: string
          password?: string
          payment_status?: 'pending' | 'confirmed' | 'cancelled'
          participation_group_id?: string
          category?: string
          distance?: string
          entry_fee?: number
          is_member_registration?: boolean
          notes?: string
          age?: number
          created_at?: string
        }
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          competition_id?: string
          title: string
          content: string
          image_url?: string
          views: number
          is_notice: boolean
          is_private: boolean
          post_password?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          competition_id?: string
          title: string
          content: string
          image_url?: string
          views?: number
          is_notice?: boolean
          is_private?: boolean
          post_password?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          competition_id?: string
          title?: string
          content?: string
          image_url?: string
          views?: number
          is_notice?: boolean
          is_private?: boolean
          post_password?: string
          created_at?: string
          updated_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      popups: {
        Row: {
          id: string
          title: string
          content_image_url: string
          start_date: string
          end_date: string
          display_page: 'all' | 'home' | 'competition'
          competition_id?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content_image_url: string
          start_date: string
          end_date: string
          display_page: 'all' | 'home' | 'competition'
          competition_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content_image_url?: string
          start_date?: string
          end_date?: string
          display_page?: 'all' | 'home' | 'competition'
          competition_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
          record_time: number
          role: 'admin' | 'user'
          grade_display: string
          created_at: string
        }
      }
      community_posts_with_author: {
        Row: {
          id: string
          competition_id?: string
          title: string
          content: string
          image_url?: string
          views: number
          is_notice: boolean
          is_private: boolean
          post_password?: string
          created_at: string
          updated_at: string
          author_id: string
          author_name: string
          author_grade: 'cheetah' | 'horse' | 'wolf' | 'turtle' | 'bolt'
          author_grade_icon: string
          comment_count: number
        }
      }
    }
    Functions: {
      increment_post_views: {
        Args: { post_id: string }
        Returns: void
      }
    }
  }
}