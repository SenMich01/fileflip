# Supabase Auth Configuration Guide

This guide covers the manual configuration steps needed for Supabase Auth settings that cannot be automated through the MCP server.

## Tasks to Complete Manually

### 1. Set Site URL to "https://fileflip-2.onrender.com"

**Location**: Supabase Dashboard → Authentication → URL Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://fileflip-2.onrender.com`
4. Click **Save**

### 2. Add Redirect URLs

**Location**: Supabase Dashboard → Authentication → URL Configuration

In the **Additional Redirect URLs** section, add:
- `https://fileflip-2.onrender.com`

**Note**: The Site URL automatically gets added to the allowed redirect URLs, but you may want to add the specific redirect URL for your application.

### 3. Configure Email Templates

**Location**: Supabase Dashboard → Authentication → Email Templates

Update the email templates to use the correct redirect URL:

1. **Email Confirmation Template**:
   ```html
   <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```

2. **Password Reset Template**:
   ```html
   <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
   ```

3. **Magic Link Template**:
   ```html
   <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log in to your account</a>
   ```

### 4. Configure Auth Providers (Optional)

**Location**: Supabase Dashboard → Authentication → Providers

If you want to enable social login providers:
1. Enable the providers you want (Google, GitHub, etc.)
2. Configure the OAuth credentials for each provider
3. Set the redirect URL to: `https://fileflip-2.onrender.com/auth/callback`

### 5. Configure Rate Limits

**Location**: Supabase Dashboard → Authentication → Rate Limits

Recommended settings for production:
- **Email OTP**: 5 requests per 60 seconds
- **Magic Link**: 5 requests per 60 seconds
- **Password Reset**: 3 requests per 60 seconds
- **Sign Up**: 10 requests per 60 seconds

### 6. Configure Security Settings

**Location**: Supabase Dashboard → Authentication → Security

Recommended settings:
- **Enable email confirmations**: ON
- **Enable email change token**: ON
- **Enable password reset**: ON
- **Enable signups**: ON (for public signup) or OFF (for admin-only signup)

## Database Configuration

### 7. Apply the Profiles Table Schema

Run the SQL from `profiles-table.sql` in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Paste the contents of `profiles-table.sql`
4. Click **Run**

This will:
- Create the `profiles` table linked to `auth.users`
- Set up automatic profile creation on user signup
- Configure Row Level Security policies
- Create necessary indexes and triggers

### 8. Configure RLS Policies

The SQL script in `profiles-table.sql` already sets up the necessary RLS policies, but you can verify them in:
**Database** → **Tables** → **profiles** → **RLS**

## Testing the Configuration

### 9. Test Authentication Flow

1. **Test Signup**: Try signing up a new user
2. **Test Login**: Try logging in with the new user
3. **Test Password Reset**: Try the forgot password flow
4. **Test Redirects**: Ensure users are redirected to the correct URLs

### 10. Test Dashboard Access

1. Log in successfully
2. Verify you're redirected to `/dashboard`
3. Try accessing `/dashboard` directly without logging in - should redirect to `/login`

## Environment Variables

Ensure your `.env` file has the correct values:

```env
VITE_SUPABASE_URL=https://qywnkclecicqpdauafht.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://fileflip-2.onrender.com
```

## Troubleshooting

### Common Issues

1. **Redirect URL Mismatch**: Ensure the redirect URLs in Supabase match your application URLs
2. **CORS Issues**: Check that your frontend URL is in the CORS allowed origins
3. **RLS Policies**: Ensure RLS policies are correctly configured for your use case
4. **Email Templates**: Verify email templates use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}`

### Debugging

1. Check the browser console for JavaScript errors
2. Check the network tab for failed API requests
3. Check Supabase logs for authentication errors
4. Verify environment variables are correctly set

## Next Steps

After completing this configuration:

1. **Deploy to Render**: Ensure your application is deployed to `https://fileflip-2.onrender.com`
2. **Test End-to-End**: Test the complete user flow from signup to dashboard access
3. **Monitor Logs**: Keep an eye on authentication logs for any issues
4. **Consider Production Security**: Review all security settings for production readiness