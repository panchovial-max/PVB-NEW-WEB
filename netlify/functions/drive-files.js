// Drive Files API — Netlify Function
// Lists files from PVB Master Brain Google Drive folder
// URL: /.netlify/functions/drive-files?folder=Creative&page_token=xxx

import { getSupabaseAdmin } from './utils/supabase.js';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1TmLqUdGvwvicoYoR7IrLtgXEl7CmgRcU';

async function getDriveToken() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('social_accounts')
    .select('access_token, refresh_token, token_expires_at')
    .eq('platform', 'google_drive')
    .eq('is_active', true)
    .single();

  if (!data) return null;

  // Check if token expired
  if (new Date(data.token_expires_at) < new Date()) {
    // Refresh token
    if (!data.refresh_token) return null;
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    if (!res.ok) return null;
    const tokenData = await res.json();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

    await supabase.from('social_accounts').update({
      access_token: tokenData.access_token,
      token_expires_at: expiresAt.toISOString(),
    }).eq('platform', 'google_drive').eq('is_active', true);

    return tokenData.access_token;
  }

  return data.access_token;
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const token = await getDriveToken();
    if (!token) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, connected: false, message: 'Drive not connected' }) };
    }

    const params = event.queryStringParameters || {};
    const folder = params.folder || null; // department name or subfolder
    const pageToken = params.page_token || null;
    const action = params.action || 'list';

    // Get folder structure
    if (action === 'folders') {
      const res = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(`'${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name,createdTime)&orderBy=name`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, connected: true, folders: data.files || [] }) };
    }

    // List files in a folder
    let parentId = ROOT_FOLDER_ID;
    if (folder) {
      // Find folder by name
      const folderRes = await fetch(
        `${DRIVE_API}/files?q=${encodeURIComponent(`'${ROOT_FOLDER_ID}' in parents and name='${folder}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id)`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const folderData = await folderRes.json();
      if (folderData.files?.length) {
        parentId = folderData.files[0].id;
      }
    }

    let query = `'${parentId}' in parents and trashed=false`;
    // Only show image/video/pdf files, not folders
    if (action === 'list') {
      query += ` and mimeType!='application/vnd.google-apps.folder'`;
    }

    let url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,createdTime,modifiedTime,imageMediaMetadata)&orderBy=modifiedTime desc&pageSize=30`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Drive API error:', errText);
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, connected: true, error: 'Drive API error' }) };
    }

    const data = await res.json();

    // Enhance files with proper thumbnail URLs
    const files = (data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnail: f.thumbnailLink || null,
      viewLink: f.webViewLink || null,
      downloadLink: f.webContentLink || null,
      size: f.size ? parseInt(f.size) : null,
      created: f.createdTime,
      modified: f.modifiedTime,
      dimensions: f.imageMediaMetadata ? { w: f.imageMediaMetadata.width, h: f.imageMediaMetadata.height } : null,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        connected: true,
        files,
        nextPageToken: data.nextPageToken || null,
        folder: folder || 'root',
      })
    };

  } catch (error) {
    console.error('Drive files error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
