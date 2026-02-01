/**
 * SidebarToggle Component
 * 
 * Button to toggle sidebar collapse state.
 */

import React from 'react';

import { ICON_MAP } from './icon-map';

export interface SidebarToggleProps {
    isCollapsed: boolean;
    onToggle: () => void;
    className?: string;
}

export function SidebarToggle({ isCollapsed, onToggle, className = '' }: SidebarToggleProps) {
    const Icon = ICON_MAP['chevron-right']; // Or ArrowLeft/Right

    return (
        <button
            type="button"
            className={`sidebar-toggle p-2 rounded-lg text-[#6F767E] hover:bg-[#F4F4F4] transition-colors ${isCollapsed ? 'mx-auto' : ''} ${className}`}
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            data-testid="sidebar-toggle"
        >
            <div className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}>
                {/* Arrow needs to point RIGHT when collapsed (to expand), LEFT when expanded (to collapse) if we use ChevronRight base */}
                {/* If we use 'arrow_forward' from figma (which points right), then rotate 180 makes it point left. */}
                <Icon size={24} />
            </div>
        </button>
    );
}
