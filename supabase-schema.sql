-- PVB Estudio Creativo - Supabase Database Schema
-- Complete schema for user authentication, social accounts, and metrics tracking

-- ============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- 2. SOCIAL MEDIA ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'twitter')),
    account_id TEXT NOT NULL, -- Platform-specific account ID
    account_name TEXT NOT NULL, -- Display name
    account_username TEXT, -- @username
    access_token TEXT NOT NULL, -- OAuth access token (encrypted)
    refresh_token TEXT, -- OAuth refresh token (encrypted)
    token_expires_at TIMESTAMP WITH TIME ZONE,
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform, account_id)
);

-- Enable Row Level Security
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own social accounts
CREATE POLICY "Users can view own social accounts"
ON public.social_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own social accounts
CREATE POLICY "Users can insert own social accounts"
ON public.social_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own social accounts
CREATE POLICY "Users can update own social accounts"
ON public.social_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own social accounts
CREATE POLICY "Users can delete own social accounts"
ON public.social_accounts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. SOCIAL MEDIA METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE NOT NULL,
    metric_date DATE NOT NULL,

    -- Common metrics across platforms
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,

    -- Engagement metrics
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    impressions_count INTEGER DEFAULT 0,
    reach_count INTEGER DEFAULT 0,

    -- Video metrics (TikTok, Instagram Reels, YouTube)
    video_views INTEGER DEFAULT 0,
    video_watch_time INTEGER DEFAULT 0, -- in seconds

    -- Platform-specific metrics (stored as JSONB for flexibility)
    platform_specific JSONB,

    -- Engagement rate calculation
    engagement_rate DECIMAL(5,2), -- Calculated: (likes + comments + shares) / followers * 100

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(account_id, metric_date)
);

-- Enable Row Level Security
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view metrics for their own social accounts
CREATE POLICY "Users can view own social metrics"
ON public.social_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.social_accounts
        WHERE social_accounts.id = social_metrics.account_id
        AND social_accounts.user_id = auth.uid()
    )
);

-- Create index for faster queries
CREATE INDEX idx_social_metrics_account_date ON public.social_metrics(account_id, metric_date DESC);
CREATE INDEX idx_social_accounts_user_platform ON public.social_accounts(user_id, platform);

-- ============================================
-- 4. POST PERFORMANCE TABLE (optional - for detailed post tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE NOT NULL,
    post_id TEXT NOT NULL, -- Platform-specific post ID
    post_url TEXT,
    post_type TEXT CHECK (post_type IN ('image', 'video', 'carousel', 'story', 'reel')),
    caption TEXT,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Performance metrics
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,

    -- Engagement rate for this specific post
    engagement_rate DECIMAL(5,2),

    -- Platform-specific data
    platform_specific JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(account_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.post_performance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view post performance for their own accounts
CREATE POLICY "Users can view own post performance"
ON public.post_performance FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.social_accounts
        WHERE social_accounts.id = post_performance.account_id
        AND social_accounts.user_id = auth.uid()
    )
);

CREATE INDEX idx_post_performance_account ON post_performance(account_id, published_at DESC);

-- ============================================
-- 5. CAMPAIGN TRACKING TABLE (for marketing campaigns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    campaign_name TEXT NOT NULL,
    campaign_type TEXT CHECK (campaign_type IN ('awareness', 'engagement', 'conversion', 'traffic')),
    start_date DATE NOT NULL,
    end_date DATE,
    budget DECIMAL(10,2),

    -- Platforms involved in this campaign
    platforms TEXT[], -- ['instagram', 'facebook', 'tiktok']

    -- Campaign goals
    target_impressions INTEGER,
    target_reach INTEGER,
    target_engagement INTEGER,

    -- Results (updated periodically)
    actual_impressions INTEGER DEFAULT 0,
    actual_reach INTEGER DEFAULT 0,
    actual_engagement INTEGER DEFAULT 0,

    -- ROI metrics
    spend DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    roas DECIMAL(10,2), -- Return on Ad Spend

    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own campaigns
CREATE POLICY "Users can view own campaigns"
ON public.campaigns FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can manage their own campaigns
CREATE POLICY "Users can manage own campaigns"
ON public.campaigns FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_metrics_updated_at BEFORE UPDATE ON public.social_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_performance_updated_at BEFORE UPDATE ON public.post_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
    p_likes INTEGER,
    p_comments INTEGER,
    p_shares INTEGER,
    p_followers INTEGER
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF p_followers = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(((p_likes + p_comments + p_shares)::DECIMAL / p_followers * 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get latest metrics for an account
CREATE OR REPLACE FUNCTION get_latest_metrics(p_account_id UUID)
RETURNS TABLE (
    metric_date DATE,
    followers_count INTEGER,
    engagement_rate DECIMAL(5,2),
    posts_count INTEGER,
    reach_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm.metric_date,
        sm.followers_count,
        sm.engagement_rate,
        sm.posts_count,
        sm.reach_count
    FROM public.social_metrics sm
    WHERE sm.account_id = p_account_id
    ORDER BY sm.metric_date DESC
    LIMIT 30; -- Last 30 days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. INITIAL DATA / SEED DATA (optional)
-- ============================================

-- You can add demo data here for testing if needed
-- Example:
-- INSERT INTO public.user_profiles (id, full_name, company_name, role)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Demo User', 'Demo Company', 'client');

-- ============================================
-- NOTES FOR IMPLEMENTATION
-- ============================================

/*
IMPORTANT SECURITY NOTES:

1. Access Tokens Storage:
   - Store OAuth access tokens encrypted in production
   - Consider using Supabase Vault or encrypt before storing
   - Never expose tokens in frontend code

2. Row Level Security (RLS):
   - All tables have RLS enabled
   - Users can only access their own data
   - Admins need separate policies if you add admin panel

3. Token Refresh:
   - Implement automatic token refresh for expired tokens
   - Set up cron job to refresh tokens before expiration
   - Store refresh_token securely

4. Rate Limiting:
   - Implement rate limiting on API calls to social platforms
   - Track last_sync_at to avoid hitting rate limits
   - Use Netlify Functions rate limiting

5. Data Privacy:
   - Comply with GDPR/CCPA if applicable
   - Allow users to delete their data (CASCADE deletes configured)
   - Implement data export functionality

NETLIFY FUNCTIONS NEEDED:

1. /api/oauth/instagram/callback - Handle Instagram OAuth
2. /api/oauth/facebook/callback - Handle Facebook OAuth
3. /api/oauth/linkedin/callback - Handle LinkedIn OAuth
4. /api/oauth/tiktok/callback - Handle TikTok OAuth
5. /api/metrics/sync - Sync metrics from all platforms
6. /api/metrics/get - Retrieve metrics for dashboard
7. /api/accounts/connect - Connect new social account
8. /api/accounts/disconnect - Disconnect social account

PLATFORM-SPECIFIC NOTES:

INSTAGRAM/FACEBOOK (Meta):
- Use Meta Graph API
- Requires Business Account
- Access Token expires in 60 days (long-lived)
- Metrics available: insights, media, followers

LINKEDIN:
- Use LinkedIn Marketing API
- Requires Company Page access
- Token expires in 60 days
- Metrics: impressions, clicks, engagement

TIKTOK:
- Use TikTok Business API
- Requires Business Account
- Token expires in 24 hours (requires frequent refresh)
- Metrics: views, likes, shares, comments

YOUTUBE/GOOGLE:
- Use YouTube Analytics API
- Requires Channel access
- Token expires in 1 hour (use refresh token)
- Metrics: views, watch time, subscribers

*/
