# 段落级精细搜索功能实施指南

## 📋 功能概述

本次更新为古籍平台新增了段落级精细搜索功能,实现以下特性:

- ✅ 按句号、问号、感叹号等标点符号分割段落
- ✅ PostgreSQL 全文搜索索引
- ✅ 搜索结果显示匹配段落及前后各1个段落的上下文
- ✅ 关键词高亮显示
- ✅ 保留原有 `full_text` 字段,新增 `book_paragraphs` 表
- ✅ 支持5000本书籍规模

---

## 🗂️ 新增文件清单

### 1. 数据库迁移文件
- `supabase/migrations/20250125_create_book_paragraphs.sql`
  - 创建 `book_paragraphs` 表
  - 创建全文搜索索引
  - 创建搜索函数 `search_book_paragraphs`

### 2. 类型定义
- 更新 `types/database.ts` - 新增 `book_paragraphs` 表类型
- 更新 `types/index.ts` - 新增段落相关类型

### 3. 核心功能模块
- `lib/paragraph-splitter.ts` - 段落分割工具
- `lib/paragraph-db.ts` - 段落数据库操作
- 更新 `lib/ocr-client-service.ts` - 新增详细OCR结果返回

### 4. API接口
- `app/api/search/paragraphs/route.ts` - 段落搜索API
- `app/api/paragraphs/save/route.ts` - 段落保存API

### 5. 前端组件
- `components/ParagraphSearchResults.tsx` - 搜索结果展示组件
- `app/search/page.tsx` - 高级搜索页面

---

## 🚀 部署步骤

### 第一步:执行数据库迁移

```bash
cd guji-platform

# 方法1: 使用 Supabase CLI (推荐)
supabase db push

# 方法2: 手动在 Supabase Dashboard 执行
# 1. 登录 Supabase Dashboard
# 2. 进入 SQL Editor
# 3. 复制 supabase/migrations/20250125_create_book_paragraphs.sql 内容
# 4. 执行 SQL
```

### 第二步:验证数据库表

在 Supabase Dashboard 中检查:
```sql
-- 检查表是否创建成功
SELECT * FROM book_paragraphs LIMIT 1;

-- 检查搜索函数是否存在
SELECT search_book_paragraphs('测试', 10);
```

### 第三步:更新现有书籍数据(可选)

如果你已有书籍数据,可以使用以下方法为现有书籍生成段落:

```typescript
// 在浏览器控制台或创建一个脚本
import { extractParagraphsFromFullText } from '@/lib/paragraph-splitter';
import { saveParagraphs } from '@/lib/paragraph-db';

// 为单本书生成段落
async function generateParagraphsForBook(bookId: string, fullText: string) {
  const paragraphs = extractParagraphsFromFullText(fullText);
  const pageTexts = paragraphs.map(p => ({
    page_number: p.page_number,
    text: p.content,
  }));

  await saveParagraphs(bookId, pageTexts);
}
```

### 第四步:修改 OCR 流程(重要!)

需要修改 OCR 处理流程,在保存 `full_text` 的同时保存段落数据。

找到你的 OCR 处理代码(可能在 `app/api/ocr/complete/route.ts` 或相关文件),添加段落保存逻辑:

```typescript
import { saveParagraphs } from '@/lib/paragraph-db';

// OCR 完成后
const ocrResult = await ocrService.extractTextFromPDFDetailed(pdfUrl, options);

// 1. 保存 full_text
await updateBook(bookId, {
  full_text: ocrResult.fullText,
  ocr_status: 'completed',
});

// 2. 保存段落
await saveParagraphs(bookId, ocrResult.pageTexts);
```

### 第五步:部署前端代码

```bash
# 安装依赖(如需要)
npm install lucide-react

# 构建
npm run build

# 部署到 Vercel
vercel --prod
```

---

## 📖 使用方法

### 1. 访问搜索页面

```
https://your-domain.com/search
```

### 2. API 调用示例

**段落搜索:**
```bash
GET /api/search/paragraphs?query=关键词&limit=50

# 响应
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "book_id": "uuid",
      "page_number": 5,
      "paragraph_index": 2,
      "content": "匹配的段落内容...",
      "prev_paragraph": "前一个段落...",
      "next_paragraph": "后一个段落...",
      "book_title": "论语",
      "book_author": "孔子",
      "rank": 0.85
    }
  ],
  "count": 1
}
```

**保存段落:**
```bash
POST /api/paragraphs/save

# 请求体
{
  "bookId": "uuid",
  "pageTexts": [
    {
      "page_number": 1,
      "text": "第一页的文本内容..."
    },
    {
      "page_number": 2,
      "text": "第二页的文本内容..."
    }
  ]
}
```

---

## 🔧 配置说明

### 段落分割规则

在 `lib/paragraph-splitter.ts` 中定义:

```typescript
// 当前分割规则: 句号、问号、感叹号、分号、双换行
const segments = text.split(/([。!?!?;;]+|\n\n+)/);
```

如需修改分割规则,编辑此正则表达式。

### 搜索结果数量

默认返回50条结果,可在 API 调用时指定:

```typescript
const limit = 100; // 最多返回100条
fetch(`/api/search/paragraphs?query=关键词&limit=${limit}`);
```

### 中文分词配置

当前使用 PostgreSQL 的 `simple` 配置(不分词),适合中文搜索。

如需更精确的中文分词,可以:
1. 安装 pg_jieba 扩展
2. 修改 `20250125_create_book_paragraphs.sql` 中的分词配置

```sql
-- 从
to_tsvector('simple', COALESCE(NEW.content, ''))

-- 改为
to_tsvector('jiebacfg', COALESCE(NEW.content, ''))
```

---

## 🎯 性能优化建议

### 1. 批量导入优化

如果需要为大量现有书籍生成段落,建议使用后台任务:

```typescript
// 创建一个批量处理脚本
async function batchGenerateParagraphs() {
  const books = await getAllBooks();

  for (const book of books) {
    if (book.full_text) {
      await generateParagraphsForBook(book.id, book.full_text);
      console.log(`处理完成: ${book.title}`);

      // 避免过载,添加延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### 2. 搜索性能监控

```sql
-- 查看索引使用情况
EXPLAIN ANALYZE
SELECT * FROM search_book_paragraphs('测试关键词', 50);

-- 如果查询慢,可以调整索引
CREATE INDEX CONCURRENTLY idx_book_paragraphs_content_gin
ON book_paragraphs USING GIN(to_tsvector('simple', content));
```

### 3. 缓存策略

对于热门搜索关键词,可以添加 Redis 缓存:

```typescript
// 示例: 使用 Next.js 的 unstable_cache
import { unstable_cache } from 'next/cache';

export const searchParagraphsCached = unstable_cache(
  async (query: string) => searchParagraphs(query),
  ['paragraph-search'],
  { revalidate: 3600 } // 1小时缓存
);
```

---

## 🐛 故障排查

### 问题1: 搜索无结果

**检查清单:**
1. 数据库表是否创建成功
2. 段落数据是否已保存
3. 搜索函数是否可用

```sql
-- 检查段落数据
SELECT COUNT(*) FROM book_paragraphs;

-- 测试搜索函数
SELECT * FROM search_book_paragraphs('测试', 10);
```

### 问题2: OCR后段落未保存

**检查:**
1. OCR流程是否调用了 `saveParagraphs`
2. 查看服务器日志中的错误信息
3. 检查 API 返回状态

### 问题3: 中文搜索不准确

**解决方案:**
- 当前使用 `simple` 配置,不进行分词
- 如需更好的中文支持,安装 pg_jieba 或使用 Elasticsearch

---

## 📚 相关文档

- [PostgreSQL 全文搜索](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase 数据库函数](https://supabase.com/docs/guides/database/functions)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🎉 功能演示

### 搜索流程

1. 用户访问 `/search`
2. 输入搜索关键词
3. 系统在 `book_paragraphs` 表中全文搜索
4. 返回匹配段落及上下文
5. 点击"查看原文"跳转到书籍详情页

### 数据流程

```
OCR处理 → 提取文本 → 分割段落 → 保存到数据库
                                    ↓
                            创建全文搜索索引
                                    ↓
用户搜索 → API调用 → 数据库查询 → 返回结果 → 前端展示
```

---

## ✅ 验收标准

- [ ] 数据库表和索引创建成功
- [ ] 新增书籍时自动保存段落
- [ ] 搜索功能正常工作
- [ ] 搜索结果显示上下文
- [ ] 关键词高亮显示
- [ ] 点击"查看原文"可跳转
- [ ] 性能满足要求(5000本书规模)

---

## 📞 技术支持

如有问题,请检查:
1. Supabase Dashboard 中的数据库日志
2. Next.js 服务器控制台输出
3. 浏览器开发者工具的网络请求

---

**更新日期:** 2025-01-25
**版本:** 1.0.0
