// PVB Estudio Creativo - Dashboard JavaScript
// Handles authentication, data loading, and dashboard interactions

// Supabase Configuration
const SUPABASE_URL = 'https://htkzpktnaladabovakwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a3pwa3RuYWxhZGFib3Zha3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjI2ODYsImV4cCI6MjA4NTE5ODY4Nn0.uFjYQ5vesDpscJGaDHW7bQ-PJsNeTtqeeyCl0NZoRUA';

// Initialize Supabase client
let supabase = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Check if user is logged in
    const sessionToken = localStorage.getItem('session_id');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('email');
    const fullName = localStorage.getItem('full_name');

    if (!sessionToken || !userId) {
        // Not logged in - redirect to login
        console.warn('No session found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // User is logged in - initialize dashboard
    await initializeDashboard({
        session_token: sessionToken,
        user_id: userId,
        email: userEmail,
        full_name: fullName
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

        // Load campaigns (if any)
        await loadCampaigns(userData);

        // Load KPI metrics
        await loadKPIMetrics(userData);

        // Load charts
        await loadCharts(userData);

        showLoadingState(false);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showLoadingState(false);
        showNotification('Failed to load some data', 'error');
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
        console.error('Error loading metrics:', error);
        // Fall back to showing empty state
        showNotification('Unable to load metrics. Please connect your social accounts.', 'info');
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
        if (supabase) {
            await supabase.auth.signOut();
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
    const sessionToken = localStorage.getItem('session_id');
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
    const sessionToken = localStorage.getItem('session_id');
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
            body: JSON.stringify({}) // Empty body syncs all accounts
        });

        const data = await response.json();

        if (data.success) {
            showNotification(
                `Metrics synced successfully! ${data.synced} account(s) updated.`,
                'success'
            );

            // Reload dashboard to show new metrics
            const userData = {
                session_token: sessionToken,
                user_id: localStorage.getItem('user_id'),
                email: localStorage.getItem('email'),
                full_name: localStorage.getItem('full_name')
            };
            await loadDashboardData(userData);
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
