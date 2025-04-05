const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('MCQ Database Initialization Script');
console.log('---------------------------------');
console.log('This script will help you set up the database and environment variables.');

// Check if PostgreSQL is installed
try {
  console.log('\nChecking PostgreSQL installation...');
  execSync('pg_isready', { stdio: 'ignore' });
  console.log('✅ PostgreSQL is installed and running.');
} catch (error) {
  console.log('❌ PostgreSQL might not be installed or running.');
  console.log('Please install PostgreSQL and start the service before continuing.');
}

// Prompt for database details
rl.question('\nEnter PostgreSQL username (default: postgres): ', (username) => {
  username = username || 'postgres';
  
  console.log('\nIMPORTANT: You must enter the actual password for your PostgreSQL user.');
  console.log('This is the password you set during PostgreSQL installation or for the specific user.');
  rl.question('Enter PostgreSQL password: ', (password) => {
    
    rl.question('Enter database name (default: question_db): ', (dbname) => {
      dbname = dbname || 'question_db';
      
      rl.question('Enter host (default: localhost): ', (host) => {
        host = host || 'localhost';
        
        rl.question('Enter port (default: 5432): ', (port) => {
          port = port || '5432';
          
          // Create .env file with database configuration
          const envPath = path.join(__dirname, '.env');
          const envContent = `# Server Configuration
PORT=3000

# CORS Configuration
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
CORS_CREDENTIALS=true

# Database Configuration
# Make sure this password matches your actual PostgreSQL password
DATABASE_URL=postgres://${username}:${password}@${host}:${port}/${dbname}
`;
          
          fs.writeFileSync(envPath, envContent);
          console.log(`\n✅ Created .env file at ${envPath}`);
          
          // Create .env file for backend
          const backendEnvPath = path.join(__dirname, 'bk', '.env');
          const backendEnvContent = `# Include CORS settings from root .env file
# The root .env file defines CORS_ORIGINS and CORS_CREDENTIALS

# Database Configuration
# Make sure this password matches your actual PostgreSQL password
DATABASE_URL=postgres://${username}:${password}@${host}:${port}/${dbname}
JWT_SECRET=your_secret_key_here_make_it_long_and_random_to_ensure_security
NODE_ENV=development`;
          
          fs.writeFileSync(backendEnvPath, backendEnvContent);
          console.log(`✅ Created backend .env file at ${backendEnvPath}`);
          
          console.log('\nTrying to connect to the database...');
          
          try {
            // Try to check database connection
            execSync('node bk/check-db.js', { stdio: 'inherit' });
            
            // Check if database exists, create if it doesn't
            console.log('\nChecking if database exists...');
            try {
              execSync(`psql -U ${username} -h ${host} -p ${port} -c "SELECT 1" ${dbname}`, 
                { stdio: 'ignore' });
              console.log(`✅ Database '${dbname}' exists.`);
            } catch (error) {
              console.log(`Database '${dbname}' does not exist. Creating...`);
              try {
                execSync(`psql -U ${username} -h ${host} -p ${port} -c "CREATE DATABASE ${dbname}"`, 
                  { stdio: 'inherit' });
                console.log(`✅ Created database '${dbname}'.`);
              } catch (createError) {
                console.error(`❌ Failed to create database: ${createError.message}`);
                console.log('You may need to create the database manually:');
                console.log(`psql -U ${username} -c "CREATE DATABASE ${dbname}"`);
              }
            }
            
            // Create database schema
            console.log('\nWould you like to initialize the database schema? (y/n)');
            rl.question('> ', (answer) => {
              if (answer.toLowerCase() === 'y') {
                try {
                  console.log('\nInitializing database schema...');
                  execSync('cd bk && node setup-db.js', { stdio: 'inherit' });
                  console.log('✅ Database schema initialized successfully');
                } catch (error) {
                  console.log('❌ Error initializing database schema:', error.message);
                }
              }
              
              console.log('\nSetup completed! You can now start the application:');
              console.log('- Run backend: npm run dev:backend');
              console.log('- Run frontend: npm run dev:frontend');
              
              rl.close();
            });
          } catch (error) {
            console.log('❌ Database connection failed. Please check your configuration.');
            console.log('\nCommon issues:');
            console.log('1. PostgreSQL service not running');
            console.log('2. Incorrect password');
            console.log('3. User does not have permission to create databases');
            console.log('\nTo update the configuration, edit the .env files or run this script again.');
            rl.close();
          }
        });
      });
    });
  });
}); 