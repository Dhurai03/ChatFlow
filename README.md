# ChatFlow

A real-time messaging web application supporting one-to-one and group conversations. ChatFlow demonstrates practical understanding of React, Node.js, Express, MongoDB, REST APIs, JWT authentication, Socket.IO, and responsive UI design.

---

## Features

### Core
- **User Authentication** — Signup, login, logout, persistent session via JWT
- **User Profile & Avatar** — Edit display name, bio, status message, and choose a preset or custom avatar
- **User Search** — Search other users by name or email in the sidebar
- **One-to-One Conversations** — Start or continue direct conversations with any user
- **Group Conversations** — Create named group chats with multiple participants
- **Real-Time Messaging** — Messages delivered instantly via Socket.IO
- **Typing Indicators** — Live typing indicator animated in header & message list
- **Message Status** — Sent ✓ → Delivered ✓✓ → Read ✓✓ (blue, persisted in DB)
- **Message Editing** — Edit your sent messages inline; marked with *(edited)*
- **Message Deletion** — Soft-delete sent messages; shown as *🚫 This message was deleted*
- **Online / Offline Presence** — Live indicator in chat header with instant sync
- **Message Pagination** — Load older messages on demand (30 per page)
- **Conversation Sorting** — Latest activity bubbles to the top
- **Last Message Preview** — Shown in sidebar per conversation
- **Unread Badges** — Unread message count shown per conversation
- **Duplicate Prevention** — MongoDB `_id` deduplication in React state
- **Responsive Design** — Desktop two-panel layout; mobile slide navigation
- **Protected Routes** — Unauthenticated users redirected to login
- **Input Validation** — Frontend + backend validation with user-friendly errors
- **Loading & Empty States** — Spinners, empty chat placeholder, no-results message

---

## Technology Stack

**Frontend:** React 19, Vite, React Router v7, Axios, Socket.IO Client, React Icons, Vanilla CSS

**Backend:** Node.js, Express.js, Socket.IO, Mongoose, JWT, bcryptjs, dotenv, CORS

**Database:** MongoDB Atlas via Mongoose

---

## Project Structure

```
chatflow/
├── client/
│   └── src/
│       ├── components/
│       │   ├── Avatar.jsx              # Reusable avatar (image or initials, online dot)
│       │   ├── ChatHeader.jsx          # Chat header (1-to-1 & group)
│       │   ├── ChatLayout.jsx          # Top-level layout (sidebar + chat window)
│       │   ├── ChatWindow.jsx          # Message view (1-to-1 & group)
│       │   ├── ConversationItem.jsx    # Sidebar conversation row
│       │   ├── ConversationList.jsx    # Sidebar list of conversations
│       │   ├── CreateGroupModal.jsx    # Group creation dialog
│       │   ├── EmptyChat.jsx           # Empty state when no chat is selected
│       │   ├── LoadingSpinner.jsx      # Spinner component
│       │   ├── MessageBubble.jsx       # Individual message (edit/delete, group sender label)
│       │   ├── MessageInput.jsx        # Text input + send button
│       │   ├── MessageList.jsx         # Scrollable message list
│       │   ├── ProfileModal.jsx        # Profile editing dialog
│       │   ├── ProtectedRoute.jsx      # Auth guard
│       │   ├── Sidebar.jsx             # Sidebar (avatar, profile, new group, logout)
│       │   └── UserSearch.jsx          # User search dropdown
│       ├── context/
│       │   ├── AuthContext.jsx         # Auth state + login/logout/updateUser
│       │   └── SocketContext.jsx       # Socket.IO connection + online users
│       ├── hooks/
│       │   ├── useConversations.js     # Conversation list state + socket sync
│       │   └── useMessages.js          # Message state, send, edit, delete, read receipts
│       ├── pages/                      # LoginPage, SignupPage, ChatPage
│       ├── services/
│       │   ├── api.js                  # Axios instance with auth header
│       │   ├── conversationService.js  # getConversations, createConversation, createGroupConversation
│       │   ├── messageService.js       # getMessages, sendMessage, editMessage, deleteMessage, markRead
│       │   └── userService.js          # searchUsers, updateProfile
│       ├── styles/                     # auth.css, chat.css
│       ├── App.jsx
│       └── main.jsx
│
└── server/
    └── src/
        ├── config/         # db.js (MongoDB connection)
        ├── controllers/
        │   ├── authController.js         # signup, login, getMe, logout
        │   ├── conversationController.js # getConversations, createConversation, createGroupConversation
        │   ├── messageController.js      # getMessages, sendMessage, updateStatus, markRead, editMessage, deleteMessage
        │   └── userController.js         # getUsers, updateProfile
        ├── middleware/     # authMiddleware.js
        ├── models/
        │   ├── Conversation.js   # participants, lastMessage, isGroup, name, admin, groupAvatar
        │   ├── Message.js        # text, status, readBy, isEdited, isDeleted
        │   └── User.js           # name, email, password, avatar, bio, statusMessage
        ├── routes/         # authRoutes, userRoutes, conversationRoutes, messageRoutes
        ├── services/       # tokenService.js
        ├── sockets/        # index.js (all Socket.IO event handlers)
        ├── app.js
        └── server.js
```

---

## Prerequisites

- Node.js v18+
- npm v9+
- A MongoDB Atlas account and cluster

---

## MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new **Project** (e.g., `ChatFlow`)
3. Create a **Cluster** (M0 free tier is sufficient)
4. Under **Database Access**, create a database user with a strong password
5. Under **Network Access**, add `0.0.0.0/0` (allow all IPs) for development
6. Click **Connect** → **Drivers** → copy the connection string
7. Replace `<username>` and `<password>` in the URI with your database user credentials
8. Paste the URI into `server/.env` as `MONGODB_URI`

---

## Environment Variables

Create `server/.env` (copy from `server/.env.example`):

```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_strong_random_secret_here_min_32_chars
CLIENT_URL=http://localhost:5173
```


| Variable      | Description                                        |
|---------------|----------------------------------------------------|
| `PORT`        | Port the Express server listens on                 |
| `MONGODB_URI` | Full MongoDB Atlas connection string               |
| `JWT_SECRET`  | Secret key used to sign and verify JWTs            |
| `CLIENT_URL`  | Frontend origin for CORS and Socket.IO             |

**Never commit `.env` to version control.**

---

## Installation

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

---

## Running the Application

**Start the backend** (from `server/`):
```bash
npm run dev
```
Server runs at `http://localhost:5000`

**Start the frontend** (from `client/`):
```bash
npm run dev
```
Client runs at `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## Authentication

- Passwords are hashed with **bcryptjs** (salt rounds: 10) before storage. The plaintext password is never stored or returned.
- On login/signup, the server returns a **JWT** signed with `JWT_SECRET`, expiring in 30 days.
- The token is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every API request.
- On app load, the token is validated via `GET /api/auth/me`. If invalid, the user is redirected to login.
- `POST /api/auth/logout` is a server-side hook for clean logout (token removal is client-side).

---

## Database Models

### User
| Field           | Type   | Notes                                        |
|-----------------|--------|----------------------------------------------|
| `name`          | String | Required, trimmed                            |
| `email`         | String | Required, unique, lowercase                  |
| `password`      | String | Hashed (bcryptjs), never returned in API     |
| `avatar`        | String | URL to avatar image (default: '')            |
| `bio`           | String | Short bio, max 160 chars (default: '')       |
| `statusMessage` | String | Status string, max 100 chars                 |
| `createdAt`     | Date   | Auto (timestamps)                            |
| `updatedAt`     | Date   | Auto (timestamps)                            |

### Conversation
| Field           | Type       | Notes                                         |
|-----------------|------------|-----------------------------------------------|
| `participants`  | [ObjectId] | Refs to User documents                        |
| `lastMessage`   | String     | Preview text                                  |
| `lastMessageAt` | Date       | Used for sorting                              |
| `isGroup`       | Boolean    | `true` for group conversations (default false)|
| `name`          | String     | Group name (group only)                       |
| `admin`         | ObjectId   | Ref to User who created the group             |
| `groupAvatar`   | String     | Optional group avatar URL                     |
| `createdAt`     | Date       | Auto                                          |

### Message
| Field            | Type     | Notes                                       |
|------------------|----------|---------------------------------------------|
| `conversationId` | ObjectId | Ref to Conversation                         |
| `sender`         | ObjectId | Ref to User                                 |
| `receiver`       | ObjectId | Ref to User (optional for group messages)   |
| `text`           | String   | Trimmed, max 2000 chars                     |
| `status`         | String   | `sent` → `delivered` → `read`               |
| `readBy`         | Array    | `[{ user, readAt }]` — persisted read state |
| `isEdited`       | Boolean  | Set to `true` after an edit                 |
| `isDeleted`      | Boolean  | Soft delete flag                            |
| `deletedAt`      | Date     | Timestamp of deletion                       |
| `createdAt`      | Date     | Auto                                        |

---

## Real-Time Messaging (Socket.IO)

Socket connections are authenticated using the JWT passed in `socket.handshake.auth.token`.

**Rooms:** Each conversation uses its `_id` as a Socket.IO room. Users join on open, leave on switch.

**Message Flow (1-to-1):**
1. User A sends → REST `POST /api/messages` → saved to MongoDB → REST response
2. Client emits `message:send` via socket
3. Server broadcasts `message:new` to the conversation room
4. User B receives `message:new` → message added to state (deduplication by `_id`)
5. User B emits `message:delivered` → server updates DB, notifies sender via `message:status`
6. User B opens conversation → emits `messages:read` → sender sees ✓✓ turn blue (persisted in `readBy`)

**Group Message Flow:**
- Same as above, but `receiver` is omitted and `message:new` is broadcast to the entire room

**Presence:** Server maintains a `Map<userId, socketId>`. On connect: broadcasts `user:online`. On disconnect: broadcasts `user:offline`.

---

## API Endpoints

### Auth
| Method | Path               | Auth | Description                  |
|--------|--------------------|------|------------------------------|
| POST   | /api/auth/signup   | No   | Register new user            |
| POST   | /api/auth/login    | No   | Login, get JWT               |
| GET    | /api/auth/me       | Yes  | Get current user             |
| POST   | /api/auth/logout   | Yes  | Server-side logout hook      |

### Users
| Method | Path                | Auth | Description                        |
|--------|---------------------|------|------------------------------------|
| GET    | /api/users          | Yes  | Search users (excludes self)       |
| PATCH  | /api/users/profile  | Yes  | Update name, avatar, bio, status   |

Query: `?search=name_or_email`

### Conversations
| Method | Path                        | Auth | Description                          |
|--------|-----------------------------|------|--------------------------------------|
| GET    | /api/conversations          | Yes  | Get all conversations for user       |
| POST   | /api/conversations          | Yes  | Create or return existing 1:1 conv   |
| POST   | /api/conversations/group    | Yes  | Create a new group conversation      |

### Messages
| Method | Path                                             | Auth | Description                          |
|--------|--------------------------------------------------|------|--------------------------------------|
| GET    | /api/messages/conversations/:id/messages         | Yes  | Paginated messages (page, limit)     |
| POST   | /api/messages                                    | Yes  | Send a message                       |
| PATCH  | /api/messages/:messageId/status                  | Yes  | Update single message status         |
| PATCH  | /api/messages/conversations/:id/read             | Yes  | Mark all messages in conv as read    |
| PATCH  | /api/messages/:messageId                         | Yes  | Edit a message (sender only)         |
| DELETE | /api/messages/:messageId                         | Yes  | Soft-delete a message (sender only)  |

### Socket.IO Events
| Direction       | Event               | Payload                                              |
|-----------------|---------------------|------------------------------------------------------|
| Client → Server | `join:conversation` | `conversationId`                                     |
| Client → Server | `leave:conversation`| `conversationId`                                     |
| Client → Server | `typing:start`      | `{ conversationId, receiverId? }`                    |
| Client → Server | `typing:stop`       | `{ conversationId, receiverId? }`                    |
| Client → Server | `message:send`      | `{ messageId, conversationId, receiverId?, text }`   |
| Client → Server | `message:delivered` | `{ messageId, senderId }`                            |
| Client → Server | `messages:read`     | `{ conversationId, senderId }`                       |
| Client → Server | `message:edit`      | `{ messageId, conversationId, text }`                |
| Client → Server | `message:delete`    | `{ messageId, conversationId }`                      |
| Server → Client | `users:online`      | `{ userIds: string[] }`                              |
| Server → Client | `user:online`       | `{ userId }`                                         |
| Server → Client | `user:offline`      | `{ userId }`                                         |
| Server → Client | `user:typing`       | `{ userId, conversationId }`                         |
| Server → Client | `user:stop_typing`  | `{ userId, conversationId }`                         |
| Server → Client | `message:new`       | Full message object (with populated sender)          |
| Server → Client | `message:status`    | `{ messageId, status }`                              |
| Server → Client | `messages:read`     | `{ conversationId, readerId }`                       |
| Server → Client | `message:updated`   | Full updated message object (edit or delete)         |

---

## Testing with Two Users

1. Open **Browser 1** (normal) → sign up as User A → `/chat`
2. Open **Browser 2** (incognito) → sign up as User B → `/chat`
3. In Browser 1: search for User B → open conversation
4. Send a message → User B should receive it instantly (no refresh)
5. In Browser 2: reply → User A receives it instantly
6. Send several messages quickly → verify no duplicates appear
7. Watch status ticks: ✓ → ✓✓ (delivered) → ✓✓ blue (read when B opens chat)
8. Type in either window → other window displays typing indicator
9. Close Browser 2 → User B should show "Offline" in Browser 1
10. Hover over your own message → click ✏️ to edit inline or 🗑️ to delete
11. Click your avatar in the sidebar → edit profile, set avatar preset
12. Click "New Group" → create a group with both users → verify group messaging

---
## 🎥 Project Demo

[▶️ Watch ChatFlow Demo](https://github.com/Dhurai03/ChatFlow/issues/2#issue-5373881739)

---
