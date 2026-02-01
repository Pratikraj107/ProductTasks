import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

// Simple SPA Router
function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation function that updates both state and browser history
  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  };

  // Render the appropriate component based on current path
  const renderPage = () => {
    // Check if path starts with /admin
    if (currentPath.startsWith('/admin')) {
      return (
        <AuthProvider navigate={navigate}>
          <AdminRoute>
            <AdminLayout onNavigate={navigate} />
          </AdminRoute>
        </AuthProvider>
      );
    }

    switch (currentPath) {
      case '/signin':
        return (
          <AuthProvider navigate={navigate}>
            <SignIn onNavigate={navigate} />
          </AuthProvider>
        );
      case '/signup':
        return (
          <AuthProvider navigate={navigate}>
            <SignUp onNavigate={navigate} />
          </AuthProvider>
        );
      case '/':
        return (
          <AuthProvider navigate={navigate}>
            <Home onNavigate={navigate} />
          </AuthProvider>
        );
      default:
        return (
          <AuthProvider navigate={navigate}>
            <ProtectedRoute>
              <DashboardLayout onNavigate={navigate} />
            </ProtectedRoute>
          </AuthProvider>
        );
    }
  };

  return renderPage();
}


export default App;
