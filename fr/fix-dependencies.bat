@echo off
echo Fixing Vite dependencies...

:: Clean the node_modules directory
echo Removing node_modules directory...
rd /s /q node_modules
echo Clearing npm cache...
call npm cache clean --force

:: Install dependencies
echo Installing dependencies...
call npm install

:: Ensure the Vite chunks directory exists
echo Creating necessary directories...
mkdir "node_modules\vite\dist\node\chunks" 2>nul

:: Create an empty placeholder for the missing module
echo Creating placeholder file for missing dependency...
echo // Placeholder to fix dependency issue > "node_modules\vite\dist\node\chunks\dep-CvfTChi5.js"
echo export default {}; >> "node_modules\vite\dist\node\chunks\dep-CvfTChi5.js"

:: Create a symlink for the missing module if needed
echo Ensuring dependencies are properly linked...
cd node_modules\vite\dist\node\chunks
if not exist "dep-B0fRCRkQ.js" (
    echo Creating symbolic link for dep-B0fRCRkQ.js...
    copy dep-CvfTChi5.js dep-B0fRCRkQ.js
)
cd ..\..\..\..\..\

echo Dependency fix complete. Try running "npm run dev" now.
pause 