import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL, getAuthHeader } from '../apiConfig';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Exam data and state
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [responses, setResponses] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(null);
  const timerRef = useRef(null);

  // Access verification
  const [showAccessForm, setShowAccessForm] = useState(false);

  // Load exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/exams/${id}`, {
          headers: getAuthHeader()
        });

        setExam(response.data);
        setQuestions(response.data.questions);

        // Check if access verification is needed
        if (response.data.access_type !== 'anyone') {
          setShowAccessForm(true);
        } else {
          setAccessGranted(true);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        setError('Failed to load exam. Please try again.');
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  // Function to verify access
  const verifyAccess = async (e) => {
    e.preventDefault();
    
    if (passwordRef.current?.value) {
      const loadingToast = toast.loading('Verifying access...');
      
      try {
        const response = await axios.post(
          `${API_URL}/api/exams/${id}/verify-access`,
          {
            password: passwordRef.current.value,
            identifier: identifier || user?.email || ''
          },
          { headers: getAuthHeader() }
        );
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.data.access_granted) {
          setAccessGranted(true);
          setShowAccessForm(false);
          toast.success('Access granted. Starting exam...');
        } else {
          toast.error('Incorrect password. Please try again.');
        }
      } catch (error) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        console.error('Error verifying access:', error);
        
        // Show more detailed error message
        if (error.response) {
          toast.error(error.response.data?.message || `Error ${error.response.status}: Failed to verify access`);
        } else if (error.request) {
          toast.error('No response from server. Please check your internet connection.');
        } else {
          toast.error('Failed to verify access. Please try again.');
        }
      }
    } else {
      toast.error('Please enter the exam password');
    }
  };

  // Start the exam when access is granted
  useEffect(() => {
    if (accessGranted && exam && !attempt) {
      const startExam = async () => {
        try {
          // Show loading toast
          const loadingToast = toast.loading('Starting exam...');
          
          try {
            const response = await axios.post(
              `${API_URL}/api/exams/${id}/start`,
              { identifier: identifier || user?.email || '' },
              { headers: getAuthHeader() }
            );

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            setAttempt(response.data);

            // Initialize responses
            const initialResponses = {};
            questions.forEach(q => {
              initialResponses[q.id] = null;
            });
            setResponses(initialResponses);

            // Setup timer if time is limited
            if (exam.time_limit_type === 'specified') {
              const durationInSeconds = exam.duration_minutes * 60;
              setTimeRemaining(durationInSeconds);
            }
          } catch (error) {
            // Dismiss loading toast
            toast.dismiss(loadingToast);
            
            console.error('Error starting exam:', error);
            
            // Show more detailed error message
            if (error.response) {
              toast.error(error.response.data?.message || `Error ${error.response.status}: Failed to start exam`);
            } else if (error.request) {
              toast.error('No response from server. Please check your internet connection.');
            } else {
              toast.error('Failed to start exam. Please try again.');
            }
            
            // Reset access granted to show the form again
            setAccessGranted(false);
            setShowAccessForm(true);
          }
        } catch (error) {
          console.error('Unexpected error in startExam:', error);
          toast.error('An unexpected error occurred. Please try again.');
          setAccessGranted(false);
          setShowAccessForm(true);
        }
      };

      startExam();
    }
  }, [accessGranted, exam, attempt, id, identifier, questions, user]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [timeRemaining, submitted]);

  // Format time remaining as minutes:seconds
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return '';

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerChange = async (questionId, option) => {
    if (submitted) return;

    // Check if answer can be changed
    if (
      !exam.can_change_answer &&
      responses[questionId] !== null &&
      responses[questionId] !== undefined
    ) {
      toast.error('Answers cannot be changed for this exam');
      return;
    }

    // Check if blank answers are allowed
    if (option === null && !exam.allow_blank_answers) {
      toast.error('Blank answers are not allowed for this exam');
      return;
    }

    setResponses(prev => ({ ...prev, [questionId]: option }));

    // Submit the response to the server
    try {
      await axios.post(
        `${API_URL}/api/exams/${id}/response`,
        {
          attempt_id: attempt.id,
          question_id: questionId,
          selected_option: option
        },
        { headers: getAuthHeader() }
      );

      toast.success('Answer saved');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to save your answer. Please try again.');
    }
  };

  // Handle form submission
  const submitExam = async () => {
    // Check if blank answers are allowed
    if (!exam.allow_blank_answers) {
      const unanswered = Object.values(responses).filter(r => r === null || r === undefined).length;

      if (unanswered > 0) {
        const confirm = window.confirm(
          `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`
        );

        if (!confirm) return;
      }
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/exams/${id}/submit`,
        {},
        { headers: getAuthHeader() }
      );

      setSubmitted(true);
      setResults(response.data);
      clearInterval(timerRef.current);

      // Calculate percentage score
      const percentage = (response.data.score / exam.total_marks) * 100;
      const passed = percentage >= exam.passing_score;

      if (exam.show_custom_result_message) {
        if (passed) {
          toast.success(exam.pass_message || 'Congratulations! You passed the exam.');
        } else {
          toast.error(exam.fail_message || 'You did not pass the exam. Please try again.');
        }
      } else {
        toast.success('Exam submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam. Please try again.');
    }
  };

  // Navigation for pagination
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(questions.length - 1, prev + 1));
  };

  // Apply browser restrictions
  useEffect(() => {
    if (!exam || !accessGranted) return;

    // Right-click context menu
    const handleContextMenu = (e) => {
      if (exam.disable_right_click) {
        e.preventDefault();
        toast.error('Right-click is disabled for this exam.');
        return false;
      }
    };

    // Copy/paste functionality
    const handleKeyDown = (e) => {
      // Disable copy/paste (Ctrl+C, Ctrl+V, Ctrl+X)
      if (exam.disable_copy_paste &&
          (e.ctrlKey || e.metaKey) &&
          (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        toast.error('Copy and paste are disabled for this exam.');
        return false;
      }
    };

    // Prevent printing
    const handleBeforePrint = (e) => {
      if (exam.disable_printing) {
        e.preventDefault();
        toast.error('Printing is disabled for this exam.');
        return false;
      }
    };

    // Prevent copy/paste via mouse
    const handleCopy = (e) => {
      if (exam.disable_copy_paste) {
        e.preventDefault();
        toast.error('Copy and paste are disabled for this exam.');
        return false;
      }
    };

    const handleCut = (e) => {
      if (exam.disable_copy_paste) {
        e.preventDefault();
        toast.error('Cut operation is disabled for this exam.');
        return false;
      }
    };

    const handlePaste = (e) => {
      if (exam.disable_copy_paste) {
        e.preventDefault();
        toast.error('Paste operation is disabled for this exam.');
        return false;
      }
    };

    // Apply restrictions
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    // Add META tags for translation
    if (exam.disable_translate) {
      const metaTranslate = document.createElement('meta');
      metaTranslate.name = 'google';
      metaTranslate.content = 'notranslate';
      document.head.appendChild(metaTranslate);

      // Also add a class to the body to disable browser translation
      document.body.classList.add('notranslate');
    }

    // Add autocomplete and spellcheck attributes to form elements
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (exam.disable_autocomplete) {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
      }

      if (exam.disable_spellcheck) {
        input.setAttribute('spellcheck', 'false');
      }
    });

    // Disable browser translation if needed
    if (exam.disable_translate) {
      const style = document.createElement('style');
      style.id = 'disable-translation-styles';
      style.textContent = `
        .skiptranslate, #google_translate_element { display: none !important; }
        body { top: 0 !important; }
      `;
      document.head.appendChild(style);
    }

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);

      // Remove META tags and classes
      if (exam.disable_translate) {
        const metaTranslate = document.querySelector('meta[name="google"][content="notranslate"]');
        if (metaTranslate) document.head.removeChild(metaTranslate);
        document.body.classList.remove('notranslate');

        const style = document.getElementById('disable-translation-styles');
        if (style) document.head.removeChild(style);
      }
    };
  }, [exam, accessGranted]);

  // If loading or error occurred
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600">Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-100 text-center">
            <div className="rounded-full bg-red-100 h-12 w-12 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Error Loading Exam</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/exams')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-100 text-center">
            <div className="rounded-full bg-yellow-100 h-12 w-12 flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Exam Not Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              The exam you're looking for doesn't exist or you may not have permission to access it.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/exams')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access verification form if needed
  if (showAccessForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Exam Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please verify your access to continue to the exam
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-100">
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {exam.description && exam.description.length > 150 
                  ? exam.description.substring(0, 150) + '...' 
                  : exam.description}
              </p>
            </div>
            
            <div className="space-y-6">
              {exam.access_type === 'passcode' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">
                      Passcode
                    </label>
                    <div className="text-xs text-gray-500">Required to access this exam</div>
                  </div>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="passcode"
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="block w-full border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 rounded-md text-sm"
                      placeholder="Enter the passcode"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                      {exam.identifier_prompt || (exam.access_type === 'email_list' ? 'Email Address' : 'Identifier')}
                    </label>
                    <div className="text-xs text-gray-500">Required to access this exam</div>
                  </div>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="identifier"
                      type={exam.access_type === 'email_list' ? 'email' : 'text'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full border-gray-300 pl-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-blue-500 rounded-md text-sm"
                      placeholder={exam.access_type === 'email_list' ? "Enter your email address" : "Enter your identifier"}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-4">
                <button
                  onClick={() => navigate('/exams')}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAccess}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Start Exam
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">
                  {exam.access_type === 'passcode' ? 'Need the passcode?' : 'Having trouble?'}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Please contact your instructor or administrator for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam results view
  if (submitted) {
    // Calculate percentage
    const percentage = (results.score / exam.total_marks) * 100;
    const passed = percentage >= exam.passing_score;

    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-500 mt-1">Exam Results</p>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium 
                ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {passed ? 'Passed' : 'Failed'}
              </div>
            </div>

            <div className="px-6 py-6 sm:p-8">
              {/* Conclusion Text */}
              {exam.conclusion_text && (
                <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-100">
                  <h2 className="text-base font-medium text-gray-900 mb-2">Conclusion</h2>
                  <p className="text-gray-700">{exam.conclusion_text}</p>
                </div>
              )}

              {/* Score - only show if enabled in exam settings */}
              {exam.show_score && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Your Score</h2>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center mb-5">
                    <div className="flex items-center mb-4 sm:mb-0 sm:mr-8">
                      <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {results.score}
                      </div>
                      <div className="mx-2 text-xl text-gray-400">/</div>
                      <div className="text-xl font-medium text-gray-600">
                        {exam.total_marks}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex items-center">
                      <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{width: `${Math.max(percentage, 5)}%`}}
                        ></div>
                      </div>
                      <div className="ml-3 text-sm font-medium text-gray-700 min-w-[45px]">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Custom pass/fail message - only show if enabled */}
                  {exam.show_custom_result_message && (
                    <div className={`p-4 rounded-lg border ${
                      passed 
                        ? 'bg-green-50 border-green-100 text-green-800' 
                        : 'bg-red-50 border-red-100 text-red-800'
                      }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {passed ? (
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">
                            {passed 
                              ? exam.pass_message || 'Congratulations! You passed the exam.' 
                              : exam.fail_message || 'You did not pass the exam.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Test Outline - only show if enabled in exam settings */}
              {exam.show_test_outline && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Question Review</h2>
                  
                  <div className="space-y-4">
                    {questions.map((question, index) => {
                      const userResponse = responses[question.id];
                      const isCorrect = userResponse === question.answer;
                      const isAnswered = userResponse !== null && userResponse !== undefined;

                      return (
                        <div
                          key={question.id}
                          className="rounded-lg border overflow-hidden bg-white"
                        >
                          <div className={`px-5 py-3 border-b flex justify-between items-center
                            ${!isAnswered ? 'bg-gray-50 border-gray-100' :
                             isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
                          >
                            <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                            
                            {/* Only show correct/incorrect indicator if enabled */}
                            {isAnswered && exam.show_correct_incorrect && (
                              <div className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                                ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                              >
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            <div className="mb-4 text-gray-900">{question.ques}</div>

                            {/* Display options in a 2x2 grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                              {['A', 'B', 'C', 'D'].map(option => {
                                const optionText = question[`option_${option.toLowerCase()}`];
                                if (!optionText) return null;
                                
                                const isUserAnswer = userResponse === option;
                                const isCorrectAnswer = question.answer === option;
                                
                                return (
                                  <div 
                                    key={option}
                                    className={`p-3 rounded-lg border text-sm
                                      ${isUserAnswer && isCorrectAnswer ? 'bg-green-50 border-green-300 text-green-900' : 
                                        isUserAnswer ? 'bg-red-50 border-red-300 text-red-900' :
                                        isCorrectAnswer && exam.show_correct_answer ? 'bg-green-50 border-green-300 text-green-900' :
                                        'bg-gray-50 border-gray-200 text-gray-700'}`}
                                  >
                                    <div className="font-medium">{option}.</div>
                                    <div>{optionText}</div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Show correct answer & your answer only if enabled */}
                            {exam.show_correct_answer && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="font-medium text-gray-700">Your answer:</div>
                                  <div className="text-gray-900">{userResponse || 'Not answered'}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <div className="font-medium text-green-700">Correct answer:</div>
                                  <div className="text-green-900">{question.answer}</div>
                                </div>
                              </div>
                            )}

                            {/* Show explanation only if enabled in exam settings */}
                            {exam.show_explanation && question.explanation && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-sm font-medium text-blue-700">Explanation:</div>
                                <div className="text-sm text-blue-900 mt-1">{question.explanation}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  onClick={() => navigate('/exams')}
                  className="flex justify-center items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Exams
                </button>

                {/* Provide option to retake if allowed based on attempt limit settings */}
                {(exam.attempt_limit_type === 'unlimited' ||
                  (exam.attempt_limit_type === 'limited' &&
                  results.attempt_number < exam.max_attempts)) && (
                  <button
                    onClick={() => window.location.reload()}
                    className="flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Take Again {exam.attempt_limit_type === 'limited' &&
                      `(${exam.max_attempts - results.attempt_number} ${exam.max_attempts - results.attempt_number === 1 ? 'attempt' : 'attempts'} remaining)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Taking the exam view
  // Determine which questions to show based on pagination settings
  const displayQuestions = exam.pagination_type === 'one_per_page'
    ? (questions.length > 0 ? [questions[currentPage]] : [])
    : questions;

  const totalPages = questions.length;
  const progress = Math.round(((currentPage + 1) / totalPages) * 100);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with timer and controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg font-medium text-gray-900">{exam.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className={`flex items-center px-3 py-1.5 rounded-lg ${timeRemaining < 300 ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{formatTimeRemaining()}</span>
              </div>
              
              {/* Submit button */}
              <button
                onClick={submitExam}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content - questions */}
          <div className="lg:flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              {/* Question number and navigation */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Question {currentPage + 1} of {totalPages}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className={`p-2 rounded-lg ${currentPage === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    className={`p-2 rounded-lg ${currentPage === totalPages - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Question content */}
              <div className="prose max-w-none mb-6">
                <div className="text-gray-800">
                  {displayQuestions[0]?.ques}
                </div>
              </div>
              
              {/* Answer options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionText = displayQuestions[0][`option_${option.toLowerCase()}`];
                  const optionImg = displayQuestions[0][`option_${option.toLowerCase()}_img`];

                  if (!optionText && !optionImg) return null;

                  return (
                    <div
                      key={option}
                      onClick={() => handleAnswerChange(displayQuestions[0].id, option)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        responses[displayQuestions[0].id] === option
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full border ${
                          responses[displayQuestions[0].id] === option
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {responses[displayQuestions[0].id] === option && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                              <circle cx="8" cy="8" r="4" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <LaTeXRenderer content={optionText} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Sidebar - question navigation */}
          <div className="lg:w-72">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`w-full h-10 flex items-center justify-center rounded-md text-sm font-medium
                      ${currentPage === idx ? 'bg-indigo-600 text-white' : 
                      responses[questions[idx].id] !== undefined ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></div>
                  <span>Current Question</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-100 mr-2"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-gray-100 mr-2"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;