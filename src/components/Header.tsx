import React, { useState, useRef } from 'react';
import { LayoutGrid, Zap, Image as ImageIcon, FileText, Table, MessageCircle, Mail, Trash2, Save, Check, Settings, Users, Printer, UploadCloud, DownloadCloud } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import type { TimingMode } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import TimingSettingsModal from './TimingSettingsModal';
import ClassManagerModal from './ClassManagerModal';

interface HeaderProps {
  activeDay: string;
  setActiveDay: (day: string) => void;
  days: string[];
}

export default function Header({ activeDay, setActiveDay, days }: HeaderProps) {
  const { state, dispatch } = useTimetable();

  const handleTimingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_TIMING_MODE', payload: e.target.value as TimingMode });
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showClassManager, setShowClassManager] = useState(false);

  const dbInputRef = useRef<HTMLInputElement>(null);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const validateAndExecute = (actionCallback: () => void) => {
    const errors: string[] = [];
    const todayAssignments = state.assignments.filter(a => a.day === activeDay);

    // 1. Missing teachers for any class section
    let missingClasses = 0;
    state.classes.forEach(cls => {
      const slots = state.timeSlots[cls.group][state.timingMode].filter(s => !s.isBreak);
      slots.forEach(slot => {
         const hasAsgn = todayAssignments.find(a => a.classSectionId === cls.id && a.slotId === slot.id);
         if (!hasAsgn) missingClasses++;
      });
    });
    
    if (missingClasses > 0) {
      errors.push(`${missingClasses} class periods are empty (no teacher assigned).`);
    }

    // 2. Overloaded & 3. Free Periods
    let overloaded = 0;
    let missingFreeTime = 0;
    
    state.teachers.forEach(teacher => {
       const load = todayAssignments.filter(a => a.teacherId === teacher.id).length;
       if (load > teacher.maxLoadPerDay) overloaded++;
       // Ensure at least 1-2 free periods -> 8 slots total, so load shouldn't exceed 6 or 7.
       if (load >= 7) missingFreeTime++; 
    });

    if (overloaded > 0) errors.push(`${overloaded} teachers are assigned beyond their max capacity.`);
    if (missingFreeTime > 0) errors.push(`${missingFreeTime} teachers do not have at least 1-2 free periods.`);

    if (errors.length > 0) {
      setValidationErrors(errors);
      setPendingAction(() => actionCallback);
    } else {
      actionCallback();
    }
  };

  const handleManualSave = () => {
     localStorage.setItem(`timetable_state_${state.academicSession}`, JSON.stringify(state));
     localStorage.setItem('timetable_last_session', state.academicSession);
     setShowSaved(true);
     setTimeout(() => setShowSaved(false), 2000);
  };

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     dispatch({ type: 'SET_ACADEMIC_SESSION', payload: e.target.value });
  };

  const handleAutoGen = () => {
    dispatch({ type: 'AUTO_GENERATE' });
  };

  const handleClearToday = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    dispatch({ type: 'CLEAR_TODAY', payload: activeDay });
    setShowClearConfirm(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setActiveDay(e.target.value);
    }
  };

  const getPrintFileName = () => {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    return `HPS_${activeDay}_${dateStr}`;
  };

  const exportAsImage = async () => {
    try {
      const el = document.getElementById('export-container') as HTMLElement;
      if (!el) return;
      const originalOverflow = el.style.overflow;
      el.style.overflow = 'visible';
      
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      el.style.overflow = originalOverflow;
      
      const link = document.createElement('a');
      link.download = `${getPrintFileName()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Error exporting Image: " + e);
    }
  };

  const exportAsPDF = async () => {
    try {
      const el = document.getElementById('export-container') as HTMLElement;
      if (!el) return;
      const originalOverflow = el.style.overflow;
      el.style.overflow = 'visible';
      
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      el.style.overflow = originalOverflow;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getPrintFileName()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert("Error exporting PDF: " + e);
    }
  };

  const exportAsExcel = () => {
    try {
      const { assignments, classes, teachers, subjects } = state;
      const excelData: any[] = [];
      
      excelData.push(["HERITAGE PUBLIC SCHOOL", "", "", "", "Daily Routine Timetable"]);
      excelData.push(["Excellence in Global Education", "", "", "", `Date/Day: ${activeDay}`]);
      excelData.push([]);
      excelData.push(["Day", "Slot", "Class", "Teacher Code", "Teacher Name", "Subject"]);

      assignments.forEach(a => {
          const cls = classes.find(c => c.id === a.classSectionId);
          const tchr = teachers.find(t => t.id === a.teacherId);
          const subj = subjects.find(s => s.id === a.subjectId);
          
          excelData.push([
              a.day,
              a.slotId,
              cls ? `${cls.grade}-${cls.section}` : 'Unknown',
              tchr?.code || '',
              tchr?.name || '',
              subj?.name || ''
          ]);
      });

      excelData.push([]);
      excelData.push([]);
      excelData.push(["Timetable Incharge 1", "Timetable Incharge 2", "", "Vice Principal", "", "Principal"]);

      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Auto-size columns crudely
      const wscols = [
          {wch: 15}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 20}
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Timetable");
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getPrintFileName()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert("Error exporting Excel: " + e);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out our school routine timetable for ${activeDay} - ${new Date().toLocaleDateString()}!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };
  
  const shareEmail = () => {
    const subject = encodeURIComponent(`HPS Timetable: ${activeDay}`);
    const body = encodeURIComponent(`Please find the updated school timetable attached or at our portal for ${activeDay}, ${new Date().toLocaleDateString()}.\n\n`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const exportDB = () => {
    const data = {
      teachers: state.teachers,
      subjects: state.subjects,
      classes: state.classes,
      allocations: state.allocations
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TT_Database_Backup_${Date.now()}.json`;
    link.click();
  };

  const importDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.teachers) dispatch({ type: 'SET_TEACHERS', payload: data.teachers });
        if (data.subjects) dispatch({ type: 'SET_SUBJECTS', payload: data.subjects });
        if (data.classes) dispatch({ type: 'SET_CLASSES', payload: data.classes });
        if (data.allocations) dispatch({ type: 'SET_ALLOCATIONS', payload: data.allocations });
        alert("Database Matrix restored successfully!");
      } catch (err) {
        alert("Invalid JSON Database file!");
      }
    };
    reader.readAsText(file);
    if(dbInputRef.current) dbInputRef.current.value = '';
  };

  return (
    <div className="header">
      <div className="header-top">
        <h1>
          <LayoutGrid className="text-primary-color" size={24} />
          Dynamic Timetable
        </h1>
        
        <div className="header-actions">
          <select 
            className="select-input" 
            value={state.academicSession} 
            onChange={handleSessionChange}
            style={{ fontWeight: 600, background: '#f8fafc', border: '1px solid var(--border)' }}
            title="Academic Session"
          >
            <option value="2023-2024">Session: 2023-24</option>
            <option value="2024-2025">Session: 2024-25</option>
            <option value="2025-2026">Session: 2025-26</option>
          </select>
          
          <select 
            className="select-input" 
            value={state.timingMode} 
            onChange={handleTimingChange}
            style={{ fontWeight: 500 }}
          >
            <option value="Official">Official Timing</option>
            <option value="Summer">Summer Timing</option>
            <option value="Winter">Winter Timing</option>
          </select>
          
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="Timing Settings" style={{ border: '1px solid var(--border)', background: 'white' }}>
            <Settings size={18} />
          </button>

          <button className="icon-btn" onClick={() => setShowClassManager(true)} title="Manage Classes" style={{ border: '1px solid var(--border)', background: 'white' }}>
            <Users size={18} />
          </button>

          <div style={{ display: 'flex', border: '1px solid var(--border)', background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
            <button className="icon-btn" onClick={exportDB} title="Export Core DB (JSON)">
               <DownloadCloud size={16} />
            </button>
            <button className="icon-btn" onClick={() => dbInputRef.current?.click()} title="Import Core DB (JSON)">
               <UploadCloud size={16} />
            </button>
            <input type="file" accept=".json" style={{ display: 'none' }} ref={dbInputRef} onChange={importDB} />
          </div>
          
          <div className="header-downloads" style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button className="icon-btn" onClick={() => validateAndExecute(exportAsImage)} title="Download PNG" style={{ border: 'none', background: 'white', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}>
              <ImageIcon size={16} color="#8b5cf6" /> <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>PNG</span>
            </button>
            <button className="icon-btn" onClick={() => validateAndExecute(exportAsPDF)} title="Download PDF" style={{ border: 'none', background: 'white', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}>
              <FileText size={16} color="#ef4444" /> <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>PDF</span>
            </button>
            <button className="icon-btn" onClick={() => validateAndExecute(exportAsExcel)} title="Download Excel" style={{ border: 'none', background: 'white', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}>
              <Table size={16} color="#10b981" /> <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>Excel</span>
            </button>
          </div>

          <div className="header-downloads" style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button className="icon-btn" onClick={() => validateAndExecute(shareWhatsApp)} title="Share on WhatsApp" style={{ border: 'none', background: '#25D366', color: 'white', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}>
              <MessageCircle size={16} />
            </button>
            <button className="icon-btn" onClick={() => validateAndExecute(shareEmail)} title="Email Timetable" style={{ border: 'none', background: '#ea4335', color: 'white', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}>
              <Mail size={16} />
            </button>
          </div>
          
          <button className="btn btn-primary" onClick={handleAutoGen} style={{ marginLeft: '1rem' }}>
            <Zap size={18} /> Auto Generate
          </button>
          
          <button className="btn" onClick={() => validateAndExecute(handleManualSave)} style={{ border: `1px solid ${showSaved ? '#10b981' : 'var(--primary-color)'}`, color: showSaved ? '#10b981' : 'var(--primary-color)', background: showSaved ? '#ecfdf5' : '#f8fafc' }}>
            {showSaved ? <Check size={18} /> : <Save size={18} />}
            {showSaved ? 'Saved!' : 'Save'}
          </button>

          <button className="btn" onClick={() => validateAndExecute(handlePrint)} style={{ border: '1px solid var(--border)', background: 'white' }} title="Print Document">
            <Printer size={18} /> Print
          </button>

          <button className="btn" onClick={handleClearToday} style={{ border: '1px solid #ef4444', color: '#ef4444', background: '#fef2f2' }} title="Clear exact day">
            <Trash2 size={18} /> Clear
          </button>
        </div>
      </div>

      <div className="day-selector" style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {days.map(day => (
            <div 
              key={day}
              className={`day-tab ${activeDay === day ? 'active' : ''}`}
              onClick={() => setActiveDay(day)}
            >
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
        
        <div style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border)' }}>
           <input 
              type="date" 
              className="select-input" 
              style={{ border: 'none', background: 'transparent', width: 'auto', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
              value={activeDay.length > 10 ? activeDay : ''}
              onChange={handleDateChange}
              title="Pick specific previous/future date"
           />
        </div>
      </div>

      {showClearConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
             <h3 style={{ marginTop: 0, fontWeight: 600, color: 'var(--text-main)' }}>Clear Timetable?</h3>
             <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Are you sure you want to completely clear the timetable for <strong>{activeDay}</strong>? This action cannot be undone.</p>
             <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
               <button className="btn" onClick={() => setShowClearConfirm(false)} style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
               <button className="btn" onClick={confirmClear} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}>Yes, Clear</button>
             </div>
          </div>
        </div>
      )}
      
      {showSettings && <TimingSettingsModal onClose={() => setShowSettings(false)} />}
      {showClassManager && <ClassManagerModal onClose={() => setShowClassManager(false)} />}
      
      {validationErrors.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '450px', width: '90%', boxShadow: 'var(--shadow-lg)' }}>
             <h3 style={{ marginTop: 0, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Timetable is Incomplete!
             </h3>
             <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>The system detected the following validation issues matching your constraints:</p>
             <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
             </ul>
             <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
               <button className="btn" onClick={() => { setValidationErrors([]); setPendingAction(null); }} style={{ border: '1px solid var(--border)' }}>Cancel & Fix</button>
               <button className="btn" onClick={() => { 
                   setValidationErrors([]); 
                   if (pendingAction) pendingAction(); 
               }} style={{ border: 'none', background: 'var(--primary-color)', color: 'white' }}>Proceed Anyway</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
