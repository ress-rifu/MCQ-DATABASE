import React, { useState } from 'react';

const TailwindShowcase = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type) => {
    const newNotification = {
      id: Date.now(),
      type,
      message: `This is a ${type} notification example`,
    };
    setNotifications([...notifications, newNotification]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(notifications => 
        notifications.filter(n => n.id !== newNotification.id)
      );
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tailwind CSS Showcase</h1>
        <p className="text-gray-600 mb-8">A demonstration of various UI components styled with Tailwind CSS</p>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex -mb-px">
            {['buttons', 'cards', 'forms', 'notifications', 'tables'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Notifications */}
        <div className="fixed top-4 right-4 w-80 space-y-2 z-50">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification ${notification.type} shadow-lg`}
            >
              {notification.message}
              <button 
                onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        
        {/* Content based on active tab */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {activeTab === 'buttons' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    Primary Button
                  </button>
                  <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    Secondary Button
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    Danger Button
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                    Success Button
                  </button>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Small
                  </button>
                  <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Medium
                  </button>
                  <button className="px-6 py-3 text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Large
                  </button>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Button States</h2>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md opacity-50 cursor-not-allowed">
                    Disabled
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading
                  </button>
                  <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Open Modal
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'cards' && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold mb-4">Card Examples</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Simple Card */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Simple Card</h3>
                    <p className="text-gray-500 text-sm">A basic card with some text content.</p>
                  </div>
                </div>
                
                {/* Card with Image */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-48 bg-indigo-200 flex items-center justify-center">
                    <svg className="h-24 w-24 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Card with Image</h3>
                    <p className="text-gray-500 text-sm">A card with an image placeholder at the top.</p>
                  </div>
                </div>
                
                {/* Card with Actions */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Card with Actions</h3>
                    <p className="text-gray-500 text-sm mb-4">A card with action buttons at the bottom.</p>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                      <button className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800">Cancel</button>
                      <button className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Confirm</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'forms' && (
            <div className="space-y-8 max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Form Elements</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    id="country"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Mexico</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notifications</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="notifications-email"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="notifications-email" className="ml-2 block text-sm text-gray-700">Email</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="notifications-sms"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="notifications-sms" className="ml-2 block text-sm text-gray-700">SMS</label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="plan-free"
                        name="plan"
                        type="radio"
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="plan-free" className="ml-2 block text-sm text-gray-700">Free</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="plan-pro"
                        name="plan"
                        type="radio"
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="plan-pro" className="ml-2 block text-sm text-gray-700">Pro</label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    rows="4"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="Your message here..."
                  ></textarea>
                </div>
                
                <div className="pt-4">
                  <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold mb-4">Notification Examples</h2>
              
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Click the buttons below to show different types of notifications:</p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => addNotification('success')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Success Notification
                  </button>
                  <button
                    onClick={() => addNotification('error')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Error Notification
                  </button>
                  <button
                    onClick={() => addNotification('warning')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Warning Notification
                  </button>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Static Examples:</h3>
                  
                  <div className="space-y-4">
                    <div className="notification success">
                      This is a success notification example
                    </div>
                    
                    <div className="notification error">
                      This is an error notification example
                    </div>
                    
                    <div className="notification warning">
                      This is a warning notification example
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'tables' && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold mb-4">Table Examples</h2>
              
              <div className="overflow-x-auto">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Jane Cooper', title: 'Regional Paradigm Technician', email: 'jane.cooper@example.com', role: 'Admin' },
                      { name: 'Cody Fisher', title: 'Product Directives Officer', email: 'cody.fisher@example.com', role: 'Owner' },
                      { name: 'Esther Howard', title: 'Forward Response Developer', email: 'esther.howard@example.com', role: 'Member' },
                      { name: 'Jenny Wilson', title: 'Central Security Manager', email: 'jenny.wilson@example.com', role: 'Member' },
                      { name: 'Kristin Watson', title: 'Lead Implementation Liaison', email: 'kristin.watson@example.com', role: 'Admin' },
                    ].map((person, i) => (
                      <tr key={i}>
                        <td>{person.name}</td>
                        <td>{person.title}</td>
                        <td>{person.email}</td>
                        <td>{person.role}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Modal Example
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This is an example modal dialog styled with Tailwind CSS. You can use this for confirmations, forms, or any content that needs to be presented in a focused way.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Confirm
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailwindShowcase;
