import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/error" element={
          <div className="min-h-screen bg-base grid-bg flex items-center justify-center px-4">
            <p className="text-debit text-sm text-center">
              Authentication failed. <a href="/login" className="underline text-gold">Try again</a>
            </p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}