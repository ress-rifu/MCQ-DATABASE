import React, { useState, useEffect } from 'react';
import { BsCollection } from 'react-icons/bs';
import { FaUserCog, FaLayerGroup } from 'react-icons/fa';
import { FiDatabase, FiCode } from 'react-icons/fi';
import { LuLayoutDashboard, LuUpload } from 'react-icons/lu';
import { FiLogOut } from 'react-icons/fi';
import { HiOutlineBookOpen } from 'react-icons/hi';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/exam.png';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Load user data from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            // Redirect to login if no user data
            navigate('/login');
        }

        // Check if dark mode is enabled in localStorage or user preference
        const darkModePreference = localStorage.getItem('darkMode') === 'true' || 
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        setIsDarkMode(darkModePreference);
        document.documentElement.classList.toggle('dark', darkModePreference);
    }, [navigate]);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        document.documentElement.classList.toggle('dark', newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const NavItem = ({ to, icon, label, requiredRole }) => {
        // Skip rendering if required role is specified and user doesn't have it
        if (requiredRole && user && user.role !== requiredRole) {
            return null;
        }
        
        const isActive = location.pathname === to || 
                        (to === '/' && location.pathname === '') || 
                        (to !== '/' && location.pathname.startsWith(to));
        
        return (
            <Link 
                to={to}
                className={`relative flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
            >
                <span className={`text-lg ${isActive ? 'text-indigo-600 dark:text-indigo-300' : ''}`}>{icon}</span>
                {!collapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 dark:bg-indigo-400 rounded-r-full" />
                )}
            </Link>
        );
    };

    // Show loading state while checking user data
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900">
            {/* Sidebar */}
            <div 
                className={`fixed top-4 left-4 h-[calc(100vh-2rem)] z-40 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transition-all duration-300 overflow-hidden ${
                    collapsed ? 'w-16' : 'w-64'
                }`}
            >
                <div className="flex flex-col h-full p-3 gap-1">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between mb-5 px-2 py-1">
                        {!collapsed ? (
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                    <img className="w-4 h-4" src={logo} alt="Question DB" />
                                </div>
                                <span className="font-medium text-gray-800 dark:text-gray-200">Question Dashboard</span>
                            </div>
                        ) : (
                            <div className="w-7 h-7 mx-auto rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                <img className="w-4 h-4" src={logo} alt="Question DB" />
                            </div>
                        )}
                        <button 
                            onClick={toggleSidebar}
                            className={`w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ${
                                collapsed ? 'ml-auto mr-auto mt-4' : ''
                            }`}
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-1 mb-auto px-1">
                        <NavItem to="/overview" icon={<LuLayoutDashboard />} label="Overview" />
                        <NavItem to="/upload" icon={<LuUpload />} label="Upload Question" />
                        <NavItem to="/questionbank" icon={<FiDatabase />} label="Question Bank" />
                        <NavItem to="/myquestion" icon={<BsCollection />} label="My Questions" />
                        <NavItem to="/curriculum" icon={<HiOutlineBookOpen />} label="Curriculum" requiredRole="admin" />
                        <NavItem to="/courses" icon={<FaLayerGroup />} label="Courses" requiredRole="admin" />
                        <NavItem to="/latex-converter" icon={<FiCode />} label="LaTeX Converter" />
                        {/* Only show user management for admins */}
                        {user.role === 'admin' && (
                            <NavItem to="/admin" icon={<FaUserCog />} label="Manage Users" />
                        )}
                    </div>
                    
                    {/* Dark mode toggle */}
                    <div className={`px-1 pt-3 border-t border-gray-200 dark:border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
                        <button 
                            onClick={toggleDarkMode}
                            className={`${collapsed ? 'w-9 h-9 rounded-lg flex items-center justify-center' : 'flex items-center gap-3 w-full px-3 py-2.5 rounded-md'} text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
                            aria-label="Toggle dark mode"
                        >
                            <span className="text-lg">
                                {isDarkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="4"></circle>
                                        <path d="M12 2v2"></path>
                                        <path d="M12 20v2"></path>
                                        <path d="m4.93 4.93 1.41 1.41"></path>
                                        <path d="m17.66 17.66 1.41 1.41"></path>
                                        <path d="M2 12h2"></path>
                                        <path d="M20 12h2"></path>
                                        <path d="m6.34 17.66-1.41 1.41"></path>
                                        <path d="m19.07 4.93-1.41 1.41"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                                    </svg>
                                )}
                            </span>
                            {!collapsed && <span className="text-sm whitespace-nowrap">Toggle Dark Mode</span>}
                        </button>
                    </div>
                    
                    {/* Fixed Profile section at bottom */}
                    <div className="mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {collapsed ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-indigo-100 dark:ring-indigo-900/30 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="w-9 h-9 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Logout"
                                >
                                    <FiLogOut />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mx-1 px-3 py-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10">
                                    <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30">
                                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                            {user.role === 'admin' ? 'Administrator' : 'Teacher'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 w-full mt-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <FiLogOut />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 bg-white dark:bg-gray-900 ${collapsed ? 'ml-24' : 'ml-72'}`}>
                <div className="p-6 sm:p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
