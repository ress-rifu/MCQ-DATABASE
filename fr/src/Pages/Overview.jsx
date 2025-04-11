import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, getAuthHeader } from "../apiConfig";
import testApiEndpoints from "../testApi";
import {
  FaUsers,
  FaBook,
  FaBookOpen,
  FaQuestionCircle,
  FaLayerGroup,
  FaSearch,
  FaEdit,
  FaCloudUploadAlt,
  FaListAlt,
  FaRegFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaTrophy,
  FaChartLine,
  FaGraduationCap,
  FaCheckCircle,
  FaDownload,
  FaTrash,
  FaCalendarAlt,
  FaChartBar
} from "react-icons/fa";
import { FiEye, FiTrash } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth.jsx";
import useAxiosWithErrorHandling from "../hooks/useAxiosWithErrorHandling.jsx";
import { toast } from "react-hot-toast";

// Create a context for the display mode
const DisplayModeContext = createContext({ displayMode: "grid" });

// Dashboard card component with Untitled UI style
const DashboardCard = ({ icon, title, description, path }) => {
  const { displayMode } = useContext(DisplayModeContext) || { displayMode: "grid" };

  // List view style
  if (displayMode === "list") {
    return (
      <Link
        to={path}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden p-4 flex items-center group"
      >
        <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors mr-4">
          {icon}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{description}</p>
        </div>
        <div className="flex-shrink-0 ml-4 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <span className="hidden sm:inline">Get started</span>
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </Link>
    );
  }

  // Grid view style (default)
  return (
    <Link
      to={path}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden p-6 flex flex-col h-full group"
    >
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm flex-grow">{description}</p>
      <div className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
        <span>Get started</span>
        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </Link>
  );
};

// Stats card component with Untitled UI style
const StatsCard = ({ icon, label, value, isLoading, color }) => {
  // Define color classes
  const getColorClasses = (colorName) => {
    switch(colorName) {
      case 'blue':
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-100 dark:border-blue-800/30",
          hover: "hover:bg-blue-100 dark:hover:bg-blue-800/30"
        };
      case 'green':
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          text: "text-green-600 dark:text-green-400",
          border: "border-green-100 dark:border-green-800/30",
          hover: "hover:bg-green-100 dark:hover:bg-green-800/30"
        };
      case 'yellow':
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          text: "text-yellow-600 dark:text-yellow-400",
          border: "border-yellow-100 dark:border-yellow-800/30",
          hover: "hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
        };
      case 'indigo':
        return {
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          text: "text-indigo-600 dark:text-indigo-400",
          border: "border-indigo-100 dark:border-indigo-800/30",
          hover: "hover:bg-indigo-100 dark:hover:bg-indigo-800/30"
        };
      case 'purple':
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-100 dark:border-purple-800/30",
          hover: "hover:bg-purple-100 dark:hover:bg-purple-800/30"
        };
      case 'red':
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          text: "text-red-600 dark:text-red-400",
          border: "border-red-100 dark:border-red-800/30",
          hover: "hover:bg-red-100 dark:hover:bg-red-800/30"
        };
      case 'orange':
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          text: "text-orange-600 dark:text-orange-400",
          border: "border-orange-100 dark:border-orange-800/30",
          hover: "hover:bg-orange-100 dark:hover:bg-orange-800/30"
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-700 dark:text-gray-300",
          border: "border-gray-200 dark:border-gray-700",
          hover: "hover:bg-gray-200 dark:hover:bg-gray-700"
        };
    }
  };

  const { bg, text, border, hover } = getColorClasses(color);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 font-medium uppercase tracking-wide">{label}</p>
          {isLoading ? (
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</h4>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bg} ${text} ${border} transition-colors ${hover}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Recent activity item component with Notion/Untitled UI style
const ActivityItem = ({ activity, onRefresh }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  // Add function to handle deletion of imported questions
  const handleDeleteImport = async (activityId) => {
    if (!activityId) return;

    if (!window.confirm('Are you sure you want to delete this imported batch of questions? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      // First try the new endpoint
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/activity/${activityId}/delete-import`,
          { headers: getAuthHeader() }
        );

        if (response.status === 200) {
          toast.success('Successfully deleted imported questions');
          if (onRefresh) onRefresh(); // Trigger refresh of activities
          return;
        }
      } catch (firstError) {
        console.log('First attempt failed, trying fallback endpoint', firstError);
      }

      // Fallback to the questions endpoint
      const response = await axios.delete(
        `${API_BASE_URL}/api/questions/import/${activityId}`,
        { headers: getAuthHeader() }
      );

      if (response.status === 200) {
        toast.success('Successfully deleted imported questions');
        if (onRefresh) onRefresh(); // Trigger refresh of activities
      } else {
        toast.error('Failed to delete imported questions');
      }
    } catch (error) {
      console.error('Error deleting import:', error);
      toast.error(error.response?.data?.message || 'Error deleting imported questions');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Generate icon and color based on activity type
  const { icon, color } = getActivityData(activity.activity_type);

  // Format timestamp
  const timestamp = formatActivityTime(activity.created_at);

  // Get color classes based on activity type
  const getActivityColorClasses = (colorName) => {
    switch(colorName) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30';
      case 'green':
        return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-800/30';
      case 'red':
        return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/30';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800/30';
      case 'purple':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="flex items-start p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${getActivityColorClasses(color)}`}>
        {icon}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {activity.title || 'Activity'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {timestamp}
            </p>
            {activity.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                {activity.description || 'No description available'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="ml-4 flex-shrink-0 flex space-x-2">
        {/* View button for various activity types */}
        {(activity.activity_type === 'import_questions' ||
          activity.activity_type === 'create_question' ||
          activity.activity_type === 'edit_question') && (
          <button
            onClick={() => navigate('/questionbank', {
              state: {
                importId: activity.activity_type === 'import_questions' ? activity.id : null,
                questionId: activity.entity_id || null
              }
            })}
            className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none transition-colors border border-blue-200 dark:border-blue-800/30"
            aria-label="View questions"
          >
            <FiEye className="h-3.5 w-3.5 mr-1.5" />
            View
          </button>
        )}

        {/* Delete button for import_questions */}
        {activity.activity_type === 'import_questions' && (
          <button
            onClick={() => handleDeleteImport(activity.id)}
            disabled={deleteLoading}
            className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none transition-colors border border-red-200 dark:border-red-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete imported questions"
          >
            {deleteLoading ? (
              <svg className="animate-spin h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FiTrash className="h-3 w-3 mr-1" />
            )}
            Delete
          </button>
        )}

        {/* Exam-related actions */}
        {activity.entity_type === 'exam' && activity.entity_id && (
          <button
            onClick={() => navigate(`/exams/${activity.entity_id}`)}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none transition-colors"
            aria-label="View exam"
          >
            <FiEye className="h-3 w-3 mr-1" />
            View Exam
          </button>
        )}
      </div>
    </div>
  );
};

// Empty state component with Notion/Untitled UI style
const EmptyState = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
      <div className="text-gray-400 dark:text-gray-500 mb-3 text-xl p-3 rounded-full bg-white dark:bg-gray-800">{icon}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

// API Error Message component with Notion/Untitled UI style
const ApiErrorMessage = () => {
  return (
    <div className="p-4 mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
      <div className="flex items-start">
        <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-800/30 text-yellow-600 dark:text-yellow-400 mr-3">
          <FaExclamationTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">API Endpoints Unavailable</h3>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
            Some data could not be loaded because the required API endpoints are not available.
            This is likely because the backend server is still in development.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            The dashboard will display with limited functionality until the APIs are implemented.
          </p>
        </div>
      </div>
    </div>
  );
};

// Function to get activity data (icon, color) based on activity type with Notion/Untitled UI style
const getActivityData = (activityType) => {
  let icon, color;

  switch (activityType) {
    case 'import_questions':
      icon = <FaCloudUploadAlt className="w-3.5 h-3.5" />;
      color = "blue";
      break;
    case 'edit_question':
      icon = <FaEdit className="w-3.5 h-3.5" />;
      color = "indigo";
      break;
    case 'create_question':
      icon = <FaPlus className="w-3.5 h-3.5" />;
      color = "green";
      break;
    case 'export_questions':
      icon = <FaDownload className="w-3.5 h-3.5" />;
      color = "purple";
      break;
    case 'delete_import':
      icon = <FaTrash className="w-3.5 h-3.5" />;
      color = "red";
      break;
    case 'user_management':
      icon = <FaUsers className="w-3.5 h-3.5" />;
      color = "yellow";
      break;
    case 'create_exam':
      icon = <FaGraduationCap className="w-3.5 h-3.5" />;
      color = "blue";
      break;
    case 'edit_exam':
      icon = <FaEdit className="w-3.5 h-3.5" />;
      color = "blue";
      break;
    case 'take_exam':
      icon = <FaCheckCircle className="w-3.5 h-3.5" />;
      color = "green";
      break;
    case 'create_course':
      icon = <FaBookOpen className="w-3.5 h-3.5" />;
      color = "yellow";
      break;
    case 'edit_course':
      icon = <FaEdit className="w-3.5 h-3.5" />;
      color = "yellow";
      break;
    default:
      icon = <FaRegFileAlt className="w-3.5 h-3.5" />;
      color = "gray";
  }

  return { icon, color };
};

// Function to format activity timestamps
const formatActivityTime = (timestamp) => {
  if (!timestamp) return 'Unknown time';

  const date = new Date(timestamp);
  const now = new Date();

  // Check if the date is valid
  if (isNaN(date.getTime())) return 'Invalid date';

  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Format the time based on how long ago it was
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // For older dates, return a formatted date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Main Overview component
const Overview = () => {
  const { user } = useAuth();
  const [displayMode, setDisplayMode] = useState("grid");
  const [stats, setStats] = useState({
    questions: { value: 0, isLoading: true },
    curriculum: { value: 0, isLoading: true },
    users: { value: 0, isLoading: true },
    uploads: { value: 0, isLoading: true },
    subjects: { value: 0, isLoading: true },
    chapters: { value: 0, isLoading: true },
    exams: { value: 0, isLoading: true },
    courses: { value: 0, isLoading: true }
  });
  const [studentStats, setStudentStats] = useState({
    totalExams: { value: 0, isLoading: true },
    averageScore: { value: 0, isLoading: true },
    highestScore: { value: 0, isLoading: true },
    totalQuestions: { value: 0, isLoading: true }
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isStudentDataLoading, setIsStudentDataLoading] = useState(true);
  const [apiErrorOccurred, setApiErrorOccurred] = useState(false);
  const { get } = useAxiosWithErrorHandling();
  const hasRunOnceRef = useRef(false);
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';

  // Create a memoized function for API calls to prevent unnecessary re-creation
  const safeApiCall = useCallback(async (endpoint, defaultValue = { count: 0 }) => {
    try {
      console.log(`Calling API endpoint: ${endpoint}`);
      const response = await get(endpoint);
      console.log(`API response from ${endpoint}:`, response?.data);
      return response?.data || defaultValue;
    } catch (error) {
      // Log the error and return default value
      console.error(`API call to ${endpoint} failed:`, error);
      return defaultValue;
    }
  }, [get]);

  // Fetch dashboard data
  useEffect(() => {
    // Only run this effect once
    if (hasRunOnceRef.current) return;
    hasRunOnceRef.current = true;

    if (isStudent) {
      fetchStudentData();
    } else {
      fetchAdminData();
    }
  }, [user, safeApiCall]);

  // Fetch admin/teacher dashboard data
  const fetchAdminData = async () => {
    try {
      // Run API test to debug
      console.log('Running API test...');
      await testApiEndpoints();
      
      // Verify authentication token is available
      const token = localStorage.getItem('token');
      console.log('Auth token available in Overview:', !!token);
      if (!token) {
        console.error('No authentication token found. User may need to log in again.');
        toast.error('Authentication error. Please log in again.');
        return;
      }

      // Set loading states
      setIsActivityLoading(true);
      setStats(prev => ({
        ...prev,
        questions: { ...prev.questions, isLoading: true },
        curriculum: { ...prev.curriculum, isLoading: true },
        users: { ...prev.users, isLoading: true },
        uploads: { ...prev.uploads, isLoading: true },
        subjects: { ...prev.subjects, isLoading: true },
        chapters: { ...prev.chapters, isLoading: true },
        exams: { ...prev.exams, isLoading: true },
        courses: { ...prev.courses, isLoading: true }
      }));

      // Create an array of promises for parallel API calls
      console.log('Making API calls with headers:', getAuthHeader());

      // Direct API calls for debugging
      const questionsStatsResponse = await axios.get(`${API_BASE_URL}/api/questions/stats`, {
        headers: getAuthHeader(),
        withCredentials: true
      }).catch(err => {
        console.error('Error fetching questions stats:', err);
        return { data: { totalQuestions: 0, monthlyUploads: 0, totalSubjects: 0, totalChapters: 0 } };
      });

      const curriculumCountResponse = await axios.get(`${API_BASE_URL}/api/curriculum/count`, {
        headers: getAuthHeader(),
        withCredentials: true
      }).catch(err => {
        console.error('Error fetching curriculum count:', err);
        return { data: { count: 0 } };
      });

      const usersCountResponse = user?.role === 'admin' ?
        await axios.get(`${API_BASE_URL}/api/users/count`, {
          headers: getAuthHeader(),
          withCredentials: true
        }).catch(err => {
          console.error('Error fetching users count:', err);
          if (err.response && err.response.status === 403) {
            console.error('Authentication error (403 Forbidden). Token may be invalid or missing.');
            // Try with direct token as fallback
            const token = localStorage.getItem('token');
            if (token) {
              console.log('Retrying with direct token from localStorage...');
              return axios.get(`${API_BASE_URL}/api/users/count`, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
              }).catch(retryErr => {
                console.error('Retry also failed:', retryErr);
                return { data: { count: 0 } };
              });
            }
          }
          return { data: { count: 0 } };
        }) :
        { data: { count: '-' } };

      const activityResponse = await axios.get(`${API_BASE_URL}/api/activity/recent`, {
        headers: getAuthHeader(),
        withCredentials: true
      }).catch(err => {
        console.error('Error fetching activity:', err);
        return { data: { activities: [] } };
      });

      const examsCountResponse = await axios.get(`${API_BASE_URL}/api/exams/count`, {
        headers: getAuthHeader()
      }).catch(err => {
        console.error('Error fetching exams count:', err);
        return { data: { count: 0 } };
      });

      const coursesCountResponse = await axios.get(`${API_BASE_URL}/api/courses/count`, {
        headers: getAuthHeader()
      }).catch(err => {
        console.error('Error fetching courses count:', err);
        return { data: { count: 0 } };
      });

      // Extract data from responses
      const questionsData = questionsStatsResponse.data;
      const curriculumData = curriculumCountResponse.data;
      const usersData = usersCountResponse.data;
      const activityData = activityResponse.data;
      const examsData = examsCountResponse.data;
      const coursesData = coursesCountResponse.data;

      console.log('All API responses:', {
        questionsData,
        curriculumData,
        usersData,
        activityData,
        examsData,
        coursesData
      });

      // Update stats with fetched data
      setStats({
        questions: {
          value: parseInt(questionsData.totalQuestions) || parseInt(questionsData.count) || 0,
          isLoading: false
        },
        curriculum: {
          value: parseInt(curriculumData.count) || 0,
          isLoading: false
        },
        users: {
          value: usersData.count === '-' ? '-' : parseInt(usersData.count) || 0,
          isLoading: false
        },
        uploads: {
          value: parseInt(questionsData.monthlyUploads) || parseInt(questionsData.userUploads) || 0,
          isLoading: false
        },
        subjects: {
          value: parseInt(questionsData.totalSubjects) || 0,
          isLoading: false
        },
        chapters: {
          value: parseInt(questionsData.totalChapters) || 0,
          isLoading: false
        },
        exams: {
          value: parseInt(examsData.count) || 0,
          isLoading: false
        },
        courses: {
          value: parseInt(coursesData.count) || 0,
          isLoading: false
        }
      });

      // Update activity data - handle both formats that the API might return
      if (activityData && (activityData.activities || Array.isArray(activityData))) {
        const activities = activityData.activities || activityData;
        if (Array.isArray(activities)) {
          setRecentActivity(activities);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setApiErrorOccurred(true);
    } finally {
      // End loading states
      setIsActivityLoading(false);
      setStats(prev => ({
        ...prev,
        questions: { ...prev.questions, isLoading: false },
        curriculum: { ...prev.curriculum, isLoading: false },
        users: { ...prev.users, isLoading: false },
        uploads: { ...prev.uploads, isLoading: false },
        subjects: { ...prev.subjects, isLoading: false },
        chapters: { ...prev.chapters, isLoading: false },
        exams: { ...prev.exams, isLoading: false },
        courses: { ...prev.courses, isLoading: false }
      }));
    }
  };

  // Fetch student data including exam performance
  const fetchStudentData = async () => {
    try {
      setIsStudentDataLoading(true);
      setIsActivityLoading(true);

      // Fetch student's exam results
      const response = await axios.get(`${API_BASE_URL}/api/student/exams`, {
        headers: getAuthHeader()
      });

      if (response.data) {
        setExamResults(response.data);

        // Calculate stats
        if (response.data.length > 0) {
          const totalExams = response.data.length;
          const scores = response.data.map(result => {
            const percentage = result.exam.total_marks
              ? (result.score / result.exam.total_marks) * 100
              : 0;
            return percentage;
          });

          const avgScore = scores.reduce((sum, score) => sum + score, 0) / totalExams;
          const highestScore = Math.max(...scores);
          const totalQuestions = response.data.reduce((sum, result) =>
            sum + (result.exam.question_count || 0), 0);

          setStudentStats({
            totalExams: { value: totalExams, isLoading: false },
            averageScore: { value: avgScore.toFixed(1), isLoading: false },
            highestScore: { value: highestScore.toFixed(1), isLoading: false },
            totalQuestions: { value: totalQuestions, isLoading: false }
          });
        }
      }

      // Also fetch activity data
      try {
        const activityResponse = await axios.get(
          `${API_BASE_URL}/api/activity/recent`,
          { headers: getAuthHeader() }
        );

        if (activityResponse.data) {
          if (activityResponse.data.activities && Array.isArray(activityResponse.data.activities)) {
            setRecentActivity(activityResponse.data.activities);
          } else if (Array.isArray(activityResponse.data)) {
            setRecentActivity(activityResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setRecentActivity([]);
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load your data');
      setApiErrorOccurred(true);
    } finally {
      setIsStudentDataLoading(false);
      setIsActivityLoading(false);
    }
  };

  // Function to fetch activity data
  const fetchActivity = useCallback(async () => {
    try {
      setIsActivityLoading(true);

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/activity/recent`,
          { headers: getAuthHeader() }
        );

        // Handle different response formats
        if (response.data) {
          if (response.data.activities && Array.isArray(response.data.activities)) {
            setRecentActivity(response.data.activities);
          } else if (Array.isArray(response.data)) {
            setRecentActivity(response.data);
          } else {
            // If we get back an empty or invalid response, set empty array
            setRecentActivity([]);
          }
        } else {
          setRecentActivity([]);
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
        // Set empty array on error to avoid showing stale data
        setRecentActivity([]);

        // Show a toast notification
        toast.error('Could not load recent activity. Please try again later.');
      }
    } finally {
      setIsActivityLoading(false);
    }
  }, []);

  // Fetch activity data on component mount
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Get current date for greeting
  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DisplayModeContext.Provider value={{ displayMode }}>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header section with greeting and quick stats - Untitled UI style */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              {getCurrentTimeGreeting()}, {user?.name || "User"}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400">
              {isStudent
                ? "Welcome to your Performance Dashboard"
                : "Welcome to your Question Database Dashboard"}
            </p>
          </div>
          <div className="flex items-center space-x-1 mt-4 md:mt-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setDisplayMode("grid")}
              className={`p-2.5 ${displayMode === "grid" ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"} transition-colors`}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setDisplayMode("list")}
              className={`p-2.5 ${displayMode === "list" ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"} transition-colors`}
              title="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Display API error message if needed */}
        {apiErrorOccurred && <ApiErrorMessage />}

        {/* Quick statistics - Untitled UI style */}
        {isStudent ? (
          /* Student Stats */
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10 overflow-x-auto">
            <StatsCard
              icon={<FaGraduationCap className="w-5 h-5" />}
              label="Total Exams"
              value={studentStats.totalExams.value}
              isLoading={isStudentDataLoading}
              color="blue"
            />
            <StatsCard
              icon={<FaChartLine className="w-5 h-5" />}
              label="Average Score"
              value={`${studentStats.averageScore.value}%`}
              isLoading={isStudentDataLoading}
              color="green"
            />
            <StatsCard
              icon={<FaTrophy className="w-5 h-5" />}
              label="Highest Score"
              value={`${studentStats.highestScore.value}%`}
              isLoading={isStudentDataLoading}
              color="yellow"
            />
            <StatsCard
              icon={<FaCheckCircle className="w-5 h-5" />}
              label="Questions Answered"
              value={studentStats.totalQuestions.value}
              isLoading={isStudentDataLoading}
              color="indigo"
            />
          </div>
        ) : (
          /* Admin/Teacher Stats */
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10 overflow-x-auto">
            <StatsCard
              icon={<FaQuestionCircle className="w-5 h-5" />}
              label="Questions"
              value={stats.questions.value.toLocaleString()}
              isLoading={stats.questions.isLoading}
              color="blue"
            />
            <StatsCard
              icon={<FaLayerGroup className="w-5 h-5" />}
              label="Curriculum Items"
              value={stats.curriculum.value.toLocaleString()}
              isLoading={stats.curriculum.isLoading}
              color="green"
            />
            {user?.role === 'admin' && (
              <StatsCard
                icon={<FaUsers className="w-5 h-5" />}
                label="Users"
                value={stats.users.value.toLocaleString()}
                isLoading={stats.users.isLoading}
                color="yellow"
              />
            )}
            <StatsCard
              icon={<FaCloudUploadAlt className="w-5 h-5" />}
              label="Monthly Uploads"
              value={stats.uploads.value.toLocaleString()}
              isLoading={stats.uploads.isLoading}
              color="indigo"
            />
            <StatsCard
              icon={<FaBook className="w-5 h-5" />}
              label="Subjects"
              value={stats.subjects.value.toLocaleString()}
              isLoading={stats.subjects.isLoading}
              color="purple"
            />
            <StatsCard
              icon={<FaLayerGroup className="w-5 h-5" />}
              label="Chapters"
              value={stats.chapters.value.toLocaleString()}
              isLoading={stats.chapters.isLoading}
              color="green"
            />
            <StatsCard
              icon={<FaGraduationCap className="w-5 h-5" />}
              label="Exams"
              value={stats.exams.value.toLocaleString()}
              isLoading={stats.exams.isLoading}
              color="blue"
            />
            <StatsCard
              icon={<FaBookOpen className="w-5 h-5" />}
              label="Courses"
              value={stats.courses.value.toLocaleString()}
              isLoading={stats.courses.isLoading}
              color="yellow"
            />
          </div>
        )}
      </div>

      {/* Main dashboard section with feature cards for non-students */}
      {!isStudent && (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 overflow-hidden">
          {/* Feature cards - Untitled UI style */}
          <div className={`lg:flex-1 ${displayMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" : "space-y-4 sm:space-y-6"}`}>
            <DashboardCard
              icon={<FaQuestionCircle className="h-5 w-5" />}
              title="Question Bank"
              description="Browse, filter, and manage your repository of questions by subject, class, and more."
              path="/questionbank"
            />

            <DashboardCard
              icon={<FaCloudUploadAlt className="h-5 w-5" />}
              title="Upload Questions"
              description="Import questions from Excel, CSV or other formats to quickly build your question bank."
              path="/upload"
            />

            <DashboardCard
              icon={<FaListAlt className="h-5 w-5" />}
              title="My Questions"
              description="Access and manage questions that you've created or uploaded to the system."
              path="/myquestion"
            />

            <DashboardCard
              icon={<FaLayerGroup className="h-5 w-5" />}
              title="Curriculum Management"
              description="Organize educational content with an intuitive hierarchical structure for classes, subjects, and chapters."
              path="/curriculum"
            />

            {user?.role === 'admin' && (
              <DashboardCard
                icon={<FaUsers className="h-5 w-5" />}
                title="User Management"
                description="Manage user accounts, roles, and permissions for accessing the question database."
                path="/admin"
              />
            )}

            {user?.role === 'admin' && (
              <DashboardCard
                icon={<FaLayerGroup className="h-5 w-5" />}
                title="Course Management"
                description="Create and manage courses by combining classes, subjects, and chapters."
                path="/courses"
              />
            )}
          </div>

          {/* Recent activity sidebar - Untitled UI style */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 mt-6 lg:mt-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                <button
                  onClick={fetchActivity}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh"
                >
                  <FaClock className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {isActivityLoading ? (
                  // Activity loading state
                  <div className="p-6 space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-3 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full mb-3 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  // Empty state
                  <div className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                      <FaClock className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No recent activity</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                      Your recent actions will appear here as you use the system.
                    </p>
                  </div>
                ) : (
                  // Activity items
                  <div>
                    {recentActivity.map((activity, index) => (
                      <ActivityItem
                        key={activity.id || index}
                        activity={activity}
                        onRefresh={fetchActivity}
                      />
                    ))}
                  </div>
                )}
              </div>

              {!isActivityLoading && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    {recentActivity.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {recentActivity.length} {recentActivity.length === 1 ? 'activity' : 'activities'}
                      </span>
                    )}
                    <button
                      onClick={fetchActivity}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center ml-auto px-2.5 py-1.5 rounded-md border border-blue-200 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <svg className="mr-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      <span>Refresh activity</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student dashboard - Exam results section - Untitled UI style */}
      {isStudent && (
        <div className="space-y-4 sm:space-y-6 overflow-hidden">
          {/* Recent Exams for Students */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">Your Recent Exam Results</h2>
            </div>

            {isStudentDataLoading ? (
              // Loading state for exam results
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ) : examResults.length > 0 ? (
              <div className="table-container -mx-4 sm:mx-0 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {examResults.slice(0, 5).map((result) => {
                      const percentage = result.exam.total_marks
                        ? Math.round((result.score / result.exam.total_marks) * 100)
                        : 0;

                      return (
                        <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{result.exam.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{result.exam.subject_name} • {result.exam.class_name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(result.completed_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {result.score}/{result.exam.total_marks}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${
                                percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                                percentage >= 60 ? 'text-blue-600 dark:text-blue-400' :
                                percentage >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {percentage}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    percentage >= 80 ? 'bg-green-500' :
                                    percentage >= 60 ? 'bg-blue-500' :
                                    percentage >= 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {result.rank ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                result.rank <= 3
                                  ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}>
                                #{result.rank}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/exams/${result.exam.id}/leaderboard`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              View Leaderboard
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-dashed border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No exam results yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start taking exams to see your results here.</p>
                  <Link
                    to="/exams"
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Browse Available Exams
                  </Link>
                </div>
              </div>
            )}

            {examResults.length > 5 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-right">
                <Link
                  to="/leaderboard"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center"
                >
                  <span>View All Results</span>
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions for Students */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <DashboardCard
              icon={<FaBook className="h-5 w-5" />}
              title="Practice Questions"
              description="Improve your skills by practicing with questions from our database."
              path="/questionbank"
            />

            <DashboardCard
              icon={<FaGraduationCap className="h-5 w-5" />}
              title="Available Exams"
              description="View and take available exams to test your knowledge."
              path="/exams"
            />

            <DashboardCard
              icon={<FaTrophy className="h-5 w-5" />}
              title="Leaderboard"
              description="See how you rank compared to other students."
              path="/leaderboard"
            />
          </div>
        </div>
      )}
      </div>
    </DisplayModeContext.Provider>
  );
};

export default Overview;
