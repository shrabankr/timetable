import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, TimingMode, Assignment, Teacher, ClassGroup, TimeSlot, Subject, SubjectAllocation, ClassSection } from '../types';
import { initialState } from '../data/mockData';
import { validateAssignment } from '../utils/engine';

type Action = 
  | { type: 'SET_TIMING_MODE'; payload: TimingMode }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'REMOVE_ASSIGNMENT'; payload: string }
  | { type: 'AUTO_GENERATE' }
  | { type: 'CLEAR_TODAY'; payload: string }
  | { type: 'SET_TEACHERS'; payload: Teacher[] }
  | { type: 'SET_SUBJECTS'; payload: Subject[] }
  | { type: 'SET_CLASSES'; payload: ClassSection[] }
  | { type: 'ADD_ALLOCATION'; payload: SubjectAllocation }
  | { type: 'SET_ALLOCATIONS'; payload: SubjectAllocation[] }
  | { type: 'SET_ACADEMIC_SESSION'; payload: string }
  | { type: 'SET_SCHOOL_SETTINGS'; payload: any }
  | { type: 'UPDATE_TIME_SLOTS'; payload: { group: ClassGroup; mode: TimingMode; slots: TimeSlot[] } };

const TimetableContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const timetableReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_TIMING_MODE':
      return { ...state, timingMode: action.payload };
    case 'SET_SCHOOL_SETTINGS':
      return { ...state, schoolSettings: action.payload };
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
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return { ...initialState, academicSession: targetSession };
    }
    case 'SET_TEACHERS':
      return { ...state, teachers: action.payload };
    case 'SET_SUBJECTS':
      return { ...state, subjects: action.payload };
    case 'SET_CLASSES':
      return { ...state, classes: action.payload };
    case 'ADD_ALLOCATION':
      return { ...state, allocations: [...state.allocations, action.payload] };
    case 'SET_ALLOCATIONS':
      return { ...state, allocations: action.payload };
    case 'ADD_ASSIGNMENT':
      // Remove any existing assignment at this slot for this class
      const filteredAssignments = state.assignments.filter(
        a => !(a.day === action.payload.day && a.slotId === action.payload.slotId && a.classSectionId === action.payload.classSectionId)
      );
      return { ...state, assignments: [...filteredAssignments, action.payload] };
    case 'REMOVE_ASSIGNMENT':
      return { ...state, assignments: state.assignments.filter(a => a.id !== action.payload) };
    case 'CLEAR_TODAY':
      return { ...state, assignments: state.assignments.filter(a => a.day !== action.payload || a.isLocked) };
    case 'AUTO_GENERATE':
      // Robust auto generator
      const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      let newAssignments: Assignment[] = [];
      let nextId = 1;

      state.classes.forEach(cls => {
        const slots = state.timeSlots[cls.group][state.timingMode].filter(s => !s.isBreak);
        const classAllocations = state.allocations.filter(a => a.classSectionId === cls.id);
        const hasAllocations = classAllocations.length > 0;

        defaultDays.forEach(day => {
          slots.forEach(slot => {
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
               if (result.isValid || result.type === 'warning') {
                   newAssignments.push(asgn);
                   nextId++;
                   validAssigned = true;
               }
             }
          });
        });
      });
      return { ...state, assignments: newAssignments };
    default:
      return state;
  }
};

const loadState = (): AppState => {
  try {
    const lastSession = localStorage.getItem('timetable_last_session') || '2024-2025';
    const saved = localStorage.getItem(`timetable_state_${lastSession}`);
    if (saved) {
      const parsedState = JSON.parse(saved);
      // Force structural refresh so new time slots and core schema overwrite old caches
      parsedState.timeSlots = initialState.timeSlots;
      return parsedState as AppState;
    }
  } catch (e) {
    console.error("Failed to load state", e);
  }
  const defaultSession = localStorage.getItem('timetable_last_session') || initialState.academicSession;
  const defaultMode = (localStorage.getItem('timetable_default_mode') || initialState.timingMode) as TimingMode;
  return { ...initialState, academicSession: defaultSession, timingMode: defaultMode };
};

export const TimetableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(timetableReducer, undefined, loadState);

  // Auto-save on every state change isolated by session
  useEffect(() => {
    localStorage.setItem(`timetable_state_${state.academicSession}`, JSON.stringify(state));
    localStorage.setItem('timetable_last_session', state.academicSession);
  }, [state]);

  return (
    <TimetableContext.Provider value={{ state, dispatch }}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (!context) throw new Error('useTimetable must be used within TimetableProvider');
  return context;
};
