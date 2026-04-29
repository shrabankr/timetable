import React, { useState, useMemo, useRef } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Upload, 
  Filter,
  GripVertical,
  Edit2,
  X,
  ShieldCheck
} from 'lucide-react';
import { useToast } from './Toast';
import AddTeacherModal from './AddTeacherModal';
import TeacherProfileModal from './TeacherProfileModal';
import * as XLSX from 'xlsx';
import type { Teacher } from '../types';

interface TeacherPanelProps {
  activeDay: string;
}

export default function TeacherPanel({ activeDay }: TeacherPanelProps) {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  
  // UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'full'>('all');
  const [filterDesignation, setFilterDesignation] = useState<string>('all');

  const deleteTeacher = (id: string, name: string) => {
    if (window.confirm(`Delete ${name} and their schedules?`)) {
      const assignmentCount = state.assignments.filter(a => a.teacherId === id).length;
      dispatch({ type: 'DELETE_TEACHER', payload: id });
      toast('warning', 'Faculty Removed', `${name} and their ${assignmentCount} assignments have been deleted.`);
    }
  };

  // Get unique designations for filter
  const designations = useMemo(() => {
    const set = new Set(state.teachers.map(t => t.designation).filter(Boolean));
    return Array.from(set) as string[];
  }, [state.teachers]);

  const filteredTeachers = useMemo(() => {
    return state.teachers.filter(teacher => {
      // 1. Search Term
      const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           teacher.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Subject Filter
      const matchesSubject = filterSubject === 'all' || teacher.defaultSubjectId === filterSubject;
      
      // 3. Designation Filter
      const matchesDesignation = filterDesignation === 'all' || teacher.designation === filterDesignation;

      // 4. Workload Status Filter
      const teacherAsgnsToday = state.assignments.filter(a => a.teacherId === teacher.id && a.day === activeDay);
      const workload = teacherAsgnsToday.length;
      
      const classesTaughtToday = teacherAsgnsToday.map(a => state.classes.find(c => c.id === a.classSectionId)).filter(Boolean);
      const teachesVX = classesTaughtToday.some(c => c?.group === 'VI-X');
      const teachesXIXII = classesTaughtToday.some(c => c?.group === 'XI-XII');
      const isMixed = teachesVX && teachesXIXII;
      
      let effectiveLimit = teacher.maxLoadPerDay;
      if (!isMixed) {
        if (teachesVX) effectiveLimit = activeDay === 'Sat' ? (state.constraints?.maxDailyPeriodsV_X_Sat || 8) : (state.constraints?.maxDailyPeriodsV_X || 8);
        if (teachesXIXII) effectiveLimit = activeDay === 'Sat' ? (state.constraints?.maxDailyPeriodsXI_XII_Sat || 3) : (state.constraints?.maxDailyPeriodsXI_XII || 5);
      }

      const isFull = workload >= effectiveLimit;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'available' && !isFull) || 
                           (filterStatus === 'full' && isFull);

      return matchesSearch && matchesSubject && matchesDesignation && matchesStatus;
    });
  }, [state.teachers, state.assignments, searchTerm, filterSubject, filterStatus, filterDesignation, activeDay]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterSubject('all');
    setFilterStatus('all');
    setFilterDesignation('all');
  };

  // ... (Export/Import logic remains same)
  const exportTeachers = () => {
    const data = state.teachers.map(t => ({
      Code: t.code,
      Name: t.name,
      Designation: t.designation || '',
      MaxLoad: t.maxLoadPerDay,
      DefaultSubject: state.subjects.find(s => s.id === t.defaultSubjectId)?.name || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty');
    XLSX.writeFile(wb, 'Faculty_Registry.xlsx');
    toast('success', 'Export Success', 'Faculty registry exported to Excel.');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const existingCodes = new Set(state.teachers.map(t => t.code.toUpperCase()));
      const newTeachers: Teacher[] = (data as any[]).map((row, i) => ({
        id: `t_${Date.now()}_${i}`,
        code: (row.Code || row.code || `T${i}`).toUpperCase(),
        name: row.Name || row.name || `Staff ${i}`,
        maxLoadPerDay: parseInt(row.MaxLoad || row.maxLoad) || 5
      })).filter(t => t.name && !existingCodes.has(t.code));
      if (newTeachers.length === 0) {
        toast('warning', 'No New Faculty', 'All faculty members in this file already exist.');
        return;
      }
      dispatch({ type: 'SET_TEACHERS', payload: [...state.teachers, ...newTeachers] });
      toast('success', 'Import Complete', `${newTeachers.length} faculty members added.`);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search faculty name or code..." 
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileImport} />
            <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showFilters ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`} title="Advanced Filters">
              <Filter size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all" title="Import Data">
              <Upload size={18} />
            </button>
            <button onClick={exportTeachers} className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all" title="Export Registry">
              <Download size={18} />
            </button>
            <button 
              className="px-4 h-10 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold" 
              onClick={() => { setSelectedTeacherId(undefined); setShowAddModal(true); }}
            >
              <Plus size={16} /> Add Faculty
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Subject:</span>
              <select className="bg-white border border-zinc-200 rounded-lg text-xs font-bold px-2 py-1.5 outline-none focus:border-indigo-500" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                <option value="all">All Subjects</option>
                {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Status:</span>
              <select className="bg-white border border-zinc-200 rounded-lg text-xs font-bold px-2 py-1.5 outline-none focus:border-indigo-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                <option value="all">All Status</option>
                <option value="available">Available Only</option>
                <option value="full">At Capacity</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Rank:</span>
              <select className="bg-white border border-zinc-200 rounded-lg text-xs font-bold px-2 py-1.5 outline-none focus:border-indigo-500" value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)}>
                <option value="all">All Ranks</option>
                {designations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button onClick={resetFilters} className="ml-auto text-[0.65rem] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
              <X size={12} /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 scrollbar-thin">
        {filteredTeachers.map(teacher => {
          const workload = state.assignments.filter(a => a.teacherId === teacher.id && a.day === activeDay).length;
          
          // Determine dynamic limit based on group assignments today
          const teacherAsgnsToday = state.assignments.filter(a => a.teacherId === teacher.id && a.day === activeDay);
          const classesTaughtToday = teacherAsgnsToday.map(a => state.classes.find(c => c.id === a.classSectionId)).filter(Boolean);
          const teachesVX = classesTaughtToday.some(c => c?.group === 'VI-X');
          const teachesXIXII = classesTaughtToday.some(c => c?.group === 'XI-XII');
          const isMixed = teachesVX && teachesXIXII;
          
          let effectiveLimit = teacher.maxLoadPerDay;
          if (!isMixed) {
            if (teachesVX) effectiveLimit = activeDay === 'Sat' ? (state.constraints?.maxDailyPeriodsV_X_Sat || 8) : (state.constraints?.maxDailyPeriodsV_X || 8);
            if (teachesXIXII) effectiveLimit = activeDay === 'Sat' ? (state.constraints?.maxDailyPeriodsXI_XII_Sat || 3) : (state.constraints?.maxDailyPeriodsXI_XII || 5);
          }

          const isFull = workload >= effectiveLimit;
          const usagePercent = Math.min((workload / effectiveLimit) * 100, 100);

          return (
            <div 
              key={teacher.id} 
              className="group relative p-5 bg-white border border-zinc-200 rounded-3xl hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-default"
            >
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-zinc-50 rounded-xl text-zinc-400 group-hover:text-indigo-600 transition-colors">
                    <GripVertical size={16} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <span 
                          className="text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest cursor-pointer hover:underline"
                          onClick={() => { setSelectedTeacherId(teacher.id); setShowProfileModal(true); }}
                        >
                          {teacher.code}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                           <button 
                            onClick={() => { setSelectedTeacherId(teacher.id); setShowAddModal(true); }}
                            className="p-1.5 hover:bg-indigo-50 text-zinc-300 hover:text-indigo-600 rounded-lg"
                            title="Edit Profile"
                           >
                            <Edit2 size={16} />
                           </button>
                           <button 
                            onClick={() => deleteTeacher(teacher.id, teacher.name)}
                            className="p-1.5 hover:bg-rose-50 text-zinc-300 hover:text-rose-500 rounded-lg"
                           >
                            <Trash2 size={16} />
                           </button>
                        </div>
                    </div>
                    <div 
                      className="text-sm font-black text-zinc-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                      onClick={() => { setSelectedTeacherId(teacher.id); setShowProfileModal(true); }}
                    >
                      {teacher.name}
                    </div>
                 </div>
              </div>

               <div className="flex items-center justify-between text-[0.65rem] font-black uppercase tracking-widest text-zinc-400">
                  <span>Current Load</span>
                  <span className={isFull ? 'text-rose-500' : 'text-indigo-600'}>{workload} / {effectiveLimit}</span>
               </div>

               <div className="h-1.5 bg-zinc-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${isFull ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
               </div>

               {/* Roles Preview (Limited) */}
               {( (teacher.inchargeRoles?.length || 0) > 0 || (teacher.responsibilities?.length || 0) > 0 ) && (
                 <div className="flex flex-wrap gap-1 mt-4">
                   {teacher.inchargeRoles?.slice(0, 1).map(role => {
                     const cls = state.classes.find(c => c.id === role.classId);
                     return (
                       <span key={role.classId} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[0.55rem] font-black rounded-md border border-indigo-100">
                         {cls?.grade}-{cls?.section} {role.role}
                       </span>
                     );
                   })}
                   {teacher.responsibilities?.slice(0, 1).map(resp => (
                     <span key={resp} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[0.55rem] font-black rounded-md">
                       {resp}
                     </span>
                   ))}
                   {((teacher.inchargeRoles?.length || 0) + (teacher.responsibilities?.length || 0)) > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[0.6rem] font-bold">
                       <ShieldCheck size={10} /> {(teacher.inchargeRoles?.length || 0) + (teacher.responsibilities?.length || 0)} Roles
                    </div>
                  )}</div>
               )}

               <div className="mt-5 pt-4 border-t border-zinc-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                    <span className="text-[0.65rem] font-bold text-zinc-500 uppercase tracking-tighter">{isFull ? 'At Capacity' : 'Available Now'}</span>
                 </div>
                 <button 
                  onClick={() => { setSelectedTeacherId(teacher.id); setShowProfileModal(true); }}
                  className="text-[0.6rem] font-black text-zinc-400 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 rounded-lg uppercase tracking-widest transition-colors"
                 >
                   Details
                 </button>
               </div>
            </div>
          );
        })}
        {filteredTeachers.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed">
             <Search size={48} className="mb-4 opacity-20" />
             <p className="text-sm font-bold tracking-tight">No faculty members found matching your filters.</p>
             <button onClick={resetFilters} className="mt-2 text-xs font-bold text-indigo-600 hover:underline">Reset all filters</button>
          </div>
        )}
      </div>

      {showAddModal && <AddTeacherModal onClose={() => { setShowAddModal(false); setSelectedTeacherId(undefined); }} teacherId={selectedTeacherId} />}
      {showProfileModal && (
        <TeacherProfileModal 
          onClose={() => { setShowProfileModal(false); setSelectedTeacherId(undefined); }} 
          teacherId={selectedTeacherId!} 
          onEdit={() => { 
            setShowProfileModal(false); 
            setShowAddModal(true); 
          }} 
        />
      )}
    </div>
  );
}
