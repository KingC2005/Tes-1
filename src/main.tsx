import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Self-hosted Persian font (works fully offline in the desktop app & PWA)
import '@fontsource-variable/vazirmatn';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
