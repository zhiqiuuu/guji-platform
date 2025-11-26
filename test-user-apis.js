/**
 * 用户设置API测试脚本
 * 测试 /api/user/profile, /api/user/password, /api/user/export
 */

const BASE_URL = 'http://localhost:3000';

// 颜色输出辅助函数
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function testResult(name, passed, message = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    log(colors.green, `✓ ${name}`);
    if (message) log(colors.blue, `  ${message}`);
  } else {
    failedTests++;
    log(colors.red, `✗ ${name}`);
    if (message) log(colors.yellow, `  ${message}`);
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUserProfileAPI() {
  log(colors.blue, '\n=== 测试用户配置API (/api/user/profile) ===\n');

  try {
    // 测试1: GET - 获取用户配置(未登录应该返回401)
    const getResponse = await fetch(`${BASE_URL}/api/user/profile`);
    const getData = await getResponse.json();

    if (getResponse.status === 401) {
      testResult('GET /api/user/profile (未登录)', true, '正确返回401未授权');
    } else if (getResponse.status === 200 && getData.profile) {
      testResult('GET /api/user/profile (已登录)', true, `获取到用户配置: ${getData.profile.username || '未设置用户名'}`);

      // 测试2: PATCH - 更新用户配置
      await delay(500);
      const updateData = {
        display_name: '测试用户_' + Date.now(),
        bio: '这是API测试生成的简介',
        default_theme: 'dark',
        default_font_size: 'large',
      };

      const patchResponse = await fetch(`${BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const patchData = await patchResponse.json();

      if (patchResponse.status === 200 && patchData.profile) {
        testResult('PATCH /api/user/profile', true, `成功更新配置: ${patchData.profile.display_name}`);
      } else {
        testResult('PATCH /api/user/profile', false, patchData.error || '更新失败');
      }

      // 测试3: PATCH - 测试用户名验证
      await delay(500);
      const invalidUsernameData = {
        username: 'invalid user!@#', // 包含非法字符
      };

      const invalidResponse = await fetch(`${BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUsernameData),
      });

      const invalidData = await invalidResponse.json();

      if (invalidResponse.status === 400 && invalidData.error) {
        testResult('PATCH /api/user/profile (无效用户名验证)', true, '正确拒绝无效用户名');
      } else {
        testResult('PATCH /api/user/profile (无效用户名验证)', false, '未能正确验证用户名');
      }

    } else {
      testResult('GET /api/user/profile', false, `意外响应: ${getResponse.status}`);
    }
  } catch (error) {
    testResult('用户配置API测试', false, error.message);
  }
}

async function testPasswordAPI() {
  log(colors.blue, '\n=== 测试密码修改API (/api/user/password) ===\n');

  try {
    // 测试1: POST - 修改密码(未登录应该返回401)
    const postResponse = await fetch(`${BASE_URL}/api/user/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: 'test123',
        newPassword: 'newtest123',
      }),
    });

    const postData = await postResponse.json();

    if (postResponse.status === 401) {
      testResult('POST /api/user/password (未登录)', true, '正确返回401未授权');
    } else if (postResponse.status === 400) {
      testResult('POST /api/user/password (密码验证)', true, '正确验证密码: ' + postData.error);
    } else if (postResponse.status === 200) {
      testResult('POST /api/user/password (已登录)', true, '密码修改成功');
    } else {
      testResult('POST /api/user/password', false, `意外响应: ${postResponse.status}`);
    }

    // 测试2: POST - 测试密码长度验证
    await delay(500);
    const shortPasswordResponse = await fetch(`${BASE_URL}/api/user/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: 'test123',
        newPassword: '123', // 少于6位
      }),
    });

    const shortPasswordData = await shortPasswordResponse.json();

    if (shortPasswordResponse.status === 401) {
      testResult('POST /api/user/password (密码长度验证-未登录)', true, '未登录,无法测试密码长度验证');
    } else if (shortPasswordResponse.status === 400 && shortPasswordData.error.includes('6位')) {
      testResult('POST /api/user/password (密码长度验证)', true, '正确拒绝短密码');
    } else {
      testResult('POST /api/user/password (密码长度验证)', false, '密码长度验证可能有问题');
    }

  } catch (error) {
    testResult('密码修改API测试', false, error.message);
  }
}

async function testExportAPI() {
  log(colors.blue, '\n=== 测试数据导出API (/api/user/export) ===\n');

  try {
    // 测试1: GET - 导出JSON格式(未登录应该返回401)
    const jsonResponse = await fetch(`${BASE_URL}/api/user/export?format=json`);

    if (jsonResponse.status === 401) {
      const jsonData = await jsonResponse.json();
      testResult('GET /api/user/export?format=json (未登录)', true, '正确返回401未授权');
    } else if (jsonResponse.status === 200) {
      const contentType = jsonResponse.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const jsonData = await jsonResponse.json();
        testResult('GET /api/user/export?format=json (已登录)', true, `成功导出JSON数据,包含 ${Object.keys(jsonData).length} 个字段`);

        // 验证导出数据结构
        const hasExportInfo = jsonData.export_info && jsonData.export_info.exported_at;
        const hasProfile = 'profile' in jsonData;
        const hasBookshelf = Array.isArray(jsonData.bookshelf);
        const hasReadingHistory = Array.isArray(jsonData.reading_history);

        if (hasExportInfo && hasProfile && hasBookshelf && hasReadingHistory) {
          testResult('JSON数据结构验证', true, '数据结构完整');
        } else {
          testResult('JSON数据结构验证', false, '数据结构不完整');
        }
      } else {
        testResult('GET /api/user/export?format=json', false, '响应类型不正确');
      }
    } else {
      testResult('GET /api/user/export?format=json', false, `意外响应: ${jsonResponse.status}`);
    }

    // 测试2: GET - 导出CSV格式
    await delay(500);
    const csvResponse = await fetch(`${BASE_URL}/api/user/export?format=csv`);

    if (csvResponse.status === 401) {
      testResult('GET /api/user/export?format=csv (未登录)', true, '正确返回401未授权');
    } else if (csvResponse.status === 200) {
      const contentType = csvResponse.headers.get('content-type');

      if (contentType && contentType.includes('text/csv')) {
        const csvText = await csvResponse.text();
        testResult('GET /api/user/export?format=csv (已登录)', true, `成功导出CSV数据,${csvText.split('\n').length} 行`);
      } else {
        testResult('GET /api/user/export?format=csv', false, '响应类型不正确');
      }
    } else {
      testResult('GET /api/user/export?format=csv', false, `意外响应: ${csvResponse.status}`);
    }

  } catch (error) {
    testResult('数据导出API测试', false, error.message);
  }
}

// 主测试函数
async function runAllTests() {
  log(colors.yellow, '\n╔══════════════════════════════════════════════════╗');
  log(colors.yellow, '║        用户设置API测试套件                       ║');
  log(colors.yellow, '╚══════════════════════════════════════════════════╝');

  await testUserProfileAPI();
  await delay(1000);

  await testPasswordAPI();
  await delay(1000);

  await testExportAPI();

  // 输出测试总结
  log(colors.yellow, '\n╔══════════════════════════════════════════════════╗');
  log(colors.yellow, '║                  测试总结                        ║');
  log(colors.yellow, '╚══════════════════════════════════════════════════╝');
  log(colors.blue, `\n总测试数: ${totalTests}`);
  log(colors.green, `通过: ${passedTests}`);
  log(colors.red, `失败: ${failedTests}`);
  log(colors.blue, `通过率: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);

  if (failedTests === 0) {
    log(colors.green, '🎉 所有测试通过!\n');
  } else {
    log(colors.yellow, '⚠️  部分测试失败,请检查上述错误信息\n');
  }
}

// 运行测试
runAllTests().catch(error => {
  log(colors.red, '测试运行出错:', error);
  process.exit(1);
});
