import { useEffect, useState } from 'react';

interface UseCountUpOptions {
    end: number;
    duration?: number; // in milliseconds
    start?: number;
    decimals?: number;
    delay?: number; // delay before starting
}

export const useCountUp = ({
    end,
    duration = 1000,
    start = 0,
    decimals = 0,
    delay = 0,
}: UseCountUpOptions) => {
    const [count, setCount] = useState(start);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentCount = start + (end - start) * easeOut;
            setCount(currentCount);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure we end at exact value
            }
        };

        const timeoutId = setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [end, duration, start, delay]);

    return decimals > 0 ? count.toFixed(decimals) : Math.round(count);
};
