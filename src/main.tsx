import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PermissionsProvider } from './contexts/PermissionsContext'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PermissionsProvider>
      <App />
    </PermissionsProvider>
  </AuthProvider>
);
