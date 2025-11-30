import React, { useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { HapticService } from '../services/hapticService';

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    threshold?: number;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    onDelete,
    onEdit,
    threshold = 100,
}) => {
    const controls = useAnimation();
    const [isDragging, setIsDragging] = useState(false);
    const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;

        // Trigger haptic when crossing threshold
        if (!hasTriggeredHaptic && Math.abs(offset) > threshold) {
            HapticService.medium(); // Medium haptic when threshold crossed
            setHasTriggeredHaptic(true);
        }
    };

    const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        setHasTriggeredHaptic(false);
        const offset = info.offset.x;

        if (onDelete && offset < -threshold) {
            // Swiped left enough to delete
            HapticService.heavy(); // Heavy haptic for delete action
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
            onDelete();
            // Reset position after a delay in case the delete is cancelled or handled elsewhere
            // In a real app, the item usually disappears from the list, so this might not be needed
            // But if we show a confirmation dialog, we might want to snap back if cancelled
            controls.set({ x: 0, opacity: 1 });
        } else if (onEdit && offset > threshold) {
            // Swiped right enough to edit
            HapticService.medium(); // Medium haptic for edit action
            onEdit();
            controls.start({ x: 0 });
        } else {
            // Snap back
            HapticService.light(); // Light haptic for snap back
            controls.start({ x: 0 });
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl mb-3">
            {/* Background Actions */}
            <div className="absolute inset-0 flex justify-between items-center px-4">
                {/* Edit Action (Left side, visible when swiping right) */}
                <div className={`flex items-center justify-start w-full h-full bg-blue-600 rounded-xl pl-4 absolute left-0 top-0 transition-opacity duration-200 ${onEdit ? 'opacity-100' : 'opacity-0'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                    </svg>
                </div>

                {/* Delete Action (Right side, visible when swiping left) */}
                <div className={`flex items-center justify-end w-full h-full bg-red-600 rounded-xl pr-4 absolute left-0 top-0 transition-opacity duration-200 ${onDelete ? 'opacity-100' : 'opacity-0'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </div>
            </div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragStart={() => setIsDragging(true)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative bg-slate-800 rounded-xl z-10"
                style={{ touchAction: 'pan-y' }} // Allow vertical scrolling
            >
                {children}
            </motion.div>
        </div>
    );
};
