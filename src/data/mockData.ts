import type { AppState, TimeSlot, Teacher, Subject, ClassSection, SubjectAllocation, Assignment, ConstraintSettings } from '../types';
import { getCurrentAcademicSession, getRecommendedSessions, getDefaultSessionStart, getDefaultSessionEnd } from '../utils/session';

const generateTimeSlots = (startHour: number, startMin: number, periods: number, periodDuration: number, breakAfter: number, breakDuration: number, zeroPeriodDuration: number): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let currentH = startHour;
  let currentM = startMin;
  
  const formatT = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  const addMins = (h: number, m: number, minsToAdd: number) => {
    let newM = m + minsToAdd;
    const newH = h + Math.floor(newM / 60);
    newM = newM % 60;
    return { h: newH, m: newM };
  };

  // Dedicated Period 0
  const endZero = addMins(currentH, currentM, zeroPeriodDuration);
  slots.push({
    id: `p0`,
    name: `0`,
    startTime: formatT(currentH, currentM),
    endTime: formatT(endZero.h, endZero.m),
    isBreak: false
  });
  
  currentH = endZero.h;
  currentM = endZero.m;

  for (let i = 1; i <= periods; i++) {
    if (i === breakAfter + 1) {
      const endBreak = addMins(currentH, currentM, breakDuration);
      slots.push({
        id: `break`,
        name: `Break`,
        startTime: formatT(currentH, currentM),
        endTime: formatT(endBreak.h, endBreak.m),
        isBreak: true
      });
      currentH = endBreak.h;
      currentM = endBreak.m;
    }
    
    const endP = addMins(currentH, currentM, periodDuration);
    slots.push({
      id: `p${i}`,
      name: `${i}`,
      startTime: formatT(currentH, currentM),
      endTime: formatT(endP.h, endP.m),
      isBreak: false
    });
    currentH = endP.h;
    currentM = endP.m;
  }
  return slots;
};

const vX_Official = generateTimeSlots(8, 0, 8, 40, 4, 30, 20);
const xiXII_Official = generateTimeSlots(8, 0, 5, 45, 3, 30, 20);

const vX_Summer = generateTimeSlots(7, 30, 8, 35, 4, 30, 15);
const xiXII_Summer = generateTimeSlots(7, 30, 5, 40, 3, 30, 15);

const vX_Winter = generateTimeSlots(8, 30, 8, 40, 4, 30, 15);
const xiXII_Winter = generateTimeSlots(8, 30, 5, 45, 3, 30, 15);

const generateTeachers = (): Teacher[] => {
  const ts: Teacher[] = [];
  // Generating 110 dummy teachers with 3-alphabet codes
  for (let i = 1; i <= 110; i++) {
    // Generate a random 3 letter uppercase code. Based on index to be unique.
    const char1 = String.fromCharCode(65 + (i % 26));
    const char2 = String.fromCharCode(65 + (Math.floor(i / 26) % 26));
    const char3 = String.fromCharCode(65 + ((i * 3) % 26));
    const code = `${char1}${char2}${char3}`;
    ts.push({ id: `t${i}`, code, name: `Teacher ${i}`, maxLoadPerDay: 5 });
  }
  return ts;
};
const teachers: Teacher[] = generateTeachers();

const subjects: Subject[] = [
  { id: 's1', code: 'ENG', name: 'English', type: 'Core', category: 'Academic' },
  { id: 's2', code: 'MAT', name: 'Math', type: 'Core', category: 'Academic' },
  { id: 's3', code: 'SCI', name: 'Science', type: 'Core', category: 'Academic' },
  { id: 's4', code: 'HIS', name: 'History', type: 'Core', category: 'Academic' },
  { id: 's5', code: 'PE', name: 'PE', type: 'Skill', category: 'Academic' },
  { id: 's6', code: 'COM', name: 'Computer', type: 'Skill', category: 'Academic' },
  { id: 's_admin', code: 'ATTN', name: 'Attendance & Assembly', type: 'Skill', category: 'Administrative' },
];

const generateClasses = (): ClassSection[] => {
  const cls: ClassSection[] = [];
  const vi_x = ['VI', 'VII', 'VIII', 'IX', 'X'];
  const vi_x_sec = ['A', 'B', 'C', 'D', 'E']; 
  let idCounter = 1;
  let tCounter = 0;
  
  vi_x.forEach(g => {
    vi_x_sec.forEach(s => {
      // Assign class teacher sequentially
      const ctId = teachers[tCounter % teachers.length].id;
      cls.push({ id: `c${idCounter++}`, grade: g, section: s, group: 'VI-X', classTeacherId: ctId });
      tCounter++;
    });
  });

  const xi_xii = ['XI', 'XII'];
  const xi_xii_sec = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; 
  xi_xii.forEach(g => {
    xi_xii_sec.forEach(s => {
      const ctId = teachers[tCounter % teachers.length].id;
      cls.push({ id: `c${idCounter++}`, grade: g, section: s, group: 'XI-XII', classTeacherId: ctId });
      tCounter++;
    });
  });
  return cls;
};
const classes: ClassSection[] = generateClasses();

const allocations: SubjectAllocation[] = [
  { id: 'a1', classSectionId: 'c1', subjectId: 's1', teacherId: 't1' },
  { id: 'a2', classSectionId: 'c1', subjectId: 's2', teacherId: 't2' },
  { id: 'a3', classSectionId: 'c1', subjectId: 's3', teacherId: 't3' },
  { id: 'a4', classSectionId: 'c1', subjectId: 's5', teacherId: 't5' },
  { id: 'a5', classSectionId: 'c4', subjectId: 's2', teacherId: 't4' },
  { id: 'a6', classSectionId: 'c4', subjectId: 's6', teacherId: 't6' },
  { id: 'a7', classSectionId: 'c5', subjectId: 's4', teacherId: 't1' },
  // random more default allocations
];

const generateZeroPeriodsFixed = (): Assignment[] => {
  const asgns: Assignment[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let aId = 1;

  days.forEach(day => {
    classes.forEach(cls => {
      if (day === 'Saturday' && cls.group !== 'XI-XII') return; // Off day

      if (cls.classTeacherId) {
        asgns.push({
          id: `zero_${aId++}_${cls.id}_${day}`,
          day,
          slotId: 'p0',
          classSectionId: cls.id,
          subjectId: subjects[0].id, // Generic or first subject logic mapping
          teacherId: cls.classTeacherId,
          isLocked: true // rigid fixed
        });
      }
    });
  });
  return asgns;
};

export const defaultConstraints: ConstraintSettings = {
  maxContiguousV_X: 3,
  maxContiguousXI_XII: 2,
  maxContiguousTimeMixed: 120,
  minGapAfterContiguousMixed: 30,
  maxDailyPeriodsV_X: 8,
  maxDailyPeriodsXI_XII: 5,
  maxDailyPeriodsV_X_Sat: 8,
  maxDailyPeriodsXI_XII_Sat: 3,
  maxDailyTimeMixed: 240,
  maxWeeklyPeriodsMixed: 32,
  maxWeeklyTimeMixed: 1280,
  enforceClassTeacherZeroPeriod: true
};

export const initialState: AppState = {
  academicSession: getCurrentAcademicSession(),
  sessionStartDate: getDefaultSessionStart(getCurrentAcademicSession()),
  sessionEndDate: getDefaultSessionEnd(getCurrentAcademicSession()),
  timingMode: 'Official',
  schoolSettings: {
    organizationName: 'Your School Name',
    organizationTagline: 'Excellence in Education',
    signatureLines: {
      line1: 'Timetable Incharge 1',
      line2: 'Timetable Incharge 2',
      line3: 'Vice Principal',
      line4: 'Principal'
    }
  },
  constraints: defaultConstraints,
  teachers,
  subjects,
  classes,
  classSubjectLimits: [],
  allocations,
  merges: [],
  assignments: generateZeroPeriodsFixed(),
  sessions: getRecommendedSessions(),
  timeSlots: {
    'VI-X': {
      'Official': vX_Official,
      'Summer': vX_Summer,
      'Winter': vX_Winter,
    },
    'XI-XII': {
      'Official': xiXII_Official,
      'Summer': xiXII_Summer,
      'Winter': xiXII_Winter,
    }
  }
};
