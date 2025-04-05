# MCQ Database Backend

## DOCX to MCQ Feature Setup

The Word Document (DOCX) to MCQ feature allows users to upload Word documents containing MCQs and automatically extract them into the database.

### Prerequisites

1. **Node.js** (v14+)
2. **Python** (v3.6+)
3. **Pandoc** - Required for DOCX conversion

### Setup Instructions

1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Install Pandoc:
   - **Windows**: Download and install from https://pandoc.org/installing.html
   - **macOS**: `brew install pandoc`
   - **Linux**: `sudo apt-get install pandoc`

4. Ensure Pandoc is in your system PATH

### Usage

1. Start the server:
   ```
   npm start
   ```

2. The server provides two endpoints for DOCX handling:
   - `POST /api/docx/analyze` - Analyze a DOCX file and extract MCQs preview
   - `POST /api/docx/import` - Import MCQs from a DOCX file into the database

### Supported MCQ Format

The system recognizes MCQs in the following formats:

#### Pattern 1 (General MCQ):
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

#### Pattern 2 (MCQs with multiple choice answers):
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