import React from 'react';

interface ProgressBarProps {
    value: number; // 0 to 100
    max?: number;
    colorClass?: string;
    heightClass?: string;
    showLabel?: boolean;
}

export function ProgressBar({
    value,
    max = 100,
    colorClass = 'bg-[#2A85FF]',
    heightClass = 'h-2',
    showLabel = false
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="w-full flex items-center gap-3">
            <div className={`flex-1 ${heightClass} bg-[#EFEFEF] rounded-full overflow-hidden`}>
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-semibold text-[#6F767E] w-8 text-right">{Math.round(percentage)}%</span>
            )}
        </div>
    );
}
