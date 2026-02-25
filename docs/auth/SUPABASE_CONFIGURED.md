# Supabase Configuration - PVB Estudio Creativo

## ✅ Configuration Complete

Supabase has been successfully configured for PVB Estudio Creativo.

### Credentials Configured

- **Supabase URL**: `https://krmoihryyvooymvhsuno.supabase.co`
- **Supabase Anon Key**: `sb_publishable_siFuszUIw5ibS-2Y15O4-Q_k484kZ8i`

### Files Updated

1. **login.html** - Supabase credentials configured
2. **supabase-config.js** - Configuration file updated

## Next Steps

### 1. Enable OAuth Providers in Supabase Dashboard

Go to your Supabase dashboard: https://krmoihryyvooymvhsuno.supabase.co

1. Navigate to **Authentication** → **Providers**
2. Enable the providers you want:

#### Google
- Click **Google**
- Toggle **Enable Google provider**
- Add your Google OAuth credentials
- **Redirect URL**: `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

#### Facebook
- Click **Facebook**
- Toggle **Enable Facebook provider**
- Add your Facebook App credentials
- **Redirect URL**: `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

#### GitHub
- Click **GitHub**
- Toggle **Enable GitHub provider**
- Add your GitHub OAuth App credentials
- **Redirect URL**: `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

#### Apple
- Click **Apple**
- Toggle **Enable Apple provider**
- Add your Apple credentials
- **Redirect URL**: `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

#### Microsoft/Azure
- Click **Azure**
- Toggle **Enable Azure provider**
- Add your Azure AD credentials
- **Redirect URL**: `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

### 2. Configure Redirect URLs

In Supabase dashboard:
- Go to **Authentication** → **URL Configuration**
- Add these redirect URLs:
  - `http://localhost:8001/login.html` (local development)
  - `http://localhost:8000/login.html` (alternative local port)
  - `https://yourdomain.com/login.html` (production - replace with your domain)

### 3. Test the Integration

1. **Test Email/Password Signup**:
   - Open `login.html`
   - Click "SIGN UP"
   - Fill out the form and submit
   - Should create account via Supabase

2. **Test Email/Password Login**:
   - Use the email/password you just created
   - Should authenticate via Supabase

3. **Test Social Login**:
   - Click any social login button
   - Should redirect to Supabase OAuth flow
   - Complete OAuth and return to your app

### 4. Configure Email Settings (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize email templates if desired
3. Go to **Settings** → **Auth**
4. Configure:
   - **Enable email confirmations**: Toggle based on preference
   - **Site URL**: Set to your production URL

## Features Now Available

✅ **Email/Password Authentication** - Via Supabase Auth
✅ **Social OAuth Login** - Google, Facebook, GitHub, Apple, Microsoft
✅ **Automatic Fallback** - Falls back to custom API if Supabase unavailable
✅ **Session Management** - Handled by Supabase
✅ **Email Verification** - Optional email verification
✅ **Password Reset** - Built-in password reset flow

## Security Notes

- The `anon` key is safe for client-side use (it's public)
- Never expose the `service_role` key in client-side code
- Consider enabling Row Level Security (RLS) in Supabase
- Use environment variables in production if needed

## Troubleshooting

### Supabase Not Initializing

Check browser console for errors. Common issues:
- Supabase CDN not loading
- Network connectivity issues
- CORS configuration in Supabase

### OAuth Not Working

- Verify providers are enabled in Supabase dashboard
- Check redirect URLs are correctly configured
- Ensure provider credentials (Client ID, Secret) are correct

### Session Not Persisting

- Check localStorage is enabled in browser
- Verify cookies are allowed
- Check Supabase auth settings

## Resources

- **Supabase Dashboard**: https://krmoihryyvooymvhsuno.supabase.co
- **Supabase Docs**: https://supabase.com/docs
- **Auth Guide**: https://supabase.com/docs/guides/auth

