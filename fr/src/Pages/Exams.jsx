import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus } from 'react-icons/fi';
import { AiOutlineBook, AiOutlineClockCircle, AiOutlineQuestionCircle, AiOutlineTrophy } from 'react-icons/ai';
import { API_URL, getAuthHeader } from '../apiConfig';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [availableChapters, setAvailableChapters] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        if (selectedCourse) {
          params.append('course_id', selectedCourse);
        }
        if (selectedChapter) {
          params.append('chapter_id', selectedChapter);
        }

        const response = await axios.get(`${API_URL}/api/exams?${params.toString()}`, {
          headers: getAuthHeader()
        });

        setExams(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [selectedCourse, selectedChapter]);

  // Fetch courses and chapters
  useEffect(() => {
    const fetchCurriculumData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await axios.get(`${API_URL}/api/courses`, {
          headers: getAuthHeader()
        });
        setCourses(coursesResponse.data);

        // If a course is selected, fetch its chapters
        if (selectedCourse) {
          const courseContentResponse = await axios.get(
            `${API_URL}/api/courses/${selectedCourse}/content`,
            { headers: getAuthHeader() }
          );

          // Filter for chapter content only
          const chapters = courseContentResponse.data
            .filter(item => item.chapter_id)
            .map(item => ({
              id: item.chapter_id,
              name: item.chapter_name,
              subject_name: item.subject_name,
              class_name: item.class_name
            }));

          setAvailableChapters(chapters);
        } else {
          setAvailableChapters([]);
        }
      } catch (error) {
        console.error('Error fetching curriculum data:', error);
      }
    };

    fetchCurriculumData();
  }, [selectedCourse]);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedChapter(''); // Reset chapter selection when course changes
  };

  const handleChapterChange = (e) => {
    setSelectedChapter(e.target.value);
  };

  const clearFilters = () => {
    setSelectedCourse('');
    setSelectedChapter('');
  };

  const canCreateExam = user && (user.role === 'admin' || user.role === 'teacher');

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exams</h1>

        {canCreateExam && (
          <button
            onClick={() => navigate('/exams/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            Create Exam
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter
            </label>
            <select
              value={selectedChapter}
              onChange={handleChapterChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={!selectedCourse || availableChapters.length === 0}
            >
              <option value="">All Chapters</option>
              {availableChapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name} - {chapter.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Exams List */}
      {loading ? (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading exams...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <FiFileText className="mx-auto text-gray-400 text-5xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Found</h3>
          <p className="text-gray-500 mb-4">
            {selectedCourse || selectedChapter ?
              'No exams match your selected filters.' :
              'There are no exams available at the moment.'}
          </p>
          {(selectedCourse || selectedChapter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
};

// ExamCard component
const ExamCard = ({ exam }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if exam is active
  const now = new Date();
  const start = new Date(exam.start_datetime);
  const end = new Date(exam.end_datetime);
  const isActive = now >= start && now <= end;
  const isUpcoming = now < start;
  const isCompleted = now > end;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3
            className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
            onClick={() => navigate(`/exams/${exam.id}`)}
          >
            {exam.title}
          </h3>

          {isActive && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          )}

          {isUpcoming && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Upcoming
            </span>
          )}

          {isCompleted && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Completed
            </span>
          )}
        </div>

        <div className="text-gray-500 text-sm mb-4">
          {exam.description ? (
            <p className="line-clamp-2">{exam.description}</p>
          ) : (
            <p className="italic">No description available</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-sm text-gray-500">Start:</p>
            <p className="text-sm font-medium">{formatDate(exam.start_datetime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End:</p>
            <p className="text-sm font-medium">{formatDate(exam.end_datetime)}</p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <AiOutlineBook className="text-gray-400 mr-2" />
            <span className="text-sm">Course: {exam.course_name || 'N/A'}</span>
          </div>

          <div className="flex items-center">
            <AiOutlineClockCircle className="text-gray-400 mr-2" />
            <span className="text-sm">Duration: {exam.duration_minutes} minutes</span>
          </div>

          <div className="flex items-center">
            <AiOutlineQuestionCircle className="text-gray-400 mr-2" />
            <span className="text-sm">Questions: {exam.question_count || 0}</span>
          </div>

          <div className="flex items-center">
            <AiOutlineTrophy className="text-gray-400 mr-2" />
            <span className="text-sm">Total Marks: {exam.total_marks}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => navigate(`/exams/${exam.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {user.role === 'student' ? 'Take Exam' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Exams;