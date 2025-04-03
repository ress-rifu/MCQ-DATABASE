import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * A reusable Modal component with Notion-like design
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is currently open
 * @param {Function} props.onClose - Function to call when the modal should close
 * @param {React.ReactNode} props.children - Content to render inside the modal
 * @param {string} props.title - Modal title
 * @param {string} props.size - Modal size ('sm', 'md', 'lg', 'xl', 'full')
 * @param {boolean} props.preventOutsideClick - Prevents modal from closing when clicking outside
 * @param {boolean} props.showCloseButton - Whether to show the close button in the header
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  preventOutsideClick = false,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);
  
  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && !preventOutsideClick) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling of body when modal is open
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = ''; // Re-enable scrolling when modal closes
    };
  }, [isOpen, onClose, preventOutsideClick]);
  
  // Handle clicks outside the modal content
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target) && !preventOutsideClick) {
      onClose();
    }
  };
  
  // Determine modal width based on size prop
  const getModalWidth = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case 'full': return 'max-w-full mx-4';
      default: return 'max-w-md';
    }
  };
  
  if (!isOpen) return null;
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop with enhanced blur effect and animation */}
        <div 
          className="fixed inset-0 backdrop-blur modal-backdrop-blur" 
          aria-hidden="true"
          style={{ zIndex: 40 }}
        ></div>
        
        {/* This element centers the modal contents */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel with animation */}
        <div 
          ref={modalRef}
          className={`inline-block align-bottom sm:align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform sm:my-8 w-full modal-content-animate ${getModalWidth()}`}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: 50 }}
        >
          {/* Modal header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              {title && (
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Modal content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Using createPortal to render modal at the end of the document body
  return createPortal(modalContent, document.body);
};

export default Modal; 