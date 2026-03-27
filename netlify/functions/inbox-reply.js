// Inbox Reply — Netlify Function
// Sends replies to Instagram DMs, Facebook messages/comments,
// Instagram comments, and YouTube comments
// POST /.netlify/functions/inbox-reply

import { createClient } from '@supabase/supabase-js';
import { validateUserSession } from './utils/supabase.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const META_API = 'https://graph.facebook.com/v20.0';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing token' }) };
    }

    const user = await validateUserSession(authHeader.substring(7));
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };

    const body = JSON.parse(event.body);
    const { platform, type, message, conversation_id, comment_id, media_id, video_id } = body;

    if (!platform || !message?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing platform or message' }) };
    }

    // Get the user's account for this platform
    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform);

    if (!accounts?.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `No ${platform} account connected` }) };
    }

    const account = accounts[0];
    const accessToken = account.access_token;
    let result;

    if (platform === 'instagram' && (type === 'dm' || type === 'message')) {
      result = await replyInstagramDM(accessToken, account.account_id, conversation_id, message);
    } else if (platform === 'instagram' && type === 'comment') {
      result = await replyInstagramComment(accessToken, comment_id || media_id, message);
    } else if (platform === 'facebook' && (type === 'dm' || type === 'message')) {
      result = await replyFacebookMessage(accessToken, conversation_id, message);
    } else if (platform === 'facebook' && type === 'comment') {
      result = await replyFacebookComment(accessToken, comment_id, message);
    } else if (platform === 'youtube' && type === 'comment') {
      result = await replyYouTubeComment(accessToken, comment_id, message);
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Reply not supported for ${platform} ${type}` }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, result })
    };

  } catch (error) {
    console.error('inbox-reply error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Reply failed', detail: error.message }) };
  }
};

// ─── Instagram DM reply ─────────────────────────────────────────────────────
async function replyInstagramDM(accessToken, igAccountId, conversationId, message) {
  // Instagram Messaging API: send message to conversation participant
  // We need the recipient IGSID from the conversation
  const convRes = await fetch(
    `${META_API}/${conversationId}?fields=participants&access_token=${accessToken}`
  );
  const convData = await convRes.json();
  const recipient = convData.participants?.data?.find(p => p.id !== igAccountId);

  if (!recipient) throw new Error('Could not find conversation recipient');

  const res = await fetch(`${META_API}/${igAccountId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipient.id },
      message: { text: message },
      access_token: accessToken
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Instagram DM reply failed: ${errText}`);
  }

  return res.json();
}

// ─── Instagram Comment reply ────────────────────────────────────────────────
async function replyInstagramComment(accessToken, commentId, message) {
  const res = await fetch(`${META_API}/${commentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      message: message,
      access_token: accessToken
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Instagram comment reply failed: ${errText}`);
  }

  return res.json();
}

// ─── Facebook Message reply ─────────────────────────────────────────────────
async function replyFacebookMessage(accessToken, conversationId, message) {
  const convRes = await fetch(
    `${META_API}/${conversationId}?fields=participants&access_token=${accessToken}`
  );
  const convData = await convRes.json();

  // Get the page ID to exclude it from recipients
  const res = await fetch(`${META_API}/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      access_token: accessToken
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Facebook message reply failed: ${errText}`);
  }

  return res.json();
}

// ─── Facebook Comment reply ─────────────────────────────────────────────────
async function replyFacebookComment(accessToken, commentId, message) {
  const res = await fetch(`${META_API}/${commentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      message: message,
      access_token: accessToken
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Facebook comment reply failed: ${errText}`);
  }

  return res.json();
}

// ─── YouTube Comment reply ──────────────────────────────────────────────────
async function replyYouTubeComment(accessToken, parentCommentId, message) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/comments?part=snippet&access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snippet: {
          parentId: parentCommentId,
          textOriginal: message
        }
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube comment reply failed: ${errText}`);
  }

  return res.json();
}
