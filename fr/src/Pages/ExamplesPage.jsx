import React from 'react';
import { 
  ProtectedBuggyComponent,
  TryCatchComponent,
  AsyncBoundaryComponent,
  ErrorHandlingHookComponent,
  AxiosErrorHandlingComponent,
  NotificationComponent,
  FullyProtectedComponent
} from '../utils/examples';

/**
 * ExamplesPage - Demonstrates the various error handling techniques
 * 
 * This page showcases different approaches to error handling in the application,
 * including error boundaries, try-catch handling, async error handling, and more.
 */
const ExamplesPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Error Handling Examples</h1>
      
      <p className="text-gray-700 mb-8">
        This page demonstrates the various error handling techniques implemented in the application.
        Each example shows a different approach to handling errors in React components.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example 1: Basic Error Boundary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Error Boundary</h2>
          <p className="text-gray-600 mb-4">
            This component is wrapped with an error boundary to catch rendering errors.
            Click the button to trigger an error and see how it's handled.
          </p>
          <ProtectedBuggyComponent />
        </div>
        
        {/* Example 2: Try-Catch Error Handling */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. Try-Catch Error Handling</h2>
          <p className="text-gray-600 mb-4">
            This component uses try-catch blocks to handle errors and displays a fallback UI.
            The fetch may randomly succeed or fail.
          </p>
          <TryCatchComponent />
        </div>
        
        {/* Example 3: Async Error Boundary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3. Async Error Boundary</h2>
          <p className="text-gray-600 mb-4">
            This component uses the AsyncErrorBoundary to handle errors in asynchronous operations.
            The data fetch may randomly succeed or fail.
          </p>
          <AsyncBoundaryComponent />
        </div>
        
        {/* Example 4: Error Handling Hook */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">4. Error Handling Hook</h2>
          <p className="text-gray-600 mb-4">
            This component uses the useErrorHandling hook to handle API errors.
            The fetch may randomly succeed or fail.
          </p>
          <ErrorHandlingHookComponent />
        </div>
        
        {/* Example 5: Axios with Error Handling */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">5. Axios with Error Handling</h2>
          <p className="text-gray-600 mb-4">
            This component uses the useAxiosWithErrorHandling hook for streamlined API calls.
            The API call is simulated and may randomly succeed or fail.
          </p>
          <AxiosErrorHandlingComponent />
        </div>
        
        {/* Example 6: Notification System */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">6. Notification System</h2>
          <p className="text-gray-600 mb-4">
            This component demonstrates the notification system for displaying messages to users.
            Click the buttons to see different notification types.
          </p>
          <NotificationComponent />
        </div>
        
        {/* Example 7: Combined Error Handling */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">7. Combined Error Handling</h2>
          <p className="text-gray-600 mb-4">
            This component uses multiple layers of error handling (component boundary, fallback, and async).
            Click the button to trigger an error and see how it's handled.
          </p>
          <FullyProtectedComponent />
        </div>
        
        {/* About Error Handling */}
        <div className="bg-gray-100 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">About Error Handling</h2>
          <p className="text-gray-700 mb-3">
            The application implements a comprehensive error handling system that includes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>Component error boundaries to catch rendering errors</li>
            <li>Global error handler for unhandled exceptions</li>
            <li>Route error elements for routing errors</li>
            <li>Specialized async error handling</li>
            <li>Error fallback components</li>
            <li>Notification system for user feedback</li>
            <li>API error handling utilities</li>
          </ul>
          <p className="mt-4 text-gray-700">
            For more information, check the documentation in the README.md file.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamplesPage; 