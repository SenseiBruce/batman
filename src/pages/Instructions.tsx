import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticService } from '../services/hapticService';

const Instructions: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const guides = [
        {
            title: "Auto-Sync SMS",
            content: "Tap the 'Sync SMS' button on the Transactions page. Your bank SMS will be converted into categorized expenses automatically.",
            icon: "📩"
        },
        {
            title: "Impulse Control",
            content: "Found something you want? Don't buy it yet! Add it to the Wishlist (Shield Icon). We'll lock it for 72 hours so you can decide later.",
            icon: "🛡️"
        },
        {
            title: "Life Cost Converter",
            content: "Go to Settings and set your 'Hourly Wage'. We'll show you how many hours of work every purchase cost you.",
            icon: "⏳"
        },
        {
            title: "Budget & Rollover",
            content: "Set monthly budgets for categories. If you save money, it 'rolls over' to the next month automatically!",
            icon: "💰"
        },
        {
            title: "Ask Jarvis",
            content: "Chat with Jarvis to get financial advice. Ask 'How much did I spend on food?' or 'Can I afford a vacation?'",
            icon: "🤖"
        }
    ];

    const handleNext = () => {
        HapticService.light();
        if (step < guides.length - 1) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        HapticService.success();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-between py-12 px-6">
            <div className="w-full flex justify-end">
                <button onClick={handleFinish} className="text-gray-400 text-sm font-medium">Close</button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl text-center w-full"
                    >
                        <div className="text-6xl mb-6">{guides[step].icon}</div>
                        <h2 className="text-2xl font-bold text-white mb-4">{guides[step].title}</h2>
                        <p className="text-gray-300 leading-relaxed text-lg">{guides[step].content}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center gap-2">
                    {guides.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-gray-700'}`} />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/40 transition-all active:scale-95"
                >
                    {step === guides.length - 1 ? "Got it!" : "Next Tip"}
                </button>
            </div>
        </div>
    );
};

export default Instructions;
