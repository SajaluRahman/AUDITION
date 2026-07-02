# Audition Portal

A premium, production-ready audition submission website built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and direct **Google APIs / Google Apps Script** integration. It supports uploading files up to **500MB** directly to Google Drive with progress bars, logs submissions into Google Sheets, and provides an interactive casting evaluation dashboard.

---

## Key Features

1. **Cinematic Hero Landing Page**: Modern visual design featuring spotlight overlays, details grids, and interactive FAQs.
2. **Multi-Step Application Wizard**: Powered by React Hook Form & Zod for client-side validations (email formatting, phone verification, and file type/size limits).
3. **Direct-to-Drive Uploads (Resumable Mode)**: Large audition video files (up to 500MB) bypass server limits. Next.js initiates a session, and the browser uploads chunks directly using Google Drive's resumable APIs.
4. **Google Sheets Sync**: Submissions automatically append to Google Sheets with structured details (ID, contact, social links, bio, and status).
5. **Interactive Admin Panel**: Real-time evaluation table with search, status filters, applicant detail drawers (embedded preview links), inline shortlisting/rejections, and CSV data export.

---

## Project Structure

```
audition-portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Global Providers & SEO Header Config
│   │   ├── page.tsx             # Landing Page (Hero, FAQs, Deadline)
│   │   ├── apply/
│   │   │   └── page.tsx         # Wizard Audition Form with Upload Progress
│   │   ├── success/
│   │   │   └── page.tsx         # Thank You checklist and ID tracker
│   │   ├── admin/
│   │   │   └── page.tsx         # Dashboard Table, status toggles & CSV download
│   │   └── api/
│   │       ├── upload/
│   │       │   └── route.ts     # Upload proxy and Resumable Session constructor
│   │       ├── submit/
│   │       │   └── route.ts     # Zod validated Sheets row append gateway
│   │       └── status/
│   │           └── route.ts     # Applicant GET search and status POST updates
│   ├── components/
│   │   ├── Providers.tsx        # Toast and Theme providers (Framer Motion)
│   │   ├── ThemeToggle.tsx      # Dark / Light selector button
│   │   ├── Navbar.tsx           # Responsive Glassmorphic navigation header
│   │   └── Footer.tsx           # Talent categories and Cast links
│   ├── lib/
│   │   ├── google-service.ts    # Direct Sheets & Drive JWT Service Account helper
│   │   └── validation-schema.ts # Shared Zod form constraints
│   └── styles/
│       └── globals.css          # Custom Tailwind v4 styling variables
├── google-apps-script/
│   └── code.js                  # Standalone Apps Script code (fallback / sheet bind)
├── .env.example                 # Environment variables blueprint
└── package.json                 # Dependency manifests
```

---

## Getting Started

### 1. Prerequisite Installations

Clone or access your project folder, and install all required node packages:

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy `.env.example` to create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in the required fields:
   * **`GOOGLE_SHEET_ID`**: The unique identifier of your spreadsheet (found in its browser URL).
   * **`GOOGLE_DRIVE_FOLDER_ID`**: The folder ID inside Google Drive where uploaded folders will reside.
   * **Service Account Credentials**: 
     1. Go to GCP Console -> APIs & Services -> Credentials.
     2. Create a **Service Account** and download its key file in **JSON** format.
     3. Extract values for `client_email`, `project_id`, and `private_key` (copy the complete key block including newlines, wrapping them in double quotes in `.env.local`).
     4. Share your Google Sheet and parent Drive folder with the service account email (`your-service-account@...iam.gserviceaccount.com`) as **Editor**!

---

## Google Sheets & Apps Script Integration Setup

If you prefer using **Google Apps Script** as a standalone backend or helper integration (e.g. directly bound inside the spreadsheet):

1. Open your target Google Sheet.
2. In the top menu, go to **Extensions** -> **Apps Script**.
3. Clear any default code, and copy the content of [code.js](file:///Users/sajalurahman/Desktop/Audition/google-apps-script/code.js) into your Apps Script editor.
4. Save the script file, then click **Deploy** -> **New Deployment**.
5. Set deployment type to **Web App**:
   * *Execute as:* **Me**
   * *Who has access:* **Anyone**
6. Authorize the required script permissions using your Google Account credentials.
7. Copy the generated **Web App URL** for reference or fallback operations.

---

## Running in Development

Run the local Next.js dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test.

---

## Verification & Build

To compile a production bundle and check for build issues:

```bash
npm run build
```
