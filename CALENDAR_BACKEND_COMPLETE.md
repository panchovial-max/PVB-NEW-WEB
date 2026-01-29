# 📆 Calendar Backend - Complete Implementation

## ✅ What Was Implemented

### 1. **Database Tables** ✅

#### `appointments` Table:
- Stores all appointments with client info, date, time, duration
- Tracks sync status with Notion and Google Calendar
- Supports appointment types and statuses

#### `calendar_availability` Table:
- Defines available hours per day of week
- Configurable max appointments per day
- Default: Monday-Friday, 9 AM - 6 PM, max 8 appointments/day

---

### 2. **Backend API Endpoints** ✅

#### GET `/api/calendar/availability`
**Purpose:** Get available and occupied days for a date range

**Query Parameters:**
- `start_date` (optional) - Start date (YYYY-MM-DD), defaults to first day of month
- `end_date` (optional) - End date (YYYY-MM-DD), defaults to last day of month

**Response:**
```json
{
  "success": true,
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "available_days": ["2026-01-02", "2026-01-03", ...],
  "occupied_days": [
    {
      "date": "2026-01-15",
      "count": 2,
      "max": 8,
      "appointments": [
        {
          "id": 1,
          "client_name": "John Doe",
          "date": "2026-01-15",
          "time": "10:00:00",
          "duration": 60,
          "type": "consultation",
          "status": "confirmed"
        }
      ]
    }
  ],
  "availability_settings": {
    "1": {"start_time": "09:00:00", "end_time": "18:00:00", "max_appointments": 8},
    ...
  },
  "total_appointments": 5
}
```

#### GET `/api/calendar/appointments`
**Purpose:** Get all appointments for a date range

**Query Parameters:**
- `start_date` (optional) - Start date (YYYY-MM-DD)
- `end_date` (optional) - End date (YYYY-MM-DD)
- If not provided, returns last 50 appointments

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": 1,
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_phone": "+56912345678",
      "date": "2026-01-15",
      "time": "10:00:00",
      "duration": 60,
      "type": "consultation",
      "status": "confirmed",
      "notes": "Initial consultation",
      "created_at": "2026-01-10 14:30:00"
    }
  ],
  "count": 1
}
```

#### POST `/api/calendar/appointments`
**Purpose:** Create a new appointment

**Request Body:**
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+56912345678",
  "appointment_date": "2026-01-15",
  "appointment_time": "10:00:00",
  "duration_minutes": 60,
  "appointment_type": "consultation",
  "status": "pending",
  "notes": "Initial consultation"
}
```

**Response:**
```json
{
  "success": true,
  "appointment_id": 1,
  "message": "Appointment created successfully",
  "synced_to_notion": true,
  "synced_to_google": false
}
```

#### POST `/api/calendar/appointments/delete`
**Purpose:** Delete an appointment

**Request Body:**
```json
{
  "appointment_id": 1
}
```

#### GET `/api/calendar/sync`
**Purpose:** Sync appointments with external calendars (Notion, Google)

**Query Parameters:**
- `service` (optional) - 'notion', 'google', or 'both' (default: 'both')

**Response:**
```json
{
  "success": true,
  "message": "Calendar sync completed. Synced 5 appointments.",
  "synced_count": 5
}
```

---

### 3. **Notion Calendar Integration** ✅

**Automatic Sync:**
- When an appointment is created, it automatically syncs to Notion (if configured)
- Creates a page in the Notion database with:
  - Name: `{client_name} - {date} {time}`
  - Date: Appointment date/time
  - Status: Appointment status

**Sync Process:**
1. Checks if Notion is configured
2. Creates page in Notion database
3. Stores Notion page ID in appointment record
4. Marks appointment as synced

**Delete Sync:**
- When appointment is deleted, archives the Notion page

---

### 4. **Google Calendar Integration** ⚠️ PARTIAL

**Status:** Framework ready, needs Google Calendar API implementation

**What's Ready:**
- OAuth configuration for Google
- Helper methods structure
- Database fields for Google sync

**What's Needed:**
- Google Calendar API implementation
- OAuth token refresh
- Event creation/deletion in Google Calendar

---

### 5. **Frontend Calendar Updates** ✅

**Updated Features:**
- Fetches availability from API
- Shows available days (green highlight)
- Shows occupied days (red highlight with count badge)
- Shows unavailable days (grayed out)
- Click handlers for booking
- Displays appointments on occupied days

**Visual Indicators:**
- ✅ **Available days:** Green background, pulse indicator
- 🔴 **Occupied days:** Red background, appointment count badge
- ⚪ **Unavailable days:** Grayed out, not clickable

---

## 🎯 How to Use

### 1. **View Calendar Availability**

**From Frontend:**
- Calendar automatically loads available/occupied days when rendered
- Click on available days to book via WhatsApp
- Click on occupied days to see appointment details

**From API:**
```bash
curl "http://localhost:8001/api/calendar/availability?start_date=2026-01-01&end_date=2026-01-31"
```

### 2. **Create Appointment**

**From API:**
```bash
curl -X POST http://localhost:8001/api/calendar/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "appointment_date": "2026-01-15",
    "appointment_time": "10:00:00"
  }'
```

**From Frontend:**
- Currently redirects to WhatsApp for booking
- Can be extended to show booking form

### 3. **Get Appointments**

**From API:**
```bash
curl "http://localhost:8001/api/calendar/appointments?start_date=2026-01-01&end_date=2026-01-31"
```

### 4. **Sync with External Calendars**

**Sync All Unsynced:**
```bash
curl "http://localhost:8001/api/calendar/sync?service=both"
```

**Sync Only Notion:**
```bash
curl "http://localhost:8001/api/calendar/sync?service=notion"
```

---

## 📋 Default Availability Settings

**Working Hours:**
- **Monday - Friday:** 9:00 AM - 6:00 PM
- **Saturday - Sunday:** Unavailable
- **Max Appointments per Day:** 8

**To Change:**
Update `calendar_availability` table in database or create management UI.

---

## 🔧 Configuration

### Setting Up Notion Sync:

1. **Get Notion API Key:**
   - Go to: https://www.notion.so/my-integrations
   - Create integration
   - Copy API key (starts with `secret_`)

2. **Get Database ID:**
   - Open your Notion calendar database
   - Copy database ID from URL

3. **Connect in Settings:**
   - Go to: `settings.html` → **Ads APIs** tab
   - Scroll to **Notion Calendar Integration**
   - Enter API key and Database ID
   - Click **Connect Notion Calendar**

4. **Share Database:**
   - In Notion, share database with your integration
   - Integration can now create/update events

---

## 🎨 Visual Features

### Available Days:
- ✅ Green background tint
- ✅ Pulse indicator dot (top right)
- ✅ Clickable to book
- ✅ Hover effect

### Occupied Days:
- 🔴 Red background tint
- 🔴 Appointment count badge (top right)
- 🔴 Clickable to see appointments
- 🔴 Shows appointment details on click

### Unavailable Days:
- ⚪ Grayed out
- ⚪ Not clickable (or opens WhatsApp for inquiry)
- ⚪ Weekends by default

---

## 📊 Database Schema

### `appointments` Table:
```sql
CREATE TABLE appointments (
    appointment_id INTEGER PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    appointment_type TEXT DEFAULT 'consultation',
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    synced_to_notion INTEGER DEFAULT 0,
    synced_to_google INTEGER DEFAULT 0,
    notion_page_id TEXT,
    google_event_id TEXT
)
```

### `calendar_availability` Table:
```sql
CREATE TABLE calendar_availability (
    availability_id INTEGER PRIMARY KEY,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available INTEGER DEFAULT 1,
    max_appointments INTEGER DEFAULT 8,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

---

## 🚀 Next Steps

### To Complete:
1. ⚠️ **Google Calendar API Implementation**
   - Implement `_sync_appointment_to_google()`
   - Implement `_delete_appointment_from_google()`
   - Add OAuth token refresh
   - Update OAuth scopes to include Calendar

2. ⚠️ **Frontend Booking Form**
   - Create booking modal/form
   - Allow direct booking from calendar
   - Show available time slots
   - Validate availability before booking

3. ⚠️ **Admin Calendar Management**
   - UI to manage availability settings
   - Edit/delete appointments
   - View all appointments
   - Export appointments

4. ⚠️ **Email Notifications**
   - Send confirmation email on booking
   - Reminder emails before appointment
   - Cancellation notifications

---

## ✅ Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Database Tables | ✅ Complete | Both tables created |
| Availability API | ✅ Complete | Returns available/occupied days |
| Appointments API | ✅ Complete | CRUD operations working |
| Notion Sync | ✅ Complete | Auto-sync on create/delete |
| Google Sync | ⚠️ Partial | Framework ready, needs API |
| Frontend Calendar | ✅ Updated | Shows available/occupied states |
| Visual Indicators | ✅ Complete | Colors and badges implemented |

---

## 🎯 Ready to Use!

The calendar backend is **fully functional** for:
- ✅ Viewing available and occupied days
- ✅ Creating appointments
- ✅ Syncing with Notion Calendar
- ✅ Managing appointments

**To start using:**
1. Start API server: `python3 api_server.py`
2. Open `index.html` in browser
3. Go to Agenda section
4. See available (green) and occupied (red) days
5. Click to book appointments

The calendar now integrates with Notion and can be extended to Google Calendar! 🎉

