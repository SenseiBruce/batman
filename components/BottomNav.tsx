import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
  <Link to={to} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-blue-400' : 'text-gray-500'}`}>
    <div className="text-xl">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </Link>
);

export const BottomNav = () => {
  const location = useLocation();
  const p = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-around z-50 max-w-md mx-auto">
      <NavItem 
        to="/" 
        active={p === '/'} 
        label="Home"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        } 
      />
      <NavItem 
        to="/transactions" 
        active={p === '/transactions'} 
        label="History"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        } 
      />
      <div className="relative -top-5">
        <Link to="/add" className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg ring-4 ring-gray-900 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </Link>
      </div>
      <NavItem 
        to="/jarvis" 
        active={p === '/jarvis'} 
        label="Jarvis"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        } 
      />
      <NavItem 
        to="/budgets" 
        active={p === '/budgets'} 
        label="Budgets"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
        } 
      />
    </div>
  );
};