import React, { useState } from 'react';

export function SessionDashboard() {
  const [students, setStudents] = useState([
    { id: 1, name: 'Ali Khan', status: 'Waiting' },
    { id: 2, name: 'Sara Ahmed', status: 'Waiting' }
  ]);

  const approveStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
    alert('Student Allowed into Session!');
  };

  return (
    <div style={{ padding: '20px', color: '#fff', background: '#0f172a', borderRadius: '12px' }}>
      <h2>⚡ LiveLogic Control Center</h2>
      
      {/* Waiting Room Section */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
        <h3>⏳ Student Waiting Room ({students.length})</h3>
        {students.length === 0 ? <p style={{ color: '#94a3b8' }}>No pending approvals</p> : (
          students.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>{s.name}</span>
              <button 
                onClick={() => approveStudent(s.id)}
                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                Approve
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => alert('All student screens reset!')}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          🚨 Clear Student Screens
        </button>
        <button 
          onClick={() => alert('Interactive Quiz Modal Opened')}
          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          📝 Push Live Quiz
        </button>
      </div>
    </div>
  );
}

export default SessionDashboard;