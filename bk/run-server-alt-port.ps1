# PowerShell script to initialize database and start server on alternative port
Write-Host "Starting database initialization..." -ForegroundColor Cyan

# Change directory to script location
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptPath

# Run the CommonJS database initialization script
Write-Host "Running database initialization script..."
node init-db-cjs.js

# Check if initialization was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database initialization completed, checking ports..." -ForegroundColor Green
    
    # Check if port 3000 is in use
    $portInUse = $null
    try {
        $portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    } catch {
        # Port not in use
    }
    
    if ($portInUse) {
        # Port 3000 is in use, use an alternative port
        Write-Host "Port 3000 is already in use. Starting server on port 3001..." -ForegroundColor Yellow
        
        # Set environment variable for the alternative port
        $env:PORT = 3001
        
        # Start the server
        node server.js
        
        # Note: You'll need to update your frontend to use this new port
        Write-Host "Server running on port 3001. Remember to update your frontend API_BASE_URL to use this port!" -ForegroundColor Yellow
    } else {
        # Port 3000 is available, use it
        Write-Host "Starting server on default port 3000..." -ForegroundColor Green
        node server.js
    }
} else {
    Write-Host "Database initialization failed with exit code $LASTEXITCODE" -ForegroundColor Red
} 