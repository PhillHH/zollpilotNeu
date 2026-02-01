/**
 * Tests for Sidebar Structure
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import { NavItem } from '../../../../navigation/sidebar.config';
import { vi, describe, it, expect } from 'vitest';

// Mock usePathname
vi.mock('next/navigation', () => ({
    usePathname: () => '/app/dashboard',
}));

// Mock Link to render plain anchors
vi.mock('next/link', () => {
    return {
        default: ({ children, href, ...rest }: any) => {
            return <a href={href} {...rest}>{children}</a>;
        }
    };
});


const MOCK_NAV: NavItem[] = [
    { id: 'dash', label: 'Dashboard', iconKey: 'dash', href: '/app/dashboard' },
    {
        id: 'parent',
        label: 'Parent',
        iconKey: 'folder',
        children: [
            { id: 'child1', label: 'Child 1', href: '/app/child1', iconKey: 'file' },
        ],
    },
];

const MOCK_BOTTOM: NavItem[] = [
    { id: 'help', label: 'Help', iconKey: 'help', href: '/app/help' },
];

describe('Sidebar Structure', () => {
    it('renders expanded state by default', () => {
        const { container } = render(
            <Sidebar navItems={MOCK_NAV} bottomNavItems={MOCK_BOTTOM} />
        );

        // Check main class
        expect(container.firstChild).toHaveClass('sidebar--expanded');

        // Check labels present
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Parent')).toBeInTheDocument();
        expect(screen.getByText('Help')).toBeInTheDocument();
    });

    it('renders collapsed state when toggled', () => {
        const { container } = render(
            <Sidebar navItems={MOCK_NAV} bottomNavItems={MOCK_BOTTOM} />
        );

        const toggle = screen.getByTestId('sidebar-toggle');
        fireEvent.click(toggle);

        // Check collapsed class
        expect(container.firstChild).toHaveClass('sidebar--collapsed');

        // Labels should be gone (queryByText returns null if not found)
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('handles nested menu expansion', () => {
        render(<Sidebar navItems={MOCK_NAV} />);

        // Initially child not visible
        expect(screen.queryByText('Child 1')).not.toBeInTheDocument();

        // Click Parent Trigger (first button in the section)
        const parentButton = screen.getByText('Parent').closest('button');
        fireEvent.click(parentButton!);

        // Now child visible
        expect(screen.getByText('Child 1')).toBeInTheDocument();
    });

    it('prevents menu expansion when collapsed', () => {
        render(<Sidebar navItems={MOCK_NAV} />);

        // Collapse first
        const toggle = screen.getByTestId('sidebar-toggle');
        fireEvent.click(toggle);

        // Click Parent Trigger
        // Note: In real DOM, getting by Text might fail if hidden, but we check logic.
        // The button title attribute might contain the label.
        // Or we find "Parent" is gone, so let's find the button by something else?
        // The button has title="Parent" when collapsed.
        const parentButton = screen.getByTitle('Parent');
        fireEvent.click(parentButton);

        // Child should STILL not be visible because "In collapsed mode dürfen keine Submenus sichtbar sein"
        expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
    });
});
