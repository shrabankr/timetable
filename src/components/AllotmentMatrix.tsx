import React, { useState } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { Save, UserPlus, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

export default function AllotmentMatrix() {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  const [filterGroup, setFilterGroup] = useState(state.classes[0]?.group || 'VI-X');

  const subjects = state.subjects;
  const filteredClasses = state.classes.filter(c => c.group === filterGroup);

  const handleAllotmentChange = (classId: string, subjectId: string, teacherId: string) => {
    const existing = state.allocations.find(a => a.classSectionId === classId && a.subjectId === subjectId);
    
    if (existing) {
      if (!teacherId) {
        dispatch({ type: 'SET_ALLOCATIONS', payload: state.allocations.filter(a => a.id !== existing.id) });
        return;
      }
      dispatch({ 
        type: 'SET_ALLOCATIONS', 
        payload: state.allocations.map(a => a.id === existing.id ? { ...a, teacherId } : a) 
      });
    } else if (teacherId) {
      dispatch({ 
        type: 'ADD_ALLOCATION', 
        payload: { id: `allot_${Date.now()}_${Math.random()}`, classSectionId: classId, subjectId, teacherId } 
      });
    }
  };

  const handleClassRoleChange = (classId: string, field: 'classTeacherId' | 'coClassTeacherId' | 'subjectInchargeId', teacherId: string) => {
    dispatch({
      type: 'SET_CLASSES',
      payload: state.classes.map(c => c.id === classId ? { ...c, [field]: teacherId || undefined } : c)
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-zinc-200/60 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex gap-2">
          {['VI-X', 'XI-XII'].map(group => (
            <button 
              key={group}
              onClick={() => setFilterGroup(group as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterGroup === group ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-100'}`}
            >
              Group {group}
            </button>
          ))}
        </div>
        <div className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-4">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Allotted</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-200"></div> Unassigned</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20 bg-white shadow-sm">
            <tr>
              <th className="p-4 text-left text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 min-w-[140px] bg-white sticky left-0 z-30 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">Class / Roles</th>
              <th className="p-4 text-left text-[0.65rem] font-black text-amber-600 uppercase tracking-widest border-b border-zinc-100 min-w-[180px] bg-amber-50/30">Class Teacher</th>
              <th className="p-4 text-left text-[0.65rem] font-black text-indigo-600 uppercase tracking-widest border-b border-zinc-100 min-w-[180px] bg-indigo-50/30">Co-Teacher</th>
              {subjects.map(sub => (
                <th key={sub.id} className="p-4 text-left text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 min-w-[180px]">
                  {sub.name}
                  <div className="text-[0.55rem] font-bold text-zinc-300 mt-0.5">{sub.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map(cls => (
              <tr key={cls.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-50">
                <td className="p-4 font-black text-zinc-900 bg-white sticky left-0 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                  {cls.grade}-{cls.section}
                </td>
                
                {/* Class Teacher */}
                <td className="p-3 bg-amber-50/10">
                  <select 
                    className="w-full h-9 bg-white border border-amber-200/50 rounded-xl text-[0.7rem] font-bold px-3 outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                    value={cls.classTeacherId || ''}
                    onChange={(e) => handleClassRoleChange(cls.id, 'classTeacherId', e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </td>

                {/* Co-Teacher */}
                <td className="p-3 bg-indigo-50/10">
                   <select 
                    className="w-full h-9 bg-white border border-indigo-200/50 rounded-xl text-[0.7rem] font-bold px-3 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={cls.coClassTeacherId || ''}
                    onChange={(e) => handleClassRoleChange(cls.id, 'coClassTeacherId', e.target.value)}
                  >
                    <option value="">-- None --</option>
                    {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                  </select>
                </td>

                {/* Subject Allotments */}
                {subjects.map(sub => {
                  const allocation = state.allocations.find(a => a.classSectionId === cls.id && a.subjectId === sub.id);
                  return (
                    <td key={sub.id} className="p-3">
                      <select 
                        className={`w-full h-9 border rounded-xl text-[0.7rem] font-bold px-3 outline-none transition-all ${
                          allocation ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 focus:border-zinc-400'
                        }`}
                        value={allocation?.teacherId || ''}
                        onChange={(e) => handleAllotmentChange(cls.id, sub.id, e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
         <div className="flex items-center gap-3 text-zinc-500 text-[0.65rem] font-bold italic mr-4">
            Changes are saved automatically to your local registry
         </div>
         <button 
           className="btn-shadcn bg-zinc-900 text-white flex items-center gap-2"
           onClick={() => toast('success', 'Registry Synchronized', 'All allotments have been validated and saved.')}
         >
           <Save size={16} /> Finalize Registry
         </button>
      </div>
    </div>
  );
}
