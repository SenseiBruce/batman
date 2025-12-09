import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SecureStorageService } from '../services/secureStorageService';
import { HapticService } from '../services/hapticService';
import { requestSmsPermissions } from '../services/smsService';

const slides = [
    {
        id: 1,
        title: "Welcome to Jarvis",
        description: "Your intelligent personal finance assistant. Track, analyze, and master your spending.",
        icon: "👋",
        color: "from-blue-500 to-indigo-600"
    },
    {
        id: 2,
        title: "Auto-Track SMS",
        description: "Jarvis needs SMS access to automatically categorize transactions. Data is processed locally and never shared.",
        icon: "📩",
        color: "from-purple-500 to-pink-600"
    },
    {
        id: 3,
        title: "Smart Insights",
        description: "Get daily briefings, spending forecasts, and beautiful charts to understand your money.",
        icon: "📊",
        color: "from-green-500 to-teal-600"
    },
    {
        id: 4,
        title: "Stay Private",
        description: "Your data stays on your device. Secure, private, and always under your control.",
        icon: "🔒",
        color: "from-orange-500 to-red-600"
    }
];

const Onboarding: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    const handleNext = async () => {
        HapticService.light();

        // Specific Logic for SMS Slide (Index 1)
        if (currentIndex === 1) {
            try {
                await requestSmsPermissions();
            } catch (error) {
                console.error("Permission request failed", error);
            }
        }

        if (currentIndex < slides.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        HapticService.success();
        await SecureStorageService.set('onboarding_completed', true);
        navigate('/', { replace: true });
    };

    return (
        <div className="h-screen w-full bg-gray-900 flex flex-col items-center justify-between py-12 px-6 overflow-hidden relative">
            {/* Background Blobs */}
            <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full bg-gradient-to-br ${slides[currentIndex].color} opacity-20 blur-3xl transition-all duration-500`} />
            <div className={`absolute bottom-[-20%] right-[-20%] w-[80%] h-[50%] rounded-full bg-gradient-to-tl ${slides[currentIndex].color} opacity-20 blur-3xl transition-all duration-500`} />

            {/* Skip Button */}
            <button
                onClick={completeOnboarding}
                className="absolute top-6 right-6 text-gray-400 text-sm font-medium z-20"
            >
                Skip
            </button>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slides[currentIndex].color} flex items-center justify-center text-6xl shadow-2xl mb-8`}>
                            {slides[currentIndex].icon}
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">
                            {slides[currentIndex].title}
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            {slides[currentIndex].description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md flex flex-col items-center gap-8 z-10">
                {/* Pagination Dots */}
                <div className="flex gap-2">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Button */}
                <button
                    onClick={handleNext}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r ${slides[currentIndex].color}`}
                >
                    {currentIndex === slides.length - 1 ? "Get Started" : (currentIndex === 1 ? "Allow Access" : "Next")}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
