import { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';

interface AddTeacherModalProps {
  onClose: () => void;
}

export default function AddTeacherModal({ onClose }: AddTeacherModalProps) {
  const { state, dispatch } = useTimetable();
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || '');
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectDaily, setNewSubjectDaily] = useState('');
  const [newSubjectWeekly, setNewSubjectWeekly] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const handleSave = () => {
    if (!name || (!subjectId && !newSubjectName)) return alert("Name and Subject are required");
    
    let finalSubjectId = subjectId;
    
    // Add new subject if triggered
    if (isAddingSubject && newSubjectName) {
      const newSubjId = `sub_${Date.now()}`;
      dispatch({ 
        type: 'SET_SUBJECTS', 
        payload: [...state.subjects, { 
           id: newSubjId, 
           code: newSubjectCode || newSubjectName.substring(0, 3).toUpperCase(),
           name: newSubjectName, 
           type: 'Core',
           maxDailyClasses: newSubjectDaily ? parseInt(newSubjectDaily) : undefined,
           maxWeeklyClasses: newSubjectWeekly ? parseInt(newSubjectWeekly) : undefined
        }]
      });
      finalSubjectId = newSubjId;
    }

    const tCode = code || name.substring(0, 3).toUpperCase();
    
    const newTeacher = {
      id: `t_manual_${Date.now()}`,
      name,
      code: tCode,
      designation,
      maxLoadPerDay: 5,
      defaultSubjectId: finalSubjectId
    };

    dispatch({ type: 'SET_TEACHERS', payload: [...state.teachers, newTeacher] });
    
    // Auto-create allocation
    dispatch({ 
      type: 'ADD_ALLOCATION', 
      payload: { id: `alloc_${Date.now()}`, classSectionId: '', subjectId: finalSubjectId, teacherId: newTeacher.id } 
    });

    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Add New Record</h2>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Teacher Name *</label>
            <input type="text" className="select-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" style={{ width: '100%', padding: '0.5rem' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Code (Auto if blank)</label>
              <input type="text" className="select-input" value={code} onChange={e => setCode(e.target.value)} placeholder="JOH" style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Designation</label>
              <input type="text" className="select-input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="PGT, TGT..." style={{ width: '100%', padding: '0.5rem' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Primary Subject *</label>
            
            {!isAddingSubject ? (
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <select className="select-input" value={subjectId} onChange={e => setSubjectId(e.target.value)} style={{ flex: 1, padding: '0.5rem' }}>
                   {state.subjects.map(s => (
                     <option key={s.id} value={s.id}>{s.name}</option>
                   ))}
                 </select>
                 <button className="btn" onClick={() => setIsAddingSubject(true)} title="Create New Subject" style={{ padding: '0.5rem' }}>
                    <Plus size={16} />
                 </button>
               </div>
            ) : (
               <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <input type="text" className="select-input" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="New Subject Name" style={{ flex: 1, padding: '0.5rem' }} autoFocus />
                   <input type="text" className="select-input" value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value)} placeholder="Code (e.g. MAT)" style={{ width: '100px', padding: '0.5rem' }} />
                   <button className="btn" onClick={() => setIsAddingSubject(false)} title="Cancel" style={{ padding: '0.5rem', background: '#f8fafc' }}>
                      <X size={16} />
                   </button>
                 </div>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <input type="number" className="select-input" value={newSubjectDaily} onChange={e => setNewSubjectDaily(e.target.value)} placeholder="Max Daily Limit (e.g. 2)" style={{ flex: 1, padding: '0.5rem' }} />
                   <input type="number" className="select-input" value={newSubjectWeekly} onChange={e => setNewSubjectWeekly(e.target.value)} placeholder="Max Weekly (e.g. 10)" style={{ flex: 1, padding: '0.5rem' }} />
                 </div>
               </div>
            )}
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose} style={{ border: '1px solid var(--border)' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> Add Record
          </button>
        </div>

      </div>
    </div>
  );
}
