/**
 * 分析导入失败的数据
 */

const fs = require('fs');
const iconv = require('iconv-lite');

// 六个标准类别
const VALID_CATEGORIES = ['经学', '史学', '掌故', '算学', '舆地', '词章'];

// 验证导入数据
function validateBookData(data, index) {
  const errors = [];

  // 必填字段验证
  if (!data.library_type || !['课题库', '课艺库'].includes(data.library_type)) {
    errors.push(`library_type必须是'课题库'或'课艺库' (当前: ${data.library_type})`);
  }

  if (!data.academy || typeof data.academy !== 'string' || data.academy.trim() === '') {
    errors.push('academy(书院)不能为空');
  }

  if (!data.year || typeof data.year !== 'string' || data.year.trim() === '') {
    errors.push('year(年份)不能为空');
  }

  if (!data.season || typeof data.season !== 'string' || data.season.trim() === '') {
    errors.push('season(季节)不能为空');
  }

  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`category必须是以下之一: ${VALID_CATEGORIES.join('、')} (当前: ${data.category})`);
  }

  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim() === '') {
    errors.push('subject(题目)不能为空');
  }

  // 课艺库特殊验证
  if (data.library_type === '课艺库' && data.has_full_text && !data.file_url) {
    errors.push('课艺库且has_full_text=true时必须提供file_url');
  }

  return {
    valid: errors.length === 0,
    errors,
    index,
    data,
  };
}

// 解析CSV
function parseCSV(text) {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // 简单的CSV解析
    const values = line.split(',');
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim() || '';
    });

    // 只保留有效数据
    if (obj.subject && obj.subject.trim()) {
      data.push(obj);
    }
  }

  return data;
}

async function analyzeFailedData() {
  try {
    console.log('📊 开始分析导入失败的数据...\n');

    // 读取课题库
    console.log('📖 读取课题库CSV...');
    const ketiData = fs.readFileSync('./shujuku/求志书院课题库.csv');
    const ketiText = iconv.decode(ketiData, 'gbk');
    const ketiBooks = parseCSV(ketiText);
    console.log(`  课题库: ${ketiBooks.length} 条`);

    // 读取课艺库
    console.log('📚 读取课艺库CSV...');
    const keyiData = fs.readFileSync('./shujuku/求志书院课艺库.csv');
    const keyiText = iconv.decode(keyiData, 'gbk');
    const keyiBooks = parseCSV(keyiText);
    console.log(`  课艺库: ${keyiBooks.length} 条`);

    // 合并数据
    const allBooks = [...ketiBooks, ...keyiBooks];
    console.log(`\n总计: ${allBooks.length} 条数据\n`);

    // 验证所有数据
    console.log('🔍 开始验证数据...\n');

    const validationResults = allBooks.map((book, index) =>
      validateBookData(book, index)
    );

    const invalidBooks = validationResults.filter((r) => !r.valid);
    const validBooks = validationResults.filter((r) => r.valid);

    console.log(`✅ 有效数据: ${validBooks.length} 条`);
    console.log(`❌ 无效数据: ${invalidBooks.length} 条\n`);

    if (invalidBooks.length > 0) {
      console.log('=== 无效数据详细信息 ===\n');

      // 统计错误类型
      const errorTypeCount = {};
      invalidBooks.forEach((result) => {
        result.errors.forEach((error) => {
          const errorType = error.split('(')[0].trim();
          errorTypeCount[errorType] = (errorTypeCount[errorType] || 0) + 1;
        });
      });

      console.log('错误类型统计:');
      Object.entries(errorTypeCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count} 次`);
        });

      console.log('\n前20条无效数据详情:\n');
      invalidBooks.slice(0, 20).forEach((result, idx) => {
        console.log(`${idx + 1}. 索引 ${result.index}:`);
        console.log(`   数据:`, JSON.stringify(result.data, null, 2));
        console.log(`   错误:`, result.errors.join('; '));
        console.log('');
      });

      // 保存所有无效数据到文件
      const invalidDataReport = {
        total: invalidBooks.length,
        errorTypeCount,
        invalidBooks: invalidBooks.map((r) => ({
          index: r.index,
          data: r.data,
          errors: r.errors,
        })),
      };

      fs.writeFileSync(
        './invalid-books-report.json',
        JSON.stringify(invalidDataReport, null, 2),
        'utf-8'
      );

      console.log('\n📄 完整报告已保存到: invalid-books-report.json');
    }

    // 统计类别分布
    console.log('\n=== 类别分布统计 ===\n');
    const categoryCounts = {};
    allBooks.forEach((book) => {
      const cat = book.category || '未知';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const isValid = VALID_CATEGORIES.includes(cat);
        const status = isValid ? '✓' : '✗';
        console.log(`  ${status} ${cat}: ${count} 条`);
      });

  } catch (error) {
    console.error('\n❌ 分析失败:', error.message);
    console.error(error.stack);
  }
}

// 执行分析
analyzeFailedData();
