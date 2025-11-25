# Excel 数据库使用指南

## 🎉 恭喜！

您的古籍典藏平台已经搭建完成，并使用 **Excel 作为数据库**！这意味着您可以立即开始使用，无需任何额外配置。

---

## 📊 数据存储位置

### Excel 数据文件
- **位置**：`d:\work\keyi\guji-platform\data\books.xlsx`
- **格式**：标准 Excel 工作簿
- **工作表名**：`Books`

### 上传的文件
- **位置**：`d:\work\keyi\guji-platform\public\uploads\`
- **访问方式**：通过 `/uploads/文件名` 路径访问

---

## 🚀 如何使用

### 方法一：通过网页界面上传（推荐）

1. **启动开发服务器**（如果还没启动）：
   ```bash
   cd d:\work\keyi\guji-platform
   npm run dev
   ```

2. **打开浏览器**访问：
   - [http://localhost:3000](http://localhost:3000)

3. **上传古籍**：
   - 点击顶部导航栏的"上传古籍"
   - 填写书籍信息（书名、作者、朝代、分类、简介）
   - 选择 PDF 或图片文件
   - 点击"上传古籍"按钮

4. **浏览书库**：
   - 点击"书库"查看所有古籍
   - 使用搜索框搜索书名或作者
   - 使用筛选器按分类或朝代过滤

### 方法二：直接编辑 Excel 文件

1. **打开 Excel 文件**：
   ```
   d:\work\keyi\guji-platform\data\books.xlsx
   ```

2. **添加数据行**（参考格式）：

| id | title | author | dynasty | category | description | cover_url | file_url | file_type | page_count | view_count | created_at | updated_at |
|----|-------|--------|---------|----------|-------------|-----------|----------|-----------|------------|------------|------------|------------|
| abc-123 | 论语 | 孔子 | 先秦 | 经部 | 儒家经典著作 | | /uploads/test.pdf | pdf | 100 | 0 | 2025-11-24T10:00:00Z | 2025-11-24T10:00:00Z |

3. **字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| id | 文本 | 是 | 唯一标识符（可以随意填写，如：book-001） |
| title | 文本 | 是 | 书名 |
| author | 文本 | 是 | 作者 |
| dynasty | 文本 | 是 | 朝代（先秦/秦汉/魏晋南北朝/隋唐/宋元/明清/近现代/未知） |
| category | 文本 | 是 | 分类（经部/史部/子部/集部/其他） |
| description | 文本 | 否 | 简介描述 |
| cover_url | 文本 | 否 | 封面图 URL |
| file_url | 文本 | 是 | 文件路径（如：/uploads/xxx.pdf） |
| file_type | 文本 | 是 | 文件类型（pdf 或 images） |
| page_count | 数字 | 否 | 页数 |
| view_count | 数字 | 否 | 阅读量（默认 0） |
| created_at | 日期 | 否 | 创建时间（ISO 8601 格式） |
| updated_at | 日期 | 否 | 更新时间（ISO 8601 格式） |

4. **保存文件**

5. **刷新网页**查看新添加的数据

---

## 📝 示例数据

您可以直接复制以下数据到 Excel 中进行测试：

```
id: book-001
title: 论语
author: 孔子
dynasty: 先秦
category: 经部
description: 儒家经典著作，记录了孔子及其弟子的言行
file_url: https://example.com/test.pdf
file_type: pdf
page_count: 200
view_count: 0
created_at: 2025-11-24T10:00:00Z
updated_at: 2025-11-24T10:00:00Z

id: book-002
title: 史记
author: 司马迁
dynasty: 秦汉
category: 史部
description: 中国第一部纪传体通史
file_url: https://example.com/test2.pdf
file_type: pdf
page_count: 526
view_count: 0
created_at: 2025-11-24T10:00:00Z
updated_at: 2025-11-24T10:00:00Z
```

---

## 🔍 功能特性

### ✅ 已实现的功能

1. **完整的 CRUD 操作**：
   - ✅ 创建（上传古籍）
   - ✅ 读取（浏览书库）
   - ✅ 更新（API 支持，暂无界面）
   - ✅ 删除（API 支持，暂无界面）

2. **搜索与筛选**：
   - ✅ 按书名搜索
   - ✅ 按作者搜索
   - ✅ 按分类筛选
   - ✅ 按朝代筛选
   - ✅ 组合筛选

3. **文件上传**：
   - ✅ 支持 PDF 文件
   - ✅ 支持图片文件
   - ✅ 本地存储到 public/uploads/
   - ✅ 自动生成唯一文件名

4. **响应式设计**：
   - ✅ 移动端适配
   - ✅ 平板端适配
   - ✅ 桌面端适配

---

## 📋 API 接口

### 1. 获取书籍列表
```
GET /api/books
参数：
  - search: 搜索关键词（可选）
  - category: 分类筛选（可选）
  - dynasty: 朝代筛选（可选）
```

### 2. 添加书籍
```
POST /api/books
Body: {
  "title": "书名",
  "author": "作者",
  "dynasty": "朝代",
  "category": "分类",
  "description": "简介",
  "file_url": "/uploads/xxx.pdf",
  "file_type": "pdf"
}
```

### 3. 更新书籍
```
PATCH /api/books
Body: {
  "id": "书籍ID",
  "title": "新书名"
  ... 其他要更新的字段
}
```

### 4. 删除书籍
```
DELETE /api/books?id=书籍ID
```

### 5. 上传文件
```
POST /api/upload
Body: FormData with 'file' field
```

---

## 🛠️ 技术实现

### Excel 数据库库（lib/excel-db.ts）

核心功能：
- `getAllBooks()` - 获取所有书籍
- `addBook()` - 添加新书籍
- `updateBook()` - 更新书籍
- `deleteBook()` - 删除书籍
- `filterBooks()` - 筛选书籍
- `initializeExcel()` - 初始化 Excel 文件

### 文件结构
```
guji-platform/
├── data/
│   └── books.xlsx           # Excel 数据文件
├── public/
│   └── uploads/             # 上传的文件
├── lib/
│   └── excel-db.ts          # Excel 数据库工具
├── app/
│   ├── api/
│   │   ├── books/route.ts   # 书籍 CRUD API
│   │   └── upload/route.ts  # 文件上传 API
│   ├── books/page.tsx       # 书库页面
│   └── upload/page.tsx      # 上传页面
```

---

## 💡 使用建议

### 优点
✅ **零配置**：无需 Supabase 或数据库配置
✅ **本地存储**：数据完全在本地，私密安全
✅ **易于编辑**：可以直接用 Excel 批量编辑数据
✅ **易于备份**：直接复制 data/ 和 public/uploads/ 文件夹
✅ **快速上手**：立即可用，无需等待

### 限制
⚠️ **并发限制**：同一时间只能一个人访问
⚠️ **性能限制**：数据量过大（>1000条）时会变慢
⚠️ **无用户系统**：没有认证和权限管理
⚠️ **仅限本地**：无法公网访问

### 适用场景
✅ 个人使用
✅ 小型图书馆（< 500 本）
✅ 快速原型验证
✅ 学习和测试

### 何时升级到 Supabase？
当您需要以下功能时，建议升级：
- 🌐 公网访问
- 👥 多用户协作
- 🔐 用户认证和权限
- 📊 大量数据（> 500 本）
- ☁️ 云端备份

---

## 🔄 迁移到 Supabase

如果将来需要升级到 Supabase，非常简单：

1. **配置 Supabase**（参考 [QUICKSTART.md](./QUICKSTART.md)）

2. **导出 Excel 数据**：
   - 打开 `data/books.xlsx`
   - 复制所有数据

3. **导入到 Supabase**：
   - 在 Supabase Dashboard 的 Table Editor 中
   - 粘贴数据到 books 表

4. **切换代码**（只需修改 API 路由）：
   ```typescript
   // 从
   import { filterBooks } from '@/lib/excel-db';

   // 改为
   import { supabase } from '@/lib/supabase';
   ```

---

## ❓ 常见问题

### 1. 找不到 data/books.xlsx 文件？
**答**：首次访问网页时会自动创建。如果没有创建，请检查控制台是否有错误。

### 2. 上传的文件在哪里？
**答**：在 `public/uploads/` 文件夹中，可以通过浏览器直接访问 `http://localhost:3000/uploads/文件名`

### 3. 如何备份数据？
**答**：复制两个文件夹：
- `data/` （包含 Excel 数据库）
- `public/uploads/` （包含上传的文件）

### 4. Excel 文件损坏了怎么办？
**答**：删除 `data/books.xlsx`，系统会自动创建新的空文件。如果有备份，直接还原备份文件即可。

### 5. 能否批量导入古籍？
**答**：可以！直接在 Excel 中批量填写数据，保存后刷新网页即可看到。

### 6. 支持多人同时使用吗？
**答**：Excel 数据库不支持多人并发写入。如果需要多人协作，请升级到 Supabase。

---

## 📞 需要帮助？

- 查看完整文档：[README.md](./README.md)
- 快速开始指南：[QUICKSTART.md](./QUICKSTART.md)
- 项目总结：[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

**祝您使用愉快！** 📚✨
