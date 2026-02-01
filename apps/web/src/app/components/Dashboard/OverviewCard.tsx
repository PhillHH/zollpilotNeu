import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatusBadge } from './shared';

interface OverviewCardProps {
    label: string;
    value: string;
    trend: string;
    trendUp?: boolean;
    icon: LucideIcon;
    iconColorClass?: string;
    iconBgClass?: string;
    chartPath?: string; // SVG path d attribute for the sparkline
    chartColor?: string; // hex color for the chart stroke
}

export function OverviewCard({
    label,
    value,
    trend,
    trendUp,
    icon: Icon,
    iconColorClass = "text-gray-900",
    iconBgClass = "bg-gray-100",
    chartPath,
    chartColor = "#83BF6E"
}: OverviewCardProps) {
    return (
        <div className="flex flex-col p-6 bg-[#FCFCFC] rounded-lg border border-transparent hover:border-[#EFEFEF] transition-all shadow-[0px_1px_2px_rgba(0,0,0,0.05)] h-[224px] w-full relative">
            {/* Icon + Tooltip/Info placeholder */}
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgClass}`}>
                    <Icon className={`w-6 h-6 ${iconColorClass}`} />
                </div>
            </div>

            {/* Content */}
            <div className="mt-auto">
                <div className="text-[13px] font-semibold text-[#33383F] mb-1">{label}</div>
                <div className="text-[48px] font-semibold text-[#1A1D1F] leading-none mb-2 tracking-tight">
                    {value}
                </div>

                {/* Footer: Trend + Sparkline */}
                <div className="flex justify-between items-end h-[48px]">
                    {/* Trend Badge */}
                    <StatusBadge
                        label={trend}
                        variant={trendUp ? 'success' : 'error'}
                        icon={trendUp ? '↑' : '↓'}
                        className="normal-case px-2" // Keep design constraint (not uppercase here)
                    />

                    {/* Sparkline (SVG) */}
                    <div className="h-[40px] w-[80px]">
                        <svg width="100%" height="100%" viewBox="0 0 80 40" preserveAspectRatio="none">
                            <path
                                d={chartPath || "M0 35 C 20 35, 20 10, 40 10 C 60 10, 60 25, 80 5"}
                                fill="none"
                                stroke={chartColor}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
