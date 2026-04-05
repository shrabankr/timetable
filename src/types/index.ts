export type TimingMode = 'Official' | 'Summer' | 'Winter';
export type ClassGroup = 'VI-X' | 'XI-XII';

export interface TimeSlot {
  id: string;
  name: string;      // e.g., '1', 'Break', '2'
  startTime: string; // '08:00'
  endTime: string;   // '08:40'
  isBreak?: boolean;
}

export interface Teacher {
  id: string;
  code: string;
  name: string;
  maxLoadPerDay: number;
  designation?: string;
  defaultSubjectId?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: 'Core' | 'Skill';
  maxDailyClasses?: number;
  maxWeeklyClasses?: number;
}

export interface ClassSection {
  id: string;
  grade: string;   // e.g. 'VI', 'XI'
  section: string; // e.g. 'A'
  group: ClassGroup;
  classTeacherId?: string;
  coClassTeacherId?: string;
}

// Maps which teacher teaches what subject to which section
export interface SubjectAllocation {
  id: string;
  classSectionId: string;
  subjectId: string;
  teacherId: string;
}

export interface AllocationInfo {
  subjectId: string;
  teacherId: string;
}

export interface Assignment {
  id: string;
  day: string;
  slotId: string;
  classSectionId: string;
  subjectId: string;
  teacherId: string;
  isLocked: boolean; 
}

export interface ValidationResult {
  isValid: boolean;
  type?: 'error' | 'warning';
  message?: string;
  conflicts?: string[];
}

export interface SchoolSettings {
  organizationName: string;
  organizationTagline: string;
  signatureLines: {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  };
}

export interface AppState {
  academicSession: string;
  timingMode: TimingMode;
  schoolSettings: SchoolSettings;
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassSection[];
  allocations: SubjectAllocation[];
  assignments: Assignment[];
  timeSlots: {
    'VI-X': Record<TimingMode, TimeSlot[]>;
    'XI-XII': Record<TimingMode, TimeSlot[]>;
  };
}
