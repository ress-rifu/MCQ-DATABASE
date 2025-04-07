import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, API_BASE_URL, getAuthHeader } from '../apiConfig';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import LaTeXRenderer from '../components/LaTeXRenderer';
import { FiUpload, FiDownload, FiFileText, FiSearch, FiCheck, FiInfo, FiX } from 'react-icons/fi';
import DocxUpload from '../components/DocxUpload';
import Notification from '../components/Notification';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [importInProgress, setImportInProgress] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' or 'docx'

  // Add state for curriculum selection
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: File Upload, 2: Review Data, 3: Select Curriculum
  // Add state for metadata override toggle
  const [useExcelMetadata, setUseExcelMetadata] = useState(false);

  // Add useEffect to fetch curriculum data when component loads
  useEffect(() => {
    fetchCurriculumData();
  }, []);

  // Add useEffect to filter subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      // Convert selectedClass to string for comparison to ensure type matching
      const classId = String(selectedClass);
      const filtered = subjects.filter(s => String(s.class_id) === classId);
      setFilteredSubjects(filtered);
      setSelectedSubject(''); // Reset subject when class changes
      setSelectedChapter(''); // Reset chapter when class changes
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedClass, subjects]);

  // Add useEffect to filter chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      // Convert selectedSubject to string for comparison to ensure type matching
      const subjectId = String(selectedSubject);
      const filtered = chapters.filter(c => String(c.subject_id) === subjectId);
      setFilteredChapters(filtered);
      setSelectedChapter(''); // Reset chapter when subject changes
    } else {
      setFilteredChapters([]);
    }
  }, [selectedSubject, chapters]);

  // Add animations via useEffect to prevent duplicate style elements
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }

      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(1rem); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(styleElement);

    // Clean up function to remove the style element when component unmounts
    return () => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Add function to fetch curriculum data
  const fetchCurriculumData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('You need to be logged in to fetch curriculum data', 'error');
        return;
      }

      const [classesRes, subjectsRes, chaptersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/curriculum/classes`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/api/curriculum/subjects`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/api/curriculum/chapters`, { headers: getAuthHeader() })
      ]);

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);
    } catch (error) {
      console.error("Error fetching curriculum data:", error);
      showNotification("Failed to load curriculum data. Please refresh the page.", "error");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setSheetData(null);
      setCurrentStep(1); // Reset to step 1 when file changes
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'QuestionID', 'Serial', 'Class', 'Subject', 'Chapter', 'Topic', 'Question', 'Ques_img',
      'OptionA', 'OptionA_IMG', 'OptionB', 'OptionB_IMG', 'OptionC', 'OptionC_IMG', 'OptionD', 'OptionD_IMG',
      'Answer', 'Explaination', 'Explaination_IMG', 'Hint', 'Hint_img', 'Difficulty_level', 'Reference_Board/Institute', 'Reference'
    ];

    const sampleRow = {
      'QuestionID': 'MATH001',
      'Serial': '1',
      'Class': 'Class 10',
      'Subject': 'Mathematics',
      'Chapter': 'Algebra',
      'Topic': 'Quadratic Equations',
      'Question': 'What is the solution of x² + 5x + 6 = 0?',
      'Ques_img': '',
      'OptionA': 'x = -2, -3',
      'OptionA_IMG': '',
      'OptionB': 'x = 2, 3',
      'OptionB_IMG': '',
      'OptionC': 'x = -2, 3',
      'OptionC_IMG': '',
      'OptionD': 'x = 2, -3',
      'OptionD_IMG': '',
      'Answer': 'A',
      'Explaination': 'Using the quadratic formula or factoring: (x+2)(x+3)=0',
      'Explaination_IMG': '',
      'Hint': 'Try factoring the expression',
      'Hint_img': '',
      'Difficulty_level': 'easy',
      'Reference_Board/Institute': 'CBSE',
      'Reference': 'Textbook page 45'
    };

    const sampleRow2 = {
      'QuestionID': 'BIO001',
      'Serial': '2',
      'Class': 'Class 9',
      'Subject': 'Science',
      'Chapter': 'Biology',
      'Topic': 'Cell Structure',
      'Question': 'Which organelle is known as the powerhouse of the cell?',
      'Ques_img': '',
      'OptionA': 'Nucleus',
      'OptionA_IMG': '',
      'OptionB': 'Mitochondria',
      'OptionB_IMG': '',
      'OptionC': 'Endoplasmic Reticulum',
      'OptionC_IMG': '',
      'OptionD': 'Golgi Apparatus',
      'OptionD_IMG': '',
      'Answer': 'B',
      'Explaination': 'Mitochondria are responsible for cellular respiration and energy production',
      'Explaination_IMG': '',
      'Hint': 'This organelle produces ATP',
      'Hint_img': '',
      'Difficulty_level': 'medium',
      'Reference_Board/Institute': 'NCERT',
      'Reference': 'Chapter 3, Page 28'
    };

    const ws = XLSX.utils.json_to_sheet([sampleRow, sampleRow2], { header: headers });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');

    XLSX.writeFile(wb, 'question_template.xlsx');

    showNotification('Template downloaded successfully');
  };

  const analyzeFile = async () => {
    if (!file) {
      showNotification('Please select a file first', 'warning');
      return;
    }

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Get sheet names
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('No sheets found in the workbook');
        }

        // Process the first sheet by default
        const firstSheetName = sheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to JSON with header row
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Check if there's enough data
        if (json.length < 2) {
          throw new Error('Not enough data in the sheet. Need at least headers and one data row.');
        }

        // Extract headers from first row
        const headers = json[0].map(header => header.toString().trim());

        // Check for required headers
        const requiredHeaders = ['Question', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer'];
        const missingHeaders = requiredHeaders.filter(header =>
          !headers.some(h => h.toLowerCase() === header.toLowerCase())
        );

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Please make sure your file has all required columns.`);
        }

        // Extract preview data (up to 5 rows)
        const previewRows = json.slice(1, 6).map(row => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = index < row.length ? row[index] : '';
          });
          return rowData;
        });

        // Create normalized data structure
        const normalizedData = {
          sheets: sheetNames,
          headers: headers,
          preview: previewRows,
          totalRows: json.length - 1 // Exclude header row
        };

        setSelectedSheet(firstSheetName);
        setSheetData(normalizedData);
        setCurrentStep(2); // Move to review data step
        showNotification('File analyzed successfully');
      } catch (error) {
        console.error('Error analyzing file:', error);
        showNotification(error.message || 'Error analyzing file', 'error');
      } finally {
        setAnalyzing(false);
      }
    };

    reader.onerror = () => {
      setAnalyzing(false);
      showNotification('Error reading the file', 'error');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleContinueToMetadata = () => {
    if (!sheetData || !selectedSheet) {
      showNotification('Please analyze a file first', 'warning');
      return;
    }
    setCurrentStep(3); // Move to curriculum selection step
  };

  const importQuestions = async () => {
    if (!file || !selectedSheet) {
      showNotification('Please select a file and sheet first', 'warning');
      return;
    }

    if (!useExcelMetadata && (!selectedClass || !selectedSubject || !selectedChapter)) {
      showNotification('Please select class, subject, and chapter or use data from Excel file', 'warning');
      return;
    }

    setImportInProgress(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheetName', selectedSheet);

    // Only append curriculum IDs if we're overriding Excel metadata
    if (!useExcelMetadata) {
      formData.append('classId', selectedClass);
      formData.append('subjectId', selectedSubject);
      formData.append('chapterId', selectedChapter);

      // Add class, subject, and chapter names
      const selectedClassObj = classes.find(c => String(c.id) === String(selectedClass));
      const selectedSubjectObj = subjects.find(s => String(s.id) === String(selectedSubject));
      const selectedChapterObj = chapters.find(c => String(c.id) === String(selectedChapter));

      formData.append('className', selectedClassObj ? selectedClassObj.name : '');
      formData.append('subjectName', selectedSubjectObj ? selectedSubjectObj.name : '');
      formData.append('chapterName', selectedChapterObj ? selectedChapterObj.name : '');
    }

    // Flag to override data in Excel with UI selections
    formData.append('overrideMetadata', useExcelMetadata ? 'false' : 'true');

    try {
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);

      if (!token) {
        showNotification('You need to be logged in to import questions', 'error');
        setImportInProgress(false);
        return;
      }

      console.log('Starting import request with metadata settings:', {
        useExcelMetadata: useExcelMetadata,
        overrideMetadata: !useExcelMetadata,
        class: !useExcelMetadata ? selectedClass : 'Using Excel data',
        subject: !useExcelMetadata ? selectedSubject : 'Using Excel data',
        chapter: !useExcelMetadata ? selectedChapter : 'Using Excel data'
      });

      const response = await fetch(`${API_URL}/api/csv/import-excel`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Import response status:', response.status);

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Import failed with status:', response.status, data);
        throw new Error(data.message || 'Error importing questions');
      }

      console.log('Import successful:', data);
      showNotification(`Successfully imported ${data.importedCount} questions`);

      // Create activity record for this import
      try {
        const activityPayload = {
          action: 'import_questions',
          entityType: 'questions',
          entityId: null,
          details: {
            file_name: file.name,
            question_ids: data.importedIds || [],
            sheet_name: selectedSheet,
            class: useExcelMetadata ? 'From Excel' : (selectedClassObj ? selectedClassObj.name : ''),
            subject: useExcelMetadata ? 'From Excel' : (selectedSubjectObj ? selectedSubjectObj.name : ''),
            chapter: useExcelMetadata ? 'From Excel' : (selectedChapterObj ? selectedChapterObj.name : ''),
            imported_count: data.importedCount,
            error_count: data.errorCount || 0
          },
          title: `Imported ${data.importedCount} questions from ${file.name}`,
          description: useExcelMetadata
            ? `Imported questions using metadata from Excel file`
            : `Imported ${data.importedCount} questions for ${selectedClassObj?.name || ''}, ${selectedSubjectObj?.name || ''}, ${selectedChapterObj?.name || ''}`
        };

        const activityResponse = await axios.post(
          `${API_BASE_URL}/api/activity`,
          activityPayload,
          { headers: getAuthHeader() }
        );

        console.log('Activity recorded:', activityResponse.data);
      } catch (activityError) {
        console.error('Failed to record activity:', activityError);
        // Don't prevent the user from proceeding if activity recording fails
      }

      if (data.errorCount > 0) {
        showNotification(`${data.errorCount} rows had errors and were not imported`, 'warning');
      }

      // Reset the form after successful import
      setFile(null);
      setSheetData(null);
      setSelectedSheet('');
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedChapter('');
      setCurrentStep(1);
    } catch (error) {
      console.error('Error importing questions:', error);
      showNotification(error.message || 'Error importing questions', 'error');
    } finally {
      setImportInProgress(false);
    }
  };

  // Function to get difficulty badge based on level
  const getDifficultyBadge = (level) => {
    const normalizedLevel = level?.toString().toLowerCase().trim() || '';

    if (['easy', 'e', 'simple', 'beginner'].includes(normalizedLevel)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
          Easy
        </span>
      );
    } else if (['hard', 'h', 'difficult', 'challenging', 'advanced'].includes(normalizedLevel)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
          Hard
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          Medium
        </span>
      );
    }
  };

  // Function to format cell content with special handling
  const formatCellContent = (header, content) => {
    if (!content) return '-';

    if (header.toLowerCase().includes('difficulty')) {
      return getDifficultyBadge(content);
    }

    // Check for LaTeX longtable or other LaTeX content
    if (typeof content === 'string') {
      // Check for LaTeX tables or other LaTeX environments
      if (content.includes('\\begin{longtable}') ||
          content.includes('\\begin{tabular}') ||
          content.includes('\\[') ||
          content.includes('$')) {
        return <LaTeXRenderer content={content} className="text-sm" />;
      }

      // Truncate long text
      if (content.length > 50) {
        return <span title={content}>{content.substring(0, 50)}...</span>;
      }
    }

    return content;
  };

  // Add handler for tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset progress when changing tabs
    if (tab === 'excel') {
      setFile(null);
      setSheetData(null);
      setCurrentStep(1);
    }
  };

  // Add handler for DOCX upload success
  const handleDocxUploadSuccess = (data) => {
    showNotification(`Successfully imported ${data.inserted} MCQs from DOCX file.`, 'success');
  };

  // Add handler for DOCX upload error
  const handleDocxUploadError = (error) => {
    console.error("DOCX upload error:", error);
    showNotification("Failed to import MCQs from DOCX file. Please try again.", "error");
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Upload</h1>
          <p className="text-gray-600">
            Import questions from Excel files or Word documents.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="mb-8">
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'excel'
                ? 'bg-white text-primary-600 border-b-2 border-primary-600 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => handleTabChange('excel')}
            >
              <div className="flex items-center gap-2">
                <FiFileText className={activeTab === 'excel' ? 'text-primary-600' : 'text-gray-500'} />
                Excel Upload
              </div>
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'docx'
                ? 'bg-white text-primary-600 border-b-2 border-primary-600 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => handleTabChange('docx')}
            >
              <div className="flex items-center gap-2">
                <FiFileText className={activeTab === 'docx' ? 'text-primary-600' : 'text-gray-500'} />
                Word Doc Upload
              </div>
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Choose the file format you want to upload. Excel files allow for bulk uploads with multiple questions, while Word documents are better for formatted content.
          </p>
        </div>

        {/* Excel Upload Tab */}
        {activeTab === 'excel' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upload Excel File</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload an Excel file containing questions in the required format. You can download a template below.
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer group"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <FiUpload className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {file ? file.name : 'Drag and drop your Excel file here'}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supported formats: .xlsx, .xls (Max 10MB)'}
                    </p>
                    {!file && (
                      <button className="mt-4 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        Browse Files
                      </button>
                    )}
                  </div>
                </div>

                {file && (
                  <div className="mt-3 flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <FiCheck className="mr-1.5" />
                    File selected successfully
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 gap-2"
                >
                  <FiDownload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  Download Template
                </button>

                <button
                  type="button"
                  onClick={uploadFile}
                  disabled={!file || uploading}
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 gap-2 ${
                    !file || uploading
                      ? 'bg-indigo-400 dark:bg-indigo-600 cursor-not-allowed'
                      : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="h-5 w-5" />
                      Upload File
                    </>
                  )}
                </button>
              </div>

              {/* Info Section */}
              <div className="mt-8 p-5 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center">
                      <FiInfo className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">About This Upload</h3>
                    <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-400 space-y-2">
                      <p>Your Excel file should contain question data such as question text, options, and answers. You'll be able to select a Class, Subject, and Chapter that will be applied to all questions in this upload.</p>
                      <p>For best results, make sure your Excel file follows the template format.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Word Document Upload Tab */}
        {activeTab === 'docx' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upload Word Document</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload a Word document (.docx) containing formatted questions. The system will attempt to parse the document structure.
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div
                  className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer group"
                  onClick={() => document.getElementById('docx-upload').click()}
                >
                  <input
                    id="docx-upload"
                    type="file"
                    accept=".docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <FiUpload className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {file ? file.name : 'Drag and drop your Word document here'}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supported format: .docx (Max 10MB)'}
                    </p>
                    {!file && (
                      <button className="mt-4 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        Browse Files
                      </button>
                    )}
                  </div>
                </div>

                {file && (
                  <div className="mt-3 flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                    <FiCheck className="mr-1.5" />
                    File selected successfully
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={uploadFile}
                disabled={!file || uploading}
                className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200 gap-2 ${
                  !file || uploading
                    ? 'bg-indigo-400 dark:bg-indigo-600 cursor-not-allowed'
                    : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload className="h-5 w-5" />
                    Upload Document
                  </>
                )}
              </button>

              {/* Info Section */}
              <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center">
                      <FiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Word Document Format</h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-2">
                      <p>For best results, format your Word document with clear question structures:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Each question should be clearly separated</li>
                        <li>Options should be labeled (A, B, C, D or 1, 2, 3, 4)</li>
                        <li>Correct answers should be marked</li>
                        <li>Use consistent formatting throughout the document</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default Upload;
