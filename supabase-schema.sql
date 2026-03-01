-- Create users table (Supabase Auth already handles this, but we can add custom fields)
-- Note: Supabase Auth automatically creates auth.users table
-- This table is for additional user information if needed

-- Create conversions table for tracking file conversions
CREATE TABLE IF NOT EXISTS conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('pdf_to_word', 'epub_to_pdf', 'image_to_pdf')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_conversions_updated_at ON conversions;
CREATE TRIGGER update_conversions_updated_at
    BEFORE UPDATE ON conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) on conversions table
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Create policies for conversions table
-- Users can only see their own conversions
CREATE POLICY "Users can view own conversions" ON conversions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own conversions
CREATE POLICY "Users can insert own conversions" ON conversions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversions
CREATE POLICY "Users can update own conversions" ON conversions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own conversions
CREATE POLICY "Users can delete own conversions" ON conversions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON conversions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;