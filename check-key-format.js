const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const KIMI_API_KEY = process.env.KIMI_API_KEY;

console.log('🔍 API Key 格式检查\n');
console.log('完整 Key:', KIMI_API_KEY);
console.log('长度:', KIMI_API_KEY.length);
console.log('开头:', KIMI_API_KEY.substring(0, 10));
console.log('结尾:', KIMI_API_KEY.substring(KIMI_API_KEY.length - 10));
console.log('包含空格:', KIMI_API_KEY.includes(' '));
console.log('包含换行:', KIMI_API_KEY.includes('\n'));
console.log('包含制表符:', KIMI_API_KEY.includes('\t'));

// 检查是否有不可见字符
const cleaned = KIMI_API_KEY.trim();
console.log('Trim 后长度:', cleaned.length);
console.log('是否相等:', KIMI_API_KEY === cleaned);

// 16进制查看前后几个字符
console.log('\n前10个字符的16进制:');
for (let i = 0; i < Math.min(10, KIMI_API_KEY.length); i++) {
  console.log(`  [${i}] '${KIMI_API_KEY[i]}' = 0x${KIMI_API_KEY.charCodeAt(i).toString(16)}`);
}

console.log('\n后10个字符的16进制:');
const start = Math.max(0, KIMI_API_KEY.length - 10);
for (let i = start; i < KIMI_API_KEY.length; i++) {
  console.log(`  [${i}] '${KIMI_API_KEY[i]}' = 0x${KIMI_API_KEY.charCodeAt(i).toString(16)}`);
}
