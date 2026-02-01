/**
 * Sidebar Navigation Configuration
 * 
 * Defines the structure of the sidebar navigation.
 * Used to generate the sidebar menu components dynamically.
 */

export interface NavItem {
    id: string;
    label: string;
    iconKey: string;
    href?: string;
    badgeCount?: number;
    children?: NavItem[];
}

export const SIDEBAR_NAVIGATION: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        iconKey: 'dashboard',
        href: '/app',
    },
    {
        id: 'cases',
        label: 'Zollanmeldungen',
        iconKey: 'cases',
        children: [
            { id: 'cases-list', label: 'Alle Fälle', href: '/app/cases', iconKey: 'list' },
            { id: 'cases-new', label: 'Neuer Fall', href: '/app/cases/new', iconKey: 'plus' },
            { id: 'cases-drafts', label: 'Entwürfe', href: '/app/cases?status=draft', iconKey: 'file' },
        ],
    },
    {
        id: 'master-data',
        label: 'Stammdaten',
        iconKey: 'database',
        children: [
            { id: 'contacts', label: 'Adressbuch', href: '/app/contacts', iconKey: 'users' },
            { id: 'products', label: 'Artikelstamm', href: '/app/products', iconKey: 'package' },
        ],
    },
    {
        id: 'billing',
        label: 'Abrechnung',
        iconKey: 'credit-card',
        href: '/app/billing',
    },
    {
        id: 'settings',
        label: 'Einstellungen',
        iconKey: 'settings',
        href: '/app/settings',
    },
];

export const SIDEBAR_BOTTOM_NAVIGATION: NavItem[] = [
    {
        id: 'help',
        label: 'Hilfe & Support',
        iconKey: 'help-circle',
        href: '/app/help',
    },
];
