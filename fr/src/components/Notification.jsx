import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * Reusable notification component that displays messages in the bottom-right corner
 * Following Untitled UI design principles
 *
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the notification
 * @param {string} props.message - The message to display
 * @param {string} props.type - The type of notification ('success', 'error', or 'warning')
 * @param {Function} props.onClose - Optional callback when notification is closed
 * @returns {JSX.Element|null} - The notification component or null if not shown
 */
const Notification = ({ show, message, type = 'success', onClose }) => {
  if (!show) return null;

  // Determine styles based on notification type
  const styles = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
      icon: <FiCheckCircle className="h-5 w-5 text-success-500" />
    },
    error: {
      bg: 'bg-error-50',
      border: 'border-error-200',
      text: 'text-error-700',
      icon: <FiAlertCircle className="h-5 w-5 text-error-500" />
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-700',
      icon: <FiAlertTriangle className="h-5 w-5 text-warning-500" />
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-[fadeIn_0.3s_ease-in-out]">
      <div className={`${style.bg} ${style.border} ${style.text} border rounded-lg shadow-md px-4 py-3 flex items-center gap-3`}>
        {style.icon}
        <p className="text-sm font-medium flex-grow">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close notification"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
