# PowerShell script to initialize database and start server
Write-Host "Starting database initialization..." -ForegroundColor Cyan

# Change directory to script location
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptPath

# Run the CommonJS database initialization script
Write-Host "Running database initialization script..."
node init-db-cjs.js

# Check if initialization was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database initialization completed, starting server..." -ForegroundColor Green
    
    # Start the server
    node server.js
} else {
    Write-Host "Database initialization failed with exit code $LASTEXITCODE" -ForegroundColor Red
} 