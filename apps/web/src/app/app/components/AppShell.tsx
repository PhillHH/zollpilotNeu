"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { SIDEBAR_NAVIGATION, SIDEBAR_BOTTOM_NAVIGATION, NavItem } from "../../../navigation/sidebar.config";
import { apiRequest } from "../../lib/api/client";
import { TopBar } from "../../components/TopBar/TopBar";

type AppShellProps = {
  children: React.ReactNode;
};

type AuthInfo = {
  canAccessAdmin: boolean;
  email?: string;
};

/**
 * AppShell – Main Layout with Sidebar and TopBar
 * 
 * Replaces the old top-navigation layout with the new Sidebar layout.
 * Includes dynamic admin link injection based on permissions.
 */
export function AppShell({ children }: AppShellProps) {
  const [auth, setAuth] = useState<AuthInfo | null>(null);

  useEffect(() => {
    async function loadAuth() {
      try {
        const data = await apiRequest<{ data: { email: string; permissions?: { can_access_admin?: boolean } } }>(
          "/auth/me"
        );
        setAuth({
          canAccessAdmin: data.data?.permissions?.can_access_admin ?? false,
          email: data.data?.email,
        });
      } catch {
        // Ignore errors
      }
    }
    loadAuth();
  }, []);

  // Prepare Navigation Items
  const navItems = [...SIDEBAR_NAVIGATION];

  // Dynamic Admin Link
  if (auth?.canAccessAdmin) {
    // Add Admin link if not already present
    // We insert it before 'settings' or at the end
    const hasAdmin = navItems.some(i => i.id === 'admin');
    if (!hasAdmin) {
      navItems.push({
        id: 'admin',
        label: 'Admin Backend',
        iconKey: 'settings', // Or shield/lock if available
        href: '/admin'
      });
    }
  }

  // Add Profile to Bottom Nav if needed, or rely on Settings
  const bottomNavItems = [...SIDEBAR_BOTTOM_NAVIGATION];
  // Example: Add Profile link
  bottomNavItems.push({
    id: 'profile',
    label: 'Profil',
    iconKey: 'users', // using 'users' as profile icon proxy
    href: '/app/profile'
  });

  return (
    <div className="app-shell flex h-screen w-full bg-[#F4F4F4]">
      {/* Sidebar - Fixed width handled internally */}
      <Sidebar
        navItems={navItems}
        bottomNavItems={bottomNavItems}
        className="flex-shrink-0 z-50"
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto relative flex flex-col">
          {/* Content Container - max-width constraint for readability */}
          <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8 lg:p-12 min-h-full">
            {children}

            {/* Simple Footer inside content area */}
            <footer className="mt-auto pt-12 pb-6 text-center text-xs text-gray-400">
              <p>© {new Date().getFullYear()} ZollPilot - Keine Rechtsberatung</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
