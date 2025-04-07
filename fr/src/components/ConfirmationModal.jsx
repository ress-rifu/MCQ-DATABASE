import React from 'react';
import { MdWarning, MdInfo, MdError, MdCheckCircle } from 'react-icons/md';
import Modal from './Modal';

/**
 * A reusable confirmation modal component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onConfirm - Function to call when the action is confirmed
 * @param {string} props.title - The title of the modal
 * @param {string} props.message - The message to display
 * @param {string} props.confirmText - The text for the confirm button
 * @param {string} props.cancelText - The text for the cancel button
 * @param {string} props.confirmButtonClass - Additional classes for the confirm button
 * @param {string} props.type - The type of confirmation (info, warning, error, success)
 * @param {string} props.size - The size of the modal (sm, md, lg, xl)
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  type = 'warning',
  size = 'md'
}) => {
  // Get the appropriate icon based on the type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <MdWarning className="h-6 w-6 text-amber-600 dark:text-amber-500" />;
      case 'error':
        return <MdError className="h-6 w-6 text-red-600 dark:text-red-500" />;
      case 'success':
        return <MdCheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />;
      case 'info':
      default:
        return <MdInfo className="h-6 w-6 text-blue-600 dark:text-blue-500" />;
    }
  };

  // Get the appropriate background color for the icon container
  const getIconBgClass = () => {
    switch (type) {
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/20';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'info':
      default:
        return 'bg-blue-100 dark:bg-blue-900/20';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      showCloseButton={true}
    >
      <div className="sm:flex sm:items-start">
        {/* Icon */}
        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getIconBgClass()} sm:mx-0 sm:h-10 sm:w-10`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${confirmButtonClass}`}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
        <button
          type="button"
          className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={onClose}
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
