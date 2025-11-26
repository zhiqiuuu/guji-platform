-- =====================================================
-- 重新设计书库数据结构
-- 支持课题库和课艺库两种类型
-- =====================================================

-- 删除现有的 books 表(如果需要重建)
-- DROP TABLE IF EXISTS public.books CASCADE;

-- 修改 books 表结构以支持新的书库系统
ALTER TABLE public.books
-- 添加书库类型字段
ADD COLUMN IF NOT EXISTS library_type VARCHAR(50) CHECK (library_type IN ('课题库', '课艺库')),

-- 添加书院字段
ADD COLUMN IF NOT EXISTS academy VARCHAR(200),

-- 添加年份字段
ADD COLUMN IF NOT EXISTS year VARCHAR(50),

-- 添加季节字段
ADD COLUMN IF NOT EXISTS season VARCHAR(50),

-- 添加题目字段(对于课题库是列项,对于课艺库是五级标题)
ADD COLUMN IF NOT EXISTS subject VARCHAR(500),

-- 添加自定义标题字段(JSON格式,支持灵活的层级结构)
ADD COLUMN IF NOT EXISTS custom_hierarchy JSONB,

-- 添加是否有正文字段
ADD COLUMN IF NOT EXISTS has_full_text BOOLEAN DEFAULT false;

-- 修改 category 字段的约束,使用新的类别
ALTER TABLE public.books
DROP CONSTRAINT IF EXISTS books_category_check;

ALTER TABLE public.books
ADD CONSTRAINT books_category_check
CHECK (category IN ('经学', '史学', '掌故', '算学', '舆地', '词章'));

-- 修改 title 字段,允许更长的标题
ALTER TABLE public.books
ALTER COLUMN title TYPE TEXT;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_books_library_type ON public.books(library_type);
CREATE INDEX IF NOT EXISTS idx_books_academy ON public.books(academy);
CREATE INDEX IF NOT EXISTS idx_books_year ON public.books(year);
CREATE INDEX IF NOT EXISTS idx_books_season ON public.books(season);
CREATE INDEX IF NOT EXISTS idx_books_subject ON public.books(subject);
CREATE INDEX IF NOT EXISTS idx_books_custom_hierarchy ON public.books USING gin(custom_hierarchy);

-- 添加字段注释
COMMENT ON COLUMN public.books.library_type IS '书库类型: 课题库(只有题目) 或 课艺库(有正文)';
COMMENT ON COLUMN public.books.academy IS '书院名称';
COMMENT ON COLUMN public.books.year IS '年份';
COMMENT ON COLUMN public.books.season IS '季节: 春、夏、秋、冬';
COMMENT ON COLUMN public.books.subject IS '题目(课题库的列项或课艺库的五级标题)';
COMMENT ON COLUMN public.books.custom_hierarchy IS 'JSON格式的自定义层级结构,支持灵活的标题层级';
COMMENT ON COLUMN public.books.has_full_text IS '是否包含完整正文';
COMMENT ON COLUMN public.books.category IS '类别: 经学、史学、掌故、算学、舆地、词章';

-- 示例数据结构说明
COMMENT ON TABLE public.books IS '
书库数据结构说明:

【课题库示例】
library_type: 课题库
academy: 某书院
year: 1850
season: 春
category: 经学
subject: 论语·学而篇
custom_hierarchy: {"level1": "某书院", "level2": "1850", "level3": "春", "level4": "经学"}
has_full_text: false

【课艺库示例】
library_type: 课艺库
academy: 某书院
year: 1850
season: 春
category: 史学
subject: 史记·项羽本纪
custom_hierarchy: {"level1": "某书院", "level2": "1850", "level3": "春", "level4": "史学", "level5": "史记·项羽本纪"}
has_full_text: true
';
