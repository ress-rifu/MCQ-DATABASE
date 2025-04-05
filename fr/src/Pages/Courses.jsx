import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import Modal from '../components/Modal';
import ModalActions, { PrimaryButton, SecondaryButton, DangerButton } from '../components/ModalActions';
import Pagination from '../Components/Pagination';

const Courses = () => {
    // Data states
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseContent, setCourseContent] = useState([]);
    
    // Form states
    const [courseForm, setCourseForm] = useState({ name: '', description: '' });
    const [editingCourse, setEditingCourse] = useState(null);
    
    // Selection states for content assignment
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedClassSubjects, setSelectedClassSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectChapters, setSubjectChapters] = useState({});
    const [selectedChapters, setSelectedChapters] = useState([]);
    
    // Multiple classes selection state
    const [multipleClassesMode, setMultipleClassesMode] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState([]);
    
    // Modal states
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Toast notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    
    useEffect(() => {
        fetchCourses();
        fetchCurriculumData();
    }, []);
    
    // Show notification function
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };
    
    // Fetch all courses
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/courses`, {
                headers: getAuthHeader()
            });
            setCourses(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to load courses. Please try again.');
            setLoading(false);
        }
    };
    
    // Fetch curriculum data (classes, subjects, chapters)
    const fetchCurriculumData = async () => {
        try {
            const [classesRes, subjectsRes, chaptersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/curriculum/classes`, { headers: getAuthHeader() }),
                axios.get(`${API_BASE_URL}/api/curriculum/subjects`, { headers: getAuthHeader() }),
                axios.get(`${API_BASE_URL}/api/curriculum/chapters`, { headers: getAuthHeader() })
            ]);
            
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            setChapters(chaptersRes.data || []);
        } catch (err) {
            console.error('Error fetching curriculum data:', err);
            showNotification('Failed to load curriculum data', 'error');
        }
    };
    
    // Fetch course content
    const fetchCourseContent = async (courseId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/courses/${courseId}/content`, {
                headers: getAuthHeader()
            });
            setCourseContent(response.data);
        } catch (err) {
            console.error('Error fetching course content:', err);
            showNotification('Failed to load course content', 'error');
        }
    };
    
    // Handle course form submission
    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            if (!courseForm.name.trim()) {
                showNotification('Course name is required', 'error');
                setSubmitting(false);
                return;
            }
            
            let response;
            if (editingCourse) {
                // Update existing course
                response = await axios.put(
                    `${API_BASE_URL}/api/courses/${editingCourse.id}`,
                    courseForm,
                    { headers: getAuthHeader() }
                );
                showNotification('Course updated successfully');
            } else {
                // Create new course
                response = await axios.post(
                    `${API_BASE_URL}/api/courses`,
                    courseForm,
                    { headers: getAuthHeader() }
                );
                showNotification('Course created successfully');
            }
            
            // Refresh courses list
            fetchCourses();
            
            // Reset form and close modal
            setCourseForm({ name: '', description: '' });
            setEditingCourse(null);
            setShowCourseModal(false);
        } catch (err) {
            console.error('Error saving course:', err);
            showNotification('Failed to save course', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    
    // Handle class selection in content assignment
    const handleClassChange = async (e) => {
        const classId = e.target.value;
        setSelectedClass(classId);
        
        if (!classId) {
            setSelectedClassSubjects([]);
            setSelectedSubjects([]);
            setSubjectChapters({});
            setSelectedChapters([]);
            return;
        }
        
        // Get all subjects for this class
        const classSubjects = subjects.filter(s => s.class_id.toString() === classId);
        setSelectedClassSubjects(classSubjects);
        
        // Auto-select all subjects and their chapters
        const subjectIds = classSubjects.map(s => s.id.toString());
        setSelectedSubjects(subjectIds);
        
        // Prepare subject chapters mapping and auto-select all chapters
        const newSubjectChapters = {};
        let allChapterIds = [];
        
        for (const subject of classSubjects) {
            const subjectChapters = chapters.filter(
                c => c.subject_id.toString() === subject.id.toString()
            );
            newSubjectChapters[subject.id] = subjectChapters;
            allChapterIds = [
                ...allChapterIds,
                ...subjectChapters.map(c => c.id.toString())
            ];
        }
        
        setSubjectChapters(newSubjectChapters);
        setSelectedChapters(allChapterIds);
    };
    
    // Handle subject selection in content assignment
    const handleSubjectSelectionChange = (subjectId, checked) => {
        if (checked) {
            // Add the subject
            setSelectedSubjects(prev => [...prev, subjectId]);
            
            // Auto-select all chapters of this subject
            const subjectChapterIds = (subjectChapters[subjectId] || [])
                .map(c => c.id.toString());
            
            setSelectedChapters(prev => [...prev, ...subjectChapterIds]);
        } else {
            // Remove the subject
            setSelectedSubjects(prev => prev.filter(id => id !== subjectId));
            
            // Remove all chapters of this subject
            const subjectChapterIds = (subjectChapters[subjectId] || [])
                .map(c => c.id.toString());
            
            setSelectedChapters(prev => 
                prev.filter(id => !subjectChapterIds.includes(id))
            );
        }
    };
    
    // Handle chapter selection
    const handleChapterSelectionChange = (chapterId, checked) => {
        if (checked) {
            setSelectedChapters(prev => [...prev, chapterId]);
        } else {
            setSelectedChapters(prev => prev.filter(id => id !== chapterId));
        }
    };
    
    // Handle class selection for multiple selection mode
    const handleClassSelection = (classId, checked) => {
        if (checked) {
            setSelectedClasses(prev => [...prev, classId]);
        } else {
            setSelectedClasses(prev => prev.filter(id => id !== classId));
        }
    };
    
    // Add multiple classes to course
    const handleAddMultipleClasses = async () => {
        if (!selectedCourse) {
            showNotification('Please select a course first', 'error');
            return;
        }
        
        if (selectedClasses.length === 0) {
            showNotification('Please select at least one class', 'error');
            return;
        }
        
        setSubmitting(true);
        
        try {
            await axios.post(
                `${API_BASE_URL}/api/courses/${selectedCourse.id}/classes`,
                { classIds: selectedClasses },
                { headers: getAuthHeader() }
            );
            
            showNotification('Classes added to course successfully');
            
            // Refresh course content
            fetchCourseContent(selectedCourse.id);
            
            // Reset selection states
            setSelectedClasses([]);
            setMultipleClassesMode(false);
            
            // Close modal
            setShowContentModal(false);
        } catch (err) {
            console.error('Error adding classes to course:', err);
            showNotification('Failed to add classes to course', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    
    // Assign content to course
    const handleAssignContent = async () => {
        if (!selectedCourse) {
            showNotification('Please select a course first', 'error');
            return;
        }
        
        setSubmitting(true);
        
        try {
            if (multipleClassesMode) {
                await handleAddMultipleClasses();
                return;
            }
            
            // If a class is selected, add class with all selected subjects and chapters
            if (selectedClass) {
                // Get excluded subjects (all subjects of class minus selected ones)
                const allClassSubjectIds = selectedClassSubjects.map(s => s.id.toString());
                const excludeSubjects = allClassSubjectIds.filter(
                    id => !selectedSubjects.includes(id)
                );
                
                // Get excluded chapters (all chapters of selected subjects minus selected ones)
                let allChapterIds = [];
                for (const subjectId of selectedSubjects) {
                    const subjectChapterIds = (subjectChapters[subjectId] || [])
                        .map(c => c.id.toString());
                    allChapterIds = [...allChapterIds, ...subjectChapterIds];
                }
                
                const excludeChapters = allChapterIds.filter(
                    id => !selectedChapters.includes(id)
                );
                
                // Add class with exclusions
                await axios.post(
                    `${API_BASE_URL}/api/courses/${selectedCourse.id}/class/${selectedClass}`,
                    { excludeSubjects, excludeChapters },
                    { headers: getAuthHeader() }
                );
            }
            
            showNotification('Content assigned to course successfully');
            
            // Refresh course content
            fetchCourseContent(selectedCourse.id);
            
            // Reset selection states
            setSelectedClass('');
            setSelectedClassSubjects([]);
            setSelectedSubjects([]);
            setSubjectChapters({});
            setSelectedChapters([]);
            
            // Close modal
            setShowContentModal(false);
        } catch (err) {
            console.error('Error assigning content to course:', err);
            showNotification('Failed to assign content to course', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    
    // Handle course selection
    const handleSelectCourse = (course) => {
        setSelectedCourse(course);
        fetchCourseContent(course.id);
    };
    
    // Open course modal for editing
    const handleEditCourse = (course) => {
        setEditingCourse(course);
        setCourseForm({
            name: course.name,
            description: course.description || ''
        });
        setShowCourseModal(true);
    };
    
    // Open course modal for creation
    const handleNewCourse = () => {
        setEditingCourse(null);
        setCourseForm({ name: '', description: '' });
        setShowCourseModal(true);
    };
    
    // Open delete confirmation modal
    const handleDeleteCourseClick = (course) => {
        setCourseToDelete(course);
        setShowDeleteModal(true);
    };
    
    // Delete a course
    const deleteCourse = async () => {
        if (!courseToDelete) return;
        
        try {
            await axios.delete(
                `${API_BASE_URL}/api/courses/${courseToDelete.id}`,
                { headers: getAuthHeader() }
            );
            
            // Refresh courses
            fetchCourses();
            
            // Reset selected course if it was deleted
            if (selectedCourse && selectedCourse.id === courseToDelete.id) {
                setSelectedCourse(null);
                setCourseContent([]);
            }
            
            showNotification('Course deleted successfully');
        } catch (err) {
            console.error('Error deleting course:', err);
            showNotification('Failed to delete course', 'error');
        } finally {
            setShowDeleteModal(false);
            setCourseToDelete(null);
        }
    };
    
    // Remove content from a course
    const removeContentFromCourse = async (contentId) => {
        if (!selectedCourse) return;
        
        try {
            await axios.delete(
                `${API_BASE_URL}/api/courses/${selectedCourse.id}/content/${contentId}`,
                { headers: getAuthHeader() }
            );
            
            // Refresh course content
            fetchCourseContent(selectedCourse.id);
            
            showNotification('Content removed from course successfully');
        } catch (err) {
            console.error('Error removing content from course:', err);
            showNotification('Failed to remove content from course', 'error');
        }
    };
    
    // Get paginated courses for display
    const getPaginatedCourses = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return courses.slice(startIndex, endIndex);
    };
    
    // Content Assignment Modal
    const contentModalReset = () => {
        setMultipleClassesMode(false);
        setSelectedClass('');
        setSelectedClasses([]);
        setSelectedClassSubjects([]);
        setSelectedSubjects([]);
        setSubjectChapters({});
        setSelectedChapters([]);
    };
    
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
                <button
                    onClick={handleNewCourse}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Create New Course
                </button>
            </div>
            
            {/* Toast notification */}
            {notification.show && (
                <div className={`mb-4 p-3 rounded-md ${
                    notification.type === 'error' 
                        ? 'bg-red-100 border border-red-300 text-red-700' 
                        : 'bg-green-100 border border-green-300 text-green-700'
                }`}>
                    {notification.message}
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Courses list */}
                    <div className="lg:w-1/3">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Courses</h2>
                            
                            {courses.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No courses available. Create your first course.</p>
                            ) : (
                                <div>
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {getPaginatedCourses().map(course => (
                                            <li 
                                                key={course.id}
                                                className={`py-3 px-2 rounded-md cursor-pointer ${
                                                    selectedCourse?.id === course.id 
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                                }`}
                                                onClick={() => handleSelectCourse(course)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                                            {course.name}
                                                        </h3>
                                                        {course.description && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                {course.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditCourse(course);
                                                            }}
                                                            className="text-indigo-500 hover:text-indigo-700 p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCourseClick(course);
                                                            }}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className="mt-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalItems={courses.length}
                                            pageSize={pageSize}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Course details and content */}
                    <div className="lg:w-2/3">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                            {selectedCourse ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                                {selectedCourse.name}
                                            </h2>
                                            {selectedCourse.description && (
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    {selectedCourse.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowContentModal(true)}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            Assign Content
                                        </button>
                                    </div>
                                    
                                    <div className="mt-6">
                                        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                            Course Content
                                        </h3>
                                        
                                        {courseContent.length === 0 ? (
                                            <p className="text-gray-500 dark:text-gray-400">
                                                No content assigned to this course yet.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Type
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Name
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Parent
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                        {courseContent.map(content => (
                                                            <tr key={content.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                    {content.class_id ? 'Class' : content.subject_id ? 'Subject' : 'Chapter'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                    {content.class_name || content.subject_name || content.chapter_name}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                    {content.chapter_id 
                                                                        ? content.subject_name
                                                                        : content.subject_id 
                                                                            ? content.class_name
                                                                            : ''
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                    <button
                                                                        onClick={() => removeContentFromCourse(content.id)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        Select a course to view its details and content
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Course Modal */}
            <Modal
                isOpen={showCourseModal}
                onClose={() => setShowCourseModal(false)}
                title={editingCourse ? 'Edit Course' : 'Create New Course'}
            >
                <form onSubmit={handleCourseSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course Name
                        </label>
                        <input
                            type="text"
                            value={courseForm.name}
                            onChange={e => setCourseForm({...courseForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={courseForm.description}
                            onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                            rows="3"
                        />
                    </div>
                    
                    <ModalActions>
                        <SecondaryButton type="button" onClick={() => setShowCourseModal(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={submitting}>
                            {submitting ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                        </PrimaryButton>
                    </ModalActions>
                </form>
            </Modal>
            
            {/* Content Assignment Modal */}
            <Modal
                isOpen={showContentModal && selectedCourse !== null}
                onClose={() => {
                    setShowContentModal(false);
                    contentModalReset();
                }}
                title={`Assign Content to ${selectedCourse?.name || 'Course'}`}
                size="lg"
            >
                <div className="space-y-5">
                    <div className="mb-4">
                        <div className="flex space-x-4 mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setMultipleClassesMode(false);
                                    setSelectedClasses([]);
                                }}
                                className={`px-4 py-2 rounded ${
                                    !multipleClassesMode 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                Single Class
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMultipleClassesMode(true);
                                    setSelectedClass('');
                                    setSelectedClassSubjects([]);
                                    setSelectedSubjects([]);
                                    setSubjectChapters({});
                                    setSelectedChapters([]);
                                }}
                                className={`px-4 py-2 rounded ${
                                    multipleClassesMode 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                Multiple Classes
                            </button>
                        </div>
                    </div>
                    
                    {multipleClassesMode ? (
                        <div>
                            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                Select Multiple Classes
                            </h3>
                            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                                {classes.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No classes available.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {classes.map(cls => (
                                            <li key={cls.id} className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id={`class-${cls.id}`}
                                                        type="checkbox"
                                                        checked={selectedClasses.includes(cls.id.toString())}
                                                        onChange={e => handleClassSelection(cls.id.toString(), e.target.checked)}
                                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor={`class-${cls.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                                                        {cls.name}
                                                    </label>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                All selected classes with their subjects and chapters will be added to the course.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Select Class
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <option value="">-- Select a Class --</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Selecting a class will automatically select all its subjects and chapters.
                                </p>
                            </div>
                            
                            {selectedClass && (
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                        Subjects
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                                        {selectedClassSubjects.length === 0 ? (
                                            <p className="text-gray-500 dark:text-gray-400">
                                                No subjects available for this class.
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {selectedClassSubjects.map(subject => (
                                                    <li key={subject.id} className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <input
                                                                id={`subject-${subject.id}`}
                                                                type="checkbox"
                                                                checked={selectedSubjects.includes(subject.id.toString())}
                                                                onChange={e => handleSubjectSelectionChange(subject.id.toString(), e.target.checked)}
                                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <label htmlFor={`subject-${subject.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                                                                {subject.name}
                                                            </label>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {selectedSubjects.length > 0 && (
                                <div>
                                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                        Chapters
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                                        {selectedSubjects.flatMap(subjectId => 
                                            (subjectChapters[subjectId] || []).map(chapter => (
                                                <div key={chapter.id} className="mb-2">
                                                    <div className="flex items-start">
                                                        <div className="flex items-center h-5">
                                                            <input
                                                                id={`chapter-${chapter.id}`}
                                                                type="checkbox"
                                                                checked={selectedChapters.includes(chapter.id.toString())}
                                                                onChange={e => handleChapterSelectionChange(chapter.id.toString(), e.target.checked)}
                                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <div className="ml-3 text-sm">
                                                            <label htmlFor={`chapter-${chapter.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                                                                {chapter.name}
                                                            </label>
                                                            <p className="text-gray-500 dark:text-gray-400">{chapter.subject_name}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {selectedSubjects.flatMap(subjectId => 
                                            (subjectChapters[subjectId] || []).length
                                        ).reduce((a, b) => a + b, 0) === 0 && (
                                            <p className="text-gray-500 dark:text-gray-400">
                                                No chapters available for the selected subjects.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <ModalActions>
                        <SecondaryButton type="button" onClick={() => {
                            setShowContentModal(false);
                            contentModalReset();
                        }}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton 
                            type="button" 
                            onClick={handleAssignContent}
                            disabled={submitting || (
                                !multipleClassesMode && 
                                !selectedClass && 
                                selectedSubjects.length === 0 && 
                                selectedChapters.length === 0
                            ) || (
                                multipleClassesMode &&
                                selectedClasses.length === 0
                            )}
                        >
                            {submitting ? 'Assigning...' : (multipleClassesMode ? 'Add Selected Classes' : 'Assign Content')}
                        </PrimaryButton>
                    </ModalActions>
                </div>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setCourseToDelete(null);
                }}
                title="Delete Course"
            >
                <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">
                        Are you sure you want to delete the course "{courseToDelete?.name}"? This action cannot be undone.
                    </p>
                    
                    <ModalActions>
                        <SecondaryButton type="button" onClick={() => {
                            setShowDeleteModal(false);
                            setCourseToDelete(null);
                        }}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton type="button" onClick={deleteCourse}>
                            Delete Course
                        </DangerButton>
                    </ModalActions>
                </div>
            </Modal>
        </div>
    );
};

export default Courses; 