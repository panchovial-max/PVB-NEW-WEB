#!/usr/bin/env python3
"""Fix user provider column in database"""

import sqlite3

DATABASE = 'shotlist_analytics.db'

conn = sqlite3.connect(DATABASE)
cursor = conn.cursor()

# Fix provider column - set to 'email' for all users
cursor.execute("UPDATE users SET provider = 'email' WHERE email LIKE '%@%'")
conn.commit()

# Verify
cursor.execute("SELECT email, provider FROM users")
users = cursor.fetchall()
print("✅ Users with correct provider:")
for user in users:
    print(f"  {user[0]} - provider: '{user[1]}'")

cursor.execute("SELECT COUNT(*) FROM users WHERE provider = 'email'")
count = cursor.fetchone()[0]
print(f"\n✅ Total users with provider='email': {count}")

conn.close()
print("\n✅ Database fixed! You can now login with:")
print("   Email: techstartup@example.com")
print("   Password: demo123")

