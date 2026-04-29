import { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import { useToast } from './Toast';
import type { ClassGroup, ClassSection } from '../types';

interface ClassManagerModalProps {
  onClose: () => void;
}

export default function ClassManagerModal({ onClose }: ClassManagerModalProps) {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  
  const [activeGroup, setActiveGroup] = useState<ClassGroup>('VI-X');
  
  // Local state for editing classes
  const [editingClasses, setEditingClasses] = useState<ClassSection[]>(
    JSON.parse(JSON.stringify(state.classes))
  );

  const [newGrade, setNewGrade] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');
  const [newCoClassTeacher, setNewCoClassTeacher] = useState('');

  const getTeacherConflict = (teacherId: string, currentClassId?: string) => {
    if (!teacherId) return null;
    const conflictingClass = editingClasses.find(c => 
      c.id !== currentClassId && 
      (c.classTeacherId === teacherId || c.coClassTeacherId === teacherId)
    );
    return conflictingClass;
  };

  const handleClassChange = (id: string, field: keyof ClassSection, value: string) => {
    if (value && (field === 'classTeacherId' || field === 'coClassTeacherId')) {
       const conflict = getTeacherConflict(value, id);
       if (conflict) {
          const teacher = state.teachers.find(t => t.id === value);
          toast('error', 'Teacher Conflict', `${teacher?.name} is already assigned as Class Teacher to ${conflict.grade}-${conflict.section}.`);
          return;
       }
    }
    
    setEditingClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Are you sure you want to delete this class section?")) {
      setEditingClasses(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddClass = () => {
    if (!newGrade || !newSection) {
      toast('error', 'Missing Fields', 'Grade and Section are required.');
      return;
    }

    if (newClassTeacher) {
       const conflict = getTeacherConflict(newClassTeacher);
       if (conflict) {
          const teacher = state.teachers.find(t => t.id === newClassTeacher);
          toast('error', 'Teacher Conflict', `Primary Teacher ${teacher?.name} is already assigned to ${conflict.grade}-${conflict.section}.`);
          return;
       }
    }

    if (newCoClassTeacher) {
       const conflict = getTeacherConflict(newCoClassTeacher);
       if (conflict) {
          const teacher = state.teachers.find(t => t.id === newCoClassTeacher);
          toast('error', 'Teacher Conflict', `Co-Teacher ${teacher?.name} is already assigned to ${conflict.grade}-${conflict.section}.`);
          return;
       }
    }
    
    if (newClassTeacher && newCoClassTeacher && newClassTeacher === newCoClassTeacher) {
       toast('error', 'Invalid Assignment', 'The Class Teacher and Co-Class Teacher cannot be the same person.');
       return;
    }

    const newClass: ClassSection = {
      id: `c_${Date.now()}`,
      group: activeGroup,
      grade: newGrade,
      section: newSection.toUpperCase(),
      classTeacherId: newClassTeacher || undefined,
      coClassTeacherId: newCoClassTeacher || undefined
    };

    setEditingClasses(prev => [...prev, newClass]);
    setNewGrade('');
    setNewSection('');
    setNewClassTeacher('');
    setNewCoClassTeacher('');
    toast('success', 'Class Added', `${newGrade}-${newSection.toUpperCase()} added to ${activeGroup}.`);
  };

  const saveSettings = () => {
    dispatch({ type: 'SET_CLASSES', payload: editingClasses });
    toast('success', 'Classes Saved', 'All class sections have been saved successfully.');
    onClose();
  };

  const filteredClasses = editingClasses.filter(c => c.group === activeGroup);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container w-[95%] max-w-[800px] animate-fade">
        
        <div className="modal-header">
          <h2>Manage Classes & Sections</h2>
          <button className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-600 transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-5">
            <select className="modal-select w-48" value={activeGroup} onChange={(e) => setActiveGroup(e.target.value as ClassGroup)}>
              <option value="VI-X">Group: VI-X</option>
              <option value="XI-XII">Group: XI-XII</option>
            </select>
          </div>

          {/* Add New Class */}
          <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200/60 mb-6">
            <h4 className="text-sm font-bold text-zinc-800 mb-4">Add New Class</h4>
            <div className="flex gap-3 items-end flex-wrap">
               <div>
                 <label className="modal-label">Grade</label>
                 <input type="text" className="modal-input w-28" placeholder="e.g. VI" value={newGrade} onChange={e => setNewGrade(e.target.value)} />
               </div>
               <div>
                 <label className="modal-label">Section</label>
                 <input type="text" className="modal-input w-20" placeholder="A" value={newSection} onChange={e => setNewSection(e.target.value)} />
               </div>
               
               <div className="flex-1 min-w-[150px]">
                 <label className="modal-label">Class Teacher</label>
                 <select className="modal-select" value={newClassTeacher} onChange={e => setNewClassTeacher(e.target.value)}>
                   <option value="">-- Assign Class Teacher --</option>
                   {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                 </select>
               </div>

               <div className="flex-1 min-w-[150px]">
                 <label className="modal-label">Co-Class Teacher</label>
                 <select className="modal-select" value={newCoClassTeacher} onChange={e => setNewCoClassTeacher(e.target.value)}>
                   <option value="">-- Optional --</option>
                   {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                 </select>
               </div>

               <button className="btn-primary-modal" onClick={handleAddClass}>
                 <Plus size={16} /> Add
               </button>
            </div>
          </div>

          {/* Class List */}
          <div className="space-y-2">
             <div className="grid grid-cols-[80px_1fr_1fr_40px] gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-200">
               <div>Class</div>
               <div>Class Teacher</div>
               <div>Co-Class Teacher</div>
               <div></div>
             </div>

             {filteredClasses.map((cls) => (
                <div key={cls.id} className="grid grid-cols-[80px_1fr_1fr_40px] gap-4 items-center py-2 hover:bg-zinc-50 rounded-lg transition-colors">
                  <div className="font-bold text-zinc-900">
                    {cls.grade}-{cls.section}
                  </div>
                  
                  <select 
                     className="modal-select" 
                     value={cls.classTeacherId || ''} 
                     onChange={(e) => handleClassChange(cls.id, 'classTeacherId', e.target.value)}
                  >
                     <option value="">-- None --</option>
                     {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>

                  <select 
                     className="modal-select" 
                     value={cls.coClassTeacherId || ''} 
                     onChange={(e) => handleClassChange(cls.id, 'coClassTeacherId', e.target.value)}
                  >
                     <option value="">-- None --</option>
                     {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>

                  <button 
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-500 transition-colors" 
                    onClick={() => handleDeleteClass(cls.id)} 
                    title="Delete Class"
                  >
                     <Trash2 size={15} />
                  </button>
                </div>
             ))}
             {filteredClasses.length === 0 && (
                <div className="text-center text-zinc-400 py-8 text-sm font-medium">No classes found in this group.</div>
             )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary-modal" onClick={onClose}>Cancel</button>
          <button className="btn-primary-modal" onClick={saveSettings}>
            <Save size={16} /> Save Classes
          </button>
        </div>

      </div>
    </div>
  );
}
