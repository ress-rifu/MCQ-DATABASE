import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  FiBookOpen,
  FiAlertTriangle,
  FiHelpCircle
} from 'react-icons/fi';

const CreateExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [user, setUser] = useState(null);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', onConfirm: null, cautions: [] });

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
    chapters: [], // This will store chapter IDs as integers

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
          console.log('Fetching exam data for editing, ID:', id);
          const response = await axios.get(`${API_BASE_URL}/api/exams/${id}`, {
            headers: getAuthHeader()
          });

          const examData = response.data;
          console.log('Exam data received:', examData);

          // Format dates
          examData.start_datetime = new Date(examData.start_datetime);
          examData.end_datetime = new Date(examData.end_datetime);

          // Extract chapter IDs and ensure they are integers
          let chapterIds = [];
          if (examData.chapters && Array.isArray(examData.chapters)) {
            // If chapters is an array of objects with id property
            if (examData.chapters.length > 0 && typeof examData.chapters[0] === 'object' && 'id' in examData.chapters[0]) {
              chapterIds = examData.chapters.map(ch => parseInt(ch.id));
              console.log('Extracted chapter IDs from objects:', chapterIds);
            }
            // If chapters is already an array of IDs
            else {
              chapterIds = examData.chapters.map(id => typeof id === 'string' ? parseInt(id) : id);
              console.log('Converted chapter IDs to integers:', chapterIds);
            }
          }
          console.log('Final chapter IDs:', chapterIds);
          examData.chapters = chapterIds;

          setFormData(examData);
          setSelectedQuestions(examData.questions.map(q => ({
            ...q,
            marks: q.marks || 1  // Ensure marks is set
          })));
          setInitialDataLoaded(true);
        } catch (error) {
          console.error('Error fetching exam data:', error);
          toast.error('Failed to load exam data');
        }
      } else {
        console.log('Creating new exam, initializing with empty data');
        setInitialDataLoaded(true);
      }
    };

    fetchExamData();
  }, [id, isEditing]);

  // Fetch curriculum data for dropdowns
  useEffect(() => {
    const fetchCurriculumData = async () => {
      try {
        console.log('Fetching curriculum data...');
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

        console.log('Courses data:', coursesRes.data);
        console.log('Classes data:', classesRes.data);
        console.log('Subjects data:', subjectsRes.data);
        console.log('Chapters data:', chaptersRes.data);

        // Process chapters to ensure IDs are integers
        const processedChapters = chaptersRes.data.map(chapter => ({
          ...chapter,
          id: parseInt(chapter.id)
        }));
        console.log('Processed chapters with integer IDs:', processedChapters);

        setCourses(coursesRes.data);
        setClasses(classesRes.data);
        setSubjects(subjectsRes.data);
        setAllChapters(processedChapters);
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
          console.log('Fetching course content for course ID:', formData.course_id);
          const response = await axios.get(`${API_BASE_URL}/api/courses/${formData.course_id}/content`, {
            headers: getAuthHeader()
          });

          console.log('Course content API response:', response.data);

          // Filter for chapter content only
          if (response.data && Array.isArray(response.data)) {
            const courseChapters = response.data
              .filter(item => item.chapter_id)
              .map(item => ({
                id: parseInt(item.chapter_id),  // Ensure ID is an integer
                name: item.chapter_name,
                subject_name: item.subject_name,
                class_name: item.class_name
              }));

            console.log('Processed course chapters:', courseChapters);
            setAvailableChapters(courseChapters);
          } else {
            console.error('Invalid course content response format:', response.data);
            toast.error('Failed to load course chapters: Invalid data format');
            setAvailableChapters([]);
          }
        } catch (error) {
          console.error('Error fetching course content:', error);
          toast.error('Failed to load course chapters');
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
    console.log('Filtering chapters based on subject/class selection');
    console.log('Selected subject:', selectedSubject);
    console.log('Selected class:', selectedClass);
    console.log('All chapters:', allChapters);

    if (selectedSubject) {
      // Convert selectedSubject to integer for comparison
      const subjectIdInt = parseInt(selectedSubject);
      // Ensure subject_id in chapters is also an integer for comparison
      const filtered = allChapters.filter(c => {
        const chapterSubjectId = typeof c.subject_id === 'string' ? parseInt(c.subject_id) : c.subject_id;
        return chapterSubjectId === subjectIdInt;
      });
      console.log('Filtered chapters by subject:', filtered);
      setFilteredChapters(filtered);
    } else if (selectedClass) {
      // Convert selectedClass to integer for comparison
      const classIdInt = parseInt(selectedClass);
      // Get subject IDs for the selected class
      const subjectIds = subjects
        .filter(s => {
          const classId = typeof s.class_id === 'string' ? parseInt(s.class_id) : s.class_id;
          return classId === classIdInt;
        })
        .map(s => typeof s.id === 'string' ? parseInt(s.id) : s.id);
      console.log('Subject IDs for selected class:', subjectIds);

      // Filter chapters by subject IDs
      const filtered = allChapters.filter(c => {
        const chapterSubjectId = typeof c.subject_id === 'string' ? parseInt(c.subject_id) : c.subject_id;
        return subjectIds.includes(chapterSubjectId);
      });
      console.log('Filtered chapters by class:', filtered);
      setFilteredChapters(filtered);
    } else {
      console.log('No filters applied, showing all chapters');
      setFilteredChapters(allChapters);
    }
  }, [selectedSubject, selectedClass, subjects, allChapters]);

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

    // Show immediate feedback
    toast.loading('Validating exam data...', { id: 'exam-submit' });

    // Comprehensive validation for all required fields
    const validationErrors = [];

    // Critical errors (prevent submission)
    if (!formData.title) validationErrors.push('Exam title is required');
    if (!formData.course_id) validationErrors.push('Please select a course');
    if (formData.chapters.length === 0) validationErrors.push('Select at least one chapter');
    if (selectedQuestions.length === 0) validationErrors.push('Add at least one question');
    if (formData.duration_minutes <= 0) validationErrors.push('Exam duration must be greater than 0 minutes');
    if (formData.start_datetime >= formData.end_datetime) validationErrors.push('End date must be after start date');

    // Display validation errors if any
    if (validationErrors.length > 0) {
      toast.dismiss('exam-submit');
      toast.error('Cannot create exam. Please fix the following issues:', { duration: 5000 });
      validationErrors.forEach(error => toast.error(error, { duration: 5000 }));

      // Navigate to appropriate tab
      setActiveTab(validationErrors.some(err => err.includes('question')) ? 'questions' : 'details');
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
      toast.loading('Creating exam...', { id: 'creating-exam' });
      
      // Prepare the payload with all required fields
      console.log('Preparing exam payload with chapters:', formData.chapters);

      // Ensure chapters are integers
      const chaptersAsIntegers = formData.chapters.map(id => typeof id === 'string' ? parseInt(id) : id);
      console.log('Chapters converted to integers:', chaptersAsIntegers);

      // Create a basic payload with only the essential fields that we know exist in the database
      const basicPayload = {
        // Basic exam info
        title: formData.title.trim(),
        description: formData.description || '',
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        syllabus: formData.syllabus || '',
        duration_minutes: parseInt(formData.duration_minutes) || 60,
        total_marks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
        course_id: formData.course_id,
        chapters: chaptersAsIntegers, // Use the converted array

        // Question settings
        negative_marking: formData.negative_marking || false,
        negative_percentage: formData.negative_marking ? (formData.negative_percentage || 0) : 0,
        shuffle_questions: formData.shuffle_questions || false,
        can_change_answer: formData.can_change_answer !== undefined ? formData.can_change_answer : true,

        // Questions array
        questions: selectedQuestions.map(q => ({
          id: q.id,
          marks: q.marks || 1
        })),

        // Add created_by field with the current user's ID
        created_by: user?.id
      };

      console.log('Using basic payload to avoid database schema issues');
      const payload = basicPayload;

      // Remove any fields that might cause issues with the database
      // These fields are not in the original database schema
      const fieldsToRemove = [
        'introduction', 'pagination_type', 'allow_blank_answers', 'conclusion_text',
        'show_custom_result_message', 'pass_message', 'fail_message', 'passing_score',
        'show_score', 'show_test_outline', 'show_correct_incorrect', 'show_correct_answer',
        'show_explanation', 'access_type', 'access_passcode', 'identifier_list', 'email_list',
        'time_limit_type', 'attempt_limit_type', 'max_attempts', 'identifier_prompt',
        'disable_right_click', 'disable_copy_paste', 'disable_translate',
        'disable_autocomplete', 'disable_spellcheck', 'disable_printing'
      ];

      // Make sure none of these fields are in the payload
      fieldsToRemove.forEach(field => {
        if (field in payload) {
          delete payload[field];
        }
      });

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
      console.log('User role:', user?.role);

      // Ensure user is admin
      if (user?.role !== 'admin') {
        toast.dismiss('creating-exam');
        toast.error('Only administrators can create or edit exams');
        setIsSubmitting(false);
        return;
      }

      // Prepare headers with authentication token
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      console.log('Request headers:', headers);
      console.log('Auth token value:', authToken);
      console.log('Request URL:', isEditing ? `${API_BASE_URL}/api/exams/${id}` : `${API_BASE_URL}/api/exams`);

      // Update toast message
      toast.dismiss('creating-exam');
      toast.loading('Saving exam...', { id: 'sending' });

      if (isEditing) {
        response = await axios.put(`${API_BASE_URL}/api/exams/${id}`, payload, { headers });
        console.log('Update response:', response.data);
        toast.dismiss('sending');
        toast.success('Exam updated successfully!', {
          duration: 5000,
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#10B981',
            color: '#fff',
          },
        });

        // Navigate back to exams list after successful update
        setTimeout(() => {
          navigate('/exams');
        }, 1500);
      } else {
        console.log('Sending create exam request with payload:', JSON.stringify(payload, null, 2));
        response = await axios.post(`${API_BASE_URL}/api/exams`, payload, { headers });
        console.log('Create response:', response.data);
        toast.dismiss('sending');
        toast.success('Exam created successfully!', {
          duration: 5000,
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#10B981',
            color: '#fff',
          },
        });

        // Navigate back to exams list after successful create
        setTimeout(() => {
          navigate('/exams');
        }, 1500);
      }
    } catch (error) {
      // Handle network or API errors
      console.error('API Error:', error);
      toast.dismiss('sending');
      toast.dismiss('creating-exam');
      
      // Extract error message
      const errorMessage = error.response?.data?.message || 'Server error. Please try again.';
      
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
      {/* Required Fields Explanation */}
      <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiHelpCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Required Information</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The following fields are required to create an exam:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Exam Title</strong> - A descriptive name for your exam</li>
                <li><strong>Course</strong> - The course this exam belongs to</li>
                <li><strong>Chapters</strong> - At least one chapter must be selected</li>
                <li><strong>Duration</strong> - How long students have to complete the exam</li>
                <li><strong>Date Range</strong> - When the exam will be available to students</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiInfo className="text-blue-500" />
          <span>Basic Information</span>
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="e.g. Final Exam, Midterm Exam, etc."
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Give your exam a clear, descriptive title
              </p>
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
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Brief description about this exam"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add details about the exam content or purpose (optional)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Syllabus/Instructions for Students
            </label>
            <SimpleRichTextEditor
              value={formData.syllabus}
              onChange={handleSyllabusChange}
              placeholder="Enter syllabus or additional instructions for students..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide information about topics covered, exam rules, etc. This will be visible to students.
            </p>
          </div>
        </div>
      </div>

      {/* Curriculum Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiBookOpen className="text-blue-500" />
          <span>Curriculum Selection</span>
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select which course this exam belongs to
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Class (Filter)
              </label>
              <select
                value={selectedClass}
                onChange={handleClassChange}
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Optional: Filter chapters by class
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject (Filter)
              </label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                disabled={!selectedClass}
              >
                <option value="">All Subjects</option>
                {filteredSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Optional: Filter chapters by subject
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Chapters <span className="text-red-500">*</span>
            </label>
            
            {availableChapters.length > 0 ? (
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableChapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`chapter-${chapter.id}`}
                        checked={formData.chapters.includes(chapter.id)}
                        onChange={() => {
                          const updatedChapters = [...formData.chapters];
                          if (updatedChapters.includes(chapter.id)) {
                            // Remove
                            const index = updatedChapters.indexOf(chapter.id);
                            updatedChapters.splice(index, 1);
                          } else {
                            // Add
                            updatedChapters.push(chapter.id);
                          }
                          setFormData({ ...formData, chapters: updatedChapters });
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`chapter-${chapter.id}`} className="ml-2 block text-sm text-gray-900">
                        {chapter.name} <span className="text-gray-500 text-xs">({chapter.subject_name})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-500 text-sm">
                  {formData.course_id
                    ? "No chapters available. Please select different filters or add chapters to this course."
                    : "Please select a course to view available chapters."}
                </p>
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Select the chapters covered in this exam
            </p>
          </div>
        </div>
      </div>

      {/* Exam Timing */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiClock className="text-blue-500" />
          <span>Exam Timing</span>
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (Minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                How long students have to complete the exam
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={formData.start_datetime}
                onChange={(date) => handleDateChange(date, 'start_datetime')}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              />
              <p className="mt-1 text-sm text-gray-500">
                When the exam becomes available to students
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={formData.end_datetime}
                onChange={(date) => handleDateChange(date, 'end_datetime')}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="time"
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors"
              />
              <p className="mt-1 text-sm text-gray-500">
                When the exam is no longer available to students
              </p>
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
      {/* Settings Explanation */}
      <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Question Settings Guide</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>These settings determine how questions are presented and scored:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Negative Marking</strong> - Deduct points for incorrect answers</li>
                <li><strong>Question Shuffling</strong> - Randomize question order for each student</li>
                <li><strong>Answer Changes</strong> - Allow or restrict students from changing their answers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiSettings className="text-blue-500" />
          <span>Question Settings</span>
        </h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="negative_marking"
                    name="negative_marking"
                    type="checkbox"
                    checked={formData.negative_marking}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        negative_marking: e.target.checked
                      });
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="negative_marking" className="font-medium text-gray-700">
                    Enable Negative Marking
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Deduct points for incorrect answers to discourage guessing
                  </p>
                </div>
              </div>

              {formData.negative_marking && (
                <div className="mt-4 pl-7">
                  <label htmlFor="negative_percentage" className="block text-sm font-medium text-gray-700 mb-1">
                    Negative Marking Percentage
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="negative_percentage"
                      name="negative_percentage"
                      value={formData.negative_percentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <span className="ml-2 text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of marks to deduct for wrong answers (e.g., 25%)
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="shuffle_questions"
                    name="shuffle_questions"
                    type="checkbox"
                    checked={formData.shuffle_questions}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        shuffle_questions: e.target.checked
                      });
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="shuffle_questions" className="font-medium text-gray-700">
                    Shuffle Questions
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Present questions in random order to each student
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="can_change_answer"
                    name="can_change_answer"
                    type="checkbox"
                    checked={formData.can_change_answer}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        can_change_answer: e.target.checked
                      });
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="can_change_answer" className="font-medium text-gray-700">
                    Allow Changing Answers
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Let students revise their answers within the exam duration
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">
                  Question Display
                </label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center">
                    <input
                      id="pagination_all"
                      name="pagination_type"
                      type="radio"
                      value="all"
                      checked={formData.pagination_type === 'all'}
                      onChange={() => setFormData({ ...formData, pagination_type: 'all' })}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="pagination_all" className="ml-3 text-sm text-gray-700">
                      Show all questions on a single page
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="pagination_one"
                      name="pagination_type"
                      type="radio"
                      value="one_per_page"
                      checked={formData.pagination_type === 'one_per_page'}
                      onChange={() => setFormData({ ...formData, pagination_type: 'one_per_page' })}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="pagination_one" className="ml-3 text-sm text-gray-700">
                      Show one question per page
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Determine how questions are displayed to students
                </p>
              </div>
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
      {/* Questions Guide */}
      <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiHelpCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Questions Selection Guide</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="mb-2">Important information about adding questions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Required:</strong> At least one question must be added</li>
                <li><strong>Recommended:</strong> Add five or more questions for a comprehensive exam</li>
                <li><strong>Marks:</strong> You can assign different mark values to each question</li>
                <li><strong>Order:</strong> Questions will appear in the order shown (unless shuffling is enabled)</li>
                <li><strong>Search:</strong> Use the filters below to find relevant questions from the question bank</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    
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

          <button
            type="button"
            onClick={() => {
              // Open confirmation modal instead of direct submission
              const cautions = [];
              if (!formData.description) cautions.push('Exam description is empty');
              if (!formData.syllabus) cautions.push('Exam syllabus information is empty');
              if (formData.negative_marking && formData.negative_percentage <= 0) cautions.push('Negative marking is enabled but percentage is set to 0');
              if (selectedQuestions.length < 5) cautions.push('Exam has fewer than 5 questions');
              if (formData.duration_minutes < 10) cautions.push('Exam duration is very short (less than 10 minutes)');
              
              setModalData({
                title: 'Confirm Exam Creation',
                message: 'Are you sure you want to create this exam? Once created, it will be available according to the specified start date.',
                cautions,
                onConfirm: handleSubmit
              });
              setShowConfirmModal(true);
            }}
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
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Instructions for Creating an Exam</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Required fields</strong> are marked with an asterisk (*)</li>
                <li>Fill out the <strong>Details</strong> tab with basic exam information</li>
                <li>Configure exam settings in the respective tabs</li>
                <li>Add questions from the question bank in the <strong>Questions</strong> tab</li>
                <li>Review all information before submitting</li>
              </ul>
            </div>
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
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FiCheckCircle className="h-4 w-4" />
                  <span>Questions</span>
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
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="text-amber-500 h-6 w-6 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">{modalData.title}</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">{modalData.message}</p>
              
              {modalData.cautions.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-md mb-4">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Please review these cautions:</h4>
                  <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                    {modalData.cautions.map((caution, index) => (
                      <li key={index}>{caution}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  if (modalData.onConfirm) modalData.onConfirm();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CreateExam;