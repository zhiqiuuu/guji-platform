const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * 优化版v3:解析《申报》所见晚清书院课题课案汇录(上)
 * 分离课题库和课艺库
 */

async function parseWordToCSV() {
  const docxPath = path.join(__dirname, 'shujuyangli', '《申报》所见晚清书院课题课案汇录（上） (吴钦根) (Z-Library)(OCR)_1-208_49-208(1).docx');
  const ketikuCsvPath = path.join(__dirname, 'shujuyangli', '晚清书院课题库_课案汇录.csv');
  const keyikuCsvPath = path.join(__dirname, 'shujuyangli', '晚清书院课艺库_课案汇录.csv');

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

    // 数据结构
    const ketikuRecords = []; // 课题库(只有题目)
    const keyikuRecords = []; // 课艺库(有作者的)
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

    console.log('\n🔍 开始解析数据...\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 识别完整年份
      for (const yearPat of yearPatterns) {
        if (yearPat.pattern.test(line)) {
          currentYear = yearPat.year;
          console.log(`📅 发现年份: ${currentYear}`);
          break;
        }
      }

      // 识别季节
      if (/[春夏秋冬]季/.test(line)) {
        const seasonMatch = line.match(/([春夏秋冬])季/);
        if (seasonMatch) {
          currentSeason = seasonMap[seasonMatch[1]];
          console.log(`🍂 发现季节: ${currentSeason}`);
        }
      }

      // 识别类别
      if (line.startsWith('○') || line.startsWith('◎')) {
        for (const cat of categoryKeywords) {
          if (line.includes(cat)) {
            currentCategory = cat;
            console.log(`📚 发现类别: ${currentCategory}`);
            break;
          }
        }
      }

      // 有年份、季节、类别的情况下提取内容
      if (currentYear && currentSeason && currentCategory) {
        // 跳过标题行
        const isHeaderLine = /求志书院|题目|课题|课案/.test(line);
        const isYearLine = /\d{4}|[丙丁戊己庚辛壬癸甲乙][子丑寅卯辰巳午未申酉戌亥]/.test(line) && line.length < 50;
        const isSeasonLine = /[春夏秋冬]季/.test(line) && line.length < 20;
        const isCategoryLine = line.startsWith('○') || line.startsWith('◎');
        const isEmptyOrNumber = line.length < 5 || /^\d+$/.test(line);

        if (!isHeaderLine && !isYearLine && !isSeasonLine && !isCategoryLine && !isEmptyOrNumber) {
          // 判断是课题还是获奖名单
          const isAwardList = /超等[:：]|特等[:：]|一等[:：]|不取[:：]|附取[:：]|备取[:：]|给银|花红|录取/.test(line);

          if (isAwardList) {
            // 获奖名单 -> 课艺库
            // 提取作者名(假设格式为"超等:张三、李四")
            const authors = [];
            const namePattern = /([^、，,：:；;]{2,4}(?:县|府|州|省|江苏|浙江|安徽|上海|松江|华亭|娄县|南汇|宜兴|归安|金山|吴县|山阴|奉贤|萧山|太仓|宝山|长洲|吴江|庐陵|元和|香山|钱塘|历城|番禺|仁和|桐乡|榆次)?)/g;
            let match;
            while ((match = namePattern.exec(line)) !== null) {
              const name = match[1].trim();
              if (name.length >= 2 && name.length <= 10 && !['超等', '特等', '一等', '不取', '附取', '备取', '给银', '花红', '录取'].includes(name)) {
                authors.push(name);
              }
            }

            if (authors.length > 0) {
              // 只取前3个作者
              const mainAuthors = authors.slice(0, 3).join('、');

              keyikuRecords.push({
                library_type: '课艺库',
                academy: '求志书院',
                year: currentYear,
                season: currentSeason,
                category: currentCategory,
                subject: `${currentYear}年${currentSeason}${currentCategory}获奖课艺`,
                author: mainAuthors,
                dynasty: '清',
                description: line.substring(0, 200),
              });

              console.log(`  ✓ 课艺库: ${currentYear}年${currentSeason} ${currentCategory} 作者:${mainAuthors}`);
            }
          } else {
            // 课题内容 -> 课题库
            // 课题特征:以句号或分号结尾,长度适中,包含学术术语
            const isSubjectLine = (line.endsWith('；') || line.endsWith('。') || line.endsWith(';') || line.endsWith('?') || line.endsWith('？')) && line.length > 10 && line.length < 500;

            if (isSubjectLine) {
              let subject = line.replace(/^[○◎\s]+/, '');

              // 拆分多个题目
              const subjects = subject.split(/[；;]/).filter(s => s.trim().length > 5);

              subjects.forEach(subj => {
                subj = subj.trim();
                if (subj.length > 5) {
                  ketikuRecords.push({
                    library_type: '课题库',
                    academy: '求志书院',
                    year: currentYear,
                    season: currentSeason,
                    category: currentCategory,
                    subject: subj,
                    author: '未知',
                    dynasty: '清',
                  });

                  console.log(`  ✓ 课题库: ${currentYear}年${currentSeason} ${currentCategory}: ${subj.substring(0, 30)}...`);
                }
              });
            }
          }
        }
      }
    }

    console.log(`\n✅ 解析完成!`);
    console.log(`📚 课题库: ${ketikuRecords.length} 条记录`);
    console.log(`📝 课艺库: ${keyikuRecords.length} 条记录\n`);

    // 生成课题库CSV
    const ketikuCsvHeader = 'library_type,academy,year,season,category,subject,author,dynasty\n';
    const ketikuCsvRows = ketikuRecords.map(r =>
      `${r.library_type},${r.academy},${r.year},${r.season},${r.category},"${r.subject.replace(/"/g, '""')}",${r.author},${r.dynasty}`
    ).join('\n');
    const ketikuCsvContent = '\ufeff' + ketikuCsvHeader + ketikuCsvRows;

    // 生成课艺库CSV
    const keyikuCsvHeader = 'library_type,academy,year,season,category,subject,author,dynasty,description,file_url\n';
    const keyikuCsvRows = keyikuRecords.map(r =>
      `${r.library_type},${r.academy},${r.year},${r.season},${r.category},"${r.subject.replace(/"/g, '""')}",${r.author},${r.dynasty},"${r.description.replace(/"/g, '""')}",`
    ).join('\n');
    const keyikuCsvContent = '\ufeff' + keyikuCsvHeader + keyikuCsvRows;

    // 保存CSV文件
    fs.writeFileSync(ketikuCsvPath, ketikuCsvContent, 'utf8');
    fs.writeFileSync(keyikuCsvPath, keyikuCsvContent, 'utf8');

    console.log('📝 课题库CSV已生成:', ketikuCsvPath);
    console.log('📝 课艺库CSV已生成:', keyikuCsvPath);

    console.log('\n📊 课题库统计:');
    const ketikuStats = {
      byYear: {},
      bySeason: {},
      byCategory: {},
    };

    ketikuRecords.forEach(r => {
      ketikuStats.byYear[r.year] = (ketikuStats.byYear[r.year] || 0) + 1;
      ketikuStats.bySeason[r.season] = (ketikuStats.bySeason[r.season] || 0) + 1;
      ketikuStats.byCategory[r.category] = (ketikuStats.byCategory[r.category] || 0) + 1;
    });

    console.log('\n按年份统计:');
    Object.entries(ketikuStats.byYear).sort().forEach(([year, count]) => {
      console.log(`  ${year}: ${count}条`);
    });

    console.log('\n按类别统计:');
    Object.entries(ketikuStats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}条`);
    });

    console.log('\n\n📊 课艺库统计:');
    const keyikuStats = {
      byYear: {},
      byCategory: {},
    };

    keyikuRecords.forEach(r => {
      keyikuStats.byYear[r.year] = (keyikuStats.byYear[r.year] || 0) + 1;
      keyikuStats.byCategory[r.category] = (keyikuStats.byCategory[r.category] || 0) + 1;
    });

    console.log('\n按年份统计:');
    Object.entries(keyikuStats.byYear).sort().forEach(([year, count]) => {
      console.log(`  ${year}: ${count}条`);
    });

    console.log('\n按类别统计:');
    Object.entries(keyikuStats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}条`);
    });

    console.log('\n✅ 处理完成! 两个CSV文件可以分别导入系统了。');

  } catch (error) {
    console.error('❌ 解析失败:', error);
    throw error;
  }
}

// 执行解析
parseWordToCSV().catch(console.error);
