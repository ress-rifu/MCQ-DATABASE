import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, getAuthHeader } from "../apiConfig";
import {
  FaUsers,
  FaBook,
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
  FaCheckCircle
} from "react-icons/fa";
import { FiEye, FiTrash } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth.jsx";
import useAxiosWithErrorHandling from "../hooks/useAxiosWithErrorHandling.jsx";
import { toast } from "react-hot-toast";

// Dashboard card component with hover animation
const DashboardCard = ({ icon, title, description, path }) => {
  return (
    <Link 
      to={path}
      className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 border border-gray-100/20 dark:border-gray-700/30 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-200/30 dark:hover:border-gray-600/30 transition-all duration-200 overflow-hidden p-6 flex flex-col h-full"
    >
      <div className="flex items-start mb-5">
        <div className="flex-shrink-0 bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30 p-3.5 rounded-lg text-gray-700 dark:text-gray-300 shadow-inner">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm flex-grow">{description}</p>
    </Link>
  );
};

// Stats card component
const StatsCard = ({ icon, label, value, isLoading, color }) => {
  // Define color classes
  const getColorClasses = (colorName) => {
    switch(colorName) {
      case 'blue':
        return "from-blue-50/20 to-blue-100/10 dark:from-blue-900/20 dark:to-blue-800/10 text-blue-600 dark:text-blue-400";
      case 'green':
        return "from-green-50/20 to-green-100/10 dark:from-green-900/20 dark:to-green-800/10 text-green-600 dark:text-green-400";
      case 'yellow':
        return "from-yellow-50/20 to-yellow-100/10 dark:from-yellow-900/20 dark:to-yellow-800/10 text-yellow-600 dark:text-yellow-400";
      case 'indigo':
        return "from-indigo-50/20 to-indigo-100/10 dark:from-indigo-900/20 dark:to-indigo-800/10 text-indigo-600 dark:text-indigo-400";
      default:
        return "from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30 text-gray-700 dark:text-gray-300";
    }
  };
  
  const colorClasses = getColorClasses(color);
  
  return (
    <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 border border-gray-100/20 dark:border-gray-700/30 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 font-medium">{label}</p>
          {isLoading ? (
            <div className="h-6 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded animate-pulse"></div>
          ) : (
            <h4 className="text-xl font-medium text-gray-900 dark:text-white">{value}</h4>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses} shadow-inner`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Recent activity item component
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
      const response = await axios.delete(
        `${API_BASE_URL}/api/activity/${activityId}/delete-import`, 
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
  const { icon, bgColor, textColor } = getActivityData(activity.activity_type);
  
  // Format timestamp
  const timestamp = formatActivityTime(activity.created_at);
  
  return (
    <div className="flex items-start space-x-4 p-5 rounded-xl backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 border border-gray-100/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-200">
      {/* Icon */}
      <div className={`p-3 rounded-lg ${bgColor} ${textColor} shrink-0 shadow-inner`}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {activity.title || 'Activity'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          {activity.description || 'No description available'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {timestamp}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {activity.activity_type === 'import_questions' && (
          <>
            <button
              onClick={() => navigate('/question-bank', { state: { importId: activity.id } })}
              className="inline-flex items-center px-3 py-1.5 border border-gray-200/30 dark:border-gray-600/30 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/20 dark:bg-gray-700/30 hover:bg-gray-50/30 dark:hover:bg-gray-600/30 focus:outline-none transition-colors"
              aria-label="View imported questions"
            >
              <FiEye className="h-3 w-3 mr-1.5" />
              View
            </button>
            <button
              onClick={() => handleDeleteImport(activity.id)}
              disabled={deleteLoading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-xs font-medium text-white bg-gray-600/80 hover:bg-gray-700/80 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete imported questions"
            >
              {deleteLoading ? (
                <svg className="animate-spin h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FiTrash className="h-3 w-3 mr-1.5" />
              )}
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200/30 dark:border-gray-700/30 shadow-lg">
      <div className="text-gray-400 dark:text-gray-500 mb-4 text-2xl p-4 rounded-xl bg-gradient-to-br from-gray-50/10 to-gray-100/5 dark:from-gray-700/20 dark:to-gray-800/10 shadow-inner">{icon}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

// API Error Message component
const ApiErrorMessage = () => {
  return (
    <div className="p-5 mb-6 rounded-xl backdrop-blur-sm bg-white/5 dark:bg-gray-800/20 border border-gray-200/30 dark:border-gray-700/30 shadow-lg">
      <div className="flex items-start">
        <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50/10 to-gray-100/5 dark:from-gray-700/20 dark:to-gray-800/10 text-gray-500 dark:text-gray-400 mr-4 shadow-inner">
          <FaExclamationTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">API Endpoints Unavailable</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Some data could not be loaded because the required API endpoints are not available.
            This is likely because the backend server is still in development.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            The dashboard will display with limited functionality until the APIs are implemented.
          </p>
        </div>
      </div>
    </div>
  );
};

// Function to get activity data (icon, colors) based on activity type
const getActivityData = (activityType) => {
  let icon, bgColor, textColor;
  
  switch (activityType) {
    case 'import_questions':
      icon = <FaCloudUploadAlt className="w-3.5 h-3.5" />;
      bgColor = "bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30";
      textColor = "text-gray-700 dark:text-gray-300";
      break;
    case 'edit_question':
      icon = <FaEdit className="w-3.5 h-3.5" />;
      bgColor = "bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30";
      textColor = "text-gray-700 dark:text-gray-300";
      break;
    case 'create_question':
      icon = <FaPlus className="w-3.5 h-3.5" />;
      bgColor = "bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30";
      textColor = "text-gray-700 dark:text-gray-300";
      break;
    case 'export_questions':
      icon = <FaSearch className="w-3.5 h-3.5" />;
      bgColor = "bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30";
      textColor = "text-gray-700 dark:text-gray-300";
      break;
    case 'user_management':
      icon = <FaUsers className="w-3.5 h-3.5" />;
      bgColor = "bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30";
      textColor = "text-gray-700 dark:text-gray-300";
      break;
    default:
      icon = <FaRegFileAlt className="w-3.5 h-3.5" />;
      bgColor = "bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/30";
      textColor = "text-gray-700 dark:text-gray-300";
  }
  
  return { icon, bgColor, textColor };
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
    uploads: { value: 0, isLoading: true }
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
      const response = await get(endpoint);
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
      // Set loading states
      setIsActivityLoading(true);
      setStats(prev => ({
        questions: { ...prev.questions, isLoading: true },
        curriculum: { ...prev.curriculum, isLoading: true },
        users: { ...prev.users, isLoading: true },
        uploads: { ...prev.uploads, isLoading: true }
      }));
      
      // Create an array of promises for parallel API calls
      const [questionsData, curriculumData, usersData, activityData] = await Promise.all([
        safeApiCall('/api/questions/stats'),
        safeApiCall('/api/curriculum/count'),
        user?.role === 'admin' ? safeApiCall('/api/users/count') : Promise.resolve({ count: '-' }),
        safeApiCall('/api/activity/recent', { activities: [] })
      ]);
      
      // Update stats with fetched data
      setStats({
        questions: { value: questionsData.totalQuestions || questionsData.count || 0, isLoading: false },
        curriculum: { value: curriculumData.count || 0, isLoading: false },
        users: { value: usersData.count || 0, isLoading: false },
        uploads: { value: questionsData.userCount || 0, isLoading: false }
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
        questions: { ...prev.questions, isLoading: false },
        curriculum: { ...prev.curriculum, isLoading: false },
        users: { ...prev.users, isLoading: false },
        uploads: { ...prev.uploads, isLoading: false }
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header section with greeting and quick stats */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">
              {getCurrentTimeGreeting()}, {user?.name || "User"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isStudent 
                ? "Welcome to your Performance Dashboard" 
                : "Welcome to your Question Database Dashboard"}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setDisplayMode("grid")}
              className={`p-2 rounded-md ${displayMode === "grid" ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setDisplayMode("list")}
              className={`p-2 rounded-md ${displayMode === "list" ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
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

        {/* Quick statistics - Show different stats for students vs. teachers/admins */}
        {isStudent ? (
          /* Student Stats */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
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
              label="Your Uploads"
              value={stats.uploads.value.toLocaleString()}
              isLoading={stats.uploads.isLoading}
              color="indigo"
            />
          </div>
        )}
      </div>
      
      {/* Main dashboard section with feature cards for non-students */}
      {!isStudent && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Feature cards */}
          <div className={`lg:flex-1 ${displayMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-5"}`}>
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
          
          {/* Recent activity sidebar */}
          <div className="lg:w-80 xl:w-96 shrink-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
                <button 
                  onClick={fetchActivity}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  title="Refresh"
                >
                  <FaClock className="w-4 h-4" />
                </button>
              </div>
              
              {isActivityLoading ? (
                // Activity loading state
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                // Empty state
                <EmptyState 
                  message="No recent activity to display" 
                  icon={<FaClock className="h-7 w-7" />} 
                />
              ) : (
                // Activity items
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem 
                      key={activity.id || index}
                      activity={activity}
                      onRefresh={fetchActivity}
                    />
                  ))}
                </div>
              )}
              
              {!isActivityLoading && recentActivity.length > 5 && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button className="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center">
                    <span>View all activity</span>
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Student dashboard - Exam results section */}
      {isStudent && (
        <div className="space-y-6">
          {/* Recent Exams for Students */}
          <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50/30 to-gray-100/20 dark:from-gray-700/30 dark:to-gray-800/20 px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
              <h2 className="font-medium text-gray-800 dark:text-white">Your Recent Exam Results</h2>
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  <thead className="bg-gray-50/30 dark:bg-gray-800/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/10 dark:bg-gray-800/10 divide-y divide-gray-200/30 dark:divide-gray-700/30">
                    {examResults.slice(0, 5).map((result) => {
                      const percentage = result.exam.total_marks 
                        ? Math.round((result.score / result.exam.total_marks) * 100) 
                        : 0;
                        
                      return (
                        <tr key={result.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{result.exam.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{result.exam.subject_name} • {result.exam.class_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(result.completed_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {result.score}/{result.exam.total_marks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${
                                percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                                percentage >= 60 ? 'text-blue-600 dark:text-blue-400' :
                                percentage >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {percentage}%
                              </span>
                              <div className="ml-2 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    percentage >= 80 ? 'bg-green-600' :
                                    percentage >= 60 ? 'bg-blue-600' :
                                    percentage >= 40 ? 'bg-yellow-500' :
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {result.rank ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                result.rank <= 3 
                                  ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}>
                                #{result.rank}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/exams/${result.exam.id}/leaderboard`}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 mb-2">You haven't taken any exams yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start taking exams to see your results here.</p>
                <Link
                  to="/exams"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 text-white rounded-lg hover:from-indigo-700/90 hover:to-indigo-800/90 transition-colors inline-flex items-center shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Browse Available Exams
                </Link>
              </div>
            )}
            
            {examResults.length > 5 && (
              <div className="px-6 py-3 border-t border-gray-200/30 dark:border-gray-700/30 text-right">
                <Link 
                  to="/leaderboard" 
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  View All Results →
                </Link>
              </div>
            )}
          </div>
          
          {/* Quick Actions for Students */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  );
};

export default Overview;
