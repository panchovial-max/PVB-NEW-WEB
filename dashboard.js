// PVB Estudio Creativo - Dashboard JavaScript
// Handles authentication, data loading, and dashboard interactions

// Supabase Configuration
const SUPABASE_URL = 'https://krmoihryyvooymvhsuno.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybW9paHJ5eXZvb3ltdmhzdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzM5NjYsImV4cCI6MjA4NDQ0OTk2Nn0.VBiCJK4Goz6iao4fqUfOs3wrgMaFO-LUGZqOxp9UKKg';

// Initialize Supabase client
let supabase = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Remove OAuth tokens from URL fragment immediately
    if (window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    // Initialize Supabase
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    if (!supabase) {
        console.error('Supabase client not initialized');
        window.location.href = 'login.html';
        return;
    }

    // Get active Supabase session — JWT used as Bearer for Netlify functions
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        console.warn('No active session, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Sync localStorage so functions that read session_id work after OAuth redirect
    localStorage.setItem('session_id', session.access_token);
    localStorage.setItem('user_id', session.user.id);
    localStorage.setItem('email', session.user.email);
    localStorage.setItem('full_name', session.user.user_metadata?.full_name || session.user.email);

    // User is logged in - initialize dashboard
    await initializeDashboard({
        session_token: session.access_token,
        user_id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || session.user.email,
        pvb_role: session.user.user_metadata?.pvb_role || null
    });
});

// Initialize dashboard with user data
async function initializeDashboard(userData) {
    try {
        // Update greeting
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting && userData.full_name) {
            userGreeting.textContent = `Welcome, ${userData.full_name.split(' ')[0]}!`;
        }

        // Show Brain button only to PVB staff/admin
        if (userData.pvb_role === 'admin' || userData.pvb_role === 'staff') {
            const brainBtn = document.getElementById('brainBtn');
            if (brainBtn) brainBtn.classList.remove('btn-brain--hidden');
        }

        // Expose userData for calendar.js and other modules
        window._pvbUserData = userData;

        // Initialize campaign calendar
        if (window.calendarAPI) window.calendarAPI.initialize();

        // Load dashboard data
        await loadDashboardData(userData);

        // Setup event listeners
        setupEventListeners(userData);

        // Check for OAuth success callback
        const urlParams = new URLSearchParams(window.location.search);
        const oauthSuccess = urlParams.get('oauth_success');
        if (oauthSuccess) {
            showNotification(`${oauthSuccess.toUpperCase()} account connected successfully!`, 'success');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Reload social accounts
            await loadSocialAccounts(userData);
        }

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

// Load dashboard data
async function loadDashboardData(userData) {
    try {
        // Show loading state
        showLoadingState(true);

        // Load social accounts
        await loadSocialAccounts(userData);

        // Load real social stats from Meta Graph API
        await loadSocialStats(userData);

        // Load inbox messages
        loadInbox();

        // Load campaigns (if any)
        await loadCampaigns(userData);

        // Load KPI metrics
        await loadKPIMetrics(userData);

        // Load charts
        await loadCharts(userData);

        // Load competitor intelligence
        loadViralPosts(userData);

        showLoadingState(false);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showLoadingState(false);
    }
}

// Load social accounts from Supabase
async function loadSocialAccounts(userData) {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return;
    }

    try {
        const { data: accounts, error } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', userData.user_id)
            .eq('is_active', true);

        if (error) {
            throw error;
        }

        console.log('Social accounts loaded:', accounts);

        // Update UI with connected accounts
        updateSocialAccountsUI(accounts || []);

        return accounts || [];
    } catch (error) {
        console.error('Error loading social accounts:', error);
        return [];
    }
}

// Update social accounts UI
function updateSocialAccountsUI(accounts) {
    if (!accounts || accounts.length === 0) {
        console.log('No connected accounts');
        return;
    }

    console.log('Connected accounts:', accounts.length);

    // Log connected platforms for debugging
    const platforms = accounts.map(acc => acc.platform);
    console.log('Connected platforms:', platforms.join(', '));

    // If there's a UI element to show connected accounts, update it here
    const accountsContainer = document.getElementById('connectedAccounts');
    if (accountsContainer) {
        accountsContainer.innerHTML = accounts.map(account => `
            <div class="connected-account" data-platform="${account.platform}">
                <img src="${getPlatformIcon(account.platform)}" alt="${account.platform}" class="platform-icon">
                <div class="account-info">
                    <strong>${account.account_name || account.platform}</strong>
                    <span class="account-username">@${account.username || 'N/A'}</span>
                    <span class="sync-status ${account.is_active ? 'active' : 'inactive'}">
                        ${account.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        `).join('');
    }
}

// Get platform icon URL
function getPlatformIcon(platform) {
    const icons = {
        'instagram': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
        'facebook': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
        'linkedin': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
        'tiktok': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
        'twitter': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg'
    };
    return icons[platform] || 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/link.svg';
}

// Load campaigns
async function loadCampaigns(userData) {
    if (!supabase) return;

    try {
        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', userData.user_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading campaigns:', error);
            return;
        }

        // Update campaign selector
        const campaignSelect = document.getElementById('campaignSelect');
        if (campaignSelect && campaigns) {
            // Clear existing options except "All Campaigns"
            campaignSelect.innerHTML = '<option value="all">All Campaigns</option>';

            campaigns.forEach(campaign => {
                const option = document.createElement('option');
                option.value = campaign.id;
                option.textContent = campaign.campaign_name;
                campaignSelect.appendChild(option);
            });
        }

        return campaigns || [];
    } catch (error) {
        console.error('Error loading campaigns:', error);
        return [];
    }
}

// Load KPI metrics
async function loadKPIMetrics(userData) {
    try {
        // Fetch real metrics from Netlify Function
        const response = await fetch('/.netlify/functions/metrics-get', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userData.session_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch metrics');
        }

        const data = await response.json();

        if (data.success && data.data) {
            // Update KPI cards with real summary data
            updateKPICards(data.data.summary);

            // Update charts with real data if available
            if (data.data.charts) {
                updateCharts(data.data.charts);
            }

            // Update connected accounts display
            if (data.data.accounts) {
                updateSocialAccountsUI(data.data.accounts);
            }

            return data.data;
        } else {
            console.warn('No metrics data available');
            // Show empty state or placeholder
            return null;
        }
    } catch (error) {
        console.log('No metrics available yet:', error.message);
        return null;
    }
}

// Update KPI cards
function updateKPICards(summary) {
    if (!summary) {
        console.warn('No summary data to display');
        return;
    }

    // Map backend summary data to KPI cards
    const kpiMapping = {
        'reach': {
            value: formatNumber(summary.total_followers || 0),
            change: formatPercentage(summary.growth_rate || 0),
            trend: (summary.growth_rate || 0) >= 0 ? 'up' : 'down'
        },
        'engagement': {
            value: `${(summary.avg_engagement || 0).toFixed(1)}%`,
            change: formatPercentage(summary.engagement_change || 0),
            trend: (summary.engagement_change || 0) >= 0 ? 'up' : 'down'
        },
        'roi': {
            value: summary.roi ? `${summary.roi.toFixed(1)}x` : 'N/A',
            change: formatPercentage(summary.roi_change || 0),
            trend: (summary.roi_change || 0) >= 0 ? 'up' : 'down'
        },
        'cac': {
            value: summary.cac ? `$${summary.cac.toFixed(0)}` : 'N/A',
            change: formatPercentage(summary.cac_change || 0),
            trend: (summary.cac_change || 0) <= 0 ? 'up' : 'down' // Lower CAC is better
        }
    };

    Object.keys(kpiMapping).forEach(kpiKey => {
        const card = document.querySelector(`[data-kpi="${kpiKey}"]`);
        if (!card) return;

        const metric = kpiMapping[kpiKey];
        const valueElement = card.querySelector('.kpi-value');
        const changeElement = card.querySelector('.kpi-change');

        if (valueElement) valueElement.textContent = metric.value;
        if (changeElement) {
            changeElement.textContent = metric.change;
            changeElement.className = `kpi-change ${metric.trend}`;
        }
    });
}

// Helper function to format large numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Helper function to format percentage
function formatPercentage(value) {
    if (value === 0) return '0%';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

// Load charts
async function loadCharts(userData) {
    // Charts are now loaded as part of loadKPIMetrics()
    // This function can be used for additional chart customization if needed
    console.log('Charts loaded with real data');
}

// Update charts with real data
function updateCharts(chartsData) {
    if (!chartsData) {
        console.warn('No charts data available');
        return;
    }

    // If you're using a charting library (Chart.js, Recharts, etc.),
    // you would update the charts here with the data from chartsData object
    // chartsData structure:
    // {
    //   dates: ['2024-01-01', '2024-01-02', ...],
    //   followers: [1000, 1050, ...],
    //   engagement: [3.2, 3.5, ...],
    //   reach: [5000, 5500, ...],
    //   impressions: [10000, 11000, ...]
    // }

    console.log('Charts data ready:', {
        dataPoints: chartsData.dates?.length || 0,
        metrics: Object.keys(chartsData).filter(k => k !== 'dates')
    });

    // Example: If using Chart.js
    // updateFollowersChart(chartsData.dates, chartsData.followers);
    // updateEngagementChart(chartsData.dates, chartsData.engagement);
}

// Setup event listeners
function setupEventListeners(userData) {
    // Refresh data button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadDashboardData(userData);
            showNotification('Data refreshed', 'success');
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    // Export data button
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportDashboardData(userData);
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await handleLogout();
        });
    }

    // Date range filter
    const dateRangeSelect = document.getElementById('dateRange');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', async () => {
            await loadDashboardData(userData);
        });
    }

    // Campaign filter
    const campaignSelect = document.getElementById('campaignSelect');
    if (campaignSelect) {
        campaignSelect.addEventListener('change', async () => {
            await loadDashboardData(userData);
        });
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Sign out from Supabase if available
        if (sb) {
            await sb.auth.signOut();
        }

        // Clear local storage
        localStorage.removeItem('session_id');
        localStorage.removeItem('user_id');
        localStorage.removeItem('email');
        localStorage.removeItem('full_name');
        localStorage.removeItem('role');
        localStorage.removeItem('supabase_session');

        // Redirect to login
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, redirect to login
        window.location.href = 'login.html';
    }
}

// Export dashboard data
function exportDashboardData(userData) {
    // TODO: Implement export functionality
    showNotification('Export feature coming soon', 'info');
}

// Show/hide loading state
function showLoadingState(isLoading) {
    // TODO: Add loading spinner/overlay
    console.log('Loading:', isLoading);
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple alert for now - could be improved with toast notifications
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#DC2626' : type === 'success' ? '#16A34A' : '#3B82F6'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Connect social account (called from settings page)
async function connectSocialAccount(platform) {
    const sessionToken = window._pvbUserData?.session_token || localStorage.getItem('session_id');
    if (!sessionToken) {
        showNotification('Please log in first', 'error');
        return;
    }

    try {
        // Call Netlify Function to initiate OAuth
        const response = await fetch(`/.netlify/functions/oauth-${platform}-initiate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.authorization_url) {
            // Redirect to OAuth provider
            window.location.href = data.authorization_url;
        } else {
            throw new Error(data.message || 'Failed to initiate OAuth');
        }
    } catch (error) {
        console.error(`Error connecting ${platform}:`, error);
        showNotification(`Failed to connect ${platform}`, 'error');
    }
}

// Sync metrics from social platforms
async function syncMetrics() {
    const sessionToken = window._pvbUserData?.session_token || localStorage.getItem('session_id');
    if (!sessionToken) {
        showNotification('Please log in first', 'error');
        return;
    }

    try {
        showNotification('Syncing metrics from social platforms...', 'info');

        const response = await fetch('/.netlify/functions/metrics-sync', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            // metrics-sync not yet deployed — reload dashboard with fresh data
            if (window._pvbUserData) {
                await loadDashboardData(window._pvbUserData);
                showNotification('Dashboard refreshed', 'success');
            }
            return;
        }

        const data = await response.json();

        if (data.success) {
            showNotification(
                `Metrics synced successfully! ${data.synced} account(s) updated.`,
                'success'
            );
            if (window._pvbUserData) await loadDashboardData(window._pvbUserData);
        } else {
            throw new Error(data.message || 'Failed to sync metrics');
        }
    } catch (error) {
        console.error('Error syncing metrics:', error);
        showNotification('Failed to sync metrics', 'error');
    }
}

// Make functions available globally
window.connectSocialAccount = connectSocialAccount;
window.syncMetrics = syncMetrics;
window.filterInbox = filterInbox;
window.refreshInbox = refreshInbox;

// Load real social stats from Meta Graph API via Netlify function
async function loadSocialStats(userData) {
    const sessionToken = userData?.session_token || localStorage.getItem('session_id');
    if (!sessionToken) return;

    const platforms = ['instagram', 'facebook', 'tiktok', 'youtube'];
    const fmt = n => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
    const el = id => document.getElementById(id);

    for (const platform of platforms) {
        try {
            const res = await fetch(`/.netlify/functions/social-stats?platform=${platform}`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });

            if (!res.ok) continue;
            const { stats } = await res.json();
            if (!stats) continue;

            if (platform === 'instagram') {
                if (el('igFollowers')) el('igFollowers').textContent = fmt(stats.followers);
                if (el('igImpressions')) el('igImpressions').textContent = fmt(stats.impressions);
                if (el('igEngagement')) el('igEngagement').textContent = stats.engagement_rate + '%';
                const igHeader = document.querySelector('.social-card.instagram h4');
                if (igHeader && stats.username) igHeader.textContent = `@${stats.username}`;
            }

            if (platform === 'facebook') {
                if (el('fbImpressions')) el('fbImpressions').textContent = fmt(stats.impressions);
                if (el('fbEngagement')) el('fbEngagement').textContent = fmt(stats.engaged_users);
                if (el('fbReach')) el('fbReach').textContent = fmt(stats.reach);
            }

            if (platform === 'tiktok') {
                if (el('ttFollowers')) el('ttFollowers').textContent = fmt(stats.followers);
                if (el('ttLikes')) el('ttLikes').textContent = fmt(stats.likes);
                if (el('ttVideos')) el('ttVideos').textContent = fmt(stats.video_count);
                const ttHeader = document.querySelector('.social-card.tiktok h4');
                if (ttHeader && stats.username) ttHeader.textContent = `@${stats.username}`;
            }

            if (platform === 'youtube') {
                if (el('ytSubscribers')) el('ytSubscribers').textContent = fmt(stats.subscribers);
                if (el('ytViews')) el('ytViews').textContent = fmt(stats.views);
                if (el('ytVideos')) el('ytVideos').textContent = fmt(stats.video_count);
                const ytHeader = document.querySelector('.social-card.youtube h4');
                if (ytHeader && stats.title) ytHeader.textContent = stats.title;
            }
        } catch (err) {
            console.log(`Could not load ${platform} stats:`, err.message);
        }
    }
}

// ─── Inbox Centralizado ────────────────────────────────────────────────────

let _inboxMessages = [];

async function loadInbox() {
    const sessionToken = window._pvbUserData?.session_token || localStorage.getItem('session_id');
    if (!sessionToken) return;

    const loading = document.getElementById('inboxLoading');
    const empty = document.getElementById('inboxEmpty');
    const list = document.getElementById('inboxList');
    if (!loading) return;

    loading.classList.remove('hidden');
    empty.classList.add('hidden');
    list.classList.add('hidden');

    try {
        const platform = document.getElementById('inboxPlatformFilter')?.value || 'all';
        const type = document.getElementById('inboxTypeFilter')?.value || 'all';

        const res = await fetch(
            `/.netlify/functions/inbox-messages?platform=${platform}&type=${type}&limit=30`,
            { headers: { 'Authorization': `Bearer ${sessionToken}` } }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        _inboxMessages = data.messages || [];

        renderInbox(_inboxMessages);
    } catch (err) {
        console.log('Could not load inbox:', err.message);
        _inboxMessages = [];
        renderInbox([]);
    } finally {
        loading.classList.add('hidden');
    }
}

function renderInbox(messages) {
    const empty = document.getElementById('inboxEmpty');
    const list = document.getElementById('inboxList');
    if (!list) return;

    if (!messages.length) {
        empty.classList.remove('hidden');
        list.classList.add('hidden');
        return;
    }

    list.innerHTML = messages.map(msg => {
        const initials = (msg.from.name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const time = formatInboxTime(msg.timestamp);
        const typeLabel = msg.type === 'dm' || msg.type === 'message' ? 'DM' : 'Comentario';
        const context = msg.media_caption || msg.post_preview || '';

        const canReply = ['instagram', 'facebook', 'youtube'].includes(msg.platform);
        const replyData = escapeHtml(JSON.stringify({
            platform: msg.platform,
            type: msg.type,
            conversation_id: msg.conversation_id || null,
            comment_id: msg.id,
            media_id: msg.media_id || null,
            video_id: msg.video_id || null
        }));

        return `<div class="inbox-message" data-msg-id="${escapeHtml(msg.id)}">
            <div class="inbox-avatar ${msg.platform}">${initials}</div>
            <div class="inbox-body">
                <div class="inbox-meta">
                    <span class="inbox-sender">${escapeHtml(msg.from.name)}</span>
                    <span class="inbox-platform-badge ${msg.platform}">${{instagram:'IG',facebook:'FB',tiktok:'TT',youtube:'YT'}[msg.platform] || msg.platform}</span>
                    <span class="inbox-type-badge">${typeLabel}</span>
                    <span class="inbox-time">${time}</span>
                </div>
                <div class="inbox-text">${escapeHtml(msg.message)}</div>
                ${context ? `<div class="inbox-context">En: ${escapeHtml(context)}</div>` : ''}
                ${canReply ? `
                <div class="inbox-reply-row">
                    <button class="inbox-reply-btn" onclick="toggleReplyBox(this)" title="Responder">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" fill="currentColor"/></svg>
                        Responder
                    </button>
                    <div class="inbox-reply-box hidden">
                        <input type="text" class="inbox-reply-input" placeholder="Escribe tu respuesta..." onkeydown="if(event.key==='Enter')sendReply(this)">
                        <button class="inbox-reply-send" data-reply='${replyData}' onclick="sendReply(this.previousElementSibling)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg>
                        </button>
                    </div>
                </div>` : ''}
            </div>
        </div>`;
    }).join('');

    empty.classList.add('hidden');
    list.classList.remove('hidden');
}

function filterInbox() {
    loadInbox();
}

function refreshInbox() {
    loadInbox();
}

function formatInboxTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin}m`;
    if (diffHr < 24) return `hace ${diffHr}h`;
    if (diffDay < 7) return `hace ${diffDay}d`;
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

function toggleReplyBox(btn) {
    const replyBox = btn.nextElementSibling;
    if (replyBox) {
        replyBox.classList.toggle('hidden');
        if (!replyBox.classList.contains('hidden')) {
            replyBox.querySelector('input')?.focus();
        }
    }
}

async function sendReply(inputEl) {
    const message = inputEl?.value?.trim();
    if (!message) return;

    const sendBtn = inputEl.nextElementSibling;
    const replyData = JSON.parse(sendBtn.dataset.reply);

    const sessionToken = window._pvbUserData?.session_token || localStorage.getItem('session_id');
    if (!sessionToken) {
        showNotification('Sesión expirada', 'error');
        return;
    }

    // Disable input while sending
    inputEl.disabled = true;
    sendBtn.disabled = true;
    inputEl.placeholder = 'Enviando...';

    try {
        const res = await fetch('/.netlify/functions/inbox-reply', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...replyData, message })
        });

        const data = await res.json();

        if (data.success) {
            showNotification('Respuesta enviada', 'success');
            inputEl.value = '';
            // Show sent confirmation inline
            const replyBox = inputEl.parentElement;
            const sentMsg = document.createElement('div');
            sentMsg.className = 'inbox-reply-sent';
            sentMsg.textContent = `✓ Enviado: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`;
            replyBox.parentElement.appendChild(sentMsg);
            replyBox.classList.add('hidden');
        } else {
            showNotification(data.error || 'Error al enviar respuesta', 'error');
        }
    } catch (err) {
        console.error('Reply error:', err);
        showNotification('Error de conexión al enviar respuesta', 'error');
    } finally {
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.placeholder = 'Escribe tu respuesta...';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// INTELIGENCIA COMPETITIVA
// ============================================
function switchCompetitorTab(tab) {
    document.querySelectorAll('.competitor-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.getElementById('tabViral').classList.toggle('hidden', tab !== 'viral');
    document.getElementById('tabReferences').classList.toggle('hidden', tab !== 'references');
}

async function loadViralPosts(userData) {
    const grid = document.getElementById('viralPostsGrid');
    const badge = document.getElementById('viralPostsBadge');
    const intro = document.getElementById('competitorIntro');
    if (!grid || !supabase) return;

    try {
        const [postsRes, trackersRes] = await Promise.all([
            supabase.from('viral_posts').select('*')
                .eq('client_id', userData.user_id)
                .order('detected_at', { ascending: false })
                .limit(20),
            supabase.from('competitor_trackers').select('*')
                .eq('client_id', userData.user_id)
                .eq('is_active', true)
        ]);

        const posts = postsRes.data || [];
        const trackers = trackersRes.data || [];

        if (trackers.length) {
            intro.classList.remove('hidden');
            document.getElementById('trackerCount').textContent = trackers.length;
            renderReferences(trackers);
            document.getElementById('tabCountRef').textContent = trackers.length;
            document.getElementById('competitorTabs')?.classList.remove('hidden');
        }

        if (!posts.length) return;

        badge.textContent = `${posts.length} viral`;
        document.getElementById('tabCountViral').textContent = posts.length;
        grid.innerHTML = posts.map(post => renderViralCard(post)).join('');

    } catch (err) {
        console.error('loadViralPosts error:', err);
    }
}

function renderReferences(trackers) {
    const grid = document.getElementById('referencesGrid');
    if (!grid) return;
    grid.innerHTML = trackers.map(t => `
        <div class="reference-card">
            <div class="reference-handle">
                <a href="https://www.instagram.com/${escapeHtml(t.instagram_handle.replace('@',''))}" target="_blank" rel="noopener noreferrer">@${escapeHtml(t.instagram_handle)}</a>
            </div>
            ${t.display_name ? `<div class="reference-display-name">${escapeHtml(t.display_name)}</div>` : ''}
            <div class="reference-status">Monitoreando</div>
            <div class="reference-threshold">Umbral viral: ${(t.viral_threshold || 100000).toLocaleString('es-CL')} views</div>
        </div>`).join('');
}

function renderViralCard(post) {
    const views = post.views ? post.views.toLocaleString('es-CL') : '—';
    const likes = post.likes ? post.likes.toLocaleString('es-CL') : '—';
    const date = post.detected_at
        ? new Date(post.detected_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
        : '';

    const thumb = post.thumbnail_url
        ? `<img class="viral-post-thumb" src="${escapeHtml(post.thumbnail_url)}" alt="Post de @${escapeHtml(post.instagram_handle)}" loading="lazy">`
        : `<div class="viral-post-thumb-placeholder">📸</div>`;

    const forecast = post.views_forecast
        ? `<p class="viral-post-why">Forecast si lo replicás: ~${post.views_forecast.toLocaleString('es-CL')} views</p>`
        : '';

    return `
        <div class="viral-post-card">
            ${thumb}
            <div class="viral-post-body">
                <div class="viral-post-handle">@${escapeHtml(post.instagram_handle)}</div>
                <div class="viral-post-metrics">
                    <span class="viral-metric"><strong>${views}</strong> views</span>
                    <span class="viral-metric"><strong>${likes}</strong> likes</span>
                </div>
                ${post.hook_analysis ? `<p class="viral-post-hook"><span>Hook:</span> ${escapeHtml(post.hook_analysis)}</p>` : ''}
                ${post.why_viral ? `<p class="viral-post-why">${escapeHtml(post.why_viral)}</p>` : ''}
                ${forecast}
                <div class="viral-post-footer">
                    <span class="viral-post-date">${date}</span>
                    <a href="${escapeHtml(post.post_url)}" target="_blank" rel="noopener noreferrer" class="viral-post-link">Ver post →</a>
                </div>
            </div>
        </div>`;
}
