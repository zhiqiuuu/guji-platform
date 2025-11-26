-- =====================================================
-- 清空所有图书数据
-- 警告: 此操作不可逆,会删除所有书籍及相关数据
-- =====================================================

-- 禁用外键约束检查
SET session_replication_role = 'replica';

-- 删除阅读笔记
DELETE FROM public.reading_notes;

-- 删除阅读历史
DELETE FROM public.reading_history;

-- 删除书架数据
DELETE FROM public.bookshelf;

-- 删除搜索历史(与书籍相关)
DELETE FROM public.search_history;

-- 删除段落数据
DELETE FROM public.book_paragraphs;

-- 删除图书数据
DELETE FROM public.books;

-- 重新启用外键约束检查
SET session_replication_role = 'origin';

-- 重置序列(如果有)
-- ALTER SEQUENCE books_id_seq RESTART WITH 1;

-- 验证清空结果
SELECT
    'books' as table_name,
    COUNT(*) as remaining_records
FROM public.books
UNION ALL
SELECT
    'book_paragraphs' as table_name,
    COUNT(*) as remaining_records
FROM public.book_paragraphs
UNION ALL
SELECT
    'bookshelf' as table_name,
    COUNT(*) as remaining_records
FROM public.bookshelf
UNION ALL
SELECT
    'reading_history' as table_name,
    COUNT(*) as remaining_records
FROM public.reading_history
UNION ALL
SELECT
    'reading_notes' as table_name,
    COUNT(*) as remaining_records
FROM public.reading_notes;
