"use client";

import React from "react";
import { Settings } from "lucide-react";

/**
 * Settings Page - Placeholder
 *
 * Diese Seite wird noch implementiert.
 * Verhindert 404-Fehler bei Navigation.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-semibold text-[#1A1D1F]">Einstellungen</h1>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-[#FCFCFC] rounded-lg p-12 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-[#F4F4F4] flex items-center justify-center mb-6">
          <Settings className="w-10 h-10 text-[#6F767E]" />
        </div>
        <h2 className="text-[20px] font-semibold text-[#1A1D1F] mb-2">
          Einstellungen werden vorbereitet
        </h2>
        <p className="text-[15px] text-[#6F767E] text-center max-w-md">
          Hier werden Sie bald Ihre Kontoeinstellungen, Benachrichtigungen und
          Anwendungsoptionen verwalten.
        </p>
        <a
          href="/app/profile"
          className="mt-6 px-6 py-3 bg-[#2A85FF] text-white rounded-lg text-[15px] font-semibold hover:bg-[#1A75EF] transition-colors"
        >
          Zum Profil
        </a>
      </div>
    </div>
  );
}
