import type { AppState, Assignment, ValidationResult } from '../types';

const timeToMins = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const validateAssignment = (
  state: AppState,
  newAssignment: Assignment
): ValidationResult => {
  const { assignments, teachers, classes, timeSlots, timingMode, constraints } = state;
  const teacher = teachers.find(t => t.id === newAssignment.teacherId);
  const cls = classes.find(c => c.id === newAssignment.classSectionId);
  
  if (!teacher || !cls) return { isValid: false, type: 'error', message: 'Invalid assignment data' };

  // 1. Teacher Conflict: No teacher can be assigned to multiple classes at the same time
  // EXCEPTION: Combined Lectures (Section Merges)
  const teacherConflict = assignments.find(a => 
    a.teacherId === newAssignment.teacherId && 
    a.day === newAssignment.day && 
    a.slotId === newAssignment.slotId &&
    a.id !== newAssignment.id 
  );

  if (teacherConflict) {
    const isMerged = state.merges.some(m => 
      m.subjectId === newAssignment.subjectId &&
      m.teacherId === newAssignment.teacherId &&
      m.classSectionIds.includes(newAssignment.classSectionId) &&
      m.classSectionIds.includes(teacherConflict.classSectionId)
    );

    if (!isMerged) {
      const conflictClass = classes.find(c => c.id === teacherConflict.classSectionId);
      const conflictSubject = state.subjects.find(s => s.id === teacherConflict.subjectId);
      return {
        isValid: false,
        type: 'error',
        message: `DOUBLE BOOKING: Teacher ${teacher.name} is teaching ${conflictSubject?.name || 'another subject'} in Class ${conflictClass ? `${conflictClass.grade}-${conflictClass.section}` : 'Unknown'}.`
      };
    }
  }

  // 2. Continuous Period Constraints & Class Teacher 0-Period Logic
  const groupSlots = timeSlots[cls.group][timingMode];
  const periodSlots = groupSlots.filter(s => !s.isBreak);
  
  // 3. Period 0 Protocols: Attendance & Assembly
  const isZeroPeriod = newAssignment.slotId === 'p0';
  const subject = state.subjects.find(s => s.id === newAssignment.subjectId);

  if (isZeroPeriod) {
    // Rule: Must be Administrative category (Assembly/Attendance)
    if (subject?.category !== 'Administrative') {
      return { 
        isValid: false, 
        type: 'error', 
        message: `PERIOD 0 PROTOCOL: Slot reserved for Attendance/Assembly. Academic subjects are not permitted.` 
      };
    }

    // Rule: Class Teacher assignment
    if (constraints?.enforceClassTeacherZeroPeriod && cls.classTeacherId && cls.classTeacherId !== newAssignment.teacherId) {
      const ct = state.teachers.find(t => t.id === cls.classTeacherId);
      return {
        isValid: false,
        type: 'error',
        message: `PERIOD 0 PROTOCOL: Must be conducted by the Class Teacher (${ct?.name}).`
      };
    }
  } else {
    // Rule: Administrative subjects are ONLY for Period 0
    if (subject?.category === 'Administrative') {
      return { 
        isValid: false, 
        type: 'error', 
        message: `ACADEMIC PROTOCOL: Attendance/Assembly sessions can only be scheduled in Period 0.` 
      };
    }
  }

  const teacherAssignmentsToday = assignments.filter(a => 
    a.teacherId === newAssignment.teacherId &&
    a.day === newAssignment.day &&
    a.id !== newAssignment.id
  );

  const classesTaughtToday = teacherAssignmentsToday.map(a => classes.find(c => c.id === a.classSectionId)).filter(Boolean);
  classesTaughtToday.push(cls);
  
  const teachesVX = classesTaughtToday.some(c => c?.group === 'VI-X');
  const teachesXIXII = classesTaughtToday.some(c => c?.group === 'XI-XII');
  const isMixed = teachesVX && teachesXIXII;

  // Max daily periods by group
  let isSaturday = newAssignment.day === 'Saturday' || newAssignment.day === 'Sat';
  if (!isMixed) {
    if (teachesVX) {
       const juniorLimit = isSaturday ? (constraints?.maxDailyPeriodsV_X_Sat || 8) : (constraints?.maxDailyPeriodsV_X || 8);
       if (teacherAssignmentsToday.length >= juniorLimit) {
         return { isValid: false, type: 'warning', message: `DAILY LOAD BREACH: Reached maximum ${juniorLimit} periods for Junior/Middle.` };
       }
    }
    if (teachesXIXII) {
       const seniorLimit = isSaturday ? (constraints?.maxDailyPeriodsXI_XII_Sat || 3) : (constraints?.maxDailyPeriodsXI_XII || 5);
       if (teacherAssignmentsToday.length >= seniorLimit) {
         return { isValid: false, type: 'warning', message: `DAILY LOAD BREACH: Reached maximum ${seniorLimit} periods for Senior.` };
       }
    }
  }

  // Calculate contiguous time and slots
  // First, map all assignments today to their slots to check contiguity
  // Since time slots can be from different groups, we need a unified timeline.
  const todayTimeline = teacherAssignmentsToday.map(a => {
    const aCls = classes.find(c => c.id === a.classSectionId);
    const aSlot = timeSlots[aCls!.group][timingMode].find(s => s.id === a.slotId);
    return { ...a, slot: aSlot! };
  });
  
  const newSlot = timeSlots[cls.group][timingMode].find(s => s.id === newAssignment.slotId);
  todayTimeline.push({ ...newAssignment, slot: newSlot! });
  todayTimeline.sort((a, b) => timeToMins(a.slot.startTime) - timeToMins(b.slot.startTime));

  let maxContiguousCount = 0;
  let currentContiguousCount = 1;
  let currentContiguousTime = timeToMins(todayTimeline[0].slot.endTime) - timeToMins(todayTimeline[0].slot.startTime);
  let maxContiguousTime = currentContiguousTime;

  for (let i = 1; i < todayTimeline.length; i++) {
    const prev = todayTimeline[i-1].slot;
    const curr = todayTimeline[i].slot;
    
    // Check gap
    const gap = timeToMins(curr.startTime) - timeToMins(prev.endTime);
    
    if (gap <= 10) { // If gap is tiny (like 0-10 mins), consider it contiguous
      currentContiguousCount++;
      currentContiguousTime += (timeToMins(curr.endTime) - timeToMins(curr.startTime)) + gap;
      
      if (currentContiguousCount > maxContiguousCount) maxContiguousCount = currentContiguousCount;
      if (currentContiguousTime > maxContiguousTime) maxContiguousTime = currentContiguousTime;
    } else {
      // Break in contiguity
      if (isMixed && currentContiguousTime > (constraints?.maxContiguousTimeMixed || 120)) {
         // Gap must be at least minGapAfterContiguousMixed (30 mins)
         if (gap < (constraints?.minGapAfterContiguousMixed || 30)) {
           return { isValid: false, type: 'warning', message: `MANDATORY GAP: After teaching 120+ mins mixed classes, a 30 min gap is mandatory.` };
         }
      }
      currentContiguousCount = 1;
      currentContiguousTime = timeToMins(curr.endTime) - timeToMins(curr.startTime);
    }
  }

  if (isMixed && maxContiguousTime > (constraints?.maxContiguousTimeMixed || 120)) {
    // If the latest addition caused it to exceed without a gap at the end
    return { isValid: false, type: 'warning', message: `CONTIGUOUS TIME BREACH: Mixed group teaching exceeds ${constraints?.maxContiguousTimeMixed || 120} contiguous minutes.` };
  } else if (!isMixed) {
    const limit = teachesVX ? (constraints?.maxContiguousV_X || 3) : (constraints?.maxContiguousXI_XII || 2);
    if (maxContiguousCount > limit) {
      return { isValid: false, type: 'warning', message: `FATIGUE WARNING: Max contiguous periods exceeded (${limit} allowed).` };
    }
  }

  // Daily max time limit for mixed
  const totalDailyTime = todayTimeline.reduce((acc, curr) => acc + (timeToMins(curr.slot.endTime) - timeToMins(curr.slot.startTime)), 0);
  if (isMixed && totalDailyTime > (constraints?.maxDailyTimeMixed || 240)) {
    return { isValid: false, type: 'warning', message: `DAILY TIME BREACH: Total daily teaching time exceeds ${constraints?.maxDailyTimeMixed || 240} mins.` };
  }

  // Weekly max limit for mixed
  if (isMixed) {
     const allTeacherAssignments = assignments.filter(a => a.teacherId === newAssignment.teacherId && a.id !== newAssignment.id);
     
     if (allTeacherAssignments.length >= (constraints?.maxWeeklyPeriodsMixed || 32)) {
         return { isValid: false, type: 'warning', message: `WEEKLY LOAD BREACH: Reached maximum weekly periods (${constraints?.maxWeeklyPeriodsMixed || 32}).` };
     }

     const totalWeeklyTime = allTeacherAssignments.reduce((acc, a) => {
         const aCls = classes.find(c => c.id === a.classSectionId);
         if (!aCls) return acc;
         const aSlot = timeSlots[aCls.group][timingMode].find(s => s.id === a.slotId);
         if (!aSlot) return acc;
         return acc + (timeToMins(aSlot.endTime) - timeToMins(aSlot.startTime));
     }, 0);

     const newSlotTime = timeToMins(newSlot!.endTime) - timeToMins(newSlot!.startTime);
     if (totalWeeklyTime + newSlotTime > (constraints?.maxWeeklyTimeMixed || 1280)) {
         return { isValid: false, type: 'warning', message: `WEEKLY TIME BREACH: Total weekly teaching time exceeds ${constraints?.maxWeeklyTimeMixed || 1280} mins.` };
     }
  }

  // 4. Class-Subject Limits (Daily and Weekly)
  const classSubjectLimit = state.classSubjectLimits?.find(
    l => l.subjectId === newAssignment.subjectId && (l.grade === cls.grade || l.grade === 'ALL')
  );
  
  const maxDailySubject = classSubjectLimit?.maxDaily ?? 2;
  const maxWeeklySubject = classSubjectLimit?.maxWeekly ?? 6;

  const subjectAssignmentsToday = assignments.filter(a =>
    a.classSectionId === newAssignment.classSectionId &&
    a.day === newAssignment.day &&
    a.subjectId === newAssignment.subjectId &&
    a.id !== newAssignment.id
  );

  if (subjectAssignmentsToday.length >= maxDailySubject) {
    const subjName = state.subjects.find(s => s.id === newAssignment.subjectId)?.name || 'Subject';
    return { isValid: false, type: 'warning', message: `CURRICULUM OVERFLOW: ${subjName} has reached its daily limit of ${maxDailySubject} periods for ${cls.grade}-${cls.section}.` };
  }

  const subjectAssignmentsWeekly = assignments.filter(a =>
    a.classSectionId === newAssignment.classSectionId &&
    a.subjectId === newAssignment.subjectId &&
    a.id !== newAssignment.id
  );

  if (subjectAssignmentsWeekly.length >= maxWeeklySubject) {
    const subjName = state.subjects.find(s => s.id === newAssignment.subjectId)?.name || 'Subject';
    return { isValid: false, type: 'warning', message: `WEEKLY CURRICULUM LIMIT: ${subjName} has reached its maximum weekly limit of ${maxWeeklySubject} periods for ${cls.grade}-${cls.section}.` };
  }

  // 5. Total Daily Periods for Class (Group-wise & Day-wise)
  let dayOfWeek = newAssignment.day;
  if(dayOfWeek.includes('-')) {
    const d = new Date(dayOfWeek);
    if (!isNaN(d.getTime())) dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  isSaturday = dayOfWeek === 'Saturday' || dayOfWeek === 'Sat';

  const classAssignmentsToday = assignments.filter(a =>
    a.classSectionId === newAssignment.classSectionId &&
    a.day === newAssignment.day &&
    a.id !== newAssignment.id
  );

  const maxClassDaily = cls.group === 'VI-X' 
    ? (isSaturday ? (state.constraints.maxDailyPeriodsV_X_Sat ?? 8) : (state.constraints.maxDailyPeriodsV_X ?? 8))
    : (isSaturday ? (state.constraints.maxDailyPeriodsXI_XII_Sat ?? 3) : (state.constraints.maxDailyPeriodsXI_XII ?? 5));
 
  if (classAssignmentsToday.length >= maxClassDaily) {
     return { isValid: false, type: 'warning', message: `DAILY LIMIT: ${cls.grade}-${cls.section} has reached its limit of ${maxClassDaily} periods for ${isSaturday ? 'Saturday' : 'today'}.` };
  }
 
  // 6. Saturday Specific Slot Hard-Limits
  if (isSaturday && cls.group === 'XI-XII') {
     const periodIndex = periodSlots.findIndex(s => s.id === newAssignment.slotId);
     if (periodIndex > 2) { // 3 periods = index 0, 1, 2
        return { isValid: false, type: 'error', message: `SATURDAY HALF-DAY: Senior classes (XI-XII) are limited to the first 3 periods only.` };
     }
     
     // CBSE Saturday Rule: Usually reserved for 6th/Additional subjects
     const subject = state.subjects.find(s => s.id === newAssignment.subjectId);
     if (subject && !subject.isAdditional) {
        return { isValid: false, type: 'warning', message: `SATURDAY CURRICULUM: Saturday for XI-XII is reserved for Additional/6th subjects only.` };
     }
  }

  return { isValid: true };
};
