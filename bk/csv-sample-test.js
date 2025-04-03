const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Path to the sample CSV file
const sampleCsvPath = path.join(__dirname, '..', 'test_questions.csv');

// Function to process the sample CSV file
async function testCsvProcessing() {
    console.log('Testing CSV processing...');
    console.log(`Reading file: ${sampleCsvPath}`);
    
    // Check if file exists
    if (!fs.existsSync(sampleCsvPath)) {
        console.error(`File not found: ${sampleCsvPath}`);
        return;
    }
    
    // Get file stats
    const stats = fs.statSync(sampleCsvPath);
    console.log(`File size: ${stats.size} bytes`);
    
    // Read first few bytes to detect potential issues
    const fileData = fs.readFileSync(sampleCsvPath, 'utf8');
    console.log(`First 100 chars: ${fileData.substring(0, 100).replace(/\n/g, '\\n')}`);
    
    // Process with CSV parser
    const results = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(sampleCsvPath)
            .on('error', (error) => {
                console.error(`Error reading file: ${error.message}`);
                reject(error);
            })
            .pipe(csv({
                mapHeaders: ({ header }) => {
                    // Normalize header names
                    const normalizedHeader = header.trim().toLowerCase();
                    console.log(`CSV header: ${header} -> normalized: ${normalizedHeader}`);
                    
                    return normalizedHeader;
                }
            }))
            .on('data', (data) => {
                console.log('Processed row:', JSON.stringify(data));
                results.push(data);
            })
            .on('end', () => {
                console.log(`CSV processing complete. Found ${results.length} records`);
                console.log('Results:', results);
                resolve(results);
            })
            .on('error', (error) => {
                console.error(`Error parsing CSV: ${error.message}`);
                reject(error);
            });
    });
}

// Run the test
testCsvProcessing()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error)); 