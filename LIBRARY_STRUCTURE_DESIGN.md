# 书库数据结构设计文档

## 概述

本文档描述了古籍典藏平台的书库数据结构,支持两种书库类型:**课题库**和**课艺库**。

## 数据库结构

### Books 表新增字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `library_type` | VARCHAR(50) | 书库类型 | '课题库' 或 '课艺库' |
| `academy` | VARCHAR(200) | 书院名称 | '诂经精舍' |
| `year` | VARCHAR(50) | 年份 | '1850' 或 '道光三十年' |
| `season` | VARCHAR(50) | 季节 | '春'、'夏'、'秋'、'冬' |
| `subject` | VARCHAR(500) | 题目 | '论语·学而篇' |
| `custom_hierarchy` | JSONB | 自定义层级结构 | `{"level1": "某书院", "level2": "1850", ...}` |
| `has_full_text` | BOOLEAN | 是否有正文 | true/false |

### 标准类别

所有书籍必须属于以下六个类别之一:

- 📚 **经学** - 儒家经典研究
- 📜 **史学** - 历史典籍研究
- 📖 **掌故** - 典章制度
- 🔢 **算学** - 数学计算
- 🗺️ **舆地** - 地理方志
- ✍️ **词章** - 文学创作

## 两种书库类型

### 1. 课题库 (只有题目,无正文)

**层级结构:** 4级
```
书院 → 年份 → 季节 → 类别 → [题目列表]
```

**数据示例:**
```json
{
  "library_type": "课题库",
  "academy": "诂经精舍",
  "year": "1850",
  "season": "春",
  "category": "经学",
  "subject": "论语·学而篇",
  "custom_hierarchy": {
    "level1": "诂经精舍",
    "level2": "1850",
    "level3": "春",
    "level4": "经学"
  },
  "has_full_text": false,
  "title": "诂经精舍 1850年春 经学 - 论语·学而篇",
  "author": "未知",
  "dynasty": "清"
}
```

**显示效果:**
```
诂经精舍
  └─ 1850年
      └─ 春
          └─ 经学
              ├─ 论语·学而篇
              ├─ 孟子·梁惠王篇
              └─ 大学章句
```

### 2. 课艺库 (有完整正文)

**层级结构:** 5级
```
书院 → 年份 → 季节 → 类别 → 题目 → [具体文章]
```

**数据示例:**
```json
{
  "library_type": "课艺库",
  "academy": "诂经精舍",
  "year": "1850",
  "season": "春",
  "category": "史学",
  "subject": "史记·项羽本纪",
  "custom_hierarchy": {
    "level1": "诂经精舍",
    "level2": "1850",
    "level3": "春",
    "level4": "史学",
    "level5": "史记·项羽本纪"
  },
  "has_full_text": true,
  "title": "诂经精舍 1850年春 史学 - 史记·项羽本纪",
  "author": "某生员",
  "dynasty": "清",
  "description": "论项羽之兴亡...",
  "file_url": "/uploads/...",
  "file_type": "pdf"
}
```

**显示效果:**
```
诂经精舍
  └─ 1850年
      └─ 春
          └─ 史学
              └─ 史记·项羽本纪
                  ├─ 论项羽之兴亡(张三)
                  ├─ 项羽性格分析(李四)
                  └─ 鸿门宴考(王五)
```

## 自定义层级系统

### 灵活性设计

`custom_hierarchy` 字段使用 JSONB 格式,支持任意层级和自定义标题:

```json
{
  "level1": "自定义一级标题",
  "level2": "自定义二级标题",
  "level3": "自定义三级标题",
  "level4": "自定义四级标题",
  "level5": "自定义五级标题",
  "level6": "扩展层级...",
  "custom_field": "任意自定义字段"
}
```

### 使用示例

**示例1: 标准格式**
```json
{
  "academy": "诂经精舍",
  "year": "1850",
  "season": "春",
  "category": "经学"
}
```

**示例2: 自定义格式**
```json
{
  "institution": "某学堂",
  "period": "道光三十年",
  "term": "春季学期",
  "subject_type": "经学",
  "extra_info": "第一次月考"
}
```

## 数据导入格式

### CSV 导入模板

#### 课题库 CSV:
```csv
library_type,academy,year,season,category,subject,author,dynasty
课题库,诂经精舍,1850,春,经学,论语·学而篇,未知,清
课题库,诂经精舍,1850,春,经学,孟子·梁惠王篇,未知,清
课题库,诂经精舍,1850,夏,史学,史记·项羽本纪,未知,清
```

#### 课艺库 CSV:
```csv
library_type,academy,year,season,category,subject,author,dynasty,description,file_url
课艺库,诂经精舍,1850,春,史学,史记·项羽本纪,张三,清,论项羽之兴亡...,/uploads/file1.pdf
课艺库,诂经精舍,1850,春,词章,登高赋,李四,清,秋日登高有感...,/uploads/file2.pdf
```

### Excel 导入模板

创建两个工作表:
- **Sheet1: 课题库**
- **Sheet2: 课艺库**

列结构与CSV相同。

## API 接口设计

### 1. 按层级浏览

```typescript
GET /api/books/hierarchy?library_type=课题库&level=1

// 响应
{
  "academies": [
    {
      "name": "诂经精舍",
      "count": 150
    },
    {
      "name": "学海堂",
      "count": 120
    }
  ]
}
```

### 2. 获取下级内容

```typescript
GET /api/books/hierarchy?academy=诂经精舍&year=1850&season=春&category=经学

// 响应
{
  "subjects": [
    {
      "id": "uuid-1",
      "subject": "论语·学而篇",
      "has_full_text": false
    },
    {
      "id": "uuid-2",
      "subject": "孟子·梁惠王篇",
      "has_full_text": false
    }
  ]
}
```

### 3. 搜索

```typescript
POST /api/books/search
{
  "library_type": "课艺库",
  "academy": "诂经精舍",
  "year": "1850",
  "category": "史学",
  "keyword": "项羽"
}
```

## 前端展示设计

### 层级导航组件

```typescript
interface HierarchyNode {
  level: number;
  label: string;
  value: string;
  children?: HierarchyNode[];
  count?: number;
}

// 课题库导航
const topicLibraryStructure: HierarchyNode[] = [
  {
    level: 1,
    label: "书院",
    value: "诂经精舍",
    count: 150,
    children: [
      {
        level: 2,
        label: "年份",
        value: "1850",
        children: [
          {
            level: 3,
            label: "季节",
            value: "春",
            children: [
              {
                level: 4,
                label: "类别",
                value: "经学",
                count: 25
              }
            ]
          }
        ]
      }
    ]
  }
];
```

### 面包屑导航

```
首页 > 课题库 > 诂经精舍 > 1850年 > 春 > 经学 > 论语·学而篇
```

## 数据迁移步骤

### 步骤 1: 备份现有数据

```sql
-- 导出现有数据
COPY public.books TO '/backup/books_backup.csv' WITH CSV HEADER;
```

### 步骤 2: 清空数据

在 Supabase Dashboard 执行:
```sql
-- 使用提供的清空脚本
-- supabase/migrations/20250126_clear_all_books.sql
```

### 步骤 3: 更新表结构

```sql
-- 使用提供的结构更新脚本
-- supabase/migrations/20250126_redesign_books_structure.sql
```

### 步骤 4: 导入新数据

使用提供的CSV模板或Excel工具导入数据。

## 数据验证规则

1. **library_type**: 必须是 '课题库' 或 '课艺库'
2. **category**: 必须是六个标准类别之一
3. **academy**: 不能为空
4. **year**: 不能为空
5. **season**: 建议使用 '春'、'夏'、'秋'、'冬'
6. **subject**: 不能为空
7. **has_full_text**: 课题库必须为 false,课艺库建议为 true
8. **file_url**: 课艺库且 has_full_text=true 时必须提供

## 查询示例

### 查询某书院某年的所有课题

```sql
SELECT
  academy,
  year,
  season,
  category,
  subject
FROM books
WHERE library_type = '课题库'
  AND academy = '诂经精舍'
  AND year = '1850'
ORDER BY season, category, subject;
```

### 统计各书院的文章数量

```sql
SELECT
  academy,
  library_type,
  COUNT(*) as total,
  COUNT(CASE WHEN has_full_text THEN 1 END) as with_text
FROM books
GROUP BY academy, library_type
ORDER BY total DESC;
```

### 按类别统计

```sql
SELECT
  category,
  COUNT(*) as count
FROM books
WHERE library_type = '课艺库'
  AND has_full_text = true
GROUP BY category
ORDER BY count DESC;
```

## 注意事项

1. **数据一致性**: 确保同一书院的年份、季节格式统一
2. **性能优化**: 对常用查询字段建立索引
3. **扩展性**: custom_hierarchy 字段预留了未来扩展空间
4. **灵活性**: 可以随时调整层级结构而不影响现有数据
5. **兼容性**: 保留了原有的 title、author、dynasty 字段以保持向后兼容

## 下一步

1. ✅ 清空现有图书数据
2. ✅ 更新数据库表结构
3. 📝 创建数据导入工具
4. 🎨 设计新的前端层级导航
5. 📊 实现高级筛选和搜索功能
