"use client";

import React, { useState } from "react";
import { Activity, CheckCircle, Wallet } from 'lucide-react';
import {
  OverviewCard,
  ActivityChart,
  CaseList
} from "../components/Dashboard";
import {
  DashboardGrid,
  SectionHeader,
  FilterTabs
} from "../components/Dashboard/shared";

/**
 * App Dashboard – Übersicht für eingeloggte Benutzer
 * 
 * Rebuilt using the shared Dashboard component library for consistent layout and styling.
 * Structure:
 * 1. Header (Title + Global Filter)
 * 2. Metrics Grid (KPI Cards)
 * 3. Operational Grid (List + Charts)
 */
export default function AppDashboard() {
  const [timeFilter, setTimeFilter] = useState("Diese Woche");

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12">
      {/* 1. Header Section */}
      <SectionHeader
        title="Übersicht"
        action={
          <FilterTabs
            options={["Diese Woche", "Diesen Monat", "Dieses Jahr"]}
            active={timeFilter}
            onChange={setTimeFilter}
          />
        }
      />

      {/* 2. Metrics Layer */}
      <DashboardGrid columns={3}>
        <OverviewCard
          label="Offene Fälle"
          value="12"
          trend="2 neue"
          trendUp={true}
          icon={Activity}
          iconBgClass="bg-[#B5E4CA]"
          iconColorClass="text-[#1A1D1F]"
          chartColor="#83BF6E"
          chartPath="M0 35 C 10 35, 10 20, 20 20 C 30 20, 30 5, 40 5 C 50 5, 50 15, 60 15 C 70 15, 70 0, 80 0"
        />
        <OverviewCard
          label="Abgeschlossen"
          value="512"
          trend="24% diese Woche"
          trendUp={false}
          icon={CheckCircle}
          iconBgClass="bg-[#CABDFF]"
          iconColorClass="text-[#1A1D1F]"
          chartColor="#8E59FF"
          chartPath="M0 20 C 20 20, 20 35, 40 35 C 60 35, 60 10, 80 15"
        />
        <OverviewCard
          label="Gesparte Abgaben"
          value="64k €"
          trend="12% vs. Vormonat"
          trendUp={true}
          icon={Wallet}
          iconBgClass="bg-[#FFBC99]"
          iconColorClass="text-[#1A1D1F]"
          chartColor="#FF6A55"
          chartPath="M0 30 C 20 30, 20 10, 40 20 C 60 30, 60 5, 80 5"
        />
      </DashboardGrid>

      {/* 3. Operational Layer */}
      <DashboardGrid columns={3}>
        {/* Main List Area (Span 2) */}
        <div className="lg:col-span-2">
          <CaseList />
        </div>

        {/* Right Trend Area (Span 1) */}
        <div className="lg:col-span-1">
          <ActivityChart />
        </div>
      </DashboardGrid>
    </div>
  );
}
