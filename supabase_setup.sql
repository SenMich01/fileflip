-- ============================================================
-- FileFlip Supabase Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_filename TEXT NOT NULL,
  converted_filename TEXT NOT NULL,
  conversion_type TEXT CHECK (conversion_type IN ('pdf-to-docx', 'docx-to-pdf')) NOT NULL,
  file_size_kb NUMERIC,
  status TEXT CHECK (status IN ('success', 'failed')) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: users can only see & manage their own rows
CREATE POLICY "Users can only access their own conversions"
ON conversions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC);

-- ============================================================
-- Storage bucket setup (run via Supabase Dashboard or CLI)
-- Dashboard → Storage → New Bucket
--   Name: fileflip-files
--   Public: false
--   File size limit: 20971520 (20MB)
-- ============================================================
