-- 修复 books 表的 category 约束,添加"性理"类别
-- 执行步骤:
-- 1. 删除旧的约束
-- 2. 添加新的约束(包含7个类别)

-- 步骤 1: 删除现有的 category 检查约束
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_category_check;

-- 步骤 2: 添加新的约束,包含所有7个类别
ALTER TABLE books ADD CONSTRAINT books_category_check 
CHECK (category IN ('经学', '史学', '掌故', '算学', '舆地', '词章', '性理'));

-- 验证约束是否创建成功
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'books'::regclass AND conname = 'books_category_check';
