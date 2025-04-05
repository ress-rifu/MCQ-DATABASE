import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import * as XLSX from 'xlsx';

const TopicBulkUpload = ({ classes, subjects, chapters, onSuccess, onCancel }) => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [filteredChapters, setFilteredChapters] = useState([]);

    // Handle file change
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setFileName(selectedFile.name);
        parseExcel(selectedFile);
    };

    // Parse Excel file for preview
    const parseExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Skip header row and take up to 5 rows for preview
                const previewData = jsonData.slice(1, 6);
                setPreview(previewData);
                setError('');
            } catch (err) {
                console.error('Error parsing Excel file:', err);
                setError('Failed to parse Excel file. Please make sure it\'s a valid Excel file.');
                setPreview([]);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Handle class selection change
    const handleClassChange = (e) => {
        const classId = e.target.value;
        setSelectedClass(classId);
        
        // Filter subjects by selected class
        if (classId) {
            const filtered = subjects.filter(s => s.class_id.toString() === classId);
            setFilteredSubjects(filtered);
            setSelectedSubject('');
            setSelectedChapter('');
            setFilteredChapters([]);
        } else {
            setFilteredSubjects([]);
            setSelectedSubject('');
            setSelectedChapter('');
            setFilteredChapters([]);
        }
    };

    // Handle subject selection change
    const handleSubjectChange = (e) => {
        const subjectId = e.target.value;
        setSelectedSubject(subjectId);
        
        // Filter chapters by selected subject
        if (subjectId) {
            const filtered = chapters.filter(c => c.subject_id.toString() === subjectId);
            setFilteredChapters(filtered);
            setSelectedChapter('');
        } else {
            setFilteredChapters([]);
            setSelectedChapter('');
        }
    };

    // Handle chapter selection change
    const handleChapterChange = (e) => {
        setSelectedChapter(e.target.value);
    };

    // Handle upload
    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        if (!selectedChapter) {
            setError('Please select a chapter');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chapter_id', selectedChapter);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/curriculum/topics/bulk-upload`,
                formData,
                {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            // Call success callback with response data
            onSuccess(response.data);
        } catch (err) {
            console.error('Error uploading topics:', err);
            setError(err.response?.data?.message || 'Failed to upload topics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Upload an Excel file with topics. The file should have the following columns:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                        Name | Description (optional)
                    </code>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Note: The first row should be the header row. All topics will be added to the selected chapter.
                </p>
            </div>

            <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                        <select
                            value={selectedClass}
                            onChange={handleClassChange}
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
                            value={selectedSubject}
                            onChange={handleSubjectChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                            disabled={!selectedClass}
                        >
                            <option value="">Select Subject</option>
                            {filteredSubjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter</label>
                        <select
                            value={selectedChapter}
                            onChange={handleChapterChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                            disabled={!selectedSubject}
                        >
                            <option value="">Select Chapter</option>
                            {filteredChapters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Excel File</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-7">
                            <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <p className="pt-1 text-sm text-gray-600 dark:text-gray-400">
                                {fileName ? fileName : 'Drag & drop a file or click to browse'}
                            </p>
                        </div>
                        <input 
                            type="file" 
                            className="opacity-0" 
                            accept=".xlsx, .xls" 
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            </div>

            {error && (
                <div className="mb-6 px-4 py-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {preview.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Preview</h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {preview.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row[0] || ''}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row[1] || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleUpload}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center min-w-[100px]"
                    disabled={loading || !file || !selectedChapter}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Upload Topics'}
                </button>
            </div>
        </div>
    );
};

export default TopicBulkUpload; 