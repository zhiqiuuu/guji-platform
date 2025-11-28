const fs = require('fs');
const iconv = require('iconv-lite');

// 读取课题库
const ketiData = fs.readFileSync('./shujuku/求志书院课题库.csv');
const ketiText = iconv.decode(ketiData, 'gbk');
const ketiLines = ketiText.split('\n').filter((line) => line.trim());

// 解析CSV
function parseCSV(text) {
  const lines = text.split('\n').filter((line) => line.trim());
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    data.push(obj);
  }

  return data;
}

const ketiBooks = parseCSV(ketiText);
const keyiData = fs.readFileSync('./shujuku/求志书院课艺库.csv');
const keyiText = iconv.decode(keyiData, 'gbk');
const keyiBooks = parseCSV(keyiText);

// 分析层级
const allBooks = [...ketiBooks, ...keyiBooks];

const academies = new Set();
const years = new Set();
const seasons = new Set();
const categories = new Set();
const dynasties = new Set();

allBooks.forEach((book) => {
  if (book.academy) academies.add(book.academy);
  if (book.year) years.add(book.year);
  if (book.season) seasons.add(book.season);
  if (book.category) categories.add(book.category);
  if (book.dynasty) dynasties.add(book.dynasty);
});

console.log('=== 层级结构分析 ===\n');

console.log('书院 (academy):');
console.log(Array.from(academies).sort());

console.log('\n年份 (year):');
const yearArray = Array.from(years).sort((a, b) => parseInt(a) - parseInt(b));
console.log(`范围: ${yearArray[0]} - ${yearArray[yearArray.length - 1]}`);
console.log(`共 ${yearArray.length} 个年份`);

console.log('\n季节 (season):');
console.log(Array.from(seasons).sort());

console.log('\n分类 (category):');
console.log(Array.from(categories).sort());

console.log('\n朝代 (dynasty):');
console.log(Array.from(dynasties).sort());

console.log('\n=== 数据统计 ===');
console.log(`课题库: ${ketiBooks.length} 条`);
console.log(`课艺库: ${keyiBooks.length} 条`);
console.log(`总计: ${allBooks.length} 条`);
