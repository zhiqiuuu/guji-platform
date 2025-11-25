-- =====================================================
-- 修复用户系统迁移 - 处理已存在的对象
-- 如果某些表或策略已存在,这个脚本会先删除再重建
-- =====================================================

-- 删除已存在的RLS策略
DO $$
BEGIN
  -- user_profiles 策略
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

  -- bookshelf 策略
  DROP POLICY IF EXISTS "Users can view their own bookshelf" ON public.bookshelf;
  DROP POLICY IF EXISTS "Users can insert to their own bookshelf" ON public.bookshelf;
  DROP POLICY IF EXISTS "Users can update their own bookshelf" ON public.bookshelf;
  DROP POLICY IF EXISTS "Users can delete from their own bookshelf" ON public.bookshelf;

  -- reading_history 策略
  DROP POLICY IF EXISTS "Users can view their own reading history" ON public.reading_history;
  DROP POLICY IF EXISTS "Users can insert their own reading history" ON public.reading_history;
  DROP POLICY IF EXISTS "Users can update their own reading history" ON public.reading_history;
  DROP POLICY IF EXISTS "Users can delete their own reading history" ON public.reading_history;

  -- reading_notes 策略
  DROP POLICY IF EXISTS "Users can view their own notes" ON public.reading_notes;
  DROP POLICY IF EXISTS "Users can insert their own notes" ON public.reading_notes;
  DROP POLICY IF EXISTS "Users can update their own notes" ON public.reading_notes;
  DROP POLICY IF EXISTS "Users can delete their own notes" ON public.reading_notes;

  -- search_history 策略
  DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
  DROP POLICY IF EXISTS "Anyone can insert search history" ON public.search_history;
EXCEPTION
  WHEN undefined_object THEN
    -- 策略不存在,忽略错误
    NULL;
END $$;

-- 重新创建RLS策略

-- 用户配置表策略
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 书架策略
CREATE POLICY "Users can view their own bookshelf"
  ON public.bookshelf FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own bookshelf"
  ON public.bookshelf FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookshelf"
  ON public.bookshelf FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own bookshelf"
  ON public.bookshelf FOR DELETE
  USING (auth.uid() = user_id);

-- 阅读历史策略
CREATE POLICY "Users can view their own reading history"
  ON public.reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading history"
  ON public.reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading history"
  ON public.reading_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading history"
  ON public.reading_history FOR DELETE
  USING (auth.uid() = user_id);

-- 阅读笔记策略
CREATE POLICY "Users can view their own notes"
  ON public.reading_notes FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own notes"
  ON public.reading_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.reading_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.reading_notes FOR DELETE
  USING (auth.uid() = user_id);

-- 搜索历史策略
CREATE POLICY "Users can view their own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert search history"
  ON public.search_history FOR INSERT
  WITH CHECK (true);
