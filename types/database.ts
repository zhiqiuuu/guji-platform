export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          author: string
          dynasty: string
          category: string
          description: string | null
          keywords: string | null
          cover_url: string | null
          file_url: string
          file_type: 'pdf' | 'images'
          page_count: number | null
          view_count: number
          full_text: string | null
          ocr_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          dynasty: string
          category: string
          description?: string | null
          keywords?: string | null
          cover_url?: string | null
          file_url: string
          file_type: 'pdf' | 'images'
          page_count?: number | null
          view_count?: number
          full_text?: string | null
          ocr_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          dynasty?: string
          category?: string
          description?: string | null
          keywords?: string | null
          cover_url?: string | null
          file_url?: string
          file_type?: 'pdf' | 'images'
          page_count?: number | null
          view_count?: number
          full_text?: string | null
          ocr_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      book_paragraphs: {
        Row: {
          id: string
          book_id: string
          page_number: number
          paragraph_index: number
          content: string
          position_start: number
          position_end: number
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          page_number: number
          paragraph_index: number
          content: string
          position_start: number
          position_end: number
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          page_number?: number
          paragraph_index?: number
          content?: string
          position_start?: number
          position_end?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_book_paragraphs: {
        Args: {
          search_query: string
          limit_count?: number
        }
        Returns: Array<{
          id: string
          book_id: string
          page_number: number
          paragraph_index: number
          content: string
          position_start: number
          position_end: number
          prev_paragraph: string | null
          next_paragraph: string | null
          book_title: string
          book_author: string
          rank: number
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
