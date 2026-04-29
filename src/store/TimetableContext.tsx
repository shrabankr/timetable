import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { AppState, TimingMode, Assignment, Teacher, ClassGroup, TimeSlot, Subject, SubjectAllocation, ClassSection, ClassMerge, ClassSubjectLimit } from '../types';
import { initialState } from '../data/mockData';
import { validateAssignment } from '../utils/engine';
import { getCurrentAcademicSession, getDefaultSessionStart, getDefaultSessionEnd } from '../utils/session';

type Action = 
  | { type: 'SET_TIMING_MODE'; payload: TimingMode }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'REMOVE_ASSIGNMENT'; payload: string }
  | { type: 'REMOVE_ASSIGNMENTS_BATCH'; payload: string[] }
  | { type: 'AUTO_GENERATE'; payload?: string }
  | { type: 'CLEAR_TODAY'; payload: string }
  | { type: 'SET_TEACHERS'; payload: Teacher[] }
  | { type: 'SET_SUBJECTS'; payload: Subject[] }
  | { type: 'SET_CLASSES'; payload: ClassSection[] }
  | { type: 'SET_CLASS_SUBJECT_LIMITS'; payload: ClassSubjectLimit[] }
  | { type: 'SET_MERGES'; payload: ClassMerge[] }
  | { type: 'DELETE_TEACHER'; payload: string }
  | { type: 'DELETE_CLASS'; payload: string }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'ADD_ALLOCATION'; payload: SubjectAllocation }
  | { type: 'SET_ALLOCATIONS'; payload: SubjectAllocation[] }
  | { type: 'SET_ACADEMIC_SESSIONS'; payload: string[] }
  | { type: 'SET_ACADEMIC_SESSION'; payload: string }
  | { type: 'SET_SCHOOL_SETTINGS'; payload: AppState['schoolSettings'] }
  | { type: 'SET_CONSTRAINTS'; payload: AppState['constraints'] }
  | { type: 'UPDATE_SESSION_DATES'; payload: { start: string; end: string } }
  | { type: 'UPDATE_TIME_SLOTS'; payload: { group: ClassGroup; mode: TimingMode; slots: TimeSlot[] } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_LOCK'; payload: string }
  | { type: 'ROTATE_ASSIGNMENTS'; payload: { slots: { classId: string; slotId: string }[]; day: string } }
  | { type: 'SWAP_ASSIGNMENTS'; payload: { sourceId: string; targetClassId: string; targetSlotId: string; day: string } };

interface HistoryState {
  past: AppState[];
  present: AppState;
  future: AppState[];
}

const MAX_HISTORY = 30;

const TimetableContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  canUndo: boolean;
  canRedo: boolean;
} | undefined>(undefined);

/**
 * Safely merges a parsed localStorage state with the initial state,
 * ensuring all required fields exist with correct types.
 */
const safeHydrate = (parsed: Partial<AppState>): AppState => {
  return {
    academicSession: typeof parsed.academicSession === 'string' ? parsed.academicSession : initialState.academicSession,
    sessionStartDate: parsed.sessionStartDate ?? (typeof parsed.academicSession === 'string' ? getDefaultSessionStart(parsed.academicSession) : initialState.sessionStartDate),
    sessionEndDate: parsed.sessionEndDate ?? (typeof parsed.academicSession === 'string' ? getDefaultSessionEnd(parsed.academicSession) : initialState.sessionEndDate),
    timingMode: ['Official', 'Summer', 'Winter'].includes(parsed.timingMode as string)
      ? (parsed.timingMode as TimingMode)
      : initialState.timingMode,
    schoolSettings: {
      organizationName: parsed.schoolSettings?.organizationName ?? initialState.schoolSettings.organizationName,
      organizationTagline: parsed.schoolSettings?.organizationTagline ?? initialState.schoolSettings.organizationTagline,
      signatureLines: {
        line1: parsed.schoolSettings?.signatureLines?.line1 ?? initialState.schoolSettings.signatureLines.line1,
        line2: parsed.schoolSettings?.signatureLines?.line2 ?? initialState.schoolSettings.signatureLines.line2,
        line3: parsed.schoolSettings?.signatureLines?.line3 ?? initialState.schoolSettings.signatureLines.line3,
        line4: parsed.schoolSettings?.signatureLines?.line4 ?? initialState.schoolSettings.signatureLines.line4,
      },
    },
    constraints: parsed.constraints ?? initialState.constraints,
    teachers: Array.isArray(parsed.teachers) ? parsed.teachers : initialState.teachers,
    subjects: Array.isArray(parsed.subjects) ? parsed.subjects : initialState.subjects,
    classes: Array.isArray(parsed.classes) ? parsed.classes : initialState.classes,
    classSubjectLimits: Array.isArray(parsed.classSubjectLimits) ? parsed.classSubjectLimits : initialState.classSubjectLimits,
    allocations: Array.isArray(parsed.allocations) ? parsed.allocations : initialState.allocations,
    assignments: Array.isArray(parsed.assignments) ? parsed.assignments : initialState.assignments,
    merges: Array.isArray(parsed.merges) ? parsed.merges : initialState.merges,
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : initialState.sessions || [initialState.academicSession],
    // Always use fresh time slots from initial state to prevent structural mismatch
    timeSlots: initialState.timeSlots,
  };
};

const timetableReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_TIMING_MODE':
      return { ...state, timingMode: action.payload };
    case 'SET_SCHOOL_SETTINGS':
      return { ...state, schoolSettings: action.payload };
    case 'SET_CONSTRAINTS':
      return { ...state, constraints: action.payload };
    case 'UPDATE_SESSION_DATES':
      return { ...state, sessionStartDate: action.payload.start, sessionEndDate: action.payload.end };
    case 'UPDATE_TIME_SLOTS':
      return {
        ...state,
        timeSlots: {
          ...state.timeSlots,
          [action.payload.group]: {
            ...state.timeSlots[action.payload.group],
            [action.payload.mode]: action.payload.slots
          }
        }
      };
    case 'SET_ACADEMIC_SESSION': {
      localStorage.setItem(`timetable_state_${state.academicSession}`, JSON.stringify(state));
      const targetSession = action.payload;
      try {
        const saved = localStorage.getItem(`timetable_state_${targetSession}`);
        if (saved) return safeHydrate(JSON.parse(saved));
      } catch {
        // use default state below
      }
      return { ...initialState, academicSession: targetSession };
    }
    case 'SET_TEACHERS':
      return { ...state, teachers: action.payload };
    case 'SET_SUBJECTS':
      return { ...state, subjects: action.payload };
    case 'SET_CLASSES':
      return { ...state, classes: action.payload };
    case 'SET_CLASS_SUBJECT_LIMITS':
      return { ...state, classSubjectLimits: action.payload };
    case 'SET_MERGES':
      return { ...state, merges: action.payload };
    case 'ADD_ALLOCATION':
      return { ...state, allocations: [...state.allocations, action.payload] };
    case 'SET_ALLOCATIONS':
      return { ...state, allocations: action.payload };
    case 'ADD_ASSIGNMENT': {
      // Protect locked assignments — refuse to overwrite
      const existingLocked = state.assignments.find(
        a => a.day === action.payload.day && a.slotId === action.payload.slotId 
          && a.classSectionId === action.payload.classSectionId && a.isLocked
      );
      if (existingLocked) return state; // no-op: slot is locked

      // Remove any existing (unlocked) assignment at this slot for this class
      const filteredAssignments = state.assignments.filter(
        a => !(a.day === action.payload.day && a.slotId === action.payload.slotId && a.classSectionId === action.payload.classSectionId)
      );
      return { ...state, assignments: [...filteredAssignments, action.payload] };
    }
    case 'REMOVE_ASSIGNMENT':
      return { ...state, assignments: state.assignments.filter(a => a.id !== action.payload) };
    case 'REMOVE_ASSIGNMENTS_BATCH': {
      const idsToRemove = new Set(action.payload);
      return { ...state, assignments: state.assignments.filter(a => !idsToRemove.has(a.id)) };
    }
    case 'DELETE_TEACHER': {
      // Atomic: remove teacher + their assignments + their allocations in one transition
      const teacherIdToDelete = action.payload;
      return {
        ...state,
        teachers: state.teachers.filter(t => t.id !== teacherIdToDelete),
        assignments: state.assignments.filter(a => a.teacherId !== teacherIdToDelete),
        allocations: state.allocations.filter(a => a.teacherId !== teacherIdToDelete),
      };
    }
    case 'DELETE_CLASS': {
      // Atomic: remove class + their assignments + their allocations in one transition
      const classIdToDelete = action.payload;
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== classIdToDelete),
        assignments: state.assignments.filter(a => a.classSectionId !== classIdToDelete),
        allocations: state.allocations.filter(a => a.classSectionId !== classIdToDelete),
      };
    }
    case 'DELETE_SUBJECT': {
      // Atomic: remove subject + reset teacher defaults + remove allocations + remove assignments
      const subjectId = action.payload;
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== subjectId),
        teachers: state.teachers.map(t => t.defaultSubjectId === subjectId ? { ...t, defaultSubjectId: undefined } : t),
        allocations: state.allocations.filter(a => a.subjectId !== subjectId),
        assignments: state.assignments.filter(a => a.subjectId !== subjectId),
      };
    }
    case 'SET_ACADEMIC_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'CLEAR_TODAY':
      return { ...state, assignments: state.assignments.filter(a => a.day !== action.payload || a.isLocked) };
    case 'AUTO_GENERATE': {
      // Robust auto generator prioritizing days and locked logic
      const targetDays = action.payload 
        ? [action.payload] 
        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
      const retainedAssignments = state.assignments.filter(a => {
         // Keep if it's not in our generation target days OR if it's locked
         return !targetDays.includes(a.day) || a.isLocked;
      });
      
      const newAssignments: Assignment[] = [...retainedAssignments];
      let nextId = 1;

      state.classes.forEach(cls => {
        const groupSlots = state.timeSlots[cls.group];
        if (!groupSlots) return; // safety check
        const modeSlots = groupSlots[state.timingMode];
        if (!modeSlots) return; // safety check
        const slots = modeSlots.filter(s => !s.isBreak);
        const classAllocations = state.allocations.filter(a => a.classSectionId === cls.id);
        const hasAllocations = classAllocations.length > 0;

        targetDays.forEach(day => {
          slots.forEach(slot => {
             // Check if already locked/retained
             const exists = newAssignments.find(a => a.day === day && a.slotId === slot.id && a.classSectionId === cls.id);
             if (exists) return;

             let validAssigned = false;
             let attempts = 0;
             while(!validAssigned && attempts < 40) {
               attempts++;
               let tId = '';
               let sId = '';
               if (hasAllocations) {
                 const allocation = classAllocations[Math.floor(Math.random() * classAllocations.length)];
                 tId = allocation.teacherId;
                 sId = allocation.subjectId;
               } else {
                 if (state.teachers.length === 0 || state.subjects.length === 0) break;
                 tId = state.teachers[Math.floor(Math.random() * state.teachers.length)].id;
                 sId = state.subjects[Math.floor(Math.random() * state.subjects.length)].id;
               }
               
               const asgn: Assignment = {
                 id: `auto_${Date.now()}_${nextId}`,
                 day,
                 slotId: slot.id,
                 classSectionId: cls.id,
                 subjectId: sId,
                 teacherId: tId,
                 isLocked: false,
               };
               
               const tempState = { ...state, assignments: newAssignments };
               const result = validateAssignment(tempState, asgn);
               if (result.isValid) {
                   newAssignments.push(asgn);
                   nextId++;
                   validAssigned = true;
               }
             }
          });
        });
      });
      return { ...state, assignments: newAssignments };
    }
    case 'TOGGLE_LOCK':
      return {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === action.payload ? { ...a, isLocked: !a.isLocked } : a
        )
      };
    case 'SWAP_ASSIGNMENTS': {
      const { sourceId, targetClassId, targetSlotId, day } = action.payload;
      const sourceAsgn = state.assignments.find(a => a.id === sourceId);
      if (!sourceAsgn || sourceAsgn.isLocked) return state;

      const targetAsgn = state.assignments.find(
        a => a.day === day && a.slotId === targetSlotId && a.classSectionId === targetClassId
      );

      if (targetAsgn && targetAsgn.isLocked) return state;

      const newAssignments = state.assignments.map(a => {
        if (a.id === sourceAsgn.id) {
          return { ...a, classSectionId: targetClassId, slotId: targetSlotId, day };
        }
        if (targetAsgn && a.id === targetAsgn.id) {
          return { ...a, classSectionId: sourceAsgn.classSectionId, slotId: sourceAsgn.slotId, day: sourceAsgn.day };
        }
        return a;
      });

      return { ...state, assignments: newAssignments };
    }
    case 'ROTATE_ASSIGNMENTS': {
      const { slots, day } = action.payload; // slots is [{classId, slotId}] in order
      if (slots.length < 2) return state;

      const newAssignments = [...state.assignments];
      
      // Map out the assignments currently in these slots
      const asgns = slots.map((s: any) => 
        state.assignments.find(a => a.day === day && a.classSectionId === s.classId && a.slotId === s.slotId)
      );

      // Rotate: 0 -> 1, 1 -> 2, ..., last -> 0
      for (let i = 0; i < slots.length; i++) {
        const currentAsgn = asgns[i];
        if (!currentAsgn || currentAsgn.isLocked) continue;

        const nextSlotIndex = (i + 1) % slots.length;
        const nextSlot = slots[nextSlotIndex];

        // Find this assignment in the new array and update its position
        const idx = newAssignments.findIndex(a => a.id === currentAsgn.id);
        if (idx !== -1) {
          newAssignments[idx] = { 
            ...newAssignments[idx], 
            classSectionId: nextSlot.classId, 
            slotId: nextSlot.slotId 
          };
        }
      }

      return { ...state, assignments: newAssignments };
    }
    default:
      return state;
  }
};

// Wraps timetableReducer with undo/redo history tracking
const historyReducer = (history: HistoryState, action: Action): HistoryState => {
  const { past, present, future } = history;

  if (action.type === 'UNDO') {
    if (past.length === 0) return history;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    return { past: newPast, present: previous, future: [present, ...future] };
  }

  if (action.type === 'REDO') {
    if (future.length === 0) return history;
    const next = future[0];
    const newFuture = future.slice(1);
    return { past: [...past, present], present: next, future: newFuture };
  }

  const newPresent = timetableReducer(present, action);
  if (newPresent === present) return history;

  return {
    past: [...past.slice(-MAX_HISTORY), present],
    present: newPresent,
    future: [], // clear redo stack on new action
  };
};

const loadState = (): AppState => {
  try {
    const lastSession = localStorage.getItem('timetable_last_session') || getCurrentAcademicSession();
    const saved = localStorage.getItem(`timetable_state_${lastSession}`);
    if (saved) {
      const parsedState = JSON.parse(saved);
      return safeHydrate(parsedState);
    }
  } catch (e) {
    console.error("Failed to load state, resetting to defaults", e);
  }
  const defaultSession = localStorage.getItem('timetable_last_session') || initialState.academicSession;
  const defaultMode = (localStorage.getItem('timetable_default_mode') || initialState.timingMode) as TimingMode;
  return { ...initialState, academicSession: defaultSession, timingMode: defaultMode };
};

const loadHistory = (): HistoryState => ({
  past: [],
  present: loadState(),
  future: [],
});

export const TimetableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, rawDispatch] = useReducer(historyReducer, undefined, loadHistory);

  const dispatch = useCallback((action: Action) => rawDispatch(action), []);

  // Auto-save on every state change isolated by session
  useEffect(() => {
    localStorage.setItem(`timetable_state_${history.present.academicSession}`, JSON.stringify(history.present));
    localStorage.setItem('timetable_last_session', history.present.academicSession);
  }, [history.present]);

  return (
    <TimetableContext.Provider value={{ 
      state: history.present, 
      dispatch,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }}>
      {children}
    </TimetableContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (!context) throw new Error('useTimetable must be used within TimetableProvider');
  return context;
};
