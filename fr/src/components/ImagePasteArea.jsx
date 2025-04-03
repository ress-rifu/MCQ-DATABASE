import React, { useState, useRef, useEffect } from 'react';
import { fileToBase64 } from '../utils/imageUtils';

const ImagePasteArea = ({ onImagePaste, className, children }) => {
  const containerRef = useRef(null);
  const [isPasting, setIsPasting] = useState(false);

  useEffect(() => {
    const handlePaste = async (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            setIsPasting(true);
            
            try {
              // Get the file from clipboard
              const file = items[i].getAsFile();
              if (!file) continue;
              
              // Convert to base64
              const base64 = await fileToBase64(file);
              
              // Call the callback with the base64 data
              onImagePaste(base64);
            } catch (error) {
              console.error('Error processing pasted image:', error);
            } finally {
              setIsPasting(false);
            }
            
            break;
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('paste', handlePaste);
    }

    return () => {
      if (container) {
        container.removeEventListener('paste', handlePaste);
      }
    };
  }, [onImagePaste]);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className || ''}`} 
      tabIndex="0"
    >
      {isPasting && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-md z-10">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-md">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Processing image...
            </span>
          </div>
        </div>
      )}
      
      {children}
      
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        You can paste images directly (Ctrl+V / Cmd+V)
      </div>
    </div>
  );
};

export default ImagePasteArea; 