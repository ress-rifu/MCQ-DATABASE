# MCQ Database System

A comprehensive MCQ (Multiple Choice Question) management system with both frontend and backend components.

## Project Structure

This project is organized with a modular architecture:

- **Root Directory**: Contains a simplified server for development and testing
- **`bk/`**: The main backend Express server with complete functionality
- **`fr/`**: The frontend React application built with Vite
- **`test-files/`**: Sample files for testing

## Centralized CORS Configuration

This project uses a centralized CORS configuration through environment variables:

1. In the root directory, the `.env` file contains CORS settings that are shared across the entire project:
   ```
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
   CORS_CREDENTIALS=true
   ```

2. Both the main server and backend server read these settings and apply them to their CORS configuration.

3. To add or modify allowed origins:
   - Update the `CORS_ORIGINS` variable in the root `.env` file
   - Restart the servers for changes to take effect

4. The frontend API URL should match one of the allowed origins in the `CORS_ORIGINS` list.

## Database Setup

The application requires a PostgreSQL database. There are two ways to set up the database:

### Automatic Setup

Run the database initialization script:

```bash
npm run init-db
```

This interactive script will:
1. Check if PostgreSQL is installed
2. Prompt you for database credentials
3. Create the necessary .env files
4. Test the database connection
5. Initialize the database schema (optional)

### Manual Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE question_db;
   ```

2. Configure the environment variables:
   - Create a `.env` file in the root directory
   - Create a `.env` file in the `bk/` directory

   Root `.env` example:
   ```
   PORT=3000
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
   CORS_CREDENTIALS=true
   DATABASE_URL=postgres://username:password@localhost:5432/question_db
   ```

   Backend `.env` example:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/question_db
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

3. Initialize the database schema:
   ```bash
   cd bk
   node setup-db.js
   ```

4. Test the database connection:
   ```bash
   npm run check-db
   ```

## Troubleshooting Database Connection Issues

If you encounter database connection errors, here are some common issues and solutions:

### Password Authentication Failed

If you see an error like:
```
error: password authentication failed for user "postgres"
```

This means the password in your connection string doesn't match the actual PostgreSQL password.

Solutions:
1. Update the `.env` files with the correct password:
   ```
   DATABASE_URL=postgres://postgres:correctPassword@localhost:5432/question_db
   ```
   
2. Run the database initialization script again:
   ```bash
   npm run init-db
   ```
   
3. If you're not sure about your PostgreSQL password, you can reset it:
   - For Windows:
     ```
     psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'newpassword';"
     ```
   - For Linux/Mac:
     ```
     sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'newpassword';"
     ```

### Database Doesn't Exist

If you see an error about the database not existing:

Solutions:
1. Create the database manually:
   ```
   psql -U postgres -c "CREATE DATABASE question_db;"
   ```
   
2. Run the database initialization script with the correct database name:
   ```bash
   npm run init-db
   ```

### PostgreSQL Service Not Running

Solutions:
1. Start the PostgreSQL service:
   - Windows: Open Services app and start PostgreSQL service
   - Linux: `sudo service postgresql start`
   - Mac: `brew services start postgresql`

## Quick Start

### Install Dependencies

```bash
# Install root project dependencies
npm install

# Install all dependencies for frontend and backend
npm run setup
```

### Run the Application

You can run the application in several ways:

```bash
# Run the simplified root server
npm run dev

# Run the complete backend server
npm run dev:backend

# Run the frontend application
npm run dev:frontend
```

For production:

```bash
# Run the production backend
npm run start:backend

# Run the frontend in production mode
npm run start:frontend
```

## Backend API

The backend provides a RESTful API for question management, authentication, and more. 
See the `bk/README.md` file for more details on the API endpoints.

## Frontend

The frontend is a React application that provides a user interface for managing questions, 
users, and curriculum. See the `fr/README.md` file for more details.

## Contributing

Feel free to contribute to this project by opening issues or pull requests.

## Features

- User authentication and role-based access control
- Question management with support for images and multiple choice options
- Excel/CSV import and export functionality
- Curriculum management (Classes, Subjects, Chapters)
- Responsive frontend built with React and Tailwind CSS

## System Requirements

- Node.js (v16+)
- PostgreSQL (v12+)
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/question-database.git
cd question-database
```

### 2. Database Setup

1. Install PostgreSQL if not already installed
2. Create a database:

```bash
createdb question_db
```

3. Run the setup script to create all necessary tables and initial data:

```bash
cd bk
psql -d question_db -f setup-database.sql
```

Alternatively, you can use the Node.js setup script:

```bash
cd bk
node setup-db.js
```

#### Database Schema

The setup script creates the following tables:

- `users` - User accounts with roles (admin, teacher, etc.)
- `classes` - School classes (Class 6, Class 7, etc.)
- `subjects` - Academic subjects per class (Math, Science, etc.)
- `chapters` - Chapters within each subject
- `questions` - Question bank with options, answers, and references

The script also populates default data:
- Default classes (Class 6 through Class 10)
- Default subjects for each class
- Initial chapter structure

#### Manual Table Creation

If you prefer to create tables manually, here are the essential SQL commands:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, class_id)
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, subject_id)
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  qserial VARCHAR(20),
  classname VARCHAR(50),
  subject VARCHAR(100),
  chapter VARCHAR(100),
  topic VARCHAR(100),
  ques TEXT,
  ques_img TEXT,
  option_a TEXT,
  option_a_img TEXT,
  option_b TEXT,
  option_b_img TEXT,
  option_c TEXT,
  option_c_img TEXT,
  option_d TEXT,
  option_d_img TEXT,
  answer VARCHAR(10),
  explanation TEXT,
  explanation_img TEXT,
  hint TEXT,
  hint_img TEXT,
  difficulty_level VARCHAR(20),
  reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Verify Database Setup

To verify that your database tables were created successfully:

```bash
psql -d question_db -c "\dt"  # Lists all tables
psql -d question_db -c "SELECT * FROM classes;"  # Should show default classes
```

### 3. Backend Setup

1. Navigate to the backend directory:

```bash
cd bk
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
# Create .env file
cp .env.example .env
```

4. Edit the `.env` file with your database credentials:

```
DATABASE_URL=postgres://username:password@localhost:5432/question_db
JWT_SECRET=your_secret_key_here_make_it_long_and_random_to_ensure_security
NODE_ENV=development
```

5. Start the backend server:

```bash
npm run dev
```

The server should now be running on http://localhost:3000

### 4. Frontend Setup

1. Navigate to the frontend directory:

```bash
cd fr
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
# Create .env file if it doesn't exist
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

4. Start the development server:

```bash
npm run dev
```

The frontend should now be accessible at http://localhost:5173

## API Documentation

The backend offers several API endpoints:

- `/api/auth` - Authentication routes (login, register)
- `/api/questions` - Question management
- `/api/curriculum` - Classes, subjects, and chapters management
- `/api/users` - User management

## Initial Admin Account

To create an admin account, run:

```bash
cd bk
node create-admin.js
```

Follow the prompts to create your admin user.

## Production Deployment

### Backend

1. Build and start the backend:

```bash
cd bk
npm start
```

### Frontend

1. Create a production build:

```bash
cd fr
npm run build
```

2. The output will be in the `fr/dist` directory, which can be served by any static file server.

## Troubleshooting

- If the database connection fails, check your PostgreSQL service status and credentials
- For CORS issues, verify the frontend URL is correctly configured in the backend
- For file upload issues, ensure the 'uploads' directory is writable

## License

[MIT License](LICENSE)

## Recent Updates

### Exam Structure Changes
We've updated the exam structure to better organize content:

1. **Courses as Container**: Exams are now organized under courses rather than directly referencing classes/subjects/chapters.
2. **Multiple Chapters**: Each exam can now include questions from multiple chapters, providing more flexibility in creating comprehensive assessments.

### Migration Instructions

To update your database with the new schema:

1. Make sure your database is backed up
2. Run the migration script:
   ```
   cd bk
   node apply_migrations.js
   ```

## For Developers

### Database Schema Changes

- The `exams` table now references `courses` instead of having direct references to classes, subjects, and chapters
- A new `exam_chapters` table has been added to associate exams with multiple chapters
- API endpoints have been updated to reflect these changes

### Frontend Changes

- The exam creation form has been updated to select a course and multiple chapters
- The exam listing page now shows course information 