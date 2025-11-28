const fs = require('fs');
const iconv = require('iconv-lite');

// 读取课题库
console.log('=== 课题库 ===');
const ketiData = fs.readFileSync('./shujuku/求志书院课题库.csv');
const ketiText = iconv.decode(ketiData, 'gbk');
const ketiLines = ketiText.split('\n').slice(0, 5);
console.log(ketiLines.join('\n'));

console.log('\n=== 课艺库 ===');
const keyiData = fs.readFileSync('./shujuku/求志书院课艺库.csv');
const keyiText = iconv.decode(keyiData, 'gbk');
const keyiLines = keyiText.split('\n').slice(0, 5);
console.log(keyiLines.join('\n'));

// 统计数量
const ketiCount = ketiText.split('\n').length - 1;
const keyiCount = keyiText.split('\n').length - 1;
console.log(`\n课题库总数: ${ketiCount} 条`);
console.log(`课艺库总数: ${keyiCount} 条`);
