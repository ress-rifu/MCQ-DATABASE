import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL, getAuthHeader } from '../apiConfig';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LaTeXRenderer from '../components/LaTeXRenderer';

const ExamLeaderboard = () => {
  const { id } = useParams();
  
  // State
  const [exam, setExam] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch exam and leaderboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exam details
        const examResponse = await axios.get(`${API_URL}/api/exams/${id}`, {
          headers: getAuthHeader()
        });
        
        setExam(examResponse.data);
        
        // Fetch leaderboard
        const leaderboardResponse = await axios.get(`${API_URL}/api/exams/${id}/leaderboard`, {
          headers: getAuthHeader()
        });
        
        setLeaderboard(leaderboardResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        toast.error('Failed to load leaderboard');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Format duration
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInSeconds = Math.floor((end - start) / 1000);
    
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">{exam?.title}</h1>
          <p className="text-indigo-100 mt-1">
            {exam?.class_name && `${exam.class_name} • `}
            {exam?.subject_name && `${exam.subject_name}`}
          </p>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Marks</p>
              <p className="text-lg font-semibold">{exam?.total_marks}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Questions</p>
              <p className="text-lg font-semibold">{exam?.questions?.length || 0}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="text-lg font-semibold">{exam?.duration_minutes} minutes</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to="/exams"
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Exams
            </Link>
          </div>
        </div>
      </div>
      
      {leaderboard.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Leaderboard</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry, index) => {
                  // Calculate percentage
                  const percentage = exam?.total_marks 
                    ? Math.round((entry.score / exam.total_marks) * 100) 
                    : 0;
                  
                  // Determine rank badge
                  let rankBadge = null;
                  if (index === 0) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full font-bold">1</span>
                    );
                  } else if (index === 1) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full font-bold">2</span>
                    );
                  } else if (index === 2) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-800 rounded-full font-bold">3</span>
                    );
                  }
                  
                  return (
                    <tr key={entry.id} className={index < 3 ? 'bg-gray-50' : 'hover:bg-gray-50 transition-colors'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rankBadge || <span className="text-gray-500 font-medium">#{index + 1}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.user_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.score}/{exam?.total_marks}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            percentage >= 80 ? 'text-green-600' :
                            percentage >= 60 ? 'text-blue-600' :
                            percentage >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {percentage}%
                          </span>
                          <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                percentage >= 80 ? 'bg-green-600' :
                                percentage >= 60 ? 'bg-blue-600' :
                                percentage >= 40 ? 'bg-yellow-400' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(entry.start_time, entry.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.end_time).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="bg-gray-50 inline-flex rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No results available</h3>
          <p className="text-gray-500">No one has completed this exam yet. Check back later for results.</p>
        </div>
      )}
    </div>
  );
};

export default ExamLeaderboard; 