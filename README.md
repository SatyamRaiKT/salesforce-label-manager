# 🚀 Salesforce Label Manager

A full-stack application to manage Salesforce custom labels with translation support, real-time logs, and CSV/XLSX integration. Built with **React + Vite (frontend)** and **Node.js + SQLite (backend)**.

---

## ✨ Features

- 🔁 **Fetch & Sync** Salesforce custom labels and their translations
- 📦 Store and manage labels in a local SQLite database
- 📋 View labels in a searchable, paginated, and responsive table
- 🪄 "View Details" modal with a clean, two-column layout
- 📡 Real-time logging of fetch/sync operations
- ❌ Ability to terminate long-running fetch/sync operations from the UI
- 🌐 Fully responsive and mobile-friendly UI
- ☁️ CORS-enabled backend for local development

---

## 📂 Tech Stack

| Layer     | Tech                             |
|-----------|----------------------------------|
| Frontend  | React + Vite + TailwindCSS       |
| Backend   | Node.js (Raw HTTP server)        |
| Database  | SQLite (`sqlite3` npm package)   |
| Salesforce| Metadata API (via JS scripts)    |

---

## 📦 Installation

### 1. Clone the Repository

git clone https://github.com/YOUR_USERNAME/salesforce-label-manager.git
cd salesforce-label-manager

**2. Install Dependencies**
Backend
npm install
Frontend
npm install

**3. Run the App**

Backend (port 8080)
node server.js

Frontend (port 5173)
npm run dev


_📡 API Endpoints_
Method	Endpoint	Description
GET	/api/fetch	Fetch labels from Salesforce
POST	/api/sync	Sync labels to Salesforce
GET	/api/labels	Get labels from local DB
GET	/api/logs	Real-time logs via SSE


_⚙️ Scripts_
Your Salesforce scripts should be placed inside a salesforceScripts.js file with two exported async functions:
module.exports = {
  fetchAndStoreLabels: async (logCallback) => { /* ... */ },
  syncLabelsToSalesforce: async (logCallback) => { /* ... */ }
};
Each should accept a logging callback like:
logCallback(`Chunk 1/3: Fetching labels...`);

_🛠 Dev Notes_
**Installed Packages**

**Backend**
sqlite3
nodemon (dev)
dotenv (optional)
cors

**Frontend**
react
react-dom
vite
tailwindcss
@headlessui/react (for modal)
lucide-react (icons)

**🧪 Future Enhancements**

CSV/XLSX import/export
User authentication and org management

**🧑‍💻 Author**
Made with ❤️ by Satyam
