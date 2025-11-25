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

// =====================================================
// 用户系统类型定义
// =====================================================

export type UserRole = 'guest' | 'user' | 'advanced' | 'editor' | 'admin';

export type ReadingTheme = 'default' | 'sepia' | 'dark';

export type BookshelfCategory = 'default' | 'favorites' | 'reading' | 'completed' | 'wishlist';

export type ReadingStatus = 'reading' | 'paused' | 'completed';

export type ViewMode = 'pdf' | 'text';

export type NoteType = 'note' | 'highlight' | 'question' | 'annotation';

export type SearchType = 'book' | 'paragraph' | 'author';

// 用户配置
export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  default_theme: ReadingTheme;
  default_font_size: string | null;
  default_line_height: string | null;
  books_read: number;
  total_reading_time: number;
  created_at: string;
  updated_at: string;
}

// 书架项
export interface BookshelfItem {
  id: string;
  user_id: string;
  book_id: string;
  category: BookshelfCategory;
  tags: string[] | null;
  notes: string | null;
  rating: number | null;
  added_at: string;
  updated_at: string;
}

// 书架项(带书籍信息)
export interface BookshelfItemWithBook extends BookshelfItem {
  book: Book;
}

// 阅读历史
export interface ReadingHistory {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number | null;
  progress_percentage: number;
  view_mode: ViewMode;
  scroll_position: number;
  reading_time: number;
  status: ReadingStatus;
  last_read_at: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// 阅读历史(带书籍信息)
export interface ReadingHistoryWithBook extends ReadingHistory {
  book: Book;
}

// 阅读笔记
export interface ReadingNote {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  page_number: number | null;
  paragraph_id: string | null;
  selected_text: string | null;
  note_type: NoteType;
  color: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// 阅读笔记(带书籍信息)
export interface ReadingNoteWithBook extends ReadingNote {
  book: Book;
}

// 搜索历史
export interface SearchHistory {
  id: string;
  user_id: string | null;
  query: string;
  search_type: SearchType;
  results_count: number;
  has_clicked: boolean;
  created_at: string;
}

// 书架统计
export interface BookshelfStats {
  total_books: number;
  favorites: number;
  reading: number;
  completed: number;
  wishlist: number;
}

// 最近阅读的书籍
export interface RecentBook {
  book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  current_page: number;
  progress_percentage: number;
  last_read_at: string;
}

// 用户统计数据
export interface UserStats {
  books_read: number;
  total_reading_time: number;
  bookshelf_stats: BookshelfStats;
  recent_books: RecentBook[];
}

// API请求类型
export interface UpdateReadingProgressParams {
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  view_mode?: ViewMode;
  scroll_position?: number;
}

export interface CreateNoteParams {
  user_id: string;
  book_id: string;
  content: string;
  page_number?: number;
  paragraph_id?: string;
  selected_text?: string;
  note_type?: NoteType;
  color?: string;
  is_public?: boolean;
}

export interface AddToBookshelfParams {
  user_id: string;
  book_id: string;
  category?: BookshelfCategory;
  tags?: string[];
  notes?: string;
  rating?: number;
}
