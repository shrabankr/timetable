import React, { useState } from 'react';
import { useTimetable } from '../store/TimetableContext';
export default function FacultySidebar({ activeDay }: { activeDay: string }) {
  const { state } = useTimetable();
  const [searchTerm, setSearchTerm] = useState('');

  const enrichedTeachers = state.teachers.map(teacher => {
    const allAllocations = state.allocations.filter(a => a.teacherId === teacher.id);
    
    // Get unique classes they teach
    const classSections = allAllocations.map(a => {
      const cls = state.classes.find(c => c.id === a.classSectionId);
      return cls ? `${cls.grade}-${cls.section}` : '';
    });
    const uniqueClasses = Array.from(new Set(classSections)).filter(Boolean);

    // Get unique subjects they teach
    const subjects = allAllocations.map(a => {
      const sub = state.subjects.find(s => s.id === a.subjectId);
      return sub?.code || '';
    });
    const uniqueSubjects = Array.from(new Set(subjects)).filter(Boolean);

    const dailyWorkload = state.assignments.filter(a => a.teacherId === teacher.id && a.day === activeDay).length;

    return {
      ...teacher,
      uniqueClasses,
      uniqueSubjects,
      dailyWorkload
    };
  });

  const filteredTeachers = enrichedTeachers.filter(t => {
    const term = searchTerm.toLowerCase();
    return t.name.toLowerCase().includes(term) || 
           t.code.toLowerCase().includes(term) ||
           t.uniqueSubjects.some(sub => sub.toLowerCase().includes(term));
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, teacherId: string) => {
    e.dataTransfer.setData('teacherId', teacherId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-white">
       <div className="p-3 border-b border-zinc-100 bg-zinc-50/50">
          <input 
            type="text"
            className="w-full text-xs h-9 px-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400" 
            placeholder="Search Faculty, Subj..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
       </div>

       <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 scrollbar-thin">
         {filteredTeachers.map(teacher => {
            let statusColor = 'bg-emerald-500';
            let textColor = 'text-emerald-600';
            if (teacher.dailyWorkload > teacher.maxLoadPerDay) {
               statusColor = 'bg-rose-500';
               textColor = 'text-rose-600';
            } else if (teacher.dailyWorkload === teacher.maxLoadPerDay) {
               statusColor = 'bg-amber-500';
               textColor = 'text-amber-600';
            }

            const progressPercentage = Math.min((teacher.dailyWorkload / teacher.maxLoadPerDay) * 100, 100);

            return (
              <div 
                key={teacher.id} 
                className="group flex flex-col py-1.5 px-2 bg-white border border-zinc-200 rounded-xl cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all relative overflow-hidden"
                draggable
                onDragStart={(e) => handleDragStart(e, teacher.id)}
              >
                 <div className={`absolute top-0 left-0 w-[3px] h-full py-1.5`}>
                   <div className={`w-full h-full ${statusColor} rounded-r-lg`}></div>
                 </div>
                 <div className="flex items-start justify-between pl-[3px]">
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[0.6rem] font-bold text-indigo-700 bg-indigo-50/80 px-1 py-0.5 rounded uppercase tracking-wide border border-indigo-100 flex-shrink-0">
                          {teacher.code}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 truncate block" title={teacher.name}>{teacher.name}</span>
                      </div>
                      {teacher.incharge && (
                        <div className="text-[0.55rem] font-semibold text-amber-600 leading-none truncate">{teacher.incharge}</div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-400 flex items-center gap-0.5 flex-shrink-0 pt-0.5">
                      <span className={textColor}>{teacher.dailyWorkload}</span>/<span className="text-zinc-500">{teacher.maxLoadPerDay}</span>
                    </div>
                 </div>

                 <div className="pl-2 mt-1.5 flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1">
                       {teacher.uniqueSubjects.map(sub => (
                          <span key={sub} className="text-[0.55rem] font-bold text-zinc-600 bg-zinc-100 rounded border border-zinc-200 px-1">{sub}</span>
                       ))}
                    </div>
                    {teacher.uniqueClasses.length > 0 && (
                      <div className="text-[0.55rem] font-semibold text-zinc-500 truncate" title={teacher.uniqueClasses.join(', ')}>
                         <span className="text-zinc-400">Classes:</span> {teacher.uniqueClasses.join(', ')}
                      </div>
                    )}
                    
                    {/* Workload Progress Bar */}
                    <div className="w-full bg-zinc-100 h-[3px] mt-0.5 rounded-full overflow-hidden">
                       <div className={`h-full ${statusColor} transition-all duration-300`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                 </div>
              </div>
            );
         })}
       </div>
    </div>
  );
}
