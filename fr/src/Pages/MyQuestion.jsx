import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { renderLatex } from '../utils/latexRenderer';
import 'katex/dist/katex.min.css';
import EnhancedRichTextEditor from '../components/EnhancedRichTextEditor';
import Pagination from '../Components/Pagination';

const MyQuestion = () => {
    const navigate = useNavigate();
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    // Batch selection states
    const [batchSelectedIds, setBatchSelectedIds] = useState([]);
    const [isBatchSelectionMode, setIsBatchSelectionMode] = useState(false);
    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // User role state
    const [user, setUser] = useState(null);
    const isStudent = user?.role === 'student';

    useEffect(() => {
        // Retrieve the selected questions from localStorage
        const storedQuestions = localStorage.getItem('selectedQuestions');
        if (storedQuestions) {
            setSelectedQuestions(JSON.parse(storedQuestions));
        }
        
        // Get user info from localStorage
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
    }, []);

    // Show notification function
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleBackToQuestionBank = () => {
        navigate('/questionbank');
    };

    const removeQuestion = (questionId) => {
        const updatedQuestions = selectedQuestions.filter(q => {
            // Handle both id formats (MongoDB _id and PostgreSQL id)
            const currentId = q._id || q.id;
            return currentId !== questionId;
        });
        setSelectedQuestions(updatedQuestions);
        localStorage.setItem('selectedQuestions', JSON.stringify(updatedQuestions));
        showNotification(`Question removed from ${isStudent ? 'bookmarks' : 'collection'}`);
    };

    const clearAllQuestions = () => {
        if (window.confirm(`Are you sure you want to clear all ${isStudent ? 'bookmarked' : 'selected'} questions?`)) {
            setSelectedQuestions([]);
            localStorage.removeItem('selectedQuestions');
            showNotification(`All questions cleared from ${isStudent ? 'bookmarks' : 'collection'}`);
        }
    };

    // Batch selection handlers
    const toggleBatchSelectionMode = () => {
        setIsBatchSelectionMode(!isBatchSelectionMode);
        if (isBatchSelectionMode) {
            // Clear selections when exiting batch mode
            setBatchSelectedIds([]);
        }
    };

    const handleBatchSelect = (questionId) => {
        setBatchSelectedIds(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    };

    const selectAllQuestions = () => {
        const allIds = selectedQuestions.map(q => q._id || q.id);
        setBatchSelectedIds(allIds);
    };

    const clearSelection = () => {
        setBatchSelectedIds([]);
    };

    const deleteBatchQuestions = () => {
        if (batchSelectedIds.length === 0) {
            showNotification('Please select questions first', 'warning');
            return;
        }

        if (window.confirm(`Are you sure you want to remove ${batchSelectedIds.length} selected questions?`)) {
            const updatedQuestions = selectedQuestions.filter(q => {
                const questionId = q._id || q.id;
                return !batchSelectedIds.includes(questionId);
            });
            
            setSelectedQuestions(updatedQuestions);
            localStorage.setItem('selectedQuestions', JSON.stringify(updatedQuestions));
            setBatchSelectedIds([]);
            showNotification(`${batchSelectedIds.length} questions removed from ${isStudent ? 'bookmarks' : 'collection'}`);
        }
    };

    const exportToExcel = () => {
        // Prepare data for export
        const exportData = selectedQuestions.map(q => {
            // Create a clean object with just the data we want to export
            return {
                'Class': q.classname,
                'Subject': q.subject,
                'Chapter': q.chapter,
                'Topic': q.topic,
                'Question': q.question_text || q.ques,
                'Question Image': q.ques_img || '',
                'Option A': q.option_a,
                'Option A Image': q.option_a_img || '',
                'Option B': q.option_b,
                'Option B Image': q.option_b_img || '',
                'Option C': q.option_c,
                'Option C Image': q.option_c_img || '',
                'Option D': q.option_d, 
                'Option D Image': q.option_d_img || '',
                'Answer': q.correct_answer || q.answer,
                'Explanation': q.explanation,
                'Explanation Image': q.explanation_img || '',
                'Hint': q.hint || '',
                'Hint Image': q.hint_img || '',
                'Difficulty': q.difficulty_level,
                'Reference': q.reference || ''
            };
        });

        // Create a worksheet from the data
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Questions');
        
        // Generate the Excel file and trigger download
        XLSX.writeFile(workbook, 'selected_questions.xlsx');
        showNotification('Questions exported to Excel');
    };

    // Function to render Base64 image
    const renderBase64Image = (base64String) => {
        if (!base64String) return null;
        
        try {
            // Check if it's a Base64 string (simple validation)
            if (base64String.startsWith('data:image')) {
                return (
                    <img 
                        src={base64String} 
                        alt="Base64 encoded image" 
                        className="mt-2 max-w-full h-auto rounded-md"
                    />
                );
            } else if (base64String.match(/^[A-Za-z0-9+/=]+$/)) {
                // If it's a raw Base64 string without data URI
                return (
                    <img 
                        src={`data:image/png;base64,${base64String}`} 
                        alt="Base64 encoded image" 
                        className="mt-2 max-w-full h-auto rounded-md"
                    />
                );
            }
            
            // If it's a URL, return it as is
            return (
                <img 
                    src={base64String} 
                    alt="Image from URL" 
                    className="mt-2 max-w-full h-auto rounded-md"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                        e.target.alt = "Image failed to load";
                        e.target.className = "hidden";
                    }}
                />
            );
        } catch (e) {
            console.error("Image rendering error:", e);
            return null;
        }
    };

    // Consistently display question text by checking all possible field names
    const getQuestionText = (question) => {
        return question.question_text || question.ques || 'No question text available';
    };

    // Get paginated questions
    const getPaginatedQuestions = () => {
        if (pageSize === 'all') {
            return selectedQuestions;
        }
        
        const startIndex = (currentPage - 1) * pageSize;
        return selectedQuestions.slice(startIndex, startIndex + pageSize);
    };
    
    // Reset pagination when batch selection changes
    useEffect(() => {
        setCurrentPage(1);
    }, [batchSelectedIds.length]);

    if (selectedQuestions.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Floating Header */}
                <div className="sticky top-4 z-30 px-4 sm:px-6 max-w-7xl mx-auto">
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {isStudent ? 'My Bookmarks' : 'My Questions'}
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Your {isStudent ? 'bookmarked' : 'collection of selected'} questions
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <button 
                                        onClick={handleBackToQuestionBank}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Question Bank
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
                    <div className="flex items-center justify-center h-60">
                        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-600 dark:text-gray-400 mb-5">
                                No questions in your {isStudent ? 'bookmarks' : 'collection'} yet. Please {isStudent ? 'bookmark' : 'select'} questions from the Question Bank.
                            </p>
                            <button 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm"
                                onClick={handleBackToQuestionBank}
                            >
                                Go to Question Bank
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Floating Header */}
            <div className="sticky top-4 z-30 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {isStudent ? 'My Bookmarks' : 'My Questions'}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {selectedQuestions.length} Questions in your {isStudent ? 'bookmarks' : 'collection'}
                                    {isBatchSelectionMode && batchSelectedIds.length > 0 && (
                                        <span className="ml-2 text-indigo-500 font-medium">
                                            ({batchSelectedIds.length} selected)
                                        </span>
                                    )}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                {!isBatchSelectionMode ? (
                                    <>
                                        {/* Only show selection mode button for non-students */}
                                        {!isStudent && (
                                            <button 
                                                onClick={toggleBatchSelectionMode}
                                                className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Select Questions
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={clearAllQuestions}
                                            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-all flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Clear All
                                        </button>
                                        
                                        {/* Only show export button for non-students */}
                                        {!isStudent && (
                                            <button 
                                                onClick={exportToExcel}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Export to Excel
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={selectAllQuestions}
                                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Select All
                                        </button>
                                        {batchSelectedIds.length > 0 && (
                                            <button 
                                                onClick={deleteBatchQuestions}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete Selected
                                            </button>
                                        )}
                                        <button 
                                            onClick={toggleBatchSelectionMode}
                                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-all flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Cancel
                                        </button>
                                    </>
                                )}
                                <button 
                                    onClick={handleBackToQuestionBank}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Question Bank
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getPaginatedQuestions().map((question) => {
                        const questionId = question._id || question.id;
                        return (
                            <div 
                                key={questionId} 
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col h-full"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center" onClick={() => isBatchSelectionMode && handleBatchSelect(questionId)}>
                                    <div className="flex items-center gap-2">
                                        {isBatchSelectionMode && (
                                            <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="absolute opacity-0 w-5 h-5 cursor-pointer z-10"
                                                    checked={batchSelectedIds.includes(questionId)}
                                                    onChange={() => handleBatchSelect(questionId)}
                                                />
                                                <div className={`w-5 h-5 rounded border-2 transition-colors duration-200 flex items-center justify-center ${
                                                    batchSelectedIds.includes(questionId) 
                                                        ? 'bg-indigo-500 border-indigo-500' 
                                                        : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    {batchSelectedIds.includes(questionId) && (
                                                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                                {question.subject || 'No Subject'} 
                                            </h3>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">· Class {question.classname?.replace(/^Class\s+/i, '') || 'N/A'}</span>
                                            {question.qserial && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">#{question.qserial}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {question.chapter && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                                    {question.chapter}
                                                </span>
                                            )}
                                            {question.topic && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                    {question.topic}
                                                </span>
                                            )}
                                            {question.difficulty_level && (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${question.difficulty_level.toLowerCase() === 'easy' 
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                                        : question.difficulty_level.toLowerCase() === 'medium' 
                                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {question.difficulty_level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Question Content */}
                                <div className="p-4 flex-grow">
                                    {/* Question Text and Image */}
                                    <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                                        <div className="text-base text-gray-900 dark:text-white font-medium mb-2">
                                            <EnhancedRichTextEditor
                                                value={getQuestionText(question)}
                                                onChange={() => {}}
                                                readOnly={true}
                                                showPreview={getQuestionText(question).includes('$')}
                                                minHeight="100px"
                                            />
                                        </div>
                                        {question.ques_img && (
                                            <div className="mt-2">
                                                {renderBase64Image(question.ques_img)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Options */}
                                    <div className="grid grid-cols-1 gap-2 mb-4">
                                        {['A', 'B', 'C', 'D'].map(option => (
                                            <div 
                                                key={`option-${option}`}
                                                className={`p-3 rounded border text-sm ${
                                                    (question.correct_answer === option || question.answer === option)
                                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="font-medium min-w-[20px]">{option}:</span>
                                                    <div className="flex-1">
                                                        <EnhancedRichTextEditor
                                                            value={question[`option_${option.toLowerCase()}`] || ''}
                                                            onChange={() => {}}
                                                            readOnly={true}
                                                            showPreview={question[`option_${option.toLowerCase()}`] && question[`option_${option.toLowerCase()}`].includes('$')}
                                                            minHeight="60px"
                                                        />
                                                        {question[`option_${option.toLowerCase()}_img`] && (
                                                            <div className="mt-2">
                                                                {renderBase64Image(question[`option_${option.toLowerCase()}_img`])}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Answer and Explanation */}
                                    <div className="space-y-3">
                                        <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Answer:</div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                {question.correct_answer || question.answer || 'Not specified'}
                                            </div>
                                        </div>

                                        {/* Explanation */}
                                        {(question.explanation || question.explanation_img) && (
                                            <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Explanation:</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    <EnhancedRichTextEditor
                                                        value={question.explanation || ''}
                                                        onChange={() => {}}
                                                        readOnly={true}
                                                        showPreview={question.explanation && question.explanation.includes('$')}
                                                        minHeight="80px"
                                                    />
                                                    {question.explanation_img && (
                                                        <div className="mt-2">
                                                            {renderBase64Image(question.explanation_img)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hint */}
                                        {(question.hint || question.hint_img) && (
                                            <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Hint:</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    <EnhancedRichTextEditor
                                                        value={question.hint || ''}
                                                        onChange={() => {}}
                                                        readOnly={true}
                                                        showPreview={question.hint && question.hint.includes('$')}
                                                        minHeight="60px"
                                                    />
                                                    {question.hint_img && (
                                                        <div className="mt-2">
                                                            {renderBase64Image(question.hint_img)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reference */}
                                        {question.reference && (
                                            <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Reference:</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    {question.reference}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions - Bottom Button */}
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end mt-auto">
                                    <button
                                        onClick={() => removeQuestion(questionId)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove from Collection
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Pagination */}
                {selectedQuestions.length > 0 && (
                    <Pagination 
                        totalItems={selectedQuestions.length}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        className="mt-6"
                    />
                )}
            </div>

            {/* Custom Toast Notification */}
            {notification.show && (
                <div className="fixed bottom-4 right-4 z-[9999] animate-fade-in-up">
                    <div className={`px-6 py-3 rounded-md shadow-xl flex items-center ${
                        notification.type === 'error' 
                            ? 'bg-red-600 text-white' 
                            : notification.type === 'warning'
                                ? 'bg-amber-500 text-white'
                                : 'bg-green-600 text-white'
                    }`}>
                        <span className="mr-2">
                            {notification.type === 'error' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : notification.type === 'warning' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </span>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyQuestion;