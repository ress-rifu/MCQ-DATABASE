import React from 'react';
import { Link } from 'react-router-dom';
import { MdAccessTime, MdQuiz, MdGrade, MdPerson, MdCalendarToday, MdArrowForward } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth.jsx';

const ExamCard = ({ exam, isNewlyCreated = false }) => {
  const { user } = useAuth();

  // Format dates
  const startDate = new Date(exam.start_datetime);
  const endDate = new Date(exam.end_datetime);

  // Determine exam status
  const now = new Date();
  let status = 'Upcoming';

  if (now > endDate) {
    status = 'Completed';
  } else if (now >= startDate && now <= endDate) {
    status = 'Active';
  }

  // Get status classes for styling
  const getStatusClasses = (status) => {
    switch(status) {
      case 'Active':
        return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30';
      case 'Completed':
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      case 'Upcoming':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border ${isNewlyCreated ? 'border-green-400 dark:border-green-500 ring-2 ring-green-400 dark:ring-green-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full ${isNewlyCreated ? 'animate-pulse-light' : ''} relative`}>
      {/* Status badge - positioned at the top right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {isNewlyCreated && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            New
          </span>
        )}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(status)}`}>
          {status}
        </span>
      </div>

      {/* Header with Exam info */}
      <div className="pt-6 px-6 pb-5">
        <div className="flex flex-col">
          {/* Course and chapter tags */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {exam.course_name && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                {exam.course_name}
              </span>
            )}

            {exam.chapter_names && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30">
                {exam.chapter_names}
              </span>
            )}
          </div>

          {/* Exam title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{exam.title}</h3>

          {/* Creator info */}
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <MdPerson className="text-gray-400 text-base" />
            <span>Created by {exam.created_by_name || 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 mx-6"></div>

      {/* Exam details */}
      <div className="px-6 py-5 flex-1">
        {/* Date information */}
        <div className="flex items-center mb-5 text-sm">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <MdCalendarToday className="text-base" />
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          <div className="mx-2 text-gray-300 dark:text-gray-600">•</div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <MdAccessTime className="text-base" />
            <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
            <div className="flex items-center gap-1">
              <MdAccessTime className="text-gray-500 text-sm" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{exam.duration_minutes} min</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Questions</p>
            <div className="flex items-center gap-1">
              <MdQuiz className="text-gray-500 text-sm" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{exam.question_count || 0}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Marks</p>
            <div className="flex items-center gap-1">
              <MdGrade className="text-gray-500 text-sm" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{exam.total_marks || 0}</p>
            </div>
          </div>
        </div>

        {/* Schedule information */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">Exam Schedule</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Starts</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{startDate.toLocaleDateString()}, {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ends</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{endDate.toLocaleDateString()}, {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <div className="flex justify-end gap-3">
          {user?.role !== 'student' && (
            <Link
              to={`/exams/${exam.id}/edit`}
              className="px-3.5 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 shadow-sm inline-flex items-center gap-1.5"
            >
              Edit
            </Link>
          )}
          <Link
            to={`/exams/${exam.id}`}
            className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            View Details
            <MdArrowForward className="text-base" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamCard;
