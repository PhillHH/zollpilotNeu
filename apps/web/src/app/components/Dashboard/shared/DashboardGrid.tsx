import React from 'react';

interface DashboardGridProps {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}

export function DashboardGrid({ children, columns = 3, className = '' }: DashboardGridProps) {
    const gridCols = {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols[columns]} gap-6 ${className}`}>
            {children}
        </div>
    );
}
