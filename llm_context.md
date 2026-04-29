# RoutinePro: AI Context & Architecture Guide

This document provides a technical and strategic overview of **RoutinePro**, a high-end school timetable management system. It is designed to help LLMs and developers understand the project's logic and goals.

---

## 🎯 Project Vision
**Goal**: To build a premium, open-source alternative to expensive school management software.
**Philosophy**: 
- **Local-First**: Data persists in the browser's LocalStorage. No cloud database or subscription required.
- **Premium UX**: Aesthetic inspired by n8n, Linear, and Vercel (Minimalist, High Contrast, Fluid).
- **Pro-Active Engine**: The system doesn't just store data; it validates it in real-time.

---

## 🏗️ Technical Architecture

### 1. State Management (`src/store/TimetableContext.tsx`)
The app uses a **Centralized Reducer** pattern.
- **AppState**: Contains `teachers`, `classes`, `subjects`, `allocations` (Subject-Teacher mapping), and `assignments` (The actual grid entries).
- **History Reducer**: A wrapper that enables **30 levels of Undo/Redo**.
- **Atomic Actions**: Special actions like `DELETE_TEACHER` ensure data integrity by automatically cleaning up all associated assignments and allocations across the app.

### 2. The Validation Engine (`src/utils/engine.ts`)
This is the "Brain" of the project.
- **Real-time Checks**: Every assignment is validated against:
  - **Teacher Conflict**: A teacher cannot be in two places at once.
  - **Daily Workload**: Respects `maxLoadPerDay` defined in the teacher's profile.
  - **Subject Diversity**: Prevents the same subject from being taught too many times in one day for a specific class.
- **Return Type**: `{ isValid: boolean, type: 'error' | 'warning', message: string }`.

### 3. Allotment vs. Assignment
- **Allotment (`allocations`)**: The strategic decision of *who* teaches *what* to which class. Managed in the **Allotment Matrix**.
- **Assignment (`assignments`)**: The tactical decision of *when* a teacher teaches. Managed in the **Scheduler Lab**.

---

## 📂 File Map
- `/src/types/index.ts`: The "Source of Truth" for all interfaces.
- `/src/components/TimetableGrid.tsx`: The high-performance 8-period scheduler grid.
- `/src/components/AllotmentMatrix.tsx`: A bulk-editing grid for Class-Subject-Teacher mapping.
- `/src/components/SubjectRegistry.tsx`: Global manager for subject names and codes.
- `/src/components/TeacherPanel.tsx`: Faculty registry with advanced filters and workload analytics.

---

## 🎨 UI/UX Design System
- **Colors**: Primary is `Zinc-950` (Dark Sidebar) and `Rose-500` (Branding).
- **Typography**: `Inter` or System Sans-Serif. Heavy use of `font-black` and `tracking-widest` for a premium feel.
- **Components**: Rounded corners (`rounded-2xl`, `rounded-3xl`) and subtle borders (`border-zinc-200`) instead of heavy shadows.

---

## 🛠️ Developmental Rules for AI
1. **Never use manual filters for deletion**: Always use the atomic actions in the reducer (`DELETE_X`).
2. **Respect the Grid**: The Scheduler Lab is optimized for an 8-period horizontal fit. Keep column widths around `95px`.
3. **Data Portability**: Always consider how new features will affect the "Backup/Restore" JSON structure.
