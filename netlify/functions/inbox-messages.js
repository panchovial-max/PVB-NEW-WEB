// Inbox Messages — Netlify Function
// Fetches Instagram DMs and Facebook Page messages/comments
// URL: /.netlify/functions/inbox-messages?platform=all&type=messages

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing token' }) };
    }

    const user = await validateUserSession(authHeader.substring(7));
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };

    const platform = event.queryStringParameters?.platform || 'all';
    const type = event.queryStringParameters?.type || 'messages'; // messages | comments | all
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    // Get connected social accounts
    const { data: accounts, error: dbError } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (dbError || !accounts?.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, messages: [], total: 0 }) };
    }

    const allMessages = [];

    for (const account of accounts) {
      if (platform !== 'all' && account.platform !== platform) continue;

      try {
        if (account.platform === 'instagram') {
          const msgs = await fetchInstagramMessages(account.access_token, account.account_id, type, limit);
          allMessages.push(...msgs);
        } else if (account.platform === 'facebook') {
          const msgs = await fetchFacebookMessages(account.access_token, account.account_id, type, limit);
          allMessages.push(...msgs);
        }
      } catch (err) {
        console.error(`Error fetching ${account.platform} messages:`, err.message);
        // Continue with other accounts
      }
    }

    // Sort by timestamp descending
    allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messages: allMessages.slice(0, limit),
        total: allMessages.length
      })
    };

  } catch (error) {
    console.error('inbox-messages error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', detail: error.message }) };
  }
};

async function fetchInstagramMessages(accessToken, igAccountId, type, limit) {
  const messages = [];

  // Instagram DMs via Conversations API
  if (type === 'messages' || type === 'all') {
    try {
      const convRes = await fetch(
        `${META_API}/${igAccountId}/conversations?platform=instagram&fields=participants,messages{message,from,created_time}&limit=${limit}&access_token=${accessToken}`
      );
      const convData = await convRes.json();

      if (convData.data) {
        for (const conv of convData.data) {
          const participant = conv.participants?.data?.find(p => p.id !== igAccountId);
          if (conv.messages?.data) {
            for (const msg of conv.messages.data) {
              if (!msg.message) continue;
              messages.push({
                id: msg.id,
                platform: 'instagram',
                type: 'dm',
                from: {
                  name: participant?.name || msg.from?.name || 'Instagram User',
                  id: participant?.id || msg.from?.id
                },
                message: msg.message,
                timestamp: msg.created_time,
                read: false,
                conversation_id: conv.id
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Instagram DM fetch error:', err.message);
    }
  }

  // Instagram Comments on recent media
  if (type === 'comments' || type === 'all') {
    try {
      const mediaRes = await fetch(
        `${META_API}/${igAccountId}/media?fields=id,caption,timestamp&limit=5&access_token=${accessToken}`
      );
      const mediaData = await mediaRes.json();

      if (mediaData.data) {
        for (const media of mediaData.data) {
          const commentsRes = await fetch(
            `${META_API}/${media.id}/comments?fields=text,username,timestamp,id&limit=10&access_token=${accessToken}`
          );
          const commentsData = await commentsRes.json();

          if (commentsData.data) {
            for (const comment of commentsData.data) {
              messages.push({
                id: comment.id,
                platform: 'instagram',
                type: 'comment',
                from: {
                  name: comment.username || 'Instagram User',
                  id: null
                },
                message: comment.text,
                timestamp: comment.timestamp,
                read: false,
                media_id: media.id,
                media_caption: media.caption ? media.caption.substring(0, 60) + '...' : null
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Instagram comments fetch error:', err.message);
    }
  }

  return messages;
}

async function fetchFacebookMessages(accessToken, pageId, type, limit) {
  const messages = [];

  // Facebook Page Messages
  if (type === 'messages' || type === 'all') {
    try {
      const convRes = await fetch(
        `${META_API}/${pageId}/conversations?fields=participants,messages{message,from,created_time}&limit=${limit}&access_token=${accessToken}`
      );
      const convData = await convRes.json();

      if (convData.data) {
        for (const conv of convData.data) {
          const participant = conv.participants?.data?.find(p => p.id !== pageId);
          if (conv.messages?.data) {
            for (const msg of conv.messages.data) {
              if (!msg.message) continue;
              messages.push({
                id: msg.id,
                platform: 'facebook',
                type: 'message',
                from: {
                  name: participant?.name || msg.from?.name || 'Facebook User',
                  id: participant?.id || msg.from?.id
                },
                message: msg.message,
                timestamp: msg.created_time,
                read: false,
                conversation_id: conv.id
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Facebook messages fetch error:', err.message);
    }
  }

  // Facebook Page Post Comments
  if (type === 'comments' || type === 'all') {
    try {
      const postsRes = await fetch(
        `${META_API}/${pageId}/posts?fields=id,message,created_time&limit=5&access_token=${accessToken}`
      );
      const postsData = await postsRes.json();

      if (postsData.data) {
        for (const post of postsData.data) {
          const commentsRes = await fetch(
            `${META_API}/${post.id}/comments?fields=message,from,created_time,id&limit=10&access_token=${accessToken}`
          );
          const commentsData = await commentsRes.json();

          if (commentsData.data) {
            for (const comment of commentsData.data) {
              messages.push({
                id: comment.id,
                platform: 'facebook',
                type: 'comment',
                from: {
                  name: comment.from?.name || 'Facebook User',
                  id: comment.from?.id
                },
                message: comment.message,
                timestamp: comment.created_time,
                read: false,
                post_id: post.id,
                post_preview: post.message ? post.message.substring(0, 60) + '...' : null
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Facebook comments fetch error:', err.message);
    }
  }

  return messages;
}
