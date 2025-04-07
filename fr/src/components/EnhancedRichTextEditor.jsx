import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { renderLatexContent } from '../utils/latexRenderer';
import { fileToBase64 } from '../utils/imageUtils';

// Basic text editor compatible with React 19
const EnhancedRichTextEditor = ({ 
  value, 
  onChange, 
  placeholder,
  onImageAdd,
  onEquationAdd,
  showPreview = false,
  previewLabel = "Preview",
  readOnly = false,
  minHeight = "100px"
}) => {
  const editorRef = useRef(null);
  const [content, setContent] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Update content when value prop changes
    if (editorRef.current && value !== content) {
      setContent(value || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      onChange(newContent);
    }
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;

    // Support basic keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false);
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic', false);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      document.execCommand('underline', false);
    }
  };

  const handlePaste = (e) => {
    if (readOnly) return;

    // Handle image paste
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          
          const file = items[i].getAsFile();
          if (!file) continue;
          
          fileToBase64(file).then(base64 => {
            // Insert the image at cursor position
            document.execCommand('insertImage', false, base64);
            
            // Call optional callback
            if (onImageAdd) {
              onImageAdd(base64);
            }
          }).catch(error => {
            console.error('Error processing pasted image:', error);
          });
          
          break;
        }
      }
    }
  };

  const handleImageUpload = () => {
    if (readOnly) return;

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          
          // Insert image at cursor position
          document.execCommand('insertImage', false, base64);
          
          // Call optional callback
          if (onImageAdd) {
            onImageAdd(base64);
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    };
  };

  const handleEquation = () => {
    if (readOnly) return;

    if (onEquationAdd) {
      onEquationAdd();
    } else {
      const formula = prompt('Enter LaTeX formula:');
      if (formula) {
        // Insert the formula at cursor position
        document.execCommand('insertText', false, ` $${formula}$ `);
      }
    }
  };

  // Simple toolbar commands
  const execCommand = (command, value = null) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    handleInput(); // Update content after command execution
  };

  // Render editor
  return (
    <div className="enhanced-editor-container">
      {!readOnly && (
        <div className="editor-toolbar">
          <button type="button" onClick={() => execCommand('bold')} title="Bold">
            <strong>B</strong>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Italic">
            <em>I</em>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Underline">
            <u>U</u>
          </button>
          <button type="button" onClick={() => execCommand('insertOrderedList')} title="Ordered List">
            1.
          </button>
          <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
            •
          </button>
          <button type="button" onClick={handleImageUpload} title="Insert Image">
            IMG
          </button>
          <button type="button" onClick={handleEquation} title="Insert Equation">
            ∑
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        className={`editor-content ${isFocused ? 'focused' : ''} ${readOnly ? 'read-only' : ''}`}
        contentEditable={!readOnly}
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{ minHeight }}
        placeholder={placeholder}
      />
      
      {showPreview && content && content.includes('$') && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {previewLabel}
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            {renderLatexContent(content)}
          </div>
        </div>
      )}
      
      <style>{`
        .enhanced-editor-container {
          width: 100%;
        }
        .editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-bottom: none;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        .editor-toolbar button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
        }
        .editor-toolbar button:hover {
          background: #f8fafc;
        }
        .editor-content {
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          min-height: ${minHeight};
          outline: none;
          font-family: inherit;
          line-height: 1.5;
          color: #334155;
          background: white;
        }
        .editor-content.focused {
          border-color: #94a3b8;
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }
        .editor-content.read-only {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          background: #f8fafc;
          cursor: default;
        }
        .editor-content[placeholder]:empty:before {
          content: attr(placeholder);
          color: #94a3b8;
        }
        .editor-content img {
          max-width: 100%;
          height: auto;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .editor-toolbar {
            background: #1e293b;
            border-color: #475569;
          }
          .editor-toolbar button {
            background: #334155;
            border-color: #475569;
            color: #f1f5f9;
          }
          .editor-toolbar button:hover {
            background: #475569;
          }
          .editor-content {
            border-color: #475569;
            color: #334155;
            background: white;
          }
          .editor-content.focused {
            border-color: #64748b;
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
          }
          .editor-content.read-only {
            background: white;
          }
          .editor-content[placeholder]:empty:before {
            color: #64748b;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedRichTextEditor; 