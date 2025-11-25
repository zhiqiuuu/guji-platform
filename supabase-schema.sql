-- 创建 books 表
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'images')),
  page_count INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_dynasty ON books(dynasty);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_books_title_search ON books USING gin(to_tsvector('chinese', title));
CREATE INDEX IF NOT EXISTS idx_books_author_search ON books USING gin(to_tsvector('chinese', author));

-- 创建更新时间自动更新的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建增加浏览次数的函数
CREATE OR REPLACE FUNCTION increment_view_count(book_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE books
  SET view_count = view_count + 1
  WHERE id = book_id;
END;
$$ LANGUAGE plpgsql;

-- 启用行级安全策略 (RLS)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取
CREATE POLICY "允许所有人读取书籍" ON books
  FOR SELECT
  USING (true);

-- 创建策略：允许所有人插入（如果你想要限制，可以修改这个策略）
CREATE POLICY "允许所有人插入书籍" ON books
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许所有人更新
CREATE POLICY "允许所有人更新书籍" ON books
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 创建策略：允许所有人删除
CREATE POLICY "允许所有人删除书籍" ON books
  FOR DELETE
  USING (true);

-- 插入一些示例数据（可选）
INSERT INTO books (title, author, dynasty, category, description, file_url, file_type) VALUES
  ('论语', '孔子', '春秋', '经部', '儒家经典著作，记录孔子及其弟子言行', '/uploads/sample.pdf', 'pdf'),
  ('道德经', '老子', '春秋', '子部', '道家哲学的奠基之作', '/uploads/sample.pdf', 'pdf'),
  ('史记', '司马迁', '汉', '史部', '中国第一部纪传体通史', '/uploads/sample.pdf', 'pdf');
