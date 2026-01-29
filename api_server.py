#!/usr/bin/env python3
"""
PVB Estudio Creativo Campaign Analytics API Server
Provides RESTful API for campaign analytics dashboard
"""

import sqlite3
import json
import os
import uuid
import hashlib
import hmac
import base64
import urllib.parse
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
from datetime import datetime, timedelta
import jwt # Added for Apple OAuth
import logging
# Note: Notion API integration uses requests library (already imported)

# Import social media integration
try:
    from social_media_integration import SocialMediaAPI, SocialMediaDatabase
    SOCIAL_MEDIA_AVAILABLE = True
except ImportError:
    SOCIAL_MEDIA_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("social_media_integration module not found")

# Configure logging
LOG_FILE = 'login_debug.log'
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Enhanced OAuth Configuration
OAUTH_CONFIG = {
    'google': {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
        'authorization_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'userinfo_url': 'https://openidconnect.googleapis.com/v1/userinfo',
        'scope': 'openid email profile',
        'redirect_uri': 'http://localhost:8000/oauth/callback/google'
    },
    'apple': {
        'client_id': os.environ.get('APPLE_CLIENT_ID', ''),
        'client_secret': os.environ.get('APPLE_CLIENT_SECRET', ''),
        'authorization_url': 'https://appleid.apple.com/auth/authorize',
        'token_url': 'https://appleid.apple.com/auth/token',
        'userinfo_url': 'https://appleid.apple.com/auth/userinfo',
        'scope': 'name email',
        'redirect_uri': 'http://localhost:8000/oauth/callback/apple'
    },
    'facebook': {
        'client_id': os.environ.get('FACEBOOK_CLIENT_ID', ''),
        'client_secret': os.environ.get('FACEBOOK_CLIENT_SECRET', ''),
        'authorization_url': 'https://www.facebook.com/v12.0/dialog/oauth',
        'token_url': 'https://graph.facebook.com/v12.0/oauth/access_token',
        'userinfo_url': 'https://graph.facebook.com/me',
        'scope': 'email public_profile',
        'redirect_uri': 'http://localhost:8000/oauth/callback/facebook'
    },
    'twitter': {
        'client_id': os.environ.get('TWITTER_CLIENT_ID', ''),
        'client_secret': os.environ.get('TWITTER_CLIENT_SECRET', ''),
        'authorization_url': 'https://twitter.com/i/oauth2/authorize',
        'token_url': 'https://twitter.com/i/oauth2/token',
        'userinfo_url': 'https://api.twitter.com/2/users/me',
        'scope': 'users.read email',
        'redirect_uri': 'http://localhost:8000/oauth/callback/twitter'
    },
    'linkedin': {
        'client_id': os.environ.get('LINKEDIN_CLIENT_ID', ''),
        'client_secret': os.environ.get('LINKEDIN_CLIENT_SECRET', ''),
        'authorization_url': 'https://www.linkedin.com/oauth/v2/authorization',
        'token_url': 'https://www.linkedin.com/oauth/v2/accessToken',
        'userinfo_url': 'https://api.linkedin.com/v2/me',
        'scope': 'r_liteprofile r_emailaddress',
        'redirect_uri': 'http://localhost:8000/oauth/callback/linkedin'
    },
    'github': {
        'client_id': os.environ.get('GITHUB_CLIENT_ID', ''),
        'client_secret': os.environ.get('GITHUB_CLIENT_SECRET', ''),
        'authorization_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'userinfo_url': 'https://api.github.com/user',
        'scope': 'user:email',
        'redirect_uri': 'http://localhost:8000/oauth/callback/github'
    },
    'microsoft': {
        'client_id': os.environ.get('MICROSOFT_CLIENT_ID', ''),
        'client_secret': os.environ.get('MICROSOFT_CLIENT_SECRET', ''),
        'authorization_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        'token_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        'userinfo_url': 'https://graph.microsoft.com/v1.0/me',
        'scope': 'openid email profile User.Read',
        'redirect_uri': 'http://localhost:8000/oauth/callback/microsoft'
    }
}

def get_oauth_user_info(provider, access_token):
    """Retrieve user information from OAuth provider"""
    config = OAUTH_CONFIG.get(provider)
    if not config:
        raise ValueError(f"Unsupported provider: {provider}")

    try:
        if provider == 'google':
            response = requests.get(
                config['userinfo_url'], 
                headers={'Authorization': f'Bearer {access_token}'}
            )
            user_data = response.json()
            return {
                'email': user_data.get('email'),
                'full_name': user_data.get('name'),
                'provider_user_id': user_data.get('sub')
            }
        
        elif provider == 'facebook':
            response = requests.get(
                f"{config['userinfo_url']}?fields=email,name&access_token={access_token}"
            )
            user_data = response.json()
            return {
                'email': user_data.get('email'),
                'full_name': user_data.get('name'),
                'provider_user_id': user_data.get('id')
            }
        
        elif provider == 'linkedin':
            # LinkedIn requires additional API calls
            profile_response = requests.get(
                config['userinfo_url'], 
                headers={'Authorization': f'Bearer {access_token}'}
            )
            email_response = requests.get(
                'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            profile_data = profile_response.json()
            email_data = email_response.json()
            
            return {
                'email': email_data['elements'][0]['handle~']['emailAddress'],
                'full_name': f"{profile_data.get('firstName', '')} {profile_data.get('lastName', '')}".strip(),
                'provider_user_id': profile_data.get('id')
            }
        
        elif provider == 'github':
            response = requests.get(
                config['userinfo_url'], 
                headers={'Authorization': f'token {access_token}'}
            )
            user_data = response.json()
            return {
                'email': user_data.get('email'),
                'full_name': user_data.get('name'),
                'provider_user_id': str(user_data.get('id'))
            }
        
        elif provider == 'twitter':
            response = requests.get(
                config['userinfo_url'], 
                headers={'Authorization': f'Bearer {access_token}'}
            )
            user_data = response.json()
            return {
                'email': user_data.get('data', {}).get('email'),
                'full_name': user_data.get('data', {}).get('name'),
                'provider_user_id': user_data.get('data', {}).get('id')
            }
        
        elif provider == 'apple':
            # Apple's OAuth - decode JWT token
            # Note: In production, verify the token signature
            try:
                decoded_token = jwt.decode(access_token, options={"verify_signature": False})
                # Apple may not provide name in the token, try to get from userinfo endpoint
                try:
                    userinfo_response = requests.get(
                        config['userinfo_url'],
                        headers={'Authorization': f'Bearer {access_token}'}
                    )
                    if userinfo_response.status_code == 200:
                        userinfo_data = userinfo_response.json()
                        return {
                            'email': userinfo_data.get('email') or decoded_token.get('email'),
                            'full_name': userinfo_data.get('name') or decoded_token.get('name', {}).get('fullName', ''),
                            'provider_user_id': decoded_token.get('sub')
                        }
                except:
                    pass
                
                return {
                    'email': decoded_token.get('email'),
                    'full_name': decoded_token.get('name', {}).get('fullName', '') if isinstance(decoded_token.get('name'), dict) else decoded_token.get('name', ''),
                    'provider_user_id': decoded_token.get('sub')
                }
            except jwt.DecodeError:
                # Fallback: try to get user info from Apple's userinfo endpoint
                userinfo_response = requests.get(
                    config['userinfo_url'],
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                if userinfo_response.status_code == 200:
                    userinfo_data = userinfo_response.json()
                    return {
                        'email': userinfo_data.get('email'),
                        'full_name': userinfo_data.get('name', ''),
                        'provider_user_id': userinfo_data.get('sub')
                    }
                raise ValueError("Failed to decode Apple token or retrieve user info")
        
        elif provider == 'microsoft':
            response = requests.get(
                config['userinfo_url'],
                headers={'Authorization': f'Bearer {access_token}'}
            )
            user_data = response.json()
            return {
                'email': user_data.get('mail') or user_data.get('userPrincipalName'),
                'full_name': user_data.get('displayName') or f"{user_data.get('givenName', '')} {user_data.get('surname', '')}".strip(),
                'provider_user_id': user_data.get('id')
            }
        
    except Exception as e:
        print(f"Error retrieving user info from {provider}: {e}")
        raise

def handle_oauth_callback(handler_instance, provider, code, state):
    """Handle OAuth callback and user authentication"""
    try:
        # Verify state to prevent CSRF
        conn = handler_instance.get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM oauth_states WHERE state = ? AND provider = ?', (state, provider))
        state_record = cursor.fetchone()
        
        if not state_record:
            raise ValueError("Invalid state token")
        
        # Remove used state token
        cursor.execute('DELETE FROM oauth_states WHERE state = ?', (state,))
        
        # Get OAuth configuration
        config = OAUTH_CONFIG[provider]
        
        # Exchange authorization code for access token
        token_response = requests.post(
            config['token_url'],
            data={
                'client_id': config['client_id'],
                'client_secret': config['client_secret'],
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': config['redirect_uri']
            },
            headers={'Accept': 'application/json'}
        )
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            raise ValueError("Failed to obtain access token")
        
        # Get user information
        user_info = get_oauth_user_info(provider, access_token)
        
        # Create or update user in database
        user = create_or_update_user(
            conn, 
            user_info['email'], 
            user_info['full_name'], 
            provider
        )
        
        # Generate session
        session_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO sessions (session_id, user_id, created_at, expires_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP, datetime('now', '+1 day'))
        ''', (session_id, user['user_id']))
        
        conn.commit()
        conn.close()
        
        # Return session information
        return {
            'success': True,
            'session_id': session_id,
            'user': {
                'user_id': user['user_id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'role': user['role']
            }
        }
    
    except Exception as e:
        print(f"OAuth callback error for {provider}: {e}")
        raise

# Utility function to generate secure state token
def generate_state_token():
    return base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8')

# Utility function to create or update user in database
def create_or_update_user(conn, email, full_name, provider):
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT * FROM users WHERE email = ? AND provider = ?', (email, provider))
    existing_user = cursor.fetchone()
    
    if existing_user:
        # Update last login
        cursor.execute('''
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE email = ? AND provider = ?
        ''', (email, provider))
        user_id = existing_user['user_id']
    else:
        # Create new user
        cursor.execute('''
            INSERT INTO users 
            (email, full_name, provider, created_at, last_login) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', (email, full_name, provider))
        user_id = cursor.lastrowid
    
    conn.commit()
    
    # Fetch updated user info
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    return cursor.fetchone()

DATABASE = 'shotlist_analytics.db'

class CampaignAnalyticsAPI(BaseHTTPRequestHandler):
    """API Handler for Campaign Analytics"""

    def _set_headers(self, status=200, content_type='application/json'):
        """Set HTTP headers"""
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        """Handle OPTIONS request for CORS"""
        self._set_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)

        if path == '/':
            self.serve_index()
        elif path.startswith('/oauth/callback/'):
            # Handle OAuth callbacks
            provider = path.split('/')[-1]  # Extract provider from path
            code = query_params.get('code', [None])[0]
            state = query_params.get('state', [None])[0]
            if provider in OAUTH_CONFIG and code and state:
                try:
                    result = handle_oauth_callback(self, provider, code, state)
                    if result.get('success'):
                        # Store session in database and redirect to dashboard
                        session_id = result['session_id']
                        # Redirect to dashboard with session token in URL (will be handled by frontend)
                        self.send_response(302)
                        self.send_header('Location', f'http://localhost:8001/login.html?session={session_id}')
                        self.end_headers()
                    else:
                        # Redirect to login with error
                        self.send_response(302)
                        error_msg = result.get('message', 'Login failed')
                        self.send_header('Location', f'http://localhost:8001/login.html?error={urllib.parse.quote(error_msg)}')
                        self.end_headers()
                except Exception as e:
                    logger.error(f"OAuth callback error: {e}", exc_info=True)
                    self.send_response(302)
                    self.send_header('Location', f'http://localhost:8001/login.html?error={urllib.parse.quote(str(e))}')
                    self.end_headers()
            else:
                self.send_response(302)
                self.send_header('Location', 'http://localhost:8001/login.html?error=Invalid+OAuth+callback')
                self.end_headers()
        elif path == '/api/health':
            self.health_check()
        elif path == '/api/campaigns':
            self.get_campaigns()
        elif path == '/api/kpis':
            self.get_kpis()
        elif path == '/api/social-media':
            self.get_social_media()
        elif path == '/api/seo-metrics':
            self.get_seo_metrics()
        elif path == '/api/roi-trend':
            self.get_roi_trend()
        elif path == '/api/revenue-cost':
            self.get_revenue_cost()
        elif path == '/api/social-media/accounts':
            self.get_social_media_accounts(query_params)
        elif path == '/api/social-media/settings':
            self.get_social_media_settings(query_params)
        elif path == '/api/social-media/audit':
            self.get_social_media_audit(query_params)
        elif path == '/api/social-media/metrics/daily':
            self.get_daily_metrics(query_params)
        elif path == '/api/social-media/metrics/summary':
            self.get_performance_summary()
        elif path == '/api/social-media/metrics/content':
            self.get_top_content(query_params)
        elif path == '/api/social-media/metrics/audience':
            self.get_audience_insights(query_params)
        elif path == '/api/figma/import':
            self.figma_import(query_params)
        elif path == '/api/figma/import-all':
            self.figma_import_all()
        elif path == '/export-data':
            self.export_data()
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/accounts':
            self.get_social_accounts(query_params)
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/metrics':
            self.get_social_metrics(query_params)
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/dashboard':
            self.get_social_dashboard(query_params)
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/top-content':
            self.get_top_social_content(query_params)
        # Calendar endpoints
        elif path == '/api/calendar/availability':
            self.get_calendar_availability(query_params)
        elif path == '/api/calendar/appointments':
            self.get_calendar_appointments(query_params)
        elif path == '/api/calendar/sync':
            self.sync_calendar_with_external(query_params)
        # WhatsApp Business endpoints
        elif path == '/api/whatsapp/webhook':
            self.handle_whatsapp_webhook(query_params)
        elif path == '/api/whatsapp/conversations':
            self.get_whatsapp_conversations(query_params)
        elif path == '/api/whatsapp/conversation':
            self.get_whatsapp_conversation(query_params)
        elif path == '/api/whatsapp/messages':
            self.get_whatsapp_messages(query_params)
        elif path == '/api/whatsapp/stats':
            self.get_whatsapp_stats(query_params)
        else:
            self.send_error(404, 'File not found')

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)

        # Route handling for POST requests
        if path == '/api/social-login':
            self.handle_social_login()
        elif path == '/api/login':
            self.handle_login()
        elif path == '/api/signup':
            self.handle_signup()
        elif path == '/api/change-password':
            self.handle_change_password()
        elif path == '/api/social-media/account':
            self.add_social_media_account()
        elif path == '/api/social-media/settings':
            self.update_social_media_settings()
        elif path == '/api/social-media/disconnect':
            self.disconnect_social_media_account()
        elif path == '/api/social-media/metrics/daily':
            self.add_daily_metrics()
        elif path == '/api/social-media/metrics/performance':
            self.get_performance_summary()
        elif path == '/api/social-media/metrics/content':
            self.record_content_performance()
        elif path == '/api/social-media/metrics/audience':
            self.record_audience_demographics()
        elif path == '/api/social-media/metrics/roi':
            self.calculate_campaign_roi()
        elif path == '/api/figma/export':
            self.figma_export()
        elif path == '/api/figma/sync-config':
            self.figma_save_config()
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/connect':
            self.connect_social_account()
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/sync':
            self.sync_social_metrics(query_params)
        elif SOCIAL_MEDIA_AVAILABLE and path == '/api/social/disconnect':
            self.disconnect_social_account()
        # Ads Platforms endpoints
        elif path == '/api/ads-platforms/connect':
            self.connect_ads_platform()
        elif path == '/api/ads-platforms/status':
            self.get_ads_platforms_status()
        elif path == '/api/ads-platforms/disconnect':
            self.disconnect_ads_platform()
        # Notion endpoints
        elif path == '/api/notion/connect':
            self.connect_notion()
        elif path == '/api/notion/test':
            self.test_notion_connection()
        elif path == '/api/notion/config':
            self.get_notion_config()
        elif path == '/api/notion/events':
            self.get_notion_events()
        elif path == '/api/notion/sync-event':
            self.sync_event_to_notion()
        # Calendar endpoints
        elif path == '/api/calendar/availability':
            self.get_calendar_availability(query_params)
        elif path == '/api/calendar/appointments':
            self.get_calendar_appointments(query_params)
        elif path == '/api/calendar/sync':
            self.sync_calendar_with_external(query_params)
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Endpoint not found'}).encode())

    def save_social_media_config(self):
        """Save social media configuration"""
        try:
            # Get the content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the request body
            post_data = self.rfile.read(content_length)
            config = json.loads(post_data.decode('utf-8'))

            # Open database connection
            conn = self.get_db_connection()
            cursor = conn.cursor()

            # Create a table for social media configuration if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS social_media_config (
                    platform TEXT PRIMARY KEY,
                    access_token TEXT,
                    track_impressions INTEGER,
                    track_engagement INTEGER,
                    track_followers INTEGER
                )
            ''')

            # Upsert configuration for each platform
            platforms = ['instagram', 'facebook', 'linkedin', 'tiktok']
            for platform in platforms:
                cursor.execute('''
                    INSERT OR REPLACE INTO social_media_config 
                    (platform, access_token, track_impressions, track_engagement, track_followers) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    platform, 
                    config.get(platform, ''),
                    1 if config.get('tracking', {}).get('impressions', False) else 0,
                    1 if config.get('tracking', {}).get('engagement', False) else 0,
                    1 if config.get('tracking', {}).get('followers', False) else 0
                ))

            # Commit changes and close connection
            conn.commit()
            conn.close()

            # Send success response
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True, 
                'message': 'Social media configuration saved successfully'
            }).encode())

        except Exception as e:
            # Send error response
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False, 
                'error': str(e)
            }).encode())

    def get_db_connection(self):
        """Create database connection"""
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        return conn

    def get_campaigns(self, params):
        """Get list of campaigns"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            campaign_type = params.get('type', ['all'])[0]
            status = params.get('status', ['all'])[0]

            query = 'SELECT * FROM campaigns WHERE 1=1'
            query_params = []

            if campaign_type != 'all':
                query += ' AND campaign_type = ?'
                query_params.append(campaign_type)

            if status != 'all':
                query += ' AND status = ?'
                query_params.append(status)

            query += ' ORDER BY created_at DESC'

            cursor.execute(query, query_params)
            rows = cursor.fetchall()

            campaigns = []
            for row in rows:
                # Get total spent from ROI metrics
                cursor.execute('''
                    SELECT SUM(cost) as total_spent, SUM(revenue) as total_revenue
                    FROM roi_metrics WHERE campaign_id = ?
                ''', (row['campaign_id'],))
                metrics = cursor.fetchone()

                total_spent = metrics['total_spent'] or 0
                total_revenue = metrics['total_revenue'] or 0
                roi = ((total_revenue - total_spent) / total_spent * 100) if total_spent > 0 else 0

                campaigns.append({
                    'campaign_id': row['campaign_id'],
                    'campaign_name': row['campaign_name'],
                    'client_name': row['client_name'],
                    'campaign_type': row['campaign_type'],
                    'start_date': row['start_date'],
                    'end_date': row['end_date'],
                    'budget': row['budget'],
                    'spent': round(total_spent, 2),
                    'revenue': round(total_revenue, 2),
                    'roi': round(roi, 2),
                    'status': row['status']
                })

            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({'campaigns': campaigns}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def get_kpis(self, params):
        """Get overall KPI metrics"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            days = int(params.get('days', ['30'])[0])
            campaign_id = params.get('campaign_id', ['all'])[0]

            date_filter = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

            # Build campaign filter
            campaign_filter = ''
            campaign_params = [date_filter]
            if campaign_id != 'all':
                campaign_filter = ' AND campaign_id = ?'
                campaign_params.append(campaign_id)

            # Get ROI metrics
            cursor.execute(f'''
                SELECT
                    SUM(revenue) as total_revenue,
                    SUM(cost) as total_cost,
                    SUM(conversions) as total_conversions,
                    AVG(roi_percentage) as avg_roi,
                    AVG(roas) as avg_roas
                FROM roi_metrics
                WHERE date >= ?{campaign_filter}
            ''', campaign_params)

            current_metrics = cursor.fetchone()

            # Get previous period for comparison
            prev_date_start = (datetime.now() - timedelta(days=days*2)).strftime('%Y-%m-%d')
            prev_date_end = date_filter

            cursor.execute(f'''
                SELECT
                    SUM(revenue) as total_revenue,
                    SUM(cost) as total_cost,
                    SUM(conversions) as total_conversions,
                    AVG(roi_percentage) as avg_roi,
                    AVG(roas) as avg_roas
                FROM roi_metrics
                WHERE date >= ? AND date < ?{campaign_filter}
            ''', [prev_date_start, prev_date_end] + ([campaign_id] if campaign_id != 'all' else []))

            prev_metrics = cursor.fetchone()

            # Calculate changes
            def calc_change(current, previous):
                if previous and previous > 0:
                    return round(((current - previous) / previous) * 100, 2)
                return 0

            total_revenue = current_metrics['total_revenue'] or 0
            total_cost = current_metrics['total_cost'] or 0
            total_conversions = current_metrics['total_conversions'] or 0
            avg_roi = current_metrics['avg_roi'] or 0
            avg_roas = current_metrics['avg_roas'] or 0

            prev_revenue = prev_metrics['total_revenue'] or 0
            prev_conversions = prev_metrics['total_conversions'] or 0
            prev_roi = prev_metrics['avg_roi'] or 0
            prev_roas = prev_metrics['avg_roas'] or 0

            kpis = {
                'roi': {
                    'value': round(avg_roi, 2),
                    'change': calc_change(avg_roi, prev_roi)
                },
                'revenue': {
                    'value': round(total_revenue, 2),
                    'change': calc_change(total_revenue, prev_revenue)
                },
                'conversions': {
                    'value': int(total_conversions),
                    'change': calc_change(total_conversions, prev_conversions)
                },
                'roas': {
                    'value': round(avg_roas, 2),
                    'change': calc_change(avg_roas, prev_roas)
                }
            }

            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({'kpis': kpis}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def get_roi_trend(self, params):
        """Get ROI trend data for chart"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            days = int(params.get('days', ['30'])[0])
            campaign_id = params.get('campaign_id', ['all'])[0]

            date_filter = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

            campaign_filter = ''
            query_params = [date_filter]
            if campaign_id != 'all':
                campaign_filter = ' AND campaign_id = ?'
                query_params.append(campaign_id)

            cursor.execute(f'''
                SELECT
                    date,
                    AVG(roi_percentage) as roi
                FROM roi_metrics
                WHERE date >= ?{campaign_filter}
                GROUP BY date
                ORDER BY date
            ''', query_params)

            rows = cursor.fetchall()

            trend = {
                'labels': [row['date'] for row in rows],
                'data': [round(row['roi'], 2) for row in rows]
            }

            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({'trend': trend}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def get_revenue_cost(self, params):
        """Get revenue vs cost data for chart"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            days = int(params.get('days', ['30'])[0])
            campaign_id = params.get('campaign_id', ['all'])[0]

            date_filter = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

            campaign_filter = ''
            query_params = [date_filter]
            if campaign_id != 'all':
                campaign_filter = ' AND campaign_id = ?'
                query_params.append(campaign_id)

            cursor.execute(f'''
                SELECT
                    date,
                    SUM(revenue) as revenue,
                    SUM(cost) as cost
                FROM roi_metrics
                WHERE date >= ?{campaign_filter}
                GROUP BY date
                ORDER BY date
            ''', query_params)

            rows = cursor.fetchall()

            data = {
                'labels': [row['date'] for row in rows],
                'revenue': [round(row['revenue'], 2) for row in rows],
                'cost': [round(row['cost'], 2) for row in rows]
            }

            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({'data': data}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def get_social_media(self, params):
        """Get social media metrics by platform"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            # First, check tracking configuration
            cursor.execute('SELECT * FROM social_media_config')
            tracking_config = {row['platform']: {
                'track_impressions': bool(row['track_impressions']),
                'track_engagement': bool(row['track_engagement']),
                'track_followers': bool(row['track_followers'])
            } for row in cursor.fetchall()}

            # Existing social media metrics retrieval
            days = int(params.get('days', ['30'])[0])
            campaign_id = params.get('campaign_id', ['all'])[0]

            date_filter = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

            campaign_filter = ''
            query_params = [date_filter]
            if campaign_id != 'all':
                campaign_filter = ' AND campaign_id = ?'
                query_params.append(campaign_id)

            cursor.execute(f'''
                SELECT
                    platform,
                    SUM(impressions) as impressions,
                    SUM(engagement) as engagement,
                    SUM(reach) as reach,
                    SUM(followers_gained) as followers,
                    SUM(clicks) as clicks
                FROM social_media_metrics
                WHERE date >= ?{campaign_filter}
                GROUP BY platform
            ''', query_params)

            rows = cursor.fetchall()

            platforms = {}
            for row in rows:
                platform = row['platform']
                # Only include metrics for platforms with tracking enabled
                if tracking_config.get(platform, {}).get('track_impressions', True):
                    platforms[platform] = {
                        'impressions': row['impressions'] if tracking_config[platform].get('track_impressions', True) else 0,
                        'engagement': row['engagement'] if tracking_config[platform].get('track_engagement', True) else 0,
                        'reach': row['reach'] if tracking_config[platform].get('track_impressions', True) else 0,
                        'followers': row['followers'] if tracking_config[platform].get('track_followers', True) else 0,
                        'clicks': row['clicks'] if tracking_config[platform].get('track_engagement', True) else 0
                    }

            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({'platforms': platforms}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def get_seo_metrics(self, params):
        """Get SEO performance metrics"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            days = int(params.get('days', ['30'])[0])
            date_filter = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

            cursor.execute('''
                SELECT
                    SUM(organic_traffic) as traffic,
                    AVG(keyword_rankings) as keywords,
                    SUM(backlinks) as backlinks,
                    AVG(domain_authority) as domain_authority
                FROM seo_metrics
                WHERE date >= ?
            ''', (date_filter,))

            current = cursor.fetchone()

            # Get previous period
            prev_date_start = (datetime.now() - timedelta(days=days*2)).strftime('%Y-%m-%d')
            cursor.execute('''
                SELECT
                    SUM(organic_traffic) as traffic,
                    AVG(keyword_rankings) as keywords,
                    SUM(backlinks) as backlinks
                FROM seo_metrics
                WHERE date >= ? AND date < ?
            ''', (prev_date_start, date_filter))

            prev = cursor.fetchone()

            def calc_change(current, previous):
                if previous and previous > 0:
                    return round(((current - previous) / previous) * 100, 2)
                return 0

            metrics = {
                'organic_traffic': {
                    'value': int(current['traffic'] or 0),
                    'change': calc_change(current['traffic'] or 0, prev['traffic'] or 0)
                },
                'keyword_rankings': {
                    'value': int(current['keywords'] or 0),
                    'change': int((current['keywords'] or 0) - (prev['keywords'] or 0))
                },
                'backlinks': {
                    'value': int(current['backlinks'] or 0),
                    'change': int((current['backlinks'] or 0) - (prev['backlinks'] or 0))
                },
                'domain_authority': {
                    'value': int(current['domain_authority'] or 0),
                    'change': 0
                }
            }

            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({'metrics': metrics}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def export_data(self, params):
        """Export campaign data as CSV"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                SELECT
                    c.campaign_name,
                    c.client_name,
                    c.campaign_type,
                    c.budget,
                    c.status,
                    r.date,
                    r.revenue,
                    r.cost,
                    r.conversions,
                    r.roi_percentage
                FROM campaigns c
                LEFT JOIN roi_metrics r ON c.campaign_id = r.campaign_id
                ORDER BY c.campaign_name, r.date
            ''')

            rows = cursor.fetchall()

            # Generate CSV
            csv_data = 'Campaign,Client,Type,Budget,Status,Date,Revenue,Cost,Conversions,ROI\n'
            for row in rows:
                csv_data += f"{row['campaign_name']},{row['client_name']},{row['campaign_type']},"
                csv_data += f"{row['budget']},{row['status']},{row['date'] or ''},"
                csv_data += f"{row['revenue'] or 0},{row['cost'] or 0},"
                csv_data += f"{row['conversions'] or 0},{row['roi_percentage'] or 0}\n"

            conn.close()

            self._set_headers(content_type='text/csv')
            self.send_header('Content-Disposition', 'attachment; filename=campaign_data.csv')
            self.wfile.write(csv_data.encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def handle_social_login(self):
        """Initiate social login process"""
        try:
            # Get request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            provider = data.get('provider', '').lower()
            
            if provider not in OAUTH_CONFIG:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': f'Unsupported provider: {provider}'
                }).encode())
                return
            
            # Generate state token to prevent CSRF
            state = generate_state_token()
            
            # Store state in session or database for verification
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS oauth_states (
                    state TEXT PRIMARY KEY,
                    provider TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('INSERT OR REPLACE INTO oauth_states (state, provider) VALUES (?, ?)', (state, provider))
            conn.commit()
            conn.close()
            
            # Prepare OAuth authorization URL
            config = OAUTH_CONFIG[provider]
            params = {
                'client_id': config['client_id'],
                'redirect_uri': config['redirect_uri'],
                'response_type': 'code',
                'scope': config['scope'],
                'state': state
            }
            
            # Add provider-specific parameters
            if provider == 'apple':
                params['response_mode'] = 'form_post'
            
            authorization_url = f"{config['authorization_url']}?{urlencode(params)}"
            
            # Return authorization URL
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True, 
                'authorizationUrl': authorization_url
            }).encode())
        
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False, 
                'message': str(e)
            }).encode())

    def handle_login(self):
        """Handle traditional email/password login with comprehensive logging"""
        # Log the entire request for debugging
        try:
            # Get request body
            content_length = int(self.headers.get('Content-Length', 0))
            
            # Log request details
            logger.info(f"Login attempt received from IP: {self.client_address[0]}")
            logger.debug(f"Content Length: {content_length}")

            # Validate content length
            if content_length == 0:
                logger.warning("Empty login request received")
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'No data received. Please provide login credentials.',
                    'error_code': 'EMPTY_REQUEST'
                }).encode())
                return

            # Read request body
            post_data = self.rfile.read(content_length)
            logger.debug(f"Received POST data: {post_data}")
            
            # Validate JSON
            try:
                data = json.loads(post_data.decode('utf-8'))
                logger.info(f"Parsed login data for email: {data.get('email', 'N/A')}")
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON decode error: {json_error}")
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'Invalid JSON format. Please check your request.',
                    'error_code': 'INVALID_JSON',
                    'details': str(json_error)
                }).encode())
                return

            # Extract and validate credentials
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            # Validate input
            if not email:
                logger.warning("Login attempt with missing email")
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'Email is required.',
                    'error_code': 'MISSING_EMAIL'
                }).encode())
                return

            if not password:
                logger.warning(f"Login attempt with missing password for email: {email}")
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'Password is required.',
                    'error_code': 'MISSING_PASSWORD'
                }).encode())
                return

            # Connect to database
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Log detailed database query
            logger.debug(f"Searching for user with email: {email}")
            
            # Check user credentials
            cursor.execute('SELECT * FROM users WHERE email = ? AND provider = ?', (email, 'email'))
            user = cursor.fetchone()
            
            if not user:
                logger.warning(f"Login attempt for non-existent user: {email}")
                self._set_headers(401)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'User not found. Please check your email or sign up.',
                    'error_code': 'USER_NOT_FOUND'
                }).encode())
                return
            
            # Verify password (use secure password hashing in production)
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            # Log password verification
            logger.debug(f"Verifying password for user: {email}")
            
            if hashed_password != user['password']:
                # Log failed login attempt
                logger.warning(f"Failed login attempt for email: {email}")
                cursor.execute('''
                    INSERT INTO login_attempts 
                    (email, attempt_time, success, ip_address) 
                    VALUES (?, CURRENT_TIMESTAMP, 0, ?)
                ''', (email, self.client_address[0]))
                conn.commit()

                self._set_headers(401)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'Invalid password. Please try again.',
                    'error_code': 'INVALID_PASSWORD',
                    'remaining_attempts': 3
                }).encode())
                return
            
            # Check user account status
            if user['is_active'] == 0:
                logger.warning(f"Login attempt for inactive account: {email}")
                self._set_headers(403)
                self.wfile.write(json.dumps({
                    'success': False, 
                    'message': 'Account is inactive. Please contact support.',
                    'error_code': 'ACCOUNT_INACTIVE'
                }).encode())
                return

            # Generate session
            session_id = str(uuid.uuid4())
            
            # Store session
            cursor.execute('''
                INSERT INTO sessions (session_id, user_id, created_at, expires_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP, datetime('now', '+1 day'))
            ''', (session_id, user['user_id']))

            # Log successful login
            logger.info(f"Successful login for user: {email}")
            cursor.execute('''
                INSERT INTO login_attempts 
                (email, attempt_time, success, ip_address) 
                VALUES (?, CURRENT_TIMESTAMP, 1, ?)
            ''', (email, self.client_address[0]))
            
            conn.commit()
            conn.close()
            
            # Return success response
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'session_id': session_id,
                'user': {
                    'user_id': user['user_id'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'role': user['role']
                }
            }).encode())
        
        except Exception as e:
            # Catch-all error handling with detailed logging
            logger.error(f"Unexpected login error: {e}", exc_info=True)
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False, 
                'message': 'Internal server error. Please try again later.',
                'error_code': 'INTERNAL_SERVER_ERROR',
                'details': str(e)
            }).encode())

    def handle_signup(self):
        """Handle user registration/signup"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'No data received'
                }).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            full_name = data.get('full_name', '').strip()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            # Validation
            if not full_name:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Full name is required'
                }).encode())
                return
            
            if not email:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Email is required'
                }).encode())
                return
            
            if not password or len(password) < 8:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Password must be at least 8 characters'
                }).encode())
                return
            
            # Connect to database
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute('SELECT user_id FROM users WHERE email = ? AND provider = ?', (email, 'email'))
            existing_user = cursor.fetchone()
            
            if existing_user:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'User with this email already exists. Please sign in instead.'
                }).encode())
                return
            
            # Hash password
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            # Create user
            cursor.execute('''
                INSERT INTO users (email, password, full_name, provider, role, is_active, created_at)
                VALUES (?, ?, ?, 'email', 'client', 1, CURRENT_TIMESTAMP)
            ''', (email, hashed_password, full_name))
            
            user_id = cursor.lastrowid
            
            # Create session
            session_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO sessions (session_id, user_id, created_at, expires_at)
                VALUES (?, ?, CURRENT_TIMESTAMP, datetime('now', '+1 day'))
            ''', (session_id, user_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"New user registered: {email}")
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Account created successfully',
                'session_id': session_id,
                'user': {
                    'user_id': user_id,
                    'email': email,
                    'full_name': full_name,
                    'role': 'client'
                }
            }).encode())
            
        except Exception as e:
            logger.error(f"Signup error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'An error occurred during signup. Please try again.'
            }).encode())

    def health_check(self):
        """Provide a simple health check endpoint"""
        try:
            # Check database connection
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Perform a simple query to test database connectivity
            cursor.execute('SELECT COUNT(*) FROM users')
            user_count = cursor.fetchone()[0]
            
            conn.close()

            # Prepare health check response
            health_data = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'database': {
                    'connected': True,
                    'user_count': user_count
                },
                'version': '1.0.0'
            }

            self._set_headers()
            self.wfile.write(json.dumps(health_data).encode())

        except Exception as e:
            # Handle any errors during health check
            error_data = {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

            self._set_headers(500)
            self.wfile.write(json.dumps(error_data).encode())

    def handle_change_password(self):
        """Handle password change request"""
        try:
            # Get request body
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length == 0:
                logger.warning("Empty password change request received")
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'No data received'
                }).encode())
                return

            # Read and parse request body
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            current_password = data.get('current_password', '')
            new_password = data.get('new_password', '')
            
            # Validate input
            if not current_password or not new_password:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Current password and new password are required'
                }).encode())
                return
            
            # Validate new password strength
            if len(new_password) < 8:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'New password must be at least 8 characters long'
                }).encode())
                return
            
            # Get session ID from headers
            session_id = self.headers.get('X-Session-ID')
            
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Not authenticated'
                }).encode())
                return
            
            # Connect to database
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Get user from session
            cursor.execute('''
                SELECT u.* FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                logger.warning("Password change attempt with invalid session")
                self._set_headers(401)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Invalid or expired session'
                }).encode())
                return
            
            # Verify current password
            hashed_current = hashlib.sha256(current_password.encode()).hexdigest()
            
            if hashed_current != user['password']:
                conn.close()
                logger.warning(f"Failed password change attempt for user: {user['email']}")
                self._set_headers(401)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Current password is incorrect'
                }).encode())
                return
            
            # Hash new password
            hashed_new = hashlib.sha256(new_password.encode()).hexdigest()
            
            # Update password
            cursor.execute('''
                UPDATE users 
                SET password = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ''', (hashed_new, user['user_id']))
            
            # Log password change
            logger.info(f"Password changed successfully for user: {user['email']}")
            
            # Optionally: Invalidate all sessions except current one for security
            cursor.execute('''
                DELETE FROM sessions 
                WHERE user_id = ? AND session_id != ?
            ''', (user['user_id'], session_id))
            
            conn.commit()
            conn.close()
            
            # Return success response
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Password changed successfully'
            }).encode())
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in password change: {e}")
            self._set_headers(400)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Invalid JSON format'
            }).encode())
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'An error occurred while changing password'
            }).encode())

    def add_social_media_account(self):
        """Add a new social media account for a user"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'No data received'
                }).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # Validate required fields
            required_fields = ['user_id', 'platform', 'username', 'account_email', 'access_token']
            for field in required_fields:
                if field not in data:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': f'Missing required field: {field}'
                    }).encode())
                    return

            # Add account
            conn = self.get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO social_media_accounts 
                (user_id, platform, username, account_email, access_token, refresh_token, last_sync)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                data['user_id'],
                data['platform'].lower(),
                data['username'],
                data['account_email'],
                data['access_token'],
                data.get('refresh_token')
            ))

            account_id = cursor.lastrowid
            conn.commit()
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'account_id': account_id,
                'message': f'Successfully added {data["platform"]} account'
            }).encode())

        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Invalid JSON'
            }).encode())
        except sqlite3.IntegrityError:
            self._set_headers(409)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Account already exists for this user on this platform'
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())

    def update_social_media_settings(self):
        """Update social media settings for a user"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'No data received'
                }).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            user_id = data.get('user_id')
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Missing user_id'
                }).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()

            # Check if settings exist
            cursor.execute('SELECT setting_id FROM social_media_settings WHERE user_id = ?', (user_id,))
            existing = cursor.fetchone()

            if existing:
                # Update existing settings
                cursor.execute('''
                    UPDATE social_media_settings SET
                    auto_post = ?,
                    auto_schedule = ?,
                    analytics_enabled = ?,
                    notifications_enabled = ?,
                    sync_followers = ?,
                    sync_engagement = ?,
                    sync_analytics = ?,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                ''', (
                    data.get('auto_post', 0),
                    data.get('auto_schedule', 0),
                    data.get('analytics_enabled', 1),
                    data.get('notifications_enabled', 1),
                    data.get('sync_followers', 1),
                    data.get('sync_engagement', 1),
                    data.get('sync_analytics', 1),
                    user_id
                ))
            else:
                # Insert new settings
                cursor.execute('''
                    INSERT INTO social_media_settings 
                    (user_id, auto_post, auto_schedule, analytics_enabled, 
                     notifications_enabled, sync_followers, sync_engagement, sync_analytics)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    data.get('auto_post', 0),
                    data.get('auto_schedule', 0),
                    data.get('analytics_enabled', 1),
                    data.get('notifications_enabled', 1),
                    data.get('sync_followers', 1),
                    data.get('sync_engagement', 1),
                    data.get('sync_analytics', 1)
                ))

            conn.commit()
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Settings updated successfully'
            }).encode())

        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Invalid JSON'
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())

    def disconnect_social_media_account(self):
        """Disconnect a social media account"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'No data received'
                }).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            account_id = data.get('account_id')
            if not account_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Missing account_id'
                }).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                UPDATE social_media_accounts
                SET is_connected = 0, access_token = NULL, refresh_token = NULL
                WHERE account_id = ?
            ''', (account_id,))

            conn.commit()
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Account disconnected successfully'
            }).encode())

        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Invalid JSON'
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())

    def get_social_media_accounts(self, query_params):
        """Get social media accounts for a user"""
        try:
            user_id = query_params.get('user_id', [None])[0]
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Missing user_id parameter'
                }).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                SELECT account_id, platform, username, account_email, 
                       is_connected, connection_date, last_sync, sync_frequency
                FROM social_media_accounts
                WHERE user_id = ?
                ORDER BY platform
            ''', (user_id,))

            accounts = [dict(row) for row in cursor.fetchall()]
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'accounts': accounts,
                'count': len(accounts)
            }).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())

    def get_social_media_settings(self, query_params):
        """Get social media settings for a user"""
        try:
            user_id = query_params.get('user_id', [None])[0]
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Missing user_id parameter'
                }).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                SELECT setting_id, auto_post, auto_schedule, analytics_enabled,
                       notifications_enabled, sync_followers, sync_engagement, 
                       sync_analytics, created_at, updated_at
                FROM social_media_settings
                WHERE user_id = ?
            ''', (user_id,))

            settings = dict(cursor.fetchone() or {})
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'settings': settings
            }).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())

    def get_social_media_audit(self, query_params):
        """Get audit log for a social media account"""
        try:
            account_id = query_params.get('account_id', [None])[0]
            limit = int(query_params.get('limit', ['50'])[0])

            if not account_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Missing account_id parameter'
                }).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                SELECT audit_id, action, timestamp, status, details
                FROM social_media_audit
                WHERE account_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (account_id, limit))

            logs = [dict(row) for row in cursor.fetchall()]
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'logs': logs,
                'count': len(logs)
            }).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())

    def add_daily_metrics(self):
        """Record daily social media metrics"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            account_id = data.get('account_id')
            platform = data.get('platform')
            
            if not account_id or not platform:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'Missing required fields'}).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            today = datetime.now().strftime('%Y-%m-%d')
            
            cursor.execute('''
                INSERT OR REPLACE INTO social_media_daily_metrics
                (account_id, platform, date, followers, engagement_rate, reach, 
                 impressions, shares, comments, likes, clicks, saves, video_views, 
                 profile_visits, mentions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                account_id, platform, today,
                data.get('followers', 0),
                data.get('engagement_rate', 0),
                data.get('reach', 0),
                data.get('impressions', 0),
                data.get('shares', 0),
                data.get('comments', 0),
                data.get('likes', 0),
                data.get('clicks', 0),
                data.get('saves', 0),
                data.get('video_views', 0),
                data.get('profile_visits', 0),
                data.get('mentions', 0)
            ))
            
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Daily metrics recorded', 'date': today}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def get_daily_metrics(self, query_params):
        """Retrieve daily metrics"""
        try:
            account_id = query_params.get('account_id', [None])[0]
            platform = query_params.get('platform', [None])[0]
            days = int(query_params.get('days', ['30'])[0])
            
            if not account_id or not platform:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'Missing parameters'}).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            cursor.execute('''
                SELECT * FROM social_media_daily_metrics
                WHERE account_id = ? AND platform = ? AND date >= ?
                ORDER BY date DESC
            ''', (account_id, platform, start_date))
            
            metrics = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'metrics': metrics,
                'count': len(metrics),
                'platform': platform
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def get_performance_summary(self):
        """Get metrics performance summary"""
        try:
            query_params = parse_qs(urlparse(self.path).query)
            account_id = query_params.get('account_id', [None])[0]
            platform = query_params.get('platform', [None])[0]
            
            if not account_id or not platform:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'Missing parameters'}).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM social_media_daily_metrics
                WHERE account_id = ? AND platform = ?
                ORDER BY date DESC LIMIT 1
            ''', (account_id, platform))
            
            latest = cursor.fetchone()
            
            if not latest:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            # Get 30-day trends
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            cursor.execute('''
                SELECT * FROM social_media_daily_metrics
                WHERE account_id = ? AND platform = ? AND date >= ?
                ORDER BY date
            ''', (account_id, platform, start_date))
            
            all_metrics = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            if all_metrics:
                first = all_metrics[0]
                growth = latest['followers'] - first['followers']
                growth_rate = (growth / first['followers'] * 100) if first['followers'] > 0 else 0
                avg_engagement = sum(m['engagement_rate'] for m in all_metrics) / len(all_metrics)
            else:
                growth = 0
                growth_rate = 0
                avg_engagement = 0
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'summary': {
                    'platform': platform,
                    'current_followers': latest['followers'],
                    'growth_30d': growth,
                    'growth_rate': round(growth_rate, 2),
                    'avg_engagement': round(avg_engagement, 2),
                    'reach_30d': sum(m['reach'] for m in all_metrics),
                    'impressions_30d': sum(m['impressions'] for m in all_metrics),
                    'latest_update': latest['date']
                }
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def record_content_performance(self):
        """Record individual post/content performance"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO content_performance
                (account_id, platform, post_id, post_type, caption, hashtags,
                 posted_at, likes, comments, shares, saves, views, reach, engagement_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('account_id'),
                data.get('platform'),
                data.get('post_id'),
                data.get('post_type', 'post'),
                data.get('caption', ''),
                data.get('hashtags', ''),
                data.get('posted_at'),
                data.get('likes', 0),
                data.get('comments', 0),
                data.get('shares', 0),
                data.get('saves', 0),
                data.get('views', 0),
                data.get('reach', 0),
                data.get('engagement_rate', 0)
            ))
            
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Content performance recorded'}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def get_top_content(self, query_params):
        """Get top performing content"""
        try:
            account_id = query_params.get('account_id', [None])[0]
            platform = query_params.get('platform', [None])[0]
            limit = int(query_params.get('limit', ['10'])[0])
            
            if not account_id or not platform:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'Missing parameters'}).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM content_performance
                WHERE account_id = ? AND platform = ?
                ORDER BY engagement_rate DESC LIMIT ?
            ''', (account_id, platform, limit))
            
            content = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'top_content': content,
                'count': len(content)
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def record_audience_demographics(self):
        """Record audience demographic data"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            today = datetime.now().strftime('%Y-%m-%d')
            
            cursor.execute('''
                INSERT OR REPLACE INTO audience_demographics
                (account_id, platform, date, age_13_17, age_18_24, age_25_34, age_35_44,
                 age_45_54, age_55_64, age_65_plus, male_percentage, female_percentage,
                 top_countries, top_cities)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('account_id'),
                data.get('platform'),
                today,
                data.get('age_13_17', 0),
                data.get('age_18_24', 0),
                data.get('age_25_34', 0),
                data.get('age_35_44', 0),
                data.get('age_45_54', 0),
                data.get('age_55_64', 0),
                data.get('age_65_plus', 0),
                data.get('male_percentage', 0),
                data.get('female_percentage', 0),
                data.get('top_countries', ''),
                data.get('top_cities', '')
            ))
            
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({'success': True, 'message': 'Demographics recorded'}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def get_audience_insights(self, query_params):
        """Get audience demographic insights"""
        try:
            account_id = query_params.get('account_id', [None])[0]
            platform = query_params.get('platform', [None])[0]
            
            if not account_id or not platform:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'Missing parameters'}).encode())
                return

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT * FROM audience_demographics
                WHERE account_id = ? AND platform = ?
                ORDER BY date DESC LIMIT 1
            ''', (account_id, platform))
            
            demographics = cursor.fetchone()
            conn.close()
            
            if not demographics:
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'demographics': dict(demographics)
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def calculate_campaign_roi(self):
        """Calculate campaign ROI"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            cost = data.get('cost', 0)
            revenue = data.get('revenue', 0)
            conversions = data.get('conversions', 0)
            impressions = data.get('impressions', 1)
            reach = data.get('reach', 1)
            
            roi = ((revenue - cost) / cost * 100) if cost > 0 else 0
            roas = (revenue / cost) if cost > 0 else 0
            cpc = (cost / conversions) if conversions > 0 else 0
            cpr = (cost / reach) if reach > 0 else 0
            conversion_rate = (conversions / impressions * 100) if impressions > 0 else 0
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO campaign_social_metrics
                (account_id, platform, campaign_id, start_date, end_date,
                 total_reach, total_impressions, conversion_rate, revenue_generated, roi)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('account_id'),
                data.get('platform'),
                data.get('campaign_id'),
                data.get('start_date'),
                data.get('end_date'),
                reach,
                impressions,
                conversion_rate,
                revenue,
                roi
            ))
            
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'roi': round(roi, 2),
                'roas': round(roas, 2),
                'conversion_rate': round(conversion_rate, 2),
                'cost_per_conversion': round(cpc, 2),
                'cost_per_reach': round(cpr, 4)
            }).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())

    def figma_export(self):
        """Handle Figma export - receive design data and generate HTML/CSS files"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            target_file = data.get('targetFile', 'export.html')
            html_content = data.get('html', '')
            css_content = data.get('css', '')
            nodes = data.get('nodes', [])

            if not html_content:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No HTML content'}).encode())
                return

            # Get the project root directory
            project_root = os.path.dirname(os.path.abspath(__file__))
            
            # Write HTML file
            html_path = os.path.join(project_root, target_file)
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

            # Write CSS to dashboard.css or create a separate file
            if css_content:
                css_file = target_file.replace('.html', '.css')
                if css_file == target_file:  # If no .html extension
                    css_file = 'figma-export.css'
                    
                css_path = os.path.join(project_root, css_file)
                with open(css_path, 'a', encoding='utf-8') as f:  # Append mode
                    f.write('\n\n/* Figma Export - ' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + ' */\n')
                    f.write(css_content)

            # Store metadata in database
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO figma_sync_config (file_path, last_sync, sync_direction, node_count)
                VALUES (?, ?, 'export', ?)
            ''', (target_file, datetime.now().isoformat(), len(nodes)))
            
            conn.commit()
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'Successfully exported to {target_file}',
                'files': {
                    'html': html_path,
                    'css': css_path if css_content else None
                }
            }).encode())

        except Exception as e:
            logger.error(f"Figma export error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())

    def figma_import(self, query_params):
        """Handle Figma import - send HTML/CSS data to Figma"""
        try:
            page = query_params.get('page', ['dashboard'])[0]
            
            # Get the project root directory
            project_root = os.path.dirname(os.path.abspath(__file__))
            
            # Map page names to files
            page_files = {
                'dashboard': 'dashboard.html',
                'settings': 'settings.html',
                'login': 'login.html',
                'index': 'index.html'
            }
            
            html_file = page_files.get(page, 'dashboard.html')
            html_path = os.path.join(project_root, html_file)
            
            if not os.path.exists(html_path):
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': f'File not found: {html_file}'}).encode())
                return

            # Read HTML file
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()

            # Parse HTML into structured format (simplified)
            # In a real implementation, you'd use an HTML parser like BeautifulSoup
            # For now, we'll send the raw HTML and let Figma plugin parse it
            
            # Read associated CSS
            css_file = html_file.replace('.html', '.css')
            css_path = os.path.join(project_root, css_file)
            css_content = ''
            
            if os.path.exists(css_path):
                with open(css_path, 'r', encoding='utf-8') as f:
                    css_content = f.read()

            # Design tokens from dashboard.css
            design_tokens = {
                'colors': {
                    '--black': '#000000',
                    '--white': '#FFFFFF',
                    '--red': '#FF0000',
                    '--gray-100': '#F5F5F5',
                    '--gray-200': '#E5E5E5',
                    '--gray-300': '#D4D4D4',
                    '--gray-400': '#A3A3A3',
                    '--gray-500': '#737373',
                    '--gray-600': '#525252',
                    '--gray-700': '#404040',
                    '--gray-800': '#262626',
                    '--gray-900': '#171717',
                },
                'typography': {
                    'fontFamily': 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    'fontSize': {
                        'base': '12px',
                        'large': '14px',
                        'xlarge': '16px',
                    }
                },
                'spacing': {
                    'sm': '8px',
                    'md': '16px',
                    'lg': '24px',
                    'xl': '32px',
                }
            }

            self._set_headers()
            self.wfile.write(json.dumps({
                'html': html_content,
                'css': css_content,
                'designTokens': design_tokens,
                'page': page
            }).encode())

        except Exception as e:
            logger.error(f"Figma import error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())

    def figma_import_all(self):
        """Handle Figma import all - send all pages HTML/CSS data"""
        try:
            project_root = os.path.dirname(os.path.abspath(__file__))
            
            # All pages to import
            pages = {
                'index': 'index.html',
                'dashboard': 'dashboard.html',
                'settings': 'settings.html',
                'login': 'login.html'
            }
            
            all_pages_data = {}
            
            for page_name, html_file in pages.items():
                html_path = os.path.join(project_root, html_file)
                
                if os.path.exists(html_path):
                    # Read HTML
                    with open(html_path, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    
                    # Read CSS
                    css_file = html_file.replace('.html', '.css')
                    css_path = os.path.join(project_root, css_file)
                    css_content = ''
                    
                    if os.path.exists(css_path):
                        with open(css_path, 'r', encoding='utf-8') as f:
                            css_content = f.read()
                    
                    all_pages_data[page_name] = {
                        'html': html_content,
                        'css': css_content,
                        'file': html_file
                    }
            
            # Design tokens (shared across all pages)
            design_tokens = {
                'colors': {
                    '--color-dark': '#1A1A1A',
                    '--color-mid': '#6B6B6B',
                    '--color-light': '#F5F5F5',
                    '--black': '#1A1A1A',
                    '--white': '#FFFFFF',
                    '--primary': '#1A1A1A',
                },
                'typography': {
                    'fontFamily': 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    'fontSize': {
                        'base': '16px',
                        'large': '18px',
                        'xlarge': '24px',
                    }
                },
                'spacing': {
                    'sm': '8px',
                    'md': '16px',
                    'lg': '24px',
                    'xl': '32px',
                }
            }
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'pages': all_pages_data,
                'designTokens': design_tokens,
                'totalPages': len(all_pages_data),
                'timestamp': datetime.now().isoformat()
            }).encode())
            
        except Exception as e:
            logger.error(f"Figma import all error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())

    def figma_save_config(self):
        """Save Figma sync configuration"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return

            post_data = self.rfile.read(content_length)
            config = json.loads(post_data.decode('utf-8'))

            localhost_url = config.get('localhostUrl', 'http://localhost:8001')
            auto_sync = config.get('autoSync', False)
            watch_mode = config.get('watchMode', False)

            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Store config (using a simple key-value approach)
            cursor.execute('''
                INSERT OR REPLACE INTO figma_sync_config 
                (file_path, last_sync, sync_direction, settings)
                VALUES ('_config', ?, 'config', ?)
            ''', (
                datetime.now().isoformat(),
                json.dumps({
                    'localhostUrl': localhost_url,
                    'autoSync': auto_sync,
                    'watchMode': watch_mode
                })
            ))
            
            conn.commit()
            conn.close()

            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Configuration saved'
            }).encode())

        except Exception as e:
            logger.error(f"Figma config save error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())

    # ==================== SOCIAL MEDIA ENDPOINTS ====================
    
    def connect_social_account(self):
        """Connect a social media account to user"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            user_id = data.get('user_id')
            platform = data.get('platform')
            access_token = data.get('access_token')
            
            if not all([user_id, platform, access_token]):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Missing required fields: user_id, platform, access_token'}).encode())
                return
            
            # Verify token and get user info
            api = SocialMediaAPI(platform, access_token)
            user_info = api.get_user_info()
            
            if not user_info:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid token or user not found'}).encode())
                return
            
            # Save account connection
            social_db = SocialMediaDatabase()
            account_id = social_db.connect_account(
                user_id,
                platform,
                {**user_info, 'access_token': access_token}
            )
            
            # Fetch initial metrics
            metrics = api.get_metrics()
            social_db.save_metrics(account_id, platform, metrics)
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'account_id': account_id,
                'platform': platform,
                'username': user_info.get('username') or user_info.get('name'),
                'metrics': metrics
            }).encode())
        
        except Exception as e:
            logger.error(f"Connect account error: {e}")
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': f'Authentication failed: {str(e)}'}).encode())
    
    def get_social_accounts(self, query_params):
        """Get all social media accounts for a user"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            user_id = query_params.get('user_id', [None])[0]
            
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'user_id required'}).encode())
                return
            
            social_db = SocialMediaDatabase()
            accounts = social_db.get_user_accounts(int(user_id))
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'accounts': accounts,
                'total': len(accounts)
            }).encode())
        
        except Exception as e:
            logger.error(f"Get accounts error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def get_social_metrics(self, query_params):
        """Get metrics for a specific platform or all platforms"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            user_id = query_params.get('user_id', [None])[0]
            platform = query_params.get('platform', [None])[0]
            
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'user_id required'}).encode())
                return
            
            social_db = SocialMediaDatabase()
            metrics = social_db.get_latest_metrics(int(user_id), platform)
            
            self._set_headers()
            if platform:
                result = metrics[0] if metrics else {}
            else:
                result = {m.get('platform'): m for m in metrics}
            
            self.wfile.write(json.dumps(result).encode())
        
        except Exception as e:
            logger.error(f"Get metrics error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def get_social_dashboard(self, query_params):
        """Get dashboard summary for all social media accounts"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            user_id = query_params.get('user_id', [None])[0]
            
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'user_id required'}).encode())
                return
            
            social_db = SocialMediaDatabase()
            summary = social_db.get_dashboard_summary(int(user_id))
            
            self._set_headers()
            self.wfile.write(json.dumps(summary).encode())
        
        except Exception as e:
            logger.error(f"Dashboard error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def get_top_social_content(self, query_params):
        """Get top performing content across all platforms"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            user_id = query_params.get('user_id', [None])[0]
            limit = int(query_params.get('limit', [5])[0])
            
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'user_id required'}).encode())
                return
            
            social_db = SocialMediaDatabase()
            conn = social_db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, platform, content_id, caption, likes, comments, shares, engagement_rate
                FROM social_media_content
                WHERE account_id IN (
                    SELECT id FROM social_media_accounts WHERE user_id = ?
                )
                ORDER BY engagement_rate DESC, likes DESC
                LIMIT ?
            ''', (int(user_id), limit))
            
            results = cursor.fetchall()
            conn.close()
            
            content = []
            for row in results:
                content.append({
                    'id': row[0],
                    'platform': row[1],
                    'content_id': row[2],
                    'caption': row[3],
                    'likes': row[4],
                    'comments': row[5],
                    'shares': row[6],
                    'engagement_rate': row[7]
                })
            
            self._set_headers()
            self.wfile.write(json.dumps({'content': content}).encode())
        
        except Exception as e:
            logger.error(f"Top content error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def sync_social_metrics(self, query_params):
        """Manually sync metrics for all user accounts"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            user_id = query_params.get('user_id', [None])[0]
            
            if not user_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'user_id required'}).encode())
                return
            
            social_db = SocialMediaDatabase()
            conn = social_db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, platform, access_token
                FROM social_media_accounts
                WHERE user_id = ?
            ''', (int(user_id),))
            
            accounts = cursor.fetchall()
            synced = 0
            failed = 0
            errors = []
            
            for account_id, platform, token in accounts:
                try:
                    api = SocialMediaAPI(platform, token)
                    metrics = api.get_metrics()
                    social_db.save_metrics(account_id, platform, metrics)
                    synced += 1
                except Exception as e:
                    failed += 1
                    errors.append(f"{platform}: {str(e)}")
                    logger.error(f"Sync failed for {platform}: {e}")
            
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'synced': synced,
                'failed': failed,
                'errors': errors,
                'timestamp': datetime.now().isoformat()
            }).encode())
        
        except Exception as e:
            logger.error(f"Sync error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def disconnect_social_account(self):
        """Disconnect a social media account"""
        if not SOCIAL_MEDIA_AVAILABLE:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Social media module not available'}).encode())
            return
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            user_id = data.get('user_id')
            platform = data.get('platform')
            
            if not all([user_id, platform]):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode())
                return
            
            social_db = SocialMediaDatabase()
            conn = social_db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                DELETE FROM social_media_accounts
                WHERE user_id = ? AND platform = ?
            ''', (int(user_id), platform))
            
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'{platform} account disconnected'
            }).encode())
        
        except Exception as e:
            logger.error(f"Disconnect error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    # ==================== ADS PLATFORMS ENDPOINTS ====================
    
    def connect_ads_platform(self):
        """Connect an advertising platform (Meta, Google, TikTok, LinkedIn, X, YouTube)"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            platform = data.get('platform', '').lower()
            session_id = self.headers.get('X-Session-ID')
            
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            # Get user from session
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            # Create ads_platforms_config table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ads_platforms_config (
                    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    platform TEXT NOT NULL,
                    credentials TEXT NOT NULL,
                    sync_enabled INTEGER DEFAULT 0,
                    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_sync TIMESTAMP,
                    UNIQUE(user_id, platform),
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            ''')
            
            # Store credentials (encrypted in production)
            credentials = {k: v for k, v in data.items() if k != 'platform'}
            credentials_json = json.dumps(credentials)
            
            cursor.execute('''
                INSERT OR REPLACE INTO ads_platforms_config 
                (user_id, platform, credentials, sync_enabled, last_sync)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (user_id, platform, credentials_json, int(data.get('sync_enabled', False))))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Ads platform {platform} connected for user {user_id}")
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'{platform} connected successfully',
                'platform': platform
            }).encode())
            
        except Exception as e:
            logger.error(f"Connect ads platform error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def get_ads_platforms_status(self):
        """Get connection status for all ads platforms"""
        try:
            session_id = self.headers.get('X-Session-ID')
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            cursor.execute('''
                SELECT platform, credentials, sync_enabled, connected_at, last_sync
                FROM ads_platforms_config
                WHERE user_id = ?
            ''', (user_id,))
            
            platforms = {}
            for row in cursor.fetchall():
                creds = json.loads(row['credentials'])
                platforms[row['platform']] = {
                    'connected': True,
                    'sync_enabled': bool(row['sync_enabled']),
                    'connected_at': row['connected_at'],
                    'last_sync': row['last_sync'],
                    # Don't expose full credentials, just IDs
                    'app_id': creds.get('app_id') or creds.get('client_id', ''),
                    'account_id': creds.get('ad_account_id') or creds.get('account_id') or creds.get('customer_id') or creds.get('advertiser_id', '')
                }
            
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'platforms': platforms
            }).encode())
            
        except Exception as e:
            logger.error(f"Get ads platforms status error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def disconnect_ads_platform(self):
        """Disconnect an advertising platform"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            platform = data.get('platform', '').lower()
            session_id = self.headers.get('X-Session-ID')
            
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            cursor.execute('''
                DELETE FROM ads_platforms_config
                WHERE user_id = ? AND platform = ?
            ''', (user_id, platform))
            
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'{platform} disconnected successfully'
            }).encode())
            
        except Exception as e:
            logger.error(f"Disconnect ads platform error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    # ==================== NOTION CALENDAR ENDPOINTS ====================
    
    def connect_notion(self):
        """Connect Notion Calendar"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            api_key = data.get('api_key', '')
            database_id = data.get('database_id', '')
            sync_enabled = data.get('sync_enabled', False)
            bidirectional = data.get('bidirectional', False)
            session_id = self.headers.get('X-Session-ID')
            
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            if not api_key or not database_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'API key and Database ID are required'}).encode())
                return
            
            # Get user from session
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            # Create notion_config table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS notion_config (
                    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    api_key TEXT NOT NULL,
                    database_id TEXT NOT NULL,
                    sync_enabled INTEGER DEFAULT 0,
                    bidirectional INTEGER DEFAULT 0,
                    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_sync TIMESTAMP,
                    UNIQUE(user_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            ''')
            
            # Test connection with Notion API
            try:
                test_response = requests.get(
                    f'https://api.notion.com/v1/databases/{database_id}',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Notion-Version': '2022-06-28'
                    },
                    timeout=10
                )
                
                if test_response.status_code != 200:
                    conn.close()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': 'Failed to connect to Notion. Please check your API key and Database ID.'
                    }).encode())
                    return
            except Exception as e:
                logger.warning(f"Notion connection test warning: {e}")
                # Continue anyway - user might want to save config first
            
            # Save configuration
            cursor.execute('''
                INSERT OR REPLACE INTO notion_config 
                (user_id, api_key, database_id, sync_enabled, bidirectional, last_sync)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (user_id, api_key, database_id, int(sync_enabled), int(bidirectional)))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Notion connected for user {user_id}")
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Notion Calendar connected successfully'
            }).encode())
            
        except Exception as e:
            logger.error(f"Connect Notion error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def test_notion_connection(self):
        """Test Notion API connection"""
        try:
            session_id = self.headers.get('X-Session-ID')
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            cursor.execute('SELECT api_key, database_id FROM notion_config WHERE user_id = ?', (user_id,))
            config = cursor.fetchone()
            conn.close()
            
            if not config:
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': 'Notion not configured'}).encode())
                return
            
            # Test connection
            try:
                response = requests.get(
                    f'https://api.notion.com/v1/databases/{config["database_id"]}',
                    headers={
                        'Authorization': f'Bearer {config["api_key"]}',
                        'Notion-Version': '2022-06-28'
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'message': 'Notion connection successful',
                        'database_name': response.json().get('title', [{}])[0].get('plain_text', 'Unknown')
                    }).encode())
                else:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': f'Notion API error: {response.status_code}'
                    }).encode())
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': f'Connection test failed: {str(e)}'
                }).encode())
                
        except Exception as e:
            logger.error(f"Test Notion error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def get_notion_config(self):
        """Get Notion configuration"""
        try:
            session_id = self.headers.get('X-Session-ID')
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            cursor.execute('''
                SELECT database_id, sync_enabled, bidirectional, connected_at, last_sync
                FROM notion_config WHERE user_id = ?
            ''', (user_id,))
            config = cursor.fetchone()
            conn.close()
            
            if config:
                self._set_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'config': {
                        'database_id': config['database_id'],
                        'sync_enabled': bool(config['sync_enabled']),
                        'bidirectional': bool(config['bidirectional']),
                        'connected': True,
                        'connected_at': config['connected_at'],
                        'last_sync': config['last_sync']
                    }
                }).encode())
            else:
                self._set_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'config': {
                        'connected': False
                    }
                }).encode())
                
        except Exception as e:
            logger.error(f"Get Notion config error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def get_notion_events(self):
        """Get events from Notion calendar database"""
        try:
            session_id = self.headers.get('X-Session-ID')
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            cursor.execute('SELECT api_key, database_id FROM notion_config WHERE user_id = ?', (user_id,))
            config = cursor.fetchone()
            conn.close()
            
            if not config:
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': 'Notion not configured'}).encode())
                return
            
            # Query Notion API for events
            try:
                response = requests.post(
                    f'https://api.notion.com/v1/databases/{config["database_id"]}/query',
                    headers={
                        'Authorization': f'Bearer {config["api_key"]}',
                        'Notion-Version': '2022-06-28',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'filter': {
                            'property': 'Date',  # Assuming date property exists
                            'date': {'is_not_empty': True}
                        },
                        'sorts': [{'property': 'Date', 'direction': 'ascending'}]
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    results = response.json().get('results', [])
                    events = []
                    
                    for page in results:
                        props = page.get('properties', {})
                        # Extract event data (adjust based on your Notion schema)
                        event = {
                            'id': page['id'],
                            'title': props.get('Name', {}).get('title', [{}])[0].get('plain_text', 'Untitled'),
                            'date': props.get('Date', {}).get('date', {}).get('start', ''),
                            'description': props.get('Description', {}).get('rich_text', [{}])[0].get('plain_text', '')
                        }
                        events.append(event)
                    
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'events': events,
                        'count': len(events)
                    }).encode())
                else:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': f'Notion API error: {response.status_code}'
                    }).encode())
            except Exception as e:
                logger.error(f"Get Notion events error: {e}")
                self._set_headers(500)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': f'Failed to fetch events: {str(e)}'
                }).encode())
                
        except Exception as e:
            logger.error(f"Get Notion events error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def sync_event_to_notion(self):
        """Sync an event to Notion calendar"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            session_id = self.headers.get('X-Session-ID')
            
            if not session_id:
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Not authenticated'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT u.user_id FROM users u
                JOIN sessions s ON u.user_id = s.user_id
                WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
            ''', (session_id,))
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                self._set_headers(401)
                self.wfile.write(json.dumps({'success': False, 'message': 'Invalid session'}).encode())
                return
            
            user_id = user['user_id']
            
            cursor.execute('SELECT api_key, database_id FROM notion_config WHERE user_id = ?', (user_id,))
            config = cursor.fetchone()
            conn.close()
            
            if not config:
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': 'Notion not configured'}).encode())
                return
            
            # Create page in Notion
            try:
                page_data = {
                    'parent': {'database_id': config['database_id']},
                    'properties': {
                        'Name': {
                            'title': [{'text': {'content': data.get('title', 'New Event')}}]
                        },
                        'Date': {
                            'date': {
                                'start': data.get('date', datetime.now().isoformat())
                            }
                        }
                    }
                }
                
                if data.get('description'):
                    page_data['properties']['Description'] = {
                        'rich_text': [{'text': {'content': data['description']}}]
                    }
                
                response = requests.post(
                    'https://api.notion.com/v1/pages',
                    headers={
                        'Authorization': f'Bearer {config["api_key"]}',
                        'Notion-Version': '2022-06-28',
                        'Content-Type': 'application/json'
                    },
                    json=page_data,
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        'success': True,
                        'message': 'Event synced to Notion',
                        'page_id': response.json().get('id')
                    }).encode())
                else:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': f'Notion API error: {response.status_code}'
                    }).encode())
            except Exception as e:
                logger.error(f"Sync event to Notion error: {e}")
                self._set_headers(500)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': f'Failed to sync event: {str(e)}'
                }).encode())
                
        except Exception as e:
            logger.error(f"Sync event to Notion error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    # ==================== CALENDAR MANAGEMENT ENDPOINTS ====================
    
    def get_calendar_availability(self, query_params):
        """Get calendar availability (available and occupied days)"""
        try:
            # Get date range from query params
            start_date = query_params.get('start_date', [None])[0]
            end_date = query_params.get('end_date', [None])[0]
            
            if not start_date or not end_date:
                # Default to current month
                today = datetime.now()
                start_date = today.replace(day=1).strftime('%Y-%m-%d')
                # Last day of month
                if today.month == 12:
                    end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
                end_date = end_date.strftime('%Y-%m-%d')
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Create appointments table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS appointments (
                    appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_name TEXT NOT NULL,
                    client_email TEXT NOT NULL,
                    client_phone TEXT,
                    appointment_date DATE NOT NULL,
                    appointment_time TIME NOT NULL,
                    duration_minutes INTEGER DEFAULT 60,
                    appointment_type TEXT DEFAULT 'consultation',
                    status TEXT DEFAULT 'confirmed', -- 'confirmed', 'pending', 'cancelled', 'completed'
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER,
                    synced_to_notion INTEGER DEFAULT 0,
                    synced_to_google INTEGER DEFAULT 0,
                    notion_page_id TEXT,
                    google_event_id TEXT,
                    FOREIGN KEY (created_by) REFERENCES users(user_id)
                )
            ''')
            
            # Create availability settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS calendar_availability (
                    availability_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    is_available INTEGER DEFAULT 1,
                    max_appointments INTEGER DEFAULT 8,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Get appointments in date range
            cursor.execute('''
                SELECT 
                    appointment_id,
                    client_name,
                    appointment_date,
                    appointment_time,
                    duration_minutes,
                    appointment_type,
                    status
                FROM appointments
                WHERE appointment_date >= ? AND appointment_date <= ?
                AND status IN ('confirmed', 'pending')
                ORDER BY appointment_date, appointment_time
            ''', (start_date, end_date))
            
            appointments = []
            for row in cursor.fetchall():
                appointments.append({
                    'id': row['appointment_id'],
                    'client_name': row['client_name'],
                    'date': row['appointment_date'],
                    'time': row['appointment_time'],
                    'duration': row['duration_minutes'],
                    'type': row['appointment_type'],
                    'status': row['status']
                })
            
            # Get default availability (Mon-Fri, 9 AM - 6 PM)
            cursor.execute('SELECT COUNT(*) as count FROM calendar_availability')
            has_settings = cursor.fetchone()['count'] > 0
            
            if not has_settings:
                # Create default availability: Monday-Friday, 9 AM - 6 PM
                default_hours = [
                    (1, '09:00', '18:00', 8),  # Monday
                    (2, '09:00', '18:00', 8),  # Tuesday
                    (3, '09:00', '18:00', 8),  # Wednesday
                    (4, '09:00', '18:00', 8),  # Thursday
                    (5, '09:00', '18:00', 8),  # Friday
                ]
                for day, start, end, max_appts in default_hours:
                    cursor.execute('''
                        INSERT INTO calendar_availability (day_of_week, start_time, end_time, max_appointments)
                        VALUES (?, ?, ?, ?)
                    ''', (day, start, end, max_appts))
                conn.commit()
            
            # Get availability settings
            cursor.execute('''
                SELECT day_of_week, start_time, end_time, is_available, max_appointments
                FROM calendar_availability
                WHERE is_available = 1
            ''')
            
            availability = {}
            for row in cursor.fetchall():
                day = row['day_of_week']
                availability[day] = {
                    'start_time': row['start_time'],
                    'end_time': row['end_time'],
                    'max_appointments': row['max_appointments']
                }
            
            # Calculate available and occupied days
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            available_days = []
            occupied_days = []
            appointment_counts = {}
            
            # Count appointments per day
            for apt in appointments:
                date_key = apt['date']
                if date_key not in appointment_counts:
                    appointment_counts[date_key] = 0
                appointment_counts[date_key] += 1
            
            # Generate days in range
            current_dt = start_dt
            while current_dt <= end_dt:
                date_str = current_dt.strftime('%Y-%m-%d')
                day_of_week = current_dt.weekday()  # 0=Monday, 6=Sunday
                
                # Adjust for Sunday (6) to be 0 in our system
                if day_of_week == 6:
                    day_of_week = 0
                else:
                    day_of_week += 1
                
                is_available_day = day_of_week in availability
                count = appointment_counts.get(date_str, 0)
                
                if is_available_day:
                    max_appts = availability[day_of_week]['max_appointments']
                    if count < max_appts:
                        available_days.append(date_str)
                    if count > 0:
                        occupied_days.append({
                            'date': date_str,
                            'count': count,
                            'max': max_appts,
                            'appointments': [apt for apt in appointments if apt['date'] == date_str]
                        })
                else:
                    # Weekend or unavailable day
                    if count > 0:
                        occupied_days.append({
                            'date': date_str,
                            'count': count,
                            'max': 0,
                            'appointments': [apt for apt in appointments if apt['date'] == date_str]
                        })
                
                current_dt += timedelta(days=1)
            
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'start_date': start_date,
                'end_date': end_date,
                'available_days': available_days,
                'occupied_days': occupied_days,
                'availability_settings': availability,
                'total_appointments': len(appointments)
            }).encode())
            
        except Exception as e:
            logger.error(f"Get calendar availability error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def get_calendar_appointments(self, query_params):
        """Get calendar appointments for a date range"""
        try:
            start_date = query_params.get('start_date', [None])[0]
            end_date = query_params.get('end_date', [None])[0]
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            if start_date and end_date:
                cursor.execute('''
                    SELECT 
                        appointment_id,
                        client_name,
                        client_email,
                        client_phone,
                        appointment_date,
                        appointment_time,
                        duration_minutes,
                        appointment_type,
                        status,
                        notes,
                        created_at
                    FROM appointments
                    WHERE appointment_date >= ? AND appointment_date <= ?
                    ORDER BY appointment_date, appointment_time
                ''', (start_date, end_date))
            else:
                cursor.execute('''
                    SELECT 
                        appointment_id,
                        client_name,
                        client_email,
                        client_phone,
                        appointment_date,
                        appointment_time,
                        duration_minutes,
                        appointment_type,
                        status,
                        notes,
                        created_at
                    FROM appointments
                    ORDER BY appointment_date DESC, appointment_time DESC
                    LIMIT 50
                ''')
            
            appointments = []
            for row in cursor.fetchall():
                appointments.append({
                    'id': row['appointment_id'],
                    'client_name': row['client_name'],
                    'client_email': row['client_email'],
                    'client_phone': row['client_phone'],
                    'date': row['appointment_date'],
                    'time': row['appointment_time'],
                    'duration': row['duration_minutes'],
                    'type': row['appointment_type'],
                    'status': row['status'],
                    'notes': row['notes'],
                    'created_at': row['created_at']
                })
            
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'appointments': appointments,
                'count': len(appointments)
            }).encode())
            
        except Exception as e:
            logger.error(f"Get calendar appointments error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def create_appointment(self):
        """Create a new appointment"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            required_fields = ['client_name', 'client_email', 'appointment_date', 'appointment_time']
            for field in required_fields:
                if not data.get(field):
                    self._set_headers(400)
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': f'{field} is required'
                    }).encode())
                    return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Check if time slot is available
            appointment_date = data['appointment_date']
            appointment_time = data['appointment_time']
            duration = data.get('duration_minutes', 60)
            
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM appointments
                WHERE appointment_date = ? 
                AND status IN ('confirmed', 'pending')
                AND appointment_time = ?
            ''', (appointment_date, appointment_time))
            
            existing_count = cursor.fetchone()['count']
            
            # Get max appointments for this day
            apt_date = datetime.strptime(appointment_date, '%Y-%m-%d')
            day_of_week = apt_date.weekday()
            if day_of_week == 6:
                day_of_week = 0
            else:
                day_of_week += 1
            
            cursor.execute('''
                SELECT max_appointments
                FROM calendar_availability
                WHERE day_of_week = ? AND is_available = 1
            ''', (day_of_week,))
            
            avail = cursor.fetchone()
            max_appointments = avail['max_appointments'] if avail else 0
            
            if existing_count >= max_appointments:
                conn.close()
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'This time slot is already fully booked'
                }).encode())
                return
            
            # Create appointment
            cursor.execute('''
                INSERT INTO appointments 
                (client_name, client_email, client_phone, appointment_date, appointment_time,
                 duration_minutes, appointment_type, status, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['client_name'],
                data['client_email'],
                data.get('client_phone', ''),
                appointment_date,
                appointment_time,
                duration,
                data.get('appointment_type', 'consultation'),
                data.get('status', 'pending'),
                data.get('notes', ''),
                None  # created_by - can be set if user is logged in
            ))
            
            appointment_id = cursor.lastrowid
            
            # Sync to Notion if configured
            notion_synced = False
            google_synced = False
            
            try:
                notion_synced = self._sync_appointment_to_notion(cursor, appointment_id, data)
            except Exception as e:
                logger.warning(f"Notion sync failed: {e}")
            
            try:
                google_synced = self._sync_appointment_to_google(cursor, appointment_id, data)
            except Exception as e:
                logger.warning(f"Google sync failed: {e}")
            
            conn.commit()
            conn.close()
            
            logger.info(f"Appointment created: {appointment_id}")
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'appointment_id': appointment_id,
                'message': 'Appointment created successfully',
                'synced_to_notion': notion_synced,
                'synced_to_google': google_synced
            }).encode())
            
        except Exception as e:
            logger.error(f"Create appointment error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def delete_appointment(self):
        """Delete an appointment"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'No data'}).encode())
                return
            
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            appointment_id = data.get('appointment_id')
            if not appointment_id:
                self._set_headers(400)
                self.wfile.write(json.dumps({'success': False, 'message': 'appointment_id is required'}).encode())
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Get appointment details for sync deletion
            cursor.execute('SELECT * FROM appointments WHERE appointment_id = ?', (appointment_id,))
            appointment = cursor.fetchone()
            
            if not appointment:
                conn.close()
                self._set_headers(404)
                self.wfile.write(json.dumps({'success': False, 'message': 'Appointment not found'}).encode())
                return
            
            # Delete from external calendars if synced
            if appointment.get('notion_page_id'):
                try:
                    self._delete_appointment_from_notion(appointment)
                except:
                    pass
            
            if appointment.get('google_event_id'):
                try:
                    self._delete_appointment_from_google(appointment)
                except:
                    pass
            
            # Delete appointment
            cursor.execute('DELETE FROM appointments WHERE appointment_id = ?', (appointment_id,))
            conn.commit()
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Appointment deleted successfully'
            }).encode())
            
        except Exception as e:
            logger.error(f"Delete appointment error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def sync_calendar_with_external(self, query_params):
        """Sync calendar with external services (Notion, Google Calendar)"""
        try:
            service = query_params.get('service', ['both'])[0]  # 'notion', 'google', 'both'
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            synced_count = 0
            
            # Sync to Notion
            if service in ['notion', 'both']:
                cursor.execute('SELECT api_key, database_id FROM notion_config LIMIT 1')
                notion_config = cursor.fetchone()
                
                if notion_config and notion_config.get('api_key'):
                    cursor.execute('''
                        SELECT * FROM appointments
                        WHERE synced_to_notion = 0
                        LIMIT 50
                    ''')
                    
                    unsynced = cursor.fetchall()
                    for apt in unsynced:
                        try:
                            if self._sync_appointment_to_notion(cursor, apt['appointment_id'], apt):
                                synced_count += 1
                        except Exception as e:
                            logger.warning(f"Notion sync error for appointment {apt['appointment_id']}: {e}")
            
            # Sync to Google Calendar
            if service in ['google', 'both']:
                # TODO: Implement Google Calendar sync
                pass
            
            if synced_count > 0:
                conn.commit()
            
            conn.close()
            
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'Calendar sync completed. Synced {synced_count} appointments.',
                'synced_count': synced_count
            }).encode())
            
        except Exception as e:
            logger.error(f"Sync calendar error: {e}")
            self._set_headers(500)
            self.wfile.write(json.dumps({'success': False, 'message': str(e)}).encode())
    
    def _sync_appointment_to_notion(self, cursor, appointment_id, appointment_data):
        """Helper: Sync appointment to Notion"""
        try:
            # Get Notion config (assuming single admin config for now)
            cursor.execute('SELECT api_key, database_id FROM notion_config LIMIT 1')
            notion_config = cursor.fetchone()
            
            if not notion_config or not notion_config.get('api_key'):
                return False
            
            # Format appointment data for Notion
            date_str = appointment_data.get('appointment_date', '')
            time_str = appointment_data.get('appointment_time', '')
            client_name = appointment_data.get('client_name', 'Appointment')
            
            # Create Notion page
            response = requests.post(
                'https://api.notion.com/v1/pages',
                headers={
                    'Authorization': f'Bearer {notion_config["api_key"]}',
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                json={
                    'parent': {'database_id': notion_config['database_id']},
                    'properties': {
                        'Name': {
                            'title': [{'text': {'content': f"{client_name} - {date_str} {time_str}"}}]
                        },
                        'Date': {
                            'date': {'start': f"{date_str}T{time_str}"}
                        },
                        'Status': {
                            'select': {'name': appointment_data.get('status', 'pending')}
                        }
                    }
                },
                timeout=10
            )
            
            if response.status_code == 200:
                page_id = response.json().get('id')
                cursor.execute('''
                    UPDATE appointments
                    SET synced_to_notion = 1, notion_page_id = ?
                    WHERE appointment_id = ?
                ''', (page_id, appointment_id))
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Sync to Notion error: {e}")
            return False
    
    def _sync_appointment_to_google(self, cursor, appointment_id, appointment_data):
        """Helper: Sync appointment to Google Calendar"""
        # TODO: Implement Google Calendar sync
        # Requires OAuth token and Google Calendar API
        return False
    
    def _delete_appointment_from_notion(self, appointment):
        """Helper: Delete appointment from Notion"""
        try:
            notion_page_id = appointment.get('notion_page_id')
            if not notion_page_id:
                return False
            
            # Get Notion API key
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT api_key FROM notion_config LIMIT 1')
            notion_config = cursor.fetchone()
            conn.close()
            
            if not notion_config or not notion_config.get('api_key'):
                return False
            
            response = requests.patch(
                f'https://api.notion.com/v1/pages/{notion_page_id}',
                headers={
                    'Authorization': f'Bearer {notion_config["api_key"]}',
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                json={'archived': True},
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Delete from Notion error: {e}")
            return False
    
    def _delete_appointment_from_google(self, appointment):
        """Helper: Delete appointment from Google Calendar"""
        # TODO: Implement Google Calendar deletion
        return False
    
    # WhatsApp endpoints are added here - see continuation in next file section
    # Note: Full WhatsApp implementation needs to be added separately due to file size

def run_server(port=8001):
    """Start the API server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, CampaignAnalyticsAPI)

    print(f"🎨 PVB Estudio Creativo Campaign Analytics API")
    print(f"{'=' * 60}")
    print(f"✅ Server running on http://localhost:{port}")
    print(f"📊 Database: {DATABASE}")
    print(f"{'=' * 60}")
    print(f"\n📡 API Endpoints:")
    print(f"  GET  /api/campaigns       - List all campaigns")
    print(f"  GET  /api/kpis            - Get KPI metrics")
    print(f"  GET  /api/roi-trend       - ROI trend data")
    print(f"  GET  /api/revenue-cost    - Revenue vs Cost data")
    print(f"  GET  /api/social-media    - Social media metrics")
    print(f"  GET  /api/seo-metrics     - SEO metrics")
    print(f"  GET  /api/export          - Export data as CSV")
    print(f"  POST /api/social-config   - Configure social media tracking")
    print(f"\n📢 Ads Platforms Endpoints:")
    print(f"  POST /api/ads-platforms/connect    - Connect ad platform")
    print(f"  GET  /api/ads-platforms/status     - Get platform statuses")
    print(f"  POST /api/ads-platforms/disconnect - Disconnect platform")
    print(f"\n📅 Notion Calendar Endpoints:")
    print(f"  POST /api/notion/connect      - Connect Notion calendar")
    print(f"  GET  /api/notion/test         - Test Notion connection")
    print(f"  GET  /api/notion/config       - Get Notion configuration")
    print(f"  GET  /api/notion/events       - Get events from Notion")
    print(f"  POST /api/notion/sync-event   - Sync event to Notion")
    print(f"\n📆 Calendar Management Endpoints:")
    print(f"  GET  /api/calendar/availability     - Get available/occupied days")
    print(f"  GET  /api/calendar/appointments     - Get appointments")
    print(f"  POST /api/calendar/appointments     - Create appointment")
    print(f"  POST /api/calendar/appointments/delete - Delete appointment")
    print(f"  GET  /api/calendar/sync             - Sync with Notion/Google")
    print(f"\n⌨️  Press Ctrl+C to stop the server\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n⛔ Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    if not os.path.exists(DATABASE):
        print(f"❌ Database not found: {DATABASE}")
        print(f"💡 Run 'python3 init_database.py' first")
        exit(1)

    run_server()
