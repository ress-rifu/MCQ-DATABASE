import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Safe wrapper for inline math
export const SafeInlineMath = ({ math }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math.trim(), containerRef.current, {
          displayMode: false,
          throwOnError: false,
          strict: false
        });
      } catch (error) {
        console.error("KaTeX rendering error:", error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span class="text-red-500">[Math Error: ${math}]</span>`;
        }
      }
    }
  }, [math]);
  
  return <span ref={containerRef} className="inline"></span>;
};

// Safe wrapper for block math
export const SafeBlockMath = ({ math }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math.trim(), containerRef.current, {
          displayMode: true,
          throwOnError: false,
          strict: false
        });
      } catch (error) {
        console.error("KaTeX rendering error:", error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span class="text-red-500">[Math Error: ${math}]</span>`;
        }
      }
    }
  }, [math]);
  
  return <div ref={containerRef} className="my-4 text-center"></div>;
};

// Process text with mixed content (LaTeX and regular text)
const processLatexString = (text) => {
  if (!text) return [];

  // Split by block math first ($$...$$)
  const blockParts = text.split(/(\$\$.*?\$\$)/s);
  
  // Process each part for inline math
  return blockParts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // Block math
      return {
        type: 'block',
        content: part.slice(2, -2),
        key: `block-${index}`
      };
    } else {
      // Check for inline math in the remaining text
      const inlineParts = part.split(/(\\\(.*?\\\))/s);
      if (inlineParts.length > 1) {
        return inlineParts.map((inlinePart, inlineIndex) => {
          if (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) {
            return {
              type: 'inline',
              content: inlinePart.slice(2, -2),
              key: `inline-${index}-${inlineIndex}`
            };
          }
          return {
            type: 'text',
            content: inlinePart,
            key: `text-${index}-${inlineIndex}`
          };
        });
      }
      return {
        type: 'text',
        content: part,
        key: `text-${index}`
      };
    }
  }).flat();
};

// Main render function
export const renderLatex = (content) => {
  if (!content) return null;

  const parts = processLatexString(content);
  
  return (
    <span>
      {parts.map((part) => {
        switch (part.type) {
          case 'block':
            return <SafeBlockMath key={part.key} math={part.content} />;
          case 'inline':
            return <SafeInlineMath key={part.key} math={part.content} />;
          case 'text':
            return <span key={part.key}>{part.content}</span>;
          default:
            return null;
        }
      })}
    </span>
  );
}; 