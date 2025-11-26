/**
 * 调用API将用户设置为管理员
 */

const BASE_URL = 'http://localhost:3001';

async function setAdmin() {
  try {
    console.log('🔧 正在将用户设置为管理员...\n');

    const response = await fetch(`${BASE_URL}/api/dev/set-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '4d6bd98d-69d1-45ae-a717-cd3edcaad3f6',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 用户角色已更新为管理员!');
      console.log('📋 更新结果:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ 更新失败:', data.error);
      console.error('详细信息:', data.details);
    }
  } catch (error) {
    console.error('❌ 出错:', error.message);
  }
}

setAdmin();
