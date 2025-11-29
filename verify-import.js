const data = require('fs').readFileSync(0, 'utf-8');
const books = JSON.parse(data);

console.log('📊 导入统计:');
console.log('总书籍数:', books.length);
console.log('课题库:', books.filter(b => b.library_type === '课题库').length);
console.log('课艺库:', books.filter(b => b.library_type === '课艺库').length);

console.log('\n📚 各类别统计:');
const categories = {};
books.forEach(b => {
  categories[b.category] = (categories[b.category] || 0) + 1;
});

Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}本`);
});
