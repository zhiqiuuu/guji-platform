import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface HierarchyNode {
  id: string;
  label: string;
  value: string;
  level: number;
  count?: number;
  children?: HierarchyNode[];
  libraryType?: '课题库' | '课艺库';
}

// GET: 获取层级结构
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const academy = searchParams.get('academy');
    const year = searchParams.get('year');
    const season = searchParams.get('season');
    const category = searchParams.get('category');
    const libraryType = searchParams.get('library_type');

    // 如果指定了library_type但没有academy，返回该类型下的书院
    if (libraryType && !academy) {
      let allAcademies: any[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        const { data: batch, error} = await supabase
          .from('books')
          .select('academy, library_type')
          .eq('library_type', libraryType)
          .not('academy', 'is', null)
          .order('academy')
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (!batch || batch.length === 0) break;

        allAcademies = allAcademies.concat(batch);

        if (batch.length < batchSize) break;

        offset += batchSize;
      }

      const academyCounts = allAcademies.reduce((acc: Record<string, number>, book) => {
        const name = book.academy;
        if (name) {
          acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
      }, {});

      const academyNodes: HierarchyNode[] = Object.entries(academyCounts).map(([name, count]) => ({
        id: `${libraryType === '课题库' ? 'topic' : 'practice'}-academy-${name}`,
        label: name,
        value: name,
        level: 2,
        count,
        libraryType: libraryType as '课题库' | '课艺库',
      }));

      return NextResponse.json(academyNodes);
    }

    // 如果指定了具体的过滤条件，只返回该层级的子级
    if (academy && !year) {
      // 返回指定书院下的年份
      let allYears: any[] = [];
      let offset = 0;
      const batchSize = 1000;

      while (true) {
        const { data: batch, error: yearError } = await supabase
          .from('books')
          .select('year')
          .eq('academy', academy)
          .not('year', 'is', null)
          .order('year')
          .range(offset, offset + batchSize - 1);

        if (yearError) throw yearError;

        if (!batch || batch.length === 0) break;

        allYears = allYears.concat(batch);

        if (batch.length < batchSize) break;

        offset += batchSize;
      }

      const yearCounts = allYears.reduce((acc: Record<string, number>, book) => {
        if (book.year) {
          acc[book.year] = (acc[book.year] || 0) + 1;
        }
        return acc;
      }, {});

      const yearNodes: HierarchyNode[] = Object.entries(yearCounts).map(([year, count]) => ({
        id: `year-${year}`,
        label: `${year}年`,
        value: year,
        level: 3,
        count,
      }));

      return NextResponse.json(yearNodes);
    }

    if (academy && year && !season) {
      // 返回指定年份下的季节
      const { data: seasons, error: seasonError } = await supabase
        .from('books')
        .select('season')
        .eq('academy', academy)
        .eq('year', year)
        .not('season', 'is', null)
        .order('season')
        .limit(10000);

      if (seasonError) throw seasonError;

      const seasonOrder = ['春', '夏', '秋', '冬', '春课', '夏课', '秋课', '冬课'];
      const seasonCounts = seasons.reduce((acc: Record<string, number>, book) => {
        if (book.season) {
          acc[book.season] = (acc[book.season] || 0) + 1;
        }
        return acc;
      }, {});

      const seasonNodes: HierarchyNode[] = seasonOrder
        .filter(season => seasonCounts[season])
        .map((season) => ({
          id: `season-${season}`,
          label: season,
          value: season,
          level: 4,
          count: seasonCounts[season],
        }));

      return NextResponse.json(seasonNodes);
    }

    if (academy && year && season && !category) {
      // 返回指定季节下的类别
      const { data: categories, error: categoryError } = await supabase
        .from('books')
        .select('category')
        .eq('academy', academy)
        .eq('year', year)
        .eq('season', season)
        .not('category', 'is', null)
        .order('category')
        .limit(10000);

      if (categoryError) throw categoryError;

      const categoryCounts = categories.reduce((acc: Record<string, number>, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
      }, {});

      const categoryNodes: HierarchyNode[] = Object.entries(categoryCounts).map(([category, count]) => ({
        id: `category-${category}`,
        label: category,
        value: category,
        level: 5,
        count,
      }));

      return NextResponse.json(categoryNodes);
    }

    if (academy && year && season && category) {
      // 返回指定类别下的题目
      const { data: subjects, error: subjectError } = await supabase
        .from('books')
        .select('subject')
        .eq('academy', academy)
        .eq('year', year)
        .eq('season', season)
        .eq('category', category)
        .not('subject', 'is', null)
        .order('subject')
        .limit(10000);

      if (subjectError) throw subjectError;

      const subjectCounts = subjects.reduce((acc: Record<string, number>, book) => {
        if (book.subject) {
          acc[book.subject] = (acc[book.subject] || 0) + 1;
        }
        return acc;
      }, {});

      const subjectNodes: HierarchyNode[] = Object.entries(subjectCounts).map(([subject, count]) => ({
        id: `subject-${subject}`,
        label: subject,
        value: subject,
        level: 6,
        count,
      }));

      return NextResponse.json(subjectNodes);
    }

    // 默认返回顶级结构:书院列表
    // 使用分页查询获取所有数据
    let allAcademies: any[] = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data: batch, error } = await supabase
        .from('books')
        .select('academy, library_type')
        .not('academy', 'is', null)
        .order('academy')
        .range(offset, offset + batchSize - 1);

      if (error) throw error;

      if (!batch || batch.length === 0) break;

      allAcademies = allAcademies.concat(batch);

      if (batch.length < batchSize) break;

      offset += batchSize;
    }

    console.log(`[Hierarchy API] 查询到 ${allAcademies.length} 条数据`);

    // 统计每个书院的课题库和课艺库数量
    const academyStats = allAcademies.reduce((acc: Record<string, any>, book) => {
      const name = book.academy;
      if (!name) return acc;

      if (!acc[name]) {
        acc[name] = { total: 0, 课题库: 0, 课艺库: 0 };
      }
      acc[name].total += 1;
      if (book.library_type) {
        acc[name][book.library_type] = (acc[name][book.library_type] || 0) + 1;
      }
      return acc;
    }, {});

    // 按书院类型分组
    const topicAcademies: HierarchyNode[] = [];
    const practiceAcademies: HierarchyNode[] = [];

    Object.entries(academyStats).forEach(([name, stats]) => {
      if (stats.课题库 > 0) {
        topicAcademies.push({
          id: `topic-academy-${name}`,
          label: name,
          value: name,
          level: 2,
          count: stats.课题库,
          libraryType: '课题库',
        });
      }

      if (stats.课艺库 > 0) {
        practiceAcademies.push({
          id: `practice-academy-${name}`,
          label: name,
          value: name,
          level: 2,
          count: stats.课艺库,
          libraryType: '课艺库',
        });
      }
    });

    // 构建完整的层级结构
    const hierarchy: HierarchyNode[] = [
      {
        id: 'topic-library',
        label: '课题库',
        value: '课题库',
        level: 1,
        count: topicAcademies.reduce((sum, a) => sum + (a.count || 0), 0),
        libraryType: '课题库',
        children: topicAcademies,
      },
      {
        id: 'practice-library',
        label: '课艺库',
        value: '课艺库',
        level: 1,
        count: practiceAcademies.reduce((sum, a) => sum + (a.count || 0), 0),
        libraryType: '课艺库',
        children: practiceAcademies,
      },
    ];

    return NextResponse.json(hierarchy);
  } catch (error) {
    console.error('Failed to fetch hierarchy:', error);
    return NextResponse.json(
      { error: '获取层级结构失败' },
      { status: 500 }
    );
  }
}
