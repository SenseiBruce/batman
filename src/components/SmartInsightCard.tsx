import React from 'react';
import { DailyInsight } from '../services/insightService';

interface SmartInsightCardProps {
    insight: DailyInsight;
}

export const SmartInsightCard: React.FC<SmartInsightCardProps> = ({ insight }) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 mb-6 bg-gradient-to-br ${insight.gradient} shadow-lg`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-start gap-3 mb-2">
                    <div className="text-3xl">{insight.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-bold text-lg">{insight.title}</h3>
                            {insight.type === 'tip' && (
                                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Tip</span>
                            )}
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed">{insight.message}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Jarvis AI Insight</span>
                    </div>
                    <div className="text-white/60 text-xs">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
};
