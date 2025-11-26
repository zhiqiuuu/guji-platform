const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * 解析《申报》所见求志书院课艺题目.docx文件
 * 生成课题库CSV文件
 */

async function parseWordToCSV() {
  const docxPath = path.join(__dirname, 'shujuyangli', '《申报》所见求志书院课艺题目.docx');
  const csvPath = path.join(__dirname, 'shujuyangli', '求志书院课题库.csv');

  console.log('📖 开始解析Word文档...');
  console.log('文件路径:', docxPath);

  try {
    // 读取Word文档
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;

    console.log('✅ Word文档读取成功');
    console.log('文档总长度:', text.length, '字符\n');

    // 解析文本内容
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log('📊 文档总行数:', lines.length);
    console.log('\n前10行内容:');
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`${i + 1}. ${line}`);
    });

    // 数据结构
    const records = [];
    let currentYear = '';
    let currentSeason = '';
    let currentCategory = '';

    // 类别映射
    const categoryMap = {
      '经学': '经学',
      '史学': '史学',
      '掌故': '掌故',
      '算学': '算学',
      '舆地': '舆地',
      '词章': '词章',
      '经': '经学',
      '史': '史学',
      '算': '算学',
    };

    // 季节映射
    const seasonMap = {
      '春': '春',
      '夏': '夏',
      '秋': '秋',
      '冬': '冬',
      '春季': '春',
      '夏季': '夏',
      '秋季': '秋',
      '冬季': '冬',
    };

    console.log('\n🔍 开始解析课题数据...\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 识别年份 (如: 1872年、同治十一年)
      const yearMatch = line.match(/(\d{4})[年]|([一二三四五六七八九十]+年)/);
      if (yearMatch) {
        currentYear = yearMatch[1] || yearMatch[2];
        console.log(`📅 发现年份: ${currentYear}`);
        continue;
      }

      // 识别季节
      for (const [key, value] of Object.entries(seasonMap)) {
        if (line.includes(key)) {
          currentSeason = value;
          console.log(`🍂 发现季节: ${currentSeason}`);
          break;
        }
      }

      // 识别类别
      for (const [key, value] of Object.entries(categoryMap)) {
        if (line.includes(key) && line.length < 20) {
          currentCategory = value;
          console.log(`📚 发现类别: ${currentCategory}`);
          break;
        }
      }

      // 识别题目 (通常是较长的文本,不包含年份季节标记)
      if (currentYear && currentSeason && currentCategory) {
        // 过滤掉标题行和空行
        const isYearLine = /\d{4}年|[一二三四五六七八九十]+年/.test(line);
        const isSeasonLine = /春|夏|秋|冬/.test(line) && line.length < 10;
        const isCategoryLine = Object.keys(categoryMap).some(cat => line === cat || line.includes(cat) && line.length < 20);

        if (!isYearLine && !isSeasonLine && !isCategoryLine && line.length > 3) {
          // 这可能是题目
          records.push({
            library_type: '课题库',
            academy: '求志书院',
            year: currentYear,
            season: currentSeason,
            category: currentCategory,
            subject: line,
            author: '未知',
            dynasty: '清',
          });

          console.log(`  ✓ 添加题目: ${line.substring(0, 30)}...`);
        }
      }
    }

    console.log(`\n✅ 解析完成! 共提取 ${records.length} 条课题记录\n`);

    // 生成CSV
    const csvHeader = 'library_type,academy,year,season,category,subject,author,dynasty\n';
    const csvRows = records.map(r =>
      `${r.library_type},${r.academy},${r.year},${r.season},${r.category},"${r.subject.replace(/"/g, '""')}",${r.author},${r.dynasty}`
    ).join('\n');

    const csvContent = '\ufeff' + csvHeader + csvRows; // 添加BOM以支持Excel

    // 保存CSV文件
    fs.writeFileSync(csvPath, csvContent, 'utf8');

    console.log('📝 CSV文件已生成:', csvPath);
    console.log('\n📊 统计信息:');

    // 统计
    const stats = {
      byYear: {},
      bySeason: {},
      byCategory: {},
    };

    records.forEach(r => {
      stats.byYear[r.year] = (stats.byYear[r.year] || 0) + 1;
      stats.bySeason[r.season] = (stats.bySeason[r.season] || 0) + 1;
      stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
    });

    console.log('\n按年份统计:');
    Object.entries(stats.byYear).sort().forEach(([year, count]) => {
      console.log(`  ${year}: ${count}条`);
    });

    console.log('\n按季节统计:');
    Object.entries(stats.bySeason).forEach(([season, count]) => {
      console.log(`  ${season}: ${count}条`);
    });

    console.log('\n按类别统计:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}条`);
    });

    console.log('\n前5条记录预览:');
    records.slice(0, 5).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.year}年 ${r.season} ${r.category}`);
      console.log(`   题目: ${r.subject}`);
    });

    console.log('\n✅ 处理完成! 可以将CSV文件导入系统了。');

  } catch (error) {
    console.error('❌ 解析失败:', error);
    throw error;
  }
}

// 执行解析
parseWordToCSV().catch(console.error);
