// Google Drive OAuth Callback - Netlify Function
// Exchanges code for tokens and stores in Supabase

import { getSupabaseAdmin } from './utils/supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';

export const handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const { code, error, error_description } = params;

    if (error) {
      console.error('Drive OAuth error:', error, error_description);
      return { statusCode: 302, headers: { Location: `/master-brain.html?error=${encodeURIComponent(error_description || error)}` } };
    }

    if (!code) {
      return { statusCode: 302, headers: { Location: '/master-brain.html?error=missing_code' } };
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-drive-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Drive token exchange failed:', errText);
      return { statusCode: 302, headers: { Location: `/master-brain.html?error=token_failed` } };
    }

    const tokenData = await tokenRes.json();

    // Get user info from Drive
    const aboutRes = await fetch(`${DRIVE_API}/about?fields=user`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    let driveEmail = 'unknown';
    if (aboutRes.ok) {
      const aboutData = await aboutRes.json();
      driveEmail = aboutData.user?.emailAddress || 'unknown';
    }

    // Store tokens in Supabase (brain_drive_tokens table or social_accounts)
    const supabase = getSupabaseAdmin();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

    // Store in a simple key-value approach using brain_agents metadata
    // Or create a dedicated row in social_accounts with platform 'google_drive'
    await supabase.from('social_accounts').upsert({
      user_id: '00000000-0000-0000-0000-000000000000', // brain system user
      platform: 'google_drive',
      username: driveEmail,
      account_name: 'PVB Master Brain Drive',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: expiresAt.toISOString(),
      is_active: true,
    }, { onConflict: 'user_id,platform' });

    // Auto-create department folders
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1TmLqUdGvwvicoYoR7IrLtgXEl7CmgRcU';
    const departments = ['Creative', 'Marketing', 'Engineering', 'Production', 'QA', 'Analytics', 'Product', 'Support'];

    for (const dept of departments) {
      try {
        // Check if folder exists
        const searchRes = await fetch(
          `${DRIVE_API}/files?q=${encodeURIComponent(`'${rootFolderId}' in parents and name='${dept}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`,
          { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
        );
        const searchData = await searchRes.json();

        if (!searchData.files?.length) {
          // Create folder
          await fetch(`${DRIVE_API}/files`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: dept,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [rootFolderId]
            })
          });
        }
      } catch (e) {
        console.error(`Failed to create folder ${dept}:`, e.message);
      }
    }

    return {
      statusCode: 302,
      headers: { Location: '/master-brain.html?drive_connected=true' }
    };

  } catch (error) {
    console.error('Drive OAuth callback error:', error);
    return { statusCode: 302, headers: { Location: `/master-brain.html?error=${encodeURIComponent(error.message)}` } };
  }
};
