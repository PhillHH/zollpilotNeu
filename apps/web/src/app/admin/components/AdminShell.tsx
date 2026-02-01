"use client";

import React from "react";
import { Sidebar } from "../../components/Sidebar/Sidebar";
import { ADMIN_SIDEBAR_NAVIGATION, ADMIN_BOTTOM_NAVIGATION } from "../../../navigation/admin-sidebar.config";
import { TopBar } from "../../components/TopBar/TopBar";

type AdminShellProps = {
  children: React.ReactNode;
};

/**
 * AdminShell – Layout für den Admin-Bereich (/admin/*)
 * 
 * Uses the same Sidebar layout as AppShell but with Admin Navigation.
 */
export function AdminShell({ children }: AdminShellProps) {

  return (
    <div className="admin-shell flex h-screen w-full bg-[#EAECF0]"> {/* Slightly different bg for admin? */}
      <Sidebar
        navItems={ADMIN_SIDEBAR_NAVIGATION}
        bottomNavItems={ADMIN_BOTTOM_NAVIGATION}
        className="flex-shrink-0 z-50 border-r-red-100" // Maybe a slight hint it's admin? Keep standard for now.
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-auto relative flex flex-col">
          {/* Admin Header / Breadcrumbs could go here */}
          <div className="w-full bg-white border-b border-gray-200 px-8 py-4 mb-6 sticky top-0 z-40 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Admin Bereich</h1>
            <span className="text-sm text-gray-500">System Administration</span>
          </div>

          <div className="w-full max-w-[1400px] mx-auto p-6 md:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
