# 数据库迁移故障排查指南

## 遇到的错误

```
ERROR: 42710: policy "Users can view their own profile" for table "user_profiles" already exists
```

这个错误说明部分数据库对象已经存在,可能是之前的迁移部分执行成功了。

## 解决方案

### 方法1: 使用修复脚本 (推荐)

我已经创建了修复脚本: `supabase/migrations/20250125_fix_user_system.sql`

这个脚本会:
1. 删除所有已存在的RLS策略
2. 重新创建所有策略

**执行步骤:**
1. 打开Supabase SQL Editor
2. 复制并执行 `20250125_fix_user_system.sql` 的内容
3. 应该会成功执行

### 方法2: 检查当前状态

在Supabase SQL Editor中执行以下查询,检查哪些表已经创建:

```sql
-- 检查表是否存在
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_profiles',
  'bookshelf',
  'reading_history',
  'reading_notes',
  'search_history'
)
ORDER BY table_name;
```

预期结果:应该返回5行,每行对应一个表。

### 方法3: 检查RLS策略

```sql
-- 检查RLS策略
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'bookshelf',
  'reading_history',
  'reading_notes',
  'search_history'
)
ORDER BY tablename, policyname;
```

### 方法4: 检查函数

```sql
-- 检查辅助函数是否存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_bookshelf_stats',
  'update_reading_progress',
  'get_recent_books',
  'update_updated_at_column'
)
ORDER BY routine_name;
```

预期结果:应该返回4行。

## 完整验证

执行以下SQL验证迁移是否完全成功:

```sql
-- 1. 检查所有表是否存在
SELECT
  CASE
    WHEN COUNT(*) = 5 THEN '✅ 所有表已创建'
    ELSE '❌ 缺少表: ' || (5 - COUNT(*))::text
  END as table_status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_profiles',
  'bookshelf',
  'reading_history',
  'reading_notes',
  'search_history'
);

-- 2. 检查RLS是否启用
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ RLS已启用'
    ELSE '❌ RLS未启用'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'bookshelf',
  'reading_history',
  'reading_notes',
  'search_history'
)
ORDER BY tablename;

-- 3. 检查策略数量
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN tablename = 'user_profiles' AND COUNT(*) = 3 THEN '✅'
    WHEN tablename = 'bookshelf' AND COUNT(*) = 4 THEN '✅'
    WHEN tablename = 'reading_history' AND COUNT(*) = 4 THEN '✅'
    WHEN tablename = 'reading_notes' AND COUNT(*) = 4 THEN '✅'
    WHEN tablename = 'search_history' AND COUNT(*) = 2 THEN '✅'
    ELSE '❌'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'bookshelf',
  'reading_history',
  'reading_notes',
  'search_history'
)
GROUP BY tablename
ORDER BY tablename;

-- 4. 检查函数
SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✅ 所有函数已创建'
    ELSE '❌ 缺少函数: ' || (4 - COUNT(*))::text
  END as function_status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_bookshelf_stats',
  'update_reading_progress',
  'get_recent_books',
  'update_updated_at_column'
);

-- 5. 检查索引
SELECT
  COUNT(*) as index_count,
  CASE
    WHEN COUNT(*) >= 12 THEN '✅ 索引已创建'
    ELSE '⚠️ 索引数量: ' || COUNT(*)::text
  END as index_status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'bookshelf',
  'reading_history',
  'reading_notes',
  'search_history'
)
AND indexname LIKE 'idx_%';
```

## 如果问题仍然存在

### 完全重置(慎用!)

如果需要完全重新开始,执行以下SQL(会删除所有数据):

```sql
-- 警告: 这会删除所有用户系统数据!

-- 删除表
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.reading_notes CASCADE;
DROP TABLE IF EXISTS public.reading_history CASCADE;
DROP TABLE IF EXISTS public.bookshelf CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS get_bookshelf_stats(UUID);
DROP FUNCTION IF EXISTS update_reading_progress(UUID, UUID, INTEGER, INTEGER, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS get_recent_books(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

然后重新执行完整的迁移脚本 `20250125_create_user_system.sql`。

## 测试迁移成功

迁移成功后,可以在前端测试:

1. ✅ 点击"注册"创建新账号
2. ✅ 登录后查看Header的用户菜单
3. ✅ 打开任意书籍详情页,点击"收藏"按钮
4. ✅ 检查收藏按钮变为"已收藏"状态

## 常见问题

### Q: 策略已存在错误
A: 使用修复脚本 `20250125_fix_user_system.sql`

### Q: 表不存在
A: 执行完整迁移脚本 `20250125_create_user_system.sql`

### Q: 函数不存在
A: 重新执行迁移脚本中的函数创建部分

### Q: RLS未启用
A: 执行:
```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookshelf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
```
