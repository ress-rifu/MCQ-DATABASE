# Script to alter the activity_log table and add missing columns
# Just a direct SQL execution without dependencies

Write-Host "Adding title and description columns to activity_log table..." -ForegroundColor Cyan

# You'll need to set your PostgreSQL connection parameters here
$env:PGUSER = "postgres"
$env:PGPASSWORD = "postgres"  # Change this to your actual password
$env:PGDATABASE = "mcq_database"
$env:PGHOST = "localhost"
$env:PGPORT = "5432"

# SQL command to add columns if they don't exist
$sql = @"
DO \$\$
BEGIN
  -- Check if title column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'activity_log' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN title VARCHAR(255);
    RAISE NOTICE 'Added title column';
  END IF;

  -- Check if description column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'activity_log' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  END IF;
END
\$\$;
"@

# Write the SQL to a temporary file
$tempSqlFile = Join-Path $env:TEMP "update-activity-log.sql"
$sql | Out-File -FilePath $tempSqlFile -Encoding utf8

# Execute the SQL command
try {
    $output = & psql -f $tempSqlFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Columns added successfully." -ForegroundColor Green
        Write-Host $output
    } else {
        Write-Host "Error executing SQL command:" -ForegroundColor Red
        Write-Host $output
    }
} catch {
    Write-Host "Error executing psql command: $_" -ForegroundColor Red
} finally {
    # Clean up the temporary file
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile
    }
}

Write-Host "Operation completed." -ForegroundColor Cyan 