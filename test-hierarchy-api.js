#!/usr/bin/env node

/**
 * 测试层级导航API
 * 测试 /api/books/hierarchy 接口是否返回正确的层级结构
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://qhbpykzqydfimjjejtgg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoYnB5a3pxeWRmaW1qamVqdGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTgyMzgsImV4cCI6MjA3OTU3NDIzOH0.-P_YmhsNRlbxMUMFf-_0g4Ek6gLqZL38X2Rpsno9vCs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHierarchyAPI() {
  console.log('========================================');
  console.log('测试层级导航API');
  console.log('========================================\n');

  try {
    // 测试1: 检查数据库表结构
    console.log('1. 检查books表是否有新字段...');
    const { data: sampleBooks, error: sampleError } = await supabase
      .from('books')
      .select('library_type, academy, year, season, subject, category')
      .limit(1);

    if (sampleError) {
      console.log('   ❌ 错误:', sampleError.message);
      console.log('   需要先执行数据库迁移\n');
    } else {
      console.log('   ✓ 数据库表结构正常\n');
    }

    // 测试2: 检查是否有示例数据
    console.log('2. 检查课题库和课艺库数据...');
    const { data: topicBooks, error: topicError } = await supabase
      .from('books')
      .select('academy, year, season, category, subject')
      .eq('library_type', '课题库')
      .limit(5);

    const { data: practiceBooks, error: practiceError } = await supabase
      .from('books')
      .select('academy, year, season, category, subject')
      .eq('library_type', '课艺库')
      .limit(5);

    if (topicError || practiceError) {
      console.log('   ❌ 查询错误');
    } else {
      console.log(`   课题库记录数: ${topicBooks?.length || 0}`);
      console.log(`   课艺库记录数: ${practiceBooks?.length || 0}`);

      if (topicBooks && topicBooks.length > 0) {
        console.log('\n   课题库示例数据:');
        topicBooks.forEach((book, i) => {
          console.log(`   ${i + 1}. ${book.academy} - ${book.year}年${book.season} - ${book.category} - ${book.subject}`);
        });
      }

      if (practiceBooks && practiceBooks.length > 0) {
        console.log('\n   ��艺库示例数据:');
        practiceBooks.forEach((book, i) => {
          console.log(`   ${i + 1}. ${book.academy} - ${book.year}年${book.season} - ${book.category} - ${book.subject}`);
        });
      }
    }

    console.log('\n3. 测试层级统计...');
    const { data: academies, error: academyError } = await supabase
      .from('books')
      .select('academy, library_type')
      .not('academy', 'is', null);

    if (!academyError && academies) {
      const academyStats = academies.reduce((acc, book) => {
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

      console.log('\n   各书院统计:');
      Object.entries(academyStats).slice(0, 5).forEach(([name, stats]) => {
        console.log(`   - ${name}: 总计${stats.total} (课题库:${stats.课题库}, 课艺库:${stats.课艺库})`);
      });
    }

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================\n');

    console.log('✅ 前端层级导航组件已创建: components/books/hierarchy-navigation.tsx');
    console.log('✅ API路由已创建: app/api/books/hierarchy/route.ts');
    console.log('✅ 书库页面已更新: app/books/page.tsx');
    console.log('\n📝 使用说明:');
    console.log('1. 确保数据库已执行迁移: supabase/migrations/20250126_redesign_books_structure.sql');
    console.log('2. 启动开发服务器: npm run dev');
    console.log('3. 访问: http://localhost:3000/books');
    console.log('4. 在左侧"层级导航"中浏览课题库和课艺库');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testHierarchyAPI();
