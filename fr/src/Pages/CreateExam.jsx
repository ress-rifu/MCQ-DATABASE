import React, { useState, useEffect, useCallback } from 'react';
import { API_URL, getAuthHeader } from '../apiConfig';
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
  FiBookOpen
} from 'react-icons/fi';

const CreateExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

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

  // Add user state
  const [user, setUser] = useState(null);

  // Fetch exam data if editing
  useEffect(() => {
    const fetchExamData = async () => {
      if (isEditing) {
        try {
          const response = await axios.get(`${API_URL}/api/exams/${id}`, {
            headers: getAuthHeader()
          });

          const examData = response.data;

          // Format dates
          examData.start_datetime = new Date(examData.start_datetime);
          examData.end_datetime = new Date(examData.end_datetime);

          // Extract chapter IDs
          const chapterIds = examData.chapters ? examData.chapters.map(ch => ch.id) : [];
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
          axios.get(`${API_URL}/api/courses`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_URL}/api/curriculum/classes`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_URL}/api/curriculum/subjects`, {
            headers: getAuthHeader()
          }),
          axios.get(`${API_URL}/api/curriculum/chapters`, {
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
          const response = await axios.get(`${API_URL}/api/courses/${formData.course_id}/content`, {
            headers: getAuthHeader()
          });

          // Filter for chapter content only
          const courseChapters = response.data
            .filter(item => item.chapter_id)
            .map(item => ({
              id: item.chapter_id,
              name: item.chapter_name,
              subject_name: item.subject_name,
              class_name: item.class_name
            }));

          setAvailableChapters(courseChapters);
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

  // Fetch questions based on filters
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const params = {};

        if (formData.class_id) params.class_id = formData.class_id;
        if (formData.subject_id) params.subject_id = formData.subject_id;
        if (formData.chapter_id) params.chapter_id = formData.chapter_id;

        const response = await axios.get(`${API_URL}/api/questions`, {
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
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (!formData.title) {
      toast.error('Exam title is required');
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error('Please add at least one question to the exam');
      setActiveTab('questions');
      return;
    }

    if (formData.chapters.length === 0) {
      toast.error('Please select at least one chapter for the exam');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        negative_percentage: formData.negative_marking ? formData.negative_percentage : 0,
        questions: selectedQuestions
      };

      let response;

      if (isEditing) {
        response = await axios.put(`${API_URL}/api/exams/${id}`, payload, {
          headers: getAuthHeader()
        });
        toast.success('Exam updated successfully!');
      } else {
        response = await axios.post(`${API_URL}/api/exams`, payload, {
          headers: getAuthHeader()
        });
        toast.success('Exam created successfully!');
      }

      navigate('/exams');
    } catch (error) {
      console.error('Error saving exam:', error);
      toast.error(error.response?.data?.message || 'Failed to save exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add effect to check user role and redirect if student
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
    }
  }, [navigate]);

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
        <div className="space-y-5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              Course
            </label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <div className="mt-1 p-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white">
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
                  <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                    <p>No chapters available for this course.</p>
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
        <div className="space-y-5">
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
              <div className="ml-6 mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
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
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiEye className="text-indigo-500" />
          <span>Review Settings</span>
        </h3>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mb-6">
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
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder="Enter conclusion text (optional)"
            />
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="show_custom_result_message"
                name="show_custom_result_message"
                checked={formData.show_custom_result_message}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="show_custom_result_message" className="ml-2 block text-sm font-medium text-gray-700">
                Show a custom message if the student passed or failed
              </label>
            </div>

            {formData.show_custom_result_message && (
              <div className="ml-6 space-y-4 p-4 bg-white rounded-md border border-gray-100">
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
                    className="block w-24 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
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
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
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
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Unfortunately, you did not pass the test. Please review the material and try again."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              At the end of the test, display the user's:
            </label>

            <div className="space-y-3">
              <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_score"
                  name="show_score"
                  checked={formData.show_score}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="show_score" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Score
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_test_outline"
                  name="show_test_outline"
                  checked={formData.show_test_outline}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="show_test_outline" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Test outline
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_correct_incorrect"
                  name="show_correct_incorrect"
                  checked={formData.show_correct_incorrect}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="show_correct_incorrect" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Indicate if their response was correct or incorrect
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_correct_answer"
                  name="show_correct_answer"
                  checked={formData.show_correct_answer}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="show_correct_answer" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Display the correct answer
                </label>
              </div>

              <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                <input
                  type="checkbox"
                  id="show_explanation"
                  name="show_explanation"
                  checked={formData.show_explanation}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
            <FiUsers className="text-indigo-500" />
            <span>Access Control</span>
          </h3>

          <div className="space-y-8">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Who can take your test?
              </label>

              <div className="space-y-3">
                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_anyone"
                    name="access_type"
                    value="anyone"
                    checked={formData.access_type === 'anyone'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="access_anyone" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone
                  </label>
                </div>

                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_passcode"
                    name="access_type"
                    value="passcode"
                    checked={formData.access_type === 'passcode'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="access_passcode" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone who enters a passcode of my choosing
                  </label>
                </div>

                {formData.access_type === 'passcode' && (
                  <div className="ml-6 mt-3 p-4 bg-white rounded-md border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Passcode
                    </label>
                    <input
                      type="text"
                      name="access_passcode"
                      value={formData.access_passcode}
                      onChange={handleInputChange}
                      className="block w-full sm:w-1/3 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="Enter passcode"
                    />
                  </div>
                )}

                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_identifier"
                    name="access_type"
                    value="identifier_list"
                    checked={formData.access_type === 'identifier_list'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="access_identifier" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone who enters a unique identifier from a list that I specify
                  </label>
                </div>

                {formData.access_type === 'identifier_list' && (
                  <div className="ml-6 mt-3 p-4 bg-white rounded-md border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      List of allowed identifiers (one per line)
                    </label>
                    <textarea
                      value={formData.identifier_list.join('\n')}
                      onChange={(e) => handleArrayInput(e, 'identifier_list')}
                      rows="4"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="Enter identifiers (e.g., student IDs) one per line"
                    />
                  </div>
                )}

                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="access_email"
                    name="access_type"
                    value="email_list"
                    checked={formData.access_type === 'email_list'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="access_email" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Anyone who enters an email address from a list that I specify
                  </label>
                </div>

                {formData.access_type === 'email_list' && (
                  <div className="ml-6 mt-3 p-4 bg-white rounded-md border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      List of allowed email addresses (one per line)
                    </label>
                    <textarea
                      value={formData.email_list.join('\n')}
                      onChange={(e) => handleArrayInput(e, 'email_list')}
                      rows="4"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                      placeholder="Enter email addresses one per line"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How much time do test takers have to complete the test?
              </label>
              <p className="text-sm text-gray-500 mb-4 bg-white p-3 rounded-md border border-gray-100">
                The timer starts the moment they enter the test and continues even if they close out of the test.
              </p>

              <div className="space-y-3">
                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="time_unlimited"
                    name="time_limit_type"
                    value="unlimited"
                    checked={formData.time_limit_type === 'unlimited'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="time_unlimited" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Unlimited time
                  </label>
                </div>

                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="time_specified"
                    name="time_limit_type"
                    value="specified"
                    checked={formData.time_limit_type === 'specified'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="time_specified" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Specific time limit
                  </label>

                  {formData.time_limit_type === 'specified' && (
                    <div className="ml-6 mt-2 flex items-center">
                      <input
                        type="number"
                        name="duration_minutes"
                        value={formData.duration_minutes}
                        onChange={handleInputChange}
                        min="1"
                        className="block w-24 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                      />
                      <span className="ml-2 text-sm text-gray-700">minutes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How many times can someone take your test?
              </label>

              <div className="space-y-3">
                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="attempts_unlimited"
                    name="attempt_limit_type"
                    value="unlimited"
                    checked={formData.attempt_limit_type === 'unlimited'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="attempts_unlimited" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Unlimited attempts
                  </label>
                </div>

                <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="radio"
                    id="attempts_limited"
                    name="attempt_limit_type"
                    value="limited"
                    checked={formData.attempt_limit_type === 'limited'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="attempts_limited" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Limited attempts
                  </label>

                  {formData.attempt_limit_type === 'limited' && (
                    <div className="ml-6 mt-2 flex items-center">
                      <input
                        type="number"
                        name="max_attempts"
                        value={formData.max_attempts}
                        onChange={handleInputChange}
                        min="1"
                        className="block w-24 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                      />
                      <span className="ml-2 text-sm text-gray-700">attempts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
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
                className="block w-full sm:w-1/2 px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
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
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiShield className="text-indigo-500" />
          <span>Browser Functionality</span>
        </h3>
        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mb-6">
          <p className="text-sm text-gray-600">
            These settings control browser functionality during the exam to help maintain exam integrity.
          </p>
        </div>

        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Security Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_right_click"
                name="disable_right_click"
                checked={formData.disable_right_click}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_right_click" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable right-click context menu
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_copy_paste"
                name="disable_copy_paste"
                checked={formData.disable_copy_paste}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_copy_paste" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable copy/paste
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_translate"
                name="disable_translate"
                checked={formData.disable_translate}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_translate" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable translate
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_autocomplete"
                name="disable_autocomplete"
                checked={formData.disable_autocomplete}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_autocomplete" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable autocomplete
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_spellcheck"
                name="disable_spellcheck"
                checked={formData.disable_spellcheck}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="disable_spellcheck" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Disable spellcheck
              </label>
            </div>

            <div className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
              <input
                type="checkbox"
                id="disable_printing"
                name="disable_printing"
                checked={formData.disable_printing}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiCheckCircle className="text-indigo-500" />
          <span>Selected Questions ({selectedQuestions.length})</span>
        </h3>

        {selectedQuestions.length > 0 ? (
          <div className="mb-6">
            <div className="mb-5 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <h4 className="text-sm font-medium text-indigo-700 mb-2">Quick Stats</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Total Questions:</span>
                  <span className="ml-2 text-sm font-medium text-indigo-700">{selectedQuestions.length}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Total Marks:</span>
                  <span className="ml-2 text-sm font-medium text-indigo-700">{formData.total_marks}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center">
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
                          className="w-16 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 rounded-md ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
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
                            : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
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

      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-5 flex items-center gap-2">
          <FiList className="text-indigo-500" />
          <span>Question Bank</span>
        </h3>

        <div className="mb-5 flex flex-col sm:flex-row gap-4">
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
                className="w-full pl-10 pr-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="Search by question or options..."
              />
            </div>
          </div>

          <div className="sm:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors appearance-none"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-colors appearance-none"
              disabled={!selectedClass}
            >
              <option value="">All Subjects</option>
              {filteredSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredQuestions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {filteredQuestions.map(question => (
                <div
                  key={question.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between mb-3">
                    <div className="text-sm text-gray-800 flex-1">
                      <LaTeXRenderer content={question.ques || ''} />
                    </div>
                    <button
                      onClick={() => addQuestion(question)}
                      className="ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <FiPlus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="p-1.5 bg-gray-50 rounded">A: {question.option_a}</div>
                    <div className="p-1.5 bg-gray-50 rounded">B: {question.option_b}</div>
                    <div className="p-1.5 bg-gray-50 rounded">C: {question.option_c}</div>
                    <div className="p-1.5 bg-gray-50 rounded">D: {question.option_d}</div>
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl bg-white min-h-screen">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center mb-6 text-sm">
        <Link to="/exams" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
          <FiChevronLeft className="h-4 w-4" />
          <span>Back to Exams</span>
        </Link>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            {isEditing ? 'Edit Exam' : 'Create New Exam'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {activeTab === 'details' ? 'Configure exam settings' : `${selectedQuestions.length} questions selected • ${formData.total_marks} total marks`}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => navigate('/exams')}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <FiX className="h-4 w-4" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
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

      <div className="mb-8">
        {/* Horizontal Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'questions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiCheckCircle className="h-4 w-4" />
              <span>Questions</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6">
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
    </div>
  );
};

export default CreateExam;