'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { destinationForSession } from '../../lib/authorization';

export default function ContextSelectionPage() {
  const { session, loading, selectContext } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, router, session]);
  if (loading || !session) return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-sm">Loading memberships…</div>;

  async function choose(tenantId: string, companyId: string | null) {
    const next = await selectContext(tenantId, companyId);
    router.push(destinationForSession(next));
  }

  return (
    <main className="min-h-screen bg-[#f3f5f8] px-5 py-12">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c4aa9]">Workspace context</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#252b3d]">Where would you like to work?</h1>
        <p className="mt-2 text-sm text-[#707789]">Your selection is stored in the secure server session, not in browser storage.</p>
        {session.user.platformRole === 'SYSTEM_ADMIN' && (
          <button onClick={() => router.push('/admin/dashboard')} className="mt-8 flex w-full items-center gap-4 rounded-2xl border border-[#dfe4ec] bg-white p-5 text-left shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1248] text-white"><ShieldAlert size={20} /></span>
            <span className="flex-1"><strong className="block text-sm">NAVFarm platform</strong><span className="mt-1 block text-xs text-[#707789]">System administration</span></span><ChevronRight size={17} />
          </button>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {session.tenants.map((tenant) => {
            const companies = session.companies.filter((company) => company.tenantId === tenant.tenantId);
            return (
              <section key={tenant.tenantId} className="rounded-2xl border border-[#dfe4ec] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><Building2 className="text-[#1c4aa9]" size={19} /><div><h2 className="text-sm font-semibold">{tenant.tenantName}</h2><p className={`mt-0.5 text-[10px] font-semibold ${tenant.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}`}>{tenant.status}</p></div></div>
                <div className="mt-4 space-y-2">
                  {companies.map((company) => (
                    <button key={company.companyId} disabled={tenant.status !== 'ACTIVE' || company.status !== 'ACTIVE'} onClick={() => void choose(tenant.tenantId, company.companyId)} className="flex w-full items-center rounded-xl border border-[#e7eaf0] px-3 py-3 text-left text-xs enabled:hover:border-[#1c4aa9] disabled:opacity-50">
                      <span className="flex-1"><strong className="block">{company.companyName}</strong><span className="mt-1 block text-[10px] text-[#7c8393]">{company.role.replaceAll('_', ' ')} · {company.onboardingStatus.replaceAll('_', ' ')}</span></span><ChevronRight size={14} />
                    </button>
                  ))}
                  {!companies.length && <button disabled={tenant.status !== 'ACTIVE'} onClick={() => void choose(tenant.tenantId, null)} className="w-full rounded-xl border border-[#e7eaf0] px-3 py-3 text-left text-xs disabled:opacity-50">Organization administration only</button>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
