const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * 解析《申报》所见晚清书院课题课案汇录（上）文档
 * 生成课艺库CSV文件
 */

async function parseWordToCSV() {
  const docxPath = path.join(__dirname, '..', '《申报》所见晚清书院课题课案汇录（上） (吴钦根) (Z-Library)(OCR)_1-208_49-208(1).docx');
  const csvPath = path.join(__dirname, 'shujuyangli', '晚清书院课艺库.csv');

  console.log('📖 开始解析Word文档...');
  console.log('文件路径:', docxPath);

  try {
    // 读取Word文档
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;

    console.log('✅ Word文档读取成功\n');

    // 解析文本内容
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log('📊 文档总行数:', lines.length);
    console.log('\n前20行内容:');
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`${i + 1}. ${line}`);
    });

    // 数据结构
    const records = [];
    let currentAcademy = '';
    let currentYear = '';
    let currentSeason = '';
    let currentCategory = '';
    let currentDescription = '';

    // 书院名称列表(根据实际文档调整)
    const academyNames = [
      '求志书院', '诂经精舍', '学海堂', '广雅书院', '钟山书院',
      '尊经书院', '崇实书院', '敬业书院', '问津书院', '正谊书院'
    ];

    // 完整年份映射
    const yearPatterns = [
      { pattern: /同治.*?(\d{4})/i, year: null },
      { pattern: /光绪.*?(\d{4})/i, year: null },
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
      { pattern: /乙未.*?1895/i, year: '1895' },
    ];

    // 季节映射
    const seasonMap = {
      '春': '春',
      '夏': '夏',
      '秋': '秋',
      '冬': '冬',
    };

    // 类别映射(六个标准类别)
    const categoryKeywords = ['经学', '史学', '掌故', '算学', '舆地', '词章'];

    console.log('\n🔍 开始解析课艺数据...\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 识别书院名称
      for (const academy of academyNames) {
        if (line.includes(academy)) {
          currentAcademy = academy;
          console.log(`🏫 发现书院: ${currentAcademy}`);
          break;
        }
      }

      // 识别完整年份
      for (const yearPat of yearPatterns) {
        if (yearPat.pattern.test(line)) {
          const match = line.match(yearPat.pattern);
          if (yearPat.year) {
            currentYear = yearPat.year;
          } else if (match && match[1]) {
            currentYear = match[1];
          }
          console.log(`📅 发现年份: ${currentYear}`);
          break;
        }
      }

      // 识别季节
      if (/[春夏秋冬]季/.test(line) || /[春夏秋冬]课/.test(line)) {
        const seasonMatch = line.match(/([春夏秋冬])[季课]/);
        if (seasonMatch) {
          currentSeason = seasonMap[seasonMatch[1]];
          console.log(`🍂 发现季节: ${currentSeason}`);
        }
      }

      // 识别类别(六个标准类别)
      if (line.startsWith('○') || line.startsWith('◎')) {
        for (const cat of categoryKeywords) {
          if (line.includes(cat)) {
            currentCategory = cat;
            console.log(`📚 发现类别: ${currentCategory}`);
            break;
          }
        }
      }

      // 提取课艺内容(有作者、题目、简介的完整记录)
      if (currentAcademy && currentYear && currentSeason && currentCategory) {
        // 课艺特征:通常包含作者名、题目、内容简介
        // 格式可能是: "某某,《某题目》,内容摘要..."
        // 或: "作者:某某 题目:某某 内容:..."

        // 简单匹配:如果行中包含句号或分号,且长度适中,可能是课艺记录
        const isKeyiLine = line.length > 20 && line.length < 500 &&
                            (line.includes(',') || line.includes('、') || line.includes(':'));

        if (isKeyiLine && !line.startsWith('○') && !line.startsWith('◎')) {
          // 尝试提取作者和题目
          let author = '未知';
          let subject = '';
          let description = '';

          // 简单解析:假设格式为 "作者,题目,简介" 或类似
          const parts = line.split(/[,、]/);

          if (parts.length >= 2) {
            // 第一部分可能是作者
            const potentialAuthor = parts[0].trim();
            if (potentialAuthor.length < 10 && !potentialAuthor.includes('题') && !potentialAuthor.includes('学')) {
              author = potentialAuthor;
              subject = parts.slice(1).join(',').trim();
            } else {
              subject = line;
            }

            // 限制subject长度,多余的作为description
            if (subject.length > 100) {
              description = subject.substring(100);
              subject = subject.substring(0, 100);
            } else {
              description = subject;
            }

            records.push({
              library_type: '课艺库',
              academy: currentAcademy,
              year: currentYear,
              season: currentSeason,
              category: currentCategory,
              subject: subject,
              author: author,
              dynasty: '清',
              description: description,
              file_url: '', // 暂时为空,后续可以手动补充
            });

            console.log(`  ✓ ${currentYear}年${currentSeason} ${currentCategory}: ${subject.substring(0, 30)}... (作者:${author})`);
          }
        }
      }
    }

    console.log(`\n✅ 解析完成! 共提取 ${records.length} 条课艺记录\n`);

    // 生成CSV
    const csvHeader = 'library_type,academy,year,season,category,subject,author,dynasty,description,file_url\n';
    const csvRows = records.map(r =>
      `${r.library_type},${r.academy},${r.year},${r.season},${r.category},"${r.subject.replace(/"/g, '""')}",${r.author},${r.dynasty},"${r.description.replace(/"/g, '""')}",${r.file_url}`
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
      byAcademy: {},
    };

    records.forEach(r => {
      stats.byYear[r.year] = (stats.byYear[r.year] || 0) + 1;
      stats.bySeason[r.season] = (stats.bySeason[r.season] || 0) + 1;
      stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
      stats.byAcademy[r.academy] = (stats.byAcademy[r.academy] || 0) + 1;
    });

    console.log('\n按书院统计:');
    Object.entries(stats.byAcademy).sort().forEach(([academy, count]) => {
      console.log(`  ${academy}: ${count}条`);
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
      console.log(`\n${i + 1}. ${r.academy} ${r.year}年 ${r.season} ${r.category}`);
      console.log(`   作者: ${r.author}`);
      console.log(`   题目: ${r.subject}`);
      console.log(`   简介: ${r.description.substring(0, 50)}...`);
    });

    console.log('\n✅ 处理完成! CSV文件可以导入系统了。');
    console.log('\n⚠️  注意: file_url字段为空,如有PDF文件请手动补充路径');

  } catch (error) {
    console.error('❌ 解析失败:', error);
    throw error;
  }
}

// 执行解析
parseWordToCSV().catch(console.error);
