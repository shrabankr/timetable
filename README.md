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
    git clone https://github.com/shrabankr/timetable.git
    cd timetable
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```
    The application will open at `http://localhost:5173`

## 📦 Available Scripts

*   **`npm run dev`** - Start development server with hot module reloading
*   **`npm run build`** - Build for production (TypeScript + Vite optimization)
*   **`npm run preview`** - Preview production build locally
*   **`npm run lint`** - Run ESLint for code quality checks

## 🌐 Deployment

### Netlify Deployment
This project is configured for seamless deployment on **Netlify**:

1.  Connect your GitHub repository to [Netlify](https://app.netlify.com)
2.  Netlify automatically detects `netlify.toml` configuration
3.  Build settings:
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
    - **SPA routing**: Configured for client-side navigation

**Live Demo**: Check the [Netlify dashboard](https://app.netlify.com) for deployment URL after connecting your repo.

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx              # Navigation and export controls
│   ├── TimetableGrid.tsx        # Main scheduling grid
│   ├── TeacherPanel.tsx         # Teacher workload tracker
│   ├── AddTeacherModal.tsx      # Teacher assignment UI
│   ├── ClassManagerModal.tsx    # Class section management
│   └── TimingSettingsModal.tsx  # Timing preset configuration
├── store/              # State management (Context API + useReducer)
│   └── TimetableContext.tsx     # Global app context
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Helper functions and validation logic
│   └── engine.ts               # Constraint validation engine
├── data/               # Mock data for development
│   └── mockData.ts
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## 📝 Usage Tips
1.  **Setting Defaults**: Open `Timing Settings` (⚙️ icon) to set your global default preset for new sessions.
2.  **Validation**: A pre-flight check runs before any download to ensure:
    - All classes have assigned teachers
    - No workload limits are breached
    - No constraint violations exist
3.  **Conflict Handling**:
    - **Critical errors** (Double Booking) block assignments completely
    - **Warnings** (Daily Load limits) can be confirmed by authority

## 🔧 Development Notes

### State Management
The app uses React Context API with `useReducer` for global state:
- Teacher and class management
- Timetable assignments
- Validation results
- Session persistence (localStorage)

### Constraint Engine
The validation engine (`src/utils/engine.ts`) enforces:
- Real-time conflict detection
- Workload capacity checks
- Subject sequence validation
- Class teacher assignment rules

### Component Communication
- **Context-based**: Global state via `useTimetable()` hook
- **Props-based**: Local component state for UI interactions
- **Event handlers**: Modal confirmations and data updates

## 📄 License
© 2024-2025 Heritage Public School - Excellence in Global Education

## 🤝 Contributing
Contributions are welcome! Please follow these guidelines:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make meaningful commits with clear messages
3. Test thoroughly before submitting changes
4. Push to your fork and create a pull request
