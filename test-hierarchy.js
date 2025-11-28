/**
 * 测试层级API
 */

const BASE_URL = 'http://localhost:3001';

async function testHierarchy() {
  try {
    console.log('📊 测试层级API...\n');

    // 1. 测试根层级
    const rootRes = await fetch(`${BASE_URL}/api/books/hierarchy`);
    const root = await rootRes.json();

    console.log('=== 根层级(库类型) ===');
    root.forEach(lib => {
      console.log(`${lib.label}: ${lib.count} 条`);
      console.log(`  书院数: ${lib.children?.length || 0}`);
      lib.children?.forEach(a => {
        console.log(`    - ${a.label}: ${a.count} 条`);
      });
    });

    // 2. 测试求志书院的年份
    console.log('\n=== 求志书院年份 ===');
    const yearRes = await fetch(`${BASE_URL}/api/books/hierarchy?academy=求志书院`);
    const years = await yearRes.json();

    console.log(`年份总数: ${years.length}`);
    if (years.length > 0) {
      console.log(`最早年份: ${years[0].label}`);
      console.log(`最晚年份: ${years[years.length - 1].label}`);
      console.log('\n前10个年份:');
      years.slice(0, 10).forEach(y => {
        console.log(`  ${y.label}: ${y.count} 条`);
      });
      console.log('\n后10个年份:');
      years.slice(-10).forEach(y => {
        console.log(`  ${y.label}: ${y.count} 条`);
      });
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testHierarchy();
