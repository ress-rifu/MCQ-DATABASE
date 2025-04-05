import { createRoot } from 'react-dom/client'
import * as React from "react";
import './index.css'
import App from './App';

// Render directly without StrictMode to prevent double renders and animations
createRoot(document.getElementById('root')).render(<App />)
