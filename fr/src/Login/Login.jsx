import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../hooks/useAuth';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();
    const navigationAttempted = useRef(false);
    const navigationTimeoutRef = useRef(null);
    const { login } = useAuth();

    useEffect(() => {
        // Animation on mount
        setMounted(true);
        
        // Clean up navigation timeout on unmount
        return () => {
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Only attempt navigation once to prevent loops
        if (navigationAttempted.current) return;
        
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Validate token before navigation
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isTokenExpired = Date.now() >= payload.exp * 1000;
                
                if (!isTokenExpired) {
                    navigationAttempted.current = true;
                    // Use ref to store timeout ID so it can be cleaned up
                    navigationTimeoutRef.current = setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 300); // Increased timeout to avoid rapid navigation
                } else {
                    // Token expired, remove it
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (err) {
                // Invalid token format, remove it
                console.error("Invalid token format:", err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Prevent multiple submission attempts
        if (isLoading) return;
        
        setIsLoading(true);
        setError('');

        try {
            console.log('Sending login request to:', `${API_BASE_URL}/api/auth/login`);
            
            // Use the login function from useAuth hook instead of direct axios call
            await login({ 
                email: email.trim(),
                password 
            });

            // The useAuth hook will handle the redirect to home page
        } catch (err) {
            console.error('Login error:', err);
            
            // Detailed error handling
            if (err.response) {
                // The server responded with a status code outside the 2xx range
                console.error('Server response status:', err.response.status);
                
                if (err.response.status === 400) {
                    // Handle validation errors
                    if (err.response.data.errors && err.response.data.errors.length > 0) {
                        // Express-validator errors
                        const errorMessages = err.response.data.errors.map(e => e.msg).join(', ');
                        setError(`Validation error: ${errorMessages}`);
                    } else {
                        // General 400 error
                        setError(err.response.data.message || 'Invalid credentials. Please check your email and password.');
                    }
                } else if (err.response.status === 401 || err.response.status === 403) {
                    setError('Authentication failed. Please check your credentials.');
                } else if (err.response.status >= 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(err.response.data.message || 'Error during login. Please try again.');
                }
            } else if (err.request) {
                // The request was made but no response was received
                setError('No response from server. Please check your internet connection.');
            } else {
                // Something happened in setting up the request
                setError(`Request failed: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div 
                className={`w-full max-w-md transform transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 8h10M7 12h10M7 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
                
                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300">
                    <div className="px-6 py-8 sm:px-10 sm:py-8">
                        <h2 className="text-2xl font-medium text-center text-gray-900 dark:text-gray-100 mb-8">
                            Log in to QuestionBank
                        </h2>
                        
                        {error && (
                            <div className="mb-6 py-2.5 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    disabled={isLoading}
                                    placeholder="name@example.com"
                                />
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Password
                                    </label>
                                    <a href="#" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors duration-200">
                                        Forgot password?
                                    </a>
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    disabled={isLoading}
                                    placeholder="••••••••"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="w-full py-2.5 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <svg className="animate-spin mx-auto h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Continue with Email'}
                            </button>
                        </form>
                    </div>
                </div>
                
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
                    By clicking "Continue with Email", you agree to our
                    <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline"> Terms of Service</a> and
                    <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline"> Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}

export default Login;
