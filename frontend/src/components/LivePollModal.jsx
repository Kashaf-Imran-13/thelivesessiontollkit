import React, { useState, useEffect } from 'react';

export default function StudentView({ socket }) {
  const [status, setStatus] = useState('waiting_approval');
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    socket.on('join_approved', () => setStatus('idle'));
    
    socket.on('poll_cleared', () => {
      setCurrentItem(null);
      setStatus('idle');
    });

    socket.on('new_item_launched', (data) => {
      setCurrentItem(data);
      setStatus('active');
    });

    return () => {
      socket.off('join_approved');
      socket.off('poll_cleared');
      socket.off('new_item_launched');
    };
  }, [socket]);

  if (status === 'waiting_approval') {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Waiting for teacher to allow entry...</div>;
  }

  if (status === 'idle' || !currentItem) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Waiting for teacher to launch a poll...</h2>
        <p>Keep this page open.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px' }}>
        {currentItem.type.toUpperCase()}
      </span>
      <h3>{currentItem.question}</h3>
      {currentItem.options.map((opt, i) => (
        <button key={i} style={{ display: 'block', margin: '10px 0', width: '100%' }}>
          {opt}
        </button>
      ))}
    </div>
  );
}