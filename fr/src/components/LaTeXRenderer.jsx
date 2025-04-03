import React, { useEffect, useRef, useState } from 'react';
import { processContent, transformLongtableToHTML, containsComplexTable } from '../utils/latexRenderer';
import TableSpecificRenderer from './TableSpecificRenderer';
import katex from 'katex';
import ReactDOM from 'react-dom/client';

/**
 * Component to render LaTeX content including complex environments like tables
 * @param {Object} props
 * @param {string} props.content - The LaTeX content to render
 * @param {string} props.className - Additional CSS classes
 */
const LaTeXRenderer = ({ content, className = '' }) => {
  const containerRef = useRef(null);
  const [hasLongtable, setHasLongtable] = useState(false);

  // Helper function to clean longtable content for better rendering
  const cleanLongtableContent = (tableContent) => {
    // Remove the dollar signs if present
    let cleaned = tableContent;
    if (cleaned.startsWith('$')) cleaned = cleaned.substring(1);
    if (cleaned.endsWith('$')) cleaned = cleaned.slice(0, -1);
    
    // Replace complex column specs with simple ones
    cleaned = cleaned.replace(
      /(\\begin{longtable})\s*\[\s*\]\s*{[^}]*}/g, 
      '$1{|c|c|c|c|}'
    );
    
    // Replace various problematic constructs
    const replacements = [
      { pattern: />{\s*\\centering\\arraybackslash\s*}p{[^}]*}/g, replacement: 'c' },
      { pattern: />{\s*\\aggedright\\arraybackslash\s*}p{[^}]*}/g, replacement: 'l' },
      { pattern: /p{(\linewidth[^}]*)}/g, replacement: 'c' },
      { pattern: /\\\\\[\d\.a-z]*\]/g, replacement: '\\\\' },
      { pattern: /\\begin{minipage}[^}]*}{[^}]*}([^]*)\\end{minipage}/g, replacement: '$1' },
      { pattern: /\boprule\b/g, replacement: '\\hline' },
      { pattern: /\bmidrule\b/g, replacement: '\\hline' },
      { pattern: /\bbottomrule\b/g, replacement: '\\hline' },
      { pattern: /\boalign{[^}]*}/g, replacement: '' },
      { pattern: />\{[^}]*\}/g, replacement: '' },
      { pattern: /\babcolsep\b/g, replacement: '' },
      { pattern: /\beal\b/g, replacement: '' }
    ];
    
    replacements.forEach(({pattern, replacement}) => {
      cleaned = cleaned.replace(pattern, replacement);
    });
    
    // Wrap in dollars for KaTeX
    return `$${cleaned}$`;
  };

  useEffect(() => {
    if (containerRef.current) {
      try {
        // Ensure content is a string
        const safeContent = typeof content === 'string' ? content : String(content || '');
        
        // Skip processing if the content is empty
        if (!safeContent.trim()) {
          containerRef.current.innerHTML = '';
          return;
        }

        // Check if this is a complex table that requires special handling
        if (containsComplexTable(safeContent)) {
          console.log("Using TableSpecificRenderer for complex table");
          // Create a div to mount the React component
          const mountNode = document.createElement('div');
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(mountNode);
          
          // Use React to render the TableSpecificRenderer
          const root = ReactDOM.createRoot(mountNode);
          root.render(<TableSpecificRenderer content={safeContent} />);
          return;
        }
        
        // Detect complex column specifications
        const hasComplexColumns = 
          safeContent.includes(">{\centering") || 
          safeContent.includes("linewidth") || 
          safeContent.includes("abcolsep") ||
          safeContent.includes("\\arraybackslash");
        
        // Special case for longtable content that starts with $ but doesn't have proper LaTeX structure
        if (safeContent.includes('\\begin{longtable}') || hasComplexColumns) {
          
          // This is likely a raw longtable that needs direct handling
          setHasLongtable(true);
          containerRef.current.classList.add('has-latex-table');
          
          // Extract only the longtable part if it's embedded in other text
          let tableContent = safeContent;
          const match = safeContent.match(/(?:\$)?\\begin\{longtable\}[\s\S]*?\\end\{longtable\}(?:\$)?/);
          if (match) {
            tableContent = match[0];
          } else if (hasComplexColumns) {
            // If no longtable tags but has complex columns, wrap the content in longtable tags
            tableContent = `\\begin{longtable}{cccc}${safeContent}\\end{longtable}`;
          }
          
          // Try to directly process the table - first attempt with the custom HTML transformer
          try {
            console.log("Using direct HTML transformation");
            const htmlTable = transformLongtableToHTML(tableContent);
            containerRef.current.innerHTML = `<div class="longtable-container">${htmlTable}</div>`;
            return;
          } catch (directError) {
            console.error('Direct transformation failed:', directError);
            
            // Show the raw content with a fallback style
            if (hasComplexColumns) {
              containerRef.current.innerHTML = `
                <div class="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <table class="direct-latex-table">
                    <tr>
                      <th>x</th>
                      <th>0</th>
                      <th>-1</th>
                      <th>2</th>
                    </tr>
                    <tr>
                      <td>y</td>
                      <td>Content could not be rendered</td>
                      <td>Please check the LaTeX syntax</td>
                      <td></td>
                    </tr>
                  </table>
                </div>
              `;
              return;
            }
            
            // Fall back to KaTeX rendering as last resort
            try {
              // Clean table content to make it more likely to render
              const cleanedTable = cleanLongtableContent(tableContent);
              const html = katex.renderToString(cleanedTable, {
                throwOnError: false,
                displayMode: true,
                output: 'html',
                trust: true
              });
              containerRef.current.innerHTML = `<div class="longtable-container">${html}</div>`;
              return;
            } catch (tableError) {
              console.error('Error processing longtable directly:', tableError);
              // Fall through to standard processing
            }
          }
        }
        
        // Special handling for specific LaTeX environments
        const containsLongtable = safeContent.includes('\\begin{longtable}');
        const containsTabular = safeContent.includes('\\begin{tabular}');
        const containsLaTeX = 
          safeContent.includes('$') || 
          safeContent.includes('\\begin') || 
          safeContent.includes('\\end') ||
          safeContent.includes('\\frac') ||
          safeContent.includes('\\text');
        
        setHasLongtable(containsLongtable || containsTabular);
        
        // If it's not LaTeX content, render as plain text
        if (!containsLaTeX) {
          containerRef.current.textContent = safeContent;
          return;
        }
        
        // Process and insert the rendered content
        const processedContent = processContent(safeContent);
        containerRef.current.innerHTML = processedContent;
        
        // Add specific class for better scrolling on tables
        if (containsLongtable || containsTabular) {
          containerRef.current.classList.add('has-latex-table');
        }
      } catch (error) {
        console.error('Error rendering LaTeX content:', error);
        containerRef.current.innerHTML = `<div class="text-red-500">Error rendering LaTeX content: ${error.message}</div>`;
      }
    }
  }, [content]);

  // Apply default styling for LaTeX content
  let defaultClasses = 'latex-content overflow-x-auto';
  
  // Add specific class if content contains longtable
  if (hasLongtable) {
    defaultClasses += ' contains-longtable';
  }
  
  const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <div 
      ref={containerRef} 
      className={combinedClasses}
    />
  );
};

export default LaTeXRenderer; 