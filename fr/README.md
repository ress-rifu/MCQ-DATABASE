# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# MCQ Database Frontend

## Features

The MCQ Database frontend provides a user interface for managing multiple-choice questions (MCQs).

### DOCX Upload Feature

The system now supports extracting MCQs directly from Word documents. This feature automatically:

1. Analyzes DOCX files to extract MCQs
2. Preserves formatting and images in questions
3. Detects options, answers, explanations, and hints
4. Imports the MCQs into the database

## Usage Instructions

### Excel Upload

1. Navigate to the Upload page
2. Select the "Excel Upload" tab
3. Follow the steps to upload your Excel file containing MCQs

### Word Document (DOCX) Upload

1. Navigate to the Upload page
2. Select the "Word Doc Upload" tab
3. Select the class and subject for the MCQs
4. Upload a DOCX file containing MCQs
5. Review the extracted MCQs
6. Click "Import MCQs" to add them to the database

## Supported DOCX Format

The system recognizes MCQs in Word documents with the following formats:

### Pattern 1 (General MCQ):
```
1. Question text
[Topic: Your topic]
[Difficulty]
[Reference information]
A. Option A
B. Option B
C. Option C
D. Option D
Answer: A
[Hint: Hint text]
[Explanation: Explanation text]
```

### Pattern 2 (MCQs with multiple choice answers):
```
1. Question text with statements
[Topic: Your topic]
[Difficulty]
[Reference information]
i. Statement 1
ii. Statement 2
iii. Statement 3
Which of the above are correct?
A. i and ii
B. i and iii
C. ii and iii
D. i, ii and iii
Answer: A
[Hint: Hint text]
[Explanation: Explanation text]
```

Bengali language format is also supported for questions and options.

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Troubleshooting

### Missing Vite Dependencies

If you encounter an error message like this:
```
Cannot find module '.../node_modules/vite/dist/node/chunks/dep-CvfTChi5.js'
```

Use one of these solutions:

#### Windows Users

Run the included batch file to automatically fix the issue:
```
fix-dependencies.bat
```

#### All Users

1. Run the JavaScript fix script:
   ```
   node fix-dependencies.js
   ```

2. Or run the clean install manually:
   ```
   npm run clean-install
   ```

3. If the above solutions don't work, try these steps:
   ```
   rm -rf node_modules
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

   For Windows PowerShell:
   ```
   rd /s /q node_modules
   npm cache clean --force
   npm install --legacy-peer-deps
   ```
