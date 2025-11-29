const fs = require('fs');
const iconv = require('iconv-lite');

const data1 = fs.readFileSync('./shujuku/求志书院课题库.csv');
const text1 = iconv.decode(data1, 'gbk');
const lines1 = text1.split('\n');

const data2 = fs.readFileSync('./shujuku/求志书院课艺库.csv');
const text2 = iconv.decode(data2, 'gbk');
const lines2 = text2.split('\n');

const categories = new Set();
const categoryCounts = {};

[...lines1, ...lines2].forEach((line, i) => {
  if(i === 0 || !line.trim()) return;
  const cols = line.split(',');
  if(cols[4] && cols[4].trim()) {
    const cat = cols[4].trim();
    categories.add(cat);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
});

console.log('CSV中所有的类别:');
Array.from(categories).sort().forEach(cat => {
  console.log(`  - ${cat} (${categoryCounts[cat]}条)`);
});

console.log('\n验证规则中的类别:');
console.log("  ['经学', '史学', '掌故', '算学', '舆地', '词章']");

console.log('\n缺失的类别:');
const validCats = ['经学', '史学', '掌故', '算学', '舆地', '词章'];
Array.from(categories).forEach(cat => {
  if(!validCats.includes(cat)) {
    console.log(`  ❌ ${cat} - 不在验证规则中 (${categoryCounts[cat]}条数据会失败)`);
  }
});
