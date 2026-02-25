# 🔐 Login Credentials - PVB Estudio Creativo

## Demo User Accounts

### Admin Account
- **Email:** `admin@pvb.com`
- **Password:** `admin123`
- **Role:** Admin

### Client Accounts (All use password: `demo123`)

1. **Tech Startup**
   - **Email:** `techstartup@example.com`
   - **Password:** `demo123`

2. **E-commerce**
   - **Email:** `ecommerce@example.com`
   - **Password:** `demo123`

3. **Fashion Brand**
   - **Email:** `fashionbrand@example.com`
   - **Password:** `demo123`

4. **Restaurant**
   - **Email:** `restaurant@example.com`
   - **Password:** `demo123`

5. **SaaS Company**
   - **Email:** `saascompany@example.com`
   - **Password:** `demo123`

6. **Demo User**
   - **Email:** `demo@example.com`
   - **Password:** `demo123`

---

## 🚀 Quick Start

### Option 1: Use Quick Login Buttons
On the login page, click any of the quick login buttons to auto-fill credentials.

### Option 2: Manual Login
1. Go to `http://localhost:8001/login.html`
2. Enter email and password from the list above
3. Click "SIGN IN"

### Option 3: Create New Account
1. Click "SIGN UP" tab
2. Fill in Full Name, Email, Password (min 8 characters)
3. Confirm Password
4. Agree to Terms & Conditions
5. Click "CREATE ACCOUNT"

---

## 📝 Creating Demo Users

If demo users don't exist, run:

```bash
python3 create_demo_users.py
```

This will create all demo user accounts in the database.

---

## ⚠️ Important Notes

- **Default password for all client accounts:** `demo123`
- **Admin password:** `admin123`
- **Password minimum length:** 8 characters
- **All passwords are hashed using SHA256**

---

## 🔧 Troubleshooting

### Can't login?
1. Make sure the API server is running: `python3 api_server.py`
2. Make sure demo users are created: `python3 create_demo_users.py`
3. Check browser console for errors
4. Verify database exists: `shotlist_analytics.db`

### Need to reset password?
Currently, password reset is not implemented. Use the SIGN UP form to create a new account, or contact support.

---

## 🔒 Security

**Important:** These are demo credentials for development/testing only. 

For production:
- Use stronger passwords
- Implement password reset functionality
- Use proper password hashing (bcrypt, argon2)
- Implement rate limiting
- Add 2FA (two-factor authentication)

---

**Last Updated:** 2026-01-15

