# LearnPro — Industrial Learning Portal

A complete, locally-run learning management system with AI-powered quiz generation and automated certificate issuance.

---

## ✅ Features

- **Role-based login** — Admin and User accounts with separate dashboards
- **Material upload** — PDF, MP4, MP3, images, PowerPoint (up to 50MB)
- **Edit / Delete materials** — Full CRUD for uploaded content
- **AI quiz generation** — Claude reads your uploaded PDF directly and generates 10 MCQs
- **Interactive quiz** — One question at a time with instant feedback and explanations
- **Auto certificate** — Generated automatically when score ≥ 90%, downloadable as PNG
- **Quiz history** — Admin can see all attempts; users see their own certificates
- **Persistent storage** — All data saved in browser localStorage (survives page refresh)
- **Logout** — Available in the sidebar on both dashboards

---

## 🚀 Setup (First Time)

### Prerequisites
- [Node.js](https://nodejs.org/) version 16 or higher
- npm (comes with Node.js)

### Step 1 — Install Node.js
Download from https://nodejs.org/ and install the **LTS** version.

Verify installation:
```bash
node --version
npm --version
```

### Step 2 — Navigate to the project folder
```bash
cd path/to/learning-portal
```
Replace `path/to/learning-portal` with the actual folder path.

### Step 3 — Install dependencies
```bash
npm install
```
This downloads all required packages (~5 minutes on first run).

### Step 4 — Start the portal
```bash
npm start
```
The portal opens automatically at **http://localhost:3000**

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| User | `user` | `user123` |

New users can self-register from the login page (they are always assigned the "User" role).

---

## 🤖 Setting Up AI Quiz Generation

1. Log in as **Admin**
2. Go to **Settings** in the sidebar
3. Paste your Gemini API key (starts with `AIza...`)
4. Click **Save Key**

Get your API key from: https://aistudio.google.com/apikey

> The key is stored locally in your browser and never sent anywhere except Anthropic's API.

---

## 📋 How to Use

### As Admin:
1. Log in with `admin / admin123`
2. Go to **Upload Material** — upload a PDF, video, audio, or image file
3. Go to **Manage Materials** — edit titles or delete materials
4. Go to **Quiz Results** — see all learner attempts and scores
5. Go to **Settings** — add your Gemini API key for AI quiz generation

### As User/Learner:
1. Log in or register a new account
2. Go to **Study Materials** — browse and view uploaded content
3. Go to **Take a Quiz** — select a module; AI generates 10 questions from the PDF
4. Complete the quiz — score is calculated instantly
5. If score ≥ 90% → **certificate is generated automatically**
6. Go to **My Certificates** — download any earned certificates as PNG

---

## 📂 Project Structure

```
learning-portal/
├── public/
│   └── index.html
├── src/
│   ├── App.js                  ← Main app, handles routing
│   ├── index.js                ← Entry point
│   ├── index.css               ← Global styles & design system
│   ├── pages/
│   │   ├── LoginPage.js/css    ← Login & registration
│   │   ├── AdminDashboard.js   ← Admin layout
│   │   ├── UserDashboard.js    ← User layout
│   │   └── Dashboard.css       ← Shared dashboard styles
│   ├── components/
│   │   ├── Sidebar.js/css      ← Navigation sidebar
│   │   ├── AdminUpload.js      ← File upload UI
│   │   ├── AdminMaterials.js   ← Edit/delete materials
│   │   ├── AdminResults.js     ← Quiz results table
│   │   ├── AdminSettings.js    ← API key config
│   │   ├── UserOverview.js     ← User home dashboard
│   │   ├── UserStudy.js        ← Study material viewer
│   │   ├── UserQuiz.js         ← Full quiz flow
│   │   ├── UserCertificates.js ← Certificate gallery
│   │   └── ToastContainer.js   ← Notifications
│   ├── utils/
│   │   ├── storage.js          ← localStorage CRUD
│   │   ├── fileUtils.js        ← File handling, PDF.js
│   │   ├── aiUtils.js          ← Anthropic API calls
│   │   └── certificateUtils.js ← Canvas certificate generator
│   └── hooks/
│       └── useToast.js         ← Toast notification hook
└── package.json
```

---

## 🔒 Data Storage

All data is stored in your **browser's localStorage**:
- User accounts
- Uploaded materials (as base64)
- Quiz results and scores
- API key

> **Note:** Data is per-browser. To share the portal with your team, share the project folder and have each person run `npm start` on their own machine. For a multi-user shared server, the app would need a backend database (Node.js/Express + SQLite), which can be added as a future upgrade.

---

## 🛠 Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Install Node.js from nodejs.org |
| Port 3000 already in use | Run `npm start` — it will offer port 3001 automatically |
| Quiz generation fails | Check your Gemini API key in Admin → Settings |
| Large file upload slow | Files up to 50MB supported; very large videos may be slow |
| Certificate not generating | Make sure you scored ≥ 90% and click "Generate Certificate" |

---

## 📦 Sharing With Your Team

To share this with your manager or team:
1. Zip the entire `learning-portal` folder
2. Share the zip file
3. Recipient unzips, opens terminal in the folder, runs `npm install` then `npm start`
4. No server or internet required (except for AI quiz generation)
