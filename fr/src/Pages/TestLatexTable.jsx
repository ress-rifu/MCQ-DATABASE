import React, { useState } from 'react';
import LaTeXRenderer from '../components/LaTeXRenderer';
import LatexTableConverter from '../components/LatexTableConverter';

/**
 * Test page for LaTeX table rendering with font testing
 */
const TestLatexTable = () => {
  const [latexInput, setLatexInput] = useState(`
    \\begin{array}{|c|c|}
      \\hline
      \\text{English Text} & \\text{বাংলা টেক্সট} \\\\
      \\hline
      \\text{Font Test} & \\text{ফন্ট টেস্ট} \\\\
      \\hline
      \\text{Inter Font} & \\text{টিরো বাংলা ফন্ট} \\\\
      \\hline
      x^2 + y^2 = z^2 & \\text{গণিত সমীকরণ} \\\\
      \\hline
    \\end{array}
  `);

  // Sample Bengali text for testing
  const bengaliSample = "বাংলা টেক্সট এখানে টিরো বাংলা ফন্টে দেখানো হবে";
  
  // Sample mixed text
  const mixedSample = "This is English text with some বাংলা টেক্সট mixed in between.";

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">LaTeX Table Font Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Font Test Examples</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">English Text (Inter Font)</h3>
            <p className="english-text p-3 border rounded">
              This text should be displayed in Inter font.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Bengali Text (Tiro Bangla Font)</h3>
            <p className="bangla-text p-3 border rounded">
              {bengaliSample}
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Mixed Text (Auto Font Detection)</h3>
            <p className="p-3 border rounded">
              {mixedSample}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">LaTeX Rendering Test</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">LaTeX Input</h3>
            <textarea
              className="w-full p-3 border rounded font-mono"
              rows={10}
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Rendered Output</h3>
            <div className="p-4 border rounded bg-gray-50">
              <LaTeXRenderer content={latexInput} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">LaTeX Table Converter</h2>
        <LatexTableConverter />
      </div>
    </div>
  );
};

export default TestLatexTable;
