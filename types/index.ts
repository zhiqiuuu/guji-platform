import type { Database } from './database';

export type Book = Database['public']['Tables']['books']['Row'];
export type BookInsert = Database['public']['Tables']['books']['Insert'];
export type BookUpdate = Database['public']['Tables']['books']['Update'];

export type BookParagraph = Database['public']['Tables']['book_paragraphs']['Row'];
export type BookParagraphInsert = Database['public']['Tables']['book_paragraphs']['Insert'];
export type BookParagraphUpdate = Database['public']['Tables']['book_paragraphs']['Update'];

export type Category = '经部' | '史部' | '子部' | '集部' | '其他';

export type Dynasty =
  | '先秦'
  | '秦汉'
  | '魏晋南北朝'
  | '隋唐'
  | '宋元'
  | '明清'
  | '近现代'
  | '未知';

export interface BookFilter {
  category?: Category;
  dynasty?: Dynasty;
  search?: string;
}

export interface ParagraphSearchResult {
  id: string;
  book_id: string;
  page_number: number;
  paragraph_index: number;
  content: string;
  position_start: number;
  position_end: number;
  prev_paragraph: string | null;
  next_paragraph: string | null;
  book_title: string;
  book_author: string;
  rank: number;
}
