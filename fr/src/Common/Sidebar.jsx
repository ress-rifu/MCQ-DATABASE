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
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Load user data and handle initial setup
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            // Redirect to login if no user data
            navigate('/login');
        }

        // Force light mode as default
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('darkMode', 'false');
    }, [navigate]);

    // Close mobile sidebar when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

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
                className={`group flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 my-1 rounded-lg text-sm ${
                    isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
                <span className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>{icon}</span>
                {!collapsed && (
                    <span className="truncate">
                        {label}
                    </span>
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
                    className={`group w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-3 py-2.5 my-1 rounded-lg text-sm ${
                        isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>{icon}</span>
                        {!collapsed && <span className="truncate">{label}</span>}
                    </div>
                    {!collapsed && (
                        <span className="text-gray-400">
                            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                        </span>
                    )}
                </button>

                <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                        isExpanded ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    } ${collapsed ? 'hidden' : 'ml-7 border-l border-gray-200 pl-3'}`}
                >
                    {React.Children.map(children, child =>
                        React.cloneElement(child, { isDropdownItem: true })
                    )}
                </div>

                {/* Collapsed dropdown items in popup */}
                {collapsed && isExpanded && (
                    <div className="absolute left-full top-0 ml-2 bg-white shadow-md rounded-lg p-3 z-50 min-w-48 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-1 mb-2">{label}</div>
                        {React.Children.map(children, child =>
                            React.cloneElement(child, { isDropdownItem: true })
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Show loading state while checking user data - Notion/Untitled UI Style
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Check if user is student to limit menu items
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin';

    // Toggle mobile sidebar
    const toggleMobileSidebar = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className="min-h-screen flex bg-white antialiased relative">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={toggleMobileSidebar}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar - Untitled UI Style */}
            <div
                className={`fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200 ease-in-out ${
                    collapsed ? 'w-20' : 'w-72'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
                        {!collapsed ? (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary-100 flex items-center justify-center">
                                    <img className="w-5 h-5" src={logo} alt="Question DB" />
                                </div>
                                <span className="font-semibold text-base text-gray-900">Exam System</span>
                            </div>
                        ) : (
                            <div className="w-9 h-9 mx-auto rounded-lg overflow-hidden bg-primary-100 flex items-center justify-center">
                                <img className="w-5 h-5" src={logo} alt="Question DB" />
                            </div>
                        )}
                        <button
                            onClick={toggleSidebar}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${
                                collapsed ? 'hidden' : ''
                            }`}
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Items - Untitled UI Style */}
                    <div className="flex flex-col py-5 overflow-y-auto">
                        {/* Section: Main */}
                        <div className="px-4 mb-4">
                            <h3 className={`text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 ${collapsed ? 'text-center' : ''}`}>
                                {!collapsed && 'Main'}
                            </h3>

                            {/* Overview - Only for admin and teachers */}
                            {!isStudent && (
                                <NavItem to="/overview" icon={<LuLayoutDashboard />} label="Overview" />
                            )}

                            {/* Leaderboard - For students */}
                            {isStudent && (
                                <NavItem to="/leaderboard" icon={<MdLeaderboard className="text-lg" />} label="Leaderboard" />
                            )}

                            {/* Question Bank - All users, but students can only view */}
                            <NavItem to="/questionbank" icon={<FiDatabase />} label="Question Bank" />

                            {/* Exams dropdown - All users, but students can only take exams */}
                            <NavDropdown id="exams" icon={<MdOutlineQuiz />} label="Exams">
                                <NavItem to="/exams" icon={<MdOutlineListAlt />} label="Exam List" isDropdownItem />
                                <NavItem to="/exams/create" icon={<MdCreateNewFolder />} label="Create Exam" requiredRole="admin" isDropdownItem />
                            </NavDropdown>
                        </div>

                        {/* Section: Content Management - For teachers and admins */}
                        {!isStudent && (
                            <div className="px-4 mb-4 mt-6">
                                <h3 className={`text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 ${collapsed ? 'text-center' : ''}`}>
                                    {!collapsed && 'Content'}
                                </h3>

                                {/* Upload Question - Teachers and admins only */}
                                <NavItem to="/upload" icon={<LuUpload />} label="Upload Question" requiredRole={['admin', 'teacher']} />

                                {/* My Questions - Teachers and admins only */}
                                <NavItem to="/myquestion" icon={<BsCollection />} label="My Questions" requiredRole={['admin', 'teacher']} />

                                {/* LaTeX Converter - Teachers and admins only */}
                                <NavItem to="/latex-converter" icon={<FiCode />} label="LaTeX Converter" requiredRole={['admin', 'teacher']} />
                            </div>
                        )}

                        {/* Section: Administration - Admin Only */}
                        {isAdmin && (
                            <div className="px-4 mb-4 mt-6">
                                <h3 className={`text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 ${collapsed ? 'text-center' : ''}`}>
                                    {!collapsed && 'Admin'}
                                </h3>

                                {/* Curriculum Management - Admin Only */}
                                <NavItem to="/curriculum" icon={<HiOutlineBookOpen />} label="Curriculum" requiredRole="admin" />
                                <NavItem to="/courses" icon={<FaLayerGroup />} label="Courses" requiredRole="admin" />

                                {/* User Management - Admin Only */}
                                <NavItem to="/admin" icon={<FaUsers />} label="Users" requiredRole="admin" />
                            </div>
                        )}
                    </div>

                    {/* Sidebar Footer - Untitled UI Style */}
                    <div className="mt-auto border-t border-gray-200">
                        {!collapsed ? (
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-medium">
                                            {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {user.name || user.username || 'User'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {isAdmin ? 'Administrator' : isStudent ? 'Student' : 'Teacher'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                            aria-label="Logout"
                                        >
                                            <FiLogOut className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        onClick={toggleDarkMode}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                    >
                                        <span className="flex items-center gap-3">
                                            {isDarkMode ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                </svg>
                                            )}
                                            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                                            {isDarkMode ? 'On' : 'Off'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-5 flex flex-col items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-medium">
                                    {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    aria-label="Logout"
                                >
                                    <FiLogOut className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu button */}
            <button
                onClick={toggleMobileSidebar}
                className="fixed top-5 left-5 z-20 md:hidden bg-white p-2.5 rounded-lg shadow-sm border border-gray-200"
                aria-label="Open menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Main Content - Untitled UI Style */}
            <div
                className={`flex-1 w-full transition-all duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}
            >
                <main className="p-5 sm:p-6 md:p-8 max-w-full bg-white min-h-screen overflow-x-hidden">
                    <div className="md:hidden h-12"></div> {/* Spacer for mobile menu button */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Sidebar;
