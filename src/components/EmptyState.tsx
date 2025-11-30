import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}) => {
    const defaultIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-slate-600 animate-in zoom-in-95 duration-500">
                {icon || defaultIcon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-2 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                {title}
            </h3>

            {/* Description */}
            <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
                {description}
            </p>

            {/* Actions */}
            {(actionLabel || secondaryActionLabel) && (
                <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-6 py-2.5 rounded-lg border border-slate-600 transition-all duration-300 active:scale-95"
                        >
                            {secondaryActionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Preset empty states for common scenarios
export const NoTransactionsEmpty: React.FC<{ onSync?: () => void; onAdd?: () => void }> = ({ onSync, onAdd }) => (
    <EmptyState
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        }
        title="No Transactions Yet"
        description="Start tracking your expenses by syncing your SMS messages or adding transactions manually."
        actionLabel={onSync ? "Sync SMS" : undefined}
        onAction={onSync}
        secondaryActionLabel={onAdd ? "Add Manually" : undefined}
        onSecondaryAction={onAdd}
    />
);

export const NoDataEmpty: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
    <EmptyState
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        }
        title="No Data Available"
        description="There's no data to display for the selected period. Try changing your filters or date range."
        actionLabel={onAction ? "Clear Filters" : undefined}
        onAction={onAction}
    />
);

export const NoSearchResultsEmpty: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
    <EmptyState
        icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
        }
        title="No Results Found"
        description="We couldn't find any transactions matching your search. Try different keywords or filters."
        actionLabel={onClear ? "Clear Search" : undefined}
        onAction={onClear}
    />
);
