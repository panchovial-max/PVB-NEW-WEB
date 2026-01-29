#!/usr/bin/env python3
"""
Create Demo Users for PVB Estudio Creativo
Creates test users with email/password authentication
"""

import sqlite3
import hashlib
from datetime import datetime

DATABASE = 'shotlist_analytics.db'

# Demo users to create
DEMO_USERS = [
    {
        'email': 'admin@pvb.com',
        'password': 'admin123',
        'full_name': 'Admin User',
        'role': 'admin'
    },
    {
        'email': 'techstartup@example.com',
        'password': 'demo123',
        'full_name': 'Tech Startup Client',
        'role': 'client'
    },
    {
        'email': 'ecommerce@example.com',
        'password': 'demo123',
        'full_name': 'E-commerce Client',
        'role': 'client'
    },
    {
        'email': 'fashionbrand@example.com',
        'password': 'demo123',
        'full_name': 'Fashion Brand Client',
        'role': 'client'
    },
    {
        'email': 'restaurant@example.com',
        'password': 'demo123',
        'full_name': 'Restaurant Client',
        'role': 'client'
    },
    {
        'email': 'saascompany@example.com',
        'password': 'demo123',
        'full_name': 'SaaS Company Client',
        'role': 'client'
    },
    {
        'email': 'demo@example.com',
        'password': 'demo123',
        'full_name': 'Demo User',
        'role': 'client'
    }
]

def create_demo_users():
    """Create demo users in the database"""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Ensure users table exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                provider TEXT DEFAULT 'email',
                role TEXT DEFAULT 'client',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Ensure sessions table exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        
        print("📋 Creating demo users...")
        print("=" * 60)
        
        created_count = 0
        skipped_count = 0
        
        for user_data in DEMO_USERS:
            email = user_data['email'].strip().lower()
            password = user_data['password']
            full_name = user_data['full_name']
            role = user_data.get('role', 'client')
            
            # Check if user already exists
            cursor.execute('SELECT user_id FROM users WHERE email = ?', (email,))
            existing = cursor.fetchone()
            
            if existing:
                print(f"⏭️  User already exists: {email}")
                skipped_count += 1
                continue
            
            # Hash password
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            
            # Create user
            cursor.execute('''
                INSERT INTO users (email, password, full_name, provider, role, is_active, created_at)
                VALUES (?, ?, ?, 'email', ?, 1, CURRENT_TIMESTAMP)
            ''', (email, hashed_password, full_name, role))
            
            user_id = cursor.lastrowid
            print(f"✅ Created user: {email} (ID: {user_id}) - Role: {role}")
            created_count += 1
        
        conn.commit()
        conn.close()
        
        print("=" * 60)
        print(f"✅ Successfully created {created_count} demo users")
        if skipped_count > 0:
            print(f"⏭️  Skipped {skipped_count} existing users")
        print()
        print("📧 Demo Login Credentials:")
        print("=" * 60)
        print("Admin Account:")
        print("  Email: admin@pvb.com")
        print("  Password: admin123")
        print()
        print("Client Accounts:")
        for user in DEMO_USERS:
            if user['role'] == 'client':
                print(f"  Email: {user['email']}")
                print(f"  Password: {user['password']}")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_demo_users()

