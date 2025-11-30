import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    const THRESHOLD = 80;
    const MAX_PULL = 150;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0 && !isRefreshing) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (window.scrollY === 0 && startY > 0 && !isRefreshing) {
            const currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0) {
                // Apply resistance
                const newDistance = Math.min(diff * 0.5, MAX_PULL);
                setPullDistance(newDistance);
                // Prevent default only if we are pulling down to refresh to avoid scrolling issues
                // e.preventDefault(); 
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD); // Snap to threshold

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                setStartY(0);
            }
        } else {
            setPullDistance(0);
            setStartY(0);
        }
    };

    useEffect(() => {
        controls.start({ y: pullDistance });
    }, [pullDistance, controls]);

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="min-h-screen relative"
        >
            {/* Refresh Indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none"
                style={{ height: pullDistance, opacity: Math.min(pullDistance / THRESHOLD, 1) }}
            >
                <div className={`transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }}>
                    {isRefreshing ? (
                        <svg className="w-6 h-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Content */}
            <motion.div animate={controls} className="relative z-10">
                {children}
            </motion.div>
        </div>
    );
};
