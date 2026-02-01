/**
 * SidebarItem Component
 * 
 * Individual navigation item.
 * Renders an `li` containing a link or button.
 */

import React from 'react';
import Link from 'next/link';

import { ICON_MAP } from './icon-map';

export interface SidebarItemProps {
    label: string;
    iconKey: string;
    href?: string;
    isActive?: boolean;
    isCollapsed?: boolean;
    badgeCount?: number;
    onClick?: () => void;
    className?: string;
}

export function SidebarItem({
    label,
    iconKey,
    href,
    isActive = false,
    isCollapsed = false,
    badgeCount,
    onClick,
    className = '',
}: SidebarItemProps) {
    // Map iconKey to Lucide Icon
    const IconComponent = ICON_MAP[iconKey] || ICON_MAP['help-circle'];

    const content = (
        <>
            <div className={`w-6 h-6 flex items-center justify-center text-[#6F767E] ${isActive ? 'text-[#1A1D1F]' : ''}`}>
                <IconComponent size={24} strokeWidth={1.5} />
            </div>
            {!isCollapsed && (
                <span className={`text-[15px] font-semibold leading-6 -tracking-[0.01em] ${isActive ? 'text-[#1A1D1F]' : 'text-[#6F767E]'}`}>
                    {label}
                </span>
            )}
            {!isCollapsed && badgeCount !== undefined && (
                <span className="ml-auto w-6 h-6 bg-[#FFBC99] rounded-md flex items-center justify-center text-[13px] font-semibold text-[#1A1D1F]">
                    {badgeCount}
                </span>
            )}
        </>
    );

    const baseClassName = `
    sidebar-item group flex items-center gap-3 w-full p-3 rounded-xl transition-colors duration-200
    ${isActive ? 'bg-[#EFEFEF]' : 'hover:bg-[#F4F4F4]'}
    ${isCollapsed ? 'justify-center' : 'justify-start'}
    ${className}
  `;

    return (
        <li className="sidebar-item-wrapper w-full" role="none">
            {href ? (
                <Link
                    href={href}
                    className={baseClassName}
                    data-testid={`sidebar-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    role="menuitem"
                    title={isCollapsed ? label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                >
                    {content}
                </Link>
            ) : (
                <button
                    type="button"
                    className={baseClassName}
                    onClick={onClick}
                    data-testid={`sidebar-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    role="menuitem"
                    title={isCollapsed ? label : undefined}
                >
                    {content}
                </button>
            )}
        </li>
    );
}
