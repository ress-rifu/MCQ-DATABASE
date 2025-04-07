import React, { useState } from 'react';
import Notification from '../components/Notification';
import { FiUpload } from 'react-icons/fi';

const UploadTest = () => {
  const [file, setFile] = useState(null);
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

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      showNotification(`File "${e.target.files[0].name}" selected`, 'success');
    }
  };

  const handleUpload = () => {
    if (!file) {
      showNotification('Please select a file first', 'warning');
      return;
    }
    showNotification(`File "${file.name}" uploaded successfully`, 'success');
    setFile(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Test</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-6">
          <div
            className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 transition-all duration-200 hover:border-indigo-400 bg-gray-50 hover:bg-gray-100 cursor-pointer group"
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls, .docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-50 mb-4 group-hover:bg-indigo-100 transition-colors">
                <FiUpload className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Drag and drop your file here'}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supported formats: .xlsx, .xls, .docx (Max 10MB)'}
              </p>
              {!file && (
                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm">
                  Select File
                </button>
              )}
            </div>
          </div>
        </div>

        {file && (
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              Upload File
            </button>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => showNotification('Success notification example', 'success')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
        >
          Show Success
        </button>

        <button
          onClick={() => showNotification('Error notification example', 'error')}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
        >
          Show Error
        </button>

        <button
          onClick={() => showNotification('Warning notification example', 'warning')}
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 text-sm"
        >
          Show Warning
        </button>
      </div>

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default UploadTest;
