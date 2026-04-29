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
  incharge?: string;
  responsibilities?: string[];
  inchargeRoles?: { classId: string; role: string }[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: 'Core' | 'Skill';
  category?: 'Academic' | 'Administrative';
  isAdditional?: boolean;
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
  subjectInchargeId?: string; // Teacher responsible for subject coordination in this class
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

export interface ClassMerge {
  id: string;
  subjectId: string;
  teacherId: string;
  classSectionIds: string[];
  scope: 'Today' | 'Range' | 'Session';
  startDate?: string;
  endDate?: string;
  isWholeDay?: boolean;
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

export interface ConstraintSettings {
  maxContiguousV_X: number;
  maxContiguousXI_XII: number;
  maxContiguousTimeMixed: number;
  minGapAfterContiguousMixed: number;
  maxDailyPeriodsV_X: number;
  maxDailyPeriodsXI_XII: number;
  maxDailyPeriodsV_X_Sat: number;
  maxDailyPeriodsXI_XII_Sat: number;
  maxDailyTimeMixed: number;
  maxWeeklyPeriodsMixed: number;
  maxWeeklyTimeMixed: number;
  enforceClassTeacherZeroPeriod: boolean;
}

export interface ClassSubjectLimit {
  id: string;
  grade: string; // e.g. 'VI', 'XI', or 'ALL'
  subjectId: string;
  maxDaily: number;
  maxWeekly: number;
}

export interface AppState {
  academicSession: string;
  sessionStartDate: string;
  sessionEndDate: string;
  timingMode: TimingMode;
  schoolSettings: SchoolSettings;
  constraints: ConstraintSettings;
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassSection[];
  classSubjectLimits: ClassSubjectLimit[];
  allocations: SubjectAllocation[];
  assignments: Assignment[];
  merges: ClassMerge[];
  sessions: string[];
  timeSlots: {
    'VI-X': Record<TimingMode, TimeSlot[]>;
    'XI-XII': Record<TimingMode, TimeSlot[]>;
  };
}
