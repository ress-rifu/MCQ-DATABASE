# Question Database Application

A full-stack application for managing question databases with automatic hot-reloading for development.

## Development with Auto-Reloading

This project is set up with auto-reloading for both frontend and backend:

### Frontend (Vite + React)
- Uses Vite's built-in Hot Module Replacement (HMR)
- Any code changes trigger an immediate page update without full reloads
- Preserves component state during updates

### Backend (Node.js + Express)
- Uses Nodemon to watch for file changes
- Automatically restarts the server when changes are detected
- Configured to ignore temporary files and focus on important code changes

## Running the Application

### Starting Both Frontend and Backend Together

```bash
# Install dependencies first if you haven't already
npm install            # Root level dependencies
cd fr && npm install   # Frontend dependencies
cd ../bk && npm install # Backend dependencies

# Start both services with one command (from the root directory)
npm run dev
```

### Starting Services Separately

If you need to run the frontend or backend separately:

```bash
# Start only the frontend
npm run frontend

# Start only the backend
npm run backend
```

## Development Workflow

1. Make changes to any frontend or backend file
2. The appropriate service will automatically reload
3. See your changes instantly reflected in the browser
4. No need to manually restart servers or refresh pages

## Troubleshooting

If auto-reloading stops working:

- Frontend: Press `h` in the terminal running Vite to see HMR status
- Backend: Press `rs` in the terminal running Nodemon to manually restart
- Try closing and restarting the development servers 