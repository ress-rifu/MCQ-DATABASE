import React, { useState, useEffect } from 'react';

const SimpleRichTextEditor = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  // Handle content changes
  const handleContentChange = (e) => {
    const content = e.target.innerHTML;
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className="rich-text-editor-container">
      <div
        className={`rich-text-editor ${isFocused ? 'focused' : ''}`}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          padding: '0.75rem',
          minHeight: '150px',
          backgroundColor: '#fff',
          boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <div
          contentEditable
          className="editor-content"
          dangerouslySetInnerHTML={{ __html: value || '' }}
          onInput={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          style={{
            minHeight: '100px',
            outline: 'none',
          }}
        />
      </div>
      <style>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #9ca3af;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichTextEditor; 