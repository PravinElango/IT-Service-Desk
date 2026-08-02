# 🎫 Enterprise IT Support Ticketing System

A full-stack, real-time IT Helpdesk & Ticketing Platform built with **React 18**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **Socket.io**, and **SQLite**.

Features automated engineer triage, live bi-directional WebSocket updates, media & log attachments, and a comprehensive Super Admin IT Engineer management hub.

---

## 🌟 Key Features

### 👑 Super Admin Hub
- **IT Engineer CRUD**: Add, edit, or remove IT engineers with details (Full Name, Work Email, Phone/Extension, Base Floor, Password, and Technical Skill specializations: *PC Issue*, *Laptop Issue*, *Printer Issue*, *Network Issue*).
- **Master Data Management**: Add, toggle, or edit Issue Categories, Sub-Options, and Campus/Floor Locations dynamically without touching code.
- **Smart Dispatch & Triage**: Automatically or manually assign open tickets to engineers matching the issue category and location.
- **Analytics & SLA Monitor**: Real-time stats for Total Tickets, Open vs. In-Progress vs. Resolved, Reopened tickets, Average resolution time, and Engineer workloads.

### 🛠️ IT Engineer Workspace
- **Assigned Workqueue**: Live ticket feed with real-time audio & toast alerts upon ticket assignment.
- **Status Workflow**: One-click status transitions (`In Progress`, `Resolved`, `Closed`).
- **Resolution & Diagnostics**: Record root-cause diagnosis, action steps taken, and time spent (in minutes).

### 🙋 Client / Employee Portal
- **5-Step Guided Ticket Creator**: Step-by-step wizard selecting Category &rarr; Sub-Option &rarr; Problem Description &rarr; Asset ID/Phone &rarr; Floor/Location.
- **Media & Attachment Uploads**: Drag-and-drop screenshots, error logs, PDFs, and ZIP archives with live thumbnail previews and a full-screen Lightbox viewer.
- **Live Ticket Tracker & Conversation**: Real-time chat with the assigned engineer and 1-click ticket reopen option if an issue persists.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Axios, Socket.io-client, Canvas-Confetti |
| **Backend** | Node.js (v18+), Express.js, Socket.io, Multer (file uploads), Cors |
| **Database** | SQLite3 via `better-sqlite3` (WAL mode enabled for high concurrency) |
| **Auth & Security** | JSON Web Tokens (JWT), Bcrypt password hashing, Role-Based Access Control (RBAC) |

---

## 📂 Project Structure

```text
support_ticket/
├── .gitignore                   # Root Git ignore rules
├── README.md                    # Project documentation & run guide
├── IT-Ticketing-App-Plan.md     # Architecture & system design document
├── client/                      # Frontend Application (React + Vite + Tailwind)
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── api/                 # Axios client with JWT interceptors
│       ├── components/          # Reusable UI (Navbar, Modals, Badges, Layout)
│       ├── context/             # AuthContext (JWT session) & NotificationContext (WebSockets)
│       └── pages/               # Role-based pages (Admin, Engineer, Client, Auth, Tickets)
└── server/                      # Backend REST API & Real-time WebSocket Server
    ├── .env.example             # Template for environment variables
    ├── .gitignore
    ├── package.json
    ├── uploads/                 # Storage for user-uploaded ticket attachments (.gitkeep)
    └── src/
        ├── config/              # SQLite database schema, initialization & auto-seeding
        ├── controllers/         # Business logic (auth, tickets, users, master data)
        ├── middleware/          # Auth JWT verification & Multer file upload handlers
        ├── routes/              # Express API route endpoints
        └── server.js            # Server entry point & Socket.io event engine
```

---

## 🚀 Getting Started (Instructions for Collaborators)

Follow these steps when cloning this repository to a new machine:

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **Git**

---

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd support_ticket
```

---

### 3. Understanding Ignored Files (`.gitignore`)
When you clone the repository, the following files are **intentionally ignored** and will not be in the repository:
1. **`node_modules/`** (in both `client/` and `server/`): Dependencies are excluded to keep the repo lightweight. They will be downloaded when running `npm install`.
2. **`server/.env`**: Secret environment variables (JWT keys, ports) are ignored for security. A template is provided in `server/.env.example`.
3. **`server/src/config/ticketing.db`**: The SQLite database file is ignored. **The server automatically creates and seeds the database with default categories, locations, and demo users on its very first run!**
4. **`server/uploads/*`**: User-uploaded ticket media is ignored to prevent committing personal or binary files. The empty folder structure is preserved via `.gitkeep`.
5. **`client/dist/`**: Compiled frontend production bundles are ignored.

---

### 4. Backend Setup & Run

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Copy the environment variable template:
   - **Windows (Command Prompt / PowerShell)**:
     ```powershell
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

3. Install backend dependencies:
   ```bash
   npm install
   ```

4. Start the backend server:
   ```bash
   node src/server.js
   ```
   *(Or `npm run dev` if nodemon is installed)*

   You should see:
   ```text
   Database initialized and schema verified.
   Default master data & demo users seeded.
   Server listening on port 5000
   WebSocket real-time engine active.
   ```
   The backend API is now running at `http://localhost:5000`.

---

### 5. Frontend Setup & Run

1. Open a **second terminal** and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and go to:
   ```text
   http://localhost:5173
   ```

---

## 🔑 Demo Accounts & Instant Login

You can use the **1-Click Demo Login cards** on the login page or enter the credentials below:

| Role | Email | Password | Scope / Skills |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@support.com` | `Admin@123` | Full access, Engineer CRUD, Master Data, Triage |
| **IT Engineer (Hardware)** | `hw.engineer@support.com` | `Engineer@123` | PC Issue, Laptop Issue |
| **IT Engineer (Network)** | `net.engineer@support.com` | `Engineer@123` | Network Issue |
| **IT Engineer (Printers)** | `print.engineer@support.com` | `Engineer@123` | Printer Issue |
| **Client / Employee 1** | `client@company.com` | `Client@123` | Operations / 1st Floor |
| **Client / Employee 2** | `sarah@company.com` | `Client@123` | Finance / 2nd Floor |

---

## ⚙️ Environment Variables Reference (`server/.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express & Socket.io server |
| `JWT_SECRET` | `it_ticketing_super_secret_jwt_key_2026` | Secret key used to sign and verify auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Session expiration duration |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin for frontend requests |

---

## 🧪 Production Build

To build the client application for production deployment:
```bash
cd client
npm run build
```
The optimized production output will be generated inside `client/dist/`.
