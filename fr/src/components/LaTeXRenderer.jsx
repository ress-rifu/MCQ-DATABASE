import React, { useEffect, useRef, useState } from 'react';
import { processContent, transformLongtableToHTML, containsComplexTable, transformSpecialLongtableFormat } from '../utils/latexRenderer';
import TableSpecificRenderer from './TableSpecificRenderer';
import katex from 'katex';
import ReactDOM from 'react-dom/client';
import '../styles/latexTable.css';

// Function to detect Bengali text in content
const hasBengaliText = (text) => {
  if (!text) return false;
  // Bengali Unicode range: \u0980-\u09FF
  const bengaliRegex = /[\u0980-\u09FF]/;
  return bengaliRegex.test(text);
};

// Apply Bengali font ONLY to Bengali text within an element
const applyBengaliFont = (element) => {
  if (!element) return;
  
  const processTextNode = (textNode) => {
    const text = textNode.textContent;
    if (!text || text.trim() === '') return textNode;
    
    // If no Bengali text, leave it as is
    if (!hasBengaliText(text)) return textNode;
    
    // Split text into Bengali and non-Bengali segments
    const segments = [];
    let currentSegment = '';
    let currentIsBengali = false;
    
    // Process each character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isBengaliChar = /[\u0980-\u09FF]/.test(char);
      
      if (i === 0) {
        currentIsBengali = isBengaliChar;
        currentSegment = char;
      } else if (isBengaliChar === currentIsBengali) {
        // Continue current segment
        currentSegment += char;
      } else {
        // Switch segments
        segments.push({ text: currentSegment, isBengali: currentIsBengali });
        currentSegment = char;
        currentIsBengali = isBengaliChar;
      }
    }
    
    // Add the last segment
    if (currentSegment) {
      segments.push({ text: currentSegment, isBengali: currentIsBengali });
    }
    
    // If only one segment, optimize
    if (segments.length === 1) {
      if (segments[0].isBengali) {
        const span = document.createElement('span');
        span.className = 'bangla-text';
        span.textContent = text;
        return span;
      }
      return textNode;
    }
    
    // Create a document fragment to hold all segments
    const fragment = document.createDocumentFragment();
    
    // Add each segment with appropriate font
    segments.forEach(segment => {
      if (segment.isBengali) {
        const span = document.createElement('span');
        span.className = 'bangla-text';
        span.textContent = segment.text;
        fragment.appendChild(span);
      } else {
        const span = document.createElement('span');
        span.className = 'english-text';
        span.textContent = segment.text;
        fragment.appendChild(span);
      }
    });
    
    return fragment;
  };
  
  const processNode = (node) => {
    if (!node) return;
    
    if (node.nodeType === Node.TEXT_NODE) {
      // Process text node
      if (hasBengaliText(node.textContent)) {
        const replacement = processTextNode(node);
        if (replacement !== node) {
          node.parentNode.replaceChild(replacement, node);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip processing if this is already a font-specific element
      if (node.classList && (node.classList.contains('bangla-text') || node.classList.contains('english-text'))) {
        return;
      }
      
      // Process children
      const childNodes = Array.from(node.childNodes);
      childNodes.forEach(processNode);
    }
  };
  
  // Only process if there's Bengali text somewhere in this element
  if (hasBengaliText(element.textContent || element.innerText)) {
    processNode(element);
  }
};

/**
 * Component to render LaTeX content including complex environments like tables
 * @param {Object} props
 * @param {string} props.content - The LaTeX content to render
 * @param {string} props.className - Additional CSS classes
 */
const LaTeXRenderer = ({ content, className = '' }) => {
  const containerRef = useRef(null);
  const [hasLongtable, setHasLongtable] = useState(false);

  // Check if content contains Bengali text
  const hasBengaliText = (text) => {
    // Unicode range for Bengali: \u0980-\u09FF
    const bengaliPattern = /[\u0980-\u09FF]/;
    return bengaliPattern.test(text);
  };
  
  // Apply Tiro Bangla font ONLY to Bengali text within an element
  const applyTiroBanglaToElement = (element) => {
    if (!element) return;
    
    // Only add the class if the element itself contains Bengali text
    if (hasBengaliText(element.textContent)) {
      // We'll add a special data attribute to mark this element for processing
      element.setAttribute('data-contains-bengali', 'true');
    }
  };

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
        let safeContent = typeof content === 'string' ? content : String(content || '');
        
        // Special handling for the specific Bengali table format
        if (safeContent.includes('\\begin{longtable}') && 
            (safeContent.includes('aggedright\\arraybackslash') || 
             safeContent.includes('centering\\arraybackslash')) && 
            safeContent.includes('abcolsep') && 
            safeContent.includes('eal{')) {
          console.log('Detected special Bengali table format');
        }
        
        // Skip processing if the content is empty
        if (!safeContent.trim()) {
          containerRef.current.innerHTML = '';
          return;
        }
        
        // Debug the content being rendered
        console.log('LaTeX content to render:', safeContent);

        // Check if content has Bengali text
        const isBengali = hasBengaliText(safeContent);
        if (isBengali) {
          containerRef.current.classList.add('bangla');
        } else {
          containerRef.current.classList.remove('bangla');
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
        // Initialize containsLaTeX as a let so we can modify it if needed
        let containsLaTeX = 
          safeContent.includes('$') || 
          safeContent.includes('\\begin') || 
          safeContent.includes('\\end') ||
          safeContent.includes('\\frac') ||
          safeContent.includes('\\text');
        
        // Check for the specific format with aggedright\arraybackslash
        const isSpecialFormat = 
          safeContent.includes('aggedright\\arraybackslash') && 
          safeContent.includes('abcolsep') && 
          safeContent.includes('eal{');
        
        // If it contains a longtable, use special rendering
        if (containsLongtable) {
          // Special handling for the specific format
          if (isSpecialFormat) {
            try {
              console.log("Using special format handler for longtable");
              const html = transformSpecialLongtableFormat(safeContent);
              containerRef.current.innerHTML = html;
              setHasLongtable(true);
              return;
            } catch (specialFormatError) {
              console.error('Error rendering special format longtable:', specialFormatError);
              // Fall through to standard longtable handling
            }
          }
        }
        
        setHasLongtable(containsLongtable || containsTabular);
        
        // If it doesn't explicitly look like LaTeX but contains math-like patterns, wrap it in $ delimiters
        if (!containsLaTeX && (
          safeContent.includes('\\frac') || 
          safeContent.includes('_') || 
          safeContent.includes('^') ||
          safeContent.includes('\\eq') ||
          safeContent.includes('\\neq') ||
          safeContent.includes('\\leq') ||
          safeContent.includes('\\geq') ||
          safeContent.match(/[a-z]_[0-9]/) ||
          safeContent.match(/\{[^}]*\}/) ||
          safeContent.includes('\\ext')
        )) {
          // Wrap in $ delimiters if not already wrapped
          if (!safeContent.startsWith('$')) {
            safeContent = `$${safeContent}$`;
            // Update containsLaTeX flag since we've added LaTeX delimiters
            containsLaTeX = true;
          }
        }
        
        // If it's not LaTeX content, render as plain text
        if (!containsLaTeX) {
          containerRef.current.textContent = safeContent;
          return;
        }
        
        // Process and insert the rendered content
        try {
          // First try to render with KaTeX directly if it's a simple expression
          if (safeContent.startsWith('$') && safeContent.endsWith('$') && !safeContent.includes('\\begin{') && !safeContent.includes('\\end{')) {
            const mathContent = safeContent.substring(1, safeContent.length - 1);
            try {
              const html = katex.renderToString(mathContent, {
                throwOnError: false,
                displayMode: false, // Changed to false to render inline instead of block
                output: 'html',
                trust: true
              });
              containerRef.current.innerHTML = html;
              return;
            } catch (katexError) {
              console.warn('KaTeX direct rendering failed, falling back to processContent', katexError);
              // Fall through to processContent
            }
          }
          
          const processedContent = processContent(safeContent);
          containerRef.current.innerHTML = processedContent;
        } catch (renderError) {
          console.error('Error in primary rendering path:', renderError);
          
          // Last resort fallback - try to render with KaTeX with additional preprocessing
          try {
            let fallbackContent = safeContent;
            // If not wrapped in $ delimiters, wrap it
            if (!fallbackContent.startsWith('$')) {
              fallbackContent = `$${fallbackContent}$`;
            }
            
            // Replace problematic LaTeX constructs
            fallbackContent = fallbackContent
              .replace(/\\eq/g, '=')
              .replace(/\\ext/g, '\\text');
              
            const html = katex.renderToString(fallbackContent.substring(1, fallbackContent.length - 1), {
              throwOnError: false,
              displayMode: false, // Changed to false to render inline instead of block
              output: 'html',
              trust: true
            });
            containerRef.current.innerHTML = html;
          } catch (fallbackError) {
            console.error('All rendering attempts failed:', fallbackError);
            containerRef.current.textContent = safeContent; // Last resort: show as plain text
          }
        }
        
        // Add specific class for better scrolling on tables
        if (containsLongtable || containsTabular) {
          containerRef.current.classList.add('has-latex-table');
        }

        // After processing the content, ensure the correct font is applied
        if (containerRef.current) {
          // Apply our improved font handling to the entire container
          applyBengaliFont(containerRef.current);
          
          // Special handling for KaTeX elements
          const katexElements = containerRef.current.querySelectorAll('.katex, .katex-display, .katex-html');
          katexElements.forEach(el => {
            const spans = el.querySelectorAll('span');
            spans.forEach(span => {
              const text = span.textContent || '';
              // Only add bangla-text class if the span contains Bengali text
              if (hasBengaliText(text)) {
                span.classList.add('bangla-text');
                span.setAttribute('lang', 'bn');
                // Remove english-text class if it was added
                span.classList.remove('english-text');
              } else {
                // Only add english-text class if the span contains text
                if (text.trim() !== '') {
                  span.classList.add('english-text');
                  span.setAttribute('lang', 'en');
                  // Remove bangla-text class if it was added
                  span.classList.remove('bangla-text');
                }
              }
            });
          });
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
  
  // Add a class to indicate this container has Bengali text somewhere
  // But we won't apply any font to the whole container
  if (typeof content === 'string' && hasBengaliText(content)) {
    defaultClasses += ' contains-bengali-text bengali-content';
  }
  
  const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <div 
      ref={containerRef} 
      className={combinedClasses}
      data-has-bengali={typeof content === 'string' && hasBengaliText(content) ? 'true' : 'false'}
      lang={typeof content === 'string' && hasBengaliText(content) ? 'bn' : 'en'}
    />
  );
};

export default LaTeXRenderer; 