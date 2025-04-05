import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, getAuthHeader } from '../apiConfig';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const StudentLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [examResults, setExamResults] = useState([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    totalQuestions: 0
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch student's exam results
    const fetchStudentExams = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/student/exams`, {
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
            
            setStats({
              totalExams,
              averageScore: avgScore.toFixed(1),
              highestScore: highestScore.toFixed(1),
              totalQuestions
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student exams:', error);
        toast.error('Failed to load your exam results');
        setLoading(false);
      }
    };

    fetchStudentExams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg p-6 mb-6 border border-gray-200/30 dark:border-gray-700/30">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Your Performance</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name || 'Student'}! Here's how you've been doing.
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg p-5 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExams}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50/20 to-blue-100/10 dark:from-blue-900/20 dark:to-blue-800/10 text-blue-600 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg p-5 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Average Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-50/20 to-green-100/10 dark:from-green-900/20 dark:to-green-800/10 text-green-600 dark:text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg p-5 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Highest Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highestScore}%</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-50/20 to-yellow-100/10 dark:from-yellow-900/20 dark:to-yellow-800/10 text-yellow-600 dark:text-yellow-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg p-5 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Questions Answered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuestions}</p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50/20 to-indigo-100/10 dark:from-indigo-900/20 dark:to-indigo-800/10 text-indigo-600 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exam Results */}
      <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50/30 to-gray-100/20 dark:from-gray-700/30 dark:to-gray-800/20 px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
          <h2 className="font-medium text-gray-800 dark:text-white">Your Exam Results</h2>
        </div>
        
        {examResults.length > 0 ? (
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
                {examResults.map((result) => {
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
      </div>
    </div>
  );
};

export default StudentLeaderboard; 