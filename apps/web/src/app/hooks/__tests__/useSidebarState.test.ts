/**
 * Tests for useSidebarState hook
 */

import { renderHook, act } from '@testing-library/react';
import { useSidebarState } from '../useSidebarState';

describe('useSidebarState', () => {
    describe('Initial state', () => {
        it('should start with sidebar expanded', () => {
            const { result } = renderHook(() => useSidebarState());

            expect(result.current.isCollapsed).toBe(false);
        });

        it('should start with no section open', () => {
            const { result } = renderHook(() => useSidebarState());

            expect(result.current.openSectionId).toBeNull();
        });
    });

    describe('toggleCollapse', () => {
        it('should toggle collapse state', () => {
            const { result } = renderHook(() => useSidebarState());

            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isCollapsed).toBe(true);

            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isCollapsed).toBe(false);
        });

        it('should close open section when collapsing', () => {
            const { result } = renderHook(() => useSidebarState());

            // Open a section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBe('section-1');

            // Collapse sidebar
            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isCollapsed).toBe(true);
            expect(result.current.openSectionId).toBeNull();
        });

        it('should keep sections closed when expanding', () => {
            const { result } = renderHook(() => useSidebarState());

            // Collapse sidebar
            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isCollapsed).toBe(true);

            // Expand sidebar
            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isCollapsed).toBe(false);
            expect(result.current.openSectionId).toBeNull();
        });
    });

    describe('openSection', () => {
        it('should open a section', () => {
            const { result } = renderHook(() => useSidebarState());

            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBe('section-1');
        });

        it('should close currently open section when opening a different one', () => {
            const { result } = renderHook(() => useSidebarState());

            // Open first section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBe('section-1');

            // Open second section
            act(() => {
                result.current.openSection('section-2');
            });

            expect(result.current.openSectionId).toBe('section-2');
        });

        it('should toggle section when opening already open section', () => {
            const { result } = renderHook(() => useSidebarState());

            // Open section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBe('section-1');

            // Open same section again (should close)
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBeNull();
        });

        it('should not open section when sidebar is collapsed', () => {
            const { result } = renderHook(() => useSidebarState());

            // Collapse sidebar
            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isCollapsed).toBe(true);

            // Try to open section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBeNull();
        });
    });

    describe('closeSection', () => {
        it('should close open section', () => {
            const { result } = renderHook(() => useSidebarState());

            // Open section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.openSectionId).toBe('section-1');

            // Close section
            act(() => {
                result.current.closeSection();
            });

            expect(result.current.openSectionId).toBeNull();
        });

        it('should be idempotent when no section is open', () => {
            const { result } = renderHook(() => useSidebarState());

            expect(result.current.openSectionId).toBeNull();

            act(() => {
                result.current.closeSection();
            });

            expect(result.current.openSectionId).toBeNull();
        });
    });

    describe('isSectionOpen', () => {
        it('should return true for open section', () => {
            const { result } = renderHook(() => useSidebarState());

            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.isSectionOpen('section-1')).toBe(true);
        });

        it('should return false for closed section', () => {
            const { result } = renderHook(() => useSidebarState());

            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.isSectionOpen('section-2')).toBe(false);
        });

        it('should return false when sidebar is collapsed', () => {
            const { result } = renderHook(() => useSidebarState());

            // Open section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.isSectionOpen('section-1')).toBe(true);

            // Collapse sidebar
            act(() => {
                result.current.toggleCollapse();
            });

            expect(result.current.isSectionOpen('section-1')).toBe(false);
        });
    });

    describe('Accordion behavior', () => {
        it('should only allow one section open at a time', () => {
            const { result } = renderHook(() => useSidebarState());

            // Open first section
            act(() => {
                result.current.openSection('section-1');
            });

            expect(result.current.isSectionOpen('section-1')).toBe(true);
            expect(result.current.isSectionOpen('section-2')).toBe(false);

            // Open second section
            act(() => {
                result.current.openSection('section-2');
            });

            expect(result.current.isSectionOpen('section-1')).toBe(false);
            expect(result.current.isSectionOpen('section-2')).toBe(true);
        });
    });
});
