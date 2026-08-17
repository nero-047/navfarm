import React from "react";
import { Card } from "@/components/ui/card";
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

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-(--text-secondary) text-[10px] font-semibold uppercase tracking-widest">Active Workspace Context</span>
              <div className="p-2 rounded-[var(--radius-sm)] bg-(--accent-muted) text-(--accent)">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-semibold text-(--text-primary) mt-4 tracking-tight">
              {activeCompany?.company_name || "Unassigned Context"}
            </div>
            <div className="text-[10px] text-(--text-muted) font-mono mt-1">ID: {activeCompany?.company_id?.substring(0, 8)}...</div>
          </div>
          <div className="text-[11px] font-semibold flex items-center gap-1.5 mt-6 py-1 px-2.5 rounded-[var(--radius-sm)] w-fit" style={{ color: "var(--success)", backgroundColor: "var(--success-muted)" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--success)" }} />
            Onboarding: Complete
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-(--text-secondary) text-[10px] font-semibold uppercase tracking-widest">Team Seat Occupancy</span>
              <div className="p-2 rounded-[var(--radius-sm)] bg-(--badge-bg) text-(--text-secondary)">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-(--text-primary) mt-4 tracking-tight">
              {usersCount}
            </div>
            <div className="text-[11px] text-(--text-secondary) mt-1.5">
              Plan Seats: <span className="font-semibold text-(--text-primary)">{usersCount}</span> of <span className="font-semibold text-(--text-primary)">{tenantPlanInfo?.max_users || 5}</span> active
            </div>
          </div>
          <div className="w-full bg-(--surface-raised) h-1.5 rounded-full mt-6 overflow-hidden border border-(--border)">
            <div className="bg-(--accent) h-full rounded-full transition-all duration-500" style={{ width: `${userPercent}%` }} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-(--text-secondary) text-[10px] font-semibold uppercase tracking-widest">Active Plan Subscription</span>
              <div className="p-2 rounded-[var(--radius-sm)] bg-(--badge-bg) text-(--text-secondary)">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-semibold text-(--accent) mt-4 tracking-tight uppercase font-mono">
              {tenantPlanInfo?.plan_id?.replace("PLAN_", "") || "BASIC"} TIER
            </div>
            <div className="text-[11px] text-(--text-secondary) mt-1">
              Registered Companies: <span className="font-semibold text-(--text-primary)">{companiesCount}</span> / <span className="font-semibold text-(--text-primary)">{tenantPlanInfo?.max_companies || 1}</span>
            </div>
          </div>
          <div className="w-full bg-(--surface-raised) h-1.5 rounded-full mt-6 overflow-hidden border border-(--border)">
            <div className="bg-(--accent) h-full rounded-full transition-all duration-500" style={{ width: `${companyPercent}%` }} />
          </div>
        </Card>

      </div>

      {/* Subscriptions limitations block */}
      <Card className="border-(--accent)/20 bg-(--accent)/[0.03] p-6 hover:border-(--accent)/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-sm)] bg-(--accent-muted) text-(--accent)">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-(--text-primary) text-sm">Dynamic Subscription Limit Safeguard</h4>
              <p className="text-[11px] text-(--text-secondary) mt-0.5">Limit enforcement counters are executed directly at the transaction layer to guarantee system safety.</p>
            </div>
          </div>

          <div className="flex gap-6 w-full md:w-auto border-t md:border-t-0 border-(--border) pt-4 md:pt-0">
            <div className="flex-1 md:flex-none text-left md:text-center">
              <div className="text-[9px] text-(--text-secondary) uppercase font-semibold tracking-widest">Active Users</div>
              <div className="text-base font-semibold text-(--text-primary) mt-1 font-mono">{usersCount} <span className="text-(--text-muted) text-xs">/ {tenantPlanInfo?.max_users || 5}</span></div>
            </div>
            <div className="w-px bg-(--border) h-8 hidden md:block" />
            <div className="flex-1 md:flex-none text-left md:text-center">
              <div className="text-[9px] text-(--text-secondary) uppercase font-semibold tracking-widest">Provisioned Companies</div>
              <div className="text-base font-semibold text-(--text-primary) mt-1 font-mono">{companiesCount} <span className="text-(--text-muted) text-xs">/ {tenantPlanInfo?.max_companies || 1}</span></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
