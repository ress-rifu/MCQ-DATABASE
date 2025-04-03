import React, { useState } from 'react';
import { convertLatexTableToHtml } from '../utils/latexRenderer';

/**
 * Component for converting LaTeX tables to HTML
 */
const LatexTableConverter = () => {
  const [latexCode, setLatexCode] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [showFullHtml, setShowFullHtml] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle LaTeX input change
  const handleLatexInputChange = (e) => {
    setLatexCode(e.target.value);
  };

  // Convert LaTeX to HTML
  const handleConvert = () => {
    if (!latexCode.trim()) {
      setHtmlOutput('<p>Please enter LaTeX table code.</p>');
      return;
    }

    const html = convertLatexTableToHtml(latexCode, showFullHtml);
    setHtmlOutput(html);
  };

  // Copy HTML to clipboard
  const handleCopyHtml = () => {
    if (!htmlOutput) return;

    navigator.clipboard.writeText(htmlOutput)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy HTML:', err);
      });
  };

  // Generate an example LaTeX table
  const insertExample = () => {
    setLatexCode(`\\begin{longtable}[]{@{} >{\centering\\arraybackslash}p{(\\linewidth - 6 abcolsep) * eal{0.2470}} >{\centering\\arraybackslash}p{(\\linewidth - 6 abcolsep) * eal{0.2644}} >{\centering\\arraybackslash}p{(\\linewidth - 6 abcolsep) * eal{0.2644}} >{\centering\\arraybackslash}p{(\\linewidth - 6 abcolsep) * eal{0.2243}}@{}} oprule oalign{} \\endhead \\bottomrule oalign{} \\endlastfoot $x$ & 0 & -1 & 2 \\\\ $y$ & -1 & -3 & 3 \\\\ \\end{longtable}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">LaTeX Table to HTML Converter</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LaTeX Table Code:
        </label>
        <div className="flex gap-2 mb-2">
          <button 
            onClick={insertExample}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          >
            Insert Example
          </button>
          <button 
            onClick={() => setLatexCode('')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          >
            Clear
          </button>
        </div>
        <textarea
          value={latexCode}
          onChange={handleLatexInputChange}
          className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Paste your LaTeX table code here..."
        ></textarea>
      </div>
      
      <div className="mb-4 flex items-center">
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showFullHtml}
            onChange={() => setShowFullHtml(!showFullHtml)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
          />
          Generate complete HTML document with styling
        </label>
      </div>
      
      <div className="mb-4">
        <button
          onClick={handleConvert}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
        >
          Convert to HTML
        </button>
      </div>
      
      {htmlOutput && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">HTML Output:</h3>
            <button
              onClick={handleCopyHtml}
              className={`px-3 py-1 text-sm ${copied ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded`}
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <pre className="whitespace-pre-wrap overflow-x-auto text-sm text-gray-800">
              {htmlOutput}
            </pre>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Preview:</h3>
            <div className="border border-gray-200 rounded-md p-4 bg-white min-h-[100px]">
              <div dangerouslySetInnerHTML={{ __html: htmlOutput }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatexTableConverter; 