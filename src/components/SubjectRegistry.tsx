import React, { useState } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  BookOpen, 
  Hash,
  AlertCircle
} from 'lucide-react';
import { useToast } from './Toast';
import type { Subject } from '../types';

export default function SubjectRegistry() {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newIsAdditional, setNewIsAdditional] = useState(false);

  const [editIsAdditional, setEditIsAdditional] = useState(false);

  const handleAdd = () => {
    if (!newName || !newCode) {
      toast('error', 'Missing Data', 'Please provide both a subject name and a short code.');
      return;
    }
    const id = `sub_${Date.now()}`;
    dispatch({ 
      type: 'SET_SUBJECTS', 
      payload: [...state.subjects, { id, name: newName, code: newCode.toUpperCase(), type: 'Core', isAdditional: newIsAdditional }] 
    });
    setNewName('');
    setNewCode('');
    setNewIsAdditional(false);
    toast('success', 'Subject Added', `${newName} has been added to the registry.`);
  };

  const handleDelete = (id: string, name: string) => {
    const allocationCount = state.allocations.filter(a => a.subjectId === id).length;
    const msg = allocationCount > 0 
      ? `This subject is allotted to ${allocationCount} classes. Deleting it will remove all those allotments. Proceed?`
      : `Are you sure you want to delete ${name}?`;

    if (window.confirm(msg)) {
      dispatch({ type: 'DELETE_SUBJECT', payload: id });
      toast('warning', 'Subject Removed', `${name} has been deleted.`);
    }
  };

  const startEditing = (s: Subject) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditCode(s.code);
    setEditIsAdditional(!!s.isAdditional);
  };

  const saveEdit = (id: string) => {
    dispatch({
      type: 'SET_SUBJECTS',
      payload: state.subjects.map(s => s.id === id ? { ...s, name: editName, code: editCode.toUpperCase(), isAdditional: editIsAdditional } : s)
    });
    setEditingId(null);
    toast('success', 'Registry Updated', 'Subject details have been synchronized.');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Subject Registry</h1>
           <p className="text-zinc-500 font-medium text-sm">Manage the global list of subjects and academic codes.</p>
        </div>
        <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
           <input 
             type="text" 
             placeholder="Subject Name" 
             className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-40"
             value={newName}
             onChange={e => setNewName(e.target.value)}
           />
           <input 
             type="text" 
             placeholder="Code" 
             className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 w-24 uppercase"
             value={newCode}
             onChange={e => setNewCode(e.target.value)}
           />
           <label className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={newIsAdditional} onChange={e => setNewIsAdditional(e.target.checked)} />
              <span className="text-[0.65rem] font-bold text-zinc-500 uppercase">Additional</span>
           </label>
           <button 
             onClick={handleAdd}
             className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
           >
             <Plus size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-zinc-100 rounded-3xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-100 text-left">
              <th className="p-4 text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Type</th>
              <th className="p-4 text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Subject Name</th>
              <th className="p-4 text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Short Code</th>
              <th className="p-4 text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">CBSE Category</th>
              <th className="p-4 text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.subjects.map(subject => (
              <tr key={subject.id} className="border-b border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                <td className="p-4 w-20">
                   <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <BookOpen size={16} />
                   </div>
                </td>
                <td className="p-4">
                  {editingId === subject.id ? (
                    <input 
                      className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold w-full outline-none focus:ring-4 focus:ring-indigo-500/5"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-black text-zinc-800">{subject.name}</span>
                  )}
                </td>
                <td className="p-4">
                  {editingId === subject.id ? (
                    <input 
                      className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold w-24 outline-none focus:ring-4 focus:ring-indigo-500/5 uppercase"
                      value={editCode}
                      onChange={e => setEditCode(e.target.value)}
                    />
                  ) : (
                    <span className="px-2 py-1 bg-zinc-100 text-zinc-500 text-[0.65rem] font-black rounded-md">{subject.code}</span>
                  )}
                </td>
                <td className="p-4">
                  {editingId === subject.id ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={editIsAdditional} onChange={e => setEditIsAdditional(e.target.checked)} />
                       <span className="text-xs font-bold text-zinc-500">6th Subject / Additional</span>
                    </label>
                  ) : (
                    subject.isAdditional ? (
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[0.6rem] font-black rounded-md border border-amber-100 uppercase tracking-tighter">Additional (6th)</span>
                    ) : (
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-400 text-[0.6rem] font-black rounded-md uppercase tracking-tighter">Main Subject</span>
                    )
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {editingId === subject.id ? (
                      <>
                        <button onClick={() => saveEdit(subject.id)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(subject)} className="p-2 hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(subject.id, subject.name)} className="p-2 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {state.subjects.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
             <BookOpen size={48} className="mb-4 opacity-10" />
             <p className="text-sm font-bold">No subjects defined in the registry.</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
         <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <AlertCircle size={20} />
         </div>
         <div>
            <h4 className="text-sm font-bold text-amber-900 mb-1">Administrative Note</h4>
            <p className="text-xs text-amber-700/80 font-medium leading-relaxed">
              Updates to subject names or codes are reflected globally across all existing schedules and allotment matrices. 
              Deleting a subject will permanently remove all associated class assignments.
            </p>
         </div>
      </div>
    </div>
  );
}
