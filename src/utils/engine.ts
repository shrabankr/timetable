import type { AppState, Assignment, ValidationResult } from '../types';

export const validateAssignment = (
  state: AppState,
  newAssignment: Assignment
): ValidationResult => {
  const { assignments, teachers, classes, timeSlots, timingMode } = state;
  const teacher = teachers.find(t => t.id === newAssignment.teacherId);
  const cls = classes.find(c => c.id === newAssignment.classSectionId);
  
  if (!teacher || !cls) return { isValid: false, type: 'error', message: 'Invalid assignment data' };

  // 1. Teacher Conflict: No teacher can be assigned to multiple classes at the same time
  const teacherConflict = assignments.find(a => 
    a.teacherId === newAssignment.teacherId && 
    a.day === newAssignment.day && 
    a.slotId === newAssignment.slotId &&
    a.id !== newAssignment.id 
  );

  if (teacherConflict) {
    const conflictClass = classes.find(c => c.id === teacherConflict.classSectionId);
    const conflictSubject = state.subjects.find(s => s.id === teacherConflict.subjectId);
    return {
      isValid: false,
      type: 'error',
      message: `DOUBLE BOOKING DETECTED: Teacher ${teacher.name} is already teaching ${conflictSubject?.name || 'another subject'} in Class ${conflictClass ? `${conflictClass.grade}-${conflictClass.section}` : 'Unknown'} during this exact period.`
    };
  }

  // 2. Maximum teaching load per day
  const teacherAssignmentsToday = assignments.filter(a => 
    a.teacherId === newAssignment.teacherId &&
    a.day === newAssignment.day &&
    a.id !== newAssignment.id
  );

  if (teacherAssignmentsToday.length >= teacher.maxLoadPerDay) {
    return {
      isValid: false,
      type: 'warning',
      message: `MAXIMUM LOAD BREACH: Teacher ${teacher.name} has already reached their maximum authorized daily load of ${teacher.maxLoadPerDay} periods.`
    };
  }

  // 3. Continuous Period Constraints & Class Teacher 0-Period Logic
  // Let's get slots for this class group to determine continuous periods.
  const slots = timeSlots[cls.group][timingMode];
  // Filter out breaks to just check periods
  const periodSlots = slots.filter(s => !s.isBreak);
  
  const isFirstPeriod = periodSlots.length > 0 && newAssignment.slotId === periodSlots[0].id;
  if (isFirstPeriod && cls.classTeacherId && cls.classTeacherId !== newAssignment.teacherId) {
     return {
        isValid: false,
        type: 'warning',
        message: `Period 0 (First Period) is reserved for the Class Teacher.`
     };
  }

  // Sort assignments for the teacher on this day by slot start time index
  const assignedSlots = teacherAssignmentsToday.map(a => a.slotId);
  assignedSlots.push(newAssignment.slotId); // Add the new one
  
  // Create an array mapping each period slot to whether the teacher is busy
  const busyPeriods = periodSlots.map(s => assignedSlots.includes(s.id));
  
  // Find max contiguous true values
  let maxContiguous = 0;
  let currentContiguous = 0;
  for (let i = 0; i < busyPeriods.length; i++) {
    if (busyPeriods[i]) {
      currentContiguous++;
      if (currentContiguous > maxContiguous) {
        maxContiguous = currentContiguous;
      }
    } else {
      currentContiguous = 0;
    }
  }

  const maxAllowedContiguous = 3; // Enforced strict limit
  if (maxContiguous > maxAllowedContiguous) {
    return {
      isValid: false,
      type: 'warning',
      message: `FATIGUE WARNING: Assigning this period forces Teacher ${teacher.name} to teach ${maxContiguous} consecutive back-to-back classes (Limit is ${maxAllowedContiguous}).`
    };
  }

  // 4. Repeated Teachers and Multi-Subject Constraints
  const classTeacherToday = assignments.filter(a =>
    a.classSectionId === newAssignment.classSectionId &&
    a.day === newAssignment.day &&
    a.teacherId === newAssignment.teacherId &&
    a.id !== newAssignment.id
  );

  if (classTeacherToday.length >= 2) {
    return {
      isValid: false,
      type: 'warning',
      message: `TEACHER REPETITION: Teacher ${teacher.name} has already met the maximum limit of 2 periods per day specifically for Class ${cls.grade}-${cls.section}.`
    };
  }

  const distinctSubjects = new Set(assignments.filter(a => a.teacherId === newAssignment.teacherId).map(a => a.subjectId));
  distinctSubjects.add(newAssignment.subjectId);
  
  if (distinctSubjects.size > 2) {
    const newSubj = state.subjects.find(s => s.id === newAssignment.subjectId);
    return {
      isValid: false,
      type: 'warning',
      message: `SUBJECT DIVERSITY LIMIT: Teacher ${teacher.name} is already assigned to teach 2 separate subjects today. Adding ${newSubj?.name || 'a new subject'} breaches their distinct subject limit.`
    };
  }

  // 5. Subject Constraints: Same subject max 2 times per day per class
  const classSubjectToday = assignments.filter(a =>
    a.classSectionId === newAssignment.classSectionId &&
    a.day === newAssignment.day &&
    a.subjectId === newAssignment.subjectId &&
    a.id !== newAssignment.id
  );

  if (classSubjectToday.length >= 2) {
    const newCurriculumSubj = state.subjects.find(s => s.id === newAssignment.subjectId);
    return {
      isValid: false,
      type: 'warning',
      message: `CURRICULUM OVERFLOW: The subject '${newCurriculumSubj?.name || 'chosen'}' is already scheduled twice today exactly in Class ${cls.grade}-${cls.section}.`
    };
  }

  // 6. Global Subject Daily Load Limit (if defined)
  const subjectObj = state.subjects.find(s => s.id === newAssignment.subjectId);
  if (subjectObj && subjectObj.maxDailyClasses) {
     const totalSubjectClassesToday = assignments.filter(a => a.subjectId === newAssignment.subjectId && a.day === newAssignment.day && a.id !== newAssignment.id).length;
     if (totalSubjectClassesToday >= subjectObj.maxDailyClasses) {
        return {
          isValid: false,
          type: 'warning',
          message: `Subject ${subjectObj.name} exceeded maximum daily global limit (${subjectObj.maxDailyClasses}).`
        };
     }
  }

  // 7. Saturday Constraints
  let dayOfWeek = newAssignment.day;
  if(dayOfWeek.includes('-')) {
    const d = new Date(dayOfWeek);
    if (!isNaN(d.getTime())) {
      dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }

  if (dayOfWeek === 'Saturday') {
     if (cls.group !== 'XI-XII') {
         return {
           isValid: false,
           type: 'error',
           message: `Saturday is an off day for ${cls.group}.`
         };
     } else {
         // XI-XII rules: half day (3 periods max + 0 period) -> index limit 3
         const periodIndex = periodSlots.findIndex(s => s.id === newAssignment.slotId);
         if (periodIndex > 3) {
             return {
               isValid: false,
               type: 'error',
               message: `Saturday is a half day. Only the first 3 periods (after 0 period) are active.`
             };
         }
         
         const assignedSubjectObj = state.subjects.find(s => s.id === newAssignment.subjectId);
         if (assignedSubjectObj && assignedSubjectObj.type !== 'Skill') {
             return {
               isValid: false,
               type: 'warning',
               message: `Saturdays are reserved for Skill subjects only.`
             };
         }
     }
  }

  return { isValid: true };
};
