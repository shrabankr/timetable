import React, { useMemo, useState, useEffect } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { Lock, Plus, X, GitMerge, Sparkles } from 'lucide-react';
import { useToast } from './Toast';
import type { ClassSection, TimeSlot } from '../types';

interface TimetableGridProps {
  activeDay: string;
}

export default function TimetableGrid({ activeDay }: TimetableGridProps) {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();

  const { normalizedDay, fullDate } = useMemo(() => {
    if (activeDay.includes('-')) {
      const date = new Date(activeDay);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return { 
        normalizedDay: days[date.getDay()],
        fullDate: activeDay 
      };
    }
    return { 
      normalizedDay: activeDay,
      fullDate: null 
    };
  }, [activeDay]);

  const activeMerges = useMemo(() => {
    if (!fullDate) {
      // For master session view, only show session-wide merges
      return state.merges.filter(m => m.scope === 'Session');
    }
    
    // For specific date view, filter by scope and date
    return state.merges.filter(m => {
      if (m.scope === 'Session') return true;
      if (m.scope === 'Today') return m.startDate === fullDate;
      if (m.scope === 'Range' && m.startDate && m.endDate) {
        return fullDate >= m.startDate && fullDate <= m.endDate;
      }
      return false;
    });
  }, [state.merges, fullDate]);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, classId: string, slotId: string } | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<{ classId: string, slotId: string }[]>([]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const getSuggestions = (classId: string, slotId: string) => {
    const isZeroPeriod = slotId === 'p0';
    const cls = state.classes.find(c => c.id === classId);

    const freeTeachers = state.teachers.filter(teacher => {
      // Period 0 Protocol: Only Class Teacher
      if (isZeroPeriod && state.constraints?.enforceClassTeacherZeroPeriod) {
         return teacher.id === cls?.classTeacherId;
      }

      const isBusy = state.assignments.some(a => a.teacherId === teacher.id && a.day === normalizedDay && a.slotId === slotId);
      if (isBusy) return false;
      const load = state.assignments.filter(a => a.teacherId === teacher.id && a.day === normalizedDay).length;
      if (load >= teacher.maxLoadPerDay) return false;
      return true;
    });

    const scored = freeTeachers.map(teacher => {
      let score = 0;
      const teachesClass = state.allocations.some(a => a.classSectionId === classId && a.teacherId === teacher.id);
      if (teachesClass) score += 10;
      
      const load = state.assignments.filter(a => a.teacherId === teacher.id && a.day === activeDay).length;
      score -= load;

      return { teacher, score, teachesClass, load };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  const toggleSlotSelection = (classId: string, slotId: string) => {
    const isSelected = selectedSlots.some(s => s.classId === classId && s.slotId === slotId);
    if (isSelected) {
      setSelectedSlots(prev => prev.filter(s => !(s.classId === classId && s.slotId === slotId)));
    } else {
      setSelectedSlots(prev => [...prev, { classId, slotId }]);
    }
  };

  const handleRotate = (direction: 'forward' | 'backward') => {
    if (selectedSlots.length < 2) return;
    const slotsToRotate = direction === 'forward' ? selectedSlots : [...selectedSlots].reverse();
    dispatch({ type: 'ROTATE_ASSIGNMENTS', payload: { slots: slotsToRotate, day: normalizedDay } });
    toast('success', 'Reordered', `Shifted ${selectedSlots.length} periods ${direction}.`);
  };

  const handleDrop = (e: React.DragEvent, classId: string, slotId: string) => {
    e.preventDefault();
    const isZeroPeriod = slotId === 'p0';
    const sourceAssignmentId = e.dataTransfer.getData('sourceAssignmentId');
    
    if (sourceAssignmentId) {
      dispatch({ type: 'SWAP_ASSIGNMENTS', payload: { sourceId: sourceAssignmentId, targetClassId: classId, targetSlotId: slotId, day: normalizedDay } });
      toast('success', 'Swapped', 'Periods exchanged successfully.');
      return;
    }

    const teacherId = e.dataTransfer.getData('teacherId');
    const teacher = state.teachers.find(t => t.id === teacherId);
    
    if (!teacher) return;

    // Validation: Is teacher already busy at this time on this day?
    const isBusy = state.assignments.some(
      a => a.teacherId === teacherId && a.day === normalizedDay && a.slotId === slotId
    );

    if (isBusy) {
      toast('error', 'Conflict Detected', `${teacher.name} is already assigned to another class at this time.`);
      return;
    }

    // Validation: Workload check
    const currentLoad = state.assignments.filter(a => a.teacherId === teacherId && a.day === normalizedDay).length;
    if (currentLoad >= teacher.maxLoadPerDay) {
      toast('warning', 'Limit Reached', `${teacher.name} has reached their maximum daily workload of ${teacher.maxLoadPerDay} periods.`);
      return;
    }

    // Success: Add assignment
    const adminSubject = state.subjects.find(s => s.category === 'Administrative');
    const defaultSubject = isZeroPeriod 
      ? (adminSubject?.id || '') 
      : (teacher.defaultSubjectId || state.subjects.find(s => s.category !== 'Administrative')?.id || '');

    dispatch({
      type: 'ADD_ASSIGNMENT',
      payload: {
        id: `asgn_${Date.now()}`,
        classSectionId: classId,
        teacherId,
        subjectId: defaultSubject,
        slotId,
        day: normalizedDay,
        isLocked: false
      }
    });
    toast('success', 'Assigned', `${teacher.name} assigned to ${normalizedDay} schedule.`);
  };

  const renderTableForGroup = (groupName: string, classes: ClassSection[]) => {
    const groupSlots = state.timeSlots[groupName as keyof typeof state.timeSlots];
    if (!groupSlots) return null;
    
    const slots = groupSlots[state.timingMode];
    if (!slots || slots.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <div className="flex items-center justify-between mb-3 px-1">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Grade Matrix: {groupName}</h3>
             <span className="text-[0.6rem] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full ml-1">{classes.length} classes</span>
           </div>
           <div className="flex items-center gap-2 text-[0.65rem] font-bold text-zinc-400 italic">
             <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
             Perpetual Routine: {state.sessionStartDate} to {state.sessionEndDate}
           </div>
        </div>
        
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full border-collapse bg-white" style={{ minWidth: (slots.length * 95) + 60 }}>
            <thead>
              <tr>
                <th className="w-[60px] px-1 py-2 text-center text-[0.55rem] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 sticky left-0 z-20 backdrop-blur-sm border-r border-slate-200">Grade</th>
                {slots.map(slot => (
                  <th key={slot.id} className="p-1 text-center border-b border-slate-200 min-w-[95px]">
                    <div className="text-[0.5rem] font-bold text-slate-300 uppercase tracking-tight leading-none mb-1">{slot.startTime}</div>
                    <div className="text-[0.65rem] font-black text-slate-800 leading-none">{slot.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-1 py-1.5 text-center font-bold text-[0.7rem] text-slate-900 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                    {cls.grade}-{cls.section}
                  </td>
                  {slots.map(slot => {
                    if (slot.isBreak) {
                      return (
                        <td key={slot.id} className="p-1 bg-slate-50/50 border-b border-slate-100 italic">
                           <div className="h-full flex items-center justify-center text-[0.55rem] font-bold text-slate-300 uppercase tracking-[0.2em] py-4">
                              Break
                           </div>
                        </td>
                      );
                    }

                    const assignment = state.assignments.find(
                      a => a.classSectionId === cls.id && a.slotId === slot.id && a.day === normalizedDay
                    );
                    const teacher = assignment ? state.teachers.find(t => t.id === assignment.teacherId) : null;
                    const subject = assignment ? state.subjects.find(s => s.id === assignment.subjectId) : null;

                    const currentMerge = activeMerges.find(m => {
                      const isClassInMerge = m.classSectionIds.includes(cls.id);
                      if (!isClassInMerge) return false;
                      
                      if (m.isWholeDay) return true; // Matches all slots for this class on this day
                      
                      return assignment && 
                             m.teacherId === assignment.teacherId && 
                             m.subjectId === assignment.subjectId;
                    });

                    return (
                      <td 
                        key={slot.id} 
                        onDrop={(e) => handleDrop(e, cls.id, slot.id)}
                        onDragOver={(e) => e.preventDefault()}
                        className="p-0.5 border-b border-slate-100 min-w-[95px]"
                      >
                        {(assignment && teacher) || (currentMerge && currentMerge.isWholeDay) ? (
                           <div 
                             draggable={assignment ? !assignment.isLocked : false}
                             onDragStart={(e) => {
                               if (assignment && !assignment.isLocked) {
                                 e.dataTransfer.setData('sourceAssignmentId', assignment.id);
                               }
                             }}
                              className={`group/card relative p-1.5 rounded-lg border transition-all duration-300 ${
                                selectedSlots.some(s => s.classId === cls.id && s.slotId === slot.id)
                                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50 shadow-indigo-100 shadow-md'
                                  : currentMerge
                                    ? currentMerge.isWholeDay ? 'border-amber-200 bg-amber-50/50 shadow-sm' : 'border-emerald-200 bg-emerald-50/30'
                                    : assignment?.isLocked 
                                      ? 'border-rose-200 bg-rose-50/50 grayscale-[0.1]' 
                                      : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing shadow-sm'
                              }`}
                              onClick={(e) => {
                                if (e.altKey || e.shiftKey) {
                                  e.stopPropagation();
                                  toggleSlotSelection(cls.id, slot.id);
                                }
                              }}
                             onDoubleClick={() => {
                               if (assignment && !assignment.isLocked) {
                                 dispatch({ type: 'REMOVE_ASSIGNMENT', payload: assignment.id });
                                 toast('info', 'Removed', `${teacher?.name} removed from ${cls.grade}-${cls.section}.`);
                               }
                             }}
                             onContextMenu={(e) => {
                               e.preventDefault();
                               if (assignment) {
                                 dispatch({ type: 'TOGGLE_LOCK', payload: assignment.id });
                                 toast('info', 'Lock Toggled', `Period is now ${!assignment.isLocked ? 'locked' : 'unlocked'}.`);
                               }
                             }}
                             title={currentMerge ? `Merged Period (Scope: ${currentMerge.scope})` : assignment?.isLocked ? 'Locked (Right-click to unlock)' : 'Double-click to remove. Right-click to lock. Drag to swap. Alt+Click to select.'}
                           >
                              <div className="flex justify-between items-start mb-0.5 gap-1">
                                 <div className="flex items-center gap-1 min-w-0">
                                   {currentMerge?.isWholeDay ? (
                                     <Sparkles size={8} className="text-amber-500 flex-shrink-0" />
                                   ) : currentMerge && (
                                     <GitMerge size={8} className="text-emerald-500 flex-shrink-0" />
                                   )}
                                   <span className="text-[0.6rem] font-black text-slate-900 truncate leading-tight tracking-tight">
                                     {teacher?.name || (currentMerge && state.teachers.find(t => t.id === currentMerge.teacherId)?.name) || 'Event Staff'}
                                   </span>
                                 </div>
                                 <button 
                                   onClick={(e) => { 
                                     if (!assignment) return;
                                     e.stopPropagation(); 
                                     dispatch({ type: 'TOGGLE_LOCK', payload: assignment.id }); 
                                     toast('info', 'Lock Toggled', `Period is now ${!assignment.isLocked ? 'locked' : 'unlocked'}.`); 
                                   }}
                                   className="focus:outline-none flex-shrink-0"
                                   title="Toggle Lock"
                                 >
                                   {assignment?.isLocked ? (
                                      <Lock size={10} className="text-rose-500" />
                                   ) : (
                                      <Lock size={10} className="text-slate-300 opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-indigo-500" />
                                   )}
                                 </button>
                              </div>
                               <div className="flex justify-between items-end gap-1">
                                  {slot.id === 'p0' && !currentMerge?.isWholeDay ? (
                                    <span className="text-[0.45rem] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50 uppercase tracking-tighter">ASM / ATTN</span>
                                  ) : (
                                    <span className={`text-[0.5rem] font-bold px-1 py-0.5 rounded leading-none truncate ${currentMerge?.isWholeDay ? 'text-amber-600 bg-amber-100/50' : 'text-indigo-600 bg-indigo-50'}`}>
                                      {subject?.name || (currentMerge && state.subjects.find(s => s.id === currentMerge.subjectId)?.name) || 'Special Event'}
                                    </span>
                                  )}
                                  <span className="text-[0.5rem] font-black text-slate-300 uppercase">
                                    {teacher?.code || (currentMerge && state.teachers.find(t => t.id === currentMerge.teacherId)?.code)}
                                  </span>
                               </div>
                           </div>
                        ) : (
                          <div 
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({ x: e.clientX, y: e.clientY, classId: cls.id, slotId: slot.id });
                            }}
                            title="Right-click for substitution suggestions"
                             className={`h-full min-h-[42px] border-[1.5px] border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                               selectedSlots.some(s => s.classId === cls.id && s.slotId === slot.id)
                                 ? 'border-indigo-600 bg-indigo-50'
                                 : 'border-slate-100 bg-slate-50/30 group-hover:border-slate-200'
                             }`}
                             onClick={(e) => {
                               if (e.altKey || e.shiftKey) {
                                 e.stopPropagation();
                                 toggleSlotSelection(cls.id, slot.id);
                               }
                             }}
                           >
                              {slot.id === 'p0' ? (
                                <span className="text-[0.45rem] font-black text-slate-300 uppercase tracking-tighter">ASM</span>
                              ) : (
                                <Plus size={10} className={selectedSlots.some(s => s.classId === cls.id && s.slotId === slot.id) ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-300'} />
                              )}
                           </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade">
      {renderTableForGroup('VI-X', state.classes.filter(c => c.group === 'VI-X'))}
      {renderTableForGroup('XI-XII', state.classes.filter(c => c.group === 'XI-XII'))}

      {selectedSlots.length > 1 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-bottom-4 duration-300">
           <div className="bg-zinc-900 text-white rounded-2xl shadow-2xl shadow-zinc-900/40 p-2 flex items-center gap-2 border border-white/10 backdrop-blur-md">
              <div className="px-4 border-r border-white/10">
                 <span className="text-[0.6rem] font-black uppercase tracking-widest text-zinc-400 block">Selection</span>
                 <span className="text-xs font-black">{selectedSlots.length} Slots</span>
              </div>
              
              <button 
                onClick={() => handleRotate('forward')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all group"
              >
                <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2-7.61 7.61"/><path d="m18.5 8 1.5-1.5"/><path d="M4.41 4.41 2 6.82"/><path d="M9 9 11 11"/><path d="M19.1 19.1 21 21"/><path d="M22 14v-2"/><path d="M14 22v-2"/><path d="M2 14v-2"/><path d="M14 2v2"/><path d="M21.42 16.58 19.42 18.58"/><path d="M16.58 21.42 18.58 19.42"/><path d="M7.42 21.42 5.42 19.42"/><path d="M4.58 19.42 2.58 21.42"/><path d="M2.58 4.58 4.58 6.58"/><path d="M7.42 2.58 5.42 4.58"/><path d="M16.58 2.58 18.58 4.58"/><path d="M21.42 4.58 19.42 6.58"/></svg>
                </div>
                <span className="text-[0.65rem] font-black uppercase tracking-widest">Shift Right (Rotate)</span>
              </button>

              <button 
                onClick={() => handleRotate('backward')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all group"
              >
                <div className="w-6 h-6 bg-zinc-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><path d="m21 2-2 2-7.61 7.61"/><path d="m18.5 8 1.5-1.5"/><path d="M4.41 4.41 2 6.82"/><path d="M9 9 11 11"/><path d="M19.1 19.1 21 21"/><path d="M22 14v-2"/><path d="M14 22v-2"/><path d="M2 14v-2"/><path d="M14 2v2"/><path d="M21.42 16.58 19.42 18.58"/><path d="M16.58 21.42 18.58 19.42"/><path d="M7.42 21.42 5.42 19.42"/><path d="M4.58 19.42 2.58 21.42"/><path d="M2.58 4.58 4.58 6.58"/><path d="M7.42 2.58 5.42 4.58"/><path d="M16.58 2.58 18.58 4.58"/><path d="M21.42 4.58 19.42 6.58"/></svg>
                </div>
                <span className="text-[0.65rem] font-black uppercase tracking-widest">Shift Left</span>
              </button>

              <button 
                onClick={() => setSelectedSlots([])}
                className="p-2 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-500 rounded-xl transition-all ml-2"
                title="Clear Selection"
              >
                <X size={18} />
              </button>
           </div>
        </div>
      )}

      {contextMenu && (
        <div 
          className="fixed z-[9999] bg-white border border-slate-200 shadow-xl rounded-xl w-64 overflow-hidden animate-fade"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 300), left: Math.min(contextMenu.x, window.innerWidth - 260) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
            <span className="text-[0.65rem] font-black text-slate-700 uppercase tracking-wider">Smart Suggestions</span>
            <span className="text-[0.55rem] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Free Teachers</span>
          </div>
          <div className="p-1 max-h-64 overflow-y-auto scrollbar-thin">
            {getSuggestions(contextMenu.classId, contextMenu.slotId).map(({ teacher, teachesClass, load }) => (
              <button
                key={teacher.id}
                className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex justify-between items-center transition-colors group mb-0.5"
                onClick={() => {
                  const isZeroPeriod = contextMenu.slotId === 'p0';
                  const adminSubject = state.subjects.find(s => s.category === 'Administrative');
                  const academicSubject = state.subjects.find(s => s.category === 'Academic');
                  const finalSubject = isZeroPeriod ? (adminSubject?.id || '') : (teacher.defaultSubjectId || academicSubject?.id || state.subjects[0]?.id);

                  dispatch({
                    type: 'ADD_ASSIGNMENT',
                    payload: {
                      id: `asgn_${Date.now()}`,
                      classSectionId: contextMenu.classId,
                      teacherId: teacher.id,
                      subjectId: finalSubject,
                      slotId: contextMenu.slotId,
                      day: normalizedDay,
                      isLocked: false
                    }
                  });
                  toast('success', 'Assigned', isZeroPeriod ? 'Attendance session assigned.' : `${teacher.name} assigned as substitute.`);
                  setContextMenu(null);
                }}
              >
                <div>
                  <div className="text-[0.7rem] font-bold text-slate-800">{teacher.name}</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">
                    {teachesClass ? <span className="text-emerald-500 font-bold mr-1">• Teaches this class</span> : null}
                    Load today: {load}/{teacher.maxLoadPerDay}
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[0.6rem] font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <Plus size={10} />
                </div>
              </button>
            ))}
            {getSuggestions(contextMenu.classId, contextMenu.slotId).length === 0 && (
              <div className="p-4 text-center text-[0.65rem] text-slate-400 font-medium italic">
                No free teachers available for this slot.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
