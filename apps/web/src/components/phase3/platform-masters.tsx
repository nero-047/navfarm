'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api-client';
import type { z } from 'zod';
import {
  lobTemplateSchema, moduleTemplateSchema, nobTemplateSchema, referenceDataSchema,
} from '../../contracts/phase3';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '../phase2/common';

type Section = 'dashboard' | 'nobs' | 'lobs' | 'modules' | 'reference-data';
type Nob = z.infer<typeof nobTemplateSchema>;
type Lob = z.infer<typeof lobTemplateSchema>;
type Module = z.infer<typeof moduleTemplateSchema>;
type References = z.infer<typeof referenceDataSchema>;

const sections = [
  ['nobs', 'NOB templates', 'Documented global business domains'],
  ['lobs', 'LOB templates', 'Permitted operating lines and costing policies'],
  ['modules', 'Module catalogue', 'Platform-supported application modules'],
  ['reference-data', 'Reference data', 'Languages, currencies and timezones'],
] as const;

export function PlatformMastersView({ section }: { section: Section }) {
  const [data, setData] = useState<Nob[] | Lob[] | Module[] | References | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (section === 'dashboard') return;
    setError('');
    try {
      setData(await api.get(`/platform/masters/${section}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reference masters failed to load.');
    }
  }, [section]);
  useEffect(() => { void load(); }, [load]);

  if (section !== 'dashboard' && !data && !error) return <LoadingState label="Loading reference templates…" />;
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 xl:p-8">
      <PageHeader
        eyebrow="Platform reference masters"
        title={section === 'dashboard' ? 'Reference master catalogue' : sections.find((item) => item[0] === section)?.[1] ?? 'Reference data'}
        description="Platform-owned templates are stable reference values. Companies enable and configure their own NOBs, LOBs and operational masters separately."
      />
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {section === 'dashboard' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map(([href, title, description]) => (
            <Link key={href} href={`/admin/masters/${href}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
              <h2 className="font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
              <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open catalogue →</span>
            </Link>
          ))}
        </div>
      ) : null}
      {Array.isArray(data) ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Code</th><th className="p-4">Name</th><th className="p-4">Context</th><th className="p-4">Status</th></tr></thead>
              <tbody>{data.map((record) => {
                const code = 'code' in record ? String(record.code) : '';
                const name = 'name' in record ? String(record.name) : '';
                const context = 'allowedCostingMethods' in record
                  ? record.allowedCostingMethods.join(', ')
                  : 'description' in record ? record.description : 'Platform reference';
                const key = String('nobTemplateId' in record ? record.nobTemplateId : 'lobTemplateId' in record ? record.lobTemplateId : record.moduleId);
                return <tr key={key} className="border-t border-slate-100"><td className="p-4 font-mono font-bold">{code}</td><td className="p-4 font-semibold">{name}</td><td className="p-4 text-slate-600">{context}</td><td className="p-4"><StatusBadge status={record.status} /></td></tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      ) : null}
      {data && !Array.isArray(data) ? (
        <div className="grid gap-4 md:grid-cols-3">
          {(['languages', 'currencies', 'timezones'] as const).map((group) => (
            <section key={group} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-black capitalize">{group}</h2>
              <ul className="mt-4 space-y-3">{data[group].map((item) => <li key={item.id} className="flex items-center justify-between gap-3 text-sm"><span><strong>{item.code}</strong><br /><span className="text-slate-500">{item.name}</span></span><StatusBadge status={item.status} /></li>)}</ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
