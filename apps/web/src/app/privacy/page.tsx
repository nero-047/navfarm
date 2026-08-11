'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-(--bg) text-(--text-primary) font-sans relative overflow-x-hidden selection:bg-(--accent) selection:text-white">
      {/* Background decoration */}
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-(--accent)/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-gray-900 bg-[#070b13]/85 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
          <span className="text-sm font-bold tracking-tight text-white">
            NAV<span className="text-(--accent)">Farm</span>
          </span>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-4 mb-12 border-b border-gray-900 pb-8">
          <div className="w-12 h-12 rounded-[var(--radius-md)] bg-(--accent-muted) flex items-center justify-center border border-(--accent) text-(--accent)">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Privacy & Data Security Policy
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: July 10, 2026 • Version 2.1
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Quick links sidebar */}
          <aside className="md:col-span-4 sticky top-24 space-y-3 hidden md:block">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Sections
            </h4>
            {[
              { id: 'isolation', label: 'Multi-Tenant Isolation' },
              { id: 'collection', label: 'Information We Collect' },
              { id: 'usage', label: 'How We Use Data' },
              { id: 'security', label: 'Technical Security' },
              { id: 'compliance', label: 'GDPR & Compliance' },
            ].map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="block text-xs font-semibold text-gray-400 hover:text-(--accent) transition-colors py-1.5 border-l-2 border-transparent pl-3 hover:border-(--accent)"
              >
                {sec.label}
              </a>
            ))}
          </aside>

          {/* Policy Text */}
          <div className="md:col-span-8 space-y-10 text-sm text-gray-300 leading-relaxed">
            <section id="isolation" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Lock className="w-4 h-4 text-(--accent)" />
                <h2>1. Multi-Tenant Database Isolation</h2>
              </div>
              <p>
                At NAVFarm, we employ a strict multi-tenant architecture
                designed to ensure total isolation of client data. Every
                registered Tenant account is provisioned with a completely
                separate physical or logical database schema (e.g.{' '}
                <code>tenant_shortcode</code>).
              </p>
              <p>
                Your operational farm records, livestock counts, feed
                formulations, and financial books can never be accessed, mixed,
                or viewed by other tenants on the platform. All access
                credentials and database parameters are cryptographically
                secured.
              </p>
            </section>

            <section id="collection" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <FileText className="w-4 h-4 text-(--accent)" />
                <h2>2. Information We Collect</h2>
              </div>
              <p>
                To provide comprehensive ERP services, we collect parameters
                relating to your business operations:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                <li>
                  <strong>Tenant Account Info</strong>: Admin name, email
                  address, password hashes, and invoicing emails.
                </li>
                <li>
                  <strong>Company Metadata</strong>: Corporate registration
                  details, tax identifiers (GSTIN/VAT/EIN), country of
                  operations, and local timezones.
                </li>
                <li>
                  <strong>Operational Metrics</strong>: Rearing batch logs,
                  laying percentages, mortality audits, feed weight tracking,
                  and accounting Ledgers.
                </li>
              </ul>
            </section>

            <section id="usage" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Eye className="w-4 h-4 text-(--accent)" />
                <h2>3. How We Use Your Data</h2>
              </div>
              <p>
                Your agricultural records are used solely to run your workspace
                console:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                <li>
                  To calculate biosecurity operational costing and margins.
                </li>
                <li>
                  To trigger real-time notification alerts (via SMTP or Webhook)
                  regarding coop environment metrics or audit logs.
                </li>
                <li>
                  To compile automated end-of-month financial reports and
                  balance sheets.
                </li>
              </ul>
              <p>
                We do not sell, trade, or share operational metrics with
                third-party advertising companies.
              </p>
            </section>

            <section id="security" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Shield className="w-4 h-4 text-(--accent)" />
                <h2>4. Technical Security Measures</h2>
              </div>
              <p>
                Our infrastructure matches modern enterprise standard
                specifications:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                <li>
                  <strong>Transport Layer Security (TLS)</strong>: All console
                  data in transit is encrypted using TLS 1.3.
                </li>
                <li>
                  <strong>At-Rest Encryption</strong>: Database disks,
                  credentials, and app password configurations (e.g. SMTP config
                  credentials) are fully encrypted.
                </li>
                <li>
                  <strong>Token-Based Authentication</strong>: Stateful JSON Web
                  Tokens (JWT) isolate and authenticate each request path.
                </li>
              </ul>
            </section>

            <section id="compliance" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Shield className="w-4 h-4 text-(--accent)" />
                <h2>5. GDPR & Compliance Rights</h2>
              </div>
              <p>
                Depending on your operating country, you retain access controls
                over your data, including the right to correct registration
                parameters, invite/revoke user seats, and request full workspace
                database exports.
              </p>
              <p>
                For data protection inquiries or to request system deletion of
                your database schema, please contact us at{' '}
                <code>privacy@navfarm.com</code>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#05080f] py-12 border-t border-gray-900 px-6 mt-20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs text-gray-650">
            © 2026 NAVFarm Systems Ltd. All rights reserved.
          </span>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
