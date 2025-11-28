/**
 * 导入求志书院数据库脚本
 */

const fs = require('fs');
const iconv = require('iconv-lite');

// 解析CSV
function parseCSV(text) {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // 简单的CSV解析(不处理引号中的逗号)
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

async function importData() {
  try {
    console.log('🚀 开始导入求志书院数据...\n');

    // 1. 读取课题库
    console.log('📖 读取课题库CSV...');
    const ketiData = fs.readFileSync('./shujuku/求志书院课题库.csv');
    const ketiText = iconv.decode(ketiData, 'gbk');
    const ketiBooks = parseCSV(ketiText);
    console.log(`  找到 ${ketiBooks.length} 条课题库数据`);

    // 2. 读取课艺库
    console.log('\n📚 读取课艺库CSV...');
    const keyiData = fs.readFileSync('./shujuku/求志书院课艺库.csv');
    const keyiText = iconv.decode(keyiData, 'gbk');
    const keyiBooks = parseCSV(keyiText);
    console.log(`  找到 ${keyiBooks.length} 条课艺库数据`);

    // 3. 合并数据
    const allBooks = [...ketiBooks, ...keyiBooks];
    console.log(`\n📊 总计 ${allBooks.length} 条数据`);

    // 4. 分批导入(每次100条)
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    console.log('\n🔄 开始导入...\n');

    for (let i = 0; i < allBooks.length; i += batchSize) {
      const batch = allBooks.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(allBooks.length / batchSize);

      process.stdout.write(`  批次 ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, allBooks.length)})... `);

      try {
        const response = await fetch('http://localhost:3000/api/books/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            books: batch,
            dryRun: false,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          successCount += batch.length;
          console.log(`✓ 成功`);
        } else {
          errorCount += batch.length;
          console.log(`✗ 失败: ${result.error}`);
          if (result.invalidBooks) {
            console.log(`    验证失败 ${result.invalidBooks.length} 条`);
          }
        }
      } catch (error) {
        errorCount += batch.length;
        console.log(`✗ 错误: ${error.message}`);
      }

      // 稍微延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n=== 导入完成 ===');
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    console.log(`📈 成功率: ${((successCount / allBooks.length) * 100).toFixed(2)}%`);
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    console.error('\n请确保:');
    console.error('1. 开发服务器正在运行 (npm run dev)');
    console.error('2. 数据库连接正常');
    console.error('3. CSV文件位于 ./shujuku/ 目录');
    process.exit(1);
  }
}

// 执行导入
importData();
