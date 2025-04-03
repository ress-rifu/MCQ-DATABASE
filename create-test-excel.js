const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create test data for chapter upload
const chapters = [
  { chapter: "Chapter 1: Introduction" },
  { chapter: "Chapter 2: Basic Concepts" },
  { chapter: "Chapter 3: Advanced Topics" },
  { chapter: "Chapter 4: Review" },
  { chapter: "Chapter 5: Case Studies" }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(chapters);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Chapters");

// Directory for the test file
const testDir = path.join(__dirname, 'test-files');

// Create directory if it doesn't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Write workbook to file
const filePath = path.join(testDir, 'test-chapters.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Test Excel file created at: ${filePath}`); 