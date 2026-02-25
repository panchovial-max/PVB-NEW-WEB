# 📱 WhatsApp Business API - Agent Response System

## ✅ What Was Implemented

### 1. **Database Tables** ✅

#### `whatsapp_conversations` Table:
- Stores all WhatsApp conversations
- Tracks contact info, unread counts, status
- Supports agent assignment

#### `whatsapp_messages` Table:
- Stores all incoming/outgoing messages
- Tracks message types (text, image, video, etc.)
- Stores delivery status
- Links to conversations and agents

---

### 2. **Backend API Endpoints** ✅

#### GET/POST `/api/whatsapp/webhook`
**Purpose:** Handle WhatsApp webhook (verification & incoming messages)

**GET (Verification):**
```
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

**POST (Incoming Messages):**
- Receives messages from WhatsApp Cloud API
- Automatically saves to database
- Creates/updates conversations

---

#### GET `/api/whatsapp/conversations`
**Purpose:** Get all WhatsApp conversations for agents

**Query Parameters:**
- `status` (optional) - Filter by status: 'open', 'closed', 'assigned'
- `unread_only` (optional) - 'true' to show only unread conversations

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": 1,
      "phone_number": "+56944328662",
      "contact_name": "John Doe",
      "contact_profile_name": "John",
      "last_message_at": "2026-01-15 10:30:00",
      "last_message": "Hola! Quiero agendar una consulta",
      "unread_count": 2,
      "status": "open",
      "assigned_agent_id": null
    }
  ],
  "count": 1
}
```

---

#### GET `/api/whatsapp/conversation`
**Purpose:** Get a specific conversation

**Query Parameters:**
- `conversation_id` OR `phone_number`

---

#### GET `/api/whatsapp/messages`
**Purpose:** Get messages for a conversation

**Query Parameters:**
- `conversation_id` OR `phone_number`
- `limit` (optional) - Default: 50

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "whatsapp_message_id": "wamid.xxx",
      "phone_number": "+56944328662",
      "direction": "inbound",
      "type": "text",
      "text": "Hola! Quiero agendar una consulta",
      "status": "delivered",
      "timestamp": "2026-01-15 10:30:00",
      "agent_id": null
    }
  ],
  "count": 1
}
```

---

#### POST `/api/whatsapp/send`
**Purpose:** Send a WhatsApp message

**Request Body:**
```json
{
  "phone_number": "+56944328662",
  "message": "Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?",
  "agent_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "wamid.xxx",
  "conversation_id": 1
}
```

---

#### POST `/api/whatsapp/mark-read`
**Purpose:** Mark conversation as read

**Request Body:**
```json
{
  "conversation_id": 1
}
```

---

#### POST `/api/whatsapp/assign-agent`
**Purpose:** Assign an agent to a conversation

**Request Body:**
```json
{
  "conversation_id": 1,
  "agent_id": 2
}
```

---

#### GET `/api/whatsapp/stats`
**Purpose:** Get WhatsApp statistics

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_conversations": 25,
    "unread_conversations": 5,
    "open_conversations": 10,
    "assigned_conversations": 10,
    "messages_last_24h": 150
  }
}
```

---

## 🔧 Setup Instructions

### 1. **WhatsApp Business Cloud API Setup**

1. **Create Meta Business Account:**
   - Go to: https://business.facebook.com
   - Create or use existing business account

2. **Get WhatsApp Business API Access:**
   - Go to: https://developers.facebook.com/apps/
   - Create new app → Select "Business" type
   - Add "WhatsApp" product
   - Get Phone Number ID and Access Token

3. **Configure Webhook:**
   - In WhatsApp settings, set webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Set verify token (e.g., `pvb_estudio_whatsapp_token`)
   - Subscribe to messages and status updates

### 2. **Environment Variables**

Set these environment variables:

```bash
export WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
export WHATSAPP_ACCESS_TOKEN="your_access_token"
export WHATSAPP_VERIFY_TOKEN="pvb_estudio_whatsapp_token"
```

Or add to `.env` file:
```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=pvb_estudio_whatsapp_token
```

### 3. **Database Tables**

Tables are created automatically on first use:
- `whatsapp_conversations`
- `whatsapp_messages`

---

## 💬 How It Works

### **Incoming Messages:**

1. User sends WhatsApp message
2. WhatsApp Cloud API sends webhook to `/api/whatsapp/webhook`
3. System processes message:
   - Creates/updates conversation
   - Saves message to database
   - Increments unread count
4. Agent sees new message in dashboard

### **Agent Response:**

1. Agent views conversation in dashboard
2. Agent types message and clicks "Send"
3. Frontend calls `/api/whatsapp/send`
4. Backend sends message via WhatsApp Cloud API
5. Message saved to database
6. Message delivered to user

---

## 🎨 Agent Dashboard Features Needed

**Next Steps:**
1. Create WhatsApp conversations page in dashboard
2. Show list of conversations with unread badges
3. Show conversation thread with messages
4. Message input box for agent replies
5. Real-time updates (polling or WebSocket)
6. Assign conversation to agent
7. Mark as read functionality

---

## 📋 Message Types Supported

- ✅ **Text messages**
- ✅ **Images** (with captions)
- ✅ **Videos** (with captions)
- ✅ **Audio messages**
- ✅ **Documents**
- ✅ **Location** (coordinates)

---

## ⚠️ Important Notes

### **WhatsApp Business API Limitations:**

1. **24-Hour Window:**
   - Can send template messages anytime
   - Can send free-form messages only within 24 hours of user's last message
   - After 24 hours, must use approved templates

2. **Template Messages:**
   - For outbound messages outside 24-hour window
   - Must be approved by WhatsApp
   - Format restrictions apply

3. **Rate Limits:**
   - 1000 conversations per day (default)
   - Check your plan limits

4. **API Costs:**
   - WhatsApp Cloud API has pricing based on conversations
   - Check Meta's pricing: https://developers.facebook.com/docs/whatsapp/pricing

---

## 🚀 Testing

### **Test Webhook Verification:**

```bash
curl "http://localhost:8001/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=pvb_estudio_whatsapp_token&hub.challenge=test_challenge"
```

Should return: `test_challenge`

### **Test Send Message:**

```bash
curl -X POST http://localhost:8001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+56944328662",
    "message": "Test message from API"
  }'
```

### **Test Get Conversations:**

```bash
curl "http://localhost:8001/api/whatsapp/conversations"
```

---

## 📊 Database Schema

### `whatsapp_conversations`:
```sql
CREATE TABLE whatsapp_conversations (
    conversation_id INTEGER PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    contact_name TEXT,
    contact_profile_name TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'assigned'
    assigned_agent_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### `whatsapp_messages`:
```sql
CREATE TABLE whatsapp_messages (
    message_id INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    whatsapp_message_id TEXT UNIQUE NOT NULL,
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'inbound', 'outbound'
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', etc.
    message_text TEXT,
    media_url TEXT,
    media_type TEXT,
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    agent_id INTEGER
)
```

---

## ✅ Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Database Tables | ✅ Complete | Auto-created on first use |
| Webhook Handler | ✅ Complete | GET for verification, POST for messages |
| Message Processing | ✅ Complete | Saves inbound messages |
| Send Messages | ✅ Complete | Via WhatsApp Cloud API |
| Get Conversations | ✅ Complete | With filters |
| Get Messages | ✅ Complete | For conversation thread |
| Mark as Read | ✅ Complete | Updates unread count |
| Assign Agent | ✅ Complete | Agent assignment |
| Stats API | ✅ Complete | Conversation statistics |
| Agent Dashboard UI | ⚠️ TODO | Need to create UI |

---

## 🎯 Next Steps

1. **Create Agent Dashboard UI:**
   - Conversations list page
   - Conversation view with messages
   - Message input and send
   - Real-time updates

2. **Add Features:**
   - Auto-assignment rules
   - Message templates
   - Typing indicators
   - Read receipts display
   - Media preview in UI

3. **Testing:**
   - Test with real WhatsApp Business API
   - Verify webhook delivery
   - Test message sending
   - Test conversation management

---

**The WhatsApp Business API backend is ready! Now you need to:**
1. Set up WhatsApp Business Cloud API credentials
2. Configure webhook URL
3. Create agent dashboard UI
4. Test with real WhatsApp messages

🎉 Agents can now respond to WhatsApp messages via the API!

