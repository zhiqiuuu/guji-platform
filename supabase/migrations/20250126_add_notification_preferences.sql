-- =====================================================
-- 添加通知偏好设置字段到 user_profiles 表
-- =====================================================

-- 添加通知偏好字段
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reading_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN DEFAULT false;

-- 添加字段注释
COMMENT ON COLUMN public.user_profiles.email_notifications IS '是否接收邮件通知(账户和安全相关)';
COMMENT ON COLUMN public.user_profiles.reading_reminders IS '是否接收每日阅读提醒';
COMMENT ON COLUMN public.user_profiles.weekly_report IS '是否接收每周阅读统计和推荐';
