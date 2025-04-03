# Question Database Application

A full-stack application for managing MCQ question databases with comprehensive import, export, and management features.

## System Requirements

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- MongoDB (v4.4 or later)

## Project Structure

```
Question Database/
├── bk/                 # Backend code
│   ├── controllers/    # API controllers
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   └── server.js       # Main server file
├── fr/                 # Frontend code
│   ├── public/         # Static assets
│   ├── src/            # React source code
│   │   ├── Components/ # Reusable components
│   │   └── Pages/      # Page components
│   └── index.html      # Main HTML file
└── package.json        # Root package.json for scripts
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ress-rifu/MCQ-DATABASE.git
   cd "Question Database"
   ```

2. Install dependencies:
   ```bash
   # Root level dependencies
   npm install
   
   # Frontend dependencies
   cd fr && npm install
   
   # Backend dependencies
   cd ../bk && npm install
   ```

## Database Setup

This application uses MongoDB as its database. Follow these steps to set up the database:

1. **Install MongoDB** - If you don't have MongoDB installed:
   - [Download and install MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - Or use Docker:
     ```bash
     docker run --name mcq-mongo -p 27017:27017 -d mongo
     ```

2. **Configure Database Connection**:
   - Create a `.env` file in the `bk` directory with the following content:
     ```
     MONGODB_URI=mongodb://localhost:27017/question_database
     PORT=5000
     JWT_SECRET=your_secure_jwt_secret
     ```
   - Replace `your_secure_jwt_secret` with a strong secret key for JWT authentication

3. **Initialize Database** (Optional):
   - If you want to pre-populate the database with sample data:
     ```bash
     cd bk
     npm run seed
     ```

## Running the Application

### Development Mode (with Auto-Reloading)

Start both frontend and backend with a single command:

```bash
# From the root directory
npm run dev
```

This will:
- Start the backend server on port 5000 with Nodemon for auto-reloading
- Start the frontend development server on port 3000 with HMR enabled

### Starting Services Separately

If you need to run the frontend or backend independently:

```bash
# Start only the frontend
npm run frontend

# Start only the backend
npm run backend
```

### Production Mode

For production deployment:

1. Build the frontend:
   ```bash
   cd fr
   npm run build
   ```

2. Start the production server:
   ```bash
   # From the root directory
   npm run start
   ```

## Application Features

- **Question Management**: Create, read, update, and delete questions
- **Bulk Import/Export**: Import and export questions in Excel format
- **Categorization**: Organize questions by class, subject, chapter, and topic
- **Search & Filter**: Advanced search and filtering capabilities
- **Image Support**: Upload and manage images for questions and answers

## User Guide

### Importing Questions

1. Navigate to the Upload page
2. Download the complete template by clicking "Download Complete Template"
3. Fill in the template with your questions
4. Select the appropriate Class, Subject, and Chapter
5. Upload your completed template
6. Click "Analyze File" to preview the data
7. Click "Import" to add the questions to the database

### Managing Questions

1. Use the Questions page to view all questions
2. Filter by Class, Subject, Chapter, or Topic
3. Use the search bar to find specific questions
4. Edit or delete questions as needed

## Troubleshooting

### Database Connection Issues
- Ensure MongoDB is running: `mongod --version`
- Check your database connection string in the `.env` file
- Verify network connectivity to the database server

### Frontend Issues
- Clear your browser cache
- Check the console for error messages
- Ensure all dependencies are installed: `cd fr && npm install`

### Backend Issues
- Check the server logs for error messages
- Ensure all dependencies are installed: `cd bk && npm install`
- Verify the correct port is available: `lsof -i :5000`

### Auto-Reloading Not Working
- Frontend: Press `h` in the terminal running Vite to see HMR status
- Backend: Press `rs` in the terminal running Nodemon to manually restart
- Try closing and restarting the development servers

## License

This project is licensed under the MIT License - see the LICENSE file for details. 