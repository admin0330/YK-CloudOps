import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function BackNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const hasHistory = window.history.length > 1;

  const handleBack = () => {
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
      <button
        onClick={handleBack}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          color: 'var(--text-muted)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 280ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <ArrowLeft size={13} />
        Back
      </button>
      <button
        onClick={handleHome}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          color: 'var(--text-muted)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 280ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        <Home size={13} />
        Home
      </button>
    </div>
  );
}
