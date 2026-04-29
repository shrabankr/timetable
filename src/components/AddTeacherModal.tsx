import { useState } from 'react';
import { X, Save, Plus, Trash2, ShieldCheck, Briefcase } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import { useToast } from './Toast';
import type { Teacher } from '../types';

interface AddTeacherModalProps {
  onClose: () => void;
  teacherId?: string; // If provided, we are in EDIT mode
}

export default function AddTeacherModal({ onClose, teacherId }: AddTeacherModalProps) {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  
  const editingTeacher = teacherId ? state.teachers.find(t => t.id === teacherId) : null;

  const [name, setName] = useState(editingTeacher?.name || '');
  const [code, setCode] = useState(editingTeacher?.code || '');
  const [designation, setDesignation] = useState(editingTeacher?.designation || '');
  const [maxLoadPerDay, setMaxLoadPerDay] = useState(editingTeacher?.maxLoadPerDay || 5);
  const [subjectId, setSubjectId] = useState(editingTeacher?.defaultSubjectId || state.subjects[0]?.id || '');
  
  // Responsibilities
  const [responsibilities, setResponsibilities] = useState<string[]>(editingTeacher?.responsibilities || []);
  const [newResp, setNewResp] = useState('');

  // Class-wise Incharge Roles
  const [inchargeRoles, setInchargeRoles] = useState<{ classId: string; role: string }[]>(editingTeacher?.inchargeRoles || []);
  const [selectedClass, setSelectedClass] = useState(state.classes[0]?.id || '');
  const [selectedRole, setSelectedRole] = useState('Subject Incharge');

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const handleAddResp = () => {
    if (newResp.trim() && !responsibilities.includes(newResp.trim())) {
      setResponsibilities([...responsibilities, newResp.trim()]);
      setNewResp('');
    }
  };

  const handleAddRole = () => {
    if (selectedClass && selectedRole) {
      // Prevent duplicate class roles
      if (inchargeRoles.some(r => r.classId === selectedClass)) {
        toast('warning', 'Duplicate Role', 'Teacher already has a role assigned for this class.');
        return;
      }
      setInchargeRoles([...inchargeRoles, { classId: selectedClass, role: selectedRole }]);
    }
  };

  const handleRemoveRole = (classId: string) => {
    setInchargeRoles(inchargeRoles.filter(r => r.classId !== classId));
  };

  const handleSave = () => {
    if (!name) {
      toast('error', 'Missing Fields', 'Teacher name is required.');
      return;
    }
    
    let finalSubjectId = subjectId;
    
    if (isAddingSubject && newSubjectName) {
      const newSubjId = `sub_${Date.now()}`;
      dispatch({ 
        type: 'SET_SUBJECTS', 
        payload: [...state.subjects, { 
           id: newSubjId, 
           code: newSubjectCode || newSubjectName.substring(0, 3).toUpperCase(),
           name: newSubjectName, 
           type: 'Core'
        }]
      });
      finalSubjectId = newSubjId;
    }

    const tCode = (code || name.substring(0, 3)).toUpperCase();
    
    const teacherData: Teacher = {
      id: editingTeacher?.id || `t_manual_${Date.now()}`,
      name,
      code: tCode,
      designation,
      maxLoadPerDay,
      defaultSubjectId: finalSubjectId,
      responsibilities,
      inchargeRoles
    };

    if (editingTeacher) {
      dispatch({ 
        type: 'SET_TEACHERS', 
        payload: state.teachers.map(t => t.id === editingTeacher.id ? teacherData : t) 
      });
      toast('success', 'Profile Updated', `${name}'s professional profile has been saved.`);
    } else {
      dispatch({ type: 'SET_TEACHERS', payload: [...state.teachers, teacherData] });
      toast('success', 'Faculty Added', `${name} (${tCode}) has been added to the registry.`);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container w-[95%] max-w-[600px] animate-fade">
        
        <div className="modal-header">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Briefcase size={20} />
             </div>
             <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">{editingTeacher ? 'Update Faculty Profile' : 'New Faculty Registry'}</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{editingTeacher ? 'Staff ID: ' + editingTeacher.id : 'Academic Resource'}</p>
             </div>
          </div>
          <button className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-8 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin">
          
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="modal-label">Full Name *</label>
                <input type="text" className="modal-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="modal-label">Employee Code / Shortname</label>
                <input type="text" className="modal-input uppercase" value={code} onChange={e => setCode(e.target.value)} placeholder="JOH" />
              </div>
              <div>
                <label className="modal-label">Max Load / Day</label>
                <input type="number" min="1" max="10" className="modal-input" value={maxLoadPerDay} onChange={e => setMaxLoadPerDay(parseInt(e.target.value) || 5)} />
              </div>
              <div className="md:col-span-2">
                <label className="modal-label">Designation</label>
                <input type="text" className="modal-input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="PGT (Math), TGT..." />
              </div>
            </div>
          </section>

          {/* Primary Subject */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Subject Expertise</h3>
            {!isAddingSubject ? (
               <div className="flex gap-2">
                 <select className="modal-select flex-1" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                   <option value="">-- Select Primary Subject --</option>
                   {state.subjects.map(s => (
                     <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                   ))}
                 </select>
                 <button className="w-10 h-10 flex items-center justify-center border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-400" onClick={() => setIsAddingSubject(true)}>
                    <Plus size={18} />
                 </button>
               </div>
            ) : (
               <div className="flex gap-2 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
                 <input type="text" className="modal-input flex-1" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Subject Name" autoFocus />
                 <input type="text" className="modal-input w-24" value={newSubjectCode} onChange={e => setNewSubjectCode(e.target.value)} placeholder="Code" />
                 <button className="w-10 h-10 flex items-center justify-center text-zinc-400" onClick={() => setIsAddingSubject(false)}><X size={18} /></button>
               </div>
            )}
          </section>

          {/* Class-wise Incharge Roles */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Class-wise Incharge Roles</h3>
            <div className="flex gap-2">
              <select className="modal-select flex-1" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {state.classes.map(c => <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>)}
              </select>
              <select className="modal-select flex-1" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                <option value="Subject Incharge">Subject Incharge</option>
                <option value="Exam Incharge">Exam Incharge</option>
                <option value="Activity Incharge">Activity Incharge</option>
                <option value="Coordinator">Coordinator</option>
              </select>
              <button className="btn-primary-modal !w-auto px-4" onClick={handleAddRole}>Assign</button>
            </div>
            <div className="space-y-2">
              {inchargeRoles.map(role => {
                const cls = state.classes.find(c => c.id === role.classId);
                return (
                  <div key={role.classId} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                       <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm"><ShieldCheck size={14} /></div>
                       <span className="text-xs font-bold text-zinc-700">{cls?.grade}-{cls?.section}</span>
                       <span className="text-xs font-medium text-zinc-400">—</span>
                       <span className="text-xs font-bold text-indigo-600">{role.role}</span>
                    </div>
                    <button onClick={() => handleRemoveRole(role.classId)} className="text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                );
              })}
              {inchargeRoles.length === 0 && <p className="text-[0.7rem] text-zinc-400 italic text-center py-2">No class-wise roles assigned.</p>}
            </div>
          </section>

          {/* Responsibilities */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Other Responsibilities</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="modal-input flex-1" 
                value={newResp} 
                onChange={e => setNewResp(e.target.value)} 
                placeholder="e.g. Exam Cell, HOD Math" 
                onKeyDown={e => e.key === 'Enter' && handleAddResp()}
              />
              <button className="btn-primary-modal !w-auto px-4" onClick={handleAddResp}>Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {responsibilities.map(resp => (
                <span key={resp} className="flex items-center gap-2 px-3 py-1.5 bg-white text-zinc-700 text-[0.7rem] font-bold rounded-xl border border-zinc-200 group hover:border-rose-200 hover:bg-rose-50 transition-all">
                  {resp}
                  <button onClick={() => setResponsibilities(responsibilities.filter(r => r !== resp))} className="text-zinc-300 hover:text-rose-500"><X size={12} /></button>
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary-modal" onClick={onClose}>Cancel</button>
          <button className="btn-primary-modal" onClick={handleSave}>
            <Save size={18} /> {editingTeacher ? 'Update Profile' : 'Save Faculty'}
          </button>
        </div>

      </div>
    </div>
  );
}
