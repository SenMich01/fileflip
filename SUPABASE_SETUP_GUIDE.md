# Supabase Authentication Setup Guide

## Environment Variables Configuration

### Backend Service (fileflip-1.onrender.com)
Set these environment variables in Render.com:

```
VITE_SUPABASE_URL=https://qywnkclecicqpdauafht.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5d25rY2xlY2ljcXBkYXVhZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDU3NDgsImV4cCI6MjA4NzkyMTc0OH0.C3Nq9G2A4xOdegbq7IQMOFh3YYpgAcIMgSRmGIZ4nz8
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5d25rY2xlY2ljcXBkYXVhZmh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0NTc0OCwiZXhwIjoyMDg3OTIxNzQ4fQ.2S5UBfgnK4DDjuI1XCkWkKur2qokmS8eArfq-MR5c8g
FRONTEND_URL=https://fileflip-2.onrender.com
NODE_ENV=production
WEB_CONCURRENCY=4
```

### Frontend Service (fileflip-2.onrender.com)
Set these environment variables in Render.com:

```
VITE_API_URL=https://fileflip-1.onrender.com
```

## Supabase Dashboard Configuration

### 1. Authentication Settings
Go to your Supabase dashboard → Authentication → URL Configuration

Add these URLs:
- **Site URL**: `https://fileflip-2.onrender.com`
- **Redirect URLs**: 
  - `https://fileflip-2.onrender.com/login`
  - `https://fileflip-2.onrender.com/signup`
  - `https://fileflip-2.onrender.com/forgot-password`

### 2. Email Templates
Go to Authentication → Templates and customize email templates for:
- Email confirmation
- Password reset
- Magic link

### 3. Providers
Go to Authentication → Providers and enable:
- Email (for email/password authentication)

### 4. Rate Limiting
Go to Authentication → Settings and configure:
- Rate limiting for signups and signins
- Email rate limits

## CORS Configuration

The backend server is configured to allow CORS from the frontend URL. Make sure:
- `FRONTEND_URL` environment variable is set correctly
- The frontend domain matches exactly what's in the Supabase settings

## Database Setup

### 1. Run the Schema
Execute the SQL from `supabase-schema.sql` in your Supabase SQL editor:

```sql
-- Create conversions table
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  conversion_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_conversions_user_id ON conversions(user_id);
CREATE INDEX idx_conversions_created_at ON conversions(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversions_updated_at 
  BEFORE UPDATE ON conversions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own conversions" ON conversions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions" ON conversions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversions" ON conversions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversions" ON conversions
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Testing Authentication

### 1. Check Environment Variables
Open browser console and check:
```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 2. Test API Connection
```javascript
fetch('https://fileflip-1.onrender.com/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 3. Test Supabase Connection
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qywnkclecicqpdauafht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5d25rY2xlY2ljcXBkYXVhZmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDU3NDgsImV4cCI6MjA4NzkyMTc0OH0.C3Nq9G2A4xOdegbq7IQMOFh3YYpgAcIMgSRmGIZ4nz8'
);

supabase.auth.getUser().then(({ data, error }) => {
  console.log('User:', data.user);
  console.log('Error:', error);
});
```

## Common Issues and Solutions

### 1. "Network error. Please try again."
- Check environment variables are set correctly
- Verify CORS is enabled for your frontend domain
- Check Supabase Auth settings include your frontend URL
- Look at browser console for detailed error messages

### 2. "Invalid token" errors
- Ensure tokens are being stored and retrieved correctly
- Check token format and expiration
- Verify Supabase service key is correct

### 3. CORS errors
- Make sure `FRONTEND_URL` environment variable is set
- Check that the frontend domain matches exactly
- Verify CORS is enabled in the backend server

### 4. Database connection issues
- Ensure Supabase service key is correct
- Check that the database schema is created
- Verify row level security policies are set up

## Debugging Steps

1. **Check Backend Logs**: Look at Render.com logs for the backend service
2. **Check Frontend Console**: Open browser dev tools and check console for errors
3. **Test API Endpoints**: Use curl or Postman to test API endpoints directly
4. **Verify Supabase**: Check Supabase dashboard for authentication events
5. **Network Tab**: Check browser network tab for failed requests

## Security Best Practices

1. **Environment Variables**: Never commit environment variables to git
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely in localStorage
4. **CORS**: Only allow specific domains, not wildcard (*)
5. **Rate Limiting**: Configure appropriate rate limits in Supabase