/**
 * Admin Sidebar Navigation Configuration
 * 
 * Defines the structure of the admin sidebar navigation.
 */

import { NavItem } from './sidebar.config';

export const ADMIN_SIDEBAR_NAVIGATION: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        iconKey: 'dashboard',
        href: '/admin'
    },
    {
        id: 'users',
        label: 'Nutzer',
        iconKey: 'users',
        href: '/admin/users'
    },
    {
        id: 'tenants',
        label: 'Mandanten',
        iconKey: 'briefcase',
        href: '/admin/tenants'
    },
    {
        id: 'plans',
        label: 'Tarife',
        iconKey: 'tag',
        href: '/admin/plans'
    },
    {
        id: 'content',
        label: 'Content Management',
        iconKey: 'globe',
        children: [
            { id: 'blog', label: 'Blog Posts', href: '/admin/content/blog', iconKey: 'file' },
            { id: 'faq', label: 'FAQ Einträge', href: '/admin/content/faq', iconKey: 'help-circle' },
        ]
    },
    {
        id: 'events',
        label: 'System Historie',
        iconKey: 'clock',
        href: '/admin/events'
    },
];

export const ADMIN_BOTTOM_NAVIGATION: NavItem[] = [
    {
        id: 'back-to-app',
        label: 'Zurück zur App',
        iconKey: 'arrow-left',
        href: '/app'
    }
];
