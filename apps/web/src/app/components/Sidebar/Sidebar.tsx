/**
 * Sidebar Component
 * 
 * Main navigation container.
 * Renders the full sidebar structure based on configuration.
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavItem } from '../../../navigation/sidebar.config';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { useSidebarState } from '../../hooks/useSidebarState';

export interface SidebarProps {
    navItems: NavItem[];
    bottomNavItems?: NavItem[];
    className?: string;
    // Optional: Allow overriding internal state for controlled usage
    collapsed?: boolean;
}

export function Sidebar({
    navItems,
    bottomNavItems = [],
    className = '',
}: SidebarProps) {
    // Use our hook for logic
    const {
        isCollapsed,
        openSectionId,
        toggleCollapse,
        openSection,
        closeSection,
        isSectionOpen,
    } = useSidebarState();

    const pathname = usePathname();

    const handleSectionToggle = (id: string) => {
        // If we click the open one, close it. Else open new one.
        // The hook handles "only one open" logic.
        if (isSectionOpen(id)) {
            closeSection();
        } else {
            openSection(id);
        }
    };

    const renderNavItem = (item: NavItem) => {
        // 1. If item has children -> SidebarSection
        if (item.children && item.children.length > 0) {
            return (
                <SidebarSection
                    key={item.id}
                    item={item}
                    isOpen={isSectionOpen(item.id)}
                    isCollapsed={isCollapsed}
                    onToggle={handleSectionToggle}
                    activePath={pathname}
                />
            );
        }

        // 2. If item is leaf -> SidebarItem
        return (
            <SidebarItem
                key={item.id}
                label={item.label}
                iconKey={item.iconKey}
                href={item.href}
                isActive={pathname === item.href}
                isCollapsed={isCollapsed}
                badgeCount={item.badgeCount}
            />
        );
    };

    return (
        <nav
            className={`sidebar flex flex-col justify-between items-start p-6 gap-[10px] h-screen bg-[#FCFCFC] border-r border-[#EFEFEF] transition-all duration-300 ease-in-out ${isCollapsed ? 'sidebar--collapsed w-[96px]' : 'sidebar--expanded w-[340px]'
                } ${className}`}
            aria-label="Hauptnavigation"
        >
            <SidebarHeader isCollapsed={isCollapsed} />

            <div className="sidebar-content w-full flex-grow mt-12 flex flex-col gap-2">
                <ul className="sidebar-nav-list flex flex-col gap-2 w-full">
                    {navItems.map(renderNavItem)}
                </ul>
            </div>

            <SidebarFooter
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            >
                {bottomNavItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        label={item.label}
                        iconKey={item.iconKey}
                        href={item.href}
                        isActive={pathname === item.href}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </SidebarFooter>
        </nav>
    );
}
