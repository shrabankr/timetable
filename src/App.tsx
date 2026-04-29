import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings2,
  Table,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Sparkles,
  CheckCircle2,
  X,
  BookOpen,
  GraduationCap,
  Printer
} from 'lucide-react';
import { useTimetable } from './store/TimetableContext';
import TimetableGrid from './components/TimetableGrid';
import TeacherPanel from './components/TeacherPanel';
import Header from './components/Header';
import SettingsView from './components/SettingsView';
import FacultySidebar from './components/FacultySidebar';
import AllotmentMatrix from './components/AllotmentMatrix';
import SubjectRegistry from './components/SubjectRegistry';
import ClassRegistry from './components/ClassRegistry';
import PrintOptionsModal from './components/PrintOptionsModal';
import type { PrintConfig } from './components/PrintOptionsModal';
import PrintView from './components/PrintView';

type MainView = 'overview' | 'workspace' | 'allotment' | 'faculty' | 'administrative' | 'insights' | 'help' | 'subjects' | 'classes';

function AppContent() {
  const { state } = useTimetable();
  const [activeView, setActiveView] = useState<MainView>('workspace');
  
  const realToday = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const [activeDay, setActiveDay] = useState(realToday === 'Sunday' ? 'Monday' : realToday);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFacultyVisible, setIsFacultyVisible] = useState(true);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printConfig, setPrintConfig] = useState<PrintConfig | null>(null);

  const dashboardData = useMemo(() => {
    const todayAssignments = state.assignments.filter(a => a.day === realToday);
    let totalPossibleSlots = 0;
    state.classes.forEach(cls => {
       const groupSlots = state.timeSlots[cls.group];
       if (!groupSlots) return;
       const modeSlots = groupSlots[state.timingMode];
       if (!modeSlots) return;
       const slots = modeSlots.filter(s => !s.isBreak);
       totalPossibleSlots += slots.length;
    });

    const completeness = totalPossibleSlots === 0 ? 0 : Math.round((todayAssignments.length / totalPossibleSlots) * 100);

    return {
      todayStatus: todayAssignments.length,
      staffLoad: state.teachers.length,
      classCount: state.classes.length,
      completenessRate: Math.min(completeness, 100),
      totalPossibleSlots
    };
  }, [activeDay, state, realToday]);

  const mainLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'workspace', label: 'Scheduler', icon: Table },
    { id: 'allotment', label: 'Allotment', icon: Sparkles },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'faculty', label: 'Faculty', icon: Users },
  ];

  const utilityLinks = [
    { id: 'insights', label: 'Insights', icon: MonitorPlay },
    { id: 'help', label: 'Help', icon: CheckCircle2 },
    { id: 'administrative', label: 'Settings', icon: Settings2 },
  ];

  return (
    <div className="app-shell font-sans text-zinc-900 overflow-hidden bg-white">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} bg-white border-r border-zinc-100 flex flex-col shadow-sm transition-all duration-300`}>
        <div className="h-12 px-3 flex items-center justify-between border-b border-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-500 rounded flex items-center justify-center text-white overflow-hidden relative">
               <Sparkles size={12} className="relative z-10" />
            </div>
            {!isSidebarCollapsed && <h1 className="text-sm font-black text-zinc-900 tracking-tighter">RoutinePro</h1>}
          </div>
          {!isSidebarCollapsed && (
            <button onClick={() => setIsSidebarCollapsed(true)} className="p-1 hover:bg-zinc-100 rounded text-zinc-300 transition-colors">
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-4 px-1.5 space-y-0.5 overflow-y-auto scrollbar-none">
          {mainLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeView === link.id;
            return (
              <button
                key={link.id}
                className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group ${
                  isActive ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
                onClick={() => setActiveView(link.id as MainView)}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'} />
                {!isSidebarCollapsed && <span className={'text-xs ' + (isActive ? 'font-bold' : 'font-medium')}>{link.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="px-1.5 py-4 border-t border-zinc-50 space-y-0.5">
          {utilityLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeView === link.id;
            return (
              <button
                key={link.id}
                className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg transition-all group ${
                  isActive ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
                onClick={() => setActiveView(link.id as MainView)}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'} />
                  {!isSidebarCollapsed && <span className={'text-xs ' + (isActive ? 'font-bold' : 'font-medium')}>{link.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {isSidebarCollapsed && (
          <button onClick={() => setIsSidebarCollapsed(false)} className="p-3 border-t border-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors">
            <ChevronRight size={16} />
          </button>
        )}
      </aside>

      {/* MAIN CANVAS */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <section className="flex-1 overflow-y-auto flex flex-col relative scroll-smooth">
          {activeView === 'overview' && (
            <div className="animate-fade max-w-7xl mx-auto p-6 w-full">
               <div className="mb-6">
                 <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-1">Intelligence Dashboard</h1>
                 <p className="text-zinc-500 font-medium text-sm">Session {state.academicSession} Overview.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                   <div className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest mb-1">Allocations</div>
                   <div className="text-3xl font-black text-zinc-900">{dashboardData.todayStatus}</div>
                </div>
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                   <div className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest mb-1">Faculty</div>
                   <div className="text-3xl font-black text-zinc-900">{dashboardData.staffLoad}</div>
                </div>
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                   <div className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest mb-1">Health</div>
                   <div className="text-3xl font-black text-zinc-900">{dashboardData.completenessRate}%</div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'workspace' && (
            <div className="animate-fade flex flex-col h-full bg-white">
              <div className="p-2 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30 gap-2 relative z-50">
                 <div className="flex-1 min-w-0 flex items-center">
                   <Header activeDay={activeDay} setActiveDay={setActiveDay} days={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']} />
                 </div>
                 <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button 
                      onClick={() => setShowPrintOptions(true)}
                      className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors flex-shrink-0"
                      title="Print Center"
                    >
                        <Printer size={16} />
                    </button>
                    <div className="w-px h-4 bg-zinc-100 mx-1"></div>

                    <button onClick={() => setIsFacultyVisible(!isFacultyVisible)} className={`p-1.5 rounded-lg transition-colors ${isFacultyVisible ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-400 hover:bg-zinc-100'}`}>
                       <Users size={16} />
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto">
                <TimetableGrid activeDay={activeDay} />
              </div>
            </div>
          )}

          {activeView === 'allotment' && <AllotmentMatrix />}
          {activeView === 'faculty' && <div className="p-4"><TeacherPanel activeDay={activeDay} /></div>}
          {activeView === 'classes' && <div className="p-4"><ClassRegistry /></div>}
          {activeView === 'subjects' && <div className="p-4"><SubjectRegistry /></div>}
          {activeView === 'administrative' && <div className="p-6"><SettingsView /></div>}
        </section>
      </main>

      {activeView === 'workspace' && isFacultyVisible && (
        <aside className="hidden xl:flex w-[160px] bg-white border-l border-zinc-100 flex-col h-screen z-10 flex-shrink-0">
           <div className="h-10 px-3 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
              <h3 className="font-bold text-[0.65rem] text-zinc-500 uppercase tracking-widest">Resources</h3>
              <button onClick={() => setIsFacultyVisible(false)} className="p-1 hover:bg-rose-50 rounded text-zinc-300 hover:text-rose-500">
                <X size={14} />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto">
              <FacultySidebar activeDay={activeDay} />
           </div>
        </aside>
      )}
 
      {showPrintOptions && (
        <PrintOptionsModal 
          activeDay={activeDay} 
          onClose={() => setShowPrintOptions(false)} 
          onPrint={(config) => {
            setPrintConfig(config);
            setShowPrintOptions(false);
          }}
        />
      )}

      {printConfig && (
        <PrintView 
          config={printConfig} 
          onClose={() => setPrintConfig(null)} 
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
