# 数据库迁移指南 - 用户系统

## 迁移文件位置
`supabase/migrations/20250125_create_user_system.sql`

## 执行步骤

### 方法1: 通过Supabase Dashboard (推荐)

1. **登录Supabase Dashboard**
   - 访问: https://supabase.com/dashboard
   - 选择项目: `qhbpykzqydfimjjejtgg`

2. **打开SQL Editor**
   - 左侧菜单 → SQL Editor
   - 或直接访问: https://supabase.com/dashboard/project/qhbpykzqydfimjjejtgg/sql/new

3. **复制并执行迁移SQL**
   - 打开文件: `supabase/migrations/20250125_create_user_system.sql`
   - 复制全部内容
   - 粘贴到SQL Editor
   - 点击 **Run** 按钮执行

4. **验证迁移**
   执行以下SQL验证表已创建:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'user_profiles',
     'bookshelf',
     'reading_history',
     'reading_notes',
     'search_history'
   );
   ```
   应该返回5行结果。

### 方法2: 通过Supabase CLI (如果已安装)

```bash
# 确保在项目根目录
cd guji-platform

# 登录Supabase CLI
npx supabase login

# 链接到远程项目
npx supabase link --project-ref qhbpykzqydfimjjejtgg

# 推送迁移
npx supabase db push
```

## 创建的表结构

### 1. user_profiles (用户配置表)
- 扩展Supabase auth.users的用户信息
- 包含用户名、显示名、角色、阅读偏好等

### 2. bookshelf (个人书架表)
- 用户收藏的书籍
- 支持分类、标签、评分、笔记

### 3. reading_history (阅读历史表)
- 记录阅读进度、时长、状态
- 自动计算完成百分比

### 4. reading_notes (阅读笔记表)
- 用户的阅读笔记和标注
- 支持高亮、批注、疑问等类型

### 5. search_history (搜索历史表)
- 记录用户搜索行为
- 支持游客和登录用户

## 安全策略 (RLS)

所有表都已启用行级安全(Row Level Security),确保:
- ✅ 用户只能访问自己的数据
- ✅ 公开笔记可被所有人查看
- ✅ 游客可以记录搜索历史

## 辅助函数

迁移还创建了以下辅助函数:
- `get_bookshelf_stats()` - 获取书架统计
- `update_reading_progress()` - 更新阅读进度
- `get_recent_books()` - 获取最近阅读

## 迁移后验证

执行以下查询验证功能:

```sql
-- 1. 查看所有新表
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%user%' OR table_name IN ('bookshelf', 'reading_history', 'reading_notes', 'search_history');

-- 2. 验证RLS已启用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'bookshelf', 'reading_history', 'reading_notes', 'search_history');

-- 3. 查看创建的函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_bookshelf_stats', 'update_reading_progress', 'get_recent_books');
```

## 常见问题

### Q: 迁移失败,提示"auth.users不存在"
A: 这是Supabase的内置认证表,应该自动存在。如果出现此错误,请检查项目是否正确启用了Auth功能。

### Q: 如何回滚迁移?
A: 手动执行DROP语句(请谨慎):
```sql
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.reading_notes CASCADE;
DROP TABLE IF EXISTS public.reading_history CASCADE;
DROP TABLE IF EXISTS public.bookshelf CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS get_bookshelf_stats(UUID);
DROP FUNCTION IF EXISTS update_reading_progress(UUID, UUID, INTEGER, INTEGER, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS get_recent_books(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### Q: 迁移成功后如何测试?
A: 前端已经集成了认证功能,直接在应用中:
1. 点击"注册"创建新账号
2. 登录后查看个人中心
3. 尝试收藏书籍
4. 阅读书籍时自动记录历史

## 下一步

迁移完成后,可以开始使用:
- ✅ 用户注册/登录功能已就绪
- ⏳ 需要创建书架API和UI
- ⏳ 需要集成阅读历史追踪
- ⏳ 需要创建个人中心页面
