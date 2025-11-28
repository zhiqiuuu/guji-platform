/**
 * 修复并导入"性理"类别的数据
 * 将"性理"映射为"经学"
 */

const fs = require('fs');
const iconv = require('iconv-lite');

const BASE_URL = 'http://localhost:3000';

// 存储认证cookie
let authCookie = '';

// 登录
async function login() {
  console.log('🔐 登录管理员账号...\n');

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'lzh@guji.com',
      password: '51274101007',
    }),
  });

  if (!loginResponse.ok) {
    const error = await loginResponse.json();
    throw new Error(`登录失败: ${error.error}`);
  }

  const result = await loginResponse.json();
  console.log(`✅ 登录成功: ${result.user.email}\n`);

  // 获取cookie
  const setCookie = loginResponse.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie;
  }

  // 设置为管理员
  await fetch(`${BASE_URL}/api/dev/set-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: result.user.id,
    }),
  });

  console.log('✅ 已设置为管理员\n');
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

    const values = line.split(',');
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim() || '';
    });

    if (obj.subject && obj.subject.trim()) {
      data.push(obj);
    }
  }

  return data;
}

async function importXinliData() {
  try {
    console.log('🚀 开始修复并导入性理数据...\n');

    // 登录
    await login();

    // 读取课题库
    console.log('📖 读取课题库CSV...');
    const ketiData = fs.readFileSync('./shujuku/求志书院课题库.csv');
    const ketiText = iconv.decode(ketiData, 'gbk');
    const ketiBooks = parseCSV(ketiText);

    // 筛选出性理类别的数据
    const xinliBooks = ketiBooks.filter((book) => book.category === '性理');
    console.log(`  找到 ${xinliBooks.length} 条性理数据\n`);

    if (xinliBooks.length === 0) {
      console.log('✅ 没有需要修复的数据');
      return;
    }

    // 将性理映射为经学
    const fixedBooks = xinliBooks.map((book) => ({
      ...book,
      category: '经学',
      original_category: '性理', // 保留原始类别信息
    }));

    console.log('📝 修复数据预览(前5条):');
    fixedBooks.slice(0, 5).forEach((book, idx) => {
      console.log(`  ${idx + 1}. ${book.subject} (${book.original_category} → ${book.category})`);
    });
    console.log('');

    // 导入修复后的数据
    console.log('🔄 开始导入修复后的数据...\n');

    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < fixedBooks.length; i += batchSize) {
      const batch = fixedBooks.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(fixedBooks.length / batchSize);

      process.stdout.write(
        `  批次 ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, fixedBooks.length)})... `
      );

      try {
        const response = await fetch(`${BASE_URL}/api/books/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
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
            result.invalidBooks.slice(0, 3).forEach((invalid) => {
              console.log(`      - ${invalid.errors.join('; ')}`);
            });
          }
        }
      } catch (error) {
        errorCount += batch.length;
        console.log(`✗ 错误: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n=== 导入完成 ===');
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    console.log(`📈 成功率: ${((successCount / fixedBooks.length) * 100).toFixed(2)}%`);

    // 保存修复报告
    const report = {
      totalFixed: fixedBooks.length,
      successCount,
      errorCount,
      mapping: '性理 → 经学',
      fixedBooks: fixedBooks.map((b) => ({
        year: b.year,
        season: b.season,
        subject: b.subject,
        original_category: b.original_category,
        new_category: b.category,
      })),
    };

    fs.writeFileSync('./xinli-fix-report.json', JSON.stringify(report, null, 2), 'utf-8');
    console.log('\n📄 修复报告已保存到: xinli-fix-report.json');
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
importXinliData();
