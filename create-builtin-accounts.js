/**
 * 创建内置账号脚本
 * 用于初始化两个测试/演示账号
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

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAccount(email, password, username, displayName) {
  try {
    log(colors.blue, `\n正在创建账号: ${username} (${email})...`);

    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        username: username,
        display_name: displayName,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      log(colors.green, `✓ 账号创建成功: ${username}`);
      log(colors.blue, `  - 用户ID: ${data.user.id}`);
      log(colors.blue, `  - 邮箱: ${data.user.email}`);
      log(colors.blue, `  - 用户名: ${data.user.username}`);
      log(colors.blue, `  - 显示名称: ${data.user.display_name}`);
      return { success: true, user: data.user };
    } else {
      // 检查是否是因为用户已存在
      if (data.error && (data.error.includes('already') || data.error.includes('exists') || data.error.includes('registered'))) {
        log(colors.yellow, `⚠ 账号已存在: ${username}`);
        return { success: true, exists: true };
      } else {
        log(colors.red, `✗ 账号创建失败: ${username}`);
        log(colors.red, `  错误: ${data.error}`);
        return { success: false, error: data.error };
      }
    }
  } catch (error) {
    log(colors.red, `✗ 创建账号时发生错误: ${username}`);
    log(colors.red, `  ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  log(colors.yellow, '\n╔══════════════════════════════════════════════════╗');
  log(colors.yellow, '║            创建内置账号                          ║');
  log(colors.yellow, '╚══════════════════════════════════════════════════╝');

  const accounts = [
    {
      email: 'lzh@guji.com',
      password: '51274101007',
      username: 'lzh',
      displayName: 'LZH',
    },
    {
      email: 'zhiqiu@guji.com',
      password: '220912hhh',
      username: 'zhiqiu',
      displayName: '知秋',
    },
  ];

  let successCount = 0;
  let existsCount = 0;
  let failCount = 0;

  for (const account of accounts) {
    const result = await createAccount(
      account.email,
      account.password,
      account.username,
      account.displayName
    );

    if (result.success) {
      if (result.exists) {
        existsCount++;
      } else {
        successCount++;
      }
    } else {
      failCount++;
    }

    // 延迟一下,避免请求过快
    await delay(1000);
  }

  // 输出总结
  log(colors.yellow, '\n╔══════════════════════════════════════════════════╗');
  log(colors.yellow, '║                  执行总结                        ║');
  log(colors.yellow, '╚══════════════════════════════════════════════════╝');
  log(colors.green, `\n新建账号: ${successCount}`);
  log(colors.yellow, `已存在账号: ${existsCount}`);
  log(colors.red, `失败: ${failCount}`);

  if (failCount === 0) {
    log(colors.green, '\n🎉 所有账号准备就绪!\n');
    log(colors.blue, '账号信息:');
    log(colors.blue, '1. 用户名: lzh');
    log(colors.blue, '   邮箱: lzh@guji.com');
    log(colors.blue, '   密码: 51274101007\n');
    log(colors.blue, '2. 用户名: zhiqiu');
    log(colors.blue, '   邮箱: zhiqiu@guji.com');
    log(colors.blue, '   密码: 220912hhh\n');
  } else {
    log(colors.yellow, '\n⚠️  部分账号创建失败,请检查上述错误信息\n');
  }
}

// 运行脚本
main().catch(error => {
  log(colors.red, '脚本执行出错:', error);
  process.exit(1);
});
