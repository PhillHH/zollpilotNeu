/**
 * SidebarSection Component
 * 
 * Represents a parent navigation item with a collapsible submenu.
 * Renders as an `li` containing a button and a nested `ul`.
 */

import React from 'react';
import { NavItem } from '../../../navigation/sidebar.config';
import { SidebarItem } from './SidebarItem';

import { ICON_MAP } from './icon-map';

export interface SidebarSectionProps {
    item: NavItem;
    isOpen: boolean;
    isCollapsed: boolean;
    onToggle: (id: string) => void;
    activePath?: string;
    className?: string;
}

export function SidebarSection({
    item,
    isOpen,
    isCollapsed,
    onToggle,
    activePath,
    className = '',
}: SidebarSectionProps) {
    const { id, label, iconKey, children } = item;
    const hasChildren = children && children.length > 0;

    // If sidebar is collapsed, sections behave like regular items (no submenu visible)
    // Clicking usually might open a popover, but per spec: "In collapsed mode dürfen keine Submenus sichtbar sein"
    // For now, allow click to potentially do something else or just do nothing if no href.

    const handleClick = () => {
        if (!isCollapsed && hasChildren) {
            onToggle(id);
        }
    };

    const IconComponent = ICON_MAP[iconKey] || ICON_MAP['help-circle'];
    const ChevronIcon = ICON_MAP['chevron-down'];

    return (
        <li className={`sidebar-section w-full ${isOpen ? 'sidebar-section--open' : ''} ${className}`}>
            <button
                type="button"
                className={`
          sidebar-section__header flex items-center gap-3 w-full p-3 rounded-xl transition-colors duration-200 text-[#6F767E] hover:bg-[#F4F4F4]
          ${isOpen ? 'bg-[#FCFCFC]' : ''}
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}
                onClick={handleClick}
                aria-expanded={!isCollapsed && isOpen}
                aria-controls={`sidebar-submenu-${id}`}
                disabled={isCollapsed}
                title={isCollapsed ? label : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 flex items-center justify-center`}>
                        <IconComponent size={24} strokeWidth={1.5} />
                    </div>
                    {!isCollapsed && (
                        <span className="text-[15px] font-semibold leading-6 -tracking-[0.01em]">
                            {label}
                        </span>
                    )}
                </div>

                {!isCollapsed && (
                    <div className={`transition-transform duration-200 text-[#6F767E] ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronIcon size={24} strokeWidth={1.5} />
                    </div>
                )}
            </button>

            {/* RENDER SUBMENU */}
            {!isCollapsed && isOpen && hasChildren && (
                <ul
                    id={`sidebar-submenu-${id}`}
                    className="sidebar-submenu w-full pl-[22px] mt-1 relative" // Figma: Tree line logic needed? Simple indent first.
                    role="menu"
                >
                    {/* Tree Lines - vertical */}
                    <div className="absolute left-[24px] top-0 bottom-4 w-[2px] bg-[#EFEFEF]" />

                    {children.map((child) => (
                        <div key={child.id} className="relative pl-6">
                            {/* Tree Lines - horizontal connector */}
                            {/* This needs precise positioning to match Figma 'Curve' but simple line is good for now */}

                            <SidebarItem
                                label={child.label}
                                iconKey={child.iconKey} // If subitems have icons? Figma shows small dot or nothing usually, but config has icons.
                                href={child.href}
                                isActive={activePath === child.href}
                                isCollapsed={false}
                                className="!p-2 text-[14px]" // Smaller subitems? Figma says 256px wide, same height.
                            />
                        </div>
                    ))}
                </ul>
            )}
        </li>
    );
}
