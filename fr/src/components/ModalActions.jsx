import React from 'react';

/**
 * Modal footer action buttons container with Notion-like styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Action buttons
 * @param {string} props.align - Alignment of buttons ('start', 'center', 'end', 'between', 'around', 'evenly')
 * @param {boolean} props.bordered - Whether to show top border
 * @param {string} props.className - Additional custom classes
 */
const ModalActions = ({ 
  children, 
  align = 'end',
  bordered = true,
  className = ''
}) => {
  // Map alignment values to Tailwind flex classes
  const alignmentClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }[align] || 'justify-end';
  
  const borderClass = bordered ? 'border-t border-gray-100 dark:border-gray-700' : '';

  return (
    <div 
      className={`flex items-center gap-3 px-6 py-4 mt-2 ${alignmentClass} ${borderClass} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Primary button for modal actions
 */
export const PrimaryButton = ({ onClick, children, disabled = false, type = 'button', className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

/**
 * Secondary button for modal actions
 */
export const SecondaryButton = ({ onClick, children, disabled = false, type = 'button', className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

/**
 * Danger button for modal actions
 */
export const DangerButton = ({ onClick, children, disabled = false, type = 'button', className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export default ModalActions; 