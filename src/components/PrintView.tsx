import React, { useEffect, useMemo } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import type { PrintConfig } from './PrintOptionsModal';

interface PrintViewProps {
  config: PrintConfig;
  onClose: () => void;
}

export default function PrintView({ config, onClose }: PrintViewProps) {
  const { state } = useTimetable();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    // Small delay to ensure styles are applied before print dialog
    const timer = setTimeout(() => {
      // window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderDaily = () => {
    const day = config.day || 'Monday';
    const classes = state.classes.filter(c => config.group === 'all' || c.group === config.group);
    const groupKey = config.group === 'all' ? 'VI-X' : config.group;
    const slots = state.timeSlots[groupKey as keyof typeof state.timeSlots][state.timingMode] || [];
    const activeMerges = state.merges.filter(m => m.scope === 'Session');
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

    return (
      <div className="print-official space-y-6 p-4">
        <header className="text-center border-b-[3px] border-black pb-6 mb-6">
          <h1 className="text-3xl font-bold uppercase text-black leading-tight mb-1">{state.schoolSettings.organizationName}</h1>
          <p className="text-xs font-bold text-black uppercase tracking-[0.2em]">{state.schoolSettings.organizationTagline}</p>
          <div className="mt-4 inline-block border-2 border-black px-6 py-1 font-black text-sm uppercase tracking-widest">
            {day} MASTER TIMETABLE — SESSION {state.academicSession}
          </div>
          <p className="text-[0.5rem] font-bold text-zinc-500 mt-2 uppercase">Generated on: {timestamp}</p>
        </header>

        <div className="border-[2px] border-black overflow-hidden">
          <table className="w-full border-collapse border-black text-[0.65rem]">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border-r-2 border-black p-2 w-20 text-center font-black uppercase bg-zinc-50">CLASS</th>
                {slots.map(slot => (
                  <th key={slot.id} className={`border-r border-black p-1 text-center ${slot.isBreak ? 'bg-zinc-100 w-10' : ''}`}>
                    <div className="text-[0.5rem] font-black uppercase tracking-tighter">{slot.name}</div>
                    <div className="text-[0.45rem] font-bold opacity-60 italic">{slot.startTime}-{slot.endTime}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id} className="border-b border-black last:border-b-0">
                  <td className="border-r-2 border-black p-2 font-black text-center bg-zinc-50">{cls.grade}-{cls.section}</td>
                  {slots.map(slot => {
                    if (slot.isBreak) {
                      return <td key={slot.id} className="border-r border-black bg-zinc-50/50 text-center">
                        <div className="[writing-mode:vertical-lr] text-[0.5rem] font-black opacity-30 uppercase tracking-widest py-1 mx-auto">BREAK</div>
                      </td>;
                    }

                    const asgn = state.assignments.find(a => a.classSectionId === cls.id && a.day === day && a.slotId === slot.id);
                    const currentMerge = activeMerges.find(m => 
                      m.classSectionIds.includes(cls.id) && 
                      asgn && 
                      m.teacherId === asgn.teacherId && 
                      m.subjectId === asgn.subjectId
                    );

                    if (!asgn) return <td key={slot.id} className="border-r border-black"></td>;
                    
                    const teacher = state.teachers.find(t => t.id === asgn.teacherId);
                    const subject = state.subjects.find(s => s.id === asgn.subjectId);
                    const isZero = slot.id === 'p0';

                    return (
                      <td key={slot.id} className={`border-r border-black p-1 text-center ${currentMerge ? 'bg-zinc-50' : ''}`}>
                        <div className="flex flex-col items-center leading-tight">
                           <div className="font-bold text-[0.65rem] text-black uppercase">
                              {isZero ? 'ASM/ATTN' : subject?.name}
                           </div>
                           <div className="font-bold text-zinc-600 text-[0.55rem] italic mt-0.5">({teacher?.code})</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-16 grid grid-cols-3 gap-12 pt-12">
          {[
            state.schoolSettings.signatureLines.line1,
            state.schoolSettings.signatureLines.line2,
            state.schoolSettings.signatureLines.line3
          ].map((line, i) => (
            <div key={i} className="text-center">
              <div className="h-12 border-b border-black mb-2 opacity-10"></div>
              <div className="text-[0.6rem] font-black uppercase text-black tracking-widest pt-2">{line}</div>
            </div>
          ))}
        </footer>
      </div>
    );
  };

  const renderTeacherSlips = () => {
    const teachersToPrint = config.teacherId 
      ? state.teachers.filter(t => t.id === config.teacherId)
      : state.teachers;

    return (
      <div className="print-slips space-y-12">
        {teachersToPrint.map(teacher => (
          <div key={teacher.id} className="teacher-slip border-2 border-zinc-200 rounded-3xl p-6 bg-white break-inside-avoid shadow-sm mb-8">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-zinc-900">{teacher.name}</h3>
                <p className="text-[0.6rem] font-black text-indigo-600 uppercase tracking-widest">{teacher.designation || 'Faculty Member'} | {teacher.code}</p>
              </div>
              <div className="text-right">
                <span className="text-[0.5rem] font-black text-zinc-300 uppercase tracking-widest">Academic Session {state.academicSession}</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {days.map(day => {
                const dayAsgns = state.assignments.filter(a => a.teacherId === teacher.id && a.day === day).sort((a,b) => (parseInt(a.slotId.replace('p',''))||0) - (parseInt(b.slotId.replace('p',''))||0));
                return (
                  <div key={day} className="space-y-2">
                    <div className="text-[0.55rem] font-black text-zinc-400 uppercase text-center border-b border-zinc-50 pb-1">{day.slice(0, 3)}</div>
                    <div className="space-y-1 min-h-[150px]">
                      {dayAsgns.map(asgn => {
                        const cls = state.classes.find(c => c.id === asgn.classSectionId);
                        const subj = state.subjects.find(s => s.id === asgn.subjectId);
                        const isZero = asgn.slotId === 'p0';
                        return (
                          <div key={asgn.id} className={`p-1.5 rounded-lg border text-center ${isZero ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-zinc-50 border-zinc-100'}`}>
                             <div className="text-[0.45rem] font-black opacity-40">{asgn.slotId}</div>
                             <div className="text-[0.55rem] font-black truncate">{isZero ? 'ASM' : subj?.name}</div>
                             <div className="text-[0.5rem] font-bold text-zinc-400">{cls?.grade}-{cls?.section}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (config.type) {
      case 'daily': return renderDaily();
      case 'individual_teacher': return renderTeacherSlips();
      case 'master_class': return renderDaily(); // Simplified for now, can extend
      case 'master_teacher': return renderTeacherSlips(); // Simplified for now
      default: return renderDaily();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-auto p-8 sm:p-12 print:p-0 print:static">
      {/* Overlay Toolbar */}
      <div className="fixed top-6 right-6 flex gap-3 print:hidden">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-sm shadow-2xl hover:bg-zinc-800 transition-all"
        >
          <Printer size={18} /> Print Now
        </button>
        <button 
          onClick={onClose}
          className="p-3 bg-white border border-zinc-200 text-zinc-900 rounded-2xl shadow-xl hover:bg-zinc-50 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="max-w-[1000px] mx-auto print:max-w-none">
        {renderContent()}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: A4 ${config.type === 'daily' || config.type === 'master_class' ? 'landscape' : 'portrait'}; 
            margin: 10mm; 
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Inter', 'Times New Roman', serif;
          }
          .app-shell, .sidebar, .print-toolbar, .no-print { display: none !important; }
          .print-official { 
            width: 100%; 
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
          }
          .print-official * { visibility: visible !important; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}} />
    </div>
  );
}
