"use client";

import React from "react";
import { HelpCircle, Mail, FileText, ExternalLink } from "lucide-react";

/**
 * Help & Support Page
 *
 * Bietet Hilfe-Ressourcen und Kontaktmöglichkeiten.
 */
export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-semibold text-[#1A1D1F]">Hilfe &amp; Support</h1>
      </div>

      {/* Help Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* FAQ Card */}
        <div className="bg-[#FCFCFC] rounded-lg p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#B5E4CA] flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6 text-[#1A1D1F]" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1A1D1F] mb-2">
            Häufige Fragen
          </h3>
          <p className="text-[15px] text-[#6F767E] mb-4 flex-1">
            Finden Sie Antworten auf die häufigsten Fragen zur Nutzung von ZollPilot.
          </p>
          <a
            href="/faq"
            className="text-[15px] text-[#2A85FF] font-semibold hover:underline flex items-center gap-2"
          >
            FAQ ansehen
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Documentation Card */}
        <div className="bg-[#FCFCFC] rounded-lg p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#CABDFF] flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-[#1A1D1F]" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1A1D1F] mb-2">
            Anleitungen
          </h3>
          <p className="text-[15px] text-[#6F767E] mb-4 flex-1">
            Schritt-für-Schritt-Anleitungen zur Erstellung Ihrer Zollanmeldung.
          </p>
          <a
            href="/blog"
            className="text-[15px] text-[#2A85FF] font-semibold hover:underline flex items-center gap-2"
          >
            Blog lesen
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Contact Card */}
        <div className="bg-[#FCFCFC] rounded-lg p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="w-12 h-12 rounded-full bg-[#FFBC99] flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-[#1A1D1F]" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1A1D1F] mb-2">
            Kontakt
          </h3>
          <p className="text-[15px] text-[#6F767E] mb-4 flex-1">
            Haben Sie Fragen? Unser Support-Team hilft Ihnen gerne weiter.
          </p>
          <a
            href="mailto:support@zollpilot.de"
            className="text-[15px] text-[#2A85FF] font-semibold hover:underline flex items-center gap-2"
          >
            E-Mail senden
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-[#FFF8E6] border border-[#FFD666] rounded-lg p-6">
        <h3 className="text-[15px] font-semibold text-[#1A1D1F] mb-2">
          Wichtiger Hinweis
        </h3>
        <p className="text-[14px] text-[#6F767E]">
          ZollPilot bietet keine Rechts- oder Zollberatung an. Die Anwendung unterstützt
          Sie bei der Erstellung von Zollanmeldungen, ersetzt jedoch nicht die Beratung
          durch einen Zollexperten oder Rechtsanwalt. Bei Unsicherheiten wenden Sie sich
          bitte an die zuständige Zollbehörde.
        </p>
      </div>
    </div>
  );
}
