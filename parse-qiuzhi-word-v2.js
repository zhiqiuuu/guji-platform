const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * 优化版:解析《申报》所见求志书院课艺题目.docx文件
 * 生成课题库CSV文件
 */

async function parseWordToCSV() {
  const docxPath = path.join(__dirname, 'shujuyangli', '《申报》所见求志书院课艺题目.docx');
  const csvPath = path.join(__dirname, 'shujuyangli', '求志书院课题库_优化版.csv');

  console.log('📖 开始解析Word文档...');
  console.log('文件路径:', docxPath);

  try {
    // 读取Word文档
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;

    console.log('✅ Word文档读取成功\n');

    // 解析文本内容
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // 数据结构
    const records = [];
    let currentYear = '';
    let currentSeason = '';
    let currentCategory = '';

    // 完整年份映射
    const yearPatterns = [
      { pattern: /丙子.*?1876/i, year: '1876' },
      { pattern: /丁丑.*?1877/i, year: '1877' },
      { pattern: /戊寅.*?1878/i, year: '1878' },
      { pattern: /己卯.*?1879/i, year: '1879' },
      { pattern: /庚辰.*?1880/i, year: '1880' },
      { pattern: /辛巳.*?1881/i, year: '1881' },
      { pattern: /壬午.*?1882/i, year: '1882' },
      { pattern: /癸未.*?1883/i, year: '1883' },
      { pattern: /甲申.*?1884/i, year: '1884' },
      { pattern: /乙酉.*?1885/i, year: '1885' },
      { pattern: /丙戌.*?1886/i, year: '1886' },
      { pattern: /丁亥.*?1887/i, year: '1887' },
      { pattern: /戊子.*?1888/i, year: '1888' },
      { pattern: /己丑.*?1889/i, year: '1889' },
      { pattern: /庚寅.*?1890/i, year: '1890' },
      { pattern: /辛卯.*?1891/i, year: '1891' },
      { pattern: /壬辰.*?1892/i, year: '1892' },
      { pattern: /癸巳.*?1893/i, year: '1893' },
      { pattern: /甲午.*?1894/i, year: '1894' },
    ];

    // 季节映射
    const seasonMap = {
      '春': '春',
      '夏': '夏',
      '秋': '秋',
      '冬': '冬',
    };

    // 类别映射
    const categoryKeywords = ['经学', '史学', '掌故', '算学', '舆地', '词章'];

    console.log('🔍 开始解析课题数据...\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 识别完整年份(包含干支和公元年份)
      for (const yearPat of yearPatterns) {
        if (yearPat.pattern.test(line)) {
          currentYear = yearPat.year;
          console.log(`📅 发现年份: ${currentYear}`);
          break;
        }
      }

      // 识别季节(匹配"春季题目"、"夏季课题"等)
      if (/[春夏秋冬]季/.test(line)) {
        const seasonMatch = line.match(/([春夏秋冬])季/);
        if (seasonMatch) {
          currentSeason = seasonMap[seasonMatch[1]];
          console.log(`🍂 发现季节: ${currentSeason}`);
        }
      }

      // 识别类别(必须有"○"标记)
      if (line.startsWith('○') || line.startsWith('◎')) {
        for (const cat of categoryKeywords) {
          if (line.includes(cat)) {
            currentCategory = cat;
            console.log(`📚 发现类别: ${currentCategory}`);
            break;
          }
        }
      }

      // 提取题目(有年份、季节、类别的情况下)
      if (currentYear && currentSeason && currentCategory) {
        // 跳过标题行、年份行、季节行、类别行
        const isHeaderLine = /求志书院|题目|课题|课案/.test(line);
        const isYearLine = /\d{4}|[丙丁戊己庚辛壬癸甲乙][子丑寅卯辰巳午未申酉戌亥]/.test(line) && line.length < 50;
        const isSeasonLine = /[春夏秋冬]季/.test(line) && line.length < 20;
        const isCategoryLine = line.startsWith('○') || line.startsWith('◎');
        const isEmptyOrNumber = line.length < 5 || /^\d+$/.test(line);

        // 题目特征:以句号或分号结尾,长度适中
        const isSubjectLine = (line.endsWith('；') || line.endsWith('。') || line.endsWith(';')) && line.length > 5 && line.length < 200;

        if (!isHeaderLine && !isYearLine && !isSeasonLine && !isCategoryLine && !isEmptyOrNumber && isSubjectLine) {
          // 去掉题目前的标记
          let subject = line.replace(/^[○◎\s]+/, '');

          // 拆分多个题目(如果用分号分隔)
          const subjects = subject.split(/[；;]/).filter(s => s.trim().length > 3);

          subjects.forEach(subj => {
            subj = subj.trim();
            if (subj.length > 3) {
              records.push({
                library_type: '课题库',
                academy: '求志书院',
                year: currentYear,
                season: currentSeason,
                category: currentCategory,
                subject: subj,
                author: '未知',
                dynasty: '清',
              });

              console.log(`  ✓ ${currentYear}年${currentSeason} ${currentCategory}: ${subj.substring(0, 30)}...`);
            }
          });
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

    console.log('\n前10条记录预览:');
    records.slice(0, 10).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.year}年 ${r.season} ${r.category}`);
      console.log(`   题目: ${r.subject}`);
    });

    console.log('\n✅ 处理完成! CSV文件可以直接导入系统了。');

  } catch (error) {
    console.error('❌ 解析失败:', error);
    throw error;
  }
}

// 执行解析
parseWordToCSV().catch(console.error);
