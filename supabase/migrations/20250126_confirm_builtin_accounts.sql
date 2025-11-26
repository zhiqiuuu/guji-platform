-- =====================================================
-- 确认内置账号的邮箱地址
-- 这将绕过邮箱验证要求
-- =====================================================

-- 更新内置账号的邮箱确认状态
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN ('lzh@guji.com', 'zhiqiu@guji.com');

-- 验证更新结果
SELECT
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email IN ('lzh@guji.com', 'zhiqiu@guji.com');
