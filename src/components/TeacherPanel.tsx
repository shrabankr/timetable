import React, { useRef } from 'react';
import { useTimetable } from '../store/TimetableContext';
import { Users, GripVertical, Upload, Download, Edit2, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Teacher } from '../types';
import AddTeacherModal from './AddTeacherModal';

export default function TeacherPanel({ activeDay }: { activeDay: string }) {
  const { state, dispatch } = useTimetable();
  const [showAddModal, setShowAddModal] = React.useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, teacherId: string) => {
    e.dataTransfer.setData('teacherId', teacherId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const processUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const newTeachers: Teacher[] = results.data.map((row: any, i) => ({
            id: `t_up_${Date.now()}_${i}`,
            code: row.Code || row.code || `T${i}`,
            name: row.Name || row.name || `Uploaded Teacher ${i}`,
            maxLoadPerDay: parseInt(row.MaxLoad || row.maxLoad) || 5
          })).filter(t => t.name); // basic filter
          
          dispatch({ type: 'SET_TEACHERS', payload: [...state.teachers, ...newTeachers] });
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newTeachers: Teacher[] = data.map((row: any, i) => ({
           id: `t_up_${Date.now()}_${i}`,
           code: row.Code || row.code || `T${i}`,
           name: row.Name || row.name || `Uploaded Teacher ${i}`,
           maxLoadPerDay: parseInt(row.MaxLoad || row.maxLoad) || 5
        })).filter(t => t.name);

        dispatch({ type: 'SET_TEACHERS', payload: [...state.teachers, ...newTeachers] });
      };
      reader.readAsBinaryString(file);
    }
    
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportTeachersCSV = () => {
    const csvData = state.teachers.map(t => ({
      Code: t.code,
      Name: t.name,
      Designation: t.designation || '',
      MaxLoad: t.maxLoadPerDay
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteTeacher = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete teacher ${name}? This will remove all their assignments!`)) {
      // Clean up assignments
      state.assignments.forEach(a => {
        if (a.teacherId === id) dispatch({ type: 'REMOVE_ASSIGNMENT', payload: a.id });
      });
      // Delete Teacher
      dispatch({ type: 'SET_TEACHERS', payload: state.teachers.filter(t => t.id !== id) });
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users className="text-primary-color" size={20} />
          Teachers
        </div>
        <input 
           type="file" 
           accept=".csv, .xlsx, .xls" 
           ref={fileInputRef} 
           style={{ display: 'none' }} 
           onChange={processUpload} 
        />
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
             className="btn" 
             style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
             onClick={() => setShowAddModal(true)}
             title="Add New Teacher / Subject manually"
          >
            <Users size={16} /> Add
          </button>
          <button 
             className="btn" 
             style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
             onClick={() => fileInputRef.current?.click()}
             title="Upload Teachers (CSV/Excel)"
          >
            <Upload size={16} /> Imp
          </button>
          <button 
             className="btn" 
             style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
             onClick={exportTeachersCSV}
             title="Export Teachers (CSV)"
          >
            <Download size={16} /> Exp
          </button>
        </div>
      </div>
      <div className="teacher-list">
        {state.teachers.map(teacher => {
          // Calculate active workload
          const workload = state.assignments.filter(
            a => a.teacherId === teacher.id && a.day === activeDay
          ).length;
          
          const maxLoad = teacher.maxLoadPerDay;
          const isOverloaded = workload >= maxLoad;

          return (
            <div 
              key={teacher.id} 
              className="teacher-card"
              draggable
              onDragStart={(e) => handleDragStart(e, teacher.id)}
            >
              <div className="teacher-card-heading">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GripVertical size={16} color="#94a3b8" />
                  <span className="teacher-code">{teacher.code}</span>
                </div>
                <span className={`badge ${isOverloaded ? 'error' : 'success'}`}>
                  {workload} / {maxLoad}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                   <button className="icon-btn" style={{ padding: '0.1rem' }} onClick={(e) => { e.stopPropagation(); /* NOTE: Edit modal to be wired */ }} title="Edit">
                     <Edit2 size={12} color="#64748b" />
                   </button>
                   <button className="icon-btn" style={{ padding: '0.1rem' }} onClick={(e) => { e.stopPropagation(); deleteTeacher(teacher.id, teacher.name); }} title="Delete">
                     <Trash2 size={12} color="#ef4444" />
                   </button>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, paddingLeft: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{teacher.name}</span>
                {teacher.designation && <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{teacher.designation}</span>}
              </div>
              <div style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {teacher.defaultSubjectId ? (
                   <span>Primary: <strong>{state.subjects.find(s => s.id === teacher.defaultSubjectId)?.name}</strong></span>
                ) : (
                   <span>Subjects: {
                     Array.from(new Set(state.allocations.filter(a => a.teacherId === teacher.id).map(a => 
                       state.subjects.find(s => s.id === a.subjectId)?.name
                     ))).filter(Boolean).join(', ') || 'Unassigned'
                   }</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showAddModal && <AddTeacherModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
