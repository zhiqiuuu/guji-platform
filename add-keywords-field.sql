-- 添加 keywords 字段到 books 表
ALTER TABLE books ADD COLUMN IF NOT EXISTS keywords TEXT;

-- 创建关键词全文搜索索引
CREATE INDEX IF NOT EXISTS idx_books_keywords_search ON books USING gin(to_tsvector('chinese', keywords));

-- 添加关键词字段的普通索引(用于 LIKE 查询)
CREATE INDEX IF NOT EXISTS idx_books_keywords ON books(keywords);
