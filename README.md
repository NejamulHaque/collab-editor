<h1 align="center">CollabSheets - Real-Time Collaborative Workspace 📝</h1>

<p align="center">
  A powerful web application featuring a dual-mode Editor (Code View & Rich Text Document View), live collaboration, AI assistance, real-time chat, and a robust user dashboard.
</p>
<div align="center">

![CollabSheets Banner](https://img.shields.io/badge/CollabSheets%20-00d4aa?style=for-the-badge&logo=vite&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase-orange?style=for-the-badge&logo=firebase)](https://collab-client-flt9.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-10.12.2-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com)


[🌐 Live App](https://collab-client-flt9.onrender.com) · [🐛 Report Bug](https://github.com/NejamulHaque/CollabSheets/issues) · [✨ Request Feature](https://github.com/NejamulHaque/CollabSheets/issues)

</div>

## ✨ Features

### 🖥️ Core Functionality
* **Dual Editor Modes:** Seamlessly switch between a full-featured Code Editor (powered by CodeMirror) and a Rich Text Document Editor (powered by Tiptap).
* **Live Multiplayer Collaboration:** Edit documents simultaneously with multiple users. Watch changes happen in real-time with live collaborator cursor tracking and selection sharing, powered by Yjs.
* **Authentication & User Profiles:** Secure registration and login workflows. Profiles are protected with JWT authentication and feature personalized avatars and online statuses.

### 💻 Advanced Code Editor
* **Pro Toolbar:** A dedicated control bar for the code editor, allowing users to toggle:
  - **Themes:** Switch between high-contrast Dark and professional Light modes.
  - **Line Wrapping:** Effortlessly toggle horizontal scrolling.
  - **Font Size:** Real-time font size adjustment for optimal readability.
* **Floating Language Selector:** A modern, glassmorphic "popup" style selector positioned at the bottom-right.
  - Supports **50+ Programming Languages** with intelligent auto-detection.
  - Features a built-in search bar and smooth upward-opening animations.
* **Fast Execution:** Optimized JavaScript execution logic (client-side) and high-speed server-side runners for Python, C++, and Java.

### 📝 Advance Document Editor
* **Full-screen Workspace:** Beautiful edge-to-edge layout for distraction-free typing. 
* **Dynamic Formatting Tools:** Bold, italic, underline, strikethrough, highlights, text colors, and alignment controls.
* **Advanced Inserts:** Add 3x3 Tables, YouTube videos, Images, Blockquotes, and Links directly into your document.
* **Importing & Exporting:** 
  * Import existing `.docx` and PDF documents directly into the editor for viewing or conversion.
  * Export your finished documents straight to `.docx` (Word) or `.pdf` formats.

### 🤖 AI & Collaboration Tools
* **AI Code Assistant:** Built-in floating panel for AI assistance. Describe what you need, and let the AI generate, refactor, or explain the code in real-time.
* **Live Chat & Commenting:** Discuss changes with your team directly via the attached Live Chat panel, or attach floating comments and **Voice Comments** to specific sections.
* **Sidebar Navigator:** Quickly switch between recent documents without leaving the editor.
* **Version History:** Access previous document versions to track changes or revert to a stable state.

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
* **Styling:** Custom CSS system with **Glassmorphism** and backdrop-blur effects.
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
git clone https://github.com/NejamulHaque/CollabSheets.git
cd CollabSheets
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

# Initialize the Database Schema:
# Start your server: node server.js
# Navigate to http://localhost:3000/setup-db to execute migrations.
```

### 4. Frontend Setup
```bash
# Navigate to the frontend folder
cd ../client

# Install Dependencies
npm install --legacy-peer-deps

# Run the frontend:
npm run dev
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Nejamul Haque**

[![GitHub](https://img.shields.io/badge/GitHub-NejamulHaque-black?style=flat-square&logo=github)](https://github.com/NejamulHaque)
[![Email](https://img.shields.io/badge/Email-nejamulhaqueruhaan86%40gmail.com-red?style=flat-square&logo=gmail)](mailto:nejamulhaqueruhaan86@gmail.com)

---

<div align="center">

**⭐ Star this repo if you found it useful!**

Made with ❤️ by Nejamul Haque 
</div>
