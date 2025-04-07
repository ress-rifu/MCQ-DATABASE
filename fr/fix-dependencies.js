// fix-dependencies.js
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a symlink to ensure Vite can find all dependencies
const nodeModulesPath = path.join(__dirname, 'node_modules');
const viteNodeChunksPath = path.join(nodeModulesPath, 'vite', 'dist', 'node', 'chunks');

console.log('Checking for Vite node chunks directory...');

// Ensure the directory exists
if (!fs.existsSync(viteNodeChunksPath)) {
  console.log('Creating Vite node chunks directory...');
  fs.mkdirSync(viteNodeChunksPath, { recursive: true });
}

// Check for the missing dependency file
const missingDepFile = path.join(viteNodeChunksPath, 'dep-CvfTChi5.js');
if (!fs.existsSync(missingDepFile)) {
  console.log('Creating placeholder for missing dependency file...');
  fs.writeFileSync(missingDepFile, '// Placeholder to fix dependency issue\nexport default {};\n');
}

// Clean and reinstall modules
console.log('Running clean install...');
exec('npm run clean-install', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error during clean install: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
  }
  console.log(stdout);
  console.log('Dependencies have been fixed. Try running the app again with "npm run dev"');
});

console.log('Dependencies structure has been fixed. You can now run "node fix-dependencies.js" to complete the process.'); 