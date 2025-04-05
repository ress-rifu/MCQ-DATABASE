import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, getAuthHeader } from "../apiConfig";
import {
  FaUsers,
  FaBook,
  FaChalkboardTeacher,
  FaQuestionCircle,
  FaLayerGroup,
  FaSearch,
  FaEdit,
  FaCloudUploadAlt,
  FaListAlt,
  FaMoon,
  FaShieldAlt,
  FaLock,
  FaServer,
  FaExchangeAlt,
  FaTable,
  FaChartBar,
  FaCog,
  FaClock,
  FaPlus,
  FaRocket,
  FaExclamationTriangle,
  FaRegFileAlt,
  FaTimes
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth.jsx";
import useAxiosWithErrorHandling from "../hooks/useAxiosWithErrorHandling.jsx";
import { toast } from "react-hot-toast";
import { FiTrash, FiEye } from "react-icons/fi";

// Dashboard card component with hover animation and action buttons
const DashboardCard = ({ icon, title, description, path, color, actions = [] }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center justify-center rounded-md p-2.5 ${color}`}>
            {icon}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {path && (
              <Link 
                to={path} 
                className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title="Open"
              >
                <FaRocket className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
        
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
            {actions.map((action, index) => (
              <Link 
                key={index}
                to={action.path} 
                className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                {action.icon && <span className="mr-1.5">{action.icon}</span>}
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Quick action button component
const QuickAction = ({ icon, label, to, color }) => {
  return (
    <Link
      to={to}
      className={`${color} flex flex-col items-center justify-center rounded-lg p-4 hover:opacity-90 transition-all shadow no-underline`}
    >
      <div className="text-xl mb-2">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
};

// Stats card component
const StatsCard = ({ icon, label, value, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium">{label}</p>
          {isLoading ? (
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{value}</h4>
          )}
        </div>
        <div className="p-2.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
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
    <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200">
      {/* Icon */}
      <div className={`p-2 rounded-full ${bgColor} ${textColor} shrink-0`}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {activity.title || 'Activity'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {activity.description || 'No description available'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {timestamp}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {activity.activity_type === 'import_questions' && (
          <>
            <button
              onClick={() => navigate('/question-bank', { state: { importId: activity.id } })}
              className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors"
              aria-label="View imported questions"
            >
              <FiEye className="h-3 w-3 mr-1" />
              View
            </button>
            <button
              onClick={() => handleDeleteImport(activity.id)}
              disabled={deleteLoading}
              className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete imported questions"
            >
              {deleteLoading ? (
                <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FiTrash className="h-3 w-3 mr-1" />
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
    <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
      <div className="text-gray-400 dark:text-gray-500 mb-3 text-3xl">{icon}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

// API Error Message component
const ApiErrorMessage = () => {
  return (
    <div className="p-4 mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
      <div className="flex items-start">
        <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mr-4">
          <FaExclamationTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">API Endpoints Unavailable</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
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
      bgColor = "bg-blue-100 dark:bg-blue-900/30";
      textColor = "text-blue-600 dark:text-blue-400";
      break;
    case 'edit_question':
      icon = <FaEdit className="w-3.5 h-3.5" />;
      bgColor = "bg-green-100 dark:bg-green-900/30";
      textColor = "text-green-600 dark:text-green-400";
      break;
    case 'create_question':
      icon = <FaPlus className="w-3.5 h-3.5" />;
      bgColor = "bg-purple-100 dark:bg-purple-900/30";
      textColor = "text-purple-600 dark:text-purple-400";
      break;
    case 'export_questions':
      icon = <FaExchangeAlt className="w-3.5 h-3.5" />;
      bgColor = "bg-orange-100 dark:bg-orange-900/30";
      textColor = "text-orange-600 dark:text-orange-400";
      break;
    case 'user_management':
      icon = <FaUsers className="w-3.5 h-3.5" />;
      bgColor = "bg-indigo-100 dark:bg-indigo-900/30";
      textColor = "text-indigo-600 dark:text-indigo-400";
      break;
    default:
      icon = <FaRegFileAlt className="w-3.5 h-3.5" />;
      bgColor = "bg-gray-100 dark:bg-gray-700";
      textColor = "text-gray-600 dark:text-gray-400";
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [apiErrorOccurred, setApiErrorOccurred] = useState(false);
  const { get } = useAxiosWithErrorHandling();
  const hasRunOnceRef = useRef(false);
  const navigate = useNavigate();
  
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
    
    const fetchDashboardData = async () => {
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
          questions: { value: questionsData.count || 0, isLoading: false },
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
    
    fetchDashboardData();
  }, [user, safeApiCall]);

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {getCurrentTimeGreeting()}, {user?.name || "User"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome to your Question Database Dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setDisplayMode("grid")}
              className={`p-2 rounded-md ${displayMode === "grid" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setDisplayMode("list")}
              className={`p-2 rounded-md ${displayMode === "list" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
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

        {/* Quick statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
          <StatsCard
            icon={<FaQuestionCircle className="w-5 h-5" />}
            label="Questions"
            value={stats.questions.value.toLocaleString()}
            isLoading={stats.questions.isLoading}
          />
          <StatsCard
            icon={<FaLayerGroup className="w-5 h-5" />}
            label="Curriculum Items"
            value={stats.curriculum.value.toLocaleString()}
            isLoading={stats.curriculum.isLoading}
          />
          {user?.role === 'admin' && (
            <StatsCard
              icon={<FaUsers className="w-5 h-5" />}
              label="Users"
              value={stats.users.value.toLocaleString()}
              isLoading={stats.users.isLoading}
            />
          )}
          <StatsCard
            icon={<FaCloudUploadAlt className="w-5 h-5" />}
            label="Your Uploads"
            value={stats.uploads.value.toLocaleString()}
            isLoading={stats.uploads.isLoading}
          />
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
          <QuickAction
            icon={<FaCloudUploadAlt className="text-white" />}
            label="Upload"
            to="/upload"
            color="bg-indigo-600 dark:bg-indigo-700 text-white"
          />
          <QuickAction
            icon={<FaSearch className="text-white" />}
            label="Questions"
            to="/questionbank"
            color="bg-purple-600 dark:bg-purple-700 text-white"
          />
          <QuickAction
            icon={<FaPlus className="text-white" />}
            label="Add New"
            to="/add-question"
            color="bg-green-600 dark:bg-green-700 text-white"
          />
          <QuickAction
            icon={<FaBook className="text-white" />}
            label="Curriculum"
            to="/curriculum"
            color="bg-amber-600 dark:bg-amber-700 text-white"
          />
        </div>
        
        {user?.role === 'admin' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
            <QuickAction
              icon={<FaLayerGroup className="text-white" />}
              label="Courses"
              to="/courses"
              color="bg-blue-600 dark:bg-blue-700 text-white"
            />
            <QuickAction
              icon={<FaUsers className="text-white" />}
              label="Users"
              to="/admin"
              color="bg-gray-700 dark:bg-gray-800 text-white"
            />
          </div>
        )}
      </div>
      
      {/* Main dashboard section with feature cards */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Feature cards */}
        <div className={`lg:flex-1 ${displayMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-5"}`}>
          <DashboardCard
            icon={<FaQuestionCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            title="Question Bank"
            description="Browse, filter, and manage your repository of questions by subject, class, and more."
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            path="/questionbank"
            actions={[
              { label: "View All", path: "/questionbank", icon: <FaSearch className="w-3 h-3" /> },
              { label: "Add New", path: "/add-question", icon: <FaPlus className="w-3 h-3" /> }
            ]}
          />
          
          <DashboardCard
            icon={<FaCloudUploadAlt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            title="Upload Questions"
            description="Import questions from Excel, CSV or other formats to quickly build your question bank."
            color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            path="/upload"
            actions={[
              { label: "Start Upload", path: "/upload", icon: <FaCloudUploadAlt className="w-3 h-3" /> }
            ]}
          />
          
          <DashboardCard
            icon={<FaListAlt className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            title="My Questions"
            description="Access and manage questions that you've created or uploaded to the system."
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            path="/myquestion"
            actions={[
              { label: "View Content", path: "/myquestion", icon: <FaListAlt className="w-3 h-3" /> }
            ]}
          />
          
          <DashboardCard
            icon={<FaLayerGroup className="h-5 w-5 text-green-600 dark:text-green-400" />}
            title="Curriculum Management"
            description="Organize educational content with an intuitive hierarchical structure for classes, subjects, and chapters."
            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            path="/curriculum"
            actions={[
              { label: "Manage", path: "/curriculum", icon: <FaEdit className="w-3 h-3" /> }
            ]}
          />
          
          {user?.role === 'admin' && (
            <DashboardCard
              icon={<FaUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              title="User Management"
              description="Manage user accounts, roles, and permissions for accessing the question database."
              color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              path="/admin"
              actions={[
                { label: "Manage Users", path: "/admin", icon: <FaUsers className="w-3 h-3" /> }
              ]}
            />
          )}
          
          {user?.role === 'admin' && (
            <DashboardCard
              icon={<FaLayerGroup className="h-5 w-5 text-red-600 dark:text-red-400" />}
              title="Course Management"
              description="Create and manage courses by combining classes, subjects, and chapters."
              color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              path="/courses"
              actions={[
                { label: "Manage Courses", path: "/courses", icon: <FaLayerGroup className="w-3 h-3" /> }
              ]}
            />
          )}
        </div>
        
        {/* Recent activity sidebar */}
        <div className="lg:w-80 xl:w-96 shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <button 
                onClick={fetchActivity}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
                icon={<FaClock className="h-8 w-8" />} 
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
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center">
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
    </div>
  );
};

export default Overview;
