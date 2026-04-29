import React, { useState } from 'react';
import { X, Printer, Calendar, Users, GraduationCap, FileText, CheckCircle2 } from 'lucide-react';
import { useTimetable } from '../store/TimetableContext';

interface PrintOptionsModalProps {
  activeDay: string;
  onClose: () => void;
  onPrint: (options: PrintConfig) => void;
}

export interface PrintConfig {
  type: 'daily' | 'master_class' | 'master_teacher' | 'individual_teacher';
  day?: string;
  group?: 'all' | 'VI-X' | 'XI-XII';
  teacherId?: string;
}

export default function PrintOptionsModal({ activeDay, onClose, onPrint }: PrintOptionsModalProps) {
  const { state } = useTimetable();
  const [selectedType, setSelectedType] = useState<PrintConfig['type']>('daily');
  const [selectedGroup, setSelectedGroup] = useState<PrintConfig['group']>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');

  const printOptions = [
    { id: 'daily', label: "Today's Schedule", icon: Calendar, description: `Print the complete grid for ${activeDay}` },
    { id: 'master_class', label: "Master Class Timetable", icon: GraduationCap, description: "Full week schedule grouped by grade/section" },
    { id: 'master_teacher', label: "Master Teacher Timetable", icon: Users, description: "Full week schedule grouped by faculty member" },
    { id: 'individual_teacher', label: "Teacher-wise Slips", icon: FileText, description: "Individual schedule slips for each teacher" },
  ];

  const handlePrint = () => {
    onPrint({
      type: selectedType,
      day: selectedType === 'daily' ? activeDay : undefined,
      group: selectedGroup,
      teacherId: selectedTeacherId === 'all' ? undefined : selectedTeacherId
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container max-w-xl animate-fade">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 text-white rounded-xl">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 leading-none mb-1">Print Center</h2>
              <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Select report configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Print Types */}
          <div className="grid grid-cols-2 gap-4">
            {printOptions.map(opt => {
              const Icon = opt.icon;
              const isActive = selectedType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedType(opt.id as PrintConfig['type'])}
                  className={`p-4 text-left rounded-[2rem] border-2 transition-all group ${
                    isActive ? 'border-zinc-900 bg-zinc-950 text-white shadow-xl shadow-zinc-900/20' : 'border-zinc-100 bg-white hover:border-zinc-300'
                  }`}
                >
                  <Icon size={24} className={`mb-3 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                  <div className={`text-xs font-black uppercase tracking-widest mb-1 ${isActive ? 'text-zinc-400' : 'text-zinc-900'}`}>{opt.label}</div>
                  <div className={`text-[0.6rem] font-medium leading-relaxed ${isActive ? 'text-zinc-500' : 'text-zinc-400'}`}>{opt.description}</div>
                </button>
              );
            })}
          </div>

          {/* Contextual Settings */}
          <div className="space-y-6 pt-4 border-t border-zinc-100">
            {selectedType === 'daily' && (
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Filter by Group</label>
                <div className="flex gap-2">
                  {['all', 'VI-X', 'XI-XII'].map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g as PrintConfig['group'])}
                      className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase transition-all ${
                        selectedGroup === g ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                      }`}
                    >
                      {g === 'all' ? 'Full School' : g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedType === 'individual_teacher' && (
              <div className="space-y-3">
                <label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Select Teacher</label>
                <select 
                  className="w-full bg-zinc-100 border-none rounded-xl p-3 text-xs font-bold text-zinc-900"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  <option value="all">All Teachers (Individual Slips)</option>
                  {state.teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-zinc-50 rounded-b-3xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handlePrint}
            className="px-8 py-2.5 bg-zinc-900 text-white text-[0.65rem] font-black rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center gap-2"
          >
            <Printer size={14} /> Generate Print View
          </button>
        </div>
      </div>
    </div>
  );
}
