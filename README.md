<h1 align="center">CollabSheets - Real-Time Collaborative Workspace 📝</h1>

<p align="center">
  A powerful web application featuring a dual-mode Editor (Code View & Rich Text Document View), live collaboration, AI assistance, real-time chat, and a robust user dashboard.
</p>
<div align="center">

![CollabSheets Banner](https://img.shields.io/badge/CollabSheets%20-00d4aa?style=for-the-badge&logo=vite&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase-orange?style=for-the-badge&logo=firebase)](https://collab-client-flt9.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-10.12.2-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com)


[🌐 Live App](https://collab-client-flt9.onrender.com) · [🐛 Report Bug](https://github.com/NejamulHaque/collabsheets/issues) · [✨ Request Feature](https://github.com/NejamulHaque/collabsheets/issues)

</div>

## ✨ Features

### 🖥️ Core Functionality
* **Dual Editor Modes:** Seamlessly switch between a full-featured Code Editor (powered by CodeMirror) and a Rich Text Document Editor (powered by Tiptap).
* **Live Multiplayer Collaboration:** Edit documents simultaneously with multiple users. Watch changes happen in real-time with live collaborator cursor tracking, powered by Yjs.
* **Authentication & User Profiles:** Secure registration and login workflows. Profiles are protected with JWT authentication and feature personalized avatars and online statuses.

### 📝 Advance Document Editor
* **Full-screen Workspace:** Beautiful edge-to-edge layout for distraction-free typing. 
* **Dynamic Formatting Tools:** Bold, italic, underline, strikethrough, highlights, text colors, and alignment controls.
* **Advanced Inserts:** Add 3x3 Tables, YouTube videos, Images, Blockquotes, and Links directly into your document.
* **Importing & Exporting:** 
  * Import existing `.docx` and PDF documents directly into the editor for viewing or conversion.
  * Export your finished documents straight to `.docx` (Word) or `.pdf` formats.

### 🤖 AI & Collaboration Tools
* **AI Code Assistant:** Built-in floating panel for AI assistance. Describe what you need, and let the AI generate, refactor, or explain the code in real-time.
* **Live Chat & Commenting:** Discuss changes with your team directly via the attached Live Chat panel, or attach floating comments to specific sections of a document.
* **Version History:** Access previous document versions to track changes or revert to a stable state.
* **Viewer Logs:** See who viewed or interacted with a document.

### ⚙️ Interactive Dashboard
* **Document Management:** Create, delete, and rename documents seamlessly.
* **Search & Filtering:** Quickly locate documents via the real-time search bar.
* **Dark Mode:** Fully supported light and dark themes using custom CSS tokens.
* **Profile & Support Cards:** Dedicated floating 'About Developer' widget displaying portfolio links and UPI payment integrations.

---

## 🚀 Tech Stack

### Frontend Structure (`/client`)
* **Framework:** React 19 (Vite)
* **Routing:** React Router v7
* **Editors:** 
  * CodeMirror 6 (Code Mode)
  * Tiptap / ProseMirror (Document Mode)
* **Collaboration Engine:** Yjs, y-websocket, y-prosemirror
* **Styling:** Custom CSS system (no heavy external libraries like Tailwind)
* **Document Conversion:** Mammoth.js (Word), PDF.js (PDF viewing/parsing)

### Backend Structure (`/server`)
* **Framework:** Node.js, Express.js
* **Database:** PostgreSQL (pg)
* **Real-time Comms:** WebSocket (`ws`) + Custom HTTP Upgrade handlers
* **Authentication:** JSON Web Tokens (JWT), bcrypt (Password Hashing)
* **AI Integration:** Google Generative AI (`@google/genai`)

---

## 🛠️ Local Installation & Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL installed and running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/NejamulHaque/collab-editor.git
cd collab-editor
```

### 2. Setup the Postgres Database
Create a new database inside PostgreSQL.
```sql
CREATE DATABASE collab_db;
```

### 3. Backend Setup
```bash
# Navigate to the backend folder
cd server

# Install Dependencies
npm install

# Create environment configuration
touch .env
```
Add the following to your `server/.env` file:
```env
# Server
PORT=3000

# Database Access
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collab_db

# Security & AI
JWT_SECRET=super_secret_jwt_key
GEMINI_API_KEY=your_google_ai_key
```
**Initialize the Database Schema:** Instead of running manual SQL, you can hit the database setup route:
1. Start your server: `node server.js`
2. Navigate to `http://localhost:3000/setup-db` in your browser. This will automatically execute the required setup migrations. 

### 4. Frontend Setup
```bash
# Navigate to the frontend folder
cd ../client

# Install Dependencies
# (Note: Use legacy peer deps due to strict Tiptap core version requirements)
npm install --legacy-peer-deps

# Create environment configuration
touch .env
```
Add the following to your `client/.env` file:
```env
# Point this to your backend Node.js server
VITE_API_URL=http://localhost:3000

# Optional websocket URL if different from API origin
VITE_WS_URL=ws://localhost:3000
```
Run the frontend:
```bash
npm run dev
```

---

## 🌐 Production Deployment

If hosting on platforms like Render or Heroku:

**Backend Setup:**
1. Deploy the `/server` folder as a Node.js Web Service.
2. Ensure you have provisioned a managed PostgreSQL database.
3. Configure your Environment Variables inside the hosting dashboard (`DB_HOST`, `DB_PASSWORD`, `JWT_SECRET`, etc.).
4. Run `node server.js` as your start command.
5. In your custom domain settings, ensure CORS requests are allowed if you host your frontend on a separate domain.

**Frontend Setup:**
1. Deploy the `/client` folder as a static site or Node web app.
2. Add your built backend URL to your deployment variables: `VITE_API_URL=https://your-backend-server.com`
3. The Vite build process (`npm run build`) will inject your `VITE_API_URL` during compilation. Be sure that there are **no trailing slashes** at the end of the URL (e.g. use `https://xyz.com` instead of `https://xyz.com/`).
