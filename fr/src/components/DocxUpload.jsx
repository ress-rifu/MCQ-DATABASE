import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import { FiUpload, FiFileText, FiCheck, FiInfo, FiX } from 'react-icons/fi';

const DocxUpload = ({ onSuccess, onError }) => {
    // Component state
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isSelectionValid, setIsSelectionValid] = useState(false);

    // Fetch classes on component mount
    useEffect(() => {
        fetchClasses();
    }, []);

    // Check if selection is valid when selection changes
    useEffect(() => {
        setIsSelectionValid(selectedClass !== '' && selectedSubject !== '');
    }, [selectedClass, selectedSubject]);

    // Update subjects when class selection changes
    useEffect(() => {
        if (selectedClass) {
            fetchSubjectsForClass(selectedClass);
        } else {
            setSubjects([]);
            setSelectedSubject('');
        }
    }, [selectedClass]);

    // Fetch all classes
    const fetchClasses = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/curriculum/classes`, {
                headers: getAuthHeader()
            });
            setClasses(response.data || []);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to fetch classes. Please try again.');
        }
    };

    // Fetch subjects for a class
    const fetchSubjectsForClass = async (classId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/curriculum/classes/${classId}/subjects`, {
                headers: getAuthHeader()
            });
            setSubjects(response.data || []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
            setError('Failed to fetch subjects. Please try again.');
        }
    };

    // Handle class selection change
    const handleClassChange = (e) => {
        setSelectedClass(e.target.value);
    };

    // Handle subject selection change
    const handleSubjectChange = (e) => {
        setSelectedSubject(e.target.value);
    };

    // Reset form
    const resetForm = () => {
        setFile(null);
        setError('');
        setSuccess('');
        setPreviewData(null);
        setUploadStep(1);
        setSelectedClass('');
        setSelectedSubject('');
    };

    // Move to file upload after selection
    const handleContinueToUpload = () => {
        if (!isSelectionValid) {
            setError('Please select both a class and subject before continuing');
            return;
        }
        setError('');
        setUploadStep(2);
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            if (!selectedFile.name.match(/\.(docx)$/)) {
                setError('Please upload a Word document (.docx)');
                setFile(null);
                return;
            }
            
            setFile(selectedFile);
            setError('');
            analyzeDocxFile(selectedFile);
        }
    };

    // Analyze DOCX file to extract MCQs
    const analyzeDocxFile = async (file) => {
        setIsUploading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('classId', selectedClass);
            formData.append('subjectId', selectedSubject);
            
            // Add class and subject names
            const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass));
            const selectedSubjectObj = subjects.find(s => String(s.id) === String(selectedSubject));
            
            formData.append('className', selectedClassObj ? selectedClassObj.name : '');
            formData.append('subjectName', selectedSubjectObj ? selectedSubjectObj.name : '');
            
            const response = await axios.post(
                `${API_BASE_URL}/api/docx/analyze`,
                formData,
                {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setPreviewData(response.data.preview || []);
            setUploadStep(3);
        } catch (err) {
            console.error('Error analyzing DOCX file:', err);
            setError('Failed to analyze the Word document. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle upload of analyzed data
    const handleUpload = async () => {
        setIsUploading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('classId', selectedClass);
            formData.append('subjectId', selectedSubject);
            
            // Add class and subject names
            const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass));
            const selectedSubjectObj = subjects.find(s => String(s.id) === String(selectedSubject));
            
            formData.append('className', selectedClassObj ? selectedClassObj.name : '');
            formData.append('subjectName', selectedSubjectObj ? selectedSubjectObj.name : '');
            
            const response = await axios.post(
                `${API_BASE_URL}/api/docx/import`,
                formData,
                {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setSuccess(`Successfully imported ${response.data.inserted} questions. ${response.data.duplicates || 0} duplicates were skipped.`);
            setUploadStep(4);
            
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            console.error('Error importing MCQs:', err);
            setError('Failed to import MCQs. Please try again.');
            if (onError) {
                onError(err);
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Render the MCQ preview
    const renderPreview = () => {
        if (!previewData || previewData.length === 0) {
            return (
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400">No MCQs found in the document</p>
                </div>
            );
        }

        return (
            <div className="overflow-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Question
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Options
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Answer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Topic
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {previewData.slice(0, 10).map((mcq, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {mcq.Serial || index + 1}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                    <div className="max-w-md">{mcq.Question}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="max-w-sm">
                                        <div>A: {mcq.OptionA}</div>
                                        <div>B: {mcq.OptionB}</div>
                                        <div>C: {mcq.OptionC}</div>
                                        <div>D: {mcq.OptionD}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {mcq.Answer}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {mcq.Topic}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {previewData.length > 10 && (
                    <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                        Showing 10 of {previewData.length} MCQs
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg overflow-hidden">
            {/* Steps indicator */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={`step-${step}`} className="flex flex-col items-center">
                            <div 
                                className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 
                                    ${uploadStep > step 
                                        ? 'bg-green-500 dark:bg-green-600 text-white'
                                        : uploadStep === step
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md ring-4 ring-indigo-100 dark:ring-indigo-900/30'
                                            : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {uploadStep > step ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="text-sm font-medium">{step}</span>
                                )}
                            </div>
                            <span className={`text-xs font-medium ${
                                uploadStep >= step 
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {step === 1 ? 'Select' : step === 2 ? 'Upload' : step === 3 ? 'Review' : 'Results'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content area */}
            <div className="p-6">
                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500 text-red-700 dark:text-red-400">
                        <div className="flex items-center">
                            <FiX className="h-5 w-5 mr-2 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    </div>
                )}
                
                {/* Success message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-500 text-green-700 dark:text-green-400">
                        <div className="flex items-center">
                            <FiCheck className="h-5 w-5 mr-2 flex-shrink-0" />
                            <p>{success}</p>
                        </div>
                    </div>
                )}

                {/* Step 1: Select class and subject */}
                {uploadStep === 1 && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Step 1: Select Class and Subject
                        </h3>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Class
                            </label>
                            <select
                                value={selectedClass}
                                onChange={handleClassChange}
                                className="block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select a class</option>
                                {classes.map((classItem) => (
                                    <option key={classItem.id} value={classItem.id}>
                                        {classItem.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Subject
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={handleSubjectChange}
                                className="block w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={!selectedClass}
                            >
                                <option value="">Select a subject</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                            {!selectedClass && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Please select a class first
                                </p>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleContinueToUpload}
                                disabled={!isSelectionValid}
                                className={`px-4 py-2 rounded-md text-white font-medium ${
                                    isSelectionValid
                                        ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                        : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                }`}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Upload DOCX file */}
                {uploadStep === 2 && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Step 2: Upload Word Document
                        </h3>
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Upload a Word document (.docx) containing multiple-choice questions. The system will automatically extract MCQs from the document.
                            </p>
                            <div className="flex items-center justify-center w-full">
                                <label 
                                    htmlFor="file-upload" 
                                    className="flex flex-col items-center justify-center w-full h-60 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FiFileText className="w-12 h-12 mb-4 text-gray-400" />
                                        <p className="mb-2 text-base text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Word documents only (.docx)
                                        </p>
                                    </div>
                                    <input 
                                        id="file-upload" 
                                        type="file" 
                                        accept=".docx" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                            
                            {isUploading && (
                                <div className="mt-6 text-center">
                                    <div className="inline-flex items-center px-4 py-2 font-medium text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full">
                                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing document...
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                onClick={() => setUploadStep(1)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review extracted MCQs */}
                {uploadStep === 3 && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Step 3: Review Extracted MCQs
                        </h3>
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Review the MCQs extracted from your document. If everything looks correct, click "Import MCQs" to add them to the database.
                            </p>
                            {renderPreview()}
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                onClick={() => setUploadStep(2)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !previewData || previewData.length === 0}
                                className={`px-4 py-2 rounded-md text-white font-medium ${
                                    isUploading || !previewData || previewData.length === 0
                                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                }`}
                            >
                                {isUploading ? 'Importing...' : 'Import MCQs'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Results */}
                {uploadStep === 4 && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Step 4: Results
                        </h3>
                        <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                    <FiCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
                                        Success!
                                    </h3>
                                    <p className="text-green-700 dark:text-green-400">
                                        {success}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Upload Another Document
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocxUpload; 