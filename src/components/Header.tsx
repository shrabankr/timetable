import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Trash2, 
  Save, 
  Printer, 
  Calendar,
  RotateCcw,
  RotateCw,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Image,
  Code,
  MessageCircle,
  Mail
} from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import { useToast } from './Toast';
import * as XLSX from 'xlsx';

interface HeaderProps {
  activeDay: string;
  setActiveDay: (day: string) => void;
  days: string[];
}

export default function Header({ activeDay, setActiveDay, days }: HeaderProps) {
  const { state, dispatch, canUndo, canRedo } = useTimetable();
  const { toast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Dropdown States
  const [showGenerateDrop, setShowGenerateDrop] = useState(false);
  const [showSaveDrop, setShowSaveDrop] = useState(false);

  // Close dropdowns on outside click
  const generateRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (generateRef.current && !generateRef.current.contains(event.target as Node)) {
        setShowGenerateDrop(false);
      }
      if (saveRef.current && !saveRef.current.contains(event.target as Node)) {
        setShowSaveDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) dispatch({ type: 'UNDO' });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) dispatch({ type: 'REDO' });
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, dispatch]);

  const exportAsExcel = () => {
    const { assignments, classes, teachers, subjects } = state;
    const excelData = [
      ["Official Timetable", "", "", "", ""],
      ["Session", state.academicSession, "Day", activeDay, ""],
      [],
      ["Class", "Slot", "Subject", "Teacher Code", "Teacher Name"]
    ];

    assignments.filter(a => a.day === activeDay).forEach(a => {
      const cls = classes.find(c => c.id === a.classSectionId);
      const tchr = teachers.find(t => t.id === a.teacherId);
      const subj = subjects.find(s => s.id === a.subjectId);
      excelData.push([
        cls ? `${cls.grade}-${cls.section}` : '-',
        a.slotId,
        subj?.name || '-',
        tchr?.code || '-',
        tchr?.name || '-'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `Timetable_${activeDay}.xlsx`);
    toast('success', 'Excel Exported', `Timetable for ${activeDay} saved as .xlsx`);
  };

  const handleUnsupportedExport = (format: string) => {
    toast('info', `${format} Export`, 'This export format is under development and will be available soon.');
  };

  const normalizedDay = useMemo(() => {
    if (activeDay.includes('-')) {
      const date = new Date(activeDay);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNames[date.getDay()];
    }
    return activeDay;
  }, [activeDay]);

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center gap-2 w-full flex-nowrap">
        {/* Left: Days and Date Select */}
        <div className="flex items-center gap-1.5 xl:gap-3 flex-shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            {days.map(day => (
              <button 
                key={day}
                id={`day-${day.toLowerCase()}`}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  normalizedDay === day 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveDay(day)}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
          
          <div className="relative flex items-center group bg-white border border-slate-200 rounded-lg overflow-hidden group-focus-within:border-indigo-500 transition-colors">
             <Calendar size={14} className="absolute left-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
             <input 
                type="date" 
                className="h-9 pl-9 pr-3 bg-transparent text-xs font-bold outline-none text-slate-700 w-32"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;

                  const selDate = new Date(val);
                  const startDate = new Date(state.sessionStartDate);
                  const endDate = new Date(state.sessionEndDate);

                  if (selDate < startDate || selDate > endDate) {
                    toast('error', 'Out of Session', `The selected date falls outside the ${state.academicSession} academic session range (${state.sessionStartDate} to ${state.sessionEndDate}).`);
                  } else {
                    setActiveDay(val);
                  }
                }}
             />
          </div>
        </div>

        {/* Right: Core actions */}
        <div className="flex flex-nowrap justify-end items-center gap-1.5 xl:gap-2.5 z-50 flex-shrink-0">
          
          {/* Undo / Redo — now functional */}
          <div className="flex bg-zinc-100/50 rounded-lg overflow-hidden border border-zinc-200/60 shadow-inner">
             <button 
               id="btn-undo"
               className={`h-9 w-10 flex items-center justify-center bg-white hover:bg-zinc-50 transition-colors active:bg-zinc-100 ${canUndo ? 'text-zinc-600' : 'text-zinc-300 cursor-not-allowed'}`}
               title="Undo (Ctrl+Z)"
               onClick={() => canUndo && dispatch({ type: 'UNDO' })}
               disabled={!canUndo}
             >
                <RotateCcw size={14} />
             </button>
             <div className="w-px h-9 bg-zinc-200"></div>
             <button 
               id="btn-redo"
               className={`h-9 w-10 flex items-center justify-center bg-white hover:bg-zinc-50 transition-colors active:bg-zinc-100 ${canRedo ? 'text-zinc-600' : 'text-zinc-300 cursor-not-allowed'}`}
               title="Redo (Ctrl+Y)"
               onClick={() => canRedo && dispatch({ type: 'REDO' })}
               disabled={!canRedo}
             >
                <RotateCw size={14} />
             </button>
          </div>

          <div className="w-px h-5 bg-zinc-200 mx-1 hidden sm:block"></div>

          {/* Generate Dropdown */}
          <div className="relative" ref={generateRef}>
            <button 
              id="btn-generate"
              className="group h-9 px-2.5 hover:px-3 flex items-center bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 shadow-[0_2px_8px_rgba(24,24,27,0.25)] transition-all duration-300 active:scale-95 whitespace-nowrap overflow-hidden" 
              onClick={() => setShowGenerateDrop(!showGenerateDrop)}
              title="Generate Engine"
            >
              <Zap size={13} className="text-zinc-300 flex-shrink-0" /> 
              <div className="flex items-center max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out">
                <span>Generate Engine</span>
                <ChevronDown size={13} className="ml-0.5 opacity-60" />
              </div>
            </button>
            
            {showGenerateDrop && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-zinc-200 shadow-xl rounded-2xl overflow-hidden z-[999] animate-fade p-1.5">
                 <button 
                   id="gen-today"
                   className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center justify-between transition-colors mb-1" 
                   onClick={() => { 
                     dispatch({ type: 'AUTO_GENERATE', payload: activeDay }); 
                     setShowGenerateDrop(false); 
                     toast('success', 'Generated', `Timetable generated for ${activeDay}.`);
                   }}
                 >
                   Generate for Today <Zap size={12} className="text-zinc-400" />
                 </button>
                 <button 
                   id="gen-all"
                   className="w-full text-left px-3 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center justify-between transition-colors" 
                   onClick={() => { 
                     dispatch({ type: 'AUTO_GENERATE' }); 
                     setShowGenerateDrop(false); 
                     toast('success', 'Full Generate', 'Timetable generated for all days.');
                   }}
                 >
                   Generate All Days <Zap size={12} className="text-indigo-500" />
                 </button>
              </div>
            )}
          </div>

          {/* Save Dropdown */}
          <div className="relative" ref={saveRef}>
            <button 
              id="btn-export"
              className="group h-9 px-2.5 hover:px-3 flex items-center bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-50 shadow-sm transition-all duration-300 whitespace-nowrap overflow-hidden" 
              onClick={() => setShowSaveDrop(!showSaveDrop)}
              title="Save/Export"
            >
              <Save size={13} className="text-zinc-400 flex-shrink-0" /> 
              <div className="flex items-center max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out">
                <span>Save/Export</span>
                <ChevronDown size={13} className="ml-0.5 opacity-40" />
              </div>
            </button>

            {showSaveDrop && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 shadow-xl rounded-2xl overflow-hidden z-[999] animate-fade p-1.5">
                 <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 mb-0.5" onClick={() => { handleUnsupportedExport('PDF'); setShowSaveDrop(false); }}>
                   <div className="p-1 rounded bg-rose-50"><FileText size={12} className="text-rose-500" /></div> Portable PDF
                 </button>
                 <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 mb-0.5" onClick={() => { exportAsExcel(); setShowSaveDrop(false); }}>
                   <div className="p-1 rounded bg-emerald-100/50"><FileSpreadsheet size={12} className="text-emerald-600" /></div> Excel Matrix
                 </button>
                 <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 mb-0.5" onClick={() => { handleUnsupportedExport('JPG'); setShowSaveDrop(false); }}>
                   <div className="p-1 rounded bg-amber-50"><Image size={12} className="text-amber-500" /></div> JPG Graphic
                 </button>
                 <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 mb-0.5" onClick={() => { handleUnsupportedExport('PNG'); setShowSaveDrop(false); }}>
                   <div className="p-1 rounded bg-indigo-50"><Image size={12} className="text-indigo-500" /></div> PNG Graphic
                 </button>
                 <div className="w-full h-px bg-zinc-100 my-1"></div>
                 <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 mb-0.5" onClick={() => { handleUnsupportedExport('WhatsApp'); setShowSaveDrop(false); }}>
                   <div className="p-1 rounded bg-emerald-50"><MessageCircle size={12} className="text-emerald-500" /></div> Share via WhatsApp
                 </button>
                 <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2 mb-0.5" onClick={() => { handleUnsupportedExport('Email'); setShowSaveDrop(false); }}>
                   <div className="p-1 rounded bg-blue-50"><Mail size={12} className="text-blue-500" /></div> Share via Email
                 </button>
                 <div className="w-full h-px bg-zinc-100 my-1"></div>
                 <button className="w-full text-left px-3 py-2 text-[0.65rem] font-bold text-zinc-500 hover:bg-zinc-50 rounded-lg flex items-center gap-2" onClick={() => { handleUnsupportedExport('JSON'); setShowSaveDrop(false); }}>
                   <Code size={11} className="text-zinc-400" /> Internal Code JSON
                 </button>
              </div>
            )}
          </div>
          
          <div className="w-px h-5 bg-zinc-200 mx-1 hidden sm:block"></div>

          {/* Quick Primary Actions */}
          <button id="btn-print" className="h-9 px-3 flex items-center justify-center bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600 transition-colors text-xs font-bold shadow-sm flex-shrink-0" onClick={() => window.print()} title="Print">
             <Printer size={14} className="text-zinc-400" />
          </button>
          
          <button 
            id="btn-clear" 
            className="group h-9 px-2.5 hover:px-3 flex items-center bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg transition-all duration-300 text-xs font-bold shadow-sm active:scale-95 flex-shrink-0 whitespace-nowrap overflow-hidden" 
            onClick={() => setShowClearConfirm(true)}
            title="Clear Today"
          >
             <Trash2 size={13} className="text-rose-500 flex-shrink-0" /> 
             <div className="flex items-center max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out">
                <span>Clear</span>
             </div>
          </button>
        </div>
      </div>
      
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-container max-w-sm w-full p-8 animate-fade">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 mx-auto">
               <Trash2 size={24} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 text-center mb-2">Clear {activeDay}?</h2>
            <p className="text-sm text-zinc-500 text-center mb-8">This will wipe all allocations for <strong className="text-zinc-700">{activeDay}</strong> allowing you to reset for unavailable teachers. Locked sessions strictly remain unaffected.</p>
            <div className="flex gap-3">
              <button className="flex-1 h-12 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="flex-1 h-12 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.25)] transition-all active:scale-95" onClick={() => { 
                dispatch({ type: 'CLEAR_TODAY', payload: activeDay }); 
                setShowClearConfirm(false); 
                toast('warning', 'Day Cleared', `All unlocked assignments for ${activeDay} have been removed.`);
              }}>Reset Today</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
