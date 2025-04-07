import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Pagination from '../Components/Pagination';
import { MdPlayArrow, MdEdit, MdDelete, MdRefresh, MdLeaderboard, MdFilterList, MdAdd, MdClear } from 'react-icons/md';

const ExamsList = () => {
  // No longer need navigate at this level
  const [user, setUser] = useState(null);
  const location = useLocation();

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    class_id: '',
    subject_id: '',
    chapter_id: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Curriculum state for filters
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Fetch exams
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching exams with filters:', filters);
      const params = { ...filters };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      // Add a cache-busting parameter to ensure we get fresh data
      params._nocache = Date.now();

      // Log the auth token for debugging
      const authToken = localStorage.getItem('token');
      console.log('Auth token for exam list:', authToken ? 'Present' : 'Missing');
      console.log('Auth token value:', authToken);

      const headers = getAuthHeader();
      console.log('Request headers for exam list:', headers);

      const response = await axios.get(`${API_BASE_URL}/api/exams`, {
        headers,
        params,
        timeout: 10000 // 10 second timeout for debugging
      });

      console.log('Exams fetched successfully:', response.data.length, 'exams');
      console.log('Exam data:', response.data);

      if (Array.isArray(response.data)) {
        setExams(response.data);
      } else {
        console.error('Expected array of exams but got:', response.data);
        setExams([]);
        toast.error('Invalid exam data received from server');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      toast.error('Failed to load exams: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  }, [filters]);

  // Check for query parameters that indicate we should refresh the list
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const created = queryParams.get('created');
    
    if (created) {
      // If we have a 'created' parameter, show a success message
      toast.success('Exam created successfully! Refreshing list...');
      // Force a refresh of the exam list
      fetchExams();
    }
  }, [location.search, fetchExams]);

  // Fetch exams on component mount and when filters change
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Fetch curriculum data for filters
  useEffect(() => {
    const fetchCurriculumData = async () => {
      try {
        const [classesRes, subjectsRes, chaptersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/curriculum/classes`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_BASE_URL}/api/curriculum/subjects`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_BASE_URL}/api/curriculum/chapters`, {
            headers: getAuthHeader()
          })
        ]);

        setClasses(classesRes.data);
        setSubjects(subjectsRes.data);
        setChapters(chaptersRes.data);
      } catch (error) {
        console.error('Error fetching curriculum data:', error);
        toast.error('Failed to load filter data');
      }
    };

    fetchCurriculumData();
  }, []);

  // Filter subjects based on selected class
  useEffect(() => {
    if (filters.class_id) {
      const filtered = subjects.filter(subject => subject.class_id === parseInt(filters.class_id));
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(subjects);
    }
  }, [filters.class_id, subjects]);

  // Filter chapters based on selected subject
  useEffect(() => {
    if (filters.subject_id) {
      const filtered = chapters.filter(chapter => chapter.subject_id === parseInt(filters.subject_id));
      setFilteredChapters(filtered);
    } else {
      setFilteredChapters(chapters);
    }
  }, [filters.subject_id, chapters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // Reset dependent filters when parent filter changes
    if (name === 'class_id') {
      setFilters({
        class_id: value,
        subject_id: '',
        chapter_id: ''
      });
    } else if (name === 'subject_id') {
      setFilters(prev => ({
        ...prev,
        subject_id: value,
        chapter_id: ''
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      class_id: '',
      subject_id: '',
      chapter_id: ''
    });
  };

  // Handle exam deletion
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/exams/${examId}`, {
        headers: getAuthHeader()
      });

      toast.success('Exam deleted successfully');

      // Update the list
      setExams(exams.filter(exam => exam.id !== examId));
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    }
  };

  // Handle recalculate scores
  const handleRecalculate = async (examId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/exams/${examId}/recalculate`, {}, {
        headers: getAuthHeader()
      });

      toast.success('Exam scores recalculated successfully');
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast.error('Failed to recalculate scores');
    }
  };

  // Get paginated exams
  const getPaginatedExams = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return exams.slice(startIndex, endIndex);
  };

  // Get unique subjects for statistics
  const countUniqueSubjects = () => {
    const subjects = new Set();
    exams.forEach(exam => {
      if (exam.subject_name) {
        subjects.add(exam.subject_name);
      }
    });
    return subjects.size;
  };

  // Exam card component
  const ExamCard = ({ exam }) => {
    const now = new Date();
    const startDate = new Date(exam.start_datetime);
    const endDate = new Date(exam.end_datetime);

    let status = 'Upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'Active';
    } else if (now > endDate) {
      status = 'Completed';
    }

    // Format duration as hours and minutes
    const formatDuration = (minutes) => {
      if (!minutes) return '0 min';
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
    };

    // Get status style classes
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
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
        {/* Header with Exam info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap justify-between items-start">
            {/* Left side - Subject and Class info */}
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">{exam.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {exam.class_name && (
                  <span className="text-gray-500 dark:text-gray-400">{exam.class_name}</span>
                )}

                {exam.subject_name && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{exam.subject_name}</span>
                  </>
                )}

                {exam.chapter_name && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-gray-500 dark:text-gray-400">{exam.chapter_name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right side - Status tag */}
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusClasses(status)}`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Exam body with schedule and info */}
        <div className="p-4 flex-1">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{startDate.toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-300">{endDate.toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 px-3 py-2 rounded-md border border-blue-100 dark:border-blue-800/30 flex-1 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Duration</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{formatDuration(exam.duration_minutes)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 flex-1 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Questions</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{exam.question_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-md">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:justify-end">
            {status === 'Active' && (
              <Link
                to={`/exams/${exam.id}`}
                className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <MdPlayArrow className="text-base" />
                Take Exam
              </Link>
            )}

            <Link
              to={`/exams/${exam.id}/leaderboard`}
              className="w-full sm:w-auto px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600"
            >
              <MdLeaderboard className="text-base" />
              Leaderboard
            </Link>

            {/* Only show admin/teacher actions for non-student users */}
            {user?.role !== 'student' && (
              <>
                <Link
                  to={`/exams/edit/${exam.id}`}
                  className="w-full sm:w-auto px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600"
                >
                  <MdEdit className="text-base" />
                  Edit
                </Link>

                <button
                  onClick={() => handleRecalculate(exam.id)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600"
                >
                  <MdRefresh className="text-base" />
                  Recalculate
                </button>

                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-800/30"
                >
                  <MdDelete className="text-base" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 bg-white dark:bg-gray-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Exams</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {exams.length} Exams · {countUniqueSubjects()} Subjects
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
          >
            <MdFilterList className="text-base" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            onClick={fetchExams}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
            title="Refresh exam list"
          >
            <MdRefresh className="text-base" />
            Refresh
          </button>

          {/* Only show Create Exam button for non-student users */}
          {user?.role !== 'student' && (
            <Link
              to="/exams/create"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <MdAdd className="text-base" />
              Create Exam
            </Link>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Exams</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <MdClear className="text-base" />
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Class filter */}
            <div className="flex flex-col">
              <label htmlFor="class_id" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class
              </label>
              <select
                id="class_id"
                name="class_id"
                value={filters.class_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject filter */}
            <div className="flex flex-col">
              <label htmlFor="subject_id" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                id="subject_id"
                name="subject_id"
                value={filters.subject_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!filters.class_id}
              >
                <option value="">All Subjects</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter filter */}
            <div className="flex flex-col">
              <label htmlFor="chapter_id" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chapter
              </label>
              <select
                id="chapter_id"
                name="chapter_id"
                value={filters.chapter_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={!filters.subject_id}
              >
                <option value="">All Chapters</option>
                {filteredChapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-full bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="max-w-md mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-2">No exams found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {Object.values(filters).some(v => v !== '')
                  ? 'Try adjusting your filters or create a new exam.'
                  : 'Get started by creating your first exam.'}
              </p>
              {user?.role !== 'student' && (
                <Link
                  to="/exams/create"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <MdAdd className="text-base" />
                  Create New Exam
                </Link>
              )}
            </div>
          </div>
        ) : (
          getPaginatedExams().map(exam => (
            <ExamCard key={exam.id} exam={exam} />
          ))
        )}
      </div>

      {/* Pagination */}
      {exams.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalCount={exams.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default ExamsList;