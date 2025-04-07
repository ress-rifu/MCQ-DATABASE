import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import LaTeXRenderer from '../components/LaTeXRenderer';

const ExamPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  // Connect to socket for real-time updates
  useEffect(() => {
    if (examStarted && !socket) {
      try {
        const newSocket = io(API_BASE_URL, {
          query: { examId: id },
          transports: ['websocket', 'polling'],
          timeout: 10000
        });

        newSocket.on('connect', () => {
          console.log('Socket connected successfully');
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setConnectionError(true);
        });

        newSocket.on('questionUpdate', (updatedQuestion) => {
          setQuestions(prev => prev.map(q =>
            q.id === updatedQuestion.id ? updatedQuestion : q
          ));
          toast.info('A question has been updated!');
        });

        setSocket(newSocket);

        return () => {
          if (newSocket) newSocket.disconnect();
        };
      } catch (error) {
        console.error('Error setting up socket connection:', error);
        setConnectionError(true);
      }
    }
  }, [examStarted, id, socket]);

  // Fetch exam details
  useEffect(() => {
    const fetchExam = async () => {
      try {
        console.log('Fetching exam details for ID:', id);
        const response = await axios.get(`${API_BASE_URL}/api/exams/${id}`, {
          headers: getAuthHeader()
        });

        console.log('Exam data received:', response.data);
        setExam(response.data);

        // Check if exam is active
        const now = new Date();
        const startDate = new Date(response.data.start_datetime);
        const endDate = new Date(response.data.end_datetime);

        if (now < startDate) {
          toast.error('This exam has not started yet');
          navigate('/exams');
          return;
        } else if (now > endDate) {
          toast.error('This exam has ended');
          navigate('/exams');
          return;
        }

        // Check if user has an attempt already
        console.log('Checking for existing attempt...');
        const attemptResponse = await axios.get(`${API_BASE_URL}/api/exams/${id}/attempt`, {
          headers: getAuthHeader()
        });

        if (attemptResponse.data) {
          // User has an attempt
          console.log('Found existing attempt:', attemptResponse.data);
          const attempt = attemptResponse.data;
          setAttemptId(attempt.id);

          if (attempt.completed) {
            console.log('Attempt is already completed');
            setExamFinished(true);
            setExamStarted(true);
          } else {
            // Resume attempt
            console.log('Resuming incomplete attempt');
            setExamStarted(true);

            // Make sure we have questions
            if (response.data.questions && response.data.questions.length > 0) {
              console.log('Setting questions:', response.data.questions.length, 'questions found');
              setQuestions(response.data.questions);
            } else {
              console.warn('No questions found in exam data');
              toast.error('This exam has no questions');
            }

            // Load responses
            if (attempt.responses && attempt.responses.length > 0) {
              console.log('Loading saved responses:', attempt.responses.length, 'responses found');
              const responsesObj = {};
              attempt.responses.forEach(resp => {
                responsesObj[resp.question_id] = resp.selected_option;
              });
              setResponses(responsesObj);
            }

            // Calculate time remaining
            const endTime = new Date(attempt.start_time);
            endTime.setMinutes(endTime.getMinutes() + response.data.duration_minutes);
            const remaining = Math.max(0, endTime - now);
            setTimeRemaining(Math.floor(remaining / 1000));
            console.log('Time remaining:', Math.floor(remaining / 1000), 'seconds');
          }
        } else {
          // No attempt yet, show questions but don't start timer
          console.log('No existing attempt found');
          if (response.data.questions && response.data.questions.length > 0) {
            console.log('Setting questions:', response.data.questions.length, 'questions found');
            setQuestions(response.data.questions);
          } else {
            console.warn('No questions found in exam data');
            toast.error('This exam has no questions');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        toast.error('Failed to load exam: ' + (error.response?.data?.message || error.message));
        navigate('/exams');
      }
    };

    fetchExam();
  }, [id, navigate]);

  // Timer logic
  useEffect(() => {
    if (examStarted && !examFinished && timeRemaining !== null) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [examStarted, examFinished, timeRemaining]);

  // Start the exam
  const startExam = async () => {
    try {
      console.log('Starting exam:', id);
      const response = await axios.post(`${API_BASE_URL}/api/exams/${id}/start`, {}, {
        headers: getAuthHeader()
      });

      console.log('Exam started successfully:', response.data);
      setAttemptId(response.data.id);
      setExamStarted(true);

      // Start timer
      setTimeRemaining(exam.duration_minutes * 60);

      toast.success('Exam started!');
    } catch (error) {
      console.error('Error starting exam:', error);
      toast.error('Failed to start exam: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle answer selection
  const handleAnswerSelect = async (questionId, option) => {
    console.log('Selecting answer:', questionId, option);

    // Update local state
    setResponses(prev => ({
      ...prev,
      [questionId]: option
    }));

    // Send to server
    try {
      const response = await axios.post(`${API_BASE_URL}/api/exams/${id}/response`, {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: option
      }, {
        headers: getAuthHeader()
      });

      console.log('Response saved successfully:', response.data);
    } catch (error) {
      console.error('Error saving response:', error);

      // Revert local state update if server save failed
      setResponses(prev => {
        const newResponses = { ...prev };
        if (prev[questionId] === option) {
          delete newResponses[questionId];
        }
        return newResponses;
      });

      toast.error('Failed to save your answer: ' + (error.response?.data?.message || error.message));
    }
  };

  // Navigation between questions
  const navigateQuestion = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (typeof direction === 'number' && direction >= 0 && direction < questions.length) {
      setCurrentQuestionIndex(direction);
    }
  };

  // Submit the exam
  const submitExam = useCallback(async () => {
    if (!examStarted || examFinished) return;

    try {
      console.log('Submitting exam:', id, 'Attempt ID:', attemptId);
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/exams/${id}/submit`, {
        attempt_id: attemptId
      }, {
        headers: getAuthHeader()
      });

      console.log('Exam submitted successfully:', response.data);
      setExamFinished(true);
      toast.success('Exam submitted successfully!');

      // Redirect to results page
      navigate(`/exams/${id}/leaderboard`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [examStarted, examFinished, id, attemptId, navigate]);

  // Format remaining time display
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--:--';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // This checks if the user should be able to take this exam
  const canAccessExam = () => {
    // Students should be able to take exams
    if (user?.role === 'student') {
      return true;
    }

    // Teachers can view/take their own exams
    if (user?.role === 'teacher' && exam?.createdBy === user?._id) {
      return true;
    }

    // Admins can access all exams
    if (user?.role === 'admin') {
      return true;
    }

    return false;
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Exam start screen
  if (!examStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
            <p className="text-blue-100 mt-1">
              {exam?.class_name && `${exam.class_name} • `}
              {exam?.subject_name && `${exam.subject_name}`}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="text-lg font-semibold">{exam?.duration_minutes} minutes</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Questions</p>
                <p className="text-lg font-semibold">{questions.length}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Marks</p>
                <p className="text-lg font-semibold">{exam?.total_marks}</p>
              </div>
            </div>

            {exam?.syllabus && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Syllabus</h3>
                <div
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <LaTeXRenderer content={exam.syllabus || ''} />
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    You will have {exam?.duration_minutes} minutes to complete the exam.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    The exam will be automatically submitted when the time is up.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    You can navigate between questions using the Next and Previous buttons or the question navigator.
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Click the Submit button when you have finished the exam.
                  </li>
                  {exam?.shuffle_questions && (
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Questions are randomized for each student.
                    </li>
                  )}
                  {!exam?.can_change_answer && (
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Important:</span> Once an answer is selected, it cannot be changed.
                    </li>
                  )}
                  {exam?.negative_marking && (
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Warning:</span> Incorrect answers will result in a deduction of {exam.negative_percentage}% of the marks.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/exams')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back to Exams
              </button>

              <button
                onClick={startExam}
                className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam finished screen
  if (examFinished) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 px-6 py-4 text-center">
            <h1 className="text-2xl font-bold text-white">Exam Completed</h1>
            <p className="text-green-100 mt-1">Your responses have been submitted successfully</p>
          </div>

          <div className="p-8 text-center">
            <div className="mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold mt-4">Thank you for completing the exam</h2>
              <p className="text-gray-600 mt-2">Your responses have been recorded and will be evaluated.</p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate(`/exams/${id}/leaderboard`)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                View Leaderboard
              </button>

              <button
                onClick={() => navigate('/exams')}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414 0l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active exam screen
  const currentQuestion = questions[currentQuestionIndex];
  const timeIsLow = timeRemaining < 300; // Less than 5 minutes remaining

  // Add this check in the rendering logic
  if (!canAccessExam()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5 py-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-2xl p-8 backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg border border-gray-200/30 dark:border-gray-700/30">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-5">Access Denied</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You do not have permission to access this exam.
          </p>
          <Link
            to="/exams"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600/90 to-indigo-700/90 text-white rounded-lg hover:from-indigo-700/90 hover:to-indigo-800/90 transition-colors inline-flex items-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414 0l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Return to Exams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* Header with time and navigation */}
      <div className="backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg p-5 mb-5 flex flex-col sm:flex-row justify-between items-center border border-gray-200/30 dark:border-gray-700/30">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">{exam?.title}</h1>

        <div className="flex items-center space-x-4">
          <div className={`px-5 py-2.5 rounded-xl border shadow-inner ${timeIsLow ? 'bg-red-50/30 border-red-200/30 text-red-800' : 'bg-gradient-to-br from-gray-50/10 to-gray-100/5 dark:from-gray-700/20 dark:to-gray-800/10 border-gray-200/30 dark:border-gray-700/30'}`}>
            <span className="font-medium mr-2">Time:</span>
            <span className={`font-semibold ${timeIsLow ? 'text-red-600' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to submit the exam? This action cannot be undone.")) {
                submitExam();
              }
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600/90 to-green-700/90 text-white rounded-xl hover:from-green-700/90 hover:to-green-800/90 transition-colors flex items-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main content with question and answer options */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Question panel */}
        <div className="lg:flex-grow backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
          <div className="bg-gradient-to-r from-gray-50/30 to-gray-100/20 dark:from-gray-700/30 dark:to-gray-800/20 px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 flex justify-between items-center">
            <h2 className="font-medium text-gray-800 dark:text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <span className="text-sm px-4 py-1.5 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
              Marks: {currentQuestion?.marks || 1}
            </span>
          </div>

          <div className="p-6">
            <div
              className="mb-8 text-lg text-gray-800 dark:text-gray-200"
            >
              <LaTeXRenderer content={currentQuestion?.ques || ''} />
            </div>

            <div className="space-y-4 mb-8">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionKey = `option_${option.toLowerCase()}`;
                const isSelected = responses[currentQuestion?.id] === option;
                const optionContent = currentQuestion?.[optionKey];
                const canSelect = exam?.can_change_answer !== false || !responses[currentQuestion?.id];

                if (!optionContent) return null;

                return (
                  <div
                    key={option}
                    onClick={() => {
                      if (canSelect) {
                        handleAnswerSelect(currentQuestion.id, option);
                      }
                    }}
                    className={`p-5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/30 dark:bg-blue-900/20 border-blue-300/50 dark:border-blue-700/50 shadow-sm'
                        : 'hover:bg-gray-50/20 dark:hover:bg-gray-800/20 border-gray-200/30 dark:border-gray-700/30'
                    } ${canSelect ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 flex-shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white shadow-sm'
                          : 'bg-gradient-to-br from-gray-50/20 to-gray-100/10 dark:from-gray-700/30 dark:to-gray-800/20 text-gray-700 dark:text-gray-300 border border-gray-200/30 dark:border-gray-700/30 shadow-inner'
                      }`}>
                        {option}
                      </span>
                      <div
                        className="flex-1 text-gray-700 dark:text-gray-300"
                      >
                        <LaTeXRenderer content={optionContent || ''} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-8 border-t border-gray-200/30 dark:border-gray-700/30 pt-5">
              <button
                onClick={() => navigateQuestion('prev')}
                className={`px-5 py-2.5 flex items-center rounded-xl transition-colors ${
                  currentQuestionIndex === 0
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-br from-gray-50/20 to-gray-100/10 dark:from-gray-700/30 dark:to-gray-800/20 text-gray-700 dark:text-gray-300 hover:from-gray-100/20 hover:to-gray-200/10 dark:hover:from-gray-600/30 dark:hover:to-gray-700/20 border border-gray-200/30 dark:border-gray-700/30 shadow-sm'
                }`}
                disabled={currentQuestionIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </button>

              <button
                onClick={() => navigateQuestion('next')}
                className={`px-5 py-2.5 flex items-center rounded-xl transition-colors ${
                  currentQuestionIndex === questions.length - 1
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white hover:from-blue-700/90 hover:to-blue-800/90 shadow-sm'
                }`}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Question navigation panel */}
        <div className="lg:w-80 backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-lg overflow-hidden border border-gray-200/30 dark:border-gray-700/30">
          <div className="bg-gradient-to-r from-gray-50/30 to-gray-100/20 dark:from-gray-700/30 dark:to-gray-800/20 px-5 py-4 border-b border-gray-200/30 dark:border-gray-700/30">
            <h3 className="font-medium text-gray-800 dark:text-white">Navigation</h3>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, index) => {
                let bgColor = 'bg-gradient-to-br from-gray-50/20 to-gray-100/10 dark:from-gray-700/30 dark:to-gray-800/20 border border-gray-200/30 dark:border-gray-700/30 shadow-inner';
                let textColor = 'text-gray-700 dark:text-gray-300';

                if (responses[q.id]) {
                  bgColor = 'bg-gradient-to-r from-green-600/90 to-green-700/90 shadow-sm';
                  textColor = 'text-white';
                }

                if (index === currentQuestionIndex) {
                  bgColor = 'bg-gradient-to-r from-blue-600/90 to-blue-700/90 shadow-sm';
                  textColor = 'text-white';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateQuestion(index)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor} ${textColor} font-medium hover:opacity-90 transition-opacity`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 border-t border-gray-200/30 dark:border-gray-700/30 pt-5">
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-br from-gray-50/20 to-gray-100/10 dark:from-gray-700/30 dark:to-gray-800/20 rounded-md border border-gray-200/30 dark:border-gray-700/30 mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-600/90 to-green-700/90 rounded-md mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered</span>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-600/90 to-blue-700/90 rounded-md mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Current Question</span>
              </div>
            </div>

            <div className="mt-7 bg-gradient-to-br from-gray-50/10 to-gray-100/5 dark:from-gray-700/20 dark:to-gray-800/10 p-5 rounded-xl border border-gray-200/30 dark:border-gray-700/30 shadow-inner">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.keys(responses).length} / {questions.length}
                </p>
              </div>
              <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-600/90 to-green-700/90 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(Object.keys(responses).length / questions.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
                {Math.round((Object.keys(responses).length / questions.length) * 100)}% complete
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to submit the exam? This action cannot be undone.")) {
                  submitExam();
                }
              }}
              className="w-full mt-5 px-5 py-3 bg-gradient-to-r from-green-600/90 to-green-700/90 text-white rounded-xl hover:from-green-700/90 hover:to-green-800/90 transition-colors flex items-center justify-center shadow-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPortal;