import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth.jsx';

// Wrap components that need AuthProvider
const withAuth = (Component) => {
  return (
    <AuthProvider>
      {Component}
    </AuthProvider>
  );
};

// Protected route component for admin/teacher routes
export const AdminTeacherRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role === 'student') {
    return <Navigate to="/exams" replace />;
  }

  return withAuth(children);
};

// Protected route component for admin-only routes
export const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/exams" replace />;
  }

  return withAuth(children);
};

// Protected route component for non-student routes
export const NonStudentRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role === 'student') {
    return <Navigate to="/leaderboard" replace />;
  }

  return withAuth(children);
}; 