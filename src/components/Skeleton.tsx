import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string;
    height?: string;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse',
}) => {
    const baseClasses = 'bg-slate-700/50';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 bg-[length:200%_100%]',
        none: '',
    };

    const style: React.CSSProperties = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

// Preset skeleton components for common use cases

export const TransactionSkeleton: React.FC = () => (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="40px" height="40px" />
            <div className="flex-1">
                <Skeleton width="60%" height="16px" className="mb-2" />
                <Skeleton width="40%" height="12px" />
            </div>
            <div className="text-right">
                <Skeleton width="80px" height="20px" className="mb-1" />
                <Skeleton width="60px" height="12px" />
            </div>
        </div>
    </div>
);

export const CategoryCardSkeleton: React.FC = () => (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width="40px" height="40px" />
                <div>
                    <Skeleton width="100px" height="16px" className="mb-1" />
                    <Skeleton width="80px" height="12px" />
                </div>
            </div>
            <div className="text-right">
                <Skeleton width="80px" height="20px" className="mb-1" />
                <Skeleton width="60px" height="12px" />
            </div>
        </div>
        <Skeleton width="100%" height="8px" className="rounded-full" />
    </div>
);

export const StatCardSkeleton: React.FC = () => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="circular" width="16px" height="16px" />
            <Skeleton width="60px" height="12px" />
        </div>
        <Skeleton width="120px" height="28px" className="mb-1" />
        <Skeleton width="80px" height="12px" />
    </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '200px' }) => (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <Skeleton width="150px" height="20px" className="mb-4" />
        <Skeleton width="100%" height={height} variant="rectangular" />
    </div>
);

export const ListSkeleton: React.FC<{ count?: number; type?: 'transaction' | 'category' | 'stat' }> = ({
    count = 3,
    type = 'transaction'
}) => {
    const SkeletonComponent = {
        transaction: TransactionSkeleton,
        category: CategoryCardSkeleton,
        stat: StatCardSkeleton,
    }[type];

    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
};

export const DashboardSkeleton: React.FC = () => (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="mb-6">
            <Skeleton width="150px" height="32px" className="mb-3" />
            <Skeleton width="100%" height="40px" variant="rectangular" />
        </div>

        {/* Total Budget Card */}
        <div className="bg-slate-800 p-5 rounded-2xl mb-6 border border-slate-700">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <Skeleton width="100px" height="14px" className="mb-2" />
                    <Skeleton width="150px" height="32px" />
                </div>
                <div className="text-right">
                    <Skeleton width="80px" height="14px" className="mb-2" />
                    <Skeleton width="120px" height="24px" />
                </div>
            </div>
            <Skeleton width="100%" height="12px" className="rounded-full" />
        </div>

        {/* Category List */}
        <ListSkeleton count={4} type="category" />
    </div>
);

export const TransactionsSkeleton: React.FC = () => (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="mb-6">
            <Skeleton width="150px" height="32px" className="mb-3" />
        </div>

        {/* Budget Summary */}
        <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <Skeleton width="150px" height="12px" className="mb-2" />
                    <Skeleton width="120px" height="28px" />
                </div>
                <div className="text-right">
                    <Skeleton width="80px" height="12px" className="mb-2" />
                    <Skeleton width="100px" height="20px" />
                </div>
            </div>
            <Skeleton width="100%" height="8px" className="rounded-full" />
        </div>

        {/* Month Selector */}
        <Skeleton width="100%" height="40px" className="mb-4 rounded-lg" />

        {/* Transactions */}
        <ListSkeleton count={5} type="transaction" />
    </div>
);

export const InsightsSkeleton: React.FC = () => (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="mb-6">
            <Skeleton width="150px" height="32px" className="mb-3" />
            <Skeleton width="100%" height="40px" variant="rectangular" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>

        {/* Charts */}
        <ChartSkeleton height="200px" />
        <div className="h-6" />
        <ChartSkeleton height="160px" />
    </div>
);
