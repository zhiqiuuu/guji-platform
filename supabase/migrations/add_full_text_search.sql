-- 添加全文内容字段
ALTER TABLE books
ADD COLUMN IF NOT EXISTS full_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(20) DEFAULT 'pending';

-- 创建全文搜索索引 (使用中文分词)
CREATE INDEX IF NOT EXISTS books_full_text_idx ON books USING gin(to_tsvector('simple', COALESCE(full_text, '')));

-- 创建组合搜索索引
CREATE INDEX IF NOT EXISTS books_search_idx ON books USING gin(
  to_tsvector('simple',
    COALESCE(title, '') || ' ' ||
    COALESCE(author, '') || ' ' ||
    COALESCE(keywords, '') || ' ' ||
    COALESCE(full_text, '')
  )
);

-- 添加注释
COMMENT ON COLUMN books.full_text IS 'OCR识别的全文内容';
COMMENT ON COLUMN books.ocr_status IS 'OCR处理状态: pending(待处理), processing(处理中), completed(已完成), failed(失败)';
