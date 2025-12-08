import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

const NavItem = ({ to, icon, label, active, gradientFrom = 'blue-400', gradientTo = 'blue-500' }: NavItemProps) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-300 ${active
      ? `text-transparent bg-clip-text bg-gradient-to-r from-${gradientFrom} to-${gradientTo}`
      : 'text-slate-500 hover:text-slate-400'
      }`}
  >
    <div className={`transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
      <div className={active ? `text-${gradientFrom}` : ''}>{icon}</div>
    </div>
    <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
  </Link>
);

export const BottomNav = () => {
  const location = useLocation();
  const p = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 max-w-md mx-auto shadow-2xl">
      <div className="flex items-center h-full">
        {/* Left side - 2 items */}
        <NavItem
          to="/"
          active={p === '/'}
          label="Dashboard"
          gradientFrom="blue-400"
          gradientTo="blue-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
        />
        <NavItem
          to="/transactions"
          active={p === '/transactions'}
          label="Transactions"
          gradientFrom="violet-400"
          gradientTo="violet-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />

        {/* Center button */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute -top-5">
            <Link
              to="/add"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/50 ring-4 ring-slate-900 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right side - 2 items */}
        <NavItem
          to="/subscriptions"
          active={p === '/subscriptions'}
          label="Subscriptions"
          gradientFrom="purple-400"
          gradientTo="purple-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <NavItem
          to="/insights"
          active={p === '/insights'}
          label="Insights"
          gradientFrom="green-400"
          gradientTo="green-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          }
        />
      </div>
    </div>
  );
};