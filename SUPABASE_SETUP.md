# Supabase Integration Guide for PVB Estudio Creativo

## Overview
This project now supports Supabase Authentication as an alternative to the custom OAuth implementation. Supabase provides managed authentication with support for multiple providers.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - **Name**: PVB Estudio Creativo
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to your users
5. Wait for the project to be created (usually 1-2 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Supabase in Your Project

#### Option A: Environment Variables (Recommended for Production)

Create a `.env` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

#### Option B: Direct Configuration in HTML

In `login.html`, find the Supabase configuration section and update:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

#### Option C: Set via Window (for Testing)

Add to your HTML before the script tags:

```html
<script>
    window.SUPABASE_URL = 'https://your-project.supabase.co';
    window.SUPABASE_ANON_KEY = 'your-anon-key-here';
</script>
```

### 4. Enable OAuth Providers in Supabase

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable the providers you want to support:

#### Google
- Click **Google**
- Toggle **Enable Google provider**
- Add your Google OAuth credentials:
  - **Client ID** (from Google Cloud Console)
  - **Client Secret** (from Google Cloud Console)
- Click **Save**

#### Facebook
- Click **Facebook**
- Toggle **Enable Facebook provider**
- Add your Facebook App credentials:
  - **Client ID** (App ID from Facebook Developers)
  - **Client Secret** (App Secret from Facebook Developers)
- Click **Save**

#### GitHub
- Click **GitHub**
- Toggle **Enable GitHub provider**
- Add your GitHub OAuth App credentials:
  - **Client ID** (from GitHub Settings → Developer settings → OAuth Apps)
  - **Client Secret** (from GitHub OAuth Apps)
- Click **Save**

#### Apple
- Click **Apple**
- Toggle **Enable Apple provider**
- Add your Apple credentials:
  - **Services ID** (from Apple Developer Portal)
  - **Secret Key** (from Apple Developer Portal)
  - **Team ID** (from Apple Developer Portal)
- Click **Save**

#### Microsoft/Azure
- Click **Azure**
- Toggle **Enable Azure provider**
- Add your Azure AD credentials:
  - **Client ID** (Application ID from Azure Portal)
  - **Client Secret** (from Azure Portal)
  - **Tenant ID** (Directory ID from Azure Portal)
- Click **Save**

### 5. Configure Redirect URLs

In Supabase, go to **Authentication** → **URL Configuration**:

Add these redirect URLs:
- `http://localhost:8001/login.html` (for local development)
- `https://yourdomain.com/login.html` (for production)
- `http://localhost:8000/login.html` (alternative local port)

### 6. Email Configuration (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize email templates if desired
3. Go to **Settings** → **Auth**
4. Configure:
   - **Enable email confirmations**: Toggle based on your preference
   - **Enable email change confirmations**: Recommended ON
   - **Site URL**: Set to your production URL

## Features

### Supported Authentication Methods

✅ **Email/Password** - Traditional signup and login
✅ **Google OAuth** - Sign in with Google
✅ **Facebook OAuth** - Sign in with Facebook
✅ **GitHub OAuth** - Sign in with GitHub
✅ **Apple OAuth** - Sign in with Apple
✅ **Microsoft OAuth** - Sign in with Microsoft/Azure AD

### Automatic Fallback

The login system automatically falls back to the custom API implementation if:
- Supabase is not configured
- Supabase credentials are invalid
- Supabase is unavailable

## Usage

### Email/Password Login

Users can sign up and log in with email/password. Supabase handles:
- Password hashing
- Email verification (if enabled)
- Password reset emails
- Session management

### Social Login

Users can click any social login button to authenticate with that provider. The flow:
1. User clicks provider button
2. Redirected to provider's OAuth page
3. User authorizes the app
4. Redirected back to your app
5. Automatically logged in

## Testing

1. **Test Email Signup**:
   - Fill out the signup form
   - Submit
   - Check your email for verification (if enabled)
   - Log in

2. **Test Social Login**:
   - Click a social login button
   - Complete OAuth flow
   - Should redirect to dashboard

3. **Test Fallback**:
   - Disable Supabase (set invalid URL)
   - Try logging in
   - Should fall back to custom API

## Security Notes

- Never commit your Supabase keys to version control
- Use environment variables in production
- The `anon` key is safe for client-side use (it's public)
- Never use the `service_role` key on the client side
- Enable Row Level Security (RLS) in Supabase for database protection

## Troubleshooting

### "Supabase not initialized" error
- Check that Supabase URL and key are correctly set
- Verify the Supabase CDN script is loaded
- Check browser console for errors

### OAuth redirect not working
- Verify redirect URLs in Supabase settings match your app
- Check that OAuth providers are enabled in Supabase
- Ensure provider credentials are correct

### Email not sending
- Check Supabase email settings
- Verify SMTP configuration (if using custom SMTP)
- Check spam folder

### Session not persisting
- Check localStorage is enabled in browser
- Verify cookies are allowed
- Check Supabase auth settings

## Next Steps

1. Set up Row Level Security (RLS) policies in Supabase
2. Configure custom SMTP for emails
3. Set up user roles and permissions
4. Integrate Supabase database for additional user data
5. Set up Supabase storage for file uploads

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

