import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    delay?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 1000,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = '',
    delay = 0,
}) => {
    const count = useCountUp({ end: value, duration, decimals, delay });

    return (
        <span className={className}>
            {prefix}
            {typeof count === 'number' ? count.toLocaleString() : count}
            {suffix}
        </span>
    );
};

interface AnimatedProgressBarProps {
    percentage: number;
    duration?: number;
    color?: string;
    delay?: number;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
    percentage,
    duration = 800,
    color = 'bg-blue-500',
    delay = 0,
}) => {
    const width = useCountUp({ end: Math.min(percentage, 100), duration, decimals: 1, delay });

    return (
        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${color}`}
                style={{ width: `${width}%` }}
            />
        </div>
    );
};
