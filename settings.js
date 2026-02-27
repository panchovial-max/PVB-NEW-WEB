// PVB Estudio Creativo Settings Page - JavaScript

const API_BASE = '/.netlify/functions';

// Supabase client for settings page
const SUPABASE_URL = 'https://htkzpktnaladabovakwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a3pwa3RuYWxhZGFib3Zha3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjI2ODYsImV4cCI6MjA4NTE5ODY4Nn0.uFjYQ5vesDpscJGaDHW7bQ-PJsNeTtqeeyCl0NZoRUA';
let _supabase = null;

function getSupabase() {
    if (!_supabase && window.supabase) {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _supabase;
}

// Initialize settings page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚙️ PVB Estudio Creativo Settings Page');
    
    // Check authentication
    await checkAuthentication();
    
    // Setup tab navigation
    setupTabs();
    
    // Load current settings
    loadAllSettings();
    
    // Load ads platforms and Notion configs
    setTimeout(() => {
        loadAdsPlatformStatuses();
        loadNotionConfig();
    }, 500);
    
    // Handle hash navigation (e.g., settings.html#social)
    handleHashNavigation();
    
    // Setup password strength indicator
    setupPasswordStrengthIndicator();
    
    // Setup account settings interactions
    setupAccountSettings();
});

// Check if user is authenticated via Supabase
async function checkAuthentication() {
    const sb = getSupabase();
    if (!sb) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const { data: { session }, error } = await sb.auth.getSession();

        if (error || !session) {
            window.location.href = 'login.html';
            return;
        }

        await loadUserInfo(session.user);

    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = 'login.html';
    }
}

// Load user information from Supabase session
async function loadUserInfo(user) {
    try {
        if (!user) {
            const sb = getSupabase();
            const { data: { session } } = await sb.auth.getSession();
            user = session?.user;
        }

        if (user) {
            const greeting = document.getElementById('userGreeting');
            if (greeting) {
                const name = user.user_metadata?.full_name || user.email || 'User';
                greeting.textContent = `${name}'s Settings`;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Setup tab navigation
function setupTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Handle hash navigation for direct linking to specific tabs
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    
    if (hash) {
        // Find the tab button with matching data-tab attribute
        const targetTab = document.querySelector(`[data-tab="${hash}"]`);
        
        if (targetTab) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
            
            // Activate the target tab
            targetTab.classList.add('active');
            document.getElementById(hash).classList.add('active');
            
            // Scroll to top of page
            window.scrollTo(0, 0);
        }
    }
}

// Load all settings from localStorage
function loadAllSettings() {
    // Dashboard settings
    const refreshInterval = localStorage.getItem('refreshInterval') || '60';
    const autoRefresh = localStorage.getItem('autoRefresh') !== 'false';
    const showAdvanced = localStorage.getItem('showAdvanced') !== 'false';
    const compactView = localStorage.getItem('compactView') === 'true';
    const defaultDateRange = localStorage.getItem('defaultDateRange') || '30';
    
    // Notification settings
    const enableNotifications = localStorage.getItem('enableNotifications') !== 'false';
    const emailReports = localStorage.getItem('emailReports') !== 'false';
    const alertThresholds = localStorage.getItem('alertThresholds') !== 'false';
    const campaignUpdates = localStorage.getItem('campaignUpdates') !== 'false';
    const notificationEmail = localStorage.getItem('notificationEmail') || '';
    
    // Privacy settings
    const dataRetention = localStorage.getItem('dataRetention') !== 'false';
    const analyticsTracking = localStorage.getItem('analyticsTracking') !== 'false';
    const shareAnonymous = localStorage.getItem('shareAnonymous') === 'true';
    
    // Apply settings to form elements
    const elements = {
        refreshInterval: refreshInterval,
        autoRefresh: autoRefresh,
        showAdvanced: showAdvanced,
        compactView: compactView,
        defaultDateRange: defaultDateRange,
        enableNotifications: enableNotifications,
        emailReports: emailReports,
        alertThresholds: alertThresholds,
        campaignUpdates: campaignUpdates,
        notificationEmail: notificationEmail,
        dataRetention: dataRetention,
        analyticsTracking: analyticsTracking,
        shareAnonymous: shareAnonymous
    };
    
    // Set values
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
}

// Save all settings
function saveAllSettings() {
    showLoading();
    
    // Gather all settings
    const settings = {
        // Dashboard
        refreshInterval: document.getElementById('refreshInterval')?.value || '60',
        autoRefresh: document.getElementById('autoRefresh')?.checked || false,
        showAdvanced: document.getElementById('showAdvanced')?.checked || false,
        compactView: document.getElementById('compactView')?.checked || false,
        defaultDateRange: document.getElementById('defaultDateRange')?.value || '30',
        
        // Notifications
        enableNotifications: document.getElementById('enableNotifications')?.checked || false,
        emailReports: document.getElementById('emailReports')?.checked || false,
        alertThresholds: document.getElementById('alertThresholds')?.checked || false,
        campaignUpdates: document.getElementById('campaignUpdates')?.checked || false,
        notificationEmail: document.getElementById('notificationEmail')?.value || '',
        
        // Privacy
        dataRetention: document.getElementById('dataRetention')?.checked || false,
        analyticsTracking: document.getElementById('analyticsTracking')?.checked || false,
        shareAnonymous: document.getElementById('shareAnonymous')?.checked || false
    };
    
    // Save to localStorage
    Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
    
    console.log('✅ Settings saved successfully:', settings);
    
    setTimeout(() => {
        hideLoading();
        showNotification('Settings saved successfully!', 'success');
        
        // Redirect back to dashboard after 1 second
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 500);
}

// Apply theme
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('theme-dark');
        } else {
            body.classList.add('theme-light');
        }
    } else {
        body.classList.add('theme-light');
    }
}

// Apply font size
function applyFontSize(size) {
    const body = document.body;
    body.classList.remove('font-small', 'font-medium', 'font-large');
    body.classList.add(`font-${size}`);
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Show notification
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Connect social media platform — real OAuth flow
async function connectPlatform(platform) {
    showNotification(`Connecting to ${platform}...`, 'info');

    // Get Supabase JWT session token
    let sessionToken = null;
    try {
        const supabaseClient = window.supabase.createClient(
            'https://htkzpktnaladabovakwc.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a3pwa3RuYWxhZGFib3Zha3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjI2ODYsImV4cCI6MjA4NTE5ODY4Nn0.uFjYQ5vesDpscJGaDHW7bQ-PJsNeTtqeeyCl0NZoRUA'
        );
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) sessionToken = session.access_token;
    } catch (e) {
        console.error('Could not get Supabase session:', e);
    }

    if (!sessionToken) {
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    try {
        const response = await fetch(`/.netlify/functions/oauth-${platform}-initiate`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const data = await response.json();
        if (data.success && data.authorization_url) {
            window.location.href = data.authorization_url;
        } else {
            showNotification(data.message || `Failed to connect ${platform}`, 'error');
        }
    } catch (error) {
        console.error(`Error connecting ${platform}:`, error);
        showNotification(`Error connecting to ${platform}. Please try again.`, 'error');
    }
}

// Export all data
function exportAllData() {
    showNotification('Preparing data export...', 'info');
    window.open(`${API_BASE}/export`, '_blank');
}

// Confirm delete account
function confirmDeleteAccount() {
    const confirmed = confirm(
        '⚠️ WARNING: This will permanently delete your account and all associated data.\n\n' +
        'This action cannot be undone!\n\n' +
        'Are you sure you want to continue?'
    );
    
    if (confirmed) {
        const doubleConfirm = confirm(
            'Please confirm one more time.\n\n' +
            'Type "DELETE" in the next prompt to proceed.'
        );
        
        if (doubleConfirm) {
            const finalConfirm = prompt('Type "DELETE" to permanently delete your account:');
            
            if (finalConfirm === 'DELETE') {
                deleteAccount();
            } else {
                showNotification('Account deletion cancelled', 'info');
            }
        }
    }
}

// Delete account (placeholder)
async function deleteAccount() {
    showLoading();
    
    // In a real implementation, this would call the API
    setTimeout(() => {
        hideLoading();
        alert('Account deletion is not implemented in this demo version.');
    }, 1000);
}

// Setup password strength indicator
function setupPasswordStrengthIndicator() {
    const newPasswordInput = document.getElementById('newPassword');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value;
            updatePasswordStrength(password);
        });
    }
}

// Update password strength indicator
function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!password) {
        strengthIndicator.style.display = 'none';
        return;
    }
    
    strengthIndicator.style.display = 'block';
    
    // Calculate password strength
    let strength = 0;
    let strengthLabel = 'Weak';
    let strengthColor = '#c9a96e';
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 15; // Lowercase
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15; // Special chars
    
    // Determine strength label and color
    if (strength >= 80) {
        strengthLabel = 'Very Strong';
        strengthColor = '#00C853';
    } else if (strength >= 60) {
        strengthLabel = 'Strong';
        strengthColor = '#4CAF50';
    } else if (strength >= 40) {
        strengthLabel = 'Medium';
        strengthColor = '#FF9800';
    } else if (strength >= 20) {
        strengthLabel = 'Weak';
        strengthColor = '#FF5722';
    } else {
        strengthLabel = 'Very Weak';
        strengthColor = '#c9a96e';
    }
    
    // Update UI
    strengthFill.style.width = strength + '%';
    strengthFill.style.backgroundColor = strengthColor;
    strengthText.textContent = `Password strength: ${strengthLabel}`;
    strengthText.style.color = strengthColor;
}

// Change password function
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword) {
        showNotification('Please enter your current password', 'error');
        return;
    }
    
    if (!newPassword) {
        showNotification('Please enter a new password', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return;
    }
    
    if (newPassword === currentPassword) {
        showNotification('New password must be different from current password', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Check password strength
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        const confirm = window.confirm(
            'Your password is weak. It should contain both letters and numbers.\n\n' +
            'Do you want to continue anyway?'
        );
        if (!confirm) return;
    }
    
    showLoading();
    
    try {
        const sessionId = localStorage.getItem('session_id');
        
        const response = await fetch(`${API_BASE}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (response.ok && data.success) {
            showNotification('Password changed successfully!', 'success');
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('passwordStrength').style.display = 'none';
            
            // Optional: Log out user and redirect to login
            setTimeout(() => {
                const logoutConfirm = confirm(
                    'Password changed successfully!\n\n' +
                    'For security reasons, you will be logged out. Please log in again with your new password.'
                );
                
                if (logoutConfirm) {
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            }, 1500);
            
        } else {
            showNotification(data.message || 'Failed to change password. Please check your current password.', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Password change error:', error);
        showNotification('Error changing password. Please try again later.', 'error');
    }
}

// Setup account settings interactions
function setupAccountSettings() {
    // Load account data
    loadAccountData();
    
    // Setup password strength indicator for new password field
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value;
            updatePasswordStrength(password);
        });
    }
}

// Load account data from user info
async function loadAccountData() {
    const sessionId = localStorage.getItem('session_id');
    
    try {
        const response = await fetch(`${API_BASE}/user-info`, {
            headers: {
                'X-Session-ID': sessionId
            }
        });
        
        const data = await response.json();
        
        if (data.user) {
            const user = data.user;
            
            // Set form values
            const fullName = document.getElementById('fullName');
            const email = document.getElementById('email');
            const username = document.getElementById('username');
            const company = document.getElementById('company');
            
            if (fullName) fullName.value = user.full_name || '';
            if (email) email.value = user.email || '';
            if (username) username.value = user.username || '';
            
            // Load saved account settings from localStorage
            loadAccountFormData();
        }
    } catch (error) {
        console.error('Error loading account data:', error);
    }
}

// Load account form data from localStorage
function loadAccountFormData() {
    const fields = {
        fullName: localStorage.getItem('fullName') || '',
        email: localStorage.getItem('email') || '',
        username: localStorage.getItem('username') || '',
        company: localStorage.getItem('company') || '',
        position: localStorage.getItem('position') || '',
        timezone: localStorage.getItem('timezone') || 'UTC-5',
        emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
        marketingEmails: localStorage.getItem('marketingEmails') === 'true'
    };
    
    // Set form values
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
}

// Save account settings
function saveAccountSettings() {
    showLoading();
    
    // Gather account settings
    const accountData = {
        fullName: document.getElementById('fullName')?.value || '',
        email: document.getElementById('email')?.value || '',
        username: document.getElementById('username')?.value || '',
        company: document.getElementById('company')?.value || '',
        position: document.getElementById('position')?.value || '',
        timezone: document.getElementById('timezone')?.value || 'UTC-5',
        emailNotifications: document.getElementById('emailNotifications')?.checked || false,
        marketingEmails: document.getElementById('marketingEmails')?.checked || false
    };
    
    // Save to localStorage
    Object.entries(accountData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
    
    console.log('✅ Account settings saved:', accountData);
    
    setTimeout(() => {
        hideLoading();
        showNotification('Account settings saved successfully!', 'success');
        
        // Redirect back to dashboard after 1 second
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 500);
}

// Connect Ads Platform
async function connectAdsPlatform(platform) {
    showLoading();
    showNotification(`Connecting to ${platform}...`, 'info');
    
    const sessionId = localStorage.getItem('session_id');
    const platformData = getPlatformCredentials(platform);
    
    try {
        const response = await fetch(`${API_BASE}/ads-platforms/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                platform: platform,
                ...platformData
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (response.ok && data.success) {
            showNotification(`${platform} connected successfully!`, 'success');
            updatePlatformStatus(platform, 'connected');
            loadAdsPlatformStatuses();
        } else {
            showNotification(data.message || `Failed to connect ${platform}`, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error(`Error connecting ${platform}:`, error);
        showNotification(`Error connecting to ${platform}. Please try again.`, 'error');
    }
}

// Get platform credentials from form
function getPlatformCredentials(platform) {
    const credentials = {};
    
    switch(platform) {
        case 'meta':
            credentials.app_id = document.getElementById('metaAppId')?.value || '';
            credentials.app_secret = document.getElementById('metaAppSecret')?.value || '';
            credentials.access_token = document.getElementById('metaAccessToken')?.value || '';
            credentials.ad_account_id = document.getElementById('metaAdAccountId')?.value || '';
            credentials.sync_enabled = document.getElementById('metaSyncEnabled')?.checked || false;
            break;
        case 'google':
            credentials.client_id = document.getElementById('googleClientId')?.value || '';
            credentials.client_secret = document.getElementById('googleClientSecret')?.value || '';
            credentials.refresh_token = document.getElementById('googleRefreshToken')?.value || '';
            credentials.customer_id = document.getElementById('googleCustomerId')?.value || '';
            credentials.developer_token = document.getElementById('googleDeveloperToken')?.value || '';
            credentials.sync_enabled = document.getElementById('googleSyncEnabled')?.checked || false;
            break;
        case 'tiktok':
            credentials.app_id = document.getElementById('tiktokAppId')?.value || '';
            credentials.secret = document.getElementById('tiktokSecret')?.value || '';
            credentials.access_token = document.getElementById('tiktokAccessToken')?.value || '';
            credentials.advertiser_id = document.getElementById('tiktokAdvertiserId')?.value || '';
            credentials.sync_enabled = document.getElementById('tiktokSyncEnabled')?.checked || false;
            break;
        case 'linkedin':
            credentials.client_id = document.getElementById('linkedinClientId')?.value || '';
            credentials.client_secret = document.getElementById('linkedinClientSecret')?.value || '';
            credentials.access_token = document.getElementById('linkedinAccessToken')?.value || '';
            credentials.account_id = document.getElementById('linkedinAccountId')?.value || '';
            credentials.sync_enabled = document.getElementById('linkedinSyncEnabled')?.checked || false;
            break;
        case 'twitter':
            credentials.api_key = document.getElementById('twitterApiKey')?.value || '';
            credentials.api_secret = document.getElementById('twitterApiSecret')?.value || '';
            credentials.access_token = document.getElementById('twitterAccessToken')?.value || '';
            credentials.access_secret = document.getElementById('twitterAccessSecret')?.value || '';
            credentials.account_id = document.getElementById('twitterAccountId')?.value || '';
            credentials.sync_enabled = document.getElementById('twitterSyncEnabled')?.checked || false;
            break;
        case 'youtube':
            credentials.client_id = document.getElementById('youtubeClientId')?.value || '';
            credentials.client_secret = document.getElementById('youtubeClientSecret')?.value || '';
            credentials.refresh_token = document.getElementById('youtubeRefreshToken')?.value || '';
            credentials.channel_id = document.getElementById('youtubeChannelId')?.value || '';
            credentials.sync_enabled = document.getElementById('youtubeSyncEnabled')?.checked || false;
            break;
    }
    
    return credentials;
}

// Update platform status display
function updatePlatformStatus(platform, status) {
    const statusElement = document.getElementById(`${platform}Status`);
    if (statusElement) {
        const badge = statusElement.querySelector('.status-badge');
        if (badge) {
            badge.className = `status-badge ${status}`;
            badge.textContent = status === 'connected' ? 'Connected' : 'Not Connected';
        }
    }
}

// Load ads platform connection statuses
async function loadAdsPlatformStatuses() {
    const sessionId = localStorage.getItem('session_id');
    
    try {
        const response = await fetch(`${API_BASE}/ads-platforms/status`, {
            headers: {
                'X-Session-ID': sessionId
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const platforms = data.platforms || {};
            
            // Update status for each platform
            Object.entries(platforms).forEach(([platform, config]) => {
                if (config.connected) {
                    updatePlatformStatus(platform, 'connected');
                    // Load credentials into form (without showing secrets)
                    loadPlatformCredentials(platform, config);
                } else {
                    updatePlatformStatus(platform, 'disconnected');
                }
            });
        }
    } catch (error) {
        console.error('Error loading platform statuses:', error);
    }
}

// Load platform credentials into form (without showing secrets)
function loadPlatformCredentials(platform, config) {
    // Only show non-sensitive fields
    switch(platform) {
        case 'meta':
            if (config.app_id) document.getElementById('metaAppId').value = config.app_id;
            if (config.ad_account_id) document.getElementById('metaAdAccountId').value = config.ad_account_id;
            if (config.sync_enabled !== undefined) document.getElementById('metaSyncEnabled').checked = config.sync_enabled;
            break;
        case 'google':
            if (config.client_id) document.getElementById('googleClientId').value = config.client_id;
            if (config.customer_id) document.getElementById('googleCustomerId').value = config.customer_id;
            if (config.developer_token) document.getElementById('googleDeveloperToken').value = config.developer_token;
            if (config.sync_enabled !== undefined) document.getElementById('googleSyncEnabled').checked = config.sync_enabled;
            break;
        // Add other platforms similarly
    }
}

// Connect Notion Calendar
async function connectNotion() {
    showLoading();
    showNotification('Connecting to Notion...', 'info');
    
    const sessionId = localStorage.getItem('session_id');
    const apiKey = document.getElementById('notionApiKey')?.value || '';
    const databaseId = document.getElementById('notionDatabaseId')?.value || '';
    const syncEnabled = document.getElementById('notionSyncEnabled')?.checked || false;
    const bidirectional = document.getElementById('notionBidirectional')?.checked || false;
    
    if (!apiKey || !databaseId) {
        hideLoading();
        showNotification('Please enter both API Key and Database ID', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/notion/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                api_key: apiKey,
                database_id: databaseId,
                sync_enabled: syncEnabled,
                bidirectional: bidirectional
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (response.ok && data.success) {
            showNotification('Notion Calendar connected successfully!', 'success');
            updatePlatformStatus('notion', 'connected');
        } else {
            showNotification(data.message || 'Failed to connect Notion', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Error connecting Notion:', error);
        showNotification('Error connecting to Notion. Please check your API key and database ID.', 'error');
    }
}

// Test Notion connection
async function testNotionConnection() {
    showLoading();
    showNotification('Testing Notion connection...', 'info');
    
    const sessionId = localStorage.getItem('session_id');
    
    try {
        const response = await fetch(`${API_BASE}/notion/test`, {
            headers: {
                'X-Session-ID': sessionId
            }
        });
        
        const data = await response.json();
        hideLoading();
        
        if (response.ok && data.success) {
            showNotification('Notion connection test successful!', 'success');
        } else {
            showNotification(data.message || 'Connection test failed', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Error testing Notion:', error);
        showNotification('Error testing connection. Please check your configuration.', 'error');
    }
}

// Load Notion configuration
async function loadNotionConfig() {
    const sessionId = localStorage.getItem('session_id');
    
    try {
        const response = await fetch(`${API_BASE}/notion/config`, {
            headers: {
                'X-Session-ID': sessionId
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.config) {
                const config = data.config;
                // Don't show API key for security, just indicate if connected
                if (config.database_id) {
                    document.getElementById('notionDatabaseId').value = config.database_id;
                }
                if (config.sync_enabled !== undefined) {
                    document.getElementById('notionSyncEnabled').checked = config.sync_enabled;
                }
                if (config.bidirectional !== undefined) {
                    document.getElementById('notionBidirectional').checked = config.bidirectional;
                }
                if (config.connected) {
                    updatePlatformStatus('notion', 'connected');
                }
            }
        }
    } catch (error) {
        console.error('Error loading Notion config:', error);
    }
}


// Console message
console.log(`
╔════════════════════════════════════════════════╗
║   ⚙️ PVB Estudio Creativo Settings Page       ║
║   Built with ❤️ by PVB Estudio Creativo       ║
╚════════════════════════════════════════════════╝
`);

