import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量');
  console.error('请检查 .env.local 文件中的配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllBooks() {
  try {
    console.log('🗑️  开始删除所有书籍...');
    
    // 先获取总数
    const { count, error: countError } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    console.log(`📊 数据库中共有 ${count} 本书籍`);
    
    if (count === 0) {
      console.log('✅ 数据库已经是空的，无需删除');
      return;
    }
    
    // 分批删除,每次1000条
    const batchSize = 1000;
    let totalDeleted = 0;
    
    while (totalDeleted < count) {
      const { data, error } = await supabase
        .from('books')
        .select('id')
        .limit(batchSize);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      const ids = data.map(book => book.id);
      
      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        throw deleteError;
      }
      
      totalDeleted += data.length;
      console.log(`  已删除 ${totalDeleted}/${count} 本书籍...`);
    }
    
    console.log(`✅ 成功删除所有 ${totalDeleted} 本书籍`);
    
    // 验证删除结果
    const { count: remainingCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 删除后剩余书籍数: ${remainingCount}`);
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
    process.exit(1);
  }
}

deleteAllBooks();
