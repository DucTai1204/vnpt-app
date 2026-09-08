import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {BootstrapProvider} from './api/BootstrapContext.tsx';
import {AuthProvider} from './api/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BootstrapProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BootstrapProvider>
  </StrictMode>,
);
