import React from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function SectionHeader({ title, description, action, className = '' }: SectionHeaderProps) {
    return (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${className}`}>
            <div>
                <h2 className="text-[20px] font-semibold text-[#1A1D1F] tracking-tight">{title}</h2>
                {description && <p className="text-sm text-[#6F767E] mt-1">{description}</p>}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}
