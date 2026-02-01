"use client";

import React, { useState } from "react";
import Link from 'next/link';
import { Users, AlertTriangle, DollarSign, FileText, Settings, ShieldCheck } from 'lucide-react';
import { OverviewCard, ActivityChart, CaseList } from "../components/Dashboard";
import { DashboardGrid, SectionHeader, FilterTabs } from "../components/Dashboard/shared";

/**
 * Admin Dashboard - System Administration
 * 
 * Rebuilt using shared Dashboard components.
 * Focus: System Health, Monetization, User Management.
 */
export default function AdminPage() {
  const [filter, setFilter] = useState("Heute");

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <SectionHeader
        title="System Administration"
        action={
          <FilterTabs options={['Heute', 'Woche', 'Monat']} active={filter} onChange={setFilter} />
        }
      />

      {/* KPI Grid (System Health & Business) */}
      <DashboardGrid columns={3}>
        <OverviewCard
          label="Gesamtumsatz"
          value="12.4k €"
          trend="+8% vs Vormonat"
          trendUp={true}
          icon={DollarSign}
          iconBgClass="bg-[#B5E4CA]"
          iconColorClass="text-[#1A1D1F]"
          chartColor="#83BF6E"
        />
        <OverviewCard
          label="Aktive Nutzer"
          value="1,240"
          trend="+12 Neue"
          trendUp={true}
          icon={Users}
          iconBgClass="bg-[#CABDFF]"
          iconColorClass="text-[#1A1D1F]"
          chartColor="#8E59FF"
        />
        <OverviewCard
          label="System Fehler"
          value="0.05%"
          trend="-0.02%"
          trendUp={true} // Trend indicates improvement (lower errors)
          icon={AlertTriangle}
          iconBgClass="bg-[#FFBC99]"
          iconColorClass="text-[#1A1D1F]"
          chartColor="#FF6A55"
        />
      </DashboardGrid>

      {/* Quick Navigation Grid converted to KPI Cards */}
      <div>
        <SectionHeader title="Verwaltung" className="mb-4" />
        <DashboardGrid columns={4}>
          <Link href="/admin/tenants">
            <OverviewCard
              label="Mandanten"
              value="24"
              trend="Verwalten"
              trendUp={true} // Neutral
              icon={Users}
              iconBgClass="bg-gray-100"
              iconColorClass="text-[#1A1D1F]"
              chartColor="#EFEFEF" // Subtle/Hidden
              chartPath="M0 20 L 80 20" // Flat line
            />
          </Link>
          <Link href="/admin/plans">
            <OverviewCard
              label="Tarife"
              value="3"
              trend="Preisgestaltung"
              trendUp={true}
              icon={DollarSign}
              iconBgClass="bg-gray-100"
              iconColorClass="text-[#1A1D1F]"
              chartColor="#EFEFEF"
              chartPath="M0 20 L 80 20"
            />
          </Link>
          <Link href="/admin/content/blog">
            <OverviewCard
              label="Content"
              value="18"
              trend="Blog & FAQ"
              trendUp={true}
              icon={FileText}
              iconBgClass="bg-gray-100"
              iconColorClass="text-[#1A1D1F]"
              chartColor="#EFEFEF"
              chartPath="M0 20 L 80 20"
            />
          </Link>
          <Link href="/admin/settings">
            <OverviewCard
              label="System"
              value="v2.4"
              trend="Einstellungen"
              trendUp={true}
              icon={Settings}
              iconBgClass="bg-gray-100"
              iconColorClass="text-[#1A1D1F]"
              chartColor="#EFEFEF"
              chartPath="M0 20 L 80 20"
            />
          </Link>
        </DashboardGrid>
      </div>

      {/* System Activity Monitor */}
      <div>
        <SectionHeader title="Live Aktivität" className="mb-4" />
        <DashboardGrid columns={3}>
          <div className="lg:col-span-2">
            {/* Displaying Global Case Activity across all tenants */}
            <CaseList title="System Protokoll" />
          </div>
          <div className="lg:col-span-1">
            <ActivityChart />
          </div>
        </DashboardGrid>
      </div>
    </div>
  )
}
