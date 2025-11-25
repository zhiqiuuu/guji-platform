-- 创建 book_paragraphs 表
CREATE TABLE IF NOT EXISTS public.book_paragraphs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  paragraph_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- 确保同一本书的段落不重复
  UNIQUE(book_id, page_number, paragraph_index)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_book_paragraphs_book_id ON public.book_paragraphs(book_id);
CREATE INDEX IF NOT EXISTS idx_book_paragraphs_page_number ON public.book_paragraphs(book_id, page_number);

-- 创建全文搜索索引 (使用中文分词配置)
CREATE INDEX IF NOT EXISTS idx_book_paragraphs_search
  ON public.book_paragraphs
  USING GIN(search_vector);

-- 创建触发器函数,自动更新 search_vector
CREATE OR REPLACE FUNCTION update_book_paragraph_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- 使用简单配置(simple)避免中文分词问题,或使用 pg_jieba 等中文分词扩展
  NEW.search_vector := to_tsvector('simple', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_book_paragraph_search_vector ON public.book_paragraphs;
CREATE TRIGGER trigger_update_book_paragraph_search_vector
  BEFORE INSERT OR UPDATE ON public.book_paragraphs
  FOR EACH ROW
  EXECUTE FUNCTION update_book_paragraph_search_vector();

-- 创建搜索函数
CREATE OR REPLACE FUNCTION search_book_paragraphs(
  search_query TEXT,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  book_id UUID,
  page_number INTEGER,
  paragraph_index INTEGER,
  content TEXT,
  position_start INTEGER,
  position_end INTEGER,
  prev_paragraph TEXT,
  next_paragraph TEXT,
  book_title TEXT,
  book_author TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_paragraphs AS (
    SELECT
      p.id,
      p.book_id,
      p.page_number,
      p.paragraph_index,
      p.content,
      p.position_start,
      p.position_end,
      ts_rank(p.search_vector, plainto_tsquery('simple', search_query)) AS rank
    FROM book_paragraphs p
    WHERE p.search_vector @@ plainto_tsquery('simple', search_query)
    ORDER BY rank DESC, p.book_id, p.page_number, p.paragraph_index
    LIMIT limit_count
  ),
  paragraphs_with_context AS (
    SELECT
      rp.id,
      rp.book_id,
      rp.page_number,
      rp.paragraph_index,
      rp.content,
      rp.position_start,
      rp.position_end,
      rp.rank,
      -- 获取前一个段落
      LAG(p2.content) OVER (
        PARTITION BY rp.book_id
        ORDER BY p2.page_number, p2.paragraph_index
      ) AS prev_paragraph,
      -- 获取后一个段落
      LEAD(p2.content) OVER (
        PARTITION BY rp.book_id
        ORDER BY p2.page_number, p2.paragraph_index
      ) AS next_paragraph
    FROM ranked_paragraphs rp
    LEFT JOIN book_paragraphs p2 ON rp.book_id = p2.book_id
  )
  SELECT DISTINCT ON (pc.id)
    pc.id,
    pc.book_id,
    pc.page_number,
    pc.paragraph_index,
    pc.content,
    pc.position_start,
    pc.position_end,
    pc.prev_paragraph,
    pc.next_paragraph,
    b.title AS book_title,
    b.author AS book_author,
    pc.rank
  FROM paragraphs_with_context pc
  JOIN books b ON pc.book_id = b.id
  ORDER BY pc.id, pc.rank DESC;
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE public.book_paragraphs IS '书籍段落表,用于精细化搜索';
COMMENT ON COLUMN public.book_paragraphs.book_id IS '关联的书籍ID';
COMMENT ON COLUMN public.book_paragraphs.page_number IS '页码';
COMMENT ON COLUMN public.book_paragraphs.paragraph_index IS '段落在页面中的序号';
COMMENT ON COLUMN public.book_paragraphs.content IS '段落内容';
COMMENT ON COLUMN public.book_paragraphs.position_start IS '段落在全文中的起始位置';
COMMENT ON COLUMN public.book_paragraphs.position_end IS '段落在全文中的结束位置';
COMMENT ON COLUMN public.book_paragraphs.search_vector IS '全文搜索向量';
