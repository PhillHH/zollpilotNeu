/**
 * SidebarFooter Component
 * 
 * Bottom area containing Theme Switch, Collapse Toggle, User Profile.
 */

import React from 'react';
import { ICON_MAP } from './icon-map';
import { SidebarToggle } from './SidebarToggle';

export interface SidebarFooterProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    children?: React.ReactNode;
    className?: string;
}

export function SidebarFooter({
    isCollapsed,
    onToggleCollapse,
    children,
    className = '',
}: SidebarFooterProps) {
    const SunIcon = ICON_MAP['sun'];
    const MoonIcon = ICON_MAP['moon'];

    return (
        <div className={`sidebar-footer w-full flex flex-col gap-4 mt-auto ${className}`}>
            {/* Divider */}
            <div className="w-full h-[2px] bg-[#F4F4F4] rounded-sm" />

            {children && (
                <ul className="sidebar-footer-nav w-full flex flex-col gap-2">
                    {children}
                </ul>
            )}

            {/* Theme Switcher - Visual Only for now */}
            <div className={`
        flex items-center justify-between p-1 bg-[#F4F4F4] rounded-[40px] w-full
        ${isCollapsed ? 'hidden' : 'flex'} 
      `}>
                <button className="flex items-center gap-2 px-4 py-1 bg-[#FCFCFC] rounded-full shadow-sm text-[#1A1D1F]">
                    <SunIcon size={20} />
                    <span className="text-[15px] font-semibold">Light</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-1 text-[#6F767E]">
                    <MoonIcon size={20} />
                    <span className="text-[15px] font-semibold">Dark</span>
                </button>
            </div>

            {/* Sidebar Toggle */}
            <div className="sidebar-footer-controls w-full flex justify-end">
                <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
            </div>
        </div>
    );
}
