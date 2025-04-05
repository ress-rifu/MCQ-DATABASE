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
  const verifyAccess = async () => {
    try {
      if (!exam) return;

      // Validate input based on access type
      if (exam.access_type === 'passcode' && !passcode.trim()) {
        toast.error('Please enter the passcode');
        return;
      } else if (exam.access_type === 'identifier_list' && !identifier.trim()) {
        toast.error('Please enter your identifier');
        return;
      } else if (exam.access_type === 'email_list' && !identifier.trim()) {
        toast.error('Please enter your email address');
        return;
      }

      // Verify access based on access type
      const payload = {};

      if (exam.access_type === 'passcode') {
        payload.passcode = passcode;
      } else if (exam.access_type === 'identifier_list' || exam.access_type === 'email_list') {
        payload.identifier = identifier;
      }

      const response = await axios.post(
        `${API_URL}/api/exams/${id}/verify-access`,
        payload,
        { headers: getAuthHeader() }
      );

      if (response.data.access_granted) {
        setAccessGranted(true);
        setShowAccessForm(false);
        toast.success('Access granted. Starting exam...');
      } else {
        toast.error(response.data.message || 'Access denied');
      }
    } catch (error) {
      console.error('Error verifying access:', error);
      toast.error(error.response?.data?.message || 'Failed to verify access. Please try again.');
    }
  };

  // Start the exam when access is granted
  useEffect(() => {
    if (accessGranted && exam && !attempt) {
      const startExam = async () => {
        try {
          const response = await axios.post(
            `${API_URL}/api/exams/${id}/start`,
            { identifier },
            { headers: getAuthHeader() }
          );

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
          console.error('Error starting exam:', error);
          toast.error('Failed to start exam. Please try again.');
        }
      };

      startExam();
    }
  }, [accessGranted, exam, attempt, id, identifier, questions]);

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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => navigate('/exams')}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Warning: </strong>
          <span className="block sm:inline">Exam not found.</span>
        </div>
        <button
          onClick={() => navigate('/exams')}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  // Show access verification form if needed
  if (showAccessForm) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4">{exam.title}</h2>
          <div className="mb-6">
            <p className="text-gray-700">
              {exam.access_type === 'passcode' ? (
                'This exam requires a passcode to access.'
              ) : exam.access_type === 'identifier_list' ? (
                'This exam requires a valid identifier to access.'
              ) : (
                'This exam requires a valid email address to access.'
              )}
            </p>
          </div>

          {exam.access_type === 'passcode' ? (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passcode">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="identifier">
                {exam.identifier_prompt || (exam.access_type === 'email_list' ? 'Email Address' : 'Identifier')}
              </label>
              <input
                id="identifier"
                type={exam.access_type === 'email_list' ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={verifyAccess}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Start Exam
            </button>
            <button
              onClick={() => navigate('/exams')}
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            >
              Cancel
            </button>
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">{exam.title} - Results</h1>
          </div>

          <div className="p-6">
            {/* Conclusion Text */}
            {exam.conclusion_text && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{exam.conclusion_text}</p>
              </div>
            )}

            {/* Score - only show if enabled in exam settings */}
            {exam.show_score && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Your Score</h2>
                <div className="flex items-center">
                  <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {results.score} / {exam.total_marks}
                  </div>
                  <div className="ml-4 bg-gray-200 h-4 w-60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{width: `${Math.max(percentage, 5)}%`}}
                    ></div>
                  </div>
                  <div className="ml-2 text-lg font-medium">{percentage.toFixed(1)}%</div>
                </div>

                {/* Custom pass/fail message - only show if enabled */}
                {exam.show_custom_result_message && (
                  <div className={`mt-3 p-3 rounded-lg ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {passed ? exam.pass_message || 'Congratulations! You passed the exam.' : exam.fail_message || 'You did not pass the exam.'}
                  </div>
                )}
              </div>
            )}

            {/* Test Outline - only show if enabled in exam settings */}
            {exam.show_test_outline && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Question Review</h2>
                {questions.map((question, index) => {
                  const userResponse = responses[question.id];
                  const isCorrect = userResponse === question.answer;

                  return (
                    <div
                      key={question.id}
                      className={`p-4 mb-3 rounded-lg border ${
                        userResponse === null ? 'border-gray-300 bg-gray-50' :
                        isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">Question {index + 1}</h3>
                        {/* Only show correct/incorrect indicator if enabled */}
                        {userResponse !== null && exam.show_correct_incorrect && (
                          <div className={`px-2 py-1 rounded text-sm ${
                            isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </div>
                        )}
                      </div>

                      <div className="mt-2">{question.ques}</div>

                      {/* Show correct answer only if enabled in exam settings */}
                      {exam.show_correct_answer && (
                        <div className="mt-2">
                          <div className="text-sm font-medium">Your answer: {userResponse || 'Not answered'}</div>
                          <div className="text-sm font-medium text-green-700">Correct answer: {question.answer}</div>
                        </div>
                      )}

                      {/* Show explanation only if enabled in exam settings */}
                      {exam.show_explanation && question.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <div className="text-sm font-medium">Explanation:</div>
                          <div className="text-sm">{question.explanation}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => navigate('/exams')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Exams
              </button>

              {/* Provide option to retake if allowed based on attempt limit settings */}
              {(exam.attempt_limit_type === 'unlimited' ||
                (exam.attempt_limit_type === 'limited' &&
                 results.attempt_number < exam.max_attempts)) && (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Take Again {exam.attempt_limit_type === 'limited' &&
                    `(${exam.max_attempts - results.attempt_number} attempts remaining)`}
                </button>
              )}
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{exam.title}</h1>

        {/* Timer display */}
        {timeRemaining !== null && (
          <div className={`font-mono text-xl font-bold ${timeRemaining < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
            Time: {formatTimeRemaining()}
          </div>
        )}
      </div>

      {/* Introduction */}
      {exam.introduction && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="prose max-w-none">
            {exam.introduction}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Pagination header for one-per-page mode */}
        {exam.pagination_type === 'one_per_page' && (
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className={`px-3 py-1 rounded ${
                  currentPage === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Previous
              </button>

              <div className="font-medium">
                Question {currentPage + 1} of {totalPages}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages - 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="p-4">
          {displayQuestions.map((question, index) => (
            <div key={question.id} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-lg mb-3">
                {exam.pagination_type === 'one_per_page' ? 'Question' : `Question ${index + 1}`}
              </h3>

              <div className="mb-4">{question.ques}</div>

              {/* Question Image if available */}
              {question.ques_img && (
                <div className="mb-4">
                  <img
                    src={question.ques_img}
                    alt="Question"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionText = question[`option_${option.toLowerCase()}`];
                  const optionImg = question[`option_${option.toLowerCase()}_img`];

                  if (!optionText && !optionImg) return null;

                  return (
                    <div key={option} className="flex items-start">
                      <input
                        type="radio"
                        id={`question_${question.id}_option_${option}`}
                        name={`question_${question.id}`}
                        value={option}
                        checked={responses[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor={`question_${question.id}_option_${option}`}
                        className="ml-2 block"
                      >
                        <div className="font-medium">{option}.</div>
                        {optionText && <div>{optionText}</div>}
                        {optionImg && (
                          <img
                            src={optionImg}
                            alt={`Option ${option}`}
                            className="mt-1 max-w-full h-auto rounded-lg"
                          />
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with navigation and submit */}
      <div className="mt-6 flex justify-between">
        {exam.pagination_type === 'one_per_page' ? (
          <div className="w-full flex justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded ${
                currentPage === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>

            {currentPage === totalPages - 1 ? (
              <button
                onClick={submitExam}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={handleNextPage}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Next
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={submitExam}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
};

export default TakeExam;