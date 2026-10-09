# DN — Personal Life Management Companion

> A private, mobile-first Progressive Web App (PWA) designed to organize life's moments, memories, daily activities, greetings, and personal finances in one cohesive, beautiful space.

---

## 🌟 Key Features

### 1. Home Dashboard
* **Personalized Daily Overview**: Real-time greeting with daily focus, today's occasions, and quick tasks.
* **On This Day**: Relive memories and moments that happened on this exact date in past years.
* **Upcoming Countdown**: Recurrence-aware countdowns for birthdays, anniversaries, festivals, and milestones.
* **Spending Snapshot**: Monthly net recorded cash flow overview and category highlights.

### 2. Moments & Activities
* **Occasion Tracking**: Manage birthdays, anniversaries, festivals, family functions, milestones, and travel.
* **Recurrence Engine**: Smart monthly and yearly recurrence calculations.
* **Activity Workspaces**: Track tasks, progress, checklist items, and milestones attached to moments.
* **Interactive Timeline**: Chronological event history for every occasion.

### 3. Memories & Media Vault
* **Photo Journal**: Cherished reflections with locations, captions, and high-fidelity photos.
* **Centralized Attachments**: Photo and document library with metadata.
* **Greetings Studio**: Customizable celebratory greeting cards with handcrafted typography templates.

### 4. Personal Finances & Insights
* **Income & Expense Tracking**: Log income sources and categorical expenses (defaulted to Indian Rupees `₹` or custom currency).
* **Analytics & Reports**: Monthly breakdown, savings rates, and category distribution.
* **Cross-App Timeline**: Searchable chronological log linking moments, memories, and expenses.

### 5. Settings, Privacy & Offline
* **Local-First & Private**: All data is stored directly on your device via LocalStorage/IndexedDB. Zero external tracking.
* **Theme Modes**: Full Light, Dark (deep slate), and System sync options.
* **Taxonomy Customization**: Enable, disable, or create custom occasion types and spending categories without erasing historical data.
* **Backup & Restore**: Download full JSON backups (with or without attachments), export CSV spreadsheets, and restore with schema preview.
* **Installable PWA**: Works offline, installable to iOS Safari home screen or Android Chrome.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* [npm](https://www.npmjs.com/)

### Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Divin-kumar/DN.git
cd DN

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

---

## 🛠 Tech Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **PWA & Offline Service Worker**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
* **Motion & Animations**: [Motion](https://motion.dev/)

---

## 🌐 Free 1-Click Deployment

### Deploy with Vercel
1. Import this repository into [Vercel](https://vercel.com).
2. Framework Preset: **Vite** (auto-detected).
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

### Deploy with Netlify
1. Import this repository into [Netlify](https://netlify.com).
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Click **Deploy Site**.

---

## 📄 License
Apache-2.0
