import { createRoot } from 'react-dom/client'
import * as React from "react";
import './index.css'
import './styles/direct-fonts.css' // Import our direct font styles
import App from './App';

// Render directly without StrictMode to prevent double renders and animations
createRoot(document.getElementById('root')).render(<App />)
