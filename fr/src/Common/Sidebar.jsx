import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BsCollection } from 'react-icons/bs';
import { FaLayerGroup, FaChevronDown, FaChevronRight, FaUsers } from 'react-icons/fa';
import { FiDatabase, FiCode, FiLogOut } from 'react-icons/fi';
import { LuLayoutDashboard, LuUpload } from 'react-icons/lu';
import { HiOutlineBookOpen } from 'react-icons/hi';
import { MdOutlineQuiz, MdOutlineListAlt, MdCreateNewFolder, MdLeaderboard } from 'react-icons/md';
import logo from '../assets/exam.png';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
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

    const toggleExpandMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    // Helper function to check if user has required role
    const hasRole = (requiredRoles) => {
        if (!user || !user.role) return false;
        if (!requiredRoles) return true;
        if (typeof requiredRoles === 'string') return user.role === requiredRoles;
        return requiredRoles.includes(user.role);
    };

    const NavItem = ({ to, icon, label, requiredRole, isDropdownItem }) => {
        // Skip rendering if required role is specified and user doesn't have it
        if (requiredRole && !hasRole(requiredRole)) {
            return null;
        }
        
        // Different active state detection for regular menu items vs dropdown items
        let isActive;
        
        if (isDropdownItem) {
            // For dropdown items, ensure we're checking for exact matches or direct child routes
            isActive = location.pathname === to || 
                      (to !== '/' && location.pathname === `${to}/`) || 
                      (to.endsWith('/create') && location.pathname.startsWith(to));
        } else {
            // For main menu items, check if we're in that section
            isActive = location.pathname === to || 
                      (to === '/' && location.pathname === '') || 
                      (to !== '/' && to !== '/exams' && location.pathname.startsWith(to));
        }
        
        return (
            <Link 
                to={to}
                className={`group relative flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 my-0.5 rounded-xl ${
                    isActive 
                        ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium backdrop-blur-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
            >
                <span className={`text-lg ${isActive ? 'text-black dark:text-white' : ''}`}>{icon}</span>
                {!collapsed && (
                    <span className={`text-sm font-light tracking-wide ${isActive ? 'font-normal' : ''}`}>
                        {label}
                    </span>
                )}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-black dark:bg-white rounded-r-full" />
                )}
            </Link>
        );
    };

    const NavDropdown = ({ id, icon, label, children, requiredRole }) => {
        // Skip rendering if required role is specified and user doesn't have it
        if (requiredRole && !hasRole(requiredRole)) {
            return null;
        }

        const isExpanded = expandedMenus[id];
        
        // Check if any child path matches current location
        const childPaths = React.Children.toArray(children).map(child => child.props.to);
        const isActive = childPaths.some(path => 
            location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path))
        );

        // Auto-expand the menu when a child item is active
        useEffect(() => {
            if (isActive && !isExpanded) {
                setExpandedMenus(prev => ({
                    ...prev,
                    [id]: true
                }));
            }
        }, [isActive, id, isExpanded]);

        return (
            <div className="nav-dropdown">
                <button 
                    onClick={() => toggleExpandMenu(id)}
                    className={`group relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-2.5 my-0.5 rounded-xl ${
                        isActive 
                            ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium backdrop-blur-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className={`text-lg ${isActive ? 'text-black dark:text-white' : ''}`}>{icon}</span>
                        {!collapsed && <span className={`text-sm font-light tracking-wide ${isActive ? 'font-normal' : ''}`}>{label}</span>}
                    </div>
                    {!collapsed && (
                        <span className="text-xs">
                            {isExpanded ? <FaChevronDown className="opacity-70" /> : <FaChevronRight className="opacity-70" />}
                        </span>
                    )}
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-black dark:bg-white rounded-r-full" />
                    )}
                </button>
                
                <div 
                    className={`overflow-hidden ${
                        isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    } ${collapsed ? 'hidden' : 'pl-6'}`}
                >
                    {React.Children.map(children, child => 
                        React.cloneElement(child, { isDropdownItem: true })
                    )}
                </div>
                
                {/* Collapsed dropdown items in popup */}
                {collapsed && isExpanded && (
                    <div className="absolute left-full top-0 ml-2 glass-morphism shadow-lg rounded-2xl p-2 z-50 min-w-40 subtle-shadow">
                        <div className="font-light text-sm px-4 py-2 text-black/60 dark:text-white/70">{label}</div>
                        {React.Children.map(children, child => 
                            React.cloneElement(child, { isDropdownItem: true })
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Show loading state while checking user data
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-black dark:border-t-white rounded-full"></div>
            </div>
        );
    }

    // Check if user is student to limit menu items
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin';
    
    return (
        <div className="min-h-screen flex bg-white dark:bg-black antialiased">
            {/* Sidebar */}
            <div 
                className={`fixed top-4 left-4 h-[calc(100vh-2rem)] z-40 flex flex-col glass-morphism rounded-3xl subtle-shadow overflow-hidden ${
                    collapsed ? 'w-16' : 'w-64'
                }`}
            >
                <div className="flex flex-col h-full p-3 gap-1">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between mb-5 px-2 py-1">
                        {!collapsed ? (
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-inner">
                                    <img className="w-4 h-4" src={logo} alt="Question DB" />
                                </div>
                                <span className="font-light text-base text-gray-900 dark:text-gray-100 tracking-tight">Dashboard</span>
                            </div>
                        ) : (
                            <div className="w-8 h-8 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-inner">
                                <img className="w-4 h-4" src={logo} alt="Question DB" />
                            </div>
                        )}
                        <button 
                            onClick={toggleSidebar}
                            className={`w-7 h-7 rounded-full bg-transparent flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ${
                                collapsed ? 'ml-auto mr-auto mt-4' : ''
                            }`}
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 ${collapsed ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-0.5 px-1 mb-auto">
                        {/* Overview - Only for admin and teachers */}
                        {!isStudent && (
                            <NavItem to="/overview" icon={<LuLayoutDashboard />} label="Overview" />
                        )}
                        
                        {/* Leaderboard - For students */}
                        {isStudent && (
                            <NavItem to="/leaderboard" icon={<MdLeaderboard className="text-lg" />} label="Leaderboard" />
                        )}
                        
                        {/* Upload Question - Teachers and admins only */}
                        <NavItem to="/upload" icon={<LuUpload />} label="Upload Question" requiredRole={['admin', 'teacher']} />
                        
                        {/* Question Bank - All users, but students can only view */}
                        <NavItem to="/questionbank" icon={<FiDatabase />} label="Question Bank" />
                        
                        {/* My Questions - Teachers and admins only */}
                        <NavItem to="/myquestion" icon={<BsCollection />} label="My Questions" requiredRole={['admin', 'teacher']} />
                        
                        {/* Exams dropdown - All users, but students can only take exams */}
                        <NavDropdown id="exams" icon={<MdOutlineQuiz />} label="Exams">
                            <NavItem to="/exams" icon={<MdOutlineListAlt />} label="Exam List" isDropdownItem />
                            <NavItem to="/exams/create" icon={<MdCreateNewFolder />} label="Create Exam" requiredRole="admin" isDropdownItem />
                        </NavDropdown>
                        
                        {/* Curriculum Management - Admin Only */}
                        <NavItem to="/curriculum" icon={<HiOutlineBookOpen />} label="Curriculum" requiredRole="admin" />
                        <NavItem to="/courses" icon={<FaLayerGroup />} label="Courses" requiredRole="admin" />
                        
                        {/* LaTeX Converter - Teachers and admins only */}
                        <NavItem to="/latex-converter" icon={<FiCode />} label="LaTeX Converter" requiredRole={['admin', 'teacher']} />
                        
                        {/* User Management - Admin Only */}
                        <NavItem to="/admin" icon={<FaUsers />} label="Users" requiredRole="admin" />
                    </div>
                    
                    {/* Sidebar Footer */}
                    <div className="mt-auto pt-4">
                        {!collapsed ? (
                            <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 shadow-inner">
                                        {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                                            {user.name || user.username || 'User'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                            {isAdmin ? 'Administrator' : isStudent ? 'Student' : 'Teacher'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={toggleDarkMode}
                                        className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                                    >
                                        {isDarkMode ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        aria-label="Logout"
                                    >
                                        <FiLogOut className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={toggleDarkMode}
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                                >
                                    {isDarkMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    )}
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    aria-label="Logout"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div 
                className={`flex-1 w-full ml-auto ${collapsed ? 'sm:pl-24' : 'sm:pl-72'}`}
            >
                <main className="p-4 sm:p-6 max-w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Sidebar;
