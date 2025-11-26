-- =====================================================
-- 修复用户配置创建权限问题
-- 允许新用户创建自己的profile
-- =====================================================

-- 临时禁用RLS以手动创建缺失的profiles
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 为现有的auth用户创建缺失的profiles
INSERT INTO public.user_profiles (id, username, display_name, role, default_theme, default_font_size, default_line_height, email_notifications, reading_reminders, weekly_report)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', NULL),
    COALESCE(u.raw_user_meta_data->>'display_name', NULL),
    'user' as role,
    'sepia' as default_theme,
    'medium' as default_font_size,
    'normal' as default_line_height,
    true as email_notifications,
    true as reading_reminders,
    false as weekly_report
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 重新启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 验证所有用户都有profile
SELECT
    u.email,
    p.username,
    p.display_name,
    p.role
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
