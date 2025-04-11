import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';



// Protected route component for admin/teacher routes
export const AdminTeacherRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role === 'student') {
    return <Navigate to="/exams" replace />;
  }

  return children;
};

// Protected route component for admin-only routes
export const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/exams" replace />;
  }

  return children;
};

// Protected route component for non-student routes
export const NonStudentRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role === 'student') {
    return <Navigate to="/leaderboard" replace />;
  }

  return children;
}; 