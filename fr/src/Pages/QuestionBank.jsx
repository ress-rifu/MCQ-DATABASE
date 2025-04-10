import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import { renderLatex, containsComplexTable, fixBengaliTableFormat } from '../utils/latexRenderer';
import EnhancedRichTextEditor from '../components/EnhancedRichTextEditor';
import LatexEquationModal from '../components/LatexEquationModal';
import Pagination from '../Components/Pagination'; // Corrected path capitalization
import Modal from '../components/Modal';
import ModalActions, { PrimaryButton, SecondaryButton, DangerButton } from '../components/ModalActions';
import LaTeXRenderer from '../components/LaTeXRenderer'; // Corrected path capitalization
import '../styles/latexTable.css';

// --- Helper Functions (Defined outside components for reusability) ---

// Smart answer matching function
const findBestMatchingOption = (answer, options) => {
  if (!answer) return null;

  if (['A', 'B', 'C', 'D'].includes(answer?.toUpperCase())) {
    return answer.toUpperCase();
  }

  const cleanAnswer = (text) => {
    if (!text) return '';
    return text.replace(/\$/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, '').toLowerCase(); // Also remove HTML tags
  };

  const cleanedAnswer = cleanAnswer(answer);

  for (const [option, text] of Object.entries(options || {})) { // Add safety check for options
    const cleanedOption = cleanAnswer(text);
    if (cleanedAnswer === cleanedOption) {
      return option.toUpperCase();
    }
  }

  let bestMatch = null;
  let bestMatchScore = 0;

  for (const [option, text] of Object.entries(options || {})) { // Add safety check for options
    const cleanedOption = cleanAnswer(text);
    if (!cleanedOption) continue;

    if (cleanedOption.includes(cleanedAnswer) || cleanedAnswer.includes(cleanedOption)) {
      const score = Math.min(cleanedOption.length, cleanedAnswer.length) /
                     Math.max(cleanedOption.length, cleanedAnswer.length);
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = option;
      }
    }
  }

  if (bestMatch && bestMatchScore > 0.5) {
    return bestMatch.toUpperCase();
  }

  // Fallback: Try matching based on the literal answer text if it's A/B/C/D
  const upperAnswer = String(answer).toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(upperAnswer)) {
    return upperAnswer;
  }


  console.warn("Could not reliably determine best matching option for answer:", answer, "options:", options);
  // Return original answer if no good match, maybe default to 'A' or null depending on requirements
  // Returning the original allows debugging but might break radio buttons if not A/B/C/D
  // It might be better to return null or a default if the original isn't A/B/C/D
   return ['A', 'B', 'C', 'D'].includes(upperAnswer) ? upperAnswer : null;
  // return answer;
};

// Function to render Base64 image or URL
const renderBase64Image = (base64String) => {
    if (!base64String) return null;

    try {
        // Check for data URI format
        if (base64String.startsWith('data:image')) {
            return (
                <img
                    src={base64String}
                    alt="Question related content"
                    className="mt-2 max-w-full h-auto rounded-md object-contain" // Added object-contain
                />
            );
        }
        // Simple check for Base64-like characters (less reliable)
        else if (base64String.match(/^[A-Za-z0-9+/=]+$/) && base64String.length > 50) { // Added length check
            // Assume PNG if type unknown, adjust if needed
            return (
                <img
                    src={`data:image/png;base64,${base64String}`}
                    alt="Decoded Base64 content"
                    className="mt-2 max-w-full h-auto rounded-md object-contain"
                />
            );
        }
        // Assume it's a URL
        else if (base64String.startsWith('http') || base64String.startsWith('/')) {
             return (
                 <img
                    src={base64String}
                    alt="Image from URL"
                    className="mt-2 max-w-full h-auto rounded-md object-contain"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = ""; // Clear broken source
                        e.target.alt = "Image failed to load";
                        e.target.style.display = 'none'; // Hide broken image element
                         console.warn(`Failed to load image from: ${base64String}`);
                    }}
                />
            );
        }

        // If none of the above, it might be invalid data or just text
        console.warn("Unrecognized image format:", base64String.substring(0, 50) + '...');
        return <span className="text-xs text-red-500 italic">(Invalid image data)</span>;

    } catch (e) {
        console.error("Image rendering error:", e, "String:", base64String.substring(0, 50) + '...');
        return <span className="text-xs text-red-500 italic">(Error rendering image)</span>;
    }
};

// Get question text, handle different field names and complex tables
const getQuestionText = (question) => {
    const text = question.ques || question.question || question.question_text || '';

    // Check if this contains the problematic table format and try fixing
    if (containsComplexTable(text)) {
        try {
            return fixBengaliTableFormat(text);
        } catch (error) {
            console.error('Error fixing table format:', error);
            return text; // Return original text if fixing fails
        }
    }

    return text;
};


// --- QuestionCard Component (Moved outside QuestionBank) ---
const QuestionCard = React.memo(({ // Wrap with React.memo for performance optimization
    question,
    onEdit,
    onDelete,
    onAddToCollection,
    onRemoveFromCollection,
    isInCollection,
    isBatchSelectionMode,
    isSelected,
    onSelect,
    isStudent
}) => {
    const questionId = question.id || question._id; // Handle both ID formats

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl border ${
                isSelected
                    ? 'border-blue-500 ring-2 ring-blue-300 dark:border-blue-600 dark:ring-blue-700' // Enhanced selection style
                    : 'border-gray-200 dark:border-gray-700'
            } hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col ${isBatchSelectionMode ? 'cursor-pointer' : ''}`} // Add cursor pointer in batch mode
            onClick={isBatchSelectionMode && !isStudent ? () => onSelect(questionId) : undefined} // Only allow selection click in batch mode for non-students
        >
            {/* Enhanced Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap justify-between items-start gap-y-3">
                    {/* Left side - Subject, Class, Metadata */}
                    <div className="flex flex-col gap-y-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                             <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                {question.subject || 'No Subject'}
                             </h3>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                Class {question.classname?.replace(/^Class\s+/i, '') || 'N/A'}
                             </span>
                             {question.qserial && (
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/30 whitespace-nowrap">
                                    #{question.qserial}
                                </span>
                             )}
                         </div>
                         <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/60 whitespace-nowrap">
                                ID: {(questionId || 'N/A').toString().substring(0, 8)}{ (questionId?.length > 8) ? '...' : ''}
                            </span>
                            {/* Metadata Chips */}
                             {question.chapter && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 whitespace-nowrap">
                                     {question.chapter}
                                </span>
                             )}
                             {question.topic && (
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/30 whitespace-nowrap">
                                    {question.topic}
                                </span>
                             )}
                             {question.difficulty_level && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                    ${question.difficulty_level.toLowerCase() === 'easy'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30'
                                        : question.difficulty_level.toLowerCase() === 'medium'
                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800/30'
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30'
                                    }`}>
                                    {question.difficulty_level}
                                </span>
                             )}
                         </div>
                    </div>

                    {/* Right side - Batch selection checkbox (visible only in batch mode for non-students) */}
                    {isBatchSelectionMode && !isStudent && (
                        <div className="relative flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()} title="Select/Deselect">
                            <input
                                type="checkbox"
                                className="absolute opacity-0 w-5 h-5 cursor-pointer z-10" // Hidden but clickable
                                checked={isSelected}
                                onChange={() => onSelect(questionId)} // Let parent handle state
                                readOnly // Visually controlled by div below
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                                isSelected
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500' // Added group hover effect
                            }`} aria-hidden="true">
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L1.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    )}
                 </div>
             </div>

            {/* Question Content Area */}
            <div className="p-4 sm:p-6 flex-grow space-y-6">
                {/* Question Text and Image */}
                 <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         QUESTION
                    </h4>
                    {/* Apply Tailwind typography for consistent styling, including LaTeX */}
                     <div className="prose prose-slate dark:prose-invert max-w-none p-4 bg-gray-50/70 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/60 shadow-inner text-left">
                        {/* Using LaTeXRenderer for consistent math rendering */}
                         <div className="text-gray-900 dark:text-white text-left question-text [&_p]:my-2" style={{ fontFamily: "'Hind Siliguri', system-ui, sans-serif" }}>
                             <LaTeXRenderer content={getQuestionText(question)} className="bengali-content" />
                         </div>
                        {question.ques_img && (
                            <div className="mt-3 flex justify-center"> {/* Center the image */}
                                 {renderBase64Image(question.ques_img)}
                             </div>
                         )}
                     </div>
                </div>

                {/* Options, Explanation, Hint, Reference - Combined in Details/Accordion for compactness */}
                <details className="group bg-white dark:bg-gray-800/30 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/60 overflow-hidden">
                    <summary className="cursor-pointer p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                            View Options & Solution
                        </span>
                         <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                     <div className="border-t border-gray-200 dark:border-gray-700/60 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/60 space-y-6">

                        {/* Options Section */}
                        <div>
                             <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                 </svg>
                                 OPTIONS
                            </h4>
                            <div className="space-y-3">
                                {['A', 'B', 'C', 'D'].map((optionLetter) => {
                                    const optionText = question[`option_${optionLetter.toLowerCase()}`] || '';
                                    // Smart matching for correct answer
                                    const optionsMap = {
                                        A: question.option_a || '', B: question.option_b || '',
                                        C: question.option_c || '', D: question.option_d || ''
                                    };
                                    const correctAnswerLetter = findBestMatchingOption(question.correct_answer || question.answer, optionsMap);
                                    const isCorrect = correctAnswerLetter === optionLetter;

                                    return (
                                         <div key={optionLetter} className={`flex items-start p-3 rounded-md border ${
                                             isCorrect
                                                 ? 'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/20'
                                        }`}>
                                            <div className={`flex-shrink-0 w-6 h-6 mt-0.5 mr-2 rounded-full border-2 flex items-center justify-center font-semibold text-xs ${
                                                isCorrect
                                                    ? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 dark:border-green-600'
                                                    : 'border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500'
                                             }`}>
                                                {optionLetter}
                                             </div>
                                            <div className="flex-grow text-sm sm:text-base text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none [&_p]:my-1" style={{ fontFamily: "'Hind Siliguri', system-ui, sans-serif" }}>
                                                 <LaTeXRenderer content={optionText || `(Option ${optionLetter} empty)`} className="bengali-content" />
                                                {question[`option_${optionLetter.toLowerCase()}_img`] && (
                                                    <div className="mt-2">
                                                        {renderBase64Image(question[`option_${optionLetter.toLowerCase()}_img`])}
                                                    </div>
                                                )}
                                             </div>
                                         </div>
                                    );
                                })}
                             </div>
                         </div>

                        {/* Correct Answer Display */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                 </svg>
                                CORRECT ANSWER
                            </h4>
                            <div className="p-3 rounded-lg border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-900/20 shadow-sm">
                                <div className="flex items-center">
                                     {(() => {
                                        const optionsMap = {
                                            A: question.option_a || '', B: question.option_b || '',
                                             C: question.option_c || '', D: question.option_d || ''
                                         };
                                        const correctOption = findBestMatchingOption(question.correct_answer || question.answer, optionsMap);

                                        return (
                                            <>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-300 font-medium text-base mr-3">
                                                    {correctOption || '?'} {/* Show '?' if undetermined */}
                                                </div>
                                                <div className="text-base text-green-700 dark:text-green-300 font-medium">
                                                    Option {correctOption || 'Not specified'}
                                                </div>
                                             </>
                                         );
                                    })()}
                                </div>
                             </div>
                         </div>

                        {/* Explanation Section */}
                        {(question.explanation || question.explanation_img) && (
                             <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                     </svg>
                                     EXPLANATION
                                </h4>
                                 <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 shadow-inner text-left">
                                     <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&_p]:my-1" style={{ fontFamily: "'Hind Siliguri', system-ui, sans-serif" }}>
                                        <LaTeXRenderer content={question.explanation || 'No explanation provided'} className="bengali-content" />
                                         {question.explanation_img && (
                                             <div className="mt-3 flex justify-center">
                                                {renderBase64Image(question.explanation_img)}
                                             </div>
                                         )}
                                     </div>
                                 </div>
                            </div>
                         )}

                         {/* Hint & Reference Section */}
                         {(question.hint || question.hint_img || question.reference) && (
                             <div className="space-y-4">
                                {(question.hint || question.hint_img) && (
                                    <div className="p-3 rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-900/20 shadow-sm">
                                        <div className="flex items-center mb-1.5">
                                            <svg className="w-4 h-4 text-amber-500 dark:text-amber-400 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                             </svg>
                                            <div className="text-sm font-medium text-amber-700 dark:text-amber-300">Hint</div>
                                        </div>
                                         <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&_p]:my-1" style={{ fontFamily: "'Hind Siliguri', system-ui, sans-serif" }}>
                                             <LaTeXRenderer content={question.hint || 'No hint provided'} className="bengali-content" />
                                             {question.hint_img && (
                                                 <div className="mt-2 flex justify-center">
                                                    {renderBase64Image(question.hint_img)}
                                                 </div>
                                             )}
                                        </div>
                                    </div>
                                )}
                                {question.reference && (
                                    <div className="p-3 rounded-md border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-900/20 shadow-sm">
                                        <div className="flex items-center mb-1.5">
                                             <svg className="w-4 h-4 text-purple-500 dark:text-purple-400 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Reference</div>
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                            {question.reference}
                                        </div>
                                    </div>
                                )}
                             </div>
                         )}
                     </div>
                </details>
            </div>

             {/* Actions Footer (Conditional based on mode and role) */}
             <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 dark:border-gray-700 mt-auto bg-gray-50/50 dark:bg-gray-800/40 rounded-b-xl">
                {/* Normal Mode Actions */}
                {!isBatchSelectionMode && (
                     <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        {/* Admin/Editor Actions */}
                        {!isStudent && (
                             <>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(question); }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                                    title="Edit Question"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(questionId); }}
                                     className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                                     title="Delete Question"
                                 >
                                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                </button>
                                {/* 'Add to Collection' could mean adding to personal bookmarks OR adding to a curated list */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddToCollection(question); }}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border shadow-sm ${
                                        isInCollection
                                             ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                                             : 'bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-green-600 dark:text-green-400 border-gray-200 dark:border-gray-600'
                                     }`}
                                    title={isInCollection ? "Already in collection" : "Add to Collection"}
                                    disabled={isInCollection}
                                >
                                    {isInCollection ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                     ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    )}
                                    {isInCollection ? 'Collected' : 'Collect'}
                                 </button>
                             </>
                         )}

                        {/* Student Actions - Simplified Bookmark */}
                        {isStudent && (
                            <>
                                 {isInCollection ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemoveFromCollection(question); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium transition-colors border border-red-100 dark:border-red-800/40 shadow-sm"
                                        title="Remove Bookmark"
                                    >
                                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                             <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /> {/* Filled bookmark */}
                                             <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M9 9 L11 11 M11 9 L9 11" /> {/* Minus Sign overlay */}
                                        </svg>
                                        Bookmarked
                                     </button>
                                 ) : (
                                     <button
                                        onClick={(e) => { e.stopPropagation(); onAddToCollection(question); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium transition-colors border border-blue-100 dark:border-blue-800/40 shadow-sm"
                                        title="Bookmark this Question"
                                     >
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /> {/* Outline bookmark */}
                                         </svg>
                                        Bookmark
                                     </button>
                                )}
                            </>
                         )}
                     </div>
                 )}

                 {/* Batch Mode Footer (Simplified display, actions handled globally) */}
                {isBatchSelectionMode && (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                        {isSelected ? 'Selected' : 'Click to select'}
                    </div>
                 )}
            </div>
        </div>
    );
}); // End of QuestionCard Component


// --- QuestionBank Component ---
const QuestionBank = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editData, setEditData] = useState(null); // Data for the question being edited
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null); // ID of the question to be deleted
    const [selectedQuestions, setSelectedQuestions] = useState([]); // User's bookmarked/collected questions
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Curriculum Data
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);

    // Filter States
    const [filters, setFilters] = useState({
        class_id: '', subject_id: '', chapter_id: '',
        topic: '', difficulty_level: '', reference: '',
    });
    const [filteredSubjects, setFilteredSubjects] = useState([]); // Subjects for main filter dropdown
    const [filteredChapters, setFilteredChapters] = useState([]); // Chapters for main filter dropdown

    // Edit Modal Dropdown States
    const [filteredEditSubjects, setFilteredEditSubjects] = useState([]);
    const [filteredEditChapters, setFilteredEditChapters] = useState([]);

    // Sorting State
    const [sortBy, setSortBy] = useState('id'); // Default sort by ID
    const [sortOrder, setSortOrder] = useState('desc'); // Default descending

    // Batch Selection States
    const [batchSelectedIds, setBatchSelectedIds] = useState([]);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
    const [isBatchSelectionMode, setIsBatchSelectionMode] = useState(false);

    // Toast Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Equation Modal States
    const [showEquationModal, setShowEquationModal] = useState(false);
    const [currentEditingField, setCurrentEditingField] = useState(null); // Which field (e.g., 'question_text', 'option_a') is adding an equation

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // Default page size

    // User Role State
    const [user, setUser] = useState(null);
    const isStudent = user?.role === 'student'; // Derived state for convenience

    // --- Utility Functions ---

    // Show notification function
    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000); // Auto-hide after 3 seconds
    }, []);

    // Check if a question is in the user's collection/bookmarks
    const checkIsInCollection = useCallback((questionId) => {
        if (!questionId) return false;
        return selectedQuestions.some(q => (q._id || q.id) === questionId);
    }, [selectedQuestions]);


    // --- Data Fetching ---

    const fetchQuestions = useCallback(async () => {
        console.log('Attempting to fetch questions...');
        try {
            setLoading(true);
            setError('');
            const res = await axios.get(`${API_BASE_URL}/api/questions`, {
                headers: { ...getAuthHeader(), 'Cache-Control': 'no-cache' }
            });
            console.log(`Successfully fetched ${res.data?.length || 0} questions.`);
             // Standardize ID: ensure every question has an `id` field
             const standardizedQuestions = res.data.map(q => ({
                ...q,
                id: q.id || q._id // Prefer 'id', fallback to '_id'
            }));
            setQuestions(standardizedQuestions);
        } catch (err) {
            console.error("Error fetching questions:", err);
            if (err.response) {
                 console.error('Server response error:', err.response.status, err.response.data);
                if (err.response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    showNotification('Session expired. Redirecting to login.', 'error');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                } else if (err.response.status === 403) {
                    setError('Access denied. You do not have permission to view questions.');
                    showNotification('Access denied.', 'error');
                } else {
                     const message = err.response.data?.message || 'Failed to fetch questions';
                    setError(`Error: ${message}`);
                     showNotification(message, 'error');
                }
             } else if (err.request) {
                console.error('Network error or no response:', err.request);
                setError('Cannot connect to the server. Please check network and backend status.');
                showNotification('Network Error. Could not fetch questions.', 'error');
             } else {
                setError('An unexpected error occurred while fetching questions.');
                showNotification('Failed to fetch questions. Please try again.', 'error');
            }
            setQuestions([]); // Clear questions on error
        } finally {
            setLoading(false);
        }
    }, [navigate, showNotification]);

    const fetchCurriculum = useCallback(async () => {
         console.log('Fetching curriculum data...');
        try {
            const [classesRes, subjectsRes, chaptersRes] = await Promise.all([
                 axios.get(`${API_BASE_URL}/api/curriculum/classes`, { headers: getAuthHeader() }),
                 axios.get(`${API_BASE_URL}/api/curriculum/subjects`, { headers: getAuthHeader() }),
                 axios.get(`${API_BASE_URL}/api/curriculum/chapters`, { headers: getAuthHeader() })
             ]);
             console.log('Curriculum data fetched.');
             setClasses(classesRes.data || []);
             setSubjects(subjectsRes.data || []);
            setChapters(chaptersRes.data || []);
        } catch (err) {
            console.error("Error fetching curriculum data:", err);
             // Avoid showing notification for this if questions fail auth
             if (err.response?.status !== 401 && err.response?.status !== 403) {
                showNotification("Failed to load curriculum data (filters may be limited)", "warning");
             }
        }
     }, [showNotification]);


    // --- Effects ---

    // Initial data fetch and load stored selections/user
    useEffect(() => {
        fetchQuestions();
        fetchCurriculum();

        const storedQuestions = localStorage.getItem('selectedQuestions');
        if (storedQuestions) {
             try {
                 const parsedQuestions = JSON.parse(storedQuestions);
                 // Ensure IDs are consistent when loading
                 const standardizedSelected = parsedQuestions.map(q => ({ ...q, id: q.id || q._id }));
                 setSelectedQuestions(standardizedSelected);
             } catch (e) {
                console.error("Failed to parse stored questions:", e);
                localStorage.removeItem('selectedQuestions');
             }
         }

        const userData = localStorage.getItem('user');
        if (userData) {
             try {
                setUser(JSON.parse(userData));
             } catch(e) {
                console.error("Failed to parse user data:", e);
                localStorage.removeItem('user');
             }
         }
    }, [fetchQuestions, fetchCurriculum]); // Add fetchQuestions/Curriculum to dependency array

    // Update filtered subjects when main class filter changes
    useEffect(() => {
        if (filters.class_id) {
            const classIdStr = String(filters.class_id);
            const filtered = subjects.filter(s => String(s.class_id) === classIdStr);
            setFilteredSubjects(filtered);
            // Reset subject/chapter if the selected class doesn't contain the current subject
            if (filters.subject_id && !filtered.some(s => String(s.id) === String(filters.subject_id))) {
                setFilters(prev => ({ ...prev, subject_id: '', chapter_id: '' }));
            }
        } else {
            setFilteredSubjects(subjects); // Show all subjects if no class selected
            // Clear subject/chapter filters if class is cleared
            if (filters.subject_id || filters.chapter_id) {
                setFilters(prev => ({ ...prev, subject_id: '', chapter_id: '' }));
            }
        }
         // Always reset chapters when class changes (directly or indirectly)
        setFilteredChapters([]);
        if (!filters.class_id || (filters.class_id && !filters.subject_id)) {
             setFilters(prev => ({ ...prev, chapter_id: '' }));
        }
    }, [filters.class_id, subjects, filters.subject_id]); // Add filters.subject_id dependency

     // Update filtered chapters when main subject filter changes
    useEffect(() => {
        if (filters.subject_id) {
             const subjectIdStr = String(filters.subject_id);
            const filtered = chapters.filter(c => String(c.subject_id) === subjectIdStr);
            setFilteredChapters(filtered);
             // Reset chapter if the selected subject doesn't contain the current chapter
            if (filters.chapter_id && !filtered.some(c => String(c.id) === String(filters.chapter_id))) {
                 setFilters(prev => ({ ...prev, chapter_id: '' }));
            }
        } else {
             setFilteredChapters([]); // Show no chapters if no subject selected
            if (filters.chapter_id) {
                setFilters(prev => ({ ...prev, chapter_id: '' }));
            }
         }
    }, [filters.subject_id, chapters, filters.chapter_id]); // Add filters.chapter_id

    // Update filtered subjects for the EDIT modal when class changes
    useEffect(() => {
         if (editData?.class_id) {
            const classIdStr = String(editData.class_id);
            const filtered = subjects.filter(s => String(s.class_id) === classIdStr);
            setFilteredEditSubjects(filtered);
             // Reset subject/chapter in editData if needed
             if (editData.subject_id && !filtered.some(s => String(s.id) === String(editData.subject_id))) {
                 setEditData(prev => ({ ...prev, subject_id: '', chapter_id: '' }));
             }
        } else {
             setFilteredEditSubjects([]);
             setFilteredEditChapters([]);
         }
    }, [editData?.class_id, subjects]);

     // Update filtered chapters for the EDIT modal when subject changes
    useEffect(() => {
        if (editData?.subject_id) {
             const subjectIdStr = String(editData.subject_id);
            const filtered = chapters.filter(c => String(c.subject_id) === subjectIdStr);
             setFilteredEditChapters(filtered);
            // Reset chapter in editData if needed
             if (editData.chapter_id && !filtered.some(c => String(c.id) === String(editData.chapter_id))) {
                setEditData(prev => ({ ...prev, chapter_id: '' }));
             }
         } else {
            setFilteredEditChapters([]);
        }
    }, [editData?.subject_id, chapters]);

     // Reset pagination when filters change
     useEffect(() => {
         setCurrentPage(1);
     }, [filters, pageSize]);


    // --- Event Handlers ---

    // Main filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            class_id: '', subject_id: '', chapter_id: '',
            topic: '', difficulty_level: '', reference: '',
        });
         setFilteredSubjects(subjects); // Reset subject dropdown to all
        setFilteredChapters([]); // Clear chapter dropdown
    };

    // Sort change
    const handleSortChange = (field) => {
        setSortBy(prevSortBy => {
            if (prevSortBy === field) {
                // Toggle order if same field clicked
                setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
                return prevSortBy;
            } else {
                // Sort by new field, default asc
                setSortOrder('asc');
                return field;
            }
        });
        setCurrentPage(1); // Reset page on sort change
    };

    // --- Edit Modal Handlers ---

    const handleEditClick = (question) => {
        if (!question) {
            console.error("Attempted to edit null question");
            showNotification("Cannot edit: Invalid question data.", "error");
            return;
        }

         const questionId = question.id || question._id; // Use standardized ID
        console.log("Preparing to edit question with ID:", questionId, question);

         // Create a clean copy with necessary fields, using standardized IDs
        const editableQuestion = {
             // Use standardized ID for both formats
            id: questionId,
            _id: questionId,
             // Map curriculum IDs - ensure they are numbers or strings as expected by selects
             class_id: question.class_id ? String(question.class_id) : '',
             subject_id: question.subject_id ? String(question.subject_id) : '',
             chapter_id: question.chapter_id ? String(question.chapter_id) : '',
            // Use full names if available, otherwise keep blank
             classname: question.classname || '', // Read-only display based on class_id potentially
             subject: question.subject || '', // Read-only display based on subject_id
             chapter: question.chapter || '', // Read-only display based on chapter_id
             topic: question.topic || '',
             qserial: question.qserial || '',
             difficulty_level: question.difficulty_level || '',
             // Consistent field names for text areas
            question_text: question.ques || question.question_text || question.question || '', // Use a consistent field
            option_a: question.option_a || '',
             option_b: question.option_b || '',
             option_c: question.option_c || '',
             option_d: question.option_d || '',
            correct_answer: findBestMatchingOption(question.correct_answer || question.answer, { // Standardize correct answer to A/B/C/D if possible
                A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d
             }) || '', // Fallback to empty string if cannot determine A/B/C/D
             explanation: question.explanation || '',
            hint: question.hint || '',
             reference: question.reference || '',
            // Store images if present (assuming base64 or URL strings)
             ques_img: question.ques_img || null,
            explanation_img: question.explanation_img || null,
             hint_img: question.hint_img || null,
             option_a_img: question.option_a_img || null,
            option_b_img: question.option_b_img || null,
             option_c_img: question.option_c_img || null,
            option_d_img: question.option_d_img || null,
        };

        console.log("Data prepared for Edit Modal:", editableQuestion);
         setEditData(editableQuestion);
         setShowEditModal(true);
     };


    // Generic handler for simple input/select changes in the edit modal
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => {
            if (!prev) return null;

            const updatedData = { ...prev, [name]: value };

             // When curriculum IDs change, update the corresponding name fields (find from full lists)
             if (name === 'class_id') {
                const selectedClass = classes.find(c => String(c.id) === String(value));
                updatedData.classname = selectedClass ? selectedClass.name : '';
                // Reset subject/chapter if class changes
                updatedData.subject_id = '';
                updatedData.subject = '';
                updatedData.chapter_id = '';
                 updatedData.chapter = '';
            } else if (name === 'subject_id') {
                 const selectedSubject = subjects.find(s => String(s.id) === String(value));
                updatedData.subject = selectedSubject ? selectedSubject.name : '';
                // Reset chapter if subject changes
                updatedData.chapter_id = '';
                 updatedData.chapter = '';
            } else if (name === 'chapter_id') {
                const selectedChapter = chapters.find(c => String(c.id) === String(value));
                updatedData.chapter = selectedChapter ? selectedChapter.name : '';
            }

             return updatedData;
        });
     };


    // Handler for Rich Text Editor changes in the edit modal
     const handleEditRichTextChange = useCallback((field, content) => {
        setEditData(prev => prev ? { ...prev, [field]: content } : null);
    }, []);


    // Handler for saving the edited question
    const handleSaveEdit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!editData || !editData.id) {
            showNotification("Cannot save: No question data loaded for editing.", "error");
            return;
        }

         // Basic Validation
         const requiredFields = ['class_id', 'subject_id', 'chapter_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
         const missingFields = requiredFields.filter(field => !editData[field]);

         if (missingFields.length > 0) {
            showNotification(`Please fill required fields: ${missingFields.join(', ')}`, 'warning');
            return;
         }

        // Ensure correct_answer is A, B, C, or D
        if (!['A', 'B', 'C', 'D'].includes(editData.correct_answer)) {
             showNotification('Please select a valid correct answer (A, B, C, or D).', 'warning');
             return;
         }


        setIsUpdating(true);
         console.log("Saving changes for question ID:", editData.id);

        try {
             // Prepare data for the backend, mapping frontend names to backend names if necessary
             // Ensure IDs are sent as numbers if the backend expects them (adjust if needed)
            const questionPayload = {
                ...editData, // Include all fields from editData
                // Map fields if backend names differ (example below assumes they match or backend handles frontend names)
                ques: editData.question_text,       // Map to 'ques' if backend uses that
                 answer: editData.correct_answer,     // Map to 'answer' if backend uses that
                 class_id: parseInt(editData.class_id, 10) || null, // Ensure numbers if needed
                 subject_id: parseInt(editData.subject_id, 10) || null,
                 chapter_id: parseInt(editData.chapter_id, 10) || null,
             };

             // Remove temporary/frontend-only fields before sending
            delete questionPayload.id; // Backend likely uses _id or its own primary key
             delete questionPayload._id; // Use the ID in the URL instead
             delete questionPayload.question_text; // Sent as 'ques'
             delete questionPayload.correct_answer; // Sent as 'answer'
             delete questionPayload.classname; // Backend should derive from ID
             delete questionPayload.subject;   // Backend should derive from ID
             delete questionPayload.chapter;   // Backend should derive from ID

            const endpoint = `${API_BASE_URL}/api/questions/${editData.id}`; // Use the standardized ID
             console.log("Sending PUT request to:", endpoint, "with payload:", questionPayload);

            const res = await axios.put(endpoint, questionPayload, { headers: getAuthHeader() });

            console.log("Update response:", res.data);
            showNotification('Question updated successfully!');

             // Close modal and clear edit data
            setShowEditModal(false);
             setEditData(null);

            // Refresh the questions list to show the update
            fetchQuestions();

             // Update the question in the local selected/bookmarked list as well
            setSelectedQuestions(prevSelected => prevSelected.map(q =>
                 q.id === editData.id ? { ...q, ...editData, ...res.data } : q // Update with potentially new data from server
             ));
             localStorage.setItem('selectedQuestions', JSON.stringify(selectedQuestions.map(q =>
                q.id === editData.id ? { ...q, ...editData, ...res.data } : q
            )));

         } catch (err) {
            console.error("Error saving question:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save question.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                 showNotification(`Save failed: ${errorMsg} Please log in again.`, 'error');
                 // Optional: Redirect to login
             } else {
                showNotification(`Failed to save question: ${errorMsg}`, 'error');
            }
         } finally {
             setIsUpdating(false);
        }
    };


    // --- Delete Handlers ---

    const handleDeleteClick = (id) => {
        if (!id) {
            showNotification('Cannot delete: Question ID is missing.', 'error');
             return;
         }
        console.log("Requesting delete for question ID:", id);
         setDeleteId(id);
        setShowDeleteModal(true);
     };


    const deleteQuestion = async () => {
        if (!deleteId) {
            showNotification('Delete failed: No question ID specified.', 'error');
             setShowDeleteModal(false);
            return;
         }

         setIsDeleting(true);
        console.log("Confirming deletion for ID:", deleteId);

         try {
             const endpoint = `${API_BASE_URL}/api/questions/${deleteId}`;
             await axios.delete(endpoint, { headers: getAuthHeader() });

             showNotification('Question deleted successfully!');
            setShowDeleteModal(false);

            // Remove from the main questions list
             setQuestions(prev => prev.filter(q => q.id !== deleteId));

             // Remove from selected questions (bookmarks)
             const updatedSelection = selectedQuestions.filter(q => q.id !== deleteId);
            setSelectedQuestions(updatedSelection);
             localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));

            setDeleteId(null); // Clear the ID after successful deletion
         } catch (err) {
             console.error("Error deleting question:", err);
             const errorMsg = err.response?.data?.message || err.message || 'Failed to delete question.';
             if (err.response?.status === 401 || err.response?.status === 403) {
                 showNotification(`Delete failed: ${errorMsg} Please log in again.`, 'error');
             } else {
                 showNotification(`Failed to delete question: ${errorMsg}`, 'error');
            }
             setShowDeleteModal(false); // Close modal even on error
         } finally {
             setIsDeleting(false);
        }
    };


    // --- Collection/Bookmark Handlers ---

    const handleSelectQuestion = (question) => { // Adds a single question to collection
        const questionId = question.id || question._id;
         if (checkIsInCollection(questionId)) {
             showNotification('Question already in your collection.', 'warning');
             return;
         }
         const updatedSelection = [...selectedQuestions, { ...question, id: questionId }]; // Ensure standardized ID
        setSelectedQuestions(updatedSelection);
        localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
        showNotification('Question added to collection.');
    };

     const handleRemoveQuestion = (question) => { // Removes a single question from collection
         const questionId = question.id || question._id;
         if (!checkIsInCollection(questionId)) {
             showNotification('Question not found in your collection.', 'warning');
             return;
         }
         const updatedSelection = selectedQuestions.filter(q => (q.id || q._id) !== questionId);
        setSelectedQuestions(updatedSelection);
        localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
        showNotification('Question removed from collection.');
    };


    // --- Batch Action Handlers ---

    const toggleBatchSelectionMode = () => {
        if (isStudent) {
             showNotification('Batch actions are not available.', 'warning');
            return;
         }
        const enteringBatchMode = !isBatchSelectionMode;
        setIsBatchSelectionMode(enteringBatchMode);
         if (!enteringBatchMode) {
             setBatchSelectedIds([]); // Clear selections when exiting batch mode
        }
    };

    const handleBatchSelect = (questionId) => {
         if (!isBatchSelectionMode || isStudent) return; // Only works in batch mode for non-students

         setBatchSelectedIds(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId); // Deselect
             } else {
                 return [...prev, questionId]; // Select
            }
         });
     };

    const selectAllVisibleQuestions = () => {
         if (!isBatchSelectionMode || isStudent) return;
         const visibleIds = getPaginatedQuestions().map(q => q.id || q._id); // Select only IDs on the current page
         setBatchSelectedIds(visibleIds);
     };

    const clearSelection = () => {
         if (!isBatchSelectionMode || isStudent) return;
        setBatchSelectedIds([]);
     };

    const addBatchToCollection = () => {
        if (!isBatchSelectionMode || isStudent || batchSelectedIds.length === 0) {
            showNotification('No questions selected or action not allowed.', 'warning');
            return;
        }

        const questionsToAdd = questions.filter(q => batchSelectedIds.includes(q.id || q._id));
         let addedCount = 0;
         const newSelectedQuestions = [...selectedQuestions];
         const currentCollectionIds = new Set(selectedQuestions.map(q => q.id || q._id));

        questionsToAdd.forEach(question => {
             const questionId = question.id || question._id;
             if (!currentCollectionIds.has(questionId)) {
                 newSelectedQuestions.push({ ...question, id: questionId }); // Ensure standardized ID
                addedCount++;
             }
        });

         if (addedCount > 0) {
             setSelectedQuestions(newSelectedQuestions);
             localStorage.setItem('selectedQuestions', JSON.stringify(newSelectedQuestions));
            showNotification(`Added ${addedCount} question(s) to collection.`);
             // Exit batch mode after action
             setIsBatchSelectionMode(false);
            setBatchSelectedIds([]);
         } else {
             showNotification('All selected questions are already in your collection.', 'info');
             setIsBatchSelectionMode(false); // Still exit batch mode
            setBatchSelectedIds([]);
         }
     };

     const openBatchDeleteModal = () => {
         if (!isBatchSelectionMode || isStudent || batchSelectedIds.length === 0) {
            showNotification('No questions selected for deletion or action not allowed.', 'warning');
            return;
         }
         setShowBatchDeleteModal(true);
    };

    const batchDeleteQuestions = async () => {
        if (batchSelectedIds.length === 0) {
             setShowBatchDeleteModal(false);
             return;
         }

         setIsDeleting(true);
        let deletedCount = 0;
         let failedCount = 0;
         const errors = [];

        console.log(`Attempting to batch delete ${batchSelectedIds.length} questions...`);

         // Sequentially delete to provide better feedback, though Promise.allSettled could be faster
         for (const idToDelete of batchSelectedIds) {
            try {
                const endpoint = `${API_BASE_URL}/api/questions/${idToDelete}`;
                 await axios.delete(endpoint, { headers: getAuthHeader() });
                 deletedCount++;
            } catch (err) {
                failedCount++;
                console.error(`Failed to delete question ID ${idToDelete}:`, err);
                 const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
                errors.push(`ID ${idToDelete}: ${errorMsg}`);
                 // Stop batch delete on critical errors like auth failure
                 if (err.response?.status === 401 || err.response?.status === 403) {
                    showNotification(`Batch delete stopped due to permission error. ${deletedCount} deleted.`, 'error');
                    break; // Exit the loop
                 }
             }
        }

         setShowBatchDeleteModal(false);
         setIsBatchSelectionMode(false);

         // Update UI state based on successful deletions
         if (deletedCount > 0) {
            const remainingQuestions = questions.filter(q => !batchSelectedIds.slice(0, deletedCount + failedCount).includes(q.id || q._id)); // Adjust filter based on attempt
            setQuestions(remainingQuestions);
            const updatedSelection = selectedQuestions.filter(q => !batchSelectedIds.slice(0, deletedCount + failedCount).includes(q.id || q._id));
             setSelectedQuestions(updatedSelection);
            localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
             showNotification(`Successfully deleted ${deletedCount} question(s).`, 'success');
         }

         if (failedCount > 0) {
             console.error("Batch delete failures:", errors);
             showNotification(`${failedCount} question(s) failed to delete. Check console for details.`, 'error');
             // Leave failed IDs selected for potential retry? Maybe clear selection anyway.
             setBatchSelectedIds([]); // Clear selection regardless of failure for simplicity now
        } else if (deletedCount === 0 && failedCount === 0) {
            // This case shouldn't happen if the modal check works, but handle it
             showNotification("No questions were deleted.", "info");
             setBatchSelectedIds([]);
        }

        setBatchSelectedIds([]); // Ensure selection is cleared
         setIsDeleting(false);
     };

    const viewSelectedQuestions = () => {
        navigate('/myquestion'); // Navigate to the page displaying selected questions
    };


    // --- Equation Modal Handlers ---

    const openEquationModal = (fieldName) => {
        setCurrentEditingField(fieldName); // Record which field needs the equation
        setShowEquationModal(true);
    };

    // Function to insert the LaTeX equation into the currently active rich text editor field
    const insertEquation = (equation) => {
        if (!currentEditingField || !editData) {
            console.warn("Cannot insert equation: No target field specified or edit data missing.");
            return;
        }

         // Add $ delimiters if not already present (basic check)
         const formattedEquation = equation.startsWith('$') && equation.endsWith('$') ? equation : `$${equation}$`;

        // Update the specific field in editData
        setEditData(prevData => ({
            ...prevData,
            // Append the equation to the existing content of the target field
            [currentEditingField]: (prevData[currentEditingField] || '') + ' ' + formattedEquation,
        }));

        setShowEquationModal(false); // Close the modal
        setCurrentEditingField(null); // Reset the target field
    };

    // --- Filtering and Sorting Logic ---

     const filteredAndSortedQuestions = React.useMemo(() => {
        console.log("Recalculating filtered and sorted questions...");
        return questions
             .filter((q) => {
                // Apply filters - ensure type consistency (string comparison often safer)
                const classMatch = !filters.class_id || String(q.class_id) === String(filters.class_id);
                 const subjectMatch = !filters.subject_id || String(q.subject_id) === String(filters.subject_id);
                 const chapterMatch = !filters.chapter_id || String(q.chapter_id) === String(filters.chapter_id);
                 const topicMatch = !filters.topic || (q.topic && q.topic.toLowerCase().includes(filters.topic.toLowerCase()));
                 const difficultyMatch = !filters.difficulty_level || q.difficulty_level === filters.difficulty_level;
                 const referenceMatch = !filters.reference || (q.reference && q.reference.toLowerCase().includes(filters.reference.toLowerCase()));
                // Combine all filter conditions
                return classMatch && subjectMatch && chapterMatch && topicMatch && difficultyMatch && referenceMatch;
             })
            .sort((a, b) => {
                let valueA, valueB;
                const field = sortBy;

                 // Handle potential null/undefined values and get sortable values
                 const getValue = (obj, field) => {
                    const val = obj ? obj[field] : null;
                    if (val === null || typeof val === 'undefined') {
                        // Define default sort value for empty fields
                        if (field === 'id') return 0;
                        if (typeof val === 'string') return '';
                         return -Infinity; // Push null numbers/dates to the beginning/end depending on order
                     }

                     if (field === 'difficulty_level') {
                        const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
                         return difficultyMap[String(val).toLowerCase()] || 0;
                     }
                    if (field === 'created_at' || field === 'updated_at') {
                         return new Date(val).getTime() || 0;
                     }
                     return val;
                };

                valueA = getValue(a, field);
                valueB = getValue(b, field);

                // Comparison logic
                let comparison = 0;
                 if (typeof valueA === 'string' && typeof valueB === 'string') {
                    comparison = valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: 'base' });
                } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                     comparison = valueA - valueB;
                } else {
                    // Fallback for mixed types or other types (might need adjustment)
                    comparison = String(valueA).localeCompare(String(valueB));
                }

                 return sortOrder === 'asc' ? comparison : -comparison;
            });
     }, [questions, filters, sortBy, sortOrder]); // Dependencies for memoization


    // --- Pagination Logic ---

     const getPaginatedQuestions = useCallback(() => {
         const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredAndSortedQuestions.slice(startIndex, endIndex);
     }, [filteredAndSortedQuestions, currentPage, pageSize]);

     const totalPages = Math.ceil(filteredAndSortedQuestions.length / pageSize);


    // --- Render ---

    const getSortIndicator = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? ' ▲' : ' ▼';
    };

    // JSX structure for the page
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 p-4 sm:p-6 md:p-8">
            <div className="max-w-screen-2xl mx-auto"> {/* Limit width for very large screens */}

                 {/* Page Header & Global Actions */}
                 <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                     {/* Left: Title and Count */}
                     <div className="flex-shrink-0">
                         <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                            Question Bank
                        </h1>
                         <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {loading ? 'Loading...' : `${filteredAndSortedQuestions.length} question(s) found`}
                             {isBatchSelectionMode && ` (${batchSelectedIds.length} selected)`}
                        </p>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* View Collection Button */}
                         <SecondaryButton onClick={viewSelectedQuestions} size="sm" title="View your bookmarked questions">
                             <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            My Collection ({selectedQuestions.length})
                        </SecondaryButton>

                        {/* Add Question Button (Non-students) */}
                         {!isStudent && (
                            <PrimaryButton onClick={() => navigate('/add-question')} size="sm" title="Create a new question">
                                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Add Question
                             </PrimaryButton>
                         )}

                        {/* Batch Actions Toggle (Non-students) */}
                        {!isStudent && (
                             <button
                                onClick={toggleBatchSelectionMode}
                                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border shadow-sm flex items-center gap-1.5 ${
                                    isBatchSelectionMode
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                                 }`}
                                title={isBatchSelectionMode ? "Cancel batch actions" : "Enable batch selection/actions"}
                             >
                                 {isBatchSelectionMode ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                                {isBatchSelectionMode ? 'Cancel Batch' : 'Batch Actions'}
                            </button>
                         )}
                     </div>
                </div>


                {/* Filters Panel */}
                 <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <details> {/* Make filters collapsible */}
                         <summary className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 list-none flex justify-between items-center">
                             <span>Filter & Sort Options</span>
                             <svg className="w-5 h-5 transition-transform transform rotate-0 ui-open:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                             </svg>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                                {/* Class Filter */}
                                 <div>
                                    <label htmlFor="filter-class" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Class</label>
                                     <select
                                         id="filter-class"
                                        name="class_id"
                                        value={filters.class_id}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                    >
                                         <option value="">All Classes</option>
                                        {classes.map(c => (
                                             <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                 {/* Subject Filter */}
                                <div>
                                     <label htmlFor="filter-subject" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</label>
                                     <select
                                        id="filter-subject"
                                         name="subject_id"
                                        value={filters.subject_id}
                                         onChange={handleFilterChange}
                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                        disabled={!filters.class_id && filteredSubjects.length === subjects.length} // Disable if class not selected or if showing all anyway
                                    >
                                        <option value="">All Subjects</option>
                                        {filteredSubjects.map(s => (
                                             <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                     </select>
                                </div>
                                {/* Chapter Filter */}
                                 <div>
                                    <label htmlFor="filter-chapter" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Chapter</label>
                                    <select
                                        id="filter-chapter"
                                         name="chapter_id"
                                        value={filters.chapter_id}
                                         onChange={handleFilterChange}
                                         className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                         disabled={!filters.subject_id} // Disable if subject not selected
                                     >
                                        <option value="">All Chapters</option>
                                        {filteredChapters.map(c => (
                                             <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                 </div>
                                {/* Topic Filter */}
                                <div>
                                    <label htmlFor="filter-topic" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Topic</label>
                                    <input
                                        type="text"
                                         id="filter-topic"
                                        name="topic"
                                        value={filters.topic}
                                        onChange={handleFilterChange}
                                         placeholder="Filter by topic..."
                                         className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                     />
                                </div>
                                 {/* Difficulty Filter */}
                                <div>
                                    <label htmlFor="filter-difficulty" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Difficulty</label>
                                    <select
                                        id="filter-difficulty"
                                         name="difficulty_level"
                                         value={filters.difficulty_level}
                                         onChange={handleFilterChange}
                                         className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                    >
                                         <option value="">Any Difficulty</option>
                                        <option value="Easy">Easy</option>
                                         <option value="Medium">Medium</option>
                                         <option value="Hard">Hard</option>
                                     </select>
                                 </div>
                                {/* Reference Filter */}
                                <div>
                                    <label htmlFor="filter-reference" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reference</label>
                                     <input
                                        type="text"
                                        id="filter-reference"
                                        name="reference"
                                        value={filters.reference}
                                         onChange={handleFilterChange}
                                         placeholder="Filter by reference..."
                                         className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                     />
                                </div>
                             </div>
                             {/* Sorting and Clear Buttons */}
                             <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                {/* Sorting Controls */}
                                 <div className="flex items-center gap-2 text-sm">
                                    <label htmlFor="sort-by" className="text-gray-600 dark:text-gray-400">Sort By:</label>
                                     <select
                                        id="sort-by"
                                         value={sortBy}
                                         onChange={(e) => handleSortChange(e.target.value)}
                                         className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                     >
                                        <option value="id">ID</option>
                                         <option value="subject">Subject</option>
                                        <option value="classname">Class</option>
                                        <option value="chapter">Chapter</option>
                                        <option value="topic">Topic</option>
                                        <option value="difficulty_level">Difficulty</option>
                                         <option value="created_at">Date Created</option>
                                        <option value="updated_at">Date Updated</option>
                                    </select>
                                    <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}>
                                        {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
                                     </button>
                                 </div>
                                {/* Clear Filters Button */}
                                <SecondaryButton onClick={clearFilters} size="sm">
                                     Clear Filters & Sort
                                </SecondaryButton>
                             </div>
                         </div>
                     </details>
                 </div>


                 {/* Batch Action Bar (Visible only in batch mode for non-students) */}
                 {isBatchSelectionMode && !isStudent && (
                     <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3">
                         <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Batch Actions: {batchSelectedIds.length} selected
                         </p>
                         <div className="flex items-center gap-2 flex-wrap">
                            <SecondaryButton onClick={selectAllVisibleQuestions} size="xs" disabled={getPaginatedQuestions().length === 0}>
                                Select Page ({getPaginatedQuestions().length})
                             </SecondaryButton>
                            <SecondaryButton onClick={clearSelection} size="xs" disabled={batchSelectedIds.length === 0}>
                                 Clear Selection
                             </SecondaryButton>
                            <PrimaryButton onClick={addBatchToCollection} size="xs" disabled={batchSelectedIds.length === 0}>
                                 Add to Collection
                             </PrimaryButton>
                             <DangerButton onClick={openBatchDeleteModal} size="xs" disabled={batchSelectedIds.length === 0}>
                                 Delete Selected
                            </DangerButton>
                         </div>
                     </div>
                 )}

                {/* Questions Grid - Single column layout */}
                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center items-center py-16 text-gray-500 dark:text-gray-400">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                            Loading Questions...
                        </div>
                    ) : error ? (
                         <div className="col-span-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-6 text-center shadow-sm">
                             <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400 mb-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             </div>
                            <p className="text-red-700 dark:text-red-300 font-medium text-sm sm:text-base">{error}</p>
                            <button onClick={fetchQuestions} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                 Retry
                             </button>
                         </div>
                    ) : filteredAndSortedQuestions.length === 0 ? (
                         <div className="col-span-full bg-gray-100 dark:bg-gray-800/50 rounded-xl p-8 sm:p-12 text-center shadow-inner border border-gray-200 dark:border-gray-700">
                             <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 3h.01" /></svg>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                                No Questions Found
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                 Try adjusting the filters above or add a new question to the bank.
                            </p>
                            { (filters.class_id || filters.subject_id || filters.chapter_id || filters.topic || filters.difficulty_level || filters.reference) &&
                                 <button onClick={clearFilters} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                     Clear Filters
                                </button>
                             }
                        </div>
                    ) : (
                        // Render the paginated question cards
                        getPaginatedQuestions().map(question => {
                             const questionId = question.id || question._id;
                            const isCurrentlySelected = batchSelectedIds.includes(questionId);
                             const isInUserCollection = checkIsInCollection(questionId);

                            return (
                                <QuestionCard
                                     key={questionId} // Use the standardized ID as key
                                     question={question}
                                     onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onAddToCollection={handleSelectQuestion}
                                     onRemoveFromCollection={handleRemoveQuestion}
                                    isInCollection={isInUserCollection}
                                    isBatchSelectionMode={isBatchSelectionMode}
                                     isSelected={isCurrentlySelected}
                                    onSelect={handleBatchSelect}
                                    isStudent={isStudent}
                                />
                             );
                         })
                    )}
                 </div>

                {/* Pagination Controls */}
                {filteredAndSortedQuestions.length > pageSize && !loading && !error && (
                     <Pagination
                        totalItems={filteredAndSortedQuestions.length}
                         currentPage={currentPage}
                         pageSize={pageSize}
                         onPageChange={setCurrentPage}
                         onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} // Reset to page 1 on size change
                         className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                         totalPages={totalPages} // Pass total pages for display if needed
                    />
                 )}

                {/* --- Modals --- */}

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                     title={<span className="text-red-600 dark:text-red-400 flex items-center gap-2"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.22 3.03-1.742 3.03H4.42c-1.522 0-2.492-1.7-1.742-3.03l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Delete Question</span>}
                    size="sm"
                 >
                    <div className="py-2">
                         <p className="text-gray-700 dark:text-gray-300">
                            Are you sure you want to permanently delete this question?
                         </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Question ID: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{deleteId}</span><br /> This action cannot be undone.
                        </p>
                     </div>
                    <ModalActions>
                        <SecondaryButton onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                             Cancel
                        </SecondaryButton>
                        <DangerButton onClick={deleteQuestion} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </DangerButton>
                    </ModalActions>
                 </Modal>

                 {/* Batch Delete Confirmation Modal */}
                <Modal
                    isOpen={showBatchDeleteModal}
                    onClose={() => setShowBatchDeleteModal(false)}
                     title={<span className="text-red-600 dark:text-red-400 flex items-center gap-2"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.22 3.03-1.742 3.03H4.42c-1.522 0-2.492-1.7-1.742-3.03l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Batch Delete Questions</span>}
                     size="sm"
                 >
                     <div className="py-2">
                         <p className="text-gray-700 dark:text-gray-300">
                             Are you sure you want to permanently delete the <strong className="text-red-600">{batchSelectedIds.length}</strong> selected question{batchSelectedIds.length !== 1 ? 's' : ''}?
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                             This action cannot be undone.
                        </p>
                    </div>
                    <ModalActions>
                        <SecondaryButton onClick={() => setShowBatchDeleteModal(false)} disabled={isDeleting}>
                             Cancel
                        </SecondaryButton>
                        <DangerButton onClick={batchDeleteQuestions} disabled={isDeleting}>
                             {isDeleting ? 'Deleting...' : `Delete ${batchSelectedIds.length} Selected`}
                        </DangerButton>
                    </ModalActions>
                 </Modal>

                {/* Edit Question Modal */}
                <Modal
                    isOpen={showEditModal && !!editData}
                    onClose={() => { setShowEditModal(false); setEditData(null); }} // Clear data on close
                    title={<span className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Edit Question</span>}
                     size="3xl" // Use a larger size like 3xl or 4xl for the form
                 >
                     {editData && (
                        <form onSubmit={handleSaveEdit} className="space-y-5 max-h-[80vh] overflow-y-auto p-1 pr-3"> {/* Allow vertical scroll */}
                             {/* Curriculum Selection */}
                            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                                 <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">Curriculum</legend>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Class */}
                                     <div>
                                         <label htmlFor="edit-class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class <span className="text-red-500">*</span></label>
                                         <select id="edit-class" name="class_id" value={editData.class_id || ''} onChange={handleEditChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300">
                                             <option value="" disabled>Select Class</option>
                                            {classes.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                         </select>
                                    </div>
                                     {/* Subject */}
                                    <div>
                                        <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject <span className="text-red-500">*</span></label>
                                         <select id="edit-subject" name="subject_id" value={editData.subject_id || ''} onChange={handleEditChange} required disabled={!editData.class_id} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50">
                                            <option value="" disabled>Select Subject</option>
                                             {filteredEditSubjects.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                        </select>
                                     </div>
                                     {/* Chapter */}
                                    <div>
                                         <label htmlFor="edit-chapter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter <span className="text-red-500">*</span></label>
                                        <select id="edit-chapter" name="chapter_id" value={editData.chapter_id || ''} onChange={handleEditChange} required disabled={!editData.subject_id} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50">
                                             <option value="" disabled>Select Chapter</option>
                                             {filteredEditChapters.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                         </select>
                                     </div>
                                 </div>
                             </fieldset>

                            {/* Metadata */}
                            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">Details</legend>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                     {/* Topic */}
                                     <div>
                                         <label htmlFor="edit-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                                         <input id="edit-topic" type="text" name="topic" value={editData.topic || ''} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300" />
                                    </div>
                                    {/* Difficulty */}
                                     <div>
                                        <label htmlFor="edit-difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                                        <select id="edit-difficulty" name="difficulty_level" value={editData.difficulty_level || ''} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300">
                                            <option value="">Select Difficulty</option>
                                            <option value="Easy">Easy</option>
                                             <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                     </div>
                                    {/* Serial */}
                                     <div>
                                        <label htmlFor="edit-serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Q Serial</label>
                                        <input id="edit-serial" type="text" name="qserial" value={editData.qserial || ''} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300" />
                                     </div>
                                </div>
                             </fieldset>

                             {/* Question Text */}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question <span className="text-red-500">*</span></label>
                                 <div className="relative rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                     <EnhancedRichTextEditor
                                        value={editData.question_text || ''}
                                         onChange={(content) => handleEditRichTextChange('question_text', content)}
                                         onEquationAdd={() => openEquationModal('question_text')}
                                    />
                                     <button type="button" onClick={() => openEquationModal('question_text')} className="absolute right-2 bottom-1 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Equation">
                                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg> {/* Simple Plus Icon for equation */}
                                    </button>
                                </div>
                             </div>

                             {/* Options */}
                            <fieldset className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                                 <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">Options & Correct Answer <span className="text-red-500">*</span></legend>
                                <div className="space-y-3">
                                    {['A', 'B', 'C', 'D'].map(letter => {
                                         const fieldName = `option_${letter.toLowerCase()}`;
                                         return (
                                             <div key={letter} className="flex items-start gap-3">
                                                 {/* Radio Button for Correct Answer */}
                                                <div className="mt-1 flex items-center">
                                                     <input
                                                        type="radio"
                                                         id={`edit-answer-${letter}`}
                                                        name="correct_answer" // Name must be the same for radio group
                                                        value={letter}
                                                         checked={editData.correct_answer === letter}
                                                        onChange={handleEditChange} // Use generic handler for radio change
                                                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                                                         required // Ensure one option must be selected
                                                    />
                                                     <label htmlFor={`edit-answer-${letter}`} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                         ({letter})
                                                     </label>
                                                 </div>
                                                {/* Rich Text Editor for Option Text */}
                                                 <div className="flex-grow relative">
                                                     <div className="rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                                         <EnhancedRichTextEditor
                                                             value={editData[fieldName] || ''}
                                                            onChange={(content) => handleEditRichTextChange(fieldName, content)}
                                                             onEquationAdd={() => openEquationModal(fieldName)}
                                                        />
                                                    </div>
                                                     <button type="button" onClick={() => openEquationModal(fieldName)} className="absolute right-2 bottom-1 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Equation">
                                                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                                                    </button>
                                                </div>
                                             </div>
                                        );
                                    })}
                                 </div>
                            </fieldset>

                            {/* Explanation */}
                            <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation</label>
                                <div className="relative rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                    <EnhancedRichTextEditor
                                        value={editData.explanation || ''}
                                         onChange={(content) => handleEditRichTextChange('explanation', content)}
                                         onEquationAdd={() => openEquationModal('explanation')}
                                    />
                                    <button type="button" onClick={() => openEquationModal('explanation')} className="absolute right-2 bottom-1 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Equation">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                                     </button>
                                </div>
                            </div>

                            {/* Hint */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hint</label>
                                <div className="relative rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                     <EnhancedRichTextEditor
                                        value={editData.hint || ''}
                                        onChange={(content) => handleEditRichTextChange('hint', content)}
                                         onEquationAdd={() => openEquationModal('hint')}
                                    />
                                     <button type="button" onClick={() => openEquationModal('hint')} className="absolute right-2 bottom-1 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Add Equation">
                                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Reference */}
                             <div>
                                 <label htmlFor="edit-reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference</label>
                                 <input id="edit-reference" type="text" name="reference" value={editData.reference || ''} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300" />
                            </div>

                            {/* Image fields could be added here if needed */}

                             {/* Form Actions */}
                             <ModalActions>
                                 <SecondaryButton type="button" onClick={() => { setShowEditModal(false); setEditData(null); }} disabled={isUpdating}>
                                     Cancel
                                 </SecondaryButton>
                                <PrimaryButton type="submit" disabled={isUpdating}>
                                     {isUpdating ? (
                                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                                     ) : (
                                         'Save Changes'
                                    )}
                                </PrimaryButton>
                            </ModalActions>
                        </form>
                    )}
                 </Modal>

                {/* Equation Modal */}
                 {showEquationModal && (
                    <LatexEquationModal
                         isOpen={showEquationModal}
                         onClose={() => setShowEquationModal(false)}
                         onInsert={insertEquation} // Pass the insert function
                    />
                 )}


                 {/* Custom Toast Notification */}
                 {notification.show && (
                     <div className="fixed bottom-5 right-5 z-[9999] animate-fade-in-up">
                         <div className={`flex items-center gap-3 px-4 py-2 rounded-md shadow-xl text-sm font-medium ${
                             notification.type === 'error' ? 'bg-red-600 text-white' :
                            notification.type === 'warning' ? 'bg-amber-500 text-white' :
                                 notification.type === 'info' ? 'bg-blue-600 text-white' :
                                'bg-green-600 text-white' // Default to success
                         }`}>
                            {notification.type === 'error' ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-10a1 1 0 10-2 0v4a1 1 0 102 0V8zm-1-3a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg> :
                            notification.type === 'warning' ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.33-.22 3.03-1.742 3.03H4.42c-1.522 0-2.492-1.7-1.742-3.03l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> :
                                notification.type === 'info' ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg> :
                                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            }
                            <span>{notification.message}</span>
                         </div>
                    </div>
                 )}

             </div> {/* End max-width container */}
        </div> // End main wrapper div
    );
};

export default QuestionBank;