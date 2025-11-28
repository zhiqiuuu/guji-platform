/**
 * Kimi API 认证问题诊断工具
 * 详细检查 API key 和认证配置
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1';

console.log('🔍 Kimi API 认证诊断工具\n');
console.log('='.repeat(60));

// 1. 检查环境变量
console.log('\n📋 步骤 1: 检查环境变量');
console.log('-'.repeat(60));

if (!KIMI_API_KEY) {
  console.error('❌ KIMI_API_KEY 未设置');
  process.exit(1);
}

console.log('✅ API Key 存在');
console.log(`   长度: ${KIMI_API_KEY.length} 字符`);
console.log(`   前缀: ${KIMI_API_KEY.substring(0, 8)}...`);
console.log(`   后缀: ...${KIMI_API_KEY.substring(KIMI_API_KEY.length - 4)}`);

// 检查格式
if (!KIMI_API_KEY.startsWith('sk-')) {
  console.warn('⚠️  警告: API Key 不以 "sk-" 开头,格式可能不正确');
}

console.log(`\n✅ API Base URL: ${KIMI_API_BASE_URL}`);

// 2. 检查网络连接
console.log('\n🌐 步骤 2: 检查网络连接');
console.log('-'.repeat(60));

async function checkNetwork() {
  try {
    const response = await fetch(KIMI_API_BASE_URL.replace('/v1', ''));
    console.log(`✅ 可以访问 Moonshot API (状态码: ${response.status})`);
  } catch (error) {
    console.error('❌ 网络连接失败:', error.message);
    return false;
  }
  return true;
}

// 3. 测试不同的认证方式
async function testAuthentication() {
  console.log('\n🔐 步骤 3: 测试 API 认证');
  console.log('-'.repeat(60));

  // 测试 1: 标准 Bearer Token
  console.log('\n测试 1: 标准 Bearer Token 格式');
  try {
    const response = await fetch(`${KIMI_API_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   状态码: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ 认证成功!');
      console.log(`   可用模型数: ${data.data?.length || 0}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ 认证失败');
      console.log(`   错误响应: ${errorText}`);

      // 尝试解析错误信息
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`   错误类型: ${errorJson.error?.type || '未知'}`);
        console.log(`   错误消息: ${errorJson.error?.message || errorText}`);
      } catch (e) {
        // 无法解析为 JSON
      }
    }
  } catch (error) {
    console.log('   ❌ 请求失败:', error.message);
  }

  return false;
}

// 4. 提供详细建议
async function provideSuggestions(authSuccess) {
  console.log('\n💡 步骤 4: 解决方案建议');
  console.log('-'.repeat(60));

  if (authSuccess) {
    console.log('\n🎉 API 认证成功!可以正常使用 Kimi AI 服务。');
    return;
  }

  console.log('\n根据诊断结果,请尝试以下解决方案:\n');

  console.log('1️⃣  **检查 API Key 有效性**');
  console.log('   - 登录 Kimi 开放平台: https://platform.moonshot.cn');
  console.log('   - 进入"API Keys"页面');
  console.log('   - 检查当前 key 是否处于"启用"状态');
  console.log('   - 查看 key 的使用配额和余额\n');

  console.log('2️⃣  **重新生成 API Key**');
  console.log('   - 如果 key 已失效,点击"创建新密钥"');
  console.log('   - 复制新生成的完整 key (包括 sk- 前缀)');
  console.log('   - 更新到 .env.local 文件中\n');

  console.log('3️⃣  **检查账户状态**');
  console.log('   - 确认账户是否已实名认证');
  console.log('   - 检查账户余额是否充足');
  console.log('   - 查看是否有 API 调用限制\n');

  console.log('4️⃣  **验证 API Key 格式**');
  console.log('   - 完整格式应为: sk-xxxxxxxxxxxxxxxxxxxx');
  console.log('   - 不要包含空格或换行符');
  console.log('   - 确保复制时没有遗漏字符\n');

  console.log('5️⃣  **联系技术支持**');
  console.log('   - 如果以上都无法解决,访问: https://platform.moonshot.cn/docs');
  console.log('   - 或发送邮件到 Kimi 技术支持\n');
}

// 主函数
async function main() {
  const networkOk = await checkNetwork();

  if (!networkOk) {
    console.log('\n⚠️  网络连接存在问题,请检查网络设置后重试。');
    return;
  }

  const authSuccess = await testAuthentication();
  await provideSuggestions(authSuccess);

  console.log('\n' + '='.repeat(60));
  console.log('诊断完成!\n');

  if (!authSuccess) {
    console.log('📝 快速修复命令:');
    console.log('   1. 获取新的 API key');
    console.log('   2. 编辑 .env.local 文件');
    console.log('   3. 更新 KIMI_API_KEY=你的新key');
    console.log('   4. 重新运行: node diagnose-kimi-auth.js\n');
  }
}

main().catch(console.error);
