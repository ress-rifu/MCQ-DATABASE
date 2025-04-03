import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';

const ChapterBulkUpload = ({ onSuccess, onCancel, classes, subjects }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [sheetNames, setSheetNames] = useState([]);
    const [uploadStep, setUploadStep] = useState(1); // 1: Selection, 2: File upload, 3: Sheet selection, 4: Results
    
    // Class and subject selection
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [isSelectionValid, setIsSelectionValid] = useState(false);

    // Watch for class selection changes to filter subjects
    useEffect(() => {
        if (selectedClass) {
            const filtered = subjects.filter(subject => subject.class_id.toString() === selectedClass);
            setFilteredSubjects(filtered);
            
            // Reset subject selection if the current selection doesn't belong to this class
            if (selectedSubject && !filtered.some(s => s.id.toString() === selectedSubject)) {
                setSelectedSubject('');
            }
        } else {
            setFilteredSubjects([]);
            setSelectedSubject('');
        }
    }, [selectedClass, subjects]);

    // Validate selection
    useEffect(() => {
        setIsSelectionValid(!!selectedClass && !!selectedSubject);
    }, [selectedClass, selectedSubject]);

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
        setSelectedSheet('');
        setSheetNames([]);
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
            if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
                setError('Please upload an Excel file (.xlsx or .xls)');
                setFile(null);
                return;
            }
            
            setFile(selectedFile);
            setError('');
            analyzExcelFile(selectedFile);
        }
    };

    // Analyze Excel file to extract sheet names and preview data
    const analyzExcelFile = async (file) => {
        setIsUploading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post(
                `${API_BASE_URL}/api/test/analyze-excel`,
                formData,
                {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setSheetNames(response.data.sheets || []);
            setPreviewData(response.data.preview || {});
            
            if (response.data.sheets?.length > 0) {
                setSelectedSheet(response.data.sheets[0]);
                setUploadStep(3);
            } else {
                setError('No sheets found in the uploaded Excel file');
            }
        } catch (err) {
            console.error('Error analyzing Excel file:', err);
            setError('Failed to analyze the Excel file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle sheet selection
    const handleSheetChange = (e) => {
        setSelectedSheet(e.target.value);
    };

    // Handle chapter upload
    const handleUpload = async () => {
        if (!file || !selectedSheet) {
            setError('Please select a file and sheet');
            return;
        }
        
        if (!selectedClass || !selectedSubject) {
            setError('Class and Subject must be selected');
            return;
        }
        
        setIsUploading(true);
        setError('');
        
        try {
            // Log the values we're using for debugging
            console.log('Upload request parameters:', {
                classId: selectedClass,
                subjectId: selectedSubject,
                className: getClassName(),
                subjectName: getSubjectName(),
                sheet: selectedSheet
            });
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sheetName', selectedSheet);
            
            // Ensure we're passing classId and subjectId as strings
            formData.append('classId', selectedClass.toString());
            formData.append('subjectId', selectedSubject.toString());
            
            // Debug formData
            console.log('FormData entries:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + (pair[0] === 'file' ? pair[1].name : pair[1]));
            }
            
            const authHeaders = getAuthHeader();
            console.log('Auth headers present:', !!authHeaders.Authorization);
            console.log('API URL:', `${API_BASE_URL}/api/curriculum/bulk-upload-chapters`);
            
            const response = await axios.post(
                `${API_BASE_URL}/api/curriculum/bulk-upload-chapters`,
                formData,
                {
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            console.log('Upload successful, response:', response.data);
            
            setSuccess(`Successfully uploaded chapters: ${response.data.results.inserted} inserted, ${response.data.results.duplicates} duplicates, ${response.data.results.errors.length} errors`);
            setUploadStep(4);
            
            // Notify parent component of success
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            console.error('Error uploading chapters:', err);
            
            // More detailed error logging
            if (err.response) {
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
                
                // Try to extract a meaningful error message
                const errorMessage = err.response.data?.message || err.response.data?.error || `Server error: ${err.response.status}`;
                setError(`Upload failed: ${errorMessage}`);
            } else if (err.request) {
                console.error('No response received:', err.request);
                setError('Upload failed: No response from server. Please check your connection.');
            } else {
                console.error('Error message:', err.message);
                setError(`Upload failed: ${err.message}`);
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Helper function to get class name from ID
    const getClassName = () => {
        const classObj = classes.find(c => c.id.toString() === selectedClass);
        return classObj ? classObj.name : '';
    };

    // Helper function to get subject name from ID
    const getSubjectName = () => {
        const subjectObj = subjects.find(s => s.id.toString() === selectedSubject);
        return subjectObj ? subjectObj.name : '';
    };

    // Handle component closing
    const handleClose = () => {
        if (onCancel) {
            onCancel();
        }
    };

    // Render steps indicator
    const renderSteps = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between relative">
                {/* Line connecting all steps */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                
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
                            {step === 1 ? 'Select' : step === 2 ? 'Upload' : step === 3 ? 'Configure' : 'Results'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    // Render data preview table
    const renderPreview = () => {
        if (!previewData || !previewData[selectedSheet]) return null;
        
        const sheetData = previewData[selectedSheet];
        const headers = sheetData[0] || [];
        const rows = sheetData.slice(1, 6); // Show first 5 rows for preview
        
        return (
            <div className="mt-6 overflow-x-auto">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Preview (First 5 rows):</div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {headers.map((header, idx) => (
                                    <th 
                                        key={`header-${idx}`}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {rows.map((row, rowIdx) => (
                                <tr key={`row-${rowIdx}`} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                                    {row.map((cell, cellIdx) => (
                                        <td 
                                            key={`cell-${rowIdx}-${cellIdx}`}
                                            className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            {cell === null ? <span className="text-gray-400 dark:text-gray-500">-</span> : cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Note: This is a preview of the data. Make sure the first row contains valid column headers.
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full shadow-sm">
            <div className="py-5 px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bulk Upload Chapters</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Upload multiple chapters from an Excel file
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-6">
                {/* Steps indicator */}
                {renderSteps()}
                
                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                        <div className="flex">
                            <svg className="h-5 w-5 text-red-400 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    </div>
                )}
                
                {/* Success message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
                        <div className="flex">
                            <svg className="h-5 w-5 text-green-400 dark:text-green-500 mt-0.5 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-6 mb-6">
                    {/* Step 1: Class and Subject Selection */}
                    {uploadStep === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Class
                                </label>
                                <select
                                    id="class-select"
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                >
                                    <option value="">Select a Class</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Subject
                                </label>
                                <select
                                    id="subject-select"
                                    value={selectedSubject}
                                    onChange={handleSubjectChange}
                                    disabled={!selectedClass}
                                    className={`block w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm ${
                                        !selectedClass ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                >
                                    <option value="">Select a Subject</option>
                                    {filteredSubjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                                {!selectedClass && (
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Please select a class first</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: File Upload */}
                    {uploadStep === 2 && (
                        <div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CLASS</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">{getClassName()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SUBJECT</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">{getSubjectName()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-center w-full">
                                <label 
                                    htmlFor="file-upload" 
                                    className="flex flex-col items-center justify-center w-full h-60 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="mb-2 text-base text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Excel files only (.xlsx, .xls)
                                        </p>
                                    </div>
                                    <input 
                                        id="file-upload" 
                                        type="file" 
                                        accept=".xlsx,.xls" 
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
                                        Analyzing file...
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Sheet Selection and Preview */}
                    {uploadStep === 3 && (
                        <div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CLASS</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">{getClassName()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">SUBJECT</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">{getSubjectName()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">FILE</p>
                                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">{file?.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5">
                                <label htmlFor="sheet-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Sheet
                                </label>
                                <select
                                    id="sheet-select"
                                    value={selectedSheet}
                                    onChange={handleSheetChange}
                                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                >
                                    {sheetNames.map(sheet => (
                                        <option key={sheet} value={sheet}>
                                            {sheet}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Data Preview */}
                            {renderPreview()}
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {uploadStep === 4 && (
                        <div className="p-6 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Complete</h3>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-md">{success}</p>
                            <div className="flex space-x-4">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                    Upload Another File
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {uploadStep !== 4 && (
                    <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                        {uploadStep !== 4 && (
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isUploading}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        
                        {uploadStep === 1 && (
                            <button
                                type="button"
                                onClick={handleContinueToUpload}
                                disabled={!isSelectionValid}
                                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    isSelectionValid
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-indigo-300 dark:bg-indigo-700/40 cursor-not-allowed text-white dark:text-indigo-300/40'
                                }`}
                            >
                                Continue
                            </button>
                        )}
                        
                        {uploadStep === 2 && (
                            <button
                                type="button"
                                onClick={() => setUploadStep(1)}
                                disabled={isUploading}
                                className="px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 bg-white dark:bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                            >
                                Back
                            </button>
                        )}
                        
                        {uploadStep === 3 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setUploadStep(2)}
                                    disabled={isUploading}
                                    className="px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 bg-white dark:bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                        isUploading
                                            ? 'bg-indigo-300 dark:bg-indigo-700/40 cursor-not-allowed text-white dark:text-indigo-300/40'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                                >
                                    {isUploading ? (
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading...
                                        </span>
                                    ) : 'Upload Chapters'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChapterBulkUpload; 