-- PVB Estudio Creativo - Authentication & User Management
-- Multi-client system with user authentication

-- Users/Clients Table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    role TEXT DEFAULT 'client', -- 'admin', 'client', 'viewer'
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Sessions Table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Update campaigns table to link to users
ALTER TABLE campaigns ADD COLUMN user_id INTEGER REFERENCES users(user_id);

-- Campaign Calendar Events
CREATE TABLE IF NOT EXISTS campaign_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    campaign_id INTEGER,
    event_title TEXT NOT NULL,
    event_description TEXT,
    event_type TEXT NOT NULL, -- 'campaign_start', 'campaign_end', 'milestone', 'meeting', 'deadline'
    event_date DATE NOT NULL,
    event_time TIME,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    reminder_enabled INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
);

-- User Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON campaign_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON campaign_events(event_date);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
