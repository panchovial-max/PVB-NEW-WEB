// Metrics Get Function - Netlify Function
// Retrieves metrics from Supabase and serves to dashboard
// URL: /.netlify/functions/metrics-get

import { validateUserSession, getSupabaseAdmin } from './utils/supabase.js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get session token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing or invalid authorization token'
        })
      };
    }

    const sessionToken = authHeader.substring(7);

    // Validate user session
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid or expired session'
        })
      };
    }

    // Get query parameters
    const params = event.queryStringParameters || {};
    const platform = params.platform; // Optional filter
    const days = parseInt(params.days) || 30; // Default 30 days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const supabase = getSupabaseAdmin();

    // Get user's social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    // Filter by platform if specified
    let filteredAccounts = accounts || [];
    if (platform) {
      filteredAccounts = filteredAccounts.filter(acc => acc.platform === platform);
    }

    if (filteredAccounts.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            accounts: [],
            metrics: [],
            summary: {
              total_followers: 0,
              avg_engagement: 0,
              growth_rate: 0,
              total_reach: 0
            },
            charts: {
              dates: [],
              followers: [],
              engagement: [],
              reach: []
            }
          },
          message: 'No connected accounts found'
        })
      };
    }

    // Get metrics for all accounts
    const accountIds = filteredAccounts.map(acc => acc.id);

    const { data: metrics, error: metricsError } = await supabase
      .from('social_metrics')
      .select('*')
      .in('account_id', accountIds)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .lte('metric_date', endDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    if (metricsError) {
      throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
    }

    // Calculate summary statistics
    const summary = calculateSummary(metrics || [], filteredAccounts);

    // Format data for charts
    const charts = formatChartsData(metrics || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          accounts: filteredAccounts,
          metrics: metrics || [],
          summary,
          charts
        }
      })
    };

  } catch (error) {
    console.error('Metrics get error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve metrics',
        error: error.message
      })
    };
  }
};

// Calculate summary statistics
function calculateSummary(metrics, accounts) {
  if (metrics.length === 0) {
    return {
      total_followers: 0,
      avg_engagement: 0,
      growth_rate: 0,
      total_reach: 0,
      total_impressions: 0
    };
  }

  // Get latest metrics for each account
  const latestMetrics = {};
  const oldestMetrics = {};

  metrics.forEach(metric => {
    if (!latestMetrics[metric.account_id] ||
        new Date(metric.metric_date) > new Date(latestMetrics[metric.account_id].metric_date)) {
      latestMetrics[metric.account_id] = metric;
    }
    if (!oldestMetrics[metric.account_id] ||
        new Date(metric.metric_date) < new Date(oldestMetrics[metric.account_id].metric_date)) {
      oldestMetrics[metric.account_id] = metric;
    }
  });

  // Calculate totals and averages
  let totalFollowers = 0;
  let totalEngagementRate = 0;
  let totalReach = 0;
  let totalImpressions = 0;
  let accountCount = 0;

  Object.values(latestMetrics).forEach(metric => {
    totalFollowers += metric.followers_count || 0;
    totalEngagementRate += parseFloat(metric.engagement_rate) || 0;
    totalReach += metric.reach_count || 0;
    totalImpressions += metric.impressions_count || 0;
    accountCount++;
  });

  // Calculate growth rate
  let growthRate = 0;
  if (Object.keys(oldestMetrics).length > 0 && Object.keys(latestMetrics).length > 0) {
    let oldFollowers = 0;
    let newFollowers = 0;

    Object.keys(oldestMetrics).forEach(accountId => {
      oldFollowers += oldestMetrics[accountId]?.followers_count || 0;
      newFollowers += latestMetrics[accountId]?.followers_count || 0;
    });

    if (oldFollowers > 0) {
      growthRate = ((newFollowers - oldFollowers) / oldFollowers) * 100;
    }
  }

  return {
    total_followers: totalFollowers,
    avg_engagement: accountCount > 0 ? (totalEngagementRate / accountCount).toFixed(2) : 0,
    growth_rate: growthRate.toFixed(2),
    total_reach: totalReach,
    total_impressions: totalImpressions
  };
}

// Format data for charts
function formatChartsData(metrics) {
  // Group metrics by date
  const metricsByDate = {};

  metrics.forEach(metric => {
    const date = metric.metric_date;
    if (!metricsByDate[date]) {
      metricsByDate[date] = {
        followers: 0,
        engagement: [],
        reach: 0,
        impressions: 0
      };
    }

    metricsByDate[date].followers += metric.followers_count || 0;
    if (metric.engagement_rate) {
      metricsByDate[date].engagement.push(parseFloat(metric.engagement_rate));
    }
    metricsByDate[date].reach += metric.reach_count || 0;
    metricsByDate[date].impressions += metric.impressions_count || 0;
  });

  // Sort dates and prepare arrays for charts
  const dates = Object.keys(metricsByDate).sort();
  const followers = [];
  const engagement = [];
  const reach = [];
  const impressions = [];

  dates.forEach(date => {
    followers.push(metricsByDate[date].followers);

    // Calculate average engagement for the date
    const engagementRates = metricsByDate[date].engagement;
    const avgEngagement = engagementRates.length > 0
      ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
      : 0;
    engagement.push(avgEngagement.toFixed(2));

    reach.push(metricsByDate[date].reach);
    impressions.push(metricsByDate[date].impressions);
  });

  return {
    dates,
    followers,
    engagement,
    reach,
    impressions
  };
}
