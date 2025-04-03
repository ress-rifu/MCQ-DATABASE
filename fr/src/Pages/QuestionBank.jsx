import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import { renderLatex, containsComplexTable } from '../utils/latexRenderer';
import EnhancedRichTextEditor from '../components/EnhancedRichTextEditor';
import LatexEquationModal from '../components/LatexEquationModal';
import Pagination from '../Components/Pagination';
import Modal from '../components/Modal';
import ModalActions, { PrimaryButton, SecondaryButton, DangerButton } from '../components/ModalActions';
import LaTeXRenderer from '../components/LaTeXRenderer';

const QuestionBank = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editData, setEditData] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [filteredChapters, setFilteredChapters] = useState([]);
    const [filteredEditSubjects, setFilteredEditSubjects] = useState([]);
    const [filteredEditChapters, setFilteredEditChapters] = useState([]);
    const [filters, setFilters] = useState({
        class_id: '',
        subject_id: '',
        chapter_id: '',
        classname: '',
        subject: '',
        chapter: '',
        topic: '',
        difficulty_level: '',
        reference: '',
    });
    // Sorting state
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    // Batch selection states
    const [batchSelectedIds, setBatchSelectedIds] = useState([]);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
    const [isBatchSelectionMode, setIsBatchSelectionMode] = useState(false);
    
    // Toast notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Equation modal related states
    const [showEquationModal, setShowEquationModal] = useState(false);
    const [currentEditingField, setCurrentEditingField] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Show notification function
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };

    useEffect(() => {
        fetchQuestions();
        fetchCurriculum();
        // Load any previously selected questions from localStorage
        const storedQuestions = localStorage.getItem('selectedQuestions');
        if (storedQuestions) {
            setSelectedQuestions(JSON.parse(storedQuestions));
        }
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.warn('No authentication token found - redirecting to login');
                setError('Authentication required. Please log in.');
                setLoading(false);
                navigate('/login');
                return;
            }
            
            // Include token in request headers
            console.log('Fetching questions with authentication');
            const res = await axios.get(`${API_BASE_URL}/api/questions`, {
                headers: {
                    ...getAuthHeader(),
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('Successfully fetched questions:', res.data.length);
            setQuestions(res.data);
        } catch (err) {
            console.error("Error fetching questions:", err);
            
            if (err.response) {
                console.error('Server returned error:', err.response.status, err.response.data);
                
                if (err.response.status === 401) {
                    console.warn('Authentication failed (401) - redirecting to login');
                    setError('Your session has expired. Please log in again.');
                    
                    // Clear authentication data
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // Redirect to login
                    navigate('/login');
                    return;
                } else if (err.response.status === 403) {
                    setError('Access denied. You do not have permission to view questions.');
                } else {
                    setError(`Error: ${err.response.data?.message || 'Failed to fetch questions'}`);
                }
            } else if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to the server. Please check if the backend is running.');
            } else {
                setError('Failed to fetch questions. Please try again later.');
            }
        }
        setLoading(false);
    };

    // Fetch classes, subjects and chapters
    const fetchCurriculum = async () => {
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
            console.error("Error fetching curriculum data:", err);
            showNotification("Failed to load curriculum data", "error");
        }
    };
    
    // Add useEffect to filter subjects when class changes
    useEffect(() => {
        if (filters.class_id) {
            // Convert class_id to string for comparison to ensure type matching
            const classId = String(filters.class_id);
            const filtered = subjects.filter(s => String(s.class_id) === classId);
            setFilteredSubjects(filtered);
            
            // If the current subject doesn't belong to this class, reset it
            if (filters.subject_id && !filtered.some(s => String(s.id) === String(filters.subject_id))) {
                setFilters(prev => ({ 
                    ...prev, 
                    subject_id: '',
                    subject: '',
                    chapter_id: '',
                    chapter: ''
                }));
            }
        } else {
            setFilteredSubjects([]);
            // Clear subject and chapter when class is cleared
            if (filters.subject_id || filters.chapter_id) {
                setFilters(prev => ({ 
                    ...prev, 
                    subject_id: '',
                    subject: '',
                    chapter_id: '',
                    chapter: ''
                }));
            }
        }
    }, [filters.class_id, subjects]);
    
    // Add useEffect to filter chapters when subject changes
    useEffect(() => {
        if (filters.subject_id) {
            // Convert subject_id to string for comparison to ensure type matching
            const subjectId = String(filters.subject_id);
            const filtered = chapters.filter(c => String(c.subject_id) === subjectId);
            setFilteredChapters(filtered);
            
            // If the current chapter doesn't belong to this subject, reset it
            if (filters.chapter_id && !filtered.some(c => String(c.id) === String(filters.chapter_id))) {
                setFilters(prev => ({ 
                    ...prev, 
                    chapter_id: '',
                    chapter: ''
                }));
            }
        } else {
            setFilteredChapters([]);
            // Clear chapter when subject is cleared
            if (filters.chapter_id) {
                setFilters(prev => ({ 
                    ...prev, 
                    chapter_id: '',
                    chapter: ''
                }));
            }
        }
    }, [filters.subject_id, chapters]);

    // Filter subjects based on selected class when editing
    useEffect(() => {
        if (editData?.class_id) {
            const classId = String(editData.class_id);
            setFilteredEditSubjects(subjects.filter(s => String(s.class_id) === classId));
        } else {
            setFilteredEditSubjects([]);
        }
    }, [editData?.class_id, subjects]);
    
    // Filter chapters based on selected subject when editing
    useEffect(() => {
        if (editData?.subject_id) {
            const subjectId = String(editData.subject_id);
            setFilteredEditChapters(chapters.filter(c => String(c.subject_id) === subjectId));
        } else {
            setFilteredEditChapters([]);
        }
    }, [editData?.subject_id, chapters]);

    // Handle edit field changes
    const handleEditChange = (field) => (e) => {
        const value = e.target.value;
        setEditData((prev) => ({
            ...prev,
            [field]: value
        }));
    };
    
    // Handle rich text editor changes
    const handleEditRichTextChange = (field, content) => {
        setEditData((prev) => ({
            ...prev,
            [field]: content
        }));
    };
    
    // Handle option changes
    const handleEditOptionChange = (index, content) => {
        const options = [...(editData.options || [])];
        options[index] = content;
        setEditData((prev) => ({
            ...prev,
            options
        }));
    };
    
    // Handle answer selection
    const handleEditAnswerChange = (value) => {
        setEditData((prev) => ({
            ...prev,
            answer: value
        }));
    };

    // Update Filters - handle both ID and name fields
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'class_id') {
            // When class changes, find its name
            const selectedClass = classes.find(c => String(c.id) === String(value));
            setFilters(prev => ({ 
                ...prev, 
                [name]: value,
                classname: selectedClass ? selectedClass.name : ''
            }));
        } else if (name === 'subject_id') {
            // When subject changes, find its name
            const selectedSubject = subjects.find(s => String(s.id) === String(value));
            setFilters(prev => ({ 
                ...prev, 
                [name]: value,
                subject: selectedSubject ? selectedSubject.name : ''
            }));
        } else if (name === 'chapter_id') {
            // When chapter changes, find its name
            const selectedChapter = chapters.find(c => String(c.id) === String(value));
            setFilters(prev => ({ 
                ...prev, 
                [name]: value,
                chapter: selectedChapter ? selectedChapter.name : ''
            }));
        } else {
            setFilters(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Handle sort changes
    const handleSortChange = (field) => {
        if (sortBy === field) {
            // If already sorting by this field, toggle the order
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Otherwise, sort by this field in ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };
    
    // Get sort indicator
    const getSortIndicator = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? '↑' : '↓';
    };

    const filteredQuestions = questions.filter((q) => {
        return (
            (!filters.classname || q.classname === filters.classname) &&
            (!filters.subject || q.subject === filters.subject) &&
            (!filters.chapter || q.chapter === filters.chapter) &&
            (!filters.topic || q.topic === filters.topic) &&
            (!filters.difficulty_level || q.difficulty_level === filters.difficulty_level) &&
            (!filters.reference || q.reference === filters.reference)
        );
    }).sort((a, b) => {
        // Handle sorting
        let valueA, valueB;
        
        // Get the values to compare based on sortBy
        switch (sortBy) {
            case 'id':
                valueA = a.id || 0;
                valueB = b.id || 0;
                break;
            case 'subject':
                valueA = a.subject || '';
                valueB = b.subject || '';
                break;
            case 'classname':
                valueA = a.classname || '';
                valueB = b.classname || '';
                break;
            case 'chapter':
                valueA = a.chapter || '';
                valueB = b.chapter || '';
                break;
            case 'topic':
                valueA = a.topic || '';
                valueB = b.topic || '';
                break;
            case 'difficulty_level':
                // Convert difficulty to numeric value for sorting
                const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
                valueA = difficultyMap[a.difficulty_level?.toLowerCase()] || 0;
                valueB = difficultyMap[b.difficulty_level?.toLowerCase()] || 0;
                break;
            case 'created_at':
                valueA = new Date(a.created_at || 0).getTime();
                valueB = new Date(b.created_at || 0).getTime();
                break;
            default:
                valueA = a.id || 0;
                valueB = b.id || 0;
        }
        
        // Compare the values based on sortOrder
        if (sortOrder === 'asc') {
            if (typeof valueA === 'string') {
                return valueA.localeCompare(valueB);
            }
            return valueA - valueB;
        } else {
            if (typeof valueA === 'string') {
                return valueB.localeCompare(valueA);
            }
            return valueB - valueA;
        }
    });

    // Extract Question 
    const uniqueValues = (key) => [...new Set(questions.map(q => q[key]).filter(Boolean))];

    // Handle Select Question (add to cart)
    const handleSelectQuestion = (question) => {
        const questionId = question._id || question.id;
        
        // Check if question is already selected using either _id or id
        const isAlreadySelected = selectedQuestions.some(q => {
            const currentId = q._id || q.id;
            return currentId === questionId;
        });
        
        if (!isAlreadySelected) {
            const updatedSelection = [...selectedQuestions, question];
            setSelectedQuestions(updatedSelection);
            // Store in localStorage
            localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
            showNotification('Question added to your collection');
        } else {
            showNotification('This question is already in your collection', 'warning');
        }
    };

    // Handle Remove Question from collection
    const handleRemoveQuestion = (question) => {
        const questionId = question._id || question.id;
        const updatedSelection = selectedQuestions.filter(q => {
            const currentId = q._id || q.id;
            return currentId !== questionId;
        });
        
        setSelectedQuestions(updatedSelection);
        localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
        showNotification('Question removed from your collection');
    };

    // Check if a question is in the collection
    const isInCollection = (questionId) => {
        return selectedQuestions.some(q => {
            const currentId = q._id || q.id;
            return currentId === questionId;
        });
    };

    // Batch selection handlers
    const toggleBatchSelectionMode = () => {
        setIsBatchSelectionMode(!isBatchSelectionMode);
        if (isBatchSelectionMode) {
            // Clear selections when exiting batch mode
            setBatchSelectedIds([]);
        }
    };

    const handleBatchSelect = (questionId) => {
        setBatchSelectedIds(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    };

    const selectAllQuestions = () => {
        const visibleQuestionIds = filteredQuestions.map(q => q.id || q._id);
        setBatchSelectedIds(visibleQuestionIds);
    };

    const clearSelection = () => {
        setBatchSelectedIds([]);
    };

    // Batch add to collection
    const addBatchToCollection = () => {
        if (batchSelectedIds.length === 0) {
            showNotification('Please select questions first', 'warning');
            return;
        }

        const questionsToAdd = questions.filter(q => {
            const currentId = q._id || q.id;
            return batchSelectedIds.includes(currentId);
        });
        
        const newSelectedQuestions = [...selectedQuestions];
        const addedCount = {
            added: 0,
            alreadySelected: 0
        };

        questionsToAdd.forEach(question => {
            const questionId = question._id || question.id;
            
            const isAlreadySelected = selectedQuestions.some(q => {
                const currentId = q._id || q.id;
                return currentId === questionId;
            });
            
            if (!isAlreadySelected) {
                newSelectedQuestions.push(question);
                addedCount.added++;
            } else {
                addedCount.alreadySelected++;
            }
        });

        if (addedCount.added > 0) {
            setSelectedQuestions(newSelectedQuestions);
            localStorage.setItem('selectedQuestions', JSON.stringify(newSelectedQuestions));
            
            let message = `Added ${addedCount.added} question${addedCount.added !== 1 ? 's' : ''} to your collection.`;
            if (addedCount.alreadySelected > 0) {
                message += ` (${addedCount.alreadySelected} question${addedCount.alreadySelected !== 1 ? 's were' : ' was'} already in your collection)`;
            }
            showNotification(message);

            // Exit batch mode and clear selections
            setIsBatchSelectionMode(false);
            setBatchSelectedIds([]);
        } else if (addedCount.alreadySelected > 0) {
            showNotification('All selected questions are already in your collection', 'warning');
        }
    };

    // Batch delete questions
    const openBatchDeleteModal = () => {
        if (batchSelectedIds.length === 0) {
            alert('Please select questions to delete');
            return;
        }
        setShowBatchDeleteModal(true);
    };

    const batchDeleteQuestions = async () => {
        try {
            setIsDeleting(true);
            // Sequential deletion
            for (const id of batchSelectedIds) {
                await axios.delete(`${API_BASE_URL}/api/questions/${id}`, {
                    headers: getAuthHeader()
                });
            }
            
            // Update questions list - handle both id and _id formats
            setQuestions(questions.filter(q => {
                const currentId = q.id || q._id;
                return !batchSelectedIds.includes(currentId);
            }));
            
            // Update selected questions if needed - handle both id and _id formats
            const updatedSelection = selectedQuestions.filter(q => {
                const currentId = q.id || q._id;
                return !batchSelectedIds.includes(currentId);
            });
            
            setSelectedQuestions(updatedSelection);
            localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
            
            // Close modal and reset
            setShowBatchDeleteModal(false);
            setBatchSelectedIds([]);
            setIsBatchSelectionMode(false);
            
            showNotification(`Successfully deleted ${batchSelectedIds.length} question${batchSelectedIds.length !== 1 ? 's' : ''}`);
        } catch (err) {
            console.error("Error deleting questions:", err);
            if (err.response && err.response.status === 403) {
                setError('Access denied. Your session may have expired. Please log in again.');
                showNotification('Access denied. Your session may have expired.', 'error');
            } else {
                setError(`Failed to delete questions: ${err.message}`);
                showNotification(`Failed to delete questions: ${err.message}`, 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // View selected questions
    const viewSelectedQuestions = () => {
        navigate('/myquestion');
    };

    // 🔥 Handle Delete Question
    const handleDeleteClick = (id) => {
        console.log("Deleting question with ID:", id); // Debug log
        if (!id) {
            showNotification('Cannot delete: Question ID is missing', 'error');
            return;
        }
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const deleteQuestion = async () => {
        try {
            setIsDeleting(true);
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required. Please log in.');
                showNotification('Authentication required. Please log in.', 'error');
                setIsDeleting(false);
                return;
            }

            // Check if deleteId is valid
            if (!deleteId) {
                setError('Cannot delete: Question ID is missing');
                showNotification('Cannot delete: Question ID is missing', 'error');
                setShowDeleteModal(false);
                setIsDeleting(false);
                return;
            }
            
            console.log("Sending DELETE request for ID:", deleteId); // Debug log
            
            // Handle different ID formats - could be an object with id/_.id or just the ID value
            let questionIdToDelete;
            
            if (typeof deleteId === 'object') {
                // Object with ID - try both PostgreSQL id and MongoDB _id
                questionIdToDelete = deleteId.id || deleteId._id;
            } else {
                // Direct ID value
                questionIdToDelete = deleteId;
            }
            
            if (!questionIdToDelete) {
                setError('Cannot delete: Invalid question ID format');
                showNotification('Cannot delete: Invalid question ID format', 'error');
                setShowDeleteModal(false);
                setIsDeleting(false);
                return;
            }
            
            console.log("Parsed ID for deletion:", questionIdToDelete);
            
            await axios.delete(`${API_BASE_URL}/api/questions/${questionIdToDelete}`, {
                headers: getAuthHeader()
            });
            
            // Filter from questions list using either id or _id property
            setQuestions(questions.filter((q) => {
                // Handle both id formats
                const currentId = q.id || q._id;
                return currentId !== questionIdToDelete;
            }));
            
            // Also remove from selected questions if present
            const updatedSelection = selectedQuestions.filter(q => {
                // Handle both id formats
                const currentId = q.id || q._id;
                return currentId !== questionIdToDelete;
            });
            setSelectedQuestions(updatedSelection);
            localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
            
            setShowDeleteModal(false);
            showNotification('Question deleted successfully!');
        } catch (err) {
            console.error("Error deleting question:", err);
            if (err.response && err.response.status === 403) {
                setError('Access denied. Your session may have expired. Please log in again.');
                showNotification('Access denied. Your session may have expired.', 'error');
            } else {
                setError('Failed to delete question. Please try again later.');
                showNotification('Failed to delete question. Please try again later.', 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // Improved handleEditClick to ensure question always has an ID
    const handleEditClick = (question) => {
        // Determine which ID to use - PostgreSQL numeric id or MongoDB _id
        const questionId = question.id || question._id;
        console.log("Editing question with ID:", questionId);
        
        // Generate a temporary ID if one doesn't exist
        const finalId = questionId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a clean copy with all necessary fields
        const editableQuestion = {
            id: finalId, // Set the numeric id
            _id: finalId, // Also set MongoDB style _id for consistency
            class_id: question.class_id || '',
            subject_id: question.subject_id || '',
            chapter_id: question.chapter_id || '',
            subject: question.subject || '',
            classname: question.classname || '',
            chapter: question.chapter || '',
            topic: question.topic || '',
            qserial: question.qserial || '',
            difficulty_level: question.difficulty_level || '',
            question_text: question.question_text || question.ques || '',
            question: question.question_text || question.ques || '',
            option_a: question.option_a || '',
            option_b: question.option_b || '',
            option_c: question.option_c || '',
            option_d: question.option_d || '',
            correct_answer: question.correct_answer || question.answer || '',
            answer: question.correct_answer || question.answer || '',
            explanation: question.explanation || '',
            hint: question.hint || '',
            reference: question.reference || '',
            options: [
                question.option_a || '',
                question.option_b || '',
                question.option_c || '',
                question.option_d || ''
            ], // Initialize options array with existing option values
            isTemporary: !questionId // Flag to indicate if this is a temporary ID
        };
        
        console.log("Prepared question for editing:", editableQuestion);
        setEditData(editableQuestion);
        setShowEditModal(true);
    };

    // Fix API endpoints and improve UX for adding and editing questions
    const handleSaveEdit = async (e) => {
        // Prevent default form submission if called from a form
        if (e) e.preventDefault();
        
        try {
            setIsUpdating(true);
            // Debugging information
            console.log("Saving edited question:", editData);
            console.log("Question ID:", editData._id);
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Authentication required. Please log in.');
                showNotification('Authentication required. Please log in.', 'error');
                setIsUpdating(false);
                return;
            }
            
            // Check for ID - handle both MongoDB style _id and PostgreSQL numeric id
            const questionId = editData._id || editData.id;
            
            if (!questionId) {
                console.error("Question ID is missing. Data:", editData);
                setError('Question ID is missing. Cannot update question.');
                showNotification('Failed to save: Question ID is missing', 'error');
                setIsUpdating(false);
                return;
            }
            
            // Required fields for validation
            const requiredFields = ['subject', 'classname', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
            const missingFields = requiredFields.filter(field => !editData[field]);
            
            if (missingFields.length > 0) {
                console.error("Missing required fields:", missingFields);
                showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
                setIsUpdating(false);
                return;
            }
            
            // Create a question data object that maps to backend field names
            const { isTemporary, question_text, correct_answer, ...otherFields } = editData;
            
            const questionData = {
                ...otherFields,
                ques: question_text,  // Map question_text to ques for backend
                answer: correct_answer // Map correct_answer to answer for backend
            };
            
            // Handle temporary IDs by creating a new question instead of updating
            if (isTemporary) {
                console.log("Creating new question with auto-assigned ID");
                
                // Try POST to /api/questions (root endpoint)
                const response = await axios.post(`${API_BASE_URL}/api/questions`, questionData, {
                    headers: getAuthHeader()
                });
                showNotification('New question created successfully!');
            } else {
                // Use the appropriate ID for existing questions
                const endpoint = `${API_BASE_URL}/api/questions/${questionId}`;
                console.log("Sending PUT request to:", endpoint);
                
                await axios.put(endpoint, questionData, {
                    headers: getAuthHeader()
                });
                
                showNotification('Question updated successfully!');
            }
            
            // Refresh questions after edit
            fetchQuestions();
            
            // Update the question in selected questions if present - handle both id and _id
            const updatedSelection = selectedQuestions.map(q => {
                if ((q._id && q._id === questionId) || (q.id && q.id === questionId)) {
                    return { ...q, ...editData };
                }
                return q;
            });
            setSelectedQuestions(updatedSelection);
            localStorage.setItem('selectedQuestions', JSON.stringify(updatedSelection));
            
            setEditData(null); // Clear edit data
            setShowEditModal(false);
        } catch (err) {
            console.error("Error saving question:", err);
            if (err.response && err.response.status === 403) {
                setError('Access denied. Your session may have expired. Please log in again.');
                showNotification('Access denied. Your session may have expired.', 'error');
            } else {
                setError(`Failed to save question: ${err.message}`);
                showNotification(`Failed to save question: ${err.message}`, 'error');
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const { name, files } = e.target;
        setEditData((prevData) => ({
            ...prevData,
            [name]: files[0],
        }));
    };

    // Function to render Base64 image
    const renderBase64Image = (base64String) => {
        if (!base64String) return null;
        
        try {
            // Check if it's a Base64 string (simple validation)
            if (base64String.startsWith('data:image')) {
                return (
                    <img 
                        src={base64String} 
                        alt="Base64 encoded image" 
                        className="mt-2 max-w-full h-auto rounded-md"
                    />
                );
            } else if (base64String.match(/^[A-Za-z0-9+/=]+$/)) {
                // If it's a raw Base64 string without data URI
                return (
                    <img 
                        src={`data:image/png;base64,${base64String}`} 
                        alt="Base64 encoded image" 
                        className="mt-2 max-w-full h-auto rounded-md"
                    />
                );
            }
            
            // If it's a URL, return it as is
            return (
                <img 
                    src={base64String} 
                    alt="Image from URL" 
                    className="mt-2 max-w-full h-auto rounded-md"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                        e.target.alt = "Image failed to load";
                        e.target.className = "hidden";
                    }}
                />
            );
        } catch (e) {
            console.error("Image rendering error:", e);
            return null;
        }
    };

    // Add clearFilters function
    const clearFilters = () => {
        setFilters({
            class_id: '',
            subject_id: '',
            chapter_id: '',
            classname: '',
            subject: '',
            chapter: '',
            topic: '',
            difficulty_level: '',
            reference: '',
        });
    };

    // Consistently display question text by checking all possible field names
    const getQuestionText = (question) => {
        return question.question_text || question.ques || 'No question text available';
    };

    // Improved QuestionCard for better display of question data
    const QuestionCard = ({ question, onEdit, onDelete, onAddToCollection, isBatchSelectionMode, isSelected, onSelect }) => {
        // Get the question ID - handle both PostgreSQL id and MongoDB _id
        const questionId = question.id || question._id;
        const questionInCollection = isInCollection(questionId);
        
        return (
            <div 
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                    isSelected 
                        ? 'border-indigo-500 dark:border-indigo-500' 
                        : 'border-gray-200 dark:border-gray-700'
                } hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full`}
                onClick={() => isBatchSelectionMode && onSelect(questionId)}
            >
                {/* Header with Question ID chip */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap justify-between items-start">
                        {/* Left side - Subject and Class info */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                    {question.subject || 'No Subject'} 
                                </h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">· Class {question.classname?.replace(/^Class\s+/i, '') || 'N/A'}</span>
                                {question.qserial && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">#{question.qserial}</span>
                                )}
                            </div>
                            
                            {/* Category chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {/* Question ID chip */}
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    ID: {(question.id || question._id || 'N/A').toString().substring(0, 8)}...
                                </span>
                                
                                {question.chapter && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                        {question.chapter}
                                    </span>
                                )}
                                {question.topic && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                        {question.topic}
                                    </span>
                                )}
                                {question.difficulty_level && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                        ${question.difficulty_level.toLowerCase() === 'easy' 
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                            : question.difficulty_level.toLowerCase() === 'medium' 
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                        }`}>
                                        {question.difficulty_level}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Right side - Batch selection checkbox */}
                        {isBatchSelectionMode && (
                            <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="absolute opacity-0 w-5 h-5 cursor-pointer z-10"
                                    checked={isSelected}
                                    onChange={() => onSelect(questionId)}
                                />
                                <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center ${
                                    isSelected 
                                        ? 'bg-indigo-500 border-indigo-500' 
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Question Content */}
                <div className="p-5 flex-grow">
                    {/* Question Text and Image - Notion-like styling */}
                    <div className="prose prose-sm dark:prose-invert max-w-none mb-6 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-md border border-gray-100 dark:border-gray-700/50">
                        <div className="text-base text-gray-900 dark:text-white font-medium">
                            <LaTeXRenderer content={getQuestionText(question)} />
                            {/* Direct fallback for question text if it fails to render */}
                            {getQuestionText(question) && getQuestionText(question).includes('\\begin{longtable}') && (
                                <div className="mt-3 text-sm">
                                    <strong>Question Text:</strong> {getQuestionText(question)}
                                </div>
                            )}
                        </div>
                        {question.ques_img && (
                            <div className="mt-3">
                                {renderBase64Image(question.ques_img)}
                            </div>
                        )}
                    </div>
                    
                    {/* Options */}
                    <div className="grid grid-cols-1 gap-2 mb-6">
                        {['A', 'B', 'C', 'D'].map(option => (
                            <div 
                                key={`option-${questionId}-${option}`}
                                className={`p-3 rounded-md border text-sm hover:shadow-sm transition-all duration-200 ${
                                    (question.correct_answer === option || question.answer === option)
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-[20px]">{option}:</span>
                                    <div className="flex-1">
                                        <LaTeXRenderer content={question[`option_${option.toLowerCase()}`] || ''} />
                                        {question[`option_${option.toLowerCase()}_img`] && (
                                            <div className="mt-2">
                                                {renderBase64Image(question[`option_${option.toLowerCase()}_img`])}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Answer and Explanation - Always visible */}
                    <div className="space-y-3">
                        {/* Answer */}
                        <div className="p-3 rounded-md border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/10">
                            <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <div className="text-sm font-medium text-green-700 dark:text-green-400">Answer</div>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                Option {question.correct_answer || question.answer || 'Not specified'}
                            </div>
                        </div>

                        {/* Explanation - Always visible, enhanced display */}
                        <div className="p-3 rounded-md border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10">
                            <div className="flex items-center mb-1">
                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-400">Explanation</div>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                <LaTeXRenderer content={question.explanation || 'No explanation provided'} />
                                {question.explanation_img && (
                                    <div className="mt-2">
                                        {renderBase64Image(question.explanation_img)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hint & Reference - Collapsed in a dropdown */}
                        <div className="mt-2">
                            <details className="group">
                                <summary className="flex cursor-pointer items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                    <svg className="w-4 h-4 mr-1 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Additional Information
                                </summary>
                                <div className="mt-2 space-y-3 pl-5">
                                    {/* Hint */}
                                    {(question.hint || question.hint_img) && (
                                        <div className="p-3 rounded-md border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10">
                                            <div className="flex items-center mb-1">
                                                <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Hint</div>
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                <LaTeXRenderer content={question.hint || 'No hint provided'} />
                                                {question.hint_img && (
                                                    <div className="mt-2">
                                                        {renderBase64Image(question.hint_img)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reference */}
                                    <div className="p-3 rounded-md border border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10">
                                        <div className="flex items-center mb-1">
                                            <svg className="w-4 h-4 text-purple-500 dark:text-purple-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            <div className="text-sm font-medium text-purple-700 dark:text-purple-400">Reference</div>
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {question.reference || 'No reference provided'}
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                {/* Actions - Bottom Buttons */}
                {!isBatchSelectionMode && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(question);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(question.id || question._id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                        {questionInCollection ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveQuestion(question);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove from Collection
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCollection(question);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add to Collection
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Function to open equation modal for a specific field
    const openEquationModal = (field) => {
        setCurrentEditingField(field);
        setShowEquationModal(true);
    };
    
    // Function to insert equation into the current editing field
    const insertEquation = (equation) => {
        if (!currentEditingField) return;
        
        const fieldValue = editData[currentEditingField] || '';
        // Insert the equation with $ delimiters
        setEditData(prev => ({
            ...prev,
            [currentEditingField]: `${fieldValue} $${equation}$ `
        }));
        
        setShowEquationModal(false);
    };

    // Get paginated questions
    const getPaginatedQuestions = () => {
        if (pageSize === 'all') {
            return filteredQuestions;
        }
        
        const startIndex = (currentPage - 1) * pageSize;
        return filteredQuestions.slice(startIndex, startIndex + pageSize);
    };
    
    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortBy, sortOrder]);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Floating Header */}
            <div className="sticky top-4 z-30 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Question Bank</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {questions.length} Questions · {uniqueValues('subject').length} Subjects
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                <button 
                                    onClick={() => handleEditClick({ 
                                        // Create a blank question template for adding new questions
                                        subject: '',
                                        classname: '',
                                        chapter: '',
                                        topic: '',
                                        qserial: '',
                                        difficulty_level: '',
                                        question_text: '',
                                        option_a: '',
                                        option_b: '',
                                        option_c: '',
                                        option_d: '',
                                        correct_answer: '',
                                        explanation: '',
                                        hint: '',
                                        reference: ''
                                    })}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Question
                                </button>
                                <button 
                                    onClick={toggleBatchSelectionMode}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        isBatchSelectionMode 
                                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {isBatchSelectionMode ? 'Exit Selection' : 'Select Multiple'}
                                </button>
                                
                                <button 
                                    onClick={viewSelectedQuestions}
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Collection ({selectedQuestions.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
                {/* Non-sticky Filter Bar */}
                <div className="pb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-md backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 transition-all duration-200 hover:shadow-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                            {/* Class selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                                <select
                                    name="class_id"
                                    value={filters.class_id}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Subject selection - only enable if class is selected */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <select
                                    name="subject_id"
                                    value={filters.subject_id}
                                    onChange={handleFilterChange}
                                    className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${!filters.class_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    disabled={!filters.class_id}
                                >
                                    <option value="">All Subjects</option>
                                    {filteredSubjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Chapter selection - only enable if subject is selected */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter</label>
                                <select
                                    name="chapter_id"
                                    value={filters.chapter_id}
                                    onChange={handleFilterChange}
                                    className={`w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${!filters.subject_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    disabled={!filters.subject_id}
                                >
                                    <option value="">All Chapters</option>
                                    {filteredChapters.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Topic filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                                <select
                                    name="topic"
                                    value={filters.topic}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Topics</option>
                                    {uniqueValues("topic").map((val, idx) => (
                                        <option key={`topic-${val}-${idx}`} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Difficulty level filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty Level</label>
                                <select
                                    name="difficulty_level"
                                    value={filters.difficulty_level}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Difficulty Levels</option>
                                    {uniqueValues("difficulty_level").map((val, idx) => (
                                        <option key={`difficulty-${val}-${idx}`} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Reference filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference</label>
                                <select
                                    name="reference"
                                    value={filters.reference}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All References</option>
                                    {uniqueValues("reference").map((val, idx) => (
                                        <option key={`reference-${val}-${idx}`} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Batch Selection Bar */}
                {isBatchSelectionMode && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/20 p-4 mb-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                    {batchSelectedIds.length} selected
                                </span>
                                
                                <button 
                                    onClick={selectAllQuestions}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                    Select All
                                </button>
                                
                                <button 
                                    onClick={clearSelection}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                >
                                    Clear
                                </button>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={addBatchToCollection}
                                    disabled={batchSelectedIds.length === 0}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                        batchSelectedIds.length === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    Add to Collection
                                </button>
                                
                                <button 
                                    onClick={openBatchDeleteModal}
                                    disabled={batchSelectedIds.length === 0}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                        batchSelectedIds.length === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Questions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center items-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="col-span-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-6 text-center">
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="col-span-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No questions found. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        getPaginatedQuestions().map(question => (
                            <QuestionCard
                                key={question._id || question.id}
                                question={question}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onAddToCollection={handleSelectQuestion}
                                isBatchSelectionMode={isBatchSelectionMode}
                                isSelected={batchSelectedIds.includes(question._id || question.id)}
                                onSelect={handleBatchSelect}
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                {filteredQuestions.length > 0 && (
                    <Pagination 
                        totalItems={filteredQuestions.length}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        className="mt-6"
                    />
                )}
            </div>

            {/* Custom Toast Notification */}
            {notification.show && (
                <div className="fixed bottom-4 right-4 z-[9999] animate-fade-in-up">
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Question"
                size="sm"
            >
                <div className="py-2">
                    <p className="text-gray-700 dark:text-gray-300">
                        Are you sure you want to delete this question?
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        This action cannot be undone.
                    </p>
                </div>
                
                <ModalActions>
                    <SecondaryButton onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </SecondaryButton>
                    <DangerButton 
                        onClick={deleteQuestion}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </DangerButton>
                </ModalActions>
            </Modal>

            {/* Batch Delete Confirmation Modal */}
            <Modal
                isOpen={showBatchDeleteModal}
                onClose={() => setShowBatchDeleteModal(false)}
                title="Delete Selected Questions"
                size="sm"
            >
                <div className="py-2">
                    <p className="text-gray-700 dark:text-gray-300">
                        Are you sure you want to delete {selectedQuestions.length} selected question{selectedQuestions.length !== 1 ? 's' : ''}?
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        This action cannot be undone.
                    </p>
                </div>
                
                <ModalActions>
                    <SecondaryButton onClick={() => setShowBatchDeleteModal(false)}>
                        Cancel
                    </SecondaryButton>
                    <DangerButton 
                        onClick={batchDeleteQuestions}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Selected'}
                    </DangerButton>
                </ModalActions>
            </Modal>

            {/* Edit Question Modal */}
            <Modal
                isOpen={showEditModal && !!editData}
                onClose={() => setShowEditModal(false)}
                title="Edit Question"
                size="xl"
            >
                {editData && (
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                        <div className="space-y-4">
                            {/* Class, Subject, Chapter Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Class
                                    </label>
                                    <select
                                        name="class_id"
                                        value={editData.class_id || ''}
                                        onChange={handleEditChange('class_id')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Subject
                                    </label>
                                    <select
                                        name="subject_id"
                                        value={editData.subject_id || ''}
                                        onChange={handleEditChange('subject_id')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                        required
                                        disabled={!editData.class_id}
                                    >
                                        <option value="">Select Subject</option>
                                        {filteredEditSubjects.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Chapter
                                    </label>
                                    <select
                                        name="chapter_id"
                                        value={editData.chapter_id || ''}
                                        onChange={handleEditChange('chapter_id')}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-300"
                                        required
                                        disabled={!editData.subject_id}
                                    >
                                        <option value="">Select Chapter</option>
                                        {filteredEditChapters.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.number ? `(${c.number})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Question */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Question
                                </label>
                                <div className="relative">
                                    <div className="rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                        <EnhancedRichTextEditor 
                                            value={editData.question_text || editData.question || ''}
                                            onChange={(content) => handleEditRichTextChange('question_text', content)}
                                            onEquationAdd={() => openEquationModal('question_text')}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openEquationModal('question_text')}
                                        className="absolute right-2 bottom-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        <span className="sr-only">Add Equation</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Options
                                </label>
                                <div className="space-y-3">
                                    {editData.options?.map((option, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="flex items-center h-10 mt-1">
                                                <input
                                                    id={`option-${index}`}
                                                    type="radio"
                                                    checked={editData.answer === String.fromCharCode(65 + index)}
                                                    onChange={() => handleEditAnswerChange(String.fromCharCode(65 + index))}
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded-full focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <div className="relative rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                                    <EnhancedRichTextEditor 
                                                        value={option || ''}
                                                        onChange={(content) => handleEditOptionChange(index, content)}
                                                        onEquationAdd={() => openEquationModal(`option-${index}`)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => openEquationModal(`option-${index}`)}
                                                        className="absolute right-2 bottom-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                    >
                                                        <span className="sr-only">Add Equation</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Explanation (Optional)
                                </label>
                                <div className="relative">
                                    <div className="rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 bg-white dark:bg-gray-800">
                                        <EnhancedRichTextEditor 
                                            value={editData.explanation || ''}
                                            onChange={(content) => handleEditRichTextChange('explanation', content)}
                                            onEquationAdd={() => openEquationModal('explanation')}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openEquationModal('explanation')}
                                        className="absolute right-2 bottom-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        <span className="sr-only">Add Equation</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <ModalActions>
                            <SecondaryButton type="button" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={isUpdating}>
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </PrimaryButton>
                        </ModalActions>
                    </form>
                )}
            </Modal>

            {/* Equation Modal */}
            {showEquationModal && (
                <LatexEquationModal
                    isOpen={showEquationModal}
                    onClose={() => setShowEquationModal(false)}
                    onInsert={(equation) => insertEquation(equation)}
                />
            )}
        </div>
    );
};

export default QuestionBank;

