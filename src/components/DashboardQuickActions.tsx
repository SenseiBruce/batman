import React from 'react';

interface DashboardQuickActionsProps {
  onOpenBudgetSettings: () => void;
}

const ActionButton: React.FC<{
  label: string;
  href?: string;
  onClick?: () => void;
  color: string;
  children: React.ReactNode;
}> = ({ label, href, onClick, color, children }) => (
  <button
    onClick={() => {
      if (onClick) onClick();
      else if (href) window.location.hash = href;
    }}
    className="flex flex-col items-center gap-1 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all"
  >
    <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {children}
    </svg>
    <span className="text-xs text-gray-300">{label}</span>
  </button>
);

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ onOpenBudgetSettings }) => (
  <div className="mb-4 p-3 bg-gray-800 rounded-xl border border-gray-700 shadow-xl no-capture">
    <div className="grid grid-cols-3 gap-2">
      <ActionButton label="Accounts" href="#/accounts" color="text-blue-400">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </ActionButton>
      <ActionButton label="Settings" onClick={onOpenBudgetSettings} color="text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </ActionButton>
      <ActionButton label="Reports" href="#/custom-reports" color="text-green-400">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </ActionButton>
      <ActionButton label="Wishlist" href="#/wishlist" color="text-orange-400">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01" />
      </ActionButton>
      <ActionButton label="Jarvis" href="#/jarvis" color="text-pink-400">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </ActionButton>
      <ActionButton label="System" href="#/settings" color="text-gray-400">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </ActionButton>
    </div>
  </div>
);
