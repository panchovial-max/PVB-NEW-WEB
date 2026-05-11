// Supabase Utility for Netlify Functions
// This file provides a configured Supabase client for backend use

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for backend operations
 * Uses service_role key for admin-level access
 * NEVER expose this client or key to frontend
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Creates a Supabase client with user context
 * Uses anon key and user's JWT token
 */
export function getSupabaseClient(userToken) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: userToken ? { Authorization: `Bearer ${userToken}` } : {}
    }
  });
}

/**
 * Validates a user's session token
 * Returns user data if valid, null if invalid
 */
export async function validateUserSession(sessionToken) {
  const supabase = getSupabaseAdmin();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Ensures user_profiles row exists for the user (FK requirement for social_accounts)
 */
export async function ensureUserProfile(userId, userData = {}) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      ...userData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('ensureUserProfile error:', error);
    // Don't throw — profile might already exist with more complete data
  }
}

/**
 * Stores OAuth token for a social media account
 */
export async function storeSocialAccountToken(userId, platform, accountData) {
  const supabase = getSupabaseAdmin();

  // Ensure user_profiles row exists (social_accounts FK requires it)
  await ensureUserProfile(userId);

  const { data, error } = await supabase
    .from('social_accounts')
    .upsert({
      user_id: userId,
      platform: platform,
      account_id: accountData.id,
      account_name: accountData.name,
      access_token: accountData.access_token,
      refresh_token: accountData.refresh_token || null,
      token_expires_at: accountData.expires_at || null,
      connected_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      metadata: {
        username: accountData.username || null,
        profile_picture: accountData.profile_picture || null
      }
    }, {
      onConflict: 'user_id,platform,account_id'
    });

  if (error) {
    throw new Error(`Failed to store ${platform} account: ${error.message}`);
  }

  return data;
}

/**
 * Get all social accounts for a user
 */
export async function getUserSocialAccounts(userId) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get social accounts: ${error.message}`);
  }

  return data;
}

/**
 * Creates a secure OAuth state nonce and stores the session server-side.
 * Returns the nonce string to use as the OAuth state parameter.
 */
export async function createOAuthState(userId, sessionToken, platform, extra = {}) {
  const { randomBytes } = await import('crypto');
  const nonce = randomBytes(32).toString('hex');
  const supabase = getSupabaseAdmin();

  await supabase.from('oauth_states').upsert({
    nonce,
    user_id: userId,
    session_token: sessionToken,
    platform,
    extra: JSON.stringify(extra),
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min expiry
  });

  return nonce;
}

/**
 * Validates an OAuth state nonce and returns the stored session data.
 * Deletes the nonce after use (one-time use).
 */
export async function consumeOAuthState(nonce) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('oauth_states')
    .select('*')
    .eq('nonce', nonce)
    .single();

  if (error || !data) return null;

  // Delete used nonce
  await supabase.from('oauth_states').delete().eq('nonce', nonce);

  // Check expiry
  if (new Date(data.expires_at) < new Date()) return null;

  return {
    session_token: data.session_token,
    user_id: data.user_id,
    platform: data.platform,
    extra: data.extra ? JSON.parse(data.extra) : {}
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, profileData) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_profiles')
    .update(profileData)
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data;
}
