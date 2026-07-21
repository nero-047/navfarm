import React from "react";
import Card from "../../source-ui/card";
import { Building2, Users, Coins, TrendingUp } from "lucide-react";

interface DashboardTabProps {
  activeCompany: any;
  usersCount: number;
  companiesCount: number;
  tenantPlanInfo: any;
}

export default function DashboardTab({ activeCompany, usersCount, companiesCount, tenantPlanInfo }: DashboardTabProps) {
  const userPercent = Math.min(100, (usersCount / (tenantPlanInfo?.max_users || 5)) * 100);
  const companyPercent = Math.min(100, (companiesCount / (tenantPlanInfo?.max_companies || 1)) * 100);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        <Card className="flex flex-col justify-between p-6 hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/[0.01] rounded-bl-full pointer-events-none group-hover:bg-teal-500/[0.02] transition-all" />
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[#8b8fa3] text-[10px] font-bold uppercase tracking-widest">Active Workspace Context</span>
              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-white mt-4 tracking-tight">
              {activeCompany?.company_name || "Unassigned Context"}
            </div>
            <div className="text-[10px] text-[#545869] font-mono mt-1">ID: {activeCompany?.company_id?.substring(0, 8)}...</div>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-6 bg-emerald-500/5 border border-emerald-500/10 py-1 px-2.5 rounded-lg w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Onboarding: Complete
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.01] rounded-bl-full pointer-events-none group-hover:bg-blue-500/[0.02] transition-all" />
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[#8b8fa3] text-[10px] font-bold uppercase tracking-widest">Team Seat Occupancy</span>
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white mt-4 tracking-tight">
              {usersCount}
            </div>
            <div className="text-[11px] text-[#8b8fa3] mt-1.5">
              Plan Seats: <span className="font-semibold text-white">{usersCount}</span> of <span className="font-semibold text-white">{tenantPlanInfo?.max_users || 5}</span> active
            </div>
          </div>
          <div className="w-full bg-[#121824] h-1.5 rounded-full mt-6 overflow-hidden border border-gray-800">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${userPercent}%` }} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.01] rounded-bl-full pointer-events-none group-hover:bg-purple-500/[0.02] transition-all" />
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[#8b8fa3] text-[10px] font-bold uppercase tracking-widest">Active Plan Subscription</span>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-teal-400 mt-4 tracking-tight uppercase font-mono">
              {tenantPlanInfo?.plan_id?.replace("PLAN_", "") || "BASIC"} TIER
            </div>
            <div className="text-[11px] text-[#8b8fa3] mt-1">
              Registered Companies: <span className="font-semibold text-white">{companiesCount}</span> / <span className="font-semibold text-white">{tenantPlanInfo?.max_companies || 1}</span>
            </div>
          </div>
          <div className="w-full bg-[#121824] h-1.5 rounded-full mt-6 overflow-hidden border border-gray-800">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${companyPercent}%` }} />
          </div>
        </Card>

      </div>

      {/* Subscriptions limitations block */}
      <Card className="border-teal-500/20 bg-teal-500/[0.01] p-6 hover:border-teal-500/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Dynamic Subscription Limit Safeguard</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Limit enforcement counters are executed directly at the transaction layer to guarantee system safety.</p>
            </div>
          </div>

          <div className="flex gap-6 w-full md:w-auto border-t md:border-t-0 border-[#1a1f2e] pt-4 md:pt-0">
            <div className="flex-1 md:flex-none text-left md:text-center">
              <div className="text-[9px] text-[#8b8fa3] uppercase font-bold tracking-widest">Active Users</div>
              <div className="text-base font-extrabold text-white mt-1 font-mono">{usersCount} <span className="text-[#545869] text-xs">/ {tenantPlanInfo?.max_users || 5}</span></div>
            </div>
            <div className="w-px bg-gray-850 h-8 hidden md:block" />
            <div className="flex-1 md:flex-none text-left md:text-center">
              <div className="text-[9px] text-[#8b8fa3] uppercase font-bold tracking-widest">Provisioned Companies</div>
              <div className="text-base font-extrabold text-white mt-1 font-mono">{companiesCount} <span className="text-[#545869] text-xs">/ {tenantPlanInfo?.max_companies || 1}</span></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
