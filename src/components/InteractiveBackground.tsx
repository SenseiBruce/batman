import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number; // velocity X (px per frame)
    vy: number; // velocity Y (px per frame)
    color: string;
    createdAt: number;
}

const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd'];

export const InteractiveBackground: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const animationRef = useRef<number>();

    // Spawn a particle with optional initial velocity
    const spawnParticle = useCallback((x: number, y: number, vx = 0, vy = 0) => {
        const p: Particle = {
            id: Date.now() + Math.random(),
            x,
            y,
            vx,
            vy,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            createdAt: Date.now(),
        };
        setParticles((prev) => [...prev, p]);
    }, []);

    // Animation loop – apply inertia and fade out after 2s
    const animate = useCallback(() => {
        const now = Date.now();
        setParticles((prev) =>
            prev
                .map((p) => {
                    const newX = p.x + p.vx;
                    const newY = p.y + p.vy;
                    const newVx = p.vx * 0.94; // friction
                    const newVy = p.vy * 0.94;
                    return { ...p, x: newX, y: newY, vx: newVx, vy: newVy };
                })
                .filter((p) => now - p.createdAt < 2000) // keep for 2s
        );
        animationRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [animate]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            spawnParticle(e.clientX, e.clientY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            lastPos.current = { x: t.clientX, y: t.clientY };
            spawnParticle(t.clientX, t.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            if (lastPos.current) {
                const dx = t.clientX - lastPos.current.x;
                const dy = t.clientY - lastPos.current.y;
                const vx = dx * 0.2; // smoother motion
                const vy = dy * 0.2;
                spawnParticle(t.clientX, t.clientY, vx, vy);
                lastPos.current = { x: t.clientX, y: t.clientY };
            }
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [spawnParticle]);

    // Use Portal to render directly into document.body to avoid stacking context issues
    return createPortal(
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 2.5, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            left: p.x,
                            top: p.y,
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: p.color,
                            boxShadow: `0 0 8px ${p.color}`,
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
};
