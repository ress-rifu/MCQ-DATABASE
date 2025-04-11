# MCQ-DATABASE Project Instructions

## Project Overview
MCQ-DATABASE is a comprehensive Multiple Choice Question management system with frontend and backend components. The application allows users to create, manage, and take exams with multiple-choice questions. It includes user authentication, role-based access control, and features for uploading, editing, and organizing questions.

## Project Structure
The project is organized into three main directories:
- `fr/`: Frontend React application
- `bk/`: Backend Node.js/Express application
- `src/`: Shared utilities and resources

## Technology Stack

### Frontend (fr/)
- **Framework**: React with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS, DaisyUI
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns
- **UI Components**: Custom components with Tailwind CSS
- **Document Processing**: docx, mammoth, xlsx for handling various file formats

### Backend (bk/)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **File Handling**: multer
- **Validation**: express-validator
- **Database Client**: pg, postgres
- **Logging**: morgan

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- npm or yarn

### Initial Setup
1. Clone the repository
2. Install dependencies for all components:
   ```
   npm run setup
   ```
3. Set up environment variables:
   - Create `.env` file in the root directory
   - Create `.env` file in the `bk/` directory
   - Create `.env` file in the `fr/` directory

### Database Setup
1. Create a PostgreSQL database
2. Run the initialization script:
   ```
   npm run init-db
   ```
3. Verify database connection:
   ```
   npm run check-db
   ```

### Running the Application
1. Start the backend server:
   ```
   npm run dev:backend
   ```
2. Start the frontend development server:
   ```
   npm run dev:frontend
   ```
3. Access the application at http://localhost:5173

## Frontend Implementation

### Project Structure
```
fr/
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── router.jsx
│   ├── MainStructure.jsx
│   ├── apiConfig.js
│   ├── index.css
│   ├── Authentications/
│   ├── Common/
│   ├── Login/
│   ├── Pages/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── styles/
│   └── utils/
```

### Key Components

#### Authentication System
1. Implement JWT-based authentication with login/logout functionality
2. Create protected routes for different user roles (admin, teacher, student)
3. Implement context provider for auth state management

#### Main Application Structure
1. Create a responsive layout with sidebar navigation
2. Implement role-based navigation items
3. Add notification system for user feedback

#### Question Management
1. Create interfaces for question creation, editing, and deletion
2. Implement question bank browsing with filtering and search
3. Add support for various question types (MCQ, true/false, etc.)
4. Implement LaTeX support for mathematical equations

#### Exam System
1. Create exam creation interface for teachers/admins
2. Implement exam taking interface for students
3. Add timer functionality for exams
4. Create leaderboard and results display

#### File Handling
1. Implement document upload (DOCX, XLSX) for batch question import
2. Create parsers for different file formats
3. Add validation for uploaded content

### Styling
1. Configure Tailwind CSS with custom theme
2. Implement responsive design for all screen sizes
3. Create consistent UI components using Tailwind and DaisyUI
4. Add dark/light mode support

## Backend Implementation

### Project Structure
```
bk/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── server.js
└── db.js
```

### Database Schema
1. Users table with role-based permissions
2. Questions table with metadata and content
3. Exams table with configuration and questions
4. Results table for exam submissions
5. Curriculum and course tables for organization

### API Endpoints

#### Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

#### Users
- GET /api/users
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

#### Questions
- GET /api/questions
- GET /api/questions/:id
- POST /api/questions
- PUT /api/questions/:id
- DELETE /api/questions/:id
- POST /api/questions/upload

#### Exams
- GET /api/exams
- GET /api/exams/:id
- POST /api/exams
- PUT /api/exams/:id
- DELETE /api/exams/:id
- POST /api/exams/:id/submit

#### Curriculum
- GET /api/curriculum
- POST /api/curriculum
- PUT /api/curriculum/:id
- DELETE /api/curriculum/:id

### Middleware
1. Authentication middleware for protected routes
2. Role-based access control
3. Error handling middleware
4. Request validation middleware
5. File upload middleware

### Security Considerations
1. Implement password hashing with bcrypt
2. Use JWT for secure authentication
3. Implement CORS protection
4. Validate all user inputs
5. Sanitize database queries to prevent SQL injection

## Advanced Features

### LaTeX Support
1. Implement LaTeX rendering for mathematical equations
2. Create LaTeX table converter for complex data presentation
3. Add support for LaTeX in question content and answers

### Real-time Features
1. Implement socket.io for real-time exam updates
2. Add live leaderboard during exams
3. Create notification system for important events

### Analytics
1. Implement exam statistics for teachers
2. Create student performance analytics
3. Add question difficulty analysis

### Internationalization
1. Support for multiple languages (English, Bengali)
2. Implement proper font handling for different scripts
3. Create localized content management

## Deployment Considerations
1. Configure environment variables for production
2. Set up database connection pooling
3. Implement proper error logging
4. Configure CORS for production domains
5. Set up CI/CD pipeline for automated deployment

## Testing Strategy
1. Unit tests for critical components
2. Integration tests for API endpoints
3. End-to-end tests for critical user flows
4. Performance testing for exam taking system

## Maintenance and Scalability
1. Implement database indexing for performance
2. Create backup and restore procedures
3. Plan for horizontal scaling of backend services
4. Implement caching strategies for frequently accessed data

This instruction file provides a comprehensive guide for building the MCQ-DATABASE application from scratch. It covers all aspects of the application including architecture, implementation details, and advanced features.
