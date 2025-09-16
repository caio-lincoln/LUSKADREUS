import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihggzjdvglclcrlqkrfs.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ2d6amR2Z2xjbGNybHFrcmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3ODAyNzQsImV4cCI6MjA3MjM1NjI3NH0.7wW2UtIT2j2NgBgltEPSjMl4tGquu3Y4TcP0uPnEe70'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para a galeria
export interface Drawing {
  id: string
  title: string
  description?: string
  mode: string
  thumbnail_url?: string
  image_url?: string
  is_public: boolean
  likes_count: number
  comments_count: number
  views_count: number
  canvas_width: number
  canvas_height: number
  file_size?: number
  created_at: string
  updated_at: string
  tags?: string[]
  is_favorite?: boolean
  author_name?: string
  author_id?: string
}

export interface GalleryFilters {
  searchTerm?: string
  filterMode?: string
  sortBy?: string
  limit?: number
  offset?: number
}

export interface Tag {
  id: string
  name: string
  color?: string
  usage_count: number
}