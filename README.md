# Heritage Public School - Dynamic Timetable Management System

A professional, constraint-based School Timetable & Routine Management platform built with **React**, **TypeScript**, and **Vite**. This system provides a robust engine to manage teacher workloads, subject sequences, and document branding with automated validation logic.

## 🚀 Key Features

### 📅 Advanced Scheduling & Timing
*   **Seasonal Presets**: Instant toggle between **Official (20m P0)**, **Summer (15m P0)**, and **Winter (15m P0)** timing configurations.
*   **Locked Period 0**: Natively hard-wired Period 0 for Class Teachers across all sessions (fixed for the whole academic year).
*   **Saturday Rule**: Special 3-period half-day limit for standard classes, restricted to skill-based subjects.

### 🛡️ Constraint-Based Validation Engine
The system's real-time engine prevents scheduling conflicts by looking at:
*   **Double Booking**: Alerting if a teacher is assigned to two classrooms at once.
*   **Fatigue Prevention**: Limit of **3 continuous classes** per teacher.
*   **Load Management**: 
    *   Max 2 distinct subjects per teacher.
    *   Subject repetition limits (Max 2 periods/day per class).
    *   Global daily/weekly subject limits.
*   **Class Teacher Security**: Ensuring a teacher is assigned to only one class section as a lead monitor.

### 📋 Management Modules
*   **Class Manager**: Add, update, or remove sections; assign Primary and Co-Class Teachers with conflict checks.
*   **Teacher Panel**: Track real-time daily workload (Periods taught vs. authorized daily max).
*   **Academic Sessions**: Multi-year session support with automatic persistent memory.

### 📂 Export & Backup Support
*   **Professional Branding**: Branded document frame including School Name, Logo, and dynamic Date/Day labels.
*   **Multi-Format Export**: Download routines as **PDF**, **PNG**, or **Excel (XLSX)**.
*   **Database Matrix**: Full JSON backup and restore features for disaster recovery and mass configuration.
*   **Share Anywhere**: Direct WhatsApp and Email sharing hooks with contextual subject lines.
*   **Print Ready**: Optimized CSS for clean physical printing, hiding irrelevant UI elements.

## 🛠️ Technology Stack
*   **Frontend**: React 19 (Hooks, Redux-inspired Context, useReducer)
*   **Language**: TypeScript
*   **Styling**: Vanilla CSS (Custom properties, Modern flexbox/grid)
*   **Icons**: Lucide React
*   **Utilities**: html2canvas, jsPDF, XLSX (SheetJS), PapaParse

## 🚦 Getting Started

### Prerequisites
*   Node.js (LTS recommended)
*   npm

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/timetable.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```

## 📝 Usage Tips
1.  **Setting Defaults**: Open `Timing Settings` (Settings Icon) to set your global default preset for new sessions.
2.  **Validation**: A pre-save "Pre-Flight" check will run before any download to ensure zero classes are missing teachers and no loads are breached.
3.  **Conflict Override**: Critical errors (Double Booking) block assignments, while non-critical warnings (Daily Load) require Authority confirmation.

---
*© 2024-2025 Heritage Public School - Excellence in Global Education*
