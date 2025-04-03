import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, API_BASE_URL, getAuthHeader } from '../apiConfig';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import LaTeXRenderer from '../components/LaTeXRenderer';
import { FiUpload, FiDownload, FiFileText, FiSearch, FiCheck, FiInfo, FiX } from 'react-icons/fi';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [importInProgress, setImportInProgress] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
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
    
    const sampleRow3 = {
      'QuestionID': 'MATH002',
      'Serial': '3',
      'Class': 'Class 11',
      'Subject': 'Mathematics',
      'Chapter': 'Relations',
      'Topic': 'Tables and Functions',
      'Question': 'For the following table, identify the pattern and find the missing value when x = 1:\n\\begin{longtable}[]{@{} >{\centering\\arraybackslash}p{(\\linewidth - 6\\tabcolsep) * \\real{0.2498}} >{\centering\\arraybackslash}p{(\\linewidth - 6\\tabcolsep) * \\real{0.2501}} >{\centering\\arraybackslash}p{(\\linewidth - 6\\tabcolsep) * \\real{0.2501}} >{\centering\\arraybackslash}p{(\\linewidth - 6\\tabcolsep) * \\real{0.2501}}@{}} \\toprule\\noalign{} \\begin{minipage}[b]{\\linewidth}\\centering x \\end{minipage} & \\begin{minipage}[b]{\\linewidth}\\centering 0 \\end{minipage} & \\begin{minipage}[b]{\\linewidth}\\centering \\[-1\\] \\end{minipage} & \\begin{minipage}[b]{\\linewidth}\\centering \\[2\\] \\end{minipage} \\\\ \\midrule\\noalign{} \\endhead \\bottomrule\\noalign{} \\endlastfoot y & $-1$ & $-3$ & $3$ \\end{longtable}',
      'Ques_img': '',
      'OptionA': 'y = -2',
      'OptionA_IMG': '',
      'OptionB': 'y = 0',
      'OptionB_IMG': '',
      'OptionC': 'y = 1',
      'OptionC_IMG': '',
      'OptionD': 'y = 2',
      'OptionD_IMG': '',
      'Answer': 'C',
      'Explaination': 'The pattern can be represented as y = x²-1. When we substitute the values: \nFor x = 0: y = 0²-1 = -1\nFor x = -1: y = (-1)²-1 = 1-1 = 0\nFor x = 2: y = 2²-1 = 4-1 = 3\nSo for x = 1: y = 1²-1 = 1-1 = 0',
      'Explaination_IMG': '',
      'Hint': 'Look for a quadratic pattern',
      'Hint_img': '',
      'Difficulty_level': 'hard',
      'Reference_Board/Institute': 'CBSE',
      'Reference': 'Functions chapter'
    };
    
    const ws = XLSX.utils.json_to_sheet([sampleRow, sampleRow2, sampleRow3], { header: headers });
    
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
    
    if (!selectedClass || !selectedSubject || !selectedChapter) {
      showNotification('Please select class, subject, and chapter', 'warning');
      return;
    }

    setImportInProgress(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheetName', selectedSheet);
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
    
    // Flag to override data in Excel with UI selections
    formData.append('overrideMetadata', 'true');

    try {
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      if (!token) {
        showNotification('You need to be logged in to import questions', 'error');
        setImportInProgress(false);
        return;
      }
      
      console.log('Starting import request with curriculum data:', {
        class: selectedClass,
        className: selectedClassObj ? selectedClassObj.name : '',
        subject: selectedSubject,
        subjectName: selectedSubjectObj ? selectedSubjectObj.name : '',
        chapter: selectedChapter,
        chapterName: selectedChapterObj ? selectedChapterObj.name : '',
        overrideMetadata: true
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
          Easy
        </span>
      );
    } else if (['hard', 'h', 'difficult', 'challenging', 'advanced'].includes(normalizedLevel)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
          Hard
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Page header with sticky behavior similar to other pages */}
        <div className="sticky top-4 z-30 mb-8">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Questions</h1>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Download Question Template
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area with max width for better readability */}
        <div className="max-w-4xl mx-auto">
          {/* Progress steps indicator */}
          <div className="mb-8">
            <div className="relative pt-1 pb-8">
              {/* Progress bar line */}
              <div className="absolute top-6 left-5 right-5 h-1 bg-gray-200 dark:bg-gray-700"></div>
              <div 
                className="absolute top-6 left-5 h-1 bg-indigo-600 dark:bg-indigo-500 transition-all duration-300" 
                style={{ 
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' 
                }}
              ></div>
              
              {/* Steps */}
              <div className="flex justify-between px-0 relative z-10">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold shadow-sm transition-all duration-300 ${
                    currentStep >= 1 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    1
                  </div>
                  <span className={`mt-3 text-sm font-medium transition-all duration-300 ${
                    currentStep >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>Upload File</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold shadow-sm transition-all duration-300 ${
                    currentStep >= 2 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    2
                  </div>
                  <span className={`mt-3 text-sm font-medium transition-all duration-300 ${
                    currentStep >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>Review Data</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold shadow-sm transition-all duration-300 ${
                    currentStep >= 3 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    3
                  </div>
                  <span className={`mt-3 text-sm font-medium transition-all duration-300 ${
                    currentStep >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>Categorize</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            {/* Step 1: File Upload Section - Show when on step 1 */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 py-4 px-6">
                  <h2 className="text-xl font-semibold text-white">Step 1: Select Excel File</h2>
                </div>
                
                <div className="p-8">
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Excel File</label>
                    <div 
                      className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
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
                        <FiUpload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          {file ? file.name : 'Drag and drop file here, or click to select file'}
                        </p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                          Supported formats: .xlsx, .xls
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={analyzeFile}
                    disabled={!file || analyzing}
                    className={`w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      !file || analyzing 
                        ? 'bg-gray-400 dark:bg-gray-600 opacity-50 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900'
                    } transition-colors duration-200`}
                  >
                    {analyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FiSearch className="mr-2" /> 
                        Analyze File
                      </>
                    )}
                  </button>
                  
                  {/* Info Section */}
                  <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiInfo className="h-5 w-5 text-indigo-400 dark:text-indigo-300" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">About This Upload</h3>
                        <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-400">
                          <p>Your Excel file should contain question data such as question text, options, and answers. In Step 3, you'll select a single Class, Subject, and Chapter that will be applied to <strong>all questions</strong> in this upload.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: File Analysis Results - Show when on step 2 */}
            {currentStep === 2 && sheetData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div className="bg-gradient-to-r from-green-500 to-green-600 py-4 px-6">
                  <h2 className="text-xl font-semibold text-white">Step 2: Review and Continue</h2>
                </div>
                
                <div className="p-8">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Sheet</label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm"
                    >
                      {sheetData.sheets && sheetData.sheets.map((sheet, idx) => (
                        <option key={idx} value={sheet}>{sheet}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Sheet Preview */}
                  <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Preview {selectedSheet && `(Sheet: ${selectedSheet})`}
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      {sheetData.headers && sheetData.headers.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {sheetData.headers.map((header, idx) => (
                                <th
                                  key={idx}
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Handle different data structures for preview */}
                            {Array.isArray(sheetData.preview) ? (
                              // If preview is an array of rows 
                              sheetData.preview.map((row, rowIdx) => (
                                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                  {sheetData.headers.map((header, colIdx) => (
                                    <td
                                      key={`${rowIdx}-${colIdx}`}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                                    >
                                      {formatCellContent(header, row[header])}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : sheetData.preview && typeof sheetData.preview === 'object' && selectedSheet && sheetData.preview[selectedSheet] ? (
                              // If preview is an object with sheet names as keys
                              sheetData.preview[selectedSheet].rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                  {sheetData.headers.map((header, colIdx) => (
                                    <td
                                      key={`${rowIdx}-${colIdx}`}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                                    >
                                      {formatCellContent(header, typeof row === 'object' ? row[header] : row[colIdx])}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              // If we can't display the preview data
                              <tr>
                                <td 
                                  colSpan={sheetData.headers.length}
                                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                >
                                  Preview data could not be displayed. Check the console for data structure.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                          No headers found in the file
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Info Section */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiInfo className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Information</h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Total rows: {sheetData.totalRows || 0}</li>
                            <li>Make sure your data matches the expected format</li>
                            <li><strong>In the next step</strong>, you'll categorize all these questions by selecting a class, subject, and chapter</li>
                            <li>LaTeX expressions between $ $ symbols will be rendered properly</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleContinueToMetadata}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                  >
                    <FiCheck className="mr-2" />
                    Continue to Categorize Questions
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 3: Select Class, Subject, Chapter - Show when on step 3 */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-4 px-6">
                  <h2 className="text-xl font-semibold text-white">Step 3: Categorize Questions</h2>
                </div>
                
                <div className="p-8">
                  <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    Assign your questions to a specific class, subject, and chapter to keep your question bank organized.
                  </p>
                  
                  {/* Class Selection */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm"
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
                  
                  {/* Subject Selection - Only enabled if class is selected */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm"
                      disabled={!selectedClass}
                      required
                    >
                      <option value="">Select Subject</option>
                      {filteredSubjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Chapter Selection - Only enabled if subject is selected */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chapter</label>
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm"
                      disabled={!selectedSubject}
                      required
                    >
                      <option value="">Select Chapter</option>
                      {filteredChapters.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Info Section */}
                  <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiInfo className="h-5 w-5 text-yellow-400 dark:text-yellow-300" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Important</h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                          <p>The Class, Subject, and Chapter you select here will be used for <strong>ALL</strong> questions in the uploaded file, overriding any values in the Excel sheet. This ensures proper organization in your Question Bank.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <button
                      onClick={() => setCurrentStep(2)} // Go back to step 2
                      className="inline-flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                    >
                      Back to Review
                    </button>
                    
                    <button
                      onClick={importQuestions}
                      disabled={importInProgress || !selectedClass || !selectedSubject || !selectedChapter}
                      className={`flex-1 sm:flex-none inline-flex justify-center items-center px-8 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        importInProgress || !selectedClass || !selectedSubject || !selectedChapter
                          ? 'bg-gray-400 dark:bg-gray-600 opacity-50 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900'
                      } transition-colors duration-200`}
                    >
                      {importInProgress ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Importing...
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-2" />
                          Import Questions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Toast Notification - consistent with other pages */}
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
    </div>
  );
};

export default Upload; 