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

        <Card className="flex flex-col justify-between p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Active Workspace Context</span>
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}>
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-semibold mt-4 tracking-tight" style={{ color: "var(--text-primary)" }}>
              {activeCompany?.company_name || "Unassigned Context"}
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>ID: {activeCompany?.company_id?.substring(0, 8)}...</div>
          </div>
          <div className="text-[11px] font-semibold flex items-center gap-1.5 mt-6 py-1 px-2.5 rounded-[var(--radius-sm)] w-fit" style={{ color: "var(--success)", backgroundColor: "var(--success-muted)" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--success)" }} />
            Onboarding: Complete
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Team Seat Occupancy</span>
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ backgroundColor: "var(--badge-bg)", color: "var(--text-secondary)" }}>
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-semibold mt-4 tracking-tight font-mono" style={{ color: "var(--text-primary)" }}>
              {usersCount}
            </div>
            <div className="text-[11px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
              Plan Seats: <span className="font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{usersCount}</span> of <span className="font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{tenantPlanInfo?.max_users || 5}</span> active
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full mt-6 overflow-hidden border" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${userPercent}%`, backgroundColor: "var(--accent)" }} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Active Plan Subscription</span>
              <div className="p-2 rounded-[var(--radius-sm)]" style={{ backgroundColor: "var(--badge-bg)", color: "var(--text-secondary)" }}>
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-semibold mt-4 tracking-tight uppercase font-mono" style={{ color: "var(--accent)" }}>
              {tenantPlanInfo?.plan_id?.replace("PLAN_", "") || "BASIC"} TIER
            </div>
            <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Registered Companies: <span className="font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{companiesCount}</span> / <span className="font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{tenantPlanInfo?.max_companies || 1}</span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full mt-6 overflow-hidden border" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${companyPercent}%`, backgroundColor: "var(--accent)" }} />
          </div>
        </Card>

      </div>

      {/* Subscriptions limitations block */}
      <Card className="p-6 transition-all duration-300" style={{ borderColor: "rgba(194,67,50,0.2)", backgroundColor: "rgba(194,67,50,0.03)" }}>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[var(--radius-sm)]" style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Dynamic Subscription Limit Safeguard</h4>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Limit enforcement counters are executed directly at the transaction layer to guarantee system safety.</p>
            </div>
          </div>

          <div className="flex gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0" style={{ borderColor: "var(--border)" }}>
            <div className="flex-1 md:flex-none text-left md:text-center">
              <div className="text-[9px] uppercase font-semibold tracking-widest" style={{ color: "var(--text-secondary)" }}>Active Users</div>
              <div className="text-base font-semibold mt-1 font-mono" style={{ color: "var(--text-primary)" }}>{usersCount} <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ {tenantPlanInfo?.max_users || 5}</span></div>
            </div>
            <div className="w-px h-8 hidden md:block" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex-1 md:flex-none text-left md:text-center">
              <div className="text-[9px] uppercase font-semibold tracking-widest" style={{ color: "var(--text-secondary)" }}>Provisioned Companies</div>
              <div className="text-base font-semibold mt-1 font-mono" style={{ color: "var(--text-primary)" }}>{companiesCount} <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ {tenantPlanInfo?.max_companies || 1}</span></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
