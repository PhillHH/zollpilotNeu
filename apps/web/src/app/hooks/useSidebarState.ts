/**
 * Sidebar State Hook
 * 
 * Manages sidebar collapse state and section expansion.
 * 
 * Rules:
 * - Only one section can be open at a time (accordion behavior)
 * - When collapsed, no sections can be open
 * - Toggling collapse closes all sections
 */

import { useState, useCallback } from 'react';

export interface SidebarState {
    isCollapsed: boolean;
    openSectionId: string | null;
}

export interface UseSidebarStateReturn {
    isCollapsed: boolean;
    openSectionId: string | null;
    toggleCollapse: () => void;
    openSection: (id: string) => void;
    closeSection: () => void;
    isSectionOpen: (id: string) => boolean;
}

/**
 * Hook for managing sidebar state
 * 
 * @returns Sidebar state and control functions
 */
export function useSidebarState(): UseSidebarStateReturn {
    const [state, setState] = useState<SidebarState>({
        isCollapsed: false,
        openSectionId: null,
    });

    const toggleCollapse = useCallback(() => {
        setState((prev) => ({
            isCollapsed: !prev.isCollapsed,
            // Close all sections when collapsing
            openSectionId: !prev.isCollapsed ? null : prev.openSectionId,
        }));
    }, []);

    const openSection = useCallback((id: string) => {
        setState((prev) => {
            // Don't allow opening sections when collapsed
            if (prev.isCollapsed) {
                return prev;
            }

            // Toggle: if already open, close it; otherwise open it
            return {
                ...prev,
                openSectionId: prev.openSectionId === id ? null : id,
            };
        });
    }, []);

    const closeSection = useCallback(() => {
        setState((prev) => ({
            ...prev,
            openSectionId: null,
        }));
    }, []);

    const isSectionOpen = useCallback(
        (id: string) => {
            return state.openSectionId === id && !state.isCollapsed;
        },
        [state.openSectionId, state.isCollapsed]
    );

    return {
        isCollapsed: state.isCollapsed,
        openSectionId: state.openSectionId,
        toggleCollapse,
        openSection,
        closeSection,
        isSectionOpen,
    };
}
