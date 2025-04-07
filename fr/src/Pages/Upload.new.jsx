import React, { useState } from 'react';
import Notification from '../components/Notification';

const Upload = () => {
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Page</h1>
      <p className="mb-4">This is a simplified version of the Upload page.</p>
      
      <button 
        onClick={() => showNotification('Test notification', 'success')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Show Notification
      </button>
      
      <Notification 
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default Upload;
