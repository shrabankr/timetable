import { useState } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { useToast } from './Toast';
import { Settings, Clock, Users, Building, AlertTriangle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import TimingArchitect from './TimingArchitect';
import ClassRegistry from './ClassRegistry';

export default function SettingsView() {
  const { state, dispatch } = useTimetable();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'identity' | 'sessions' | 'schedules' | 'faculty' | 'constraints'>('identity');

  // Local state for School Identity
  const [schoolName, setSchoolName] = useState(state.schoolSettings.organizationName);
  const [tagline, setTagline] = useState(state.schoolSettings.organizationTagline);

  // Local state for Sessions
  const [newSession, setNewSession] = useState('');

  // Local state for class-subject limits
  const [limitGrade, setLimitGrade] = useState('ALL');
  const [limitSubject, setLimitSubject] = useState(state.subjects[0]?.id || '');
  const [limitDaily, setLimitDaily] = useState(2);
  const [limitWeekly, setLimitWeekly] = useState(6);

  const saveIdentity = () => {
    dispatch({ 
      type: 'SET_SCHOOL_SETTINGS', 
      payload: { ...state.schoolSettings, organizationName: schoolName, organizationTagline: tagline } 
    });
    toast('success', 'Identity Saved', 'School branding has been updated.');
  };

  const handleCreateSession = () => {
    const sessionName = newSession.trim();
    if (!sessionName) return;
    if (!state.sessions.includes(sessionName)) {
      dispatch({ type: 'SET_ACADEMIC_SESSIONS', payload: [...state.sessions, sessionName] });
      toast('success', 'Session Created', `Academic session ${sessionName} is now available.`);
    } else {
      toast('warning', 'Duplicate Session', 'This session already exists.');
    }
    setNewSession('');
  };

  const handleDeleteSession = (session: string) => {
    if (session === state.academicSession) {
      toast('error', 'Cannot Delete', 'You cannot delete the currently active session.');
      return;
    }
    dispatch({ type: 'SET_ACADEMIC_SESSIONS', payload: state.sessions.filter(s => s !== session) });
    toast('info', 'Session Removed', `Session ${session} has been removed.`);
  };

  const switchSession = (session: string) => {
    dispatch({ type: 'SET_ACADEMIC_SESSION', payload: session });
    toast('success', 'Session Switched', `Now working in ${session} session.`);
  };

  const updateConstraint = (key: keyof typeof state.constraints, value: number | boolean) => {
    dispatch({ 
      type: 'SET_CONSTRAINTS', 
      payload: { ...state.constraints, [key]: value } 
    });
  };

  const restoreConstraints = () => {
    // Dynamically import default constraints to avoid circular dependency issues at top level
    import('../data/mockData').then((module) => {
      dispatch({ type: 'SET_CONSTRAINTS', payload: module.defaultConstraints });
      dispatch({ type: 'SET_CLASS_SUBJECT_LIMITS', payload: [] });
      toast('success', 'Defaults Restored', 'All workload limits have been reset to factory defaults.');
    });
  };

  const addClassSubjectLimit = () => {
    if (!limitSubject) return;
    const newLimit = {
      id: `csl_${Date.now()}`,
      grade: limitGrade,
      subjectId: limitSubject,
      maxDaily: limitDaily,
      maxWeekly: limitWeekly
    };
    dispatch({ type: 'SET_CLASS_SUBJECT_LIMITS', payload: [...state.classSubjectLimits, newLimit] });
    toast('success', 'Limit Added', 'Class-subject constraint has been added.');
  };

  const removeClassSubjectLimit = (id: string) => {
    dispatch({ type: 'SET_CLASS_SUBJECT_LIMITS', payload: state.classSubjectLimits.filter(l => l.id !== id) });
  };

  return (
    <div className="flex h-full bg-[#f8fafc]">
      {/* Settings Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">System Settings</h2>
        <nav className="space-y-2">
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'identity' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('identity')}
          >
            <Building size={18} />
            Institutional Profile
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'sessions' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('sessions')}
          >
            <Settings size={18} />
            Academic Sessions
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'schedules' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('schedules')}
          >
            <Clock size={18} />
            Time Schedules
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'faculty' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('faculty')}
          >
            <Users size={18} />
            Faculty & Registry
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'constraints' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('constraints')}
          >
            <ShieldAlert size={18} />
            Workload Limits
          </button>
        </nav>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className={`${activeTab === 'schedules' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto`}>
          {activeTab === 'identity' && (
            <div className="card-shadcn animate-fade">
              <h3 className="text-xl font-bold mb-6 text-slate-800">School Identity Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Organization Name</label>
                  <input 
                    type="text" 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tagline / Motto</label>
                  <input 
                    type="text" 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button className="btn-shadcn" onClick={saveIdentity}>Save Identity Configurations</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="card-shadcn animate-fade">
              <h3 className="text-xl font-bold mb-6 text-slate-800">Academic Sessions</h3>
              <p className="text-sm text-slate-500 mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                Academic sessions traditionally run from <strong>April 1st</strong> to <strong>March 31st</strong> of the following year. 
                You can customize the exact duration below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Session Start Date</label>
                  <input 
                    type="date" 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    value={state.sessionStartDate}
                    onChange={(e) => dispatch({ type: 'UPDATE_SESSION_DATES', payload: { start: e.target.value, end: state.sessionEndDate } })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Session End Date</label>
                  <input 
                    type="date" 
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    value={state.sessionEndDate}
                    onChange={(e) => dispatch({ type: 'UPDATE_SESSION_DATES', payload: { start: state.sessionStartDate, end: e.target.value } })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mb-8 border-t border-slate-100 pt-8">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-2">New Session Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 2026-2027"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                    value={newSession}
                    onChange={(e) => setNewSession(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                  />
                </div>
                <div className="flex items-end">
                  <button className="btn-shadcn h-11" onClick={handleCreateSession}>
                    <Plus size={18} /> Create Session
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {state.sessions.map(session => {
                  const isActive = session === state.academicSession;
                  return (
                    <div key={session} className={`flex items-center justify-between p-4 rounded-xl border ${isActive ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                      <div>
                        <span className="font-bold text-slate-800 text-lg mr-3">{session}</span>
                        {isActive && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">Active</span>}
                      </div>
                      <div className="flex gap-3">
                        {!isActive && (
                          <button 
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            onClick={() => switchSession(session)}
                          >
                            Switch to Session
                          </button>
                        )}
                        <button 
                          className={`p-2 rounded-lg transition-colors ${isActive ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                          title={isActive ? "Cannot delete active session" : "Delete session"}
                          onClick={() => handleDeleteSession(session)}
                          disabled={isActive}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="card-shadcn animate-fade">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Time Schedules</h3>
              </div>
              <div className="mb-10">
                <TimingArchitect />
              </div>
            </div>
          )}

          {activeTab === 'faculty' && (
            <div className="card-shadcn animate-fade max-w-6xl">
               <div className="mb-8">
                 <h3 className="text-xl font-bold text-slate-800">Faculty & Class Registry</h3>
                 <p className="text-sm text-slate-500 mt-1">
                   Manage your institution's academic structure, teacher assignments, and section merges in one place.
                 </p>
               </div>
               <ClassRegistry />
            </div>
          )}

          {activeTab === 'constraints' && (
            <div className="card-shadcn animate-fade">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">Advanced Workload Constraints</h3>
                 <button className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" onClick={restoreConstraints}>
                   Restore Defaults
                 </button>
               </div>
               <p className="text-sm text-slate-500 mb-8 max-w-2xl">
                 Modify the algorithmic limits used by the auto-generation engine to prevent teacher fatigue and ensure compliance.
               </p>

               <div className="space-y-8">
                 <section>
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Continuous Teaching Limits (Periods)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <label className="block text-xs font-bold text-slate-700 mb-2">Junior / Middle (VI-X)</label>
                       <input type="number" min="1" max="8" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxContiguousV_X || 3} onChange={e => updateConstraint('maxContiguousV_X', parseInt(e.target.value))} />
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <label className="block text-xs font-bold text-slate-700 mb-2">Senior (XI-XII)</label>
                       <input type="number" min="1" max="8" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxContiguousXI_XII || 2} onChange={e => updateConstraint('maxContiguousXI_XII', parseInt(e.target.value))} />
                     </div>
                   </div>
                 </section>

                 <section>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Mixed Group Logic (Minutes)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Max Contiguous Time (Mixed)</label>
                        <input type="number" step="10" min="30" max="300" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxContiguousTimeMixed || 120} onChange={e => updateConstraint('maxContiguousTimeMixed', parseInt(e.target.value))} />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Mandatory Gap After (Mixed)</label>
                        <input type="number" step="5" min="0" max="60" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.minGapAfterContiguousMixed || 30} onChange={e => updateConstraint('minGapAfterContiguousMixed', parseInt(e.target.value))} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Daily Maximum Workloads (M-F)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">VI-X Max Daily Periods</label>
                        <input type="number" min="1" max="10" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxDailyPeriodsV_X || 8} onChange={e => updateConstraint('maxDailyPeriodsV_X', parseInt(e.target.value))} />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">XI-XII Max Daily Periods</label>
                        <input type="number" min="1" max="10" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxDailyPeriodsXI_XII || 5} onChange={e => updateConstraint('maxDailyPeriodsXI_XII', parseInt(e.target.value))} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Saturday Specific Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">VI-X Saturday Max Periods</label>
                        <input type="number" min="1" max="10" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxDailyPeriodsV_X_Sat || 8} onChange={e => updateConstraint('maxDailyPeriodsV_X_Sat', parseInt(e.target.value))} />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">XI-XII Saturday Max Periods</label>
                        <input type="number" min="1" max="10" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxDailyPeriodsXI_XII_Sat || 3} onChange={e => updateConstraint('maxDailyPeriodsXI_XII_Sat', parseInt(e.target.value))} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Mixed Teaching Intensity (Weekly)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Max Daily Minutes (Mixed)</label>
                        <input type="number" step="10" min="60" max="400" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxDailyTimeMixed || 240} onChange={e => updateConstraint('maxDailyTimeMixed', parseInt(e.target.value))} />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Max Weekly Minutes (Mixed)</label>
                        <input type="number" step="10" min="600" max="2000" className="w-full px-3 py-2 border border-slate-200 rounded-lg" value={state.constraints?.maxWeeklyTimeMixed || 1280} onChange={e => updateConstraint('maxWeeklyTimeMixed', parseInt(e.target.value))} />
                      </div>
                    </div>
                  </section>

                 <section>
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Strict Rules</h4>
                   <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                     <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" checked={state.constraints?.enforceClassTeacherZeroPeriod ?? true} onChange={e => updateConstraint('enforceClassTeacherZeroPeriod', e.target.checked)} />
                     <div>
                       <div className="text-sm font-bold text-slate-800">Enforce Period 0 for Class Teachers</div>
                       <div className="text-xs font-medium text-slate-500">Only the assigned class teacher can take the first period (0 period).</div>
                     </div>
                   </label>
                 </section>

                 <section>
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Class-Subject Curriculum Limits</h4>
                   
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                     <div className="flex flex-wrap gap-3 items-end">
                       <div className="flex-1 min-w-[120px]">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                         <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={limitGrade} onChange={e => setLimitGrade(e.target.value)}>
                           <option value="ALL">All Grades</option>
                           {Array.from(new Set(state.classes.map(c => c.grade))).map(g => (
                             <option key={g} value={g}>Grade {g}</option>
                           ))}
                         </select>
                       </div>
                       <div className="flex-1 min-w-[150px]">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                         <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={limitSubject} onChange={e => setLimitSubject(e.target.value)}>
                           {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                       </div>
                       <div className="w-24">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Max Daily</label>
                         <input type="number" min="1" max="10" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={limitDaily} onChange={e => setLimitDaily(parseInt(e.target.value))} />
                       </div>
                       <div className="w-24">
                         <label className="block text-xs font-bold text-slate-700 mb-1">Max Weekly</label>
                         <input type="number" min="1" max="9" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={limitWeekly} onChange={e => setLimitWeekly(parseInt(e.target.value))} />
                       </div>
                       <button className="h-[38px] px-4 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition-colors" onClick={addClassSubjectLimit}>
                         Add Limit
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     {state.classSubjectLimits?.map(limit => {
                        const subj = state.subjects.find(s => s.id === limit.subjectId);
                        return (
                          <div key={limit.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                            <div>
                               <span className="font-bold text-slate-800 text-sm mr-2">{limit.grade === 'ALL' ? 'Global' : `Grade ${limit.grade}`}</span>
                               <span className="text-xs font-black px-2 py-1 bg-slate-100 text-slate-600 rounded-md mr-4">{subj?.name}</span>
                               <span className="text-xs text-slate-500 font-medium">Daily: <strong className="text-slate-800">{limit.maxDaily}</strong> | Weekly: <strong className="text-slate-800">{limit.maxWeekly}</strong></span>
                            </div>
                            <button onClick={() => removeClassSubjectLimit(limit.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        )
                     })}
                     {!state.classSubjectLimits?.length && (
                        <p className="text-xs text-slate-400 font-medium text-center py-4 bg-white border border-slate-100 rounded-xl border-dashed">
                          No custom class-subject limits set. Defaults (Daily 2, Weekly 6) will apply.
                        </p>
                     )}
                   </div>
                 </section>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
