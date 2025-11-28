/**
 * 带身份验证的导入脚本
 */

const fs = require('fs');
const iconv = require('iconv-lite');

const BASE_URL = 'http://localhost:3000';
let authCookie = '';

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

// 登录并获取cookie
async function login() {
  console.log('🔐 登录管理员账号...');

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'lzh@guji.com',
      password: '51274101007',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`登录失败: ${error.error || '未知错误'}`);
  }

  const result = await response.json();

  // 设置为管理员
  console.log('  正在设置管理员权限...');
  const adminRes = await fetch(`${BASE_URL}/api/dev/set-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: result.user.id,
    }),
  });

  if (!adminRes.ok) {
    const adminError = await adminRes.json();
    console.log(`  警告: 设置管理员权限失败: ${adminError.error}`);
  } else {
    console.log('  ✓ 管理员权限已设置');
  }

  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    authCookie = cookies;
  }

  console.log('✓ 登录成功\n');
}

async function importData() {
  try {
    console.log('🚀 开始导入求志书院数据...\n');

    // 1. 登录
    await login();

    // 2. 读取课题库
    console.log('📖 读取课题库CSV...');
    const ketiData = fs.readFileSync('./shujuku/求志书院课题库.csv');
    const ketiText = iconv.decode(ketiData, 'gbk');
    const ketiBooks = parseCSV(ketiText);
    console.log(`  找到 ${ketiBooks.length} 条课题库数据`);

    // 3. 读取课艺库
    console.log('\n📚 读取课艺库CSV...');
    const keyiData = fs.readFileSync('./shujuku/求志书院课艺库.csv');
    const keyiText = iconv.decode(keyiData, 'gbk');
    const keyiBooks = parseCSV(keyiText);
    console.log(`  找到 ${keyiBooks.length} 条课艺库数据`);

    // 4. 合并数据
    const allBooks = [...ketiBooks, ...keyiBooks];
    console.log(`\n📊 总计 ${allBooks.length} 条数据`);

    // 5. 分批导入
    const batchSize = 50; // 减小批次大小
    let successCount = 0;
    let errorCount = 0;

    console.log('\n🔄 开始导入...\n');

    for (let i = 0; i < allBooks.length; i += batchSize) {
      const batch = allBooks.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(allBooks.length / batchSize);

      process.stdout.write(
        `  批次 ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, allBooks.length)})... `
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
          if (result.invalidBooks && result.invalidBooks.length < 5) {
            result.invalidBooks.forEach((inv) => {
              console.log(`    行${inv.index + 1}: ${inv.errors.join(', ')}`);
            });
          }
        }
      } catch (error) {
        errorCount += batch.length;
        console.log(`✗ 错误: ${error.message}`);
      }

      // 延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log('\n=== 导入完成 ===');
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    console.log(`📈 成功率: ${((successCount / allBooks.length) * 100).toFixed(2)}%`);
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行导入
importData();
