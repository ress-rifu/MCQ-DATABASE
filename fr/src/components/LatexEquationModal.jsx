import React, { useState, useEffect } from 'react';
import { renderLatexContent } from '../utils/latexRenderer';
import Modal from './Modal';
import ModalActions, { PrimaryButton, SecondaryButton } from './ModalActions';

const LatexEquationModal = ({ isOpen, onClose, onInsert, initialValue = '' }) => {
  const [equation, setEquation] = useState(initialValue);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    // Generate preview when equation changes
    setPreview(equation);
  }, [equation]);

  const handleInsert = () => {
    onInsert(equation);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Insert LaTeX Equation"
      size="md"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Equation
        </label>
        <textarea
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          rows={4}
          placeholder="Enter LaTeX equation (without $ delimiters)"
        />
      </div>
      
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preview
        </label>
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 min-h-[60px]">
          <span className="text-gray-800 dark:text-gray-200">
            {equation && renderLatexContent(`$${equation}$`)}
          </span>
        </div>
      </div>
      
      <ModalActions>
        <SecondaryButton onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton onClick={handleInsert}>
          Insert
        </PrimaryButton>
      </ModalActions>
    </Modal>
  );
};

export default LatexEquationModal; 