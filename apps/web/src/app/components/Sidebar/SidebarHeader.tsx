/**
 * SidebarHeader Component
 * 
 * Top area of the sidebar, containing the Logo.
 */

import React from 'react';
import Link from 'next/link';

export interface SidebarHeaderProps {
    isCollapsed: boolean;
    className?: string;
}

export function SidebarHeader({ isCollapsed, className = '' }: SidebarHeaderProps) {
    return (
        <div className={`sidebar-header flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} ${className}`}>
            <Link href="/app" className="sidebar-logo flex items-center gap-3 group">
                {/* Figma Logo Implementation */}
                <div className="relative w-12 h-12 flex-shrink-0">
                    {/* Base */}
                    <div className="absolute inset-0 bg-[#272B30] rounded-lg shadow-[inset_0px_1px_1px_rgba(214,214,214,0.25),inset_0px_-1px_2px_rgba(0,0,0,0.53)]" />

                    {/* Rectangle 1 (Left) */}
                    <div className="absolute w-1 h-3 left-[14px] top-[18px] bg-[linear-gradient(180deg,#FFFFFF_0%,#D0D0D0_100%)] rounded-xl" />

                    {/* Rectangle 2 (Right) */}
                    <div className="absolute w-1 h-3 left-[30px] top-[18px] bg-[linear-gradient(180deg,#FFFFFF_0%,#D0D0D0_100%)] rounded-xl" />

                    {/* Rectangle (Center - White) - Note: Adjusting position based on specs */}
                    <div className="absolute w-1 h-4 left-[22px] top-[16px] bg-[#FFFFFF] rounded-xl" />
                </div>

                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-[20px] font-bold text-[#1A1D1F] leading-6">ZollPilot</span>
                    </div>
                )}
            </Link>
        </div>
    );
}
