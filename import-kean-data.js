const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * 导入课案汇录数据到系统
 * 通过调用 /api/books/import 接口
 */

async function importCSVData() {
  const ketikuCsvPath = path.join(__dirname, 'shujuyangli', '晚清书院课题库_课案汇录.csv');
  const keyikuCsvPath = path.join(__dirname, 'shujuyangli', '晚清书院课艺库_课案汇录.csv');

  console.log('📚 开始导入课案汇录数据...\n');

  // 先登录获取session cookie
  console.log('🔐 正在登录管理员账号...\n');
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'lzh@guji.com',
      password: '51274101007',
    }),
  });

  const loginData = await loginResponse.json();
  if (!loginResponse.ok || !loginData.session) {
    console.error('❌ 登录失败:', loginData.error);
    return;
  }

  // 提取cookie (Supabase使用多个cookie来管理session)
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ 登录成功!\n');

  // 解析CSV文件
  function parseCSV(csvPath) {
    const content = fs.readFileSync(csvPath, 'utf8');
    // 移除BOM
    const lines = content.replace(/^\ufeff/, '').split('\n').filter(line => line.trim());

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // 简单的CSV解析(处理引号内的逗号)
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      records.push(record);
    }

    return records;
  }

  try {
    // 1. 解析课题库CSV
    console.log('📖 解析课题库CSV...');
    const ketikuRecords = parseCSV(ketikuCsvPath);
    console.log(`✅ 课题库: ${ketikuRecords.length}条记录\n`);

    // 2. 解析课艺库CSV
    console.log('📖 解析课艺库CSV...');
    const keyikuRecords = parseCSV(keyikuCsvPath);
    console.log(`✅ 课艺库: ${keyikuRecords.length}条记录\n`);

    // 3. 合并数据
    const allRecords = [...ketikuRecords, ...keyikuRecords];
    console.log(`📊 总计: ${allRecords.length}条记录\n`);

    // 4. 准备导入数据
    const importData = allRecords.map(record => ({
      library_type: record.library_type,
      academy: record.academy,
      year: record.year,
      season: record.season,
      category: record.category,
      subject: record.subject,
      author: record.author || '未知',
      dynasty: record.dynasty || '清',
      description: record.description || null,
      file_url: record.file_url || null,
    }));

    // 5. 调用API导入
    console.log('🚀 调用导入API...\n');

    const apiUrl = 'http://localhost:3001/api/books/import';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '', // 使用登录获取的cookie
      },
      body: JSON.stringify({
        books: importData,
        dryRun: false, // 设为true可以预览不实际导入
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ 导入成功!');
      console.log(`📊 成功导入 ${result.totalBooks} 条记录`);
    } else {
      console.error('❌ 导入失败:', result.error);
      if (result.details) {
        console.error('详细信息:', result.details);
      }
      if (result.invalidBooks) {
        console.error('无效记录:', result.invalidBooks.length, '条');
        result.invalidBooks.slice(0, 3).forEach((invalid, i) => {
          console.error(`  ${i + 1}. 索引 ${invalid.index}:`, invalid.errors);
        });
      }
    }

  } catch (error) {
    console.error('❌ 导入出错:', error.message);
    throw error;
  }
}

// 执行导入
importCSVData().catch(console.error);
