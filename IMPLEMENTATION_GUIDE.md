# 书库数据结构重构 - 实施指南

## 📋 项目概述

本次重构旨在支持两种书库类型(**课题库**和**课艺库**),采用灵活的层级结构,支持自定义标题和批量数据导入。

---

## ✅ 已完成的工作

### 1. 数据库结构设计

#### 📄 文件位置
- [LIBRARY_STRUCTURE_DESIGN.md](./LIBRARY_STRUCTURE_DESIGN.md) - 完整的数据结构设计文档

#### 核心特性
- 支持两种书库类型:
  - **课题库**: 4级层级,只有题目无正文
  - **课艺库**: 5级层级,包含完整正文
- 六个标准类别: 经学、史学、掌故、算学、舆地、词章
- 灵活的自定义层级 (JSONB格式)
- 标准层级: 书院 → 年份 → 季节 → 类别 → 题目/文章

### 2. 数据库迁移脚本

#### 📄 文件位置
- [supabase/migrations/20250126_clear_all_books.sql](./supabase/migrations/20250126_clear_all_books.sql)
- [supabase/migrations/20250126_redesign_books_structure.sql](./supabase/migrations/20250126_redesign_books_structure.sql)

#### 新增字段
```sql
-- Books表新增字段
library_type VARCHAR(50)      -- 书库类型
academy VARCHAR(200)           -- 书院名称
year VARCHAR(50)               -- 年份
season VARCHAR(50)             -- 季节
subject VARCHAR(500)           -- 题目
custom_hierarchy JSONB         -- 自定义层级结构
has_full_text BOOLEAN          -- 是否有正文
```

#### 更新的约束
```sql
-- 类别约束更新为六个标准类别
CHECK (category IN ('经学', '史学', '掌故', '算学', '舆地', '词章'))
```

### 3. 数据导入系统

#### 📄 文件位置
- API路由: [app/api/books/import/route.ts](./app/api/books/import/route.ts)
- 前端页面: [app/admin/import/page.tsx](./app/admin/import/page.tsx)
- 使用指南: [IMPORT_GUIDE.md](./IMPORT_GUIDE.md)
- 测试数据: [test-import-data.csv](./test-import-data.csv)

#### 核心功能
- ✅ CSV/Excel文件解析
- ✅ 数据验证 (必填字段、类别检查)
- ✅ 数据预览 (导入前查看前5条)
- ✅ 批量导入
- ✅ 错误提示和处理
- ✅ 模板下载 (课题库和课艺库)
- ✅ 管理员权限验证

### 4. 用户界面更新

#### 📄 文件位置
- [components/layout/header.tsx](./components/layout/header.tsx)

#### 更新内容
- 为管理员用户添加 "批量导入" 菜单项
- 仅管理员可见
- 使用Upload图标和蓝色高亮

---

## 🚀 实施步骤

### 步骤 1: 备份现有数据 (可选)

如果需要保留现有数据用于恢复:

```bash
# 在Supabase Dashboard的SQL Editor执行
COPY public.books TO '/backup/books_backup.csv' WITH CSV HEADER;
```

### 步骤 2: 执行数据库迁移

#### 2.1 清空现有数据

在 **Supabase Dashboard → SQL Editor** 执行:

```sql
-- 执行清空脚本
-- 文件: supabase/migrations/20250126_clear_all_books.sql
```

**内容:**
```sql
SET session_replication_role = 'replica';
DELETE FROM public.reading_notes;
DELETE FROM public.reading_history;
DELETE FROM public.bookshelf;
DELETE FROM public.search_history;
DELETE FROM public.book_paragraphs;
DELETE FROM public.books;
SET session_replication_role = 'origin';
```

⚠️ **警告**: 此操作会删除所有书籍及相关数据,不可逆!

#### 2.2 更新表结构

在 **Supabase Dashboard → SQL Editor** 执行:

```sql
-- 执行结构更新脚本
-- 文件: supabase/migrations/20250126_redesign_books_structure.sql
```

这将添加新字段并更新约束。

#### 2.3 验证表结构

执行以下SQL验证:

```sql
-- 检查books表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'books'
ORDER BY ordinal_position;

-- 检查约束
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE 'books%';
```

预期应该看到新增的字段:
- `library_type`
- `academy`
- `year`
- `season`
- `subject`
- `custom_hierarchy`
- `has_full_text`

### 步骤 3: 准备导入数据

#### 3.1 下载模板

1. 登录系统 (使用管理员账号)
2. 访问: `http://localhost:3000/admin/import`
3. 下载对应的CSV模板:
   - 课题库模板
   - 课艺库模板

#### 3.2 整理数据

参考 [IMPORT_GUIDE.md](./IMPORT_GUIDE.md) 整理您的数据:

**必填字段:**
- `library_type`: 课题库 或 课艺库
- `academy`: 书院名称
- `year`: 年份
- `season`: 季节
- `category`: 经学、史学、掌故、算学、舆地、词章
- `subject`: 题目
- `author`: 作者 (建议至少填 "未知")
- `dynasty`: 朝代 (建议至少填 "清")

**可选字段:**
- `description`: 描述
- `file_url`: 文件URL (课艺库推荐)
- `file_type`: 文件类型

#### 3.3 使用测试数据

可以先用提供的测试数据测试导入功能:
- 文件: `test-import-data.csv`
- 包含8条测试数据
- 涵盖课题库和课艺库两种类型

### 步骤 4: 导入数据

1. 访问导入页面: `http://localhost:3000/admin/import`
2. 上传准备好的CSV或Excel文件
3. 点击 **"解析并验证文件"**
4. 检查验证结果:
   - 如有错误,根据提示修改文件
   - 验证通过后,查看数据预览
5. 点击 **"确认导入"**
6. 等待导入完成

### 步骤 5: 验证导入结果

#### 5.1 在前端验证

访问书库页面: `http://localhost:3000/books`

检查:
- ✅ 书籍列表显示正常
- ✅ 类别筛选工作正常
- ✅ 搜索功能正常
- ✅ 书籍详情页可访问

#### 5.2 在数据库验证

```sql
-- 查询导入的书籍总数
SELECT COUNT(*) FROM books;

-- 按书库类型统计
SELECT library_type, COUNT(*) as count
FROM books
GROUP BY library_type;

-- 按类别统计
SELECT category, COUNT(*) as count
FROM books
GROUP BY category
ORDER BY count DESC;

-- 检查自定义层级
SELECT
  academy,
  year,
  season,
  category,
  subject,
  custom_hierarchy
FROM books
LIMIT 5;
```

---

## 📚 文档索引

| 文档名称 | 路径 | 用途 |
|---------|------|------|
| 数据结构设计文档 | [LIBRARY_STRUCTURE_DESIGN.md](./LIBRARY_STRUCTURE_DESIGN.md) | 详细的数据结构说明、API设计、查询示例 |
| 导入功能使用指南 | [IMPORT_GUIDE.md](./IMPORT_GUIDE.md) | 批量导入功能的完整使用指南 |
| 域名绑定指南 | [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md) | 阿里云域名绑定到Vercel |
| 清空数据脚本 | [supabase/migrations/20250126_clear_all_books.sql](./supabase/migrations/20250126_clear_all_books.sql) | SQL脚本,清空所有书籍数据 |
| 结构更新脚本 | [supabase/migrations/20250126_redesign_books_structure.sql](./supabase/migrations/20250126_redesign_books_structure.sql) | SQL脚本,更新表结构 |
| 测试数据 | [test-import-data.csv](./test-import-data.csv) | 8条测试数据 |

---

## 🔧 技术栈

- **前端框架**: Next.js 16.0.3 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **文件解析**: xlsx (Excel) + 原生CSV解析
- **UI组件**: Tailwind CSS + Shadcn UI
- **认证**: Supabase Auth
- **部署**: Vercel

---

## ⚠️ 注意事项

### 数据安全
1. 执行清空脚本前务必备份重要数据
2. 测试环境先验证后再在生产环境操作
3. 导入大量数据时建议分批进行

### 权限管理
1. 只有管理员 (role='admin') 可以访问导入功能
2. 确保管理员账号安全

### 性能考虑
1. 单次导入建议不超过1000条
2. Excel文件建议不超过10MB
3. 大量数据导入可能需要几分钟时间

### 数据质量
1. 确保必填字段完整
2. 类别必须完全匹配标准名称
3. 建议统一年份和季节的格式

---

## 🐛 常见问题

### Q1: 导入时提示 "只有管理员可以导入数据"
**A:** 检查当前登录用户的role是否为'admin'

```sql
-- 查询用户角色
SELECT id, username, display_name, role
FROM user_profiles
WHERE id = 'your-user-id';

-- 将用户设置为管理员
UPDATE user_profiles
SET role = 'admin'
WHERE id = 'your-user-id';
```

### Q2: CSV文件解析乱码
**A:** 确保CSV文件编码为UTF-8
- Excel另存为CSV时选择 "CSV UTF-8 (逗号分隔)"

### Q3: 导入后书籍不显示
**A:**
1. 检查数据库中是否有数据
2. 清除浏览器缓存
3. 检查Supabase RLS策略

### Q4: 如何批量修改已导入的数据
**A:**
1. 导出数据 (使用设置页面的导出功能)
2. 修改导出的JSON或CSV
3. 清空books表
4. 重新导入修改后的数据

---

## 🎯 下一步计划

根据需要,可以继续实现以下功能:

- [ ] 层级导航组件 (面包屑式浏览)
- [ ] 高级筛选功能 (按书院、年份、季节筛选)
- [ ] 数据导出功能 (按层级导出)
- [ ] 数据统计面板 (按各维度统计)
- [ ] 批量编辑功能
- [ ] 数据版本控制

---

## 📞 技术支持

如遇问题:
1. 查看浏览器控制台错误信息
2. 查看服务器日志 (`npm run dev` 输出)
3. 查看Supabase Dashboard的日志
4. 参考本文档和相关文档

---

**文档版本**: 1.0.0
**创建日期**: 2025-01-26
**作者**: Claude
**状态**: ✅ 实施就绪
