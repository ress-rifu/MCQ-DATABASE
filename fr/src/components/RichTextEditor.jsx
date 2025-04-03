import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const quillRef = useRef(null);
  
  // Define custom toolbar options
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image', 'formula'],
        ['clean']
      ],
      handlers: {
        // We'll add custom handlers if needed
      }
    },
    clipboard: {
      // Allow pasting images
      matchVisual: false
    }
  };

  // Define format options
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image', 'formula'
  ];

  // Handle image paste
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // Handle paste event to detect images
      quill.root.addEventListener('paste', (e) => {
        if (e.clipboardData && e.clipboardData.items) {
          const items = e.clipboardData.items;
          
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              e.preventDefault();
              
              // Get the file from clipboard
              const file = items[i].getAsFile();
              if (!file) continue;
              
              // Convert image to base64
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;
                
                // Insert the image at cursor position
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', base64, 'user');
                quill.setSelection(range.index + 1);
              };
              reader.readAsDataURL(file);
              
              // Only process one image per paste
              break;
            }
          }
        }
      });
    }
  }, [quillRef]);

  // Handle direct insertion of LaTeX equations
  const handleKeyDown = (e) => {
    if (quillRef.current && e.key === '$') {
      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();
      
      if (selection) {
        // Check if we already have an open $ sign before the cursor
        const text = quill.getText(0, selection.index);
        const lastDollarIndex = text.lastIndexOf('$');
        
        if (lastDollarIndex !== -1 && !text.substring(lastDollarIndex + 1).includes('$')) {
          // We have an open $ - this is closing it
          // Let the default $ character be inserted
          return;
        }
      }
    }
  };

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      theme="snow"
    />
  );
};

export default RichTextEditor; 