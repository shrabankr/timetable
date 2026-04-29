# RoutinePro (Timetable System) AI Skill File

## 🎯 Project Overview
RoutinePro is a high-end, local-first, premium school timetable management system built with React, TypeScript, and Vite. All data persists via the browser's LocalStorage. The system prioritizes a fluid, minimalist, enterprise-grade user experience inspired by tools like n8n, Linear, and Vercel.

## 🏗️ Technical Architecture & State Management
- **State Management**: Uses a Centralized Reducer pattern (`src/store/TimetableContext.tsx`).
  - **AppState**: Contains `teachers`, `classes`, `subjects`, `allocations` (subject-teacher mappings), and `assignments` (grid entries).
  - **History Reducer**: Implements 30 levels of Undo/Redo.
- **Validation Engine** (`src/utils/engine.ts`): Real-time validation checking for:
  - Teacher Conflicts (double-booking).
  - **Group-Wise Daily Limits**: Junior (VI-X) defaults to 8 periods; Senior (XI-XII) defaults to 5 (M-F) and 3 (Sat).
  - **CBSE Saturday Protocol**: Seniors (XI-XII) limited to 3 periods and **"Additional (6th) Subjects"** only.
  - **Period 0 Protocol**: Slot `p0` reserved for **ASM / ATTN** (Attendance & Assembly). Only the **Class Teacher** can be assigned. No academic subjects allowed.
  - **Teacher Fatigue Prevention**: Max contiguous periods (3 for VI-X, 2 for XI-XII). Mandatory 30-min gap for mixed-group teachers after 120 mins of teaching.
  - **Custom Class-Subject Limits**: Dynamic logic replacing static subject rules per grade/subject.
- **Advanced Core Mechanics**:
  - **Smart Reorder Mode**: `Alt + Click` multi-slot selection with **Batch Rotation** (Shift Left/Right) toolbar for complex cycle swaps (e.g., 3→5→2→3).
  - **Print Center & Reporting**: 
    - Configuration modal for generating specialized reports.
    - **Daily Master Grid**: Filterable by Full School, Junior (VI-X), or Senior (XI-XII).
    - **Teacher Slips**: Individual weekly schedule cards (Slips) for staff distribution.
    - **Branding Integration**: Automatic inclusion of school name, tagline, and authorized signatures.
  - **Assignment Locking**: Assignments can be toggled via `TOGGLE_LOCK` to bypass auto-generators.
  - **Smart Substitutions**: Right-click suggestions restricted by teacher load and P0 protocols.
  - **Class Section Merging**: Supports logic for combined lectures (e.g. 11C + 11E) with **Temporal Scoping** (Today, Date Range, Academic Session) and **Whole Day Event** overrides. Default scope is "Today".
- **Merge-Aware Logic**: The grid and generators automatically detect active merges. Merged periods are visually distinct (Emerald for standard, Amber/Sparkles for Whole Day).
- **Integrated Management Workspace**: Removed modal-based configuration for Timings and Class Registries in favor of inline, high-density "Architect" views.

## 🎨 UI/UX Design System
- **Official Print Engine**: Professional, high-fidelity export suite. 
  - **A4 Landscape Optimization**: Automatic orientation for master schedules.
  - **Administrative Aesthetic**: Heavy black borders, centered institutional branding, and generation timestamps.
  - **Signature Suite**: Configurable signature lines for formal validation.
- **Timing Architect**: Integrated high-density dashboard with inline duration editing, auto-propagation of start/end times, and master institutional export suite.
- **Save/Export Suite**: Standardized dropdown menu for cross-platform sharing (WhatsApp, Email, JSON) and PDF generation.
- **Teacher Profile Modal**: High-fidelity view (click Name/Code) showing a **Weekly Academic Distribution** spectrum and chronologically sorted load analytics.
- **Print View**: High-fidelity, print-optimized full-screen overlay with professional table styling and `@media print` hygiene.

## ⚠️ Critical Development Rules
1. **Zero-Modal Workspace**: Prioritize integrating configuration interfaces directly into the main workspace or settings tabs (De-nested architecture). Avoid modals for primary data entry/adjustment to maintain a high-performance administrative flow.
2. **Official Print Fidelity**: All printed outputs MUST follow formal institutional standards (Landscape for master views, high-contrast borders, clear signature areas). No browser default elements or toolbars should ever appear in print.
3. **Atomic Deletions**: Never use manual array filtering for deletion in components. ALWAYS use atomic reducer actions (e.g., `DELETE_TEACHER`, `DELETE_CLASS`) to ensure cascading cleanups across assignments and allocations.
4. **Grid Optimization**: The Scheduler Lab is optimized for an 8-period horizontal layout. Ensure column widths remain around `95px` to prevent layout breaks.
5. **Respect Locks**: Any new bulk operations, clear actions, or generators MUST verify `!assignment.isLocked` before mutation.
6. **Data Integrity**: Ensure new features are compatible with the JSON Backup/Restore structure.
7. **Temporal Awareness**: New structural changes (like merges) should account for temporal scopes (Today/Range/Session) to support flexible daily operations.

## 📝 How to use this skill
When assisting with RoutinePro, follow these guidelines strictly to ensure code consistency, prevent state corruption, and maintain the premium visual standards of the application.
