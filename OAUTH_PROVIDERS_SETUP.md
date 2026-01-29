# OAuth Providers Setup Guide - PVB Estudio Creativo

## Top 4 OAuth Providers Configuration

This guide covers the setup for the most popular OAuth providers:
1. **Google (Gmail)** - El más usado globalmente
2. **Facebook** - Muy popular en apps de consumidor
3. **Apple** - Requerido para apps iOS con login social
4. **Microsoft** - Popular en entornos empresariales

## Prerequisites

- Supabase project configured: `https://krmoihryyvooymvhsuno.supabase.co`
- Supabase anon key: `sb_publishable_siFuszUIw5ibS-2Y15O4-Q_k484kZ8i`

## 1. Google (Gmail) OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity Services"
   - Click **Enable**
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Select **Web application**
   - Name: `PVB Estudio Creativo`
   - **Authorized JavaScript origins**:
     - `http://localhost:8001`
     - `http://localhost:8000`
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`
     - `http://localhost:8001/login.html`
   - Click **Create**
   - Copy **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to [Supabase Dashboard](https://krmoihryyvooymvhsuno.supabase.co)
2. Navigate to **Authentication** → **Providers**
3. Click **Google**
4. Toggle **Enable Google provider**
5. Enter:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
6. Click **Save**

### Step 3: Test

1. Open `login.html`
2. Click **Google** button
3. Should redirect to Google sign-in
4. After authorization, should return to your app

---

## 2. Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** app type
4. Fill in:
   - **App Name**: PVB Estudio Creativo
   - **App Contact Email**: your email
   - Click **Create App**
5. Add **Facebook Login** product:
   - In dashboard, click **Add Product**
   - Find **Facebook Login** → **Set Up**
6. Configure Facebook Login:
   - Go to **Settings** → **Basic**
   - Add **App Domains**: `localhost`, `yourdomain.com`
   - Add **Privacy Policy URL** (required)
   - Add **Terms of Service URL** (required)
   - Click **Save Changes**
7. Configure OAuth redirect URIs:
   - Go to **Settings** → **Basic** → **Facebook Login** → **Settings**
   - Add **Valid OAuth Redirect URIs**:
     - `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`
     - `http://localhost:8001/login.html`
   - Click **Save Changes**
8. Get credentials:
   - **App ID**: Found in **Settings** → **Basic**
   - **App Secret**: Found in **Settings** → **Basic** (click Show)

### Step 2: Configure in Supabase

1. Go to [Supabase Dashboard](https://krmoihryyvooymvhsuno.supabase.co)
2. Navigate to **Authentication** → **Providers**
3. Click **Facebook**
4. Toggle **Enable Facebook provider**
5. Enter:
   - **Client ID**: Your Facebook App ID
   - **Client Secret**: Your Facebook App Secret
6. Click **Save**

### Step 3: Test

1. Open `login.html`
2. Click **Facebook** button
3. Should redirect to Facebook sign-in
4. After authorization, should return to your app

---

## 3. Apple OAuth Setup

### Step 1: Create Apple Services ID

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (plus button)
4. Select **Services IDs** → **Continue**
5. Register a new identifier:
   - **Description**: PVB Estudio Creativo
   - **Identifier**: `com.pvb.estudio.creativo` (use reverse domain notation)
   - Click **Continue** → **Register**
6. Configure the Services ID:
   - Select your Services ID
   - Check **Sign in with Apple**
   - Click **Configure**
   - **Primary App ID**: Select or create your App ID
   - **Website URLs**:
     - **Domains and Subdomains**: `yourdomain.com`
     - **Return URLs**: 
       - `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`
   - Click **Save** → **Continue** → **Save**
7. Create a Key:
   - Go to **Keys** → **+** (plus button)
   - **Key Name**: PVB Estudio Supabase Key
   - Check **Sign in with Apple**
   - Click **Configure**
   - **Primary App ID**: Select your App ID
   - Click **Save** → **Continue** → **Register**
   - **Download the key** (.p8 file) - You can only download once!
   - Note the **Key ID**

### Step 2: Configure in Supabase

1. Go to [Supabase Dashboard](https://krmoihryyvooymvhsuno.supabase.co)
2. Navigate to **Authentication** → **Providers**
3. Click **Apple**
4. Toggle **Enable Apple provider**
5. Enter:
   - **Services ID**: Your Services ID (e.g., `com.pvb.estudio.creativo`)
   - **Secret Key**: Content of the .p8 file
   - **Key ID**: The Key ID from Apple
   - **Team ID**: Your Apple Team ID (found in Membership section)
6. Click **Save**

### Step 3: Test

1. Open `login.html`
2. Click **Apple** button
3. Should redirect to Apple sign-in
4. After authorization, should return to your app

**Note**: Apple Sign In requires your app to be in an Apple Developer account (paid membership required).

---

## 4. Microsoft (Azure AD) OAuth Setup

### Step 1: Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: PVB Estudio Creativo
   - **Supported account types**: 
     - **Accounts in any organizational directory and personal Microsoft accounts** (recommended)
     - OR **Accounts in any organizational directory** (for enterprise only)
   - **Redirect URI**:
     - **Platform**: Web
     - **URI**: `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`
   - Click **Register**
5. Configure API permissions:
   - Go to **API permissions**
   - Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   - Add:
     - `openid`
     - `email`
     - `profile`
     - `User.Read`
   - Click **Add permissions**
   - Click **Grant admin consent** (if you have admin rights)
6. Create Client Secret:
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - **Description**: Supabase Integration
   - **Expires**: 24 months (recommended)
   - Click **Add**
   - **Copy the secret value immediately** - You can only see it once!
7. Get credentials:
   - **Application (client) ID**: Found in **Overview**
   - **Directory (tenant) ID**: Found in **Overview**
   - **Client secret**: From step 6

### Step 2: Configure in Supabase

1. Go to [Supabase Dashboard](https://krmoihryyvooymvhsuno.supabase.co)
2. Navigate to **Authentication** → **Providers**
3. Click **Azure** (Microsoft)
4. Toggle **Enable Azure provider**
5. Enter:
   - **Client ID**: Your Application (client) ID
   - **Client Secret**: Your Client Secret
   - **Tenant ID**: Your Directory (tenant) ID
     - OR use `common` for both personal and work accounts
     - OR use `consumers` for personal Microsoft accounts only
     - OR use `organizations` for work/school accounts only
6. Click **Save**

### Step 3: Test

1. Open `login.html`
2. Click **Microsoft** button
3. Should redirect to Microsoft sign-in
4. After authorization, should return to your app

---

## Redirect URLs Summary

All providers need these redirect URLs configured:

### In Supabase (Authentication → URL Configuration):
- `http://localhost:8001/login.html` (local development)
- `http://localhost:8000/login.html` (alternative local port)
- `https://yourdomain.com/login.html` (production)

### Provider-specific Redirect URIs:

**Google**:
- `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

**Facebook**:
- `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

**Apple**:
- `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

**Microsoft**:
- `https://krmoihryyvooymvhsuno.supabase.co/auth/v1/callback`

---

## Testing Checklist

After configuring each provider:

- [ ] Provider enabled in Supabase dashboard
- [ ] Credentials (Client ID, Secret) correctly entered
- [ ] Redirect URIs configured in provider's console
- [ ] Redirect URIs configured in Supabase
- [ ] Test login with provider button
- [ ] Verify user data (email, name) is captured
- [ ] Verify session is created and stored
- [ ] Verify redirect to dashboard after login

---

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Verify redirect URI in provider console matches exactly
   - Include both Supabase callback and your app URL

2. **"Invalid client credentials"**
   - Double-check Client ID and Secret
   - Make sure secrets haven't expired (Microsoft/Apple)
   - Regenerate secrets if needed

3. **"OAuth consent screen not configured"** (Google)
   - Complete OAuth consent screen in Google Cloud Console
   - Add required scopes
   - Add test users if app is in testing mode

4. **Apple Sign In not working**
   - Verify Services ID is configured correctly
   - Ensure .p8 key file content is correctly pasted
   - Check Team ID is correct
   - Verify domain verification (if using custom domain)

5. **Microsoft login not working**
   - Verify Tenant ID is correct
   - Check API permissions are granted
   - Ensure admin consent is granted (for enterprise apps)

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** in production
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use HTTPS** in production
5. **Enable email verification** in Supabase
6. **Configure rate limiting** in Supabase
7. **Monitor authentication logs** in Supabase dashboard

---

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

