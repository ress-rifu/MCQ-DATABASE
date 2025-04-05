import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import ChapterBulkUpload from '../Components/ChapterBulkUpload';
import TopicBulkUpload from '../Components/TopicBulkUpload';
import Pagination from '../Components/Pagination';
import Modal from '../components/Modal';

const Curriculum = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState('classes');
    
    // Data states
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [topics, setTopics] = useState([]);
    
    // Form states
    const [classForm, setClassForm] = useState({ name: '' });
    const [subjectForm, setSubjectForm] = useState({ name: '', class_id: '' });
    const [chapterForm, setChapterForm] = useState({ name: '', subject_id: '', class_id: '' });
    const [topicForm, setTopicForm] = useState({ name: '', chapter_id: '', subject_id: '', class_id: '', description: '' });
    
    // Edit mode states
    const [editingClass, setEditingClass] = useState(null);
    const [editingSubject, setEditingSubject] = useState(null);
    const [editingChapter, setEditingChapter] = useState(null);
    const [editingTopic, setEditingTopic] = useState(null);
    
    // Selection states for filtering
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');
    
    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Toast notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Loading states for buttons
    const [isSubmittingClass, setIsSubmittingClass] = useState(false);
    const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
    const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);
    const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

    // Bulk upload modal state
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showTopicBulkUploadModal, setShowTopicBulkUploadModal] = useState(false);

    // Pagination states
    const [currentClassPage, setCurrentClassPage] = useState(1);
    const [classPageSize, setClassPageSize] = useState(10);
    
    const [currentSubjectPage, setCurrentSubjectPage] = useState(1);
    const [subjectPageSize, setSubjectPageSize] = useState(10);
    
    const [currentChapterPage, setCurrentChapterPage] = useState(1);
    const [chapterPageSize, setChapterPageSize] = useState(10);

    const [currentTopicPage, setCurrentTopicPage] = useState(1);
    const [topicPageSize, setTopicPageSize] = useState(10);

    useEffect(() => {
        fetchClasses();
        fetchAllSubjects();
        fetchAllChapters();
        fetchAllTopics();
    }, []);

    // Show notification function
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };

    // Fetch all classes
    const fetchClasses = async () => {
        try {
            // Include auth headers for better debugging
            const authHeaders = getAuthHeader();
            console.log('Fetching classes with auth headers:', !!authHeaders.Authorization);
            
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/classes`,
                { headers: authHeaders }
            );
            setClasses(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching classes:", err);
            
            if (err.response) {
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
                setError(`Failed to load classes: ${err.response.data?.message || err.response.status}`);
            } else {
                setError('Failed to load classes. Please try again later.');
            }
            setLoading(false);
        }
    };

    // Fetch all subjects
    const fetchAllSubjects = async () => {
        try {
            // Include auth headers
            const authHeaders = getAuthHeader();
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/subjects`,
                { headers: authHeaders }
            );
            setSubjects(response.data);
        } catch (err) {
            console.error("Error fetching subjects:", err);
            if (err.response) {
                setError(`Failed to load subjects: ${err.response.data?.message || err.response.status}`);
            } else {
                setError('Failed to load subjects. Please try again later.');
            }
        }
    };

    // Fetch subjects for a specific class
    const fetchSubjectsForClass = async (classId) => {
        try {
            const authHeaders = getAuthHeader();
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/classes/${classId}/subjects`,
                { headers: authHeaders }
            );
            return response.data;
        } catch (err) {
            console.error("Error fetching subjects for class:", err);
            showNotification('Failed to load subjects for this class.', 'error');
            return [];
        }
    };

    // Fetch all chapters
    const fetchAllChapters = async () => {
        try {
            const authHeaders = getAuthHeader();
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/chapters`,
                { headers: authHeaders }
            );
            setChapters(response.data);
        } catch (err) {
            console.error("Error fetching chapters:", err);
            if (err.response) {
                setError(`Failed to load chapters: ${err.response.data?.message || err.response.status}`);
            } else {
                setError('Failed to load chapters. Please try again later.');
            }
        }
    };

    // Fetch chapters for a specific subject
    const fetchChaptersForSubject = async (subjectId) => {
        try {
            const authHeaders = getAuthHeader();
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/subjects/${subjectId}/chapters`,
                { headers: authHeaders }
            );
            return response.data;
        } catch (err) {
            console.error("Error fetching chapters for subject:", err);
            showNotification('Failed to load chapters for this subject.', 'error');
            return [];
        }
    };

    // Fetch topics for a specific chapter
    const fetchTopicsForChapter = async (chapterId) => {
        try {
            const authHeaders = getAuthHeader();
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/chapters/${chapterId}/topics`,
                { headers: authHeaders }
            );
            return response.data;
        } catch (err) {
            console.error("Error fetching topics for chapter:", err);
            showNotification('Failed to load topics for this chapter.', 'error');
            return [];
        }
    };

    // Fetch all topics
    const fetchAllTopics = async () => {
        try {
            const authHeaders = getAuthHeader();
            const response = await axios.get(
                `${API_BASE_URL}/api/curriculum/topics`,
                { headers: authHeaders }
            );
            setTopics(response.data);
        } catch (err) {
            console.error("Error fetching topics:", err);
            if (err.response) {
                setError(`Failed to load topics: ${err.response.data?.message || err.response.status}`);
            } else {
                setError('Failed to load topics. Please try again later.');
            }
        }
    };

    // Filter subjects by selected class
    const filteredSubjects = selectedClass 
        ? subjects.filter(subject => subject.class_id.toString() === selectedClass)
        : subjects;

    // Filter chapters by selected subject
    const filteredChapters = selectedSubject 
        ? chapters.filter(chapter => chapter.subject_id.toString() === selectedSubject)
        : chapters;

    // Filter topics by selected chapter
    const filteredTopics = selectedChapter
        ? topics.filter(topic => topic.chapter_id.toString() === selectedChapter)
        : topics;

    // Get paginated chapters
    const getPaginatedChapters = () => {
        if (chapterPageSize === 'all') {
            return filteredChapters;
        }
        
        const startIndex = (currentChapterPage - 1) * chapterPageSize;
        return filteredChapters.slice(startIndex, startIndex + chapterPageSize);
    };
    
    // Get paginated subjects
    const getPaginatedSubjects = () => {
        if (subjectPageSize === 'all') {
            return filteredSubjects;
        }
        
        const startIndex = (currentSubjectPage - 1) * subjectPageSize;
        return filteredSubjects.slice(startIndex, startIndex + subjectPageSize);
    };
    
    // Get paginated classes
    const getPaginatedClasses = () => {
        if (classPageSize === 'all') {
            return classes;
        }
        
        const startIndex = (currentClassPage - 1) * classPageSize;
        return classes.slice(startIndex, startIndex + classPageSize);
    };
    
    // Get paginated topics
    const getPaginatedTopics = () => {
        if (topicPageSize === 'all') {
            return filteredTopics;
        }
        
        const startIndex = (currentTopicPage - 1) * topicPageSize;
        return filteredTopics.slice(startIndex, startIndex + topicPageSize);
    };
    
    // Reset pagination when filters change
    useEffect(() => {
        setCurrentChapterPage(1);
    }, [selectedClass, selectedSubject]);
    
    useEffect(() => {
        setCurrentSubjectPage(1);
    }, [selectedClass]);

    useEffect(() => {
        setCurrentTopicPage(1);
    }, [selectedClass, selectedSubject, selectedChapter]);

    // ============ Class CRUD Operations ============
    
    // Handle class submission with loading state
    const handleClassSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Set loading state
            setIsSubmittingClass(true);
            
            // Ensure we have a proper token
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Authentication required. Please log in.', 'error');
                setIsSubmittingClass(false);
                return;
            }
            
            // Make sure form data is valid
            if (!classForm.name || classForm.name.trim() === '') {
                showNotification('Class name is required', 'error');
                setIsSubmittingClass(false);
                return;
            }
            
            const authHeaders = getAuthHeader();
            console.log('Sending request with auth headers:', !!authHeaders.Authorization);
            
            if (editingClass) {
                // Update existing class
                await axios.put(
                    `${API_BASE_URL}/api/curriculum/classes/${editingClass.id}`, 
                    classForm,
                    { headers: authHeaders }
                );
                showNotification('Class updated successfully');
            } else {
                // Add new class
                console.log('Sending POST request to add class:', classForm);
                const response = await axios.post(
                    `${API_BASE_URL}/api/curriculum/classes`, 
                    classForm,
                    { headers: authHeaders }
                );
                console.log('Class added successfully:', response.data);
                showNotification('Class added successfully');
            }
            
            // Reset form and refresh data
            setClassForm({ name: '' });
            setEditingClass(null);
            fetchClasses();
        } catch (err) {
            console.error("Error processing class:", err);
            // Log more detailed error information
            if (err.response) {
                console.error('Response status:', err.response.status);
                console.error('Response data:', err.response.data);
                console.error('Response headers:', err.response.headers);
                showNotification(err.response.data?.message || `Server error: ${err.response.status}`, 'error');
            } else if (err.request) {
                console.error('Request was made but no response received:', err.request);
                showNotification('No response from server. Please try again.', 'error');
            } else {
                console.error('Error details:', err.message);
                showNotification(`Error: ${err.message}`, 'error');
            }
        } finally {
            setIsSubmittingClass(false);
        }
    };
    
    const editClass = (classItem) => {
        setEditingClass(classItem);
        setClassForm({ name: classItem.name });
        
        // Switch to classes tab
        setActiveTab('classes');
    };
    
    const deleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class? This will also delete all associated subjects and chapters.')) {
            return;
        }
        
        try {
            await axios.delete(`${API_BASE_URL}/api/curriculum/classes/${id}`, 
                { headers: getAuthHeader() }
            );
            
            showNotification('Class deleted successfully');
            fetchClasses();
            fetchAllSubjects();
            fetchAllChapters();
        } catch (err) {
            console.error("Error deleting class:", err);
            showNotification(err.response?.data?.message || 'Error deleting class', 'error');
        }
    };
    
    // ============ Subject CRUD Operations ============
    
    // Handle subject submission with loading state
    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setIsSubmittingSubject(true);
            
            if (!subjectForm.name || !subjectForm.class_id) {
                showNotification('Subject name and class are required', 'warning');
                setIsSubmittingSubject(false);
                return;
            }
            
            if (editingSubject) {
                // Update existing subject
                await axios.put(`${API_BASE_URL}/api/curriculum/subjects/${editingSubject.id}`, 
                    subjectForm,
                    { headers: getAuthHeader() }
                );
                showNotification('Subject updated successfully');
            } else {
                // Add new subject
                await axios.post(`${API_BASE_URL}/api/curriculum/subjects`, 
                    subjectForm,
                    { headers: getAuthHeader() }
                );
                showNotification('Subject added successfully');
            }
            
            // Reset form and refresh data
            setSubjectForm({ name: '', class_id: '' });
            setEditingSubject(null);
            fetchAllSubjects();
        } catch (err) {
            console.error("Error processing subject:", err);
            showNotification(err.response?.data?.message || 'Error processing subject', 'error');
        } finally {
            setIsSubmittingSubject(false);
        }
    };
    
    const editSubject = (subject) => {
        setEditingSubject(subject);
        setSubjectForm({ 
            name: subject.name,
            class_id: subject.class_id 
        });
        
        // Switch to subjects tab
        setActiveTab('subjects');
    };
    
    const deleteSubject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject? This will also delete all associated chapters.')) {
            return;
        }
        
        try {
            await axios.delete(`${API_BASE_URL}/api/curriculum/subjects/${id}`, 
                { headers: getAuthHeader() }
            );
            
            showNotification('Subject deleted successfully');
            fetchAllSubjects();
            fetchAllChapters();
        } catch (err) {
            console.error("Error deleting subject:", err);
            showNotification(err.response?.data?.message || 'Error deleting subject', 'error');
        }
    };
    
    // ============ Chapter CRUD Operations ============
    
    // Handle chapter submission with loading state
    const handleChapterSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setIsSubmittingChapter(true);
            
            if (!chapterForm.class_id || !chapterForm.subject_id || !chapterForm.name) {
                showNotification('Please select a class, subject, and provide a chapter name', 'warning');
                setIsSubmittingChapter(false);
                return;
            }
            
            if (editingChapter) {
                // Update existing chapter
                await axios.put(`${API_BASE_URL}/api/curriculum/chapters/${editingChapter.id}`, 
                    { name: chapterForm.name, subject_id: chapterForm.subject_id },
                    { headers: getAuthHeader() }
                );
                showNotification('Chapter updated successfully');
            } else {
                // Add new chapter
                await axios.post(`${API_BASE_URL}/api/curriculum/chapters`, 
                    { name: chapterForm.name, subject_id: chapterForm.subject_id },
                    { headers: getAuthHeader() }
                );
                showNotification('Chapter added successfully');
            }
            
            // Reset form and refresh data
            setChapterForm({ name: '', subject_id: '', class_id: '' });
            setEditingChapter(null);
            fetchAllChapters();
        } catch (err) {
            console.error("Error processing chapter:", err);
            showNotification(err.response?.data?.message || 'Error processing chapter', 'error');
        } finally {
            setIsSubmittingChapter(false);
        }
    };
    
    const editChapter = (chapter) => {
        // Find the subject and its class
        const subject = subjects.find(s => s.id === chapter.subject_id);
        const classId = subject ? subject.class_id : '';
        
        setEditingChapter(chapter);
        setChapterForm({ 
            name: chapter.name,
            subject_id: chapter.subject_id,
            class_id: classId
        });
        
        // Switch to chapters tab
        setActiveTab('chapters');
    };
    
    const deleteChapter = async (id) => {
        if (!window.confirm('Are you sure you want to delete this chapter?')) {
            return;
        }
        
        try {
            await axios.delete(`${API_BASE_URL}/api/curriculum/chapters/${id}`, 
                { headers: getAuthHeader() }
            );
            
            showNotification('Chapter deleted successfully');
            fetchAllChapters();
        } catch (err) {
            console.error("Error deleting chapter:", err);
            showNotification(err.response?.data?.message || 'Error deleting chapter', 'error');
        }
    };

    // Handle class selection change
    const handleClassChange = async (e) => {
        const classId = e.target.value;
        setSelectedClass(classId);
        
        if (classId) {
            const classSubjects = await fetchSubjectsForClass(classId);
            if (classSubjects.length > 0) {
                setSelectedSubject(classSubjects[0].id);
                const subjectChapters = await fetchChaptersForSubject(classSubjects[0].id);
            } else {
                setSelectedSubject('');
            }
        } else {
            setSelectedSubject('');
        }
    };

    // Handle subject selection change
    const handleSubjectChange = async (e) => {
        const subjectId = e.target.value;
        setSelectedSubject(subjectId);
        
        if (subjectId) {
            await fetchChaptersForSubject(subjectId);
        }
    };

    // Handle chapter selection change for topics
    const handleChapterChange = async (e) => {
        const chapterId = e.target.value;
        setSelectedChapter(chapterId);
        
        if (chapterId) {
            await fetchTopicsForChapter(chapterId);
        }
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        
        // Reset form states when changing tabs
        setClassForm({ name: '' });
        setSubjectForm({ name: '', class_id: '' });
        setChapterForm({ name: '', subject_id: '', class_id: '' });
        setTopicForm({ name: '', chapter_id: '', subject_id: '', class_id: '', description: '' });
        
        // Reset editing states
        setEditingClass(null);
        setEditingSubject(null);
        setEditingChapter(null);
        setEditingTopic(null);
        
        // Hide bulk upload modal
        setShowBulkUploadModal(false);
        setShowTopicBulkUploadModal(false);
    };

    // Handle bulk upload success
    const handleBulkUploadSuccess = (data) => {
        // Refresh chapters after successful upload
        fetchAllChapters();
        
        // If we have a specific subject selected, also refresh the chapters for that subject
        if (selectedSubject) {
            fetchChaptersForSubject(selectedSubject);
        }
        
        // Show success notification
        showNotification(`Chapters uploaded successfully: ${data.results.inserted} inserted, ${data.results.duplicates} duplicates`);
    };

    // Handle topic bulk upload success
    const handleTopicBulkUploadSuccess = (data) => {
        // Refresh topics after successful upload
        fetchAllTopics();
        
        // If we have a specific chapter selected, also refresh the topics for that chapter
        if (selectedChapter) {
            fetchTopicsForChapter(selectedChapter);
        }
        
        // Show success notification
        showNotification(`Topics uploaded successfully: ${data.results.inserted} inserted, ${data.results.duplicates} duplicates`);
    };

    // Handle topic form submission
    const handleTopicSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setIsSubmittingTopic(true);
            
            if (!topicForm.chapter_id || !topicForm.name) {
                showNotification('Please select a chapter and provide a topic name', 'warning');
                setIsSubmittingTopic(false);
                return;
            }
            
            if (editingTopic) {
                // Update existing topic
                await axios.put(`${API_BASE_URL}/api/curriculum/topics/${editingTopic.id}`, 
                    { 
                        name: topicForm.name, 
                        chapter_id: topicForm.chapter_id,
                        description: topicForm.description
                    },
                    { headers: getAuthHeader() }
                );
                showNotification('Topic updated successfully');
            } else {
                // Add new topic
                await axios.post(`${API_BASE_URL}/api/curriculum/topics`, 
                    { 
                        name: topicForm.name, 
                        chapter_id: topicForm.chapter_id,
                        description: topicForm.description 
                    },
                    { headers: getAuthHeader() }
                );
                showNotification('Topic added successfully');
            }
            
            // Reset form and refresh data
            setTopicForm({ name: '', chapter_id: '', subject_id: '', class_id: '', description: '' });
            setEditingTopic(null);
            fetchAllTopics();
        } catch (err) {
            console.error("Error processing topic:", err);
            showNotification(err.response?.data?.message || 'Error processing topic', 'error');
        } finally {
            setIsSubmittingTopic(false);
        }
    };
    
    const editTopic = (topic) => {
        // Find the chapter, subject, and class
        const chapter = chapters.find(c => c.id === topic.chapter_id);
        const subjectId = chapter ? chapter.subject_id : '';
        const subject = subjects.find(s => s.id === subjectId);
        const classId = subject ? subject.class_id : '';
        
        setEditingTopic(topic);
        setTopicForm({ 
            name: topic.name,
            chapter_id: topic.chapter_id,
            subject_id: subjectId,
            class_id: classId,
            description: topic.description || ''
        });
        
        // Switch to topics tab
        setActiveTab('topics');
    };
    
    const deleteTopic = async (id) => {
        if (!window.confirm('Are you sure you want to delete this topic?')) {
            return;
        }
        
        try {
            await axios.delete(`${API_BASE_URL}/api/curriculum/topics/${id}`, 
                { headers: getAuthHeader() }
            );
            
            showNotification('Topic deleted successfully');
            fetchAllTopics();
        } catch (err) {
            console.error("Error deleting topic:", err);
            showNotification(err.response?.data?.message || 'Error deleting topic', 'error');
        }
    };

    // Tab component
    const Tab = ({ id, label, active, onClick }) => (
        <button
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                active 
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => onClick(id)}
        >
            {label}
        </button>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Curriculum Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage classes, subjects, chapters, and topics for the question bank
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                        <Tab 
                            id="classes" 
                            label="Classes" 
                            active={activeTab === 'classes'} 
                            onClick={handleTabChange} 
                        />
                        <Tab 
                            id="subjects" 
                            label="Subjects" 
                            active={activeTab === 'subjects'} 
                            onClick={handleTabChange} 
                        />
                        <Tab 
                            id="chapters" 
                            label="Chapters" 
                            active={activeTab === 'chapters'} 
                            onClick={handleTabChange} 
                        />
                        <Tab 
                            id="topics" 
                            label="Topics" 
                            active={activeTab === 'topics'} 
                            onClick={handleTabChange} 
                        />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    {/* Classes Tab */}
                    {activeTab === 'classes' && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {editingClass ? 'Edit Class' : 'Add New Class'}
                            </h2>
                            <form onSubmit={handleClassSubmit} className="mb-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-grow">
                                        <input
                                            type="text"
                                            value={classForm.name}
                                            onChange={(e) => setClassForm({ name: e.target.value })}
                                            placeholder="Class Name (e.g., Class 8)"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center min-w-[100px]"
                                            disabled={isSubmittingClass}
                                        >
                                            {isSubmittingClass ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                editingClass ? 'Update Class' : 'Add Class'
                                            )}
                                        </button>
                                        {editingClass && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingClass(null);
                                                    setClassForm({ name: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>

                            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                Classes
                            </h3>
                            {classes.length === 0 ? (
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">No classes found. Add a class to get started.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subjects Count</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                                {getPaginatedClasses().map(c => (
                                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{c.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {subjects.filter(s => s.class_id === c.id).length}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => editClass(c)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => deleteClass(c.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Pagination for classes */}
                                    <Pagination 
                                        totalItems={classes.length}
                                        currentPage={currentClassPage}
                                        pageSize={classPageSize}
                                        onPageChange={setCurrentClassPage}
                                        onPageSizeChange={setClassPageSize}
                                        className="mt-4"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Subjects Tab */}
                    {activeTab === 'subjects' && (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                            </h2>
                            <form onSubmit={handleSubjectSubmit} className="mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                                        <select
                                            value={subjectForm.class_id}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, class_id: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                                        <input
                                            type="text"
                                            value={subjectForm.name}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                            placeholder="Subject Name (e.g., Physics)"
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center min-w-[100px]"
                                            disabled={isSubmittingSubject}
                                        >
                                            {isSubmittingSubject ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                editingSubject ? 'Update Subject' : 'Add Subject'
                                            )}
                                        </button>
                                        {editingSubject && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSubject(null);
                                                    setSubjectForm({ name: '', class_id: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>

                            <div className="flex justify-between items-center mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                    {selectedClass 
                                        ? `Subjects for ${classes.find(c => c.id.toString() === selectedClass)?.name || 'Selected Class'}`
                                        : 'All Subjects'
                                    }
                                </h3>
                                
                                <div>
                                    <select
                                        value={selectedClass}
                                        onChange={handleClassChange}
                                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                                    >
                                        <option value="">All Classes</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        
                            {filteredSubjects.length === 0 ? (
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {selectedClass 
                                            ? `No subjects found for this class. Add a subject to get started.` 
                                            : `No subjects found. Add a subject to get started.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chapters Count</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                                {getPaginatedSubjects().map(subject => (
                                                    <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{subject.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{subject.class_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                            {chapters.filter(c => c.subject_id === subject.id).length}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => editSubject(subject)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSubject(subject.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Pagination for subjects */}
                                    <Pagination 
                                        totalItems={filteredSubjects.length}
                                        currentPage={currentSubjectPage}
                                        pageSize={subjectPageSize}
                                        onPageChange={setCurrentSubjectPage}
                                        onPageSizeChange={setSubjectPageSize}
                                        className="mt-4"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Chapters Tab */}
                    {activeTab === 'chapters' && (
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chapters</h2>
                                <div>
                                    <button 
                                        onClick={() => setShowBulkUploadModal(true)}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        Bulk Upload
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
                                </h2>
                                <form onSubmit={handleChapterSubmit} className="mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                                            <select
                                                value={chapterForm.class_id || ''}
                                                onChange={(e) => {
                                                    const classId = e.target.value;
                                                    setChapterForm({ 
                                                        ...chapterForm, 
                                                        class_id: classId,
                                                        subject_id: '' // Reset subject when class changes
                                                    });
                                                }}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                            <select
                                                value={chapterForm.subject_id}
                                                onChange={(e) => setChapterForm({ ...chapterForm, subject_id: e.target.value })}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                                disabled={!chapterForm.class_id}
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects
                                                    .filter(s => s.class_id.toString() === chapterForm.class_id?.toString())
                                                    .map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter Name</label>
                                            <input
                                                type="text"
                                                value={chapterForm.name}
                                                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                                                placeholder="Chapter Name (e.g., Motion and Time)"
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                                disabled={!chapterForm.subject_id}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center min-w-[100px]"
                                            disabled={!chapterForm.subject_id || isSubmittingChapter}
                                        >
                                            {isSubmittingChapter ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                editingChapter ? 'Update Chapter' : 'Add Chapter'
                                            )}
                                        </button>
                                        {editingChapter && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingChapter(null);
                                                    setChapterForm({ name: '', subject_id: '', class_id: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="mb-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {selectedSubject 
                                            ? `Chapters for ${subjects.find(s => s.id.toString() === selectedSubject)?.name || 'Selected Subject'}`
                                            : 'All Chapters'
                                        }
                                    </h3>
                                    
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <select
                                            value={selectedClass}
                                            onChange={handleClassChange}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm shadow-sm"
                                        >
                                            <option value="">All Classes</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={selectedSubject}
                                            onChange={handleSubjectChange}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm shadow-sm"
                                            disabled={!selectedClass}
                                        >
                                            <option value="">All Subjects</option>
                                            {filteredSubjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {filteredChapters.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {selectedSubject 
                                                ? `No chapters found for this subject. Add a chapter to get started.` 
                                                : `No chapters found. Add a chapter to get started.`
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chapter Name</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                                    {getPaginatedChapters().map(chapter => (
                                                        <tr key={chapter.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{chapter.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{chapter.subject_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{chapter.class_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => editChapter(chapter)}
                                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteChapter(chapter.id)}
                                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {/* Pagination for chapters */}
                                        <Pagination 
                                            totalItems={filteredChapters.length}
                                            currentPage={currentChapterPage}
                                            pageSize={chapterPageSize}
                                            onPageChange={setCurrentChapterPage}
                                            onPageSizeChange={setChapterPageSize}
                                            className="mt-4"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Topics Tab */}
                    {activeTab === 'topics' && (
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Topics</h2>
                                <div>
                                    <button 
                                        onClick={() => setShowTopicBulkUploadModal(true)}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        Bulk Upload
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {editingTopic ? 'Edit Topic' : 'Add New Topic'}
                                </h2>
                                <form onSubmit={handleTopicSubmit} className="mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                                            <select
                                                value={topicForm.class_id || ''}
                                                onChange={(e) => {
                                                    const classId = e.target.value;
                                                    setTopicForm({ 
                                                        ...topicForm, 
                                                        class_id: classId,
                                                        subject_id: '', // Reset subject when class changes
                                                        chapter_id: ''  // Reset chapter when class changes
                                                    });
                                                }}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                            <select
                                                value={topicForm.subject_id || ''}
                                                onChange={(e) => {
                                                    setTopicForm({ 
                                                        ...topicForm, 
                                                        subject_id: e.target.value,
                                                        chapter_id: '' // Reset chapter when subject changes
                                                    });
                                                }}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                                disabled={!topicForm.class_id}
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects
                                                    .filter(s => s.class_id?.toString() === topicForm.class_id?.toString())
                                                    .map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter</label>
                                            <select
                                                value={topicForm.chapter_id || ''}
                                                onChange={(e) => setTopicForm({ ...topicForm, chapter_id: e.target.value })}
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                                disabled={!topicForm.subject_id}
                                            >
                                                <option value="">Select Chapter</option>
                                                {chapters
                                                    .filter(c => c.subject_id?.toString() === topicForm.subject_id?.toString())
                                                    .map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic Name</label>
                                            <input
                                                type="text"
                                                value={topicForm.name}
                                                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                                                placeholder="Topic Name (e.g., Newton's Laws)"
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                                disabled={!topicForm.chapter_id}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                            <textarea
                                                value={topicForm.description || ''}
                                                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                                                placeholder="Brief description of the topic (optional)"
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                rows="3"
                                                disabled={!topicForm.chapter_id}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center min-w-[100px]"
                                            disabled={!topicForm.chapter_id || isSubmittingTopic}
                                        >
                                            {isSubmittingTopic ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                editingTopic ? 'Update Topic' : 'Add Topic'
                                            )}
                                        </button>
                                        {editingTopic && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingTopic(null);
                                                    setTopicForm({ name: '', chapter_id: '', subject_id: '', class_id: '', description: '' });
                                                }}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            
                            <div className="mb-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {selectedChapter
                                            ? `Topics for ${chapters.find(c => c.id.toString() === selectedChapter)?.name || 'Selected Chapter'}`
                                            : 'All Topics'
                                        }
                                    </h3>
                                    
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <select
                                            value={selectedClass}
                                            onChange={handleClassChange}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm shadow-sm"
                                        >
                                            <option value="">All Classes</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={selectedSubject}
                                            onChange={handleSubjectChange}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm shadow-sm"
                                            disabled={!selectedClass}
                                        >
                                            <option value="">All Subjects</option>
                                            {filteredSubjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={selectedChapter}
                                            onChange={handleChapterChange}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm shadow-sm"
                                            disabled={!selectedSubject}
                                        >
                                            <option value="">All Chapters</option>
                                            {filteredChapters.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                {filteredTopics.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {selectedChapter 
                                                ? `No topics found for this chapter. Add a topic to get started.` 
                                                : `No topics found. Add a topic to get started.`
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Topic Name</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chapter</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                                    {getPaginatedTopics().map(topic => (
                                                        <tr key={topic.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                                <div>
                                                                    <p className="font-medium">{topic.name}</p>
                                                                    {topic.description && (
                                                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate max-w-xs">{topic.description}</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{topic.chapter_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{topic.subject_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{topic.class_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => editTopic(topic)}
                                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteTopic(topic.id)}
                                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {/* Pagination for topics */}
                                        <Pagination 
                                            totalItems={filteredTopics.length}
                                            currentPage={currentTopicPage}
                                            pageSize={topicPageSize}
                                            onPageChange={setCurrentTopicPage}
                                            onPageSizeChange={setTopicPageSize}
                                            className="mt-4"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Toast Notification */}
            {notification.show && (
                <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
                    <div className={`px-6 py-3 rounded-md shadow-xl flex items-center ${
                        notification.type === 'error' 
                            ? 'bg-red-600 text-white' 
                            : notification.type === 'warning'
                                ? 'bg-amber-500 text-white'
                                : 'bg-green-600 text-white'
                    }`}>
                        <span className="mr-2">
                            {notification.type === 'error' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : notification.type === 'warning' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </span>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal for Chapters */}
            <Modal
                isOpen={showBulkUploadModal}
                onClose={() => setShowBulkUploadModal(false)}
                title="Bulk Upload Chapters"
                size="lg"
            >
                <ChapterBulkUpload 
                    onSuccess={(data) => {
                        fetchAllChapters();
                        setShowBulkUploadModal(false);
                        handleBulkUploadSuccess(data);
                    }}
                    onCancel={() => setShowBulkUploadModal(false)}
                    classes={classes}
                    subjects={subjects}
                />
            </Modal>

            {/* Bulk Upload Modal for Topics */}
            <Modal
                isOpen={showTopicBulkUploadModal}
                onClose={() => setShowTopicBulkUploadModal(false)}
                title="Bulk Upload Topics"
                size="lg"
            >
                <TopicBulkUpload 
                    onSuccess={(data) => {
                        fetchAllTopics();
                        setShowTopicBulkUploadModal(false);
                        handleTopicBulkUploadSuccess(data);
                    }}
                    onCancel={() => setShowTopicBulkUploadModal(false)}
                    classes={classes}
                    subjects={subjects}
                    chapters={chapters}
                />
            </Modal>
        </div>
    );
};

export default Curriculum;