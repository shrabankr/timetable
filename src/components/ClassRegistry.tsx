import React, { useState, useRef } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  GraduationCap, 
  AlertCircle,
  Download,
  Upload,
  Layers,
  Link2,
  GitMerge,
  Calendar,
  Sparkles,
  Users
} from 'lucide-react';
import { useToast } from './Toast';
import type { ClassSection, ClassMerge } from '../types';
import * as XLSX from 'xlsx';

export default function ClassRegistry() {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'classes' | 'merges'>('classes');
  
  // Class State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editGroup, setEditGroup] = useState<'VI-X' | 'XI-XII'>('VI-X');
  const [editClassTeacherId, setEditClassTeacherId] = useState<string | undefined>(undefined);
  const [editCoClassTeacherId, setEditCoClassTeacherId] = useState<string | undefined>(undefined);
  const [editSubjectInchargeId, setEditSubjectInchargeId] = useState<string | undefined>(undefined);
  
  const [newGrade, setNewGrade] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newGroup, setNewGroup] = useState<'VI-X' | 'XI-XII'>('VI-X');
  const [newClassTeacherId, setNewClassTeacherId] = useState<string | undefined>(undefined);
  const [newCoClassTeacherId, setNewCoClassTeacherId] = useState<string | undefined>(undefined);
  const [newSubjectInchargeId, setNewSubjectInchargeId] = useState<string | undefined>(undefined);

  // Merge State
  const [newMergeSubjectId, setNewMergeSubjectId] = useState('');
  const [newMergeTeacherId, setNewMergeTeacherId] = useState('');
  const [selectedMergeClasses, setSelectedMergeClasses] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Get existing incharge for a grade
  const getExistingIncharge = (grade: string) => {
    return state.classes.find(c => c.grade === grade && c.subjectInchargeId)?.subjectInchargeId;
  };

  // Auto-populate incharge when grade changes
  React.useEffect(() => {
    if (newGrade) {
      const existing = getExistingIncharge(newGrade);
      if (existing) setNewSubjectInchargeId(existing);
    }
  }, [newGrade, state.classes]);

  const validateAssignments = (grade: string, ctId?: string, mrgId?: string, excludeId?: string) => {
    // 1. Class Teacher Uniqueness
    if (ctId) {
      const alreadyCT = state.classes.find(c => c.id !== excludeId && c.classTeacherId === ctId);
      if (alreadyCT) {
        toast('error', 'Conflict', `${state.teachers.find(t => t.id === ctId)?.name} is already the Class Teacher for ${alreadyCT.grade}-${alreadyCT.section}.`);
        return false;
      }
    }

    // 2. Incharge Uniqueness across Grades
    if (mrgId) {
      const busyInOtherGrade = state.classes.find(c => c.id !== excludeId && c.grade !== grade && c.subjectInchargeId === mrgId);
      if (busyInOtherGrade) {
        toast('error', 'Conflict', `${state.teachers.find(t => t.id === mrgId)?.name} is already the Incharge for Grade ${busyInOtherGrade.grade}.`);
        return false;
      }
    }

    return true;
  };

  const handleAdd = () => {
    if (!newGrade || !newSection) {
      toast('error', 'Missing Data', 'Please provide both Grade and Section.');
      return;
    }

    if (!validateAssignments(newGrade, newClassTeacherId, newSubjectInchargeId)) return;

    const id = `cls_${Date.now()}`;
    const newCls: ClassSection = { 
      id, 
      grade: newGrade, 
      section: newSection.toUpperCase(), 
      group: newGroup,
      classTeacherId: newClassTeacherId,
      coClassTeacherId: newCoClassTeacherId,
      subjectInchargeId: newSubjectInchargeId
    };

    let updatedClasses = [...state.classes, newCls];
    
    // Auto-propagate incharge to other sections of the same grade if they are empty
    if (newSubjectInchargeId) {
      updatedClasses = updatedClasses.map(c => 
        c.grade === newGrade && !c.subjectInchargeId ? { ...c, subjectInchargeId: newSubjectInchargeId } : c
      );
    }

    dispatch({ type: 'SET_CLASSES', payload: updatedClasses });
    setNewGrade('');
    setNewSection('');
    setNewClassTeacherId(undefined);
    setNewCoClassTeacherId(undefined);
    setNewSubjectInchargeId(undefined);
    toast('success', 'Class Added', `${newGrade}-${newSection} has been added.`);
  };

  const handleDelete = (id: string, name: string) => {
    const allocationCount = state.allocations.filter(a => a.classSectionId === id).length;
    const msg = allocationCount > 0 
      ? `Critical Action: Deleting Class ${name} will permanently erase all its timetable assignments and ${allocationCount} faculty allotments. Type 'DELETE' to confirm.`
      : `Are you sure you want to delete ${name}? Type 'DELETE' to confirm.`;

    const confirmText = window.prompt(msg);
    if (confirmText === 'DELETE') {
      dispatch({ type: 'DELETE_CLASS', payload: id });
      toast('warning', 'Class Removed', `${name} has been deleted.`);
    } else if (confirmText !== null) {
      toast('error', 'Action Cancelled', 'Confirmation text did not match.');
    }
  };

  const startEditing = (c: ClassSection) => {
    setEditingId(c.id);
    setEditGrade(c.grade);
    setEditSection(c.section);
    setEditGroup(c.group);
    setEditClassTeacherId(c.classTeacherId);
    setEditCoClassTeacherId(c.coClassTeacherId);
    setEditSubjectInchargeId(c.subjectInchargeId);
  };

  const saveEdit = (id: string) => {
    if (!validateAssignments(editGrade, editClassTeacherId, editSubjectInchargeId, id)) return;

    let updatedClasses = state.classes.map(c => c.id === id ? { 
      ...c, 
      grade: editGrade, 
      section: editSection.toUpperCase(), 
      group: editGroup,
      classTeacherId: editClassTeacherId,
      coClassTeacherId: editCoClassTeacherId,
      subjectInchargeId: editSubjectInchargeId
    } : c);

    // Auto-propagate incharge to other sections of the same grade if they are empty
    if (editSubjectInchargeId) {
      updatedClasses = updatedClasses.map(c => 
        c.grade === editGrade && !c.subjectInchargeId ? { ...c, subjectInchargeId: editSubjectInchargeId } : c
      );
    }

    dispatch({ type: 'SET_CLASSES', payload: updatedClasses });
    setEditingId(null);
    toast('success', 'Registry Updated', 'Class details have been synchronized.');
  };

  const exportExcel = () => {
    try {
      const data = state.classes.map(c => ({
        Grade: c.grade,
        Section: c.section,
        Group: c.group,
        'Class Teacher': state.teachers.find(t => t.id === c.classTeacherId)?.name || '',
        'Co-Teacher': state.teachers.find(t => t.id === c.coClassTeacherId)?.name || '',
        'Class Incharge': state.teachers.find(t => t.id === c.subjectInchargeId)?.name || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Classes");
      
      // Manual blob download for maximum reliability
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ClassRegistry.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast('success', 'Export Complete', 'Full class registry with faculty roles downloaded.');
    } catch (err) {
      console.error('Export Error:', err);
      toast('error', 'Export Failed', 'An error occurred while generating the Excel file.');
    }
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) throw new Error("Empty sheet");

        const newClasses: ClassSection[] = [...state.classes];
        let addedCount = 0;

        data.forEach(row => {
          if (row.Grade && row.Section) {
            const grade = String(row.Grade).trim();
            const section = String(row.Section).trim().toUpperCase();
            const group = row.Group && ['VI-X', 'XI-XII'].includes(row.Group) ? row.Group : 'VI-X';
            
            // Resolve Teacher IDs by Name
            const findTeacherId = (name: string) => 
              state.teachers.find(t => t.name.toLowerCase() === String(name || '').trim().toLowerCase())?.id;

            const classTeacherId = findTeacherId(row['Class Teacher']);
            const coClassTeacherId = findTeacherId(row['Co-Teacher']);
            const subjectInchargeId = findTeacherId(row['Class Incharge']);

            // Avoid duplicates - but update existing if found?
            // For now, let's just add new ones
            if (!newClasses.find(c => c.grade === grade && c.section === section)) {
              newClasses.push({
                id: `cls_${Date.now()}_${Math.random()}`,
                grade,
                section,
                group: group as 'VI-X' | 'XI-XII',
                classTeacherId,
                coClassTeacherId,
                subjectInchargeId
              });
              addedCount++;
            }
          }
        });

        if (addedCount > 0) {
          const proceed = window.confirm(`You are about to import ${addedCount} new classes with faculty roles. Do you want to proceed?`);
          if (proceed) {
             dispatch({ type: 'SET_CLASSES', payload: newClasses });
             toast('success', 'Import Complete', `${addedCount} classes added.`);
          }
        } else {
          toast('info', 'No New Data', 'No new classes found in the spreadsheet.');
        }
      } catch (err) {
        toast('error', 'Import Failed', 'Invalid Excel format. Ensure columns: Grade, Section, Group, Class Teacher, Co-Teacher, Class Incharge.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

    const [newMergeScope, setNewMergeScope] = useState<'Today' | 'Range' | 'Session'>('Today');
    const [newMergeStartDate, setNewMergeStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newMergeEndDate, setNewMergeEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [newMergeIsWholeDay, setNewMergeIsWholeDay] = useState(false);

    const handleAddMerge = () => {
    if (!newMergeSubjectId || !newMergeTeacherId || selectedMergeClasses.length < 2) {
      toast('error', 'Invalid Merge', 'Please select a subject, teacher, and at least 2 classes.');
      return;
    }

    const newMerge: ClassMerge = {
      id: `mrg_${Date.now()}`,
      subjectId: newMergeSubjectId,
      teacherId: newMergeTeacherId,
      classSectionIds: selectedMergeClasses,
      scope: newMergeScope,
      startDate: (newMergeScope === 'Range' || newMergeScope === 'Today') ? newMergeStartDate : undefined,
      endDate: (newMergeScope === 'Range' || newMergeScope === 'Today') ? (newMergeScope === 'Today' ? newMergeStartDate : newMergeEndDate) : undefined,
      isWholeDay: newMergeIsWholeDay
    };

    dispatch({ type: 'SET_MERGES', payload: [...state.merges, newMerge] });
    setNewMergeSubjectId('');
    setNewMergeTeacherId('');
    setSelectedMergeClasses([]);
    toast('success', 'Classes Merged', 'The selected sections will now share these periods.');
  };

  const deleteMerge = (id: string) => {
    dispatch({ type: 'SET_MERGES', payload: state.merges.filter(m => m.id !== id) });
    toast('info', 'Merge Removed', 'The section merge has been disbanded.');
  };

  const toggleClassSelection = (id: string) => {
    setSelectedMergeClasses(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const renderClassesTab = () => (
    <div className="animate-fade space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">Section Registry</h2>
            <p className="text-zinc-500 font-medium text-[0.6rem] uppercase tracking-widest">Active Academic Groupings</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={importExcel} />
            <button onClick={() => fileInputRef.current?.click()} className="px-3 h-9 flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
              <Upload size={14} /> <span className="hidden sm:inline">Import</span>
            </button>
            <button onClick={exportExcel} className="px-3 h-9 flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
              <Download size={14} /> <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Add Class Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Grade" 
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full"
              value={newGrade}
              onChange={e => setNewGrade(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Section" 
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full uppercase"
              value={newSection}
              onChange={e => setNewSection(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full"
              value={newGroup}
              onChange={e => setNewGroup(e.target.value as any)}
            >
              <option value="VI-X">Grade VI-X</option>
              <option value="XI-XII">Grade XI-XII</option>
            </select>
            <select 
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full"
              value={newClassTeacherId || ''}
              onChange={e => setNewClassTeacherId(e.target.value || undefined)}
            >
              <option value="">Class Teacher (Opt)...</option>
              {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <select 
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full"
              value={newCoClassTeacherId || ''}
              onChange={e => setNewCoClassTeacherId(e.target.value || undefined)}
            >
              <option value="">Co-Teacher (Opt)...</option>
              {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="relative group/field w-full">
              <select 
                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-full pr-10"
                value={newSubjectInchargeId || ''}
                onChange={e => setNewSubjectInchargeId(e.target.value || undefined)}
              >
                <option value="">Class Incharge...</option>
                {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {newSubjectInchargeId && (
                <button 
                  onClick={() => {
                    const teacherName = state.teachers.find(t => t.id === newSubjectInchargeId)?.name;
                    if (newGrade) {
                      if (window.confirm(`Apply ${teacherName} as Class Incharge for ALL sections of Grade ${newGrade}?`)) {
                        dispatch({
                          type: 'SET_CLASSES',
                          payload: state.classes.map(c => c.grade === newGrade ? { ...c, subjectInchargeId: newSubjectInchargeId } : c)
                        });
                        toast('success', 'Grade Assignment', `Class Incharge updated for all Grade ${newGrade} sections.`);
                      }
                    } else {
                      if (window.confirm(`Apply ${teacherName} as Class Incharge for ALL sections globally?`)) {
                        dispatch({
                          type: 'SET_CLASSES',
                          payload: state.classes.map(c => ({ ...c, subjectInchargeId: newSubjectInchargeId }))
                        });
                        toast('success', 'Global Assignment', 'Class Incharge updated for all sections.');
                      }
                    }
                  }}
                  title={newGrade ? `Apply to all Grade ${newGrade} sections` : "Apply to all sections globally"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                >
                  <Check size={14} className="stroke-[3]" />
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="h-9 bg-zinc-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 shadow-md"
          >
            <Plus size={14} /> Add Class Section
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-zinc-100 rounded-3xl bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-100 text-left">
              <th className="p-4 text-[0.6rem] font-black text-zinc-400 uppercase tracking-widest">Section</th>
              <th className="p-4 text-[0.6rem] font-black text-zinc-400 uppercase tracking-widest">Class Teacher</th>
              <th className="p-4 text-[0.6rem] font-black text-zinc-400 uppercase tracking-widest">Co-Teacher</th>
              <th className="p-4 text-[0.6rem] font-black text-zinc-400 uppercase tracking-widest">Class Incharge</th>
              <th className="p-4 text-[0.6rem] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.classes.map(cls => (
              <tr key={cls.id} className="border-b border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={16} />
                    </div>
                    {editingId === cls.id ? (
                      <div className="flex gap-1">
                        <input 
                          className="px-2 py-1 border border-indigo-200 rounded text-xs font-bold w-14 outline-none focus:ring-4 focus:ring-indigo-500/5"
                          value={editGrade}
                          onChange={e => setEditGrade(e.target.value)}
                        />
                        <input 
                          className="px-2 py-1 border border-indigo-200 rounded text-xs font-bold w-12 outline-none focus:ring-4 focus:ring-indigo-500/5 uppercase"
                          value={editSection}
                          onChange={e => setEditSection(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-black text-zinc-800">{cls.grade}-{cls.section}</div>
                        <div className="text-[0.6rem] font-black text-indigo-600/60 uppercase">{cls.group}</div>
                      </div>
                    )}
                  </div>
                </td>

                <td className="p-4">
                  {editingId === cls.id ? (
                    <select 
                      className="px-2 py-1 border border-indigo-200 rounded text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5"
                      value={editClassTeacherId || ''}
                      onChange={e => setEditClassTeacherId(e.target.value || undefined)}
                    >
                      <option value="">None</option>
                      {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-zinc-700">
                      {state.teachers.find(t => t.id === cls.classTeacherId)?.name || '—'}
                    </span>
                  )}
                </td>

                <td className="p-4">
                  {editingId === cls.id ? (
                    <select 
                      className="px-2 py-1 border border-indigo-200 rounded text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5"
                      value={editCoClassTeacherId || ''}
                      onChange={e => setEditCoClassTeacherId(e.target.value || undefined)}
                    >
                      <option value="">None</option>
                      {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-zinc-400">
                      {state.teachers.find(t => t.id === cls.coClassTeacherId)?.name || '—'}
                    </span>
                  )}
                </td>

                <td className="p-4">
                  {editingId === cls.id ? (
                    <select 
                      className="px-2 py-1 border border-indigo-200 rounded text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5"
                      value={editSubjectInchargeId || ''}
                      onChange={e => setEditSubjectInchargeId(e.target.value || undefined)}
                    >
                      <option value="">None</option>
                      {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">
                      {state.teachers.find(t => t.id === cls.subjectInchargeId)?.name || '—'}
                    </span>
                  )}
                </td>

                <td className="p-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {editingId === cls.id ? (
                      <>
                        <button onClick={() => saveEdit(cls.id)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(cls)} className="p-2 hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(cls.id, `${cls.grade}-${cls.section}`)} className="p-2 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {state.classes.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
             <GraduationCap size={48} className="mb-4 opacity-10" />
             <p className="text-sm font-bold">No classes defined in the registry.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex gap-4">
         <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 flex-shrink-0">
            <AlertCircle size={20} />
         </div>
         <div>
            <h4 className="text-sm font-bold text-rose-900 mb-1">Administrative Warning</h4>
            <p className="text-xs text-rose-700/80 font-medium leading-relaxed">
              Deleting a class will permanently wipe its entire timetable and remove all teacher allocations associated with it. 
              This action cannot be undone. Please export a backup first if unsure.
            </p>
         </div>
      </div>
    </div>
  );

  const renderMergesTab = () => (
    <div className="animate-fade space-y-8">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator Panel */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                      <GitMerge size={20} />
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-zinc-900">Merge Sections</h3>
                      <p className="text-xs text-zinc-500 font-medium">Create combined lectures</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest ml-1">1. Select Subject</label>
                      <select 
                        className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                        value={newMergeSubjectId}
                        onChange={e => setNewMergeSubjectId(e.target.value)}
                      >
                         <option value="">Choose Subject...</option>
                         {state.subjects.map(s => (
                           <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                         ))}
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest ml-1">2. Assign Teacher</label>
                      <select 
                        className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                        value={newMergeTeacherId}
                        onChange={e => setNewMergeTeacherId(e.target.value)}
                      >
                         <option value="">Choose Teacher...</option>
                         {state.teachers.map(t => (
                           <option key={t.id} value={t.id}>{t.name} [{t.code}]</option>
                         ))}
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest ml-1">3. Temporal Scope</label>
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 rounded-xl">
                          {(['Session', 'Range', 'Today'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setNewMergeScope(s)}
                              className={`py-1.5 text-[0.6rem] font-black rounded-lg transition-all ${newMergeScope === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        
                        <label className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${newMergeIsWholeDay ? 'bg-amber-50 border-amber-200' : 'bg-white border-zinc-100 hover:border-zinc-200'}`}>
                           <input 
                              type="checkbox" 
                              className="w-4 h-4 accent-amber-500 rounded" 
                              checked={newMergeIsWholeDay}
                              onChange={e => {
                                setNewMergeIsWholeDay(e.target.checked);
                                if (e.target.checked) {
                                  setSelectedMergeClasses(state.classes.map(c => c.id));
                                  setNewMergeScope('Today');
                                }
                              }}
                           />
                           <div className="flex items-center gap-2">
                              <Sparkles size={14} className={newMergeIsWholeDay ? 'text-amber-500' : 'text-zinc-300'} />
                              <div>
                                 <div className="text-[0.65rem] font-black text-zinc-800">Whole Day Event</div>
                                 <div className="text-[0.55rem] font-bold text-zinc-500">Apply to all periods for selected sections</div>
                              </div>
                           </div>
                        </label>
                      </div>
                   </div>

                   {newMergeScope === 'Range' && (
                     <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-1">
                           <label className="text-[0.55rem] font-black text-zinc-400 uppercase ml-1">Start</label>
                           <input 
                              type="date" 
                              className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
                              value={newMergeStartDate}
                              onChange={e => setNewMergeStartDate(e.target.value)}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[0.55rem] font-black text-zinc-400 uppercase ml-1">End</label>
                           <input 
                              type="date" 
                              className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-bold"
                              value={newMergeEndDate}
                              onChange={e => setNewMergeEndDate(e.target.value)}
                           />
                        </div>
                     </div>
                   )}

                   <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">4. Select Sections ({selectedMergeClasses.length})</label>
                        <button 
                          onClick={() => {
                            if (selectedMergeClasses.length === state.classes.length) {
                              setSelectedMergeClasses([]);
                            } else {
                              setSelectedMergeClasses(state.classes.map(c => c.id));
                            }
                          }}
                          className="text-[0.55rem] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-wider"
                        >
                          {selectedMergeClasses.length === state.classes.length ? 'Deselect All' : 'Select All Classes'}
                        </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto border border-zinc-200 rounded-xl bg-white p-2 space-y-1 scrollbar-thin">
                         {state.classes.map(cls => (
                           <button 
                             key={cls.id}
                             onClick={() => toggleClassSelection(cls.id)}
                             className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all ${
                               selectedMergeClasses.includes(cls.id) 
                                 ? 'bg-indigo-600 text-white shadow-md' 
                                 : 'hover:bg-zinc-50 text-zinc-600'
                             }`}
                           >
                              <span>{cls.grade}-{cls.section}</span>
                              {selectedMergeClasses.includes(cls.id) && <Check size={14} />}
                           </button>
                         ))}
                      </div>
                   </div>

                   <button 
                     onClick={handleAddMerge}
                     className="w-full h-12 bg-zinc-900 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 shadow-xl mt-4"
                   >
                      <Link2 size={18} /> Create Combined Lecture
                   </button>
                </div>
             </div>
          </div>

          {/* List Panel */}
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-[0.2em]">Active Merges ({state.merges.length})</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.merges.map(merge => {
                   const subject = state.subjects.find(s => s.id === merge.subjectId);
                   const teacher = state.teachers.find(t => t.id === merge.teacherId);
                   const mergedClasses = state.classes.filter(c => merge.classSectionIds.includes(c.id));

                   return (
                     <div key={merge.id} className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                        <button 
                          onClick={() => deleteMerge(merge.id)}
                          className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                           <Trash2 size={16} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                              <Layers size={20} />
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-zinc-800">{subject?.name}</h4>
                              <p className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-wider">{teacher?.name}</p>
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                           {merge.classSectionIds.length === state.classes.length ? (
                             <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[0.6rem] font-black rounded-lg border border-indigo-100 flex items-center gap-1">
                               <Users size={10} /> Whole School
                             </span>
                           ) : mergedClasses.map(cls => (
                             <span key={cls.id} className="px-2 py-1 bg-zinc-50 text-zinc-500 text-[0.6rem] font-black rounded-lg border border-zinc-100">
                                {cls.grade}-{cls.section}
                             </span>
                           ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                           <div className="flex items-center gap-1.5">
                              {merge.isWholeDay ? <Sparkles size={12} className="text-amber-500" /> : <Calendar size={12} className="text-zinc-400" />}
                              <span className={`text-[0.55rem] font-bold uppercase tracking-wider ${
                                merge.isWholeDay ? 'text-amber-600' :
                                merge.scope === 'Session' ? 'text-indigo-500' :
                                merge.scope === 'Today' ? 'text-emerald-500' : 'text-amber-500'
                              }`}>
                                {merge.isWholeDay ? 'Whole Day Event' : (
                                  merge.scope === 'Range' 
                                    ? `${merge.startDate} to ${merge.endDate}` 
                                    : merge.scope === 'Session' ? 'Academic Session' : 'Today Only'
                                )}
                              </span>
                           </div>
                           <GitMerge size={12} className="text-zinc-200" />
                        </div>
                     </div>
                   );
                })}

                {state.merges.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-50/50 border border-dashed border-zinc-200 rounded-3xl text-zinc-400">
                     <Link2 size={32} className="mb-3 opacity-20" />
                     <p className="text-xs font-bold">No combined lectures defined yet.</p>
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-white">
      <div className="mb-4">
         <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Manage Registry</h1>
         <p className="text-zinc-500 font-medium text-[0.65rem] uppercase tracking-wider">Configure your academic structure and class groupings.</p>
      </div>

      <div className="mb-6">
         <div className="flex p-1 bg-zinc-100/50 rounded-2xl w-fit border border-zinc-100">
            <button 
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} /> Standard Registry
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('merges')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'merges' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <div className="flex items-center gap-2">
                <GitMerge size={14} /> Section Merges
              </div>
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-visible">
         {activeTab === 'classes' ? renderClassesTab() : renderMergesTab()}
      </div>
    </div>
  );
}
