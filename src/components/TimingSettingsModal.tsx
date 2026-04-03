import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';
import type { TimingMode, ClassGroup, TimeSlot } from '../types';

interface TimingSettingsModalProps {
  onClose: () => void;
}

export default function TimingSettingsModal({ onClose }: TimingSettingsModalProps) {
  const { state, dispatch } = useTimetable();
  
  const [activeGroup, setActiveGroup] = useState<ClassGroup>('VI-X');
  const [activeMode, setActiveMode] = useState<TimingMode>('Official');
  
  // Local state for editing to avoid massive renders
  const [editingSlots, setEditingSlots] = useState<TimeSlot[]>(
    JSON.parse(JSON.stringify(state.timeSlots[activeGroup][activeMode]))
  );

  // When group or mode changes, load the corresponding slots
  const handleTabChange = (group: ClassGroup, mode: TimingMode) => {
    setActiveGroup(group);
    setActiveMode(mode);
    setEditingSlots(JSON.parse(JSON.stringify(state.timeSlots[group][mode])));
  };

  const handleSlotChange = (index: number, field: keyof TimeSlot, value: string) => {
    const newSlots = [...editingSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditingSlots(newSlots);
  };

  const saveSettings = () => {
    dispatch({ 
      type: 'UPDATE_TIME_SLOTS', 
      payload: { group: activeGroup, mode: activeMode, slots: editingSlots }
    });
    alert('Time slots saved successfully!');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Timing Settings</h2>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
             <select className="select-input" value={activeGroup} onChange={(e) => handleTabChange(e.target.value as ClassGroup, activeMode)} style={{ flex: 1 }}>
               <option value="VI-X">Group: VI-X</option>
               <option value="XI-XII">Group: XI-XII</option>
             </select>
             <select className="select-input" value={activeMode} onChange={(e) => handleTabChange(activeGroup, e.target.value as TimingMode)} style={{ flex: 1 }}>
               <option value="Official">Mode: Official</option>
               <option value="Summer">Mode: Summer</option>
               <option value="Winter">Mode: Winter</option>
             </select>
             <button 
                className="btn" 
                onClick={() => {
                   localStorage.setItem('timetable_default_mode', activeMode);
                   alert(`Global Default Preset successfully set to: ${activeMode}! New sessions will now load this by default.`);
                }} 
                style={{ border: '1px solid var(--primary-color)', color: 'var(--primary-color)', background: '#f8fafc', whiteSpace: 'nowrap' }}
             >
                Set as Default Preset
             </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
               <div>Period / Break</div>
               <div>Start Time</div>
               <div>End Time</div>
             </div>

             {editingSlots.map((slot, index) => (
                <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: slot.isBreak ? 600 : 500, color: slot.isBreak ? 'var(--primary-color)' : 'var(--text-main)' }}>
                    {slot.isBreak ? 'Break' : `Period ${slot.name}`}
                  </div>
                  <input 
                    type="time" 
                    className="select-input" 
                    value={slot.startTime} 
                    onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                  />
                  <input 
                    type="time" 
                    className="select-input" 
                    value={slot.endTime} 
                    onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                  />
                </div>
             ))}
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose} style={{ border: '1px solid var(--border)' }}>Close</button>
          <button className="btn btn-primary" onClick={saveSettings}>
            <Save size={18} /> Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}
