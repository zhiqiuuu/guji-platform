/**
 * 获取管理员Token脚本
 * 用于登录并获取可用于导入的管理员Token
 */

const BASE_URL = 'http://localhost:3001';

async function getAdminToken() {
  try {
    console.log('🔐 正在登录管理员账号...\n');

    // 尝试登录 lzh@guji.com (假设是管理员账号)
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

    const data = await response.json();

    if (response.ok && data.session) {
      console.log('✅ 登录成功!');
      console.log('📋 Access Token:', data.session.access_token);
      console.log('\n💡 复制上面的 Access Token,在导入脚本中使用\n');
      return data.session.access_token;
    } else {
      console.error('❌ 登录失败:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 登录出错:', error.message);
    return null;
  }
}

// 执行获取token
getAdminToken();
