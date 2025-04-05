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
        <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    1
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    2
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    3
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    4
                </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className={`text-center w-8 ${uploadStep === 1 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                    Select
                </div>
                <div className="flex-1"></div>
                <div className={`text-center w-8 ${uploadStep === 2 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                    Upload
                </div>
                <div className="flex-1"></div>
                <div className={`text-center w-8 ${uploadStep === 3 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                    Configure
                </div>
                <div className="flex-1"></div>
                <div className={`text-center w-8 ${uploadStep === 4 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                    Results
                </div>
            </div>
        </div>
    );

    // Render data preview table
    const renderPreview = () => {
        if (!previewData || !previewData[selectedSheet]) return null;
        
        const sheetData = previewData[selectedSheet];
        
        // Handle different data structures returned from the API
        let headers = [];
        let rows = [];
        
        // Check if sheetData is an array (older API format)
        if (Array.isArray(sheetData)) {
            headers = sheetData[0] || [];
            rows = sheetData.slice(1, 6); // Show first 5 rows for preview
        } 
        // Check if sheetData has headers and rows properties (newer API format)
        else if (sheetData.headers && sheetData.rows) {
            headers = sheetData.headers;
            rows = sheetData.rows.slice(0, 5); // Show first 5 rows for preview
        }
        // Fallback for unknown format
        else {
            console.error('Unknown preview data format:', sheetData);
            return (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Unable to display preview: Unsupported data format.
                    </p>
                </div>
            );
        }
        
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
                                    {Array.isArray(row) ? (
                                        // If row is an array, map through its values
                                        row.map((cell, cellIdx) => (
                                            <td 
                                                key={`cell-${rowIdx}-${cellIdx}`}
                                                className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                {cell === null ? <span className="text-gray-400 dark:text-gray-500">-</span> : cell}
                                            </td>
                                        ))
                                    ) : (
                                        // If row is an object, map through headers to get values
                                        headers.map((header, cellIdx) => (
                                            <td 
                                                key={`cell-${rowIdx}-${cellIdx}`}
                                                className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                {row[header] === null ? <span className="text-gray-400 dark:text-gray-500">-</span> : row[header]}
                                            </td>
                                        ))
                                    )}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full">
            {/* Steps indicator */}
            <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-6">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                        1
                    </div>
                    <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                        2
                    </div>
                    <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                        3
                    </div>
                    <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep === 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                        4
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className={`text-center w-8 ${uploadStep === 1 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                        Select
                    </div>
                    <div className="flex-1"></div>
                    <div className={`text-center w-8 ${uploadStep === 2 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                        Upload
                    </div>
                    <div className="flex-1"></div>
                    <div className={`text-center w-8 ${uploadStep === 3 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                        Configure
                    </div>
                    <div className="flex-1"></div>
                    <div className={`text-center w-8 ${uploadStep === 4 ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                        Results
                    </div>
                </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Different content based on step */}
                {/* Step 1: Class and Subject Selection */}
                {uploadStep === 1 && (
                    <div className="p-6">
                        <div className="mb-4">
                            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select Class
                            </label>
                            <select
                                id="class-select"
                                value={selectedClass}
                                onChange={handleClassChange}
                                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Select a Class</option>
                                {classes.map(classItem => (
                                    <option key={classItem.id} value={classItem.id}>
                                        {classItem.name}
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
                    <div className="p-6">
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
                    <div className="p-6">
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
    );
};

export default ChapterBulkUpload; 