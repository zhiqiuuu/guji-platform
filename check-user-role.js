/**
 * 检查用户角色并设置为管理员
 */

const BASE_URL = 'http://localhost:3001';

async function checkAndSetAdmin() {
  try {
    console.log('🔐 正在登录...\n');

    // 登录
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lzh@guji.com',
        password: '51274101007',
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      console.error('❌ 登录失败:', loginData.error);
      return;
    }

    console.log('✅ 登录成功!');
    console.log('📋 用户信息:', JSON.stringify(loginData.user, null, 2));
    console.log('\n📋 Session信息:', loginData.session ? '存在' : '不存在');

    // 检查用户profile
    const cookies = loginResponse.headers.get('set-cookie');
    const profileResponse = await fetch(`${BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
      },
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('\n📋 用户Profile:', JSON.stringify(profile, null, 2));
    } else {
      console.log('\n⚠️  无法获取用户Profile');
    }

  } catch (error) {
    console.error('❌ 出错:', error.message);
  }
}

checkAndSetAdmin();
