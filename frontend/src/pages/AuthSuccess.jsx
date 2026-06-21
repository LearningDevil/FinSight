import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-base grid-bg flex items-center justify-center">
      <p className="text-secondary text-sm">Signing you in...</p>
    </div>
  );
}