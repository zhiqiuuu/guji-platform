-- =====================================================
-- 用户系统数据库迁移
-- 创建用户配置、书架、阅读历史等表
-- =====================================================

-- 1. 用户配置表 (扩展 Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('guest', 'user', 'advanced', 'editor', 'admin')),

  -- 阅读偏好
  default_theme VARCHAR(20) DEFAULT 'sepia' CHECK (default_theme IN ('default', 'sepia', 'dark')),
  default_font_size VARCHAR(20) DEFAULT 'medium',
  default_line_height VARCHAR(20) DEFAULT 'normal',

  -- 统计信息
  books_read INTEGER DEFAULT 0,
  total_reading_time INTEGER DEFAULT 0, -- 总阅读时长(分钟)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 个人书架表
CREATE TABLE IF NOT EXISTS public.bookshelf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

  -- 书架分类
  category VARCHAR(50) DEFAULT 'default', -- default, favorites, reading, completed, wishlist

  -- 自定义标签
  tags TEXT[], -- 用户自定义标签数组

  -- 私人笔记
  notes TEXT,

  -- 评分
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- 确保同一用户不会重复收藏同一本书
  UNIQUE(user_id, book_id)
);

-- 3. 阅读历史表
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

  -- 阅读进度
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00, -- 阅读进度百分比

  -- 视图模式和位置
  view_mode VARCHAR(20) DEFAULT 'pdf' CHECK (view_mode IN ('pdf', 'text')),
  scroll_position INTEGER DEFAULT 0, -- 滚动位置

  -- 阅读时长(分钟)
  reading_time INTEGER DEFAULT 0,

  -- 状态
  status VARCHAR(20) DEFAULT 'reading' CHECK (status IN ('reading', 'paused', 'completed')),

  -- 时间戳
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- 每个用户每本书只有一条历史记录
  UNIQUE(user_id, book_id)
);

-- 4. 阅读笔记表
CREATE TABLE IF NOT EXISTS public.reading_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,

  -- 笔记内容
  content TEXT NOT NULL,

  -- 位置信息
  page_number INTEGER,
  paragraph_id UUID REFERENCES public.book_paragraphs(id) ON DELETE SET NULL,
  selected_text TEXT, -- 引用的原文

  -- 笔记类型
  note_type VARCHAR(20) DEFAULT 'note' CHECK (note_type IN ('note', 'highlight', 'question', 'annotation')),

  -- 颜色标记(用于高亮)
  color VARCHAR(20),

  -- 可见性
  is_public BOOLEAN DEFAULT false, -- 是否公开分享

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 用户搜索历史表
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 可为空,支持游客搜索记录

  -- 搜索查询
  query TEXT NOT NULL,

  -- 搜索类型
  search_type VARCHAR(20) DEFAULT 'paragraph' CHECK (search_type IN ('book', 'paragraph', 'author')),

  -- 结果数量
  results_count INTEGER DEFAULT 0,

  -- 是否点击了结果
  has_clicked BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 创建索引
-- =====================================================

-- 用户配置表索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 书架索引
CREATE INDEX IF NOT EXISTS idx_bookshelf_user_id ON public.bookshelf(user_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_book_id ON public.bookshelf(book_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_category ON public.bookshelf(user_id, category);
CREATE INDEX IF NOT EXISTS idx_bookshelf_tags ON public.bookshelf USING GIN(tags);

-- 阅读历史索引
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON public.reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_book_id ON public.reading_history(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_last_read ON public.reading_history(user_id, last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_history_status ON public.reading_history(user_id, status);

-- 阅读笔记索引
CREATE INDEX IF NOT EXISTS idx_reading_notes_user_id ON public.reading_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_notes_book_id ON public.reading_notes(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_notes_paragraph_id ON public.reading_notes(paragraph_id);
CREATE INDEX IF NOT EXISTS idx_reading_notes_public ON public.reading_notes(is_public) WHERE is_public = true;

-- 搜索历史索引
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- =====================================================
-- 创建触发器:自动更新 updated_at 字段
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器到各表
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookshelf_updated_at ON public.bookshelf;
CREATE TRIGGER update_bookshelf_updated_at
  BEFORE UPDATE ON public.bookshelf
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_history_updated_at ON public.reading_history;
CREATE TRIGGER update_reading_history_updated_at
  BEFORE UPDATE ON public.reading_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_notes_updated_at ON public.reading_notes;
CREATE TRIGGER update_reading_notes_updated_at
  BEFORE UPDATE ON public.reading_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 创建RLS (行级安全)策略
-- =====================================================

-- 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookshelf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- 用户配置表策略
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 书架策略
CREATE POLICY "Users can view their own bookshelf"
  ON public.bookshelf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own bookshelf"
  ON public.bookshelf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookshelf"
  ON public.bookshelf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own bookshelf"
  ON public.bookshelf FOR DELETE
  USING (auth.uid() = user_id);

-- 阅读历史策略
CREATE POLICY "Users can view their own reading history"
  ON public.reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading history"
  ON public.reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading history"
  ON public.reading_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading history"
  ON public.reading_history FOR DELETE
  USING (auth.uid() = user_id);

-- 阅读笔记策略
CREATE POLICY "Users can view their own notes"
  ON public.reading_notes FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own notes"
  ON public.reading_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.reading_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.reading_notes FOR DELETE
  USING (auth.uid() = user_id);

-- 搜索历史策略
CREATE POLICY "Users can view their own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert search history"
  ON public.search_history FOR INSERT
  WITH CHECK (true); -- 允许游客记录搜索历史

-- =====================================================
-- 创建辅助函数
-- =====================================================

-- 获取用户书架统计
CREATE OR REPLACE FUNCTION get_bookshelf_stats(p_user_id UUID)
RETURNS TABLE (
  total_books INTEGER,
  favorites INTEGER,
  reading INTEGER,
  completed INTEGER,
  wishlist INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_books,
    COUNT(*) FILTER (WHERE category = 'favorites')::INTEGER AS favorites,
    COUNT(*) FILTER (WHERE category = 'reading')::INTEGER AS reading,
    COUNT(*) FILTER (WHERE category = 'completed')::INTEGER AS completed,
    COUNT(*) FILTER (WHERE category = 'wishlist')::INTEGER AS wishlist
  FROM public.bookshelf
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新阅读历史进度
CREATE OR REPLACE FUNCTION update_reading_progress(
  p_user_id UUID,
  p_book_id UUID,
  p_current_page INTEGER,
  p_total_pages INTEGER,
  p_view_mode VARCHAR(20) DEFAULT 'pdf',
  p_scroll_position INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_progress DECIMAL(5,2);
BEGIN
  -- 计算进度百分比
  IF p_total_pages > 0 THEN
    v_progress := (p_current_page::DECIMAL / p_total_pages * 100);
  ELSE
    v_progress := 0;
  END IF;

  -- 插入或更新阅读历史
  INSERT INTO public.reading_history (
    user_id,
    book_id,
    current_page,
    total_pages,
    progress_percentage,
    view_mode,
    scroll_position,
    last_read_at,
    status
  ) VALUES (
    p_user_id,
    p_book_id,
    p_current_page,
    p_total_pages,
    v_progress,
    p_view_mode,
    p_scroll_position,
    timezone('utc'::text, now()),
    CASE WHEN v_progress >= 100 THEN 'completed' ELSE 'reading' END
  )
  ON CONFLICT (user_id, book_id)
  DO UPDATE SET
    current_page = EXCLUDED.current_page,
    total_pages = EXCLUDED.total_pages,
    progress_percentage = EXCLUDED.progress_percentage,
    view_mode = EXCLUDED.view_mode,
    scroll_position = EXCLUDED.scroll_position,
    last_read_at = EXCLUDED.last_read_at,
    status = EXCLUDED.status,
    completed_at = CASE
      WHEN EXCLUDED.progress_percentage >= 100 AND public.reading_history.completed_at IS NULL
      THEN timezone('utc'::text, now())
      ELSE public.reading_history.completed_at
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取最近阅读的书籍
CREATE OR REPLACE FUNCTION get_recent_books(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  book_id UUID,
  title TEXT,
  author TEXT,
  cover_url TEXT,
  current_page INTEGER,
  progress_percentage DECIMAL(5,2),
  last_read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.author,
    b.cover_url,
    rh.current_page,
    rh.progress_percentage,
    rh.last_read_at
  FROM public.reading_history rh
  JOIN public.books b ON rh.book_id = b.id
  WHERE rh.user_id = p_user_id
  ORDER BY rh.last_read_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 添加注释
-- =====================================================

COMMENT ON TABLE public.user_profiles IS '用户配置扩展表';
COMMENT ON TABLE public.bookshelf IS '个人书架,存储用户收藏的书籍';
COMMENT ON TABLE public.reading_history IS '阅读历史记录,追踪阅读进度';
COMMENT ON TABLE public.reading_notes IS '用户阅读笔记和标注';
COMMENT ON TABLE public.search_history IS '搜索历史记录';

COMMENT ON COLUMN public.user_profiles.role IS '用户角色: guest(游客), user(普通用户), advanced(高级用户), editor(编辑), admin(管理员)';
COMMENT ON COLUMN public.bookshelf.category IS '书架分类: default(默认), favorites(收藏), reading(在读), completed(已读), wishlist(想读)';
COMMENT ON COLUMN public.reading_history.view_mode IS '视图模式: pdf(影印版), text(文本版)';
COMMENT ON COLUMN public.reading_notes.note_type IS '笔记类型: note(笔记), highlight(高亮), question(疑问), annotation(批注)';
