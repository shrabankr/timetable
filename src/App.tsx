import React, { useState } from 'react';
import { useTimetable } from './store/TimetableContext';
import { Calendar, Settings, Zap, Users, ShieldAlert, GraduationCap } from 'lucide-react';
import TimetableGrid from './components/TimetableGrid';
import TeacherPanel from './components/TeacherPanel';
import Header from './components/Header';

function AppContent() {
  const { state, dispatch } = useTimetable();
  const [activeDay, setActiveDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="app-container">
      <div className="main-content">
        <Header activeDay={activeDay} setActiveDay={setActiveDay} days={days} />
        <div className="timetable-container" id="export-container" style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', margin: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          
          <div className="document-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ width: '50px', height: '50px', background: 'var(--primary-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <GraduationCap size={32} />
               </div>
               <div>
                  <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Heritage Public School</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Excellence in Global Education</p>
               </div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 600 }}>Daily Routine Timetable</h3>
               <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.1rem', fontWeight: 700 }}>{activeDay}</p>
            </div>
          </div>

          <TimetableGrid activeDay={activeDay} />
          
          <div className="document-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5rem', paddingTop: '1rem', pageBreakInside: 'avoid' }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #334155', width: '140px', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Timetable Incharge 1</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #334155', width: '140px', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Timetable Incharge 2</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #334155', width: '140px', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Vice Principal</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #334155', width: '140px', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Principal</div>
             </div>
          </div>

        </div>
      </div>
      <TeacherPanel activeDay={activeDay} />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
