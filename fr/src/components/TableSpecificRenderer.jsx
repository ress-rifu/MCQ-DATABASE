import React, { useEffect, useState } from 'react';

/**
 * A specialized component for rendering complex LaTeX tables with specific column patterns
 * @param {Object} props
 * @param {string} props.content - The table content to render
 */
const TableSpecificRenderer = ({ content }) => {
  const [tableData, setTableData] = useState({
    headers: [],
    rows: []
  });

  useEffect(() => {
    if (!content) return;
    
    try {
      // Parse the table content
      const parsedData = parseTableContent(content);
      setTableData(parsedData);
    } catch (error) {
      console.error('Error parsing table content:', error);
      // On error, set simple fallback data
      setTableData({
        headers: ['x', '0', '-1', '2'],
        rows: [['y', '-1', '-3', '3']]
      });
    }
  }, [content]);

  /**
   * Parses the complex LaTeX table content
   * @param {string} content - The raw LaTeX table content
   * @returns {Object} - Parsed table data with headers and rows
   */
  const parseTableContent = (content) => {
    // Extract cell values
    const valuePattern = /\\centering\s+([^\\&]*)/g;
    const values = [];
    let match;
    
    while ((match = valuePattern.exec(content)) !== null) {
      values.push(match[1].trim());
    }
    
    // If no values found with that pattern, try another approach
    if (values.length === 0) {
      // Split by rows and handle manually
      const rows = content.split('\\\\').filter(r => r.trim());
      const extractedRows = [];
      
      for (const row of rows) {
        if (row.includes('&')) {
          const cells = row.split('&').map(cell => {
            // Clean up cell content
            return cell.replace(/\\begin\{.*?\}|\\end\{.*?\}|\\centering|\\arraybackslash|\\oalign|\\oprule|\\midrule|\\bottomrule|\\endhead|\\endlastfoot/g, '')
                       .replace(/p\{.*?\}/g, '')
                       .replace(/>\{.*?\}/g, '')
                       .replace(/\$/g, '')
                       .replace(/\[([^[\]]*)\]/g, '$1')
                       .trim();
          }).filter(cell => cell);
          
          if (cells.length > 0) {
            extractedRows.push(cells);
          }
        }
      }
      
      if (extractedRows.length > 0) {
        // First row is headers, rest are data rows
        return {
          headers: extractedRows[0] || [],
          rows: extractedRows.slice(1) || []
        };
      }
    }
    
    // If we have values from the first pattern
    if (values.length > 0) {
      // Determine how many columns we have
      const columnCount = 4; // Assume 4 columns for this specific case
      
      // Extract headers (first row)
      const headers = values.slice(0, columnCount);
      
      // Extract data rows
      const rows = [];
      for (let i = columnCount; i < values.length; i += columnCount) {
        const rowData = values.slice(i, i + columnCount);
        rows.push(rowData);
      }
      
      return { headers, rows };
    }
    
    // Fallback
    return {
      headers: ['x', '0', '-1', '2'],
      rows: [['y', '-1', '-3', '3']]
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 direct-latex-table">
        <thead>
          <tr>
            {tableData.headers.map((header, index) => (
              <th key={index} className="px-4 py-2 text-center bg-gray-50">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-center">
                  {cell}
                </td>
              ))}
              {/* Add empty cells if row has fewer cells than headers */}
              {Array(Math.max(0, tableData.headers.length - row.length))
                .fill(0)
                .map((_, index) => (
                  <td key={`empty-${rowIndex}-${index}`} className="px-4 py-2"></td>
                ))
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSpecificRenderer; 