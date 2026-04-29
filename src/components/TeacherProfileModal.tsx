import React from 'react';
import { X, Calendar, ShieldCheck, Briefcase, Edit2, TrendingUp, Clock } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';

interface TeacherProfileModalProps {
  teacherId: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function TeacherProfileModal({ teacherId, onClose, onEdit }: TeacherProfileModalProps) {
  const { state } = useTimetable();
  const teacher = state.teachers.find(t => t.id === teacherId);

  if (!teacher) return null;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const teacherAssignments = state.assignments.filter(a => a.teacherId === teacherId);
  
  const weeklyLoad = teacherAssignments.length;
  const avgLoad = (weeklyLoad / days.length).toFixed(1);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container w-[95%] max-w-[800px] animate-fade shadow-2xl">
        
        {/* Header Section */}
        <div className="p-8 bg-zinc-950 text-white rounded-t-[2.5rem] relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-500/40">
                {teacher.code}
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-1">{teacher.name}</h2>
                <div className="flex gap-4 items-center">
                  <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{teacher.designation || 'Senior Faculty'}</span>
                  <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                  <span className="text-indigo-400 text-sm font-black uppercase tracking-widest">ID: {teacher.id.split('_').pop()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={onEdit}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white flex items-center gap-2 font-bold text-sm"
              >
                <Edit2 size={18} /> Edit Profile
              </button>
              <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-zinc-400">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <TrendingUp size={16} />
                <span className="text-[0.65rem] font-black uppercase tracking-widest">Weekly Load</span>
              </div>
              <div className="text-2xl font-black">{weeklyLoad} <span className="text-sm text-zinc-500 font-bold uppercase ml-1">Periods</span></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <Calendar size={16} />
                <span className="text-[0.65rem] font-black uppercase tracking-widest">Daily Avg</span>
              </div>
              <div className="text-2xl font-black">{avgLoad} <span className="text-sm text-zinc-500 font-bold uppercase ml-1">Periods</span></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <ShieldCheck size={16} />
                <span className="text-[0.65rem] font-black uppercase tracking-widest">Max Cap / Day</span>
              </div>
              <div className="text-2xl font-black">{teacher.maxLoadPerDay} <span className="text-sm text-zinc-500 font-bold uppercase ml-1">Periods</span></div>
            </div>
          </div>
        </div>

        <div className="modal-body p-8 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-thin">
          
          {/* Roles & Responsibilities Summary */}
          {( (teacher.inchargeRoles?.length || 0) > 0 || (teacher.responsibilities?.length || 0) > 0 ) && (
            <section className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} /> Professional Designations & Roles
              </h3>
              <div className="flex flex-wrap gap-2">
                {teacher.inchargeRoles?.map(role => {
                  const cls = state.classes.find(c => c.id === role.classId);
                  return (
                    <div key={role.classId} className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                      <ShieldCheck size={14} />
                      <span className="text-xs font-black uppercase tracking-tight">{cls?.grade}-{cls?.section}</span>
                      <span className="text-xs font-bold opacity-60">|</span>
                      <span className="text-xs font-black">{role.role}</span>
                    </div>
                  );
                })}
                {teacher.responsibilities?.map(resp => (
                  <div key={resp} className="flex items-center gap-3 px-4 py-2 bg-zinc-50 text-zinc-600 rounded-2xl border border-zinc-200">
                    <Briefcase size={14} />
                    <span className="text-xs font-black">{resp}</span>
                  </div>
                ))}
                {((teacher.inchargeRoles?.length || 0) + (teacher.responsibilities?.length || 0)) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[0.65rem] font-bold">
                    <ShieldCheck size={12} /> {(teacher.inchargeRoles?.length || 0) + (teacher.responsibilities?.length || 0)} Active Responsibilities
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Detailed Day-wise Workload */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Weekly Academic Distribution
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <span className="text-[0.6rem] font-bold text-zinc-400 uppercase">Administrative</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <span className="text-[0.6rem] font-bold text-zinc-400 uppercase">Academic</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {days.map(day => {
                const dayAssignments = teacherAssignments.filter(a => a.day === day).sort((a, b) => {
                  const pA = parseInt(a.slotId.replace('p', '')) || 0;
                  const pB = parseInt(b.slotId.replace('p', '')) || 0;
                  return pA - pB;
                });

                // Calculate dynamic limit for this day
                const classesTaughtToday = dayAssignments.map(a => state.classes.find(c => c.id === a.classSectionId)).filter(Boolean);
                const teachesVX = classesTaughtToday.some(c => c?.group === 'VI-X');
                const teachesXIXII = classesTaughtToday.some(c => c?.group === 'XI-XII');
                const isMixed = teachesVX && teachesXIXII;
                
                let effectiveLimit = teacher.maxLoadPerDay;
                if (!isMixed && dayAssignments.length > 0) {
                  if (teachesVX) effectiveLimit = day === 'Saturday' ? (state.constraints?.maxDailyPeriodsV_X_Sat || 8) : (state.constraints?.maxDailyPeriodsV_X || 8);
                  if (teachesXIXII) effectiveLimit = day === 'Saturday' ? (state.constraints?.maxDailyPeriodsXI_XII_Sat || 3) : (state.constraints?.maxDailyPeriodsXI_XII || 5);
                }

                const isFull = dayAssignments.length >= effectiveLimit;
                
                return (
                  <div key={day} className={`group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-[2rem] border transition-all ${isFull ? 'bg-rose-50/30 border-rose-100 shadow-sm shadow-rose-100' : 'bg-white border-zinc-100 hover:border-zinc-200'}`}>
                    <div className="w-32 flex flex-col">
                      <span className={`text-sm font-black tracking-tight ${isFull ? 'text-rose-600' : 'text-zinc-900'}`}>{day}</span>
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${isFull ? 'text-rose-400' : 'text-zinc-400'}`}>
                        {dayAssignments.length} / {effectiveLimit} Slots
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-wrap gap-2">
                      {dayAssignments.length > 0 ? dayAssignments.map(asgn => {
                        const cls = state.classes.find(c => c.id === asgn.classSectionId);
                        const subj = state.subjects.find(s => s.id === asgn.subjectId);
                        const isZero = asgn.slotId === 'p0';

                        return (
                          <div key={asgn.id} className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl shadow-sm transition-all cursor-default group/slot ${isZero ? 'border-amber-200 bg-amber-50/20' : 'border-zinc-200 hover:border-indigo-300'}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[0.6rem] font-black ${isZero ? 'bg-amber-100 text-amber-600' : 'bg-zinc-50 text-zinc-500 group-hover/slot:bg-indigo-50 group-hover/slot:text-indigo-600'}`}>
                               {asgn.slotId.replace('p', '')}
                            </div>
                            <div className="flex flex-col pr-1">
                               <span className={`text-[0.7rem] font-black ${isZero ? 'text-amber-700' : 'text-zinc-800'}`}>
                                 {isZero ? 'ASM / ATTN' : subj?.name}
                               </span>
                               <span className={`text-[0.6rem] font-bold uppercase tracking-tighter ${isZero ? 'text-amber-500/70' : 'text-zinc-400'}`}>{cls?.grade}-{cls?.section}</span>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-[0.65rem] font-bold text-zinc-300 italic py-2">No active teaching sessions assigned for this day.</div>
                      )}
                    </div>

                    <div className="hidden md:block">
                       <div className={`w-2.5 h-2.5 rounded-full ${isFull ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-500/20' : dayAssignments.length > 0 ? 'bg-emerald-500' : 'bg-zinc-200'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 rounded-b-[2.5rem] flex justify-center">
          <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Timetable Generation Engine — Optimized Profile View</p>
        </div>

      </div>
    </div>
  );
}
