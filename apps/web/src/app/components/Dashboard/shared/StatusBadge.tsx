import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'blue' | 'purple';

interface StatusBadgeProps {
    label: string;
    variant?: BadgeVariant;
    icon?: React.ReactNode;
    className?: string;
}

export function StatusBadge({ label, variant = 'neutral', icon, className = '' }: StatusBadgeProps) {
    const variants = {
        success: 'bg-[#83BF6E]/15 text-[#83BF6E]',
        warning: 'bg-[#FFD88D]/20 text-[#B78822]',
        error: 'bg-[#FF6A55]/15 text-[#FF6A55]',
        neutral: 'bg-[#EFEFEF] text-[#6F767E]',
        blue: 'bg-[#B1E5FC]/30 text-[#2A85FF]',
        purple: 'bg-[#CABDFF]/30 text-[#8E59FF]',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold uppercase tracking-wide leading-none ${variants[variant]} ${className}`}>
            {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
            {label}
        </span>
    );
}
