import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface TimeCostDisplayProps {
    amount: number;
    hourlyWage: number;
    className?: string;
}

export const TimeCostDisplay: React.FC<TimeCostDisplayProps> = ({ amount, hourlyWage, className = '' }) => {
    const timeCost = useMemo(() => {
        if (!hourlyWage || hourlyWage <= 0) return null;

        // Ensure accurate calculation
        const hours = amount / hourlyWage;

        // If it's negligible (less than 5 mins ~ 0.08 hours), maybe don't show it? 
        // Or show as "< 5m work"
        if (hours < 0.08) return null;

        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes}m work`;
        }

        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);

        if (m === 0) return `${h}h work`;
        return `${h}h ${m}m work`;
    }, [amount, hourlyWage]);

    if (!timeCost) return null;

    return (
        <div className={`flex items-center gap-1 text-xs text-orange-400 font-medium ${className}`}>
            <Clock className="w-3 h-3" />
            <span>{timeCost}</span>
        </div>
    );
};
