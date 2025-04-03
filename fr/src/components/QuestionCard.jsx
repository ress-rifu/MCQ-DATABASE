import LaTeXRenderer from './LaTeXRenderer';
import TableSpecificRenderer from './TableSpecificRenderer';
import { containsComplexTable } from '../utils/latexRenderer';

const QuestionCard = ({ question, onEdit, onDelete, onAddToCollection, isBatchSelectionMode, isSelected, onSelect, inCollection = false, onRemoveFromCollection }) => {
    
    // Helper to determine if content might contain LaTeX
    const containsLaTeX = (content) => {
        if (!content || typeof content !== 'string') return false;
        return content.includes('\\begin{') || 
               content.includes('\\[') || 
               content.includes('$') ||
               content.includes('\\frac');
    };
    
    // Render content with LaTeX support if needed
    const renderContent = (content) => {
        if (!content) return null;
        
        // Check if this is a complex table that needs special handling
        if (typeof content === 'string' && containsComplexTable(content)) {
            return <TableSpecificRenderer content={content} />;
        }
        
        // Otherwise use regular LaTeX renderer
        return containsLaTeX(content) 
            ? <LaTeXRenderer content={content} /> 
            : content;
    };
    
    // Get question ID (handle different formats)
    const questionId = question._id || question.id;
    
    return (
        <div 
            className={`bg-white dark:bg-gray-800 rounded-lg border ${
                isSelected 
                    ? 'border-indigo-500 dark:border-indigo-500' 
                    : 'border-gray-200 dark:border-gray-700'
            } hover:border-gray-200 transition-all duration-200 overflow-hidden`}
            onClick={() => isBatchSelectionMode && onSelect(questionId)}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {question.subject}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Class {question.classname}
                    </span>
                    {/* Add Question ID */}
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md">
                        ID: {questionId}
                    </span>
                </div>
                {!isBatchSelectionMode && !inCollection && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(question);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
                            title="Edit"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(questionId);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                            title="Delete"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToCollection(question);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
                            title="Add to Collection"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                )}
                {inCollection && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromCollection && onRemoveFromCollection(question);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                            title="Remove from Collection"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
                {isBatchSelectionMode && !inCollection && (
                    <div className={`w-5 h-5 rounded border-2 transition-colors duration-200 flex items-center justify-center ${
                        isSelected 
                            ? 'bg-indigo-500 border-indigo-500' 
                            : 'border-gray-300 dark:border-gray-600'
                    }`}>
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                )}
            </div>

            {/* Chapter Info with Reference */}
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-indigo-600 dark:text-indigo-400">{question.chapter}</span>
                    <span className="text-gray-500 dark:text-gray-400">·</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{question.topic}</span>
                    {question.reference && (
                        <>
                            <span className="text-gray-500 dark:text-gray-400">·</span>
                            <span className="text-gray-600 dark:text-gray-300">
                                Ref: {question.reference}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Question */}
            <div className="p-4">
                <div className="prose dark:prose-invert max-w-none text-sm text-gray-900 dark:text-gray-100">
                    {renderContent(question.ques)}
                </div>
            </div>

            {/* Options */}
            <div className="px-4 pb-4 grid grid-cols-1 gap-2">
                {['A', 'B', 'C', 'D'].map(option => (
                    <div 
                        key={option}
                        className={`p-3 rounded border text-sm ${
                            question.answer && question.answer.toUpperCase().includes(option)
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="font-medium min-w-[20px]">{option}:</span>
                            <div>{renderContent(question[`option_${option.toLowerCase()}`])}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Answer, Explanation, and Hint */}
            <div className="px-4 pb-4 space-y-2">
                <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Answer:</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {renderContent(question.answer)}
                    </div>
                </div>
                
                {question.explanation && (
                    <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Explanation:</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {renderContent(question.explanation)}
                        </div>
                    </div>
                )}
                
                {/* Add Hint section */}
                {question.hint && (
                    <div className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Hint:</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-400">
                            {renderContent(question.hint)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionCard; 