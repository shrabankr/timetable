import React from 'react';
import { useTimetable } from '../store/TimetableContext';
import type { Assignment, ClassSection, ClassGroup } from '../types';
import { validateAssignment } from '../utils/engine';

interface TimetableGridProps {
  activeDay: string;
}

export default function TimetableGrid({ activeDay }: TimetableGridProps) {
  const { state, dispatch } = useTimetable();

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, classId: string, slotId: string) => {
    e.preventDefault();
    const teacherId = e.dataTransfer.getData('teacherId');
    if (!teacherId) return;

    // Prevent modifying locked slots
    const existingAssignment = state.assignments.find(
       a => a.day === activeDay && a.slotId === slotId && a.classSectionId === classId
    );
    if (existingAssignment?.isLocked) {
       alert("This period is permanently locked and cannot be changed manually.");
       return;
    }

    // Based on class and teacher, what subject? We need an allocation.
    const cls = state.classes.find(c => c.id === classId);
    if (!cls) return;

    let subjectToAssign = state.subjects[0].id; // Fallback to first subject

    // Look if teacher has an allocation for this class
    const allocations = state.allocations.filter(a => a.teacherId === teacherId && a.classSectionId === classId);
    
    // Also fetch raw teacher properties for new defaultSubjectId mapping
    const teacherInfo = state.teachers.find(t => t.id === teacherId);

    if (allocations.length > 0) {
       subjectToAssign = allocations[0].subjectId;
    } else if (teacherInfo && teacherInfo.defaultSubjectId) {
       // Deep preferred fallback (Added manually via UI)
       subjectToAssign = teacherInfo.defaultSubjectId;
    } else {
       // If no allocation for specific class, take the teacher's known subjects or default
       const teacherAllocs = state.allocations.filter(a => a.teacherId === teacherId);
       if (teacherAllocs.length > 0) {
           subjectToAssign = teacherAllocs[0].subjectId;
       }
    }

    const newAssignment: Assignment = {
      id: `manual_${Date.now()}`,
      day: activeDay,
      slotId,
      classSectionId: classId,
      subjectId: subjectToAssign,
      teacherId,
      isLocked: true
    };

    const validation = validateAssignment(state, newAssignment);
    
    if (!validation.isValid && validation.type === 'error') {
       alert(`Cannot assign: ${validation.message}`);
       return;
    } 

    if (validation.type === 'warning') {
       if(!window.confirm(`⚠️ CONFLICT DETECTED: ${validation.message}\n\nPlease confirm this allocation has been explicitly authorized by the Authority before proceeding.`)) {
         return;
       }
    }

    dispatch({ type: 'ADD_ASSIGNMENT', payload: newAssignment });
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
  };

  const renderTableForGroup = (group: ClassGroup, classes: ClassSection[]) => {
    const slots = state.timeSlots[group][state.timingMode];

    return (
      <div key={group} style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.1rem' }}>
          Group {group}
        </h3>
        <div className="timetable-wrapper">
          <table className="timetable-table">
            <thead>
              <tr>
                <th className="class-col" style={{ width: '120px' }}>Class</th>
                {slots.map(slot => (
                  <th key={slot.id} style={{ minWidth: slot.isBreak ? '60px' : '150px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{slot.name}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td className="class-col">
                    {cls.grade} - {cls.section}
                  </td>
                  {slots.map(slot => {
                    if (slot.isBreak) {
                      return <td key={slot.id} className="slot-cell is-break">Break</td>;
                    }

                    // Find assignment
                    const assignment = state.assignments.find(
                      a => a.classSectionId === cls.id && a.slotId === slot.id && a.day === activeDay
                    );
                    
                    let teacherInfo = null;
                    let subjectInfo = null;
                    if (assignment) {
                      teacherInfo = state.teachers.find(t => t.id === assignment.teacherId);
                      subjectInfo = state.subjects.find(s => s.id === assignment.subjectId);
                    }

                    return (
                      <td 
                        key={slot.id} 
                        className="slot-cell"
                        onDrop={(e) => handleDrop(e, cls.id, slot.id)}
                        onDragOver={handleDragOver}
                      >
                        {assignment && teacherInfo ? (
                           <div 
                             className={`assigned-card ${assignment.isLocked ? 'locked' : ''}`}
                             title={assignment.isLocked ? "Locked" : "Double click to remove"}
                             onDoubleClick={() => !assignment.isLocked && dispatch({ type: 'REMOVE_ASSIGNMENT', payload: assignment.id })}
                           >
                             <div className="assigned-teacher">{teacherInfo.name} ({teacherInfo.code})</div>
                             <div className="assigned-subject">{subjectInfo?.name}</div>
                           </div>
                        ) : (
                           <div className="empty-slot-text">Drop Teacher Here</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const groupVX = state.classes.filter(c => c.group === 'VI-X');
  const groupXIXII = state.classes.filter(c => c.group === 'XI-XII');

  return (
    <>
      {groupVX.length > 0 && renderTableForGroup('VI-X', groupVX)}
      {groupXIXII.length > 0 && renderTableForGroup('XI-XII', groupXIXII)}
    </>
  );
}
