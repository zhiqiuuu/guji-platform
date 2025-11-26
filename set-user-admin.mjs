/**
 * 将用户设置为管理员
 * 直接使用Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qhbpykzqydfimjjejtgg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoYnB5a3pxeWRmaW1qamVqdGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU4NTQ5MywiZXhwIjoyMDQ4MTYxNDkzfQ.ULYe_FMxCGIyDpg2lFQMgVwXF8oYvJgOFo0KkXBUh2g';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setUserAsAdmin() {
  try {
    console.log('🔧 正在将用户设置为管理员...\n');

    // 用户ID
    const userId = '4d6bd98d-69d1-45ae-a717-cd3edcaad3f6';

    // 更新user_profiles表
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ 更新失败:', error);
      return;
    }

    console.log('✅ 用户角色已更新为管理员!');
    console.log('📋 更新结果:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ 出错:', error.message);
  }
}

setUserAsAdmin();
