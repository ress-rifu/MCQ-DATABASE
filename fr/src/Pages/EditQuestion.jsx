import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL, getAuthHeader } from '../apiConfig';
import EnhancedRichTextEditor from '../components/EnhancedRichTextEditor';
import LatexEquationModal from '../components/LatexEquationModal';
import { renderLatexContent } from '../utils/latexRenderer';
import { extractFirstImageFromHtml } from '../utils/imageUtils';

const EditQuestion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const questionId = id; // Use the id from URL params
  
  const [question, setQuestion] = useState({
    ques: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    answer: '',
    explanation: '',
    subject: '',
    chapter: '',
    topic: '',
    difficulty_level: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // State for equation modal
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  
  // Load question data if questionId is provided
  useEffect(() => {
    if (questionId) {
      fetchQuestion(questionId);
    }
  }, [questionId]);
  
  const fetchQuestion = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/questions/${id}`, {
        headers: getAuthHeader()
      });
      
      setQuestion(response.data);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError('Failed to load question data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field, value) => {
    setQuestion({
      ...question,
      [field]: value
    });
    
    // Handle image extraction if needed
    if (typeof value === 'string' && value.includes('<img')) {
      const fieldImage = extractFirstImageFromHtml(value);
      if (fieldImage) {
        setQuestion(prev => ({
          ...prev,
          [`${field}_img`]: fieldImage
        }));
      }
    }
  };
  
  const handleImageAdd = (field, base64Image) => {
    // Store the image in the appropriate image field
    setQuestion(prev => ({
      ...prev,
      [`${field}_img`]: base64Image
    }));
  };
  
  const openEquationModal = (field) => {
    setCurrentField(field);
    setShowEquationModal(true);
  };
  
  const insertEquation = (equation) => {
    if (!currentField) return;
    
    const updatedValue = question[currentField] || '';
    // Insert the equation with $ delimiters
    handleChange(currentField, `${updatedValue} $${equation}$ `);
  };
  
  const handleSave = async () => {
    // Validate required fields
    if (!question.ques || !question.option_a || !question.option_b || 
        !question.option_c || !question.option_d || !question.answer) {
      setError('Please fill all required fields (question, options, and answer).');
      return;
    }
    
    setSaving(true);
    try {
      let response;
      
      if (questionId) {
        // Update existing question
        response = await axios.put(`${API_BASE_URL}/api/questions/${questionId}`, question, {
          headers: getAuthHeader()
        });
      } else {
        // Create new question
        response = await axios.post(`${API_BASE_URL}/api/questions`, question, {
          headers: getAuthHeader()
        });
      }
      
      // Navigate back to questions list after saving
      navigate('/');
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Navigate back to questions list
    navigate('/');
  };
  
  // Render option with checkbox for correct answer
  const renderOption = (letter, field) => {
    const isAnswer = question.answer === letter.toLowerCase();
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id={`option_${letter}`}
            checked={isAnswer}
            onChange={() => handleChange('answer', letter.toLowerCase())}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label 
            htmlFor={`option_${letter}`}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Option {letter}
          </label>
          <button
            type="button"
            onClick={() => openEquationModal(field)}
            className="ml-auto text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
          >
            Add Equation
          </button>
        </div>
        
        <EnhancedRichTextEditor
          value={question[field]}
          onChange={(value) => handleChange(field, value)}
          placeholder={`Enter option ${letter}`}
          onImageAdd={(base64) => handleImageAdd(field, base64)}
          onEquationAdd={() => openEquationModal(field)}
          showPreview={question[field] && question[field].includes('$')}
        />
      </div>
    );
  };
  
  if (loading) {
    return <div className="text-center py-8">Loading question data...</div>;
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {questionId ? 'Edit Question' : 'Create New Question'}
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Question */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Question
            </label>
            <button
              type="button"
              onClick={() => openEquationModal('ques')}
              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
            >
              Add Equation
            </button>
          </div>
          
          <EnhancedRichTextEditor
            value={question.ques}
            onChange={(value) => handleChange('ques', value)}
            placeholder="Enter question text"
            onImageAdd={(base64) => handleImageAdd('ques', base64)}
            onEquationAdd={() => openEquationModal('ques')}
            showPreview={question.ques && question.ques.includes('$')}
          />
        </div>
        
        {/* Options */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Options (select the correct answer)
          </h3>
          
          {renderOption('A', 'option_a')}
          {renderOption('B', 'option_b')}
          {renderOption('C', 'option_c')}
          {renderOption('D', 'option_d')}
        </div>
        
        {/* Explanation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Explanation
            </label>
            <button
              type="button"
              onClick={() => openEquationModal('explanation')}
              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
            >
              Add Equation
            </button>
          </div>
          
          <EnhancedRichTextEditor
            value={question.explanation}
            onChange={(value) => handleChange('explanation', value)}
            placeholder="Enter explanation for the answer"
            onImageAdd={(base64) => handleImageAdd('explanation', base64)}
            onEquationAdd={() => openEquationModal('explanation')}
            showPreview={question.explanation && question.explanation.includes('$')}
          />
        </div>
        
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={question.subject || ''}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="Subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chapter
            </label>
            <input
              type="text"
              value={question.chapter || ''}
              onChange={(e) => handleChange('chapter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="Chapter"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={question.topic || ''}
              onChange={(e) => handleChange('topic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="Topic"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Difficulty
            </label>
            <select
              value={question.difficulty_level || 'Medium'}
              onChange={(e) => handleChange('difficulty_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {saving ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </div>
      
      {/* LaTeX Equation Modal */}
      <LatexEquationModal 
        isOpen={showEquationModal}
        onClose={() => setShowEquationModal(false)}
        onInsert={insertEquation}
      />
    </div>
  );
};

export default EditQuestion; 