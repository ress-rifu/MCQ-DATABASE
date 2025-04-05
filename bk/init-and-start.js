const { spawn, exec } = require('child_process');
const path = require('path');

console.log('Starting database initialization...');

// Run the database initialization script
const initDb = exec('node init-db.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running initialization script: ${error.message}`);
    console.error('Stderr:', stderr);
    return;
  }
  
  console.log(stdout);
  console.log('Database initialization completed, starting server...');
  
  // Start the server once initialization is complete
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
  
  console.log('Server started with PID:', server.pid);
});

initDb.on('error', (error) => {
  console.error(`Error spawning database initialization: ${error.message}`);
}); 