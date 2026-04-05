import { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import type { ClassGroup, ClassSection } from '../types';

interface ClassManagerModalProps {
  onClose: () => void;
}

export default function ClassManagerModal({ onClose }: ClassManagerModalProps) {
  const { state, dispatch } = useTimetable();
  
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
          alert(`ERROR: Teacher ${teacher?.name} is already assigned as a Class Teacher to ${conflict.grade}-${conflict.section}! A teacher cannot be a Class Teacher for multiple sections.`);
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
      alert("Grade and Section are required!");
      return;
    }

    if (newClassTeacher) {
       const conflict = getTeacherConflict(newClassTeacher);
       if (conflict) {
          const teacher = state.teachers.find(t => t.id === newClassTeacher);
          alert(`ERROR: Primary Teacher ${teacher?.name} is already assigned to ${conflict.grade}-${conflict.section}!`);
          return;
       }
    }

    if (newCoClassTeacher) {
       const conflict = getTeacherConflict(newCoClassTeacher);
       if (conflict) {
          const teacher = state.teachers.find(t => t.id === newCoClassTeacher);
          alert(`ERROR: Co-Teacher ${teacher?.name} is already assigned to ${conflict.grade}-${conflict.section}!`);
          return;
       }
    }
    
    if (newClassTeacher && newCoClassTeacher && newClassTeacher === newCoClassTeacher) {
       alert("ERROR: The Class Teacher and Co-Class Teacher cannot be the exact same person!");
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
  };

  const saveSettings = () => {
    dispatch({ type: 'SET_CLASSES', payload: editingClasses });
    alert('Class Sections saved successfully!');
    onClose();
  };

  const filteredClasses = editingClasses.filter(c => c.group === activeGroup);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', width: '95%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Manage Classes & Sections</h2>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
             <select className="select-input" value={activeGroup} onChange={(e) => setActiveGroup(e.target.value as ClassGroup)} style={{ flex: 1, padding: '0.75rem', fontWeight: 600 }}>
               <option value="VI-X">Group: VI-X</option>
               <option value="XI-XII">Group: XI-XII</option>
             </select>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Add New Class</h4>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
               <input type="text" className="select-input" placeholder="Grade (e.g. VI, XI)" value={newGrade} onChange={e => setNewGrade(e.target.value)} style={{ width: '120px' }} />
               <input type="text" className="select-input" placeholder="Section (e.g. A)" value={newSection} onChange={e => setNewSection(e.target.value)} style={{ width: '120px' }} />
               
               <select className="select-input" value={newClassTeacher} onChange={e => setNewClassTeacher(e.target.value)} style={{ flex: 1, minWidth: '150px' }}>
                 <option value="">-- Assign Class Teacher --</option>
                 {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
               </select>

               <select className="select-input" value={newCoClassTeacher} onChange={e => setNewCoClassTeacher(e.target.value)} style={{ flex: 1, minWidth: '150px' }}>
                 <option value="">-- Assign Co-Class Teacher (Opt) --</option>
                 {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
               </select>

               <button className="btn btn-primary" onClick={handleAddClass}>
                 <Plus size={18} /> Add
               </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 2fr 2fr 40px', gap: '1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
               <div>Class</div>
               <div>Class Teacher</div>
               <div>Co-Class Teacher</div>
               <div>Action</div>
             </div>

             {filteredClasses.map((cls) => (
                <div key={cls.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 2fr 2fr 40px', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                    {cls.grade}-{cls.section}
                  </div>
                  
                  <select 
                     className="select-input" 
                     value={cls.classTeacherId || ''} 
                     onChange={(e) => handleClassChange(cls.id, 'classTeacherId', e.target.value)}
                  >
                     <option value="">-- None --</option>
                     {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>

                  <select 
                     className="select-input" 
                     value={cls.coClassTeacherId || ''} 
                     onChange={(e) => handleClassChange(cls.id, 'coClassTeacherId', e.target.value)}
                  >
                     <option value="">-- None --</option>
                     {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>

                  <button className="icon-btn" onClick={() => handleDeleteClass(cls.id)} title="Delete Class" style={{ border: 'none', background: '#fee2e2', color: '#ef4444' }}>
                     <Trash2 size={16} />
                  </button>
                </div>
             ))}
             {filteredClasses.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No classes found in this group.</div>
             )}
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose} style={{ border: '1px solid var(--border)' }}>Cancel</button>
          <button className="btn btn-primary" onClick={saveSettings}>
            <Save size={18} /> Save Classes
          </button>
        </div>

      </div>
    </div>
  );
}
