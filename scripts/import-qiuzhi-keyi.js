/**
 * 求志书院课艺库数据导入脚本
 *
 * 用法: node scripts/import-qiuzhi-keyi.js [--dry-run]
 *
 * --dry-run: 仅预览数据，不执行实际导入
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// 从 .env.local 读取环境变量
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    vars[key] = val;
  }
  return vars;
}

// 生成 title（复用 import/route.ts 中的逻辑）
function generateTitle(data) {
  const parts = [data.academy, `${data.year}年`, data.season, data.category];
  if (data.subject) {
    parts.push(`- ${data.subject}`);
  }
  return parts.join(' ');
}

// 构建自定义层级结构
function buildCustomHierarchy(data) {
  const hierarchy = {
    level1: data.academy,
    level2: data.year,
    level3: data.season,
    level4: data.category,
  };
  if (data.library_type === '课艺库') {
    hierarchy.level5 = data.subject;
  }
  return hierarchy;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  // 1. 加载环境变量
  const env = loadEnv();
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    console.error('错误: 缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. 读取 Excel 文件
  const xlsxPath = path.join(__dirname, '..', 'shujuku', '求志书院课艺库(1).xlsx');
  console.log(`读取文件: ${xlsxPath}`);

  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const header = rawData[0];
  console.log(`表头: ${header.join(', ')}`);
  console.log(`数据行数: ${rawData.length - 1}`);

  // 3. 映射数据
  // Excel列序: library_type(0), academy(1), year(2), season(3), category(4),
  //            subject(5), author(6), dynasty(7), 等级(8), 作者简略信息(9),
  //            作者详细信息(10), 点评人(11), 点评人身份(12), 正文内容(13), 点评内容(14)
  const books = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[0]) continue; // 跳过空行

    const yearVal = String(row[2] || '').trim();
    const data = {
      library_type: (row[0] || '').toString().trim(),
      academy:      (row[1] || '').toString().trim(),
      year:         yearVal,
      season:       (row[3] || '').toString().trim(),
      category:     (row[4] || '').toString().trim(),
      subject:      (row[5] || '').toString().trim(),
      author:       (row[6] || '未知').toString().trim(),
      dynasty:      (row[7] || '清').toString().trim(),
    };

    const fullText = (row[13] || '').toString().trim() || null;

    const bookRecord = {
      library_type:     data.library_type,
      academy:          data.academy,
      year:             data.year,
      season:           data.season,
      category:         data.category,
      subject:          data.subject,
      title:            generateTitle(data),
      author:           data.author,
      dynasty:          data.dynasty,
      custom_hierarchy: buildCustomHierarchy(data),
      has_full_text:    !!fullText,
      full_text:        fullText,
      rank:             (row[8] || '').toString().trim() || null,
      author_brief:     (row[9] || '').toString().trim() || null,
      author_detail:    (row[10] || '').toString().trim() || null,
      reviewer:         (row[11] || '').toString().trim() || null,
      reviewer_info:    (row[12] || '').toString().trim() || null,
      review_content:   (row[14] || '').toString().trim() || null,
      description:      null,
      file_url:         '',
      file_type:        'pdf',
      ocr_status:       'completed',
      view_count:       0,
    };

    books.push(bookRecord);
  }

  console.log(`\n解析完成，共 ${books.length} 条记录`);
  console.log(`  有正文内容: ${books.filter(b => b.has_full_text).length} 条`);
  console.log(`  有点评内容: ${books.filter(b => b.review_content).length} 条`);

  // 4. 预览前3条
  console.log('\n--- 预览前 3 条 ---');
  for (let i = 0; i < Math.min(3, books.length); i++) {
    const b = books[i];
    console.log(`[${i + 1}] ${b.title}`);
    console.log(`    作者: ${b.author} | 等级: ${b.rank} | 点评人: ${b.reviewer}`);
    console.log(`    正文: ${b.full_text ? b.full_text.substring(0, 60) + '...' : '(无)'}`);
    console.log(`    点评: ${b.review_content || '(无)'}`);
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] 仅预览，未执行实际导入。去掉 --dry-run 参数以执行导入。');
    return;
  }

  // 5. 批量插入（每批50条，避免请求过大）
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  let totalErrors = 0;

  console.log(`\n开始导入，每批 ${BATCH_SIZE} 条...`);

  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const { data: inserted, error } = await supabase
      .from('books')
      .insert(batch)
      .select('id, title');

    if (error) {
      console.error(`第 ${batchNum} 批导入失败:`, error.message);
      totalErrors += batch.length;
    } else {
      totalInserted += inserted.length;
      console.log(`第 ${batchNum} 批: 成功导入 ${inserted.length} 条`);
    }
  }

  console.log(`\n=== 导入完成 ===`);
  console.log(`成功: ${totalInserted} 条`);
  console.log(`失败: ${totalErrors} 条`);
  console.log(`总计: ${books.length} 条`);
}

main().catch((err) => {
  console.error('导入脚本执行出错:', err);
  process.exit(1);
});
