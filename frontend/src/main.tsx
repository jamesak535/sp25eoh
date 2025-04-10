
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register } from './registerServiceWorker'

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
register();
