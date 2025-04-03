# Question Database System

A comprehensive question management system with frontend, backend, and PostgreSQL database integration.

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

## Project Structure

- `fr/` - Frontend React application (Vite)
- `bk/` - Backend Express server
- `setup-database.sql` - Database schema and initial data

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