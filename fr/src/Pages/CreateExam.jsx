import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import CautionModal from '../components/CautionModal';

// Log API URL for debugging
console.log('API_BASE_URL in CreateExam:', API_BASE_URL);
import SimpleRichTextEditor from '../components/SimpleRichTextEditor';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LaTeXRenderer from '../components/LaTeXRenderer';

// Import icons
import {
  FiInfo,
  FiSettings,
  FiList,
  FiUsers,
  FiEye,
  FiShield,
  FiCheckCircle,
  FiChevronLeft,
  FiSave,
  FiX,
  FiPlus,
  FiMinus,
  FiArrowUp,
  FiArrowDown,
  FiSearch,
  FiCalendar,
  FiClock,
  FiBookOpen
} from 'react-icons/fi';

const CreateExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [user, setUser] = useState(null);

  // Exam form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_datetime: new Date(),
    end_datetime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default 1 hour later
    negative_marking: false,
    negative_percentage: 0,
    shuffle_questions: false,
    can_change_answer: true,
    syllabus: '',
    duration_minutes: 60,
    total_marks: 0,
    course_id: '',
    chapters: [],

    // Basic Settings
    introduction: '',

    // Question Settings
    pagination_type: 'all', // 'all' or 'one_per_page'
    allow_blank_answers: true,

    // Review Settings
    conclusion_text: '',
    show_custom_result_message: false,
    pass_message: '',
    fail_message: '',
    passing_score: 60,
    show_score: true,
    show_test_outline: true,
    show_correct_incorrect: true,
    show_correct_answer: true,
    show_explanation: true,

    // Access Control
    access_type: 'anyone', // 'anyone', 'passcode', 'identifier_list', 'email_list'
    access_passcode: '',
    identifier_list: [],
    email_list: [],
    time_limit_type: 'specified', // 'unlimited' or 'specified'
    attempt_limit_type: 'unlimited', // 'unlimited' or 'limited'
    max_attempts: 1,
    identifier_prompt: 'Enter your name',

    // Browser Functionality
    disable_right_click: false,
    disable_copy_paste: false,
    disable_translate: false,
    disable_autocomplete: false,
    disable_spellcheck: false,
    disable_printing: false
  });

  // Curriculum state for dropdowns
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allChapters, setAllChapters] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);

  // Question bank state
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // State for loading data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // State for caution modal
  const [showCautionModal, setShowCautionModal] = useState(false);
  const [cautionsList, setCautionsList] = useState([]);

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Redirect students away from this page
      if (parsedUser.role === 'student') {
        toast.error('Students cannot create or edit exams');
        navigate('/exams');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch exam data if editing
  useEffect(() => {
    const fetchExamData = async () => {
      if (isEditing) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/exams/${id}`, {
            headers: getAuthHeader()
          });

          const examData = response.data;

          // Format dates
          examData.start_datetime = new Date(examData.start_datetime);
          examData.end_datetime = new Date(examData.end_datetime);

          // Extract chapter IDs
          const chapterIds = examData.chapters ? examData.chapters.map(ch => ch.id) : [];
          examData.chapters = chapterIds;

          // Ensure all form fields have default values
          const completeFormData = {
            ...formData, // Start with the default values
            ...examData,  // Override with the exam data
            // Ensure these fields are properly set
            start_datetime: new Date(examData.start_datetime),
            end_datetime: new Date(examData.end_datetime),
            chapters: examData.chapters || [],
            negative_marking: examData.negative_marking || false,
            negative_percentage: examData.negative_percentage || 0,
            shuffle_questions: examData.shuffle_questions || false,
            can_change_answer: examData.can_change_answer !== undefined ? examData.can_change_answer : true,
            disable_right_click: examData.disable_right_click || false,
            disable_copy_paste: examData.disable_copy_paste || false,
            disable_translate: examData.disable_translate || false,
            disable_autocomplete: examData.disable_autocomplete || false,
            disable_spellcheck: examData.disable_spellcheck || false,
            disable_printing: examData.disable_printing || false,
            show_custom_result_message: examData.show_custom_result_message || false,
            pass_message: examData.pass_message || '',
            fail_message: examData.fail_message || '',
            show_correct_answers: examData.show_correct_answers || false,
            show_score: examData.show_score !== undefined ? examData.show_score : true,
            show_percentage: examData.show_percentage !== undefined ? examData.show_percentage : true,
            show_pass_fail: examData.show_pass_fail !== undefined ? examData.show_pass_fail : true,
            passing_score: examData.passing_score || 40
          };

          console.log('Setting form data with complete values:', completeFormData);
          setFormData(completeFormData);
          // Set selected questions
          if (examData.questions && Array.isArray(examData.questions)) {
            setSelectedQuestions(examData.questions.map(q => ({
              ...q,
              marks: q.marks || 1,  // Ensure marks is set
              // Ensure these fields are present
              chapter_name: q.chapter_name || q.chapter || '',
              subject_name: q.subject_name || q.subject || '',
              class_name: q.class_name || q.classname || ''
            })));
          } else {
            console.warn('No questions found in exam data or questions is not an array');
            setSelectedQuestions([]);
          }
          setInitialDataLoaded(true);
        } catch (error) {
          console.error('Error fetching exam data:', error);

          // Log detailed error information
          if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
            toast.error(`Failed to load exam data: ${error.response.data.message || 'Unknown error'}`);
          } else if (error.request) {
            console.error('No response received:', error.request);
            toast.error('No response received from server. Please check your connection.');
          } else {
            console.error('Error setting up request:', error.message);
            toast.error(`Error: ${error.message}`);
          }

          // Navigate back to exams list after error
          setTimeout(() => {
            navigate('/exams');
          }, 3000);
        }
      } else {
        setInitialDataLoaded(true);
      }
    };

    fetchExamData();
  }, [id, isEditing]);

  // Fetch curriculum data for dropdowns
  useEffect(() => {
    const fetchCurriculumData = async () => {
      try {
        const [coursesRes, classesRes, subjectsRes, chaptersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/courses`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_BASE_URL}/api/curriculum/classes`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_BASE_URL}/api/curriculum/subjects`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_BASE_URL}/api/curriculum/chapters`, {
            headers: getAuthHeader()
          })
        ]);

        setCourses(coursesRes.data);
        setClasses(classesRes.data);
        setSubjects(subjectsRes.data);
        setAllChapters(chaptersRes.data);
      } catch (error) {
        console.error('Error fetching curriculum data:', error);
        toast.error('Failed to load curriculum data');
      }
    };

    fetchCurriculumData();
  }, []);

  // Update available chapters when course changes
  useEffect(() => {
    if (formData.course_id && courses.length > 0) {
      const fetchCourseContent = async () => {
        try {
          console.log('Fetching content for course ID:', formData.course_id);

          const response = await axios.get(`${API_BASE_URL}/api/courses/${formData.course_id}/content`, {
            headers: getAuthHeader()
          });

          console.log('Course content response:', response.data);

          // Filter for chapter content only
          const courseChapters = response.data
            .filter(item => item.chapter_id)
            .map(item => ({
              id: item.chapter_id,
              name: item.chapter_name,
              subject_name: item.subject_name,
              class_name: item.class_name
            }));

          console.log('Filtered course chapters:', courseChapters);

          setAvailableChapters(courseChapters);

          // If no chapters are available, show a message
          if (courseChapters.length === 0) {
            toast.error('No chapters found for this course. Please add chapters to the course first.');
          }
        } catch (error) {
          console.error('Error fetching course content:', error);
          console.error('Error details:', error.response?.data || error.message);
          toast.error('Failed to load course chapters');
          setAvailableChapters([]);
        }
      };

      fetchCourseContent();
    } else {
      setAvailableChapters([]);
    }
  }, [formData.course_id, courses]);

  // Filter subjects based on selected class
  useEffect(() => {
    if (selectedClass) {
      setFilteredSubjects(subjects.filter(s => s.class_id === parseInt(selectedClass)));
    } else {
      setFilteredSubjects(subjects);
    }
  }, [selectedClass, subjects]);

  // Filter chapters based on selected subject
  useEffect(() => {
    if (selectedSubject) {
      setFilteredChapters(allChapters.filter(c => c.subject_id === parseInt(selectedSubject)));
    } else if (selectedClass) {
      const subjectIds = subjects
        .filter(s => s.class_id === parseInt(selectedClass))
        .map(s => s.id);
      setFilteredChapters(allChapters.filter(c => subjectIds.includes(c.subject_id)));
    } else {
      setFilteredChapters(allChapters);
    }
  }, [selectedSubject, selectedClass, subjects, allChapters]);

  // Fetch topics when needed
  const fetchTopics = useCallback(async (chapterId) => {
    try {
      console.log('Fetching topics for chapter ID:', chapterId);
      const response = await axios.get(`${API_BASE_URL}/api/curriculum/chapters/${chapterId}/topics`, {
        headers: getAuthHeader()
      });
      console.log('Topics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't show a toast for this error since it's not critical
      return [];
    }
  }, []);

  // Fetch questions based on filters
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const params = {};

        if (formData.class_id) params.class_id = formData.class_id;
        if (formData.subject_id) params.subject_id = formData.subject_id;
        if (formData.chapter_id) params.chapter_id = formData.chapter_id;

        const response = await axios.get(`${API_BASE_URL}/api/questions`, {
          headers: getAuthHeader(),
          params
        });

        setAllQuestions(response.data);
        setFilteredQuestions(response.data);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load questions');
      }
    };

    if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [formData.class_id, formData.subject_id, formData.chapter_id, activeTab]);

  // Filter questions based on search query
  useEffect(() => {
    if (questionSearch.trim() === '') {
      setFilteredQuestions(allQuestions);
    } else {
      const query = questionSearch.toLowerCase();
      const filtered = allQuestions.filter(q =>
        q.ques?.toLowerCase().includes(query) ||
        q.option_a?.toLowerCase().includes(query) ||
        q.option_b?.toLowerCase().includes(query) ||
        q.option_c?.toLowerCase().includes(query) ||
        q.option_d?.toLowerCase().includes(query)
      );
      setFilteredQuestions(filtered);
    }
  }, [questionSearch, allQuestions]);

  // Calculate total marks when selected questions change
  useEffect(() => {
    const total = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    setFormData(prev => ({
      ...prev,
      total_marks: total
    }));
  }, [selectedQuestions]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle rich text editor changes
  const handleSyllabusChange = (content) => {
    setFormData(prev => ({
      ...prev,
      syllabus: content
    }));
  };

  // Handle date picker changes
  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Add question to the exam
  const addQuestion = (question) => {
    const isAlreadyAdded = selectedQuestions.some(q => q.id === question.id);

    if (isAlreadyAdded) {
      toast.error('This question is already added to the exam');
      return;
    }

    const questionWithMarks = {
      ...question,
      marks: 1 // Default marks
    };

    setSelectedQuestions(prev => [...prev, questionWithMarks]);
  };

  // Remove question from the exam
  const removeQuestion = (questionId) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  // Update question marks
  const updateQuestionMarks = (questionId, marks) => {
    setSelectedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, marks: parseInt(marks) || 1 } : q)
    );
  };

  // Reorder questions
  const moveQuestion = (index, direction) => {
    const newQuestions = [...selectedQuestions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index], newQuestions[index - 1]] =
      [newQuestions[index - 1], newQuestions[index]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] =
      [newQuestions[index + 1], newQuestions[index]];
    }
    setSelectedQuestions(newQuestions);
  };

  // Submit form
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    console.log('Submitting exam form...');
    console.log('Form data:', formData);
    console.log('Selected questions:', selectedQuestions);

    // Show immediate feedback
    toast.loading('Validating exam data...', { id: 'exam-submit' });

    // Comprehensive validation for all required fields
    const validationErrors = [];
    const cautions = [];

    console.log('Validating form data:', {
      title: formData.title,
      course_id: formData.course_id,
      chapters: formData.chapters,
      selectedQuestions: selectedQuestions.length,
      duration_minutes: formData.duration_minutes,
      start_datetime: formData.start_datetime,
      end_datetime: formData.end_datetime
    });

    // Critical errors (prevent submission)
    if (!formData.title || formData.title.trim() === '') {
      validationErrors.push('Exam title is required');
      console.error('Validation error: Exam title is required');
    }

    if (!formData.course_id) {
      validationErrors.push('Please select a course');
      console.error('Validation error: Course selection is required');
    }

    if (!formData.chapters || formData.chapters.length === 0) {
      validationErrors.push('Select at least one chapter');
      console.error('Validation error: No chapters selected');
    }

    if (!selectedQuestions || selectedQuestions.length === 0) {
      validationErrors.push('Add at least one question');
      console.error('Validation error: No questions selected');
    }

    if (!formData.duration_minutes || formData.duration_minutes <= 0) {
      validationErrors.push('Exam duration must be greater than 0 minutes');
      console.error('Validation error: Invalid duration');
    }

    if (formData.start_datetime >= formData.end_datetime) {
      validationErrors.push('End date must be after start date');
      console.error('Validation error: Invalid date range');
    }

    // Cautions (warnings but allow submission)
    if (!formData.description) cautions.push('Exam description is empty');
    if (!formData.syllabus) cautions.push('Exam syllabus information is empty');
    if (formData.negative_marking && formData.negative_percentage <= 0) cautions.push('Negative marking is enabled but percentage is set to 0');
    if (selectedQuestions.length < 5) cautions.push('Exam has fewer than 5 questions');
    if (formData.duration_minutes < 10) cautions.push('Exam duration is very short (less than 10 minutes)');

    // Display cautions if any
    if (cautions.length > 0 && validationErrors.length === 0) {
      toast.dismiss('exam-submit');

      // Set the cautions list and show the modal
      setCautionsList(cautions);
      setShowCautionModal(true);
      setIsSubmitting(false); // Reset submitting state since we're waiting for modal confirmation

      // Stop here - the modal will handle continuing or canceling
      return;
    }

    // Display validation errors if any
    if (validationErrors.length > 0) {
      console.log('Validation failed with errors:', validationErrors);
      toast.dismiss('exam-submit');
      toast.error('Cannot create exam. Please fix the following issues:', { duration: 5000 });

      // Show each validation error as a separate toast
      validationErrors.forEach(error => {
        console.error('Showing validation error toast:', error);
        toast.error(error, { duration: 5000 });
      });

      // Navigate to appropriate tab based on the error type
      const hasQuestionErrors = validationErrors.some(err =>
        err.includes('question') || err.toLowerCase().includes('add at least one question')
      );

      const newTab = hasQuestionErrors ? 'questions' : 'details';
      console.log(`Switching to tab: ${newTab} due to validation errors`);
      setActiveTab(newTab);

      // Stop form submission
      setIsSubmitting(false);
      return;
    }

    // Set submitting state
    setIsSubmitting(true);

    // Use a timeout to continue the process asynchronously
    setTimeout(() => {
      createExam();
    }, 100);
  };

  // Function to perform the actual exam creation
  const createExam = async () => {
    try {
      console.log('Creating exam with data:', formData);
      console.log('Selected questions:', selectedQuestions);

      // We already validated in handleSubmit, so proceed with API call
      console.log('Proceeding with exam creation API call');
      toast.loading('Connecting to server...', { id: 'creating-exam' });
      // Prepare the payload with all required fields
      // Ensure chapters is an array of numbers
      const chaptersArray = Array.isArray(formData.chapters)
        ? formData.chapters.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
        : [];

      console.log('Processed chapters array:', chaptersArray);

      const payload = {
        // Basic exam info
        title: formData.title.trim(),
        description: formData.description || '',
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        syllabus: formData.syllabus || '',
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        total_marks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
        course_id: parseInt(formData.course_id, 10),
        chapters: chaptersArray,

        // Question settings
        negative_marking: formData.negative_marking || false,
        negative_percentage: formData.negative_marking ? (formData.negative_percentage || 0) : 0,
        shuffle_questions: formData.shuffle_questions || false,
        can_change_answer: formData.can_change_answer !== undefined ? formData.can_change_answer : true,

        // Questions array - ensure IDs are numbers
        questions: selectedQuestions.map(q => ({
          id: typeof q.id === 'string' ? parseInt(q.id, 10) : q.id,
          marks: parseInt(q.marks || 1, 10)
        })),

        // Basic Settings
        introduction: formData.introduction || '',

        // Question Settings
        pagination_type: formData.pagination_type || 'all',
        allow_blank_answers: formData.allow_blank_answers !== undefined ? formData.allow_blank_answers : true,

        // Review settings
        conclusion_text: formData.conclusion_text || '',
        show_custom_result_message: formData.show_custom_result_message || false,
        pass_message: formData.pass_message || 'Congratulations! You passed the exam.',
        fail_message: formData.fail_message || 'Sorry, you did not pass the exam.',
        passing_score: formData.passing_score || 60,
        show_score: formData.show_score !== undefined ? formData.show_score : true,
        show_test_outline: formData.show_test_outline !== undefined ? formData.show_test_outline : true,
        show_correct_incorrect: formData.show_correct_incorrect !== undefined ? formData.show_correct_incorrect : true,
        show_correct_answer: formData.show_correct_answer !== undefined ? formData.show_correct_answer : true,
        show_explanation: formData.show_explanation !== undefined ? formData.show_explanation : true,

        // Access control
        access_type: formData.access_type || 'anyone',  // Fixed: changed 'open' to 'anyone' to match expected values
        access_passcode: formData.access_passcode || '',
        identifier_list: formData.identifier_list || [],
        email_list: formData.email_list || [],
        time_limit_type: formData.time_limit_type || 'specified',
        attempt_limit_type: formData.attempt_limit_type || 'unlimited',
        max_attempts: formData.max_attempts || 1,
        identifier_prompt: formData.identifier_prompt || 'Please enter your ID',

        // Browser settings
        disable_right_click: formData.disable_right_click || false,
        disable_copy_paste: formData.disable_copy_paste || false,
        disable_translate: formData.disable_translate || false,
        disable_autocomplete: formData.disable_autocomplete || false,
        disable_spellcheck: formData.disable_spellcheck || false,
        disable_printing: formData.disable_printing || false,

        // Add created_by field with the current user's ID
        created_by: user?.id
      };

      // Convert dates to ISO strings if they are Date objects
      if (payload.start_datetime instanceof Date) {
        payload.start_datetime = payload.start_datetime.toISOString();
      }

      if (payload.end_datetime instanceof Date) {
        payload.end_datetime = payload.end_datetime.toISOString();
      }

      console.log('Sending payload to API:', payload);
      console.log('API URL:', `${API_BASE_URL}/api/exams${isEditing ? `/${id}` : ''}`);

      let response;

      // Log the auth token for debugging
      const authToken = localStorage.getItem('token');
      console.log('Auth token:', authToken ? 'Present' : 'Missing');
      console.log('Auth token value:', authToken);
      console.log('User role:', user?.role);

      // Check if token is valid
      if (!authToken) {
        toast.error('Authentication token is missing. Please log in again.');
        setIsSubmitting(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Ensure user is admin or teacher
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        toast.error('Only administrators and teachers can create or edit exams');
        setIsSubmitting(false);
        return;
      }

      try {
        // Prepare headers with authentication token
        const headers = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        console.log('Request headers:', headers);
        console.log('Auth token value:', authToken);
        console.log('Request URL:', isEditing ? `${API_BASE_URL}/api/exams/${id}` : `${API_BASE_URL}/api/exams`);

        // Update toast message
        toast.dismiss('creating-exam');
        toast.loading('Sending to server...', { id: 'sending' });

        if (isEditing) {
          response = await axios.put(`${API_BASE_URL}/api/exams/${id}`, payload, { headers });
          console.log('Update response:', response.data);
          toast.dismiss('processing');

          // Create a more detailed success message for updates
          const examTitle = formData.title.trim();
          const questionCount = selectedQuestions.length;
          const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

          // Show a more detailed success notification
          toast.success(
            <div className="space-y-1">
              <div className="font-medium">Exam updated successfully!</div>
              <div className="text-sm opacity-90">Title: {examTitle}</div>
              <div className="text-sm opacity-90">Questions: {questionCount}</div>
              <div className="text-sm opacity-90">Total marks: {totalMarks}</div>
            </div>,
            { duration: 5000 }
          );

          // Navigate back to exams list after successful update
          setTimeout(() => {
            navigate('/exams');
          }, 1000);
        } else {
          console.log('Sending create exam request with payload:', JSON.stringify(payload, null, 2));
          // Make API call with simplified error handling
          console.log('About to make API call to create exam');

          // Use axios for better error handling
          try {
            console.log('Making axios POST request to create exam');
            const response = await axios.post(
              `${API_BASE_URL}/api/exams`,
              payload,
              { headers }
            );

            console.log('Got response from server:', response);
            console.log('Response data:', response.data);

            toast.dismiss('sending');

            // Create a more detailed success message
            const examTitle = formData.title.trim();
            const questionCount = selectedQuestions.length;
            const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

            // Show a more detailed success notification
            toast.success(
              <div className="space-y-1">
                <div className="font-medium">Exam created successfully!</div>
                <div className="text-sm opacity-90">Title: {examTitle}</div>
                <div className="text-sm opacity-90">Questions: {questionCount}</div>
                <div className="text-sm opacity-90">Total marks: {totalMarks}</div>
              </div>,
              { duration: 5000 }
            );

            // Navigate to exams list with a query parameter to force refresh
            setTimeout(() => {
              console.log('Navigating to exams list with refresh parameter');
              navigate('/exams?created=true&timestamp=' + Date.now());
            }, 1000);
          } catch (error) {
            console.error('Error creating exam with axios:', error);

            // Log detailed error information
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error('Error response data:', error.response.data);
              console.error('Error response status:', error.response.status);
              console.error('Error response headers:', error.response.headers);

              // Check if the error is related to missing columns
              if (error.response.data?.details &&
                  error.response.data.details.includes('column') &&
                  error.response.data.details.includes('does not exist')) {

                console.log('Database schema error detected. Trying with simplified payload...');
                toast.dismiss('sending');
                toast.error('Database schema needs to be updated. Trying with basic settings...');

                // Create a simplified payload without the advanced settings
                const simplifiedPayload = {
                  title: formData.title.trim(),
                  description: formData.description || '',
                  start_datetime: payload.start_datetime,
                  end_datetime: payload.end_datetime,
                  syllabus: formData.syllabus || '',
                  duration_minutes: parseInt(formData.duration_minutes) || 60,
                  total_marks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
                  course_id: parseInt(formData.course_id, 10),
                  chapters: chaptersArray,
                  negative_marking: formData.negative_marking || false,
                  negative_percentage: formData.negative_marking ? (formData.negative_percentage || 0) : 0,
                  shuffle_questions: formData.shuffle_questions || false,
                  can_change_answer: formData.can_change_answer !== undefined ? formData.can_change_answer : true,
                  questions: selectedQuestions.map(q => ({
                    id: typeof q.id === 'string' ? parseInt(q.id, 10) : q.id,
                    marks: parseInt(q.marks || 1, 10)
                  })),
                  created_by: user?.id
                };

                // Try again with the simplified payload
                try {
                  console.log('Retrying with simplified payload:', simplifiedPayload);
                  toast.loading('Retrying with basic settings...', { id: 'retry-exam' });

                  const retryResponse = await axios.post(
                    `${API_BASE_URL}/api/exams`,
                    simplifiedPayload,
                    { headers }
                  );

                  console.log('Retry successful:', retryResponse.data);
                  toast.dismiss('retry-exam');
                  toast.success('Exam created successfully with basic settings!');

                  // Navigate to exams list
                  setTimeout(() => {
                    navigate('/exams?created=true&timestamp=' + Date.now());
                  }, 1000);

                  return;
                } catch (retryError) {
                  console.error('Retry also failed:', retryError);
                  toast.dismiss('retry-exam');
                  toast.error('Failed to create exam even with basic settings. Please contact the administrator.');
                }
              } else {
                // Show the original error message
                toast.dismiss('sending');
                toast.error(`Server error: ${error.response.data.message || 'Unknown error'}`);
              }
            } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
              toast.dismiss('sending');
              toast.error('No response from server. Please check your connection.');
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Error setting up request:', error.message);
              toast.dismiss('sending');
              toast.error(`Request error: ${error.message}`);
            }

            setIsSubmitting(false);
          }
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        throw apiError; // Re-throw to be caught by the outer catch block
      }
    } catch (error) {
      console.error('Error saving exam:', error);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);

        if (error.response.status === 401) {
          toast.error('Authentication error. Please log in again.');
          // Force re-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to create or edit exams.');
          console.error('Permission error details:', error.response.data);
        } else if (error.response.status === 400) {
          // Handle validation errors from the server
          const errorMessage = error.response.data?.message || 'Invalid form data';
          toast.error(errorMessage);

          // If there are specific field errors, show them
          if (error.response.data?.errors) {
            Object.values(error.response.data.errors).forEach(err => {
              toast.error(err);
            });
          }
        } else {
          toast.error(error.response.data?.message || 'Failed to save exam');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error('Error: ' + error.message);
      }

      // Stay on the current page if there was an error
      setActiveTab('details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle class selection change
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedSubject(''); // Reset subject when class changes

    // Also update form data for API filtering
    setFormData(prev => ({
      ...prev,
      class_id: classId,
      subject_id: '',
      chapter_id: ''
    }));
  };

  // Handle subject selection change
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);

    // Update form data for API filtering
    setFormData(prev => ({
      ...prev,
      subject_id: subjectId,
      chapter_id: ''
    }));
  };

  // Render Details Tab
  const renderDetailsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiBookOpen className="text-blue-500" />
          <span>Exam Details</span>
        </h3>
        <div className="space-y-3 sm:space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Enter exam title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Enter exam description (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FiCalendar className="text-gray-500" size={14} />
                <span>Start Date/Time</span>
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.start_datetime}
                  onChange={(date) => handleDateChange(date, 'start_datetime')}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FiClock className="text-gray-500" size={14} />
                <span>End Date/Time</span>
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.end_datetime}
                  onChange={(date) => handleDateChange(date, 'end_datetime')}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
              required
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {!formData.course_id && (
              <p className="mt-1 text-xs text-amber-600">A course must be selected to create an exam</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Syllabus
            </label>
            <SimpleRichTextEditor
              value={formData.syllabus}
              onChange={handleSyllabusChange}
              placeholder="Enter exam syllabus (optional)"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiList className="text-blue-500" />
          <span>Chapter Selection</span>
        </h3>
        <div className="space-y-3 sm:space-y-4 md:space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
                disabled={!selectedClass}
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Chapters</span>
              <span className="text-xs text-blue-600 font-medium">{formData.chapters.length} selected</span>
            </label>
            <div className="mt-1 p-3 sm:p-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white">
              {formData.course_id ? (
                availableChapters.length > 0 ? (
                  <div className="space-y-3">
                    {availableChapters.map(chapter => (
                      <div key={chapter.id} className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          id={`chapter-${chapter.id}`}
                          checked={formData.chapters.includes(chapter.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              chapters: isChecked
                                ? [...prev.chapters, chapter.id]
                                : prev.chapters.filter(id => id !== chapter.id)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`chapter-${chapter.id}`} className="ml-2 block text-sm text-gray-700 cursor-pointer flex-1">
                          {chapter.name} <span className="text-gray-500 text-xs">({chapter.subject_name}, {chapter.class_name})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-md p-4">
                    <svg className="h-6 w-6 text-amber-500 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-amber-800 font-medium mb-1">No chapters available for this course</p>
                    <p className="text-amber-700 text-xs text-center">You need to add chapters to this course in the Courses section before you can create an exam.</p>
                  </div>
                )
              ) : selectedClass ? (
                filteredChapters.length > 0 ? (
                  <div className="space-y-3">
                    {filteredChapters.map(chapter => (
                      <div key={chapter.id} className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          id={`chapter-${chapter.id}`}
                          checked={formData.chapters.includes(chapter.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              chapters: isChecked
                                ? [...prev.chapters, chapter.id]
                                : prev.chapters.filter(id => id !== chapter.id)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`chapter-${chapter.id}`} className="ml-2 block text-sm text-gray-700 cursor-pointer flex-1">
                          {chapter.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                    <p>Please select a subject to view chapters.</p>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                  <p>Please select a class or course to view chapters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Basic Settings Tab
  const renderBasicSettingsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiSettings className="text-blue-500" />
          <span>Basic Settings</span>
        </h3>
        <div className="space-y-3 sm:space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Test Introduction
            </label>
            <div className="text-sm text-gray-500 mb-3 bg-gray-50 p-3 rounded-md border border-gray-200">
              <p>This text is displayed at the top of the test. You can use it to write your instructions or general information about the test.</p>
            </div>
            <textarea
              name="introduction"
              value={formData.introduction}
              onChange={handleInputChange}
              rows="5"
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Enter test introduction text (optional)"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Question Settings Tab
  const renderQuestionSettingsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiList className="text-blue-500" />
          <span>Question Settings</span>
        </h3>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">Pagination</label>

            <div className="space-y-3">
              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="radio"
                  id="pagination_all"
                  name="pagination_type"
                  value="all"
                  checked={formData.pagination_type === 'all'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="pagination_all" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Show all questions on one page
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="radio"
                  id="pagination_one"
                  name="pagination_type"
                  value="one_per_page"
                  checked={formData.pagination_type === 'one_per_page'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="pagination_one" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Show one question per page
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-white p-5 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Question Behavior</h4>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="shuffle_questions"
                name="shuffle_questions"
                checked={formData.shuffle_questions}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="shuffle_questions" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Randomize the order of questions during the test
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="allow_blank_answers"
                name="allow_blank_answers"
                checked={formData.allow_blank_answers}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allow_blank_answers" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Allow students to submit blank/empty answers
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="negative_marking"
                name="negative_marking"
                checked={formData.negative_marking}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="negative_marking" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Penalize incorrect answers (negative marking)
              </label>
            </div>

            {formData.negative_marking && (
              <div className="ml-1 sm:ml-2 md:ml-6 mt-2 p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Negative Percentage (%)
                </label>
                <input
                  type="number"
                  name="negative_percentage"
                  value={formData.negative_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="block w-full sm:w-1/4 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            )}

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="can_change_answer"
                name="can_change_answer"
                checked={formData.can_change_answer}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="can_change_answer" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Allow students to change their answers during the exam
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Review Settings Tab
  const renderReviewSettingsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiEye className="text-blue-500" />
          <span>Review Settings</span>
        </h3>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-6">
          <p className="text-sm text-gray-600">
            These settings control what happens after the test is completed and submitted by the test taker.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Conclusion Text
            </label>
            <div className="text-sm text-gray-500 mb-3">
              This text is displayed after the test is submitted.
            </div>
            <textarea
              name="conclusion_text"
              value={formData.conclusion_text}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Enter conclusion text (optional)"
            />
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="show_custom_result_message"
                name="show_custom_result_message"
                checked={formData.show_custom_result_message}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show_custom_result_message" className="ml-2 block text-sm font-medium text-gray-700">
                Show a custom message if the student passed or failed
              </label>
            </div>

            {formData.show_custom_result_message && (
              <div className="ml-1 sm:ml-2 md:ml-6 space-y-2 sm:space-y-3 md:space-y-4 p-2 sm:p-3 md:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    name="passing_score"
                    value={formData.passing_score}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="block w-24 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pass Message
                  </label>
                  <textarea
                    name="pass_message"
                    value={formData.pass_message}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Congratulations! You have passed the test."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fail Message
                  </label>
                  <textarea
                    name="fail_message"
                    value={formData.fail_message}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Unfortunately, you did not pass the test. Please review the material and try again."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              At the end of the test, display the user's:
            </label>

            <div className="space-y-3">
              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_score"
                  name="show_score"
                  checked={formData.show_score}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_score" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Score
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_test_outline"
                  name="show_test_outline"
                  checked={formData.show_test_outline}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_test_outline" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Test outline
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_correct_incorrect"
                  name="show_correct_incorrect"
                  checked={formData.show_correct_incorrect}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_correct_incorrect" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Indicate if their response was correct or incorrect
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_correct_answer"
                  name="show_correct_answer"
                  checked={formData.show_correct_answer}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_correct_answer" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Display the correct answer
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_explanation"
                  name="show_explanation"
                  checked={formData.show_explanation}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_explanation" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Display the explanation
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Access Control Tab
  const renderAccessControlTab = () => {
    // Function to handle array inputs (identifier_list, email_list)
    const handleArrayInput = (e, field) => {
      const value = e.target.value;
      const array = value.split('\n').filter(item => item.trim() !== '');
      setFormData(prev => ({ ...prev, [field]: array }));
    };

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
            <FiUsers className="text-blue-500" />
            <span>Access Control</span>
          </h3>

          <div className="space-y-8">
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Who can take your test?
              </label>

              <div className="space-y-3">
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_anyone"
                    name="access_type"
                    value="anyone"
                    checked={formData.access_type === 'anyone'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="access_anyone" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone
                  </label>
                </div>

                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_passcode"
                    name="access_type"
                    value="passcode"
                    checked={formData.access_type === 'passcode'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="access_passcode" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone who enters a passcode of my choosing
                  </label>
                </div>

                {formData.access_type === 'passcode' && (
                  <div className="ml-1 sm:ml-2 md:ml-6 mt-3 p-2 sm:p-3 md:p-4 bg-gray-50 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Passcode
                    </label>
                    <input
                      type="text"
                      name="access_passcode"
                      value={formData.access_passcode}
                      onChange={handleInputChange}
                      className="block w-full sm:w-1/3 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                      placeholder="Enter passcode"
                    />
                  </div>
                )}

                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_identifier"
                    name="access_type"
                    value="identifier_list"
                    checked={formData.access_type === 'identifier_list'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="access_identifier" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone who enters a unique identifier from a list that I specify
                  </label>
                </div>

                {formData.access_type === 'identifier_list' && (
                  <div className="ml-1 sm:ml-2 md:ml-6 mt-3 p-2 sm:p-3 md:p-4 bg-gray-50 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      List of allowed identifiers (one per line)
                    </label>
                    <textarea
                      value={formData.identifier_list.join('\n')}
                      onChange={(e) => handleArrayInput(e, 'identifier_list')}
                      rows="4"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                      placeholder="Enter identifiers (e.g., student IDs) one per line"
                    />
                  </div>
                )}

                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_email"
                    name="access_type"
                    value="email_list"
                    checked={formData.access_type === 'email_list'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="access_email" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone who enters an email address from a list that I specify
                  </label>
                </div>

                {formData.access_type === 'email_list' && (
                  <div className="ml-1 sm:ml-2 md:ml-6 mt-3 p-2 sm:p-3 md:p-4 bg-gray-50 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      List of allowed email addresses (one per line)
                    </label>
                    <textarea
                      value={formData.email_list.join('\n')}
                      onChange={(e) => handleArrayInput(e, 'email_list')}
                      rows="4"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                      placeholder="Enter email addresses one per line"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much time do test takers have to complete the test?
              </label>
              <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                The timer starts the moment they enter the test and continues even if they close out of the test.
              </p>

              <div className="space-y-3">
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="time_unlimited"
                    name="time_limit_type"
                    value="unlimited"
                    checked={formData.time_limit_type === 'unlimited'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="time_unlimited" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Unlimited time
                  </label>
                </div>

                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="time_specified"
                    name="time_limit_type"
                    value="specified"
                    checked={formData.time_limit_type === 'specified'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="time_specified" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Specific time limit
                  </label>

                  {formData.time_limit_type === 'specified' && (
                    <div className="ml-1 sm:ml-2 md:ml-6 mt-2 flex items-center flex-wrap gap-1 sm:gap-2">
                      <input
                        type="number"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleInputChange}
                        min="1"
                        className="block w-24 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                      />
                      <span className="ml-2 text-sm text-gray-700">minutes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How many times can someone take your test?
              </label>

              <div className="space-y-3">
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="attempts_unlimited"
                    name="attempt_limit_type"
                    value="unlimited"
                    checked={formData.attempt_limit_type === 'unlimited'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="attempts_unlimited" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Unlimited attempts
                  </label>
                </div>

                <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                  <input
                    type="radio"
                    id="attempts_limited"
                    name="attempt_limit_type"
                    value="limited"
                    checked={formData.attempt_limit_type === 'limited'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="attempts_limited" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Limited attempts
                  </label>

                  {formData.attempt_limit_type === 'limited' && (
                    <div className="ml-1 sm:ml-2 md:ml-6 mt-2 flex items-center flex-wrap gap-1 sm:gap-2">
                      <input
                        type="number"
                        name="max_attempts"
                        value={formData.max_attempts}
                        onChange={handleInputChange}
                        min="1"
                        className="block w-24 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                      />
                      <span className="ml-2 text-sm text-gray-700">attempts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                What should test takers enter to identify themselves?
              </label>
              <div className="text-sm text-gray-500 mb-3">
                This text appears above the field where the test taker enters their identifier.
              </div>
              <input
                type="text"
                name="identifier_prompt"
                value={formData.identifier_prompt}
                onChange={handleInputChange}
                className="block w-full sm:w-1/2 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Browser Settings Tab
  const renderBrowserSettingsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiShield className="text-blue-500" />
          <span>Browser Functionality</span>
        </h3>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-6">
          <p className="text-sm text-gray-600">
            These settings control browser functionality during the exam to help maintain exam integrity.
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Security Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_right_click"
                name="disable_right_click"
                checked={formData.disable_right_click}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_right_click" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable right-click context menu
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_copy_paste"
                name="disable_copy_paste"
                checked={formData.disable_copy_paste}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_copy_paste" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable copy/paste
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_translate"
                name="disable_translate"
                checked={formData.disable_translate}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_translate" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable translate
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_autocomplete"
                name="disable_autocomplete"
                checked={formData.disable_autocomplete}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_autocomplete" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable autocomplete
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_spellcheck"
                name="disable_spellcheck"
                checked={formData.disable_spellcheck}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_spellcheck" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable spellcheck
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_printing"
                name="disable_printing"
                checked={formData.disable_printing}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_printing" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable printing
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Note</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  These settings can enhance test security but may not be foolproof. They rely on browser capabilities and can sometimes be bypassed by technically savvy users. For high-stakes exams, consider using a dedicated secure browser solution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Questions Tab
  const renderQuestionsTab = () => (
    <div className="space-y-8">
      {/* Warning banner if no questions are selected */}
      {selectedQuestions.length === 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">No questions selected</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You must select at least one question to create an exam. Use the question search below to find and add questions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiCheckCircle className="text-blue-500" />
          <span>Selected Questions ({selectedQuestions.length})</span>
        </h3>

        {selectedQuestions.length > 0 ? (
          <div className="mb-6">
            <div className="mb-3 sm:mb-4 md:mb-5 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-700 mb-1.5 sm:mb-2">Quick Stats</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Total Questions:</span>
                  <span className="ml-2 text-sm font-medium text-blue-700">{selectedQuestions.length}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Total Marks:</span>
                  <span className="ml-2 text-sm font-medium text-blue-700">{formData.total_marks}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-2 sm:mb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="font-medium text-sm text-gray-700 mr-2 bg-gray-100 px-2 py-1 rounded-md">
                        Question {index + 1}
                      </span>
                      <div className="flex items-center ml-2">
                        <label className="text-sm text-gray-600 mr-2">Marks:</label>
                        <input
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(e) => updateQuestionMarks(question.id, e.target.value)}
                          className="w-16 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 rounded-md ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                        title="Move up"
                      >
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === selectedQuestions.length - 1}
                        className={`p-1.5 rounded-md ${
                          index === selectedQuestions.length - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                        }`}
                        title="Move down"
                      >
                        <FiArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="ml-1 p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                        title="Remove question"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-800 mb-3 p-3 bg-gray-50 rounded-md">
                    <LaTeXRenderer content={question.ques || ''} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">A:</span> {question.option_a}
                    </div>
                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">B:</span> {question.option_b}
                    </div>
                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">C:</span> {question.option_c}
                    </div>
                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded-md">
                      <span className="font-medium">D:</span> {question.option_d}
                    </div>
                  </div>

                  <div className="text-xs text-green-600 mt-3 p-2 bg-green-50 rounded-md inline-block">
                    <span className="font-medium">Correct Answer:</span> {question.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  No questions added yet. Use the question bank below to select questions for your exam.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiList className="text-blue-500" />
          <span>Question Bank</span>
        </h3>

        <div className="mb-3 sm:mb-4 md:mb-5 flex flex-col md:flex-row gap-3 sm:gap-4 flex-wrap">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search Questions
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Search by question or options..."
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 lg:w-1/4 mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3 lg:w-1/4 mb-2 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
              disabled={!selectedClass}
            >
              <option value="">All Subjects</option>
              {filteredSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {filteredQuestions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {filteredQuestions.map(question => (
                <div
                  key={question.id}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between mb-3">
                    <div className="text-sm text-gray-800 flex-1">
                      <LaTeXRenderer content={question.ques || ''} />
                    </div>
                    <button
                      onClick={() => addQuestion(question)}
                      className="ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <FiPlus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded">A: {question.option_a}</div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded">B: {question.option_b}</div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded">C: {question.option_c}</div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded">D: {question.option_d}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50">
              <div className="flex flex-col items-center justify-center">
                <FiSearch className="h-8 w-8 text-gray-400 mb-2" />
                <p>No questions found. Try adjusting your search or filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl bg-white dark:bg-gray-900 min-h-screen overflow-hidden">
      <div className="max-w-full overflow-x-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center mb-6 text-sm">
        <Link to="/exams" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
          <FiChevronLeft className="h-4 w-4" />
          <span>Back to Exams</span>
        </Link>
      </nav>

      {/* Warning Banner */}
      {(!formData.title || selectedQuestions.length === 0) && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Required fields missing</h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc pl-5 space-y-1">
                  {!formData.title && <li>Exam title is required</li>}
                  {selectedQuestions.length === 0 && <li>At least one question must be selected (go to the Questions tab)</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            {isEditing ? 'Edit Exam' : 'Create New Exam'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {activeTab === 'details' ? 'Configure exam settings' : `${selectedQuestions.length} questions selected • ${formData.total_marks} total marks`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end md:self-auto mt-3 md:mt-0">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1 sm:gap-2"
          >
            <FiX className="h-4 w-4" />
            <span>Cancel</span>
          </button>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  <span>{isEditing ? 'Update Exam' : 'Save Exam'}</span>
                </>
              )}
            </button>
            {selectedQuestions.length === 0 && (
              <div className="text-xs text-red-500 mt-1 text-center">
                Add questions before saving
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        {/* Horizontal Tab Navigation */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px overflow-x-auto pb-1">
            <div className="inline-flex min-w-max w-full">
              <div className="flex flex-nowrap overflow-x-auto w-full pb-1 hide-scrollbar space-x-1 md:space-x-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiInfo className="h-4 w-4" />
                  <span>Details & Curriculum</span>
                </button>

                <button
                  onClick={() => setActiveTab('basic_settings')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'basic_settings'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiSettings className="h-4 w-4" />
                  <span>Basic Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('question_settings')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'question_settings'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiList className="h-4 w-4" />
                  <span>Question Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('review_settings')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'review_settings'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiEye className="h-4 w-4" />
                  <span>Review Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('access_control')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'access_control'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiUsers className="h-4 w-4" />
                  <span>Access Control</span>
                </button>

                <button
                  onClick={() => setActiveTab('browser_settings')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'browser_settings'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiShield className="h-4 w-4" />
                  <span>Browser Settings</span>
                </button>

                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center gap-1 md:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'questions'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : selectedQuestions.length === 0
                        ? 'text-red-500 hover:text-red-700 hover:border-red-300 font-bold'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {selectedQuestions.length === 0 ? (
                    <>
                      <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Questions (Required)</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="h-4 w-4" />
                      <span>Questions ({selectedQuestions.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 md:p-6 overflow-x-auto">
            {/* Tab Content */}
            <div>
              {activeTab === 'details' && renderDetailsTab()}
              {activeTab === 'basic_settings' && renderBasicSettingsTab()}
              {activeTab === 'question_settings' && renderQuestionSettingsTab()}
              {activeTab === 'review_settings' && renderReviewSettingsTab()}
              {activeTab === 'access_control' && renderAccessControlTab()}
              {activeTab === 'browser_settings' && renderBrowserSettingsTab()}
              {activeTab === 'questions' && renderQuestionsTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Caution Modal */}
      <CautionModal
        isOpen={showCautionModal}
        onClose={() => setShowCautionModal(false)}
        onConfirm={() => {
          setShowCautionModal(false);
          toast.loading('Proceeding with submission...', { id: 'exam-submit' });
          // Continue with form submission
          setTimeout(() => {
            createExam();
          }, 100);
        }}
        cautions={cautionsList}
      />
    </div>
    </div>
  );
};

export default CreateExam;