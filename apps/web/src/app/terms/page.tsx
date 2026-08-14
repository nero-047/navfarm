"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale, CreditCard, Activity, Cpu } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 font-sans relative overflow-x-hidden selection:bg-[#c24332] selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-900 bg-[#070b13] sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <span className="text-sm font-semibold tracking-tight text-white">
            NAV<span className="text-[#c24332]">Farm</span>
          </span>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-4 mb-12 border-b border-gray-900 pb-8">
          <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[#c24332]/10 flex items-center justify-center border border-[#c24332]/20 text-[#c24332]">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: July 10, 2026 • Version 2.0
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Quick links sidebar */}
          <aside className="md:col-span-4 sticky top-24 space-y-3 hidden md:block">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Sections</h4>
            {[
              { id: "accounts", label: "Tenant Accounts & Use" },
              { id: "billing", label: "Billing & Subscriptions" },
              { id: "sla", label: "Service Level Agreement" },
              { id: "api", label: "API Rate Limits" },
              { id: "termination", label: "Suspension & Exit" },
            ].map(sec => (
              <a key={sec.id} href={`#${sec.id}`} className="block text-xs font-semibold text-gray-400 hover:text-[#c24332] transition-colors py-1.5 border-l-2 border-transparent pl-3 hover:border-[#c24332]/30">
                {sec.label}
              </a>
            ))}
          </aside>

          {/* Terms Text */}
          <div className="md:col-span-8 space-y-10 text-sm text-gray-300 leading-relaxed">
            
            <section id="accounts" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Scale className="w-4 h-4 text-[#c24332]" />
                <h2>1. Tenant Accounts & Workspace Usage</h2>
              </div>
              <p>
                NAVFarm grants you a limited, non-exclusive, non-transferable license to access our cloud-based ERP modules.
              </p>
              <p>
                Each Tenant account operates in an isolated workspace. You are solely responsible for all actions occurring in your company profiles, team configuration assignments, and keeping administrative user credentials secure.
              </p>
            </section>

            <section id="billing" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <CreditCard className="w-4 h-4 text-[#c24332]" />
                <h2>2. Billing, Pricing & Renewals</h2>
              </div>
              <p>
                Workspace capabilities are determined by your chosen SaaS subscription plan:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                <li><strong>Basic Plan</strong> ($99/mo): Maximum 1 company, 5 user accounts, and 5 GB file storage.</li>
                <li><strong>Pro Plan</strong> ($199/mo): Maximum 3 companies, 10 user accounts, 10 GB file storage, and QR Code traceability engine.</li>
                <li><strong>Enterprise Plan</strong> ($499/mo): Maximum 10 companies, 100 user accounts, 100 GB storage limit, and custom API integrations.</li>
              </ul>
              <p>
                Subscriptions are billed on a monthly rolling cycle. Failure to settle invoices within 14 calendar days will result in automated workspace suspension.
              </p>
            </section>

            <section id="sla" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Activity className="w-4 h-4 text-[#c24332]" />
                <h2>3. Service Level Agreement (SLA) & Uptime</h2>
              </div>
              <p>
                We strive to maintain high system reliability. Our service levels provide:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                <li>Standard Support plans offer a guaranteed 99.5% platform uptime availability.</li>
                <li>Enterprise plans offer priority tier support and custom SLA guarantees (up to 99.90% uptime).</li>
              </ul>
              <p>
                SLA exclusions include scheduled bi-weekly system maintenance windows (usually on Sundays between 02:00 and 04:00 UTC) and external network transit provider failures.
              </p>
            </section>

            <section id="api" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Cpu className="w-4 h-4 text-[#c24332]" />
                <h2>4. API Integration & Rate Limits</h2>
              </div>
              <p>
                For Enterprise customers using direct integrations or automated feed systems (like smart sensory weighers, hatcher climate controls, or automated egg counts):
              </p>
              <p>
                A default rate limit of 1,000 requests per minute applies to standard API endpoints to safeguard database stability. Custom limits up to 5,000 calls per minute can be configured dynamically by System Administrators.
              </p>
            </section>

            <section id="termination" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <Scale className="w-4 h-4 text-[#c24332]" />
                <h2>5. Suspension & Account Exit</h2>
              </div>
              <p>
                You may cancel your subscription at any time. Upon workspace deletion request, your dynamic MySQL database schemas and user credentials will be wiped from our disks within 30 days.
              </p>
              <p>
                For subscription inquiries or billing assistance, contact our system administration helpdesk at <code>billing@navfarm.com</code>.
              </p>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#05080f] py-12 border-t border-gray-900 px-6 mt-20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs text-gray-650">© 2026 NAVFarm Systems Ltd. All rights reserved.</span>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
