'use client';

import { Leaf, ShieldCheck } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Surface,
} from '@/components/ui/primitives';
import {
  useApiResource,
  type DataRow,
} from '@/modules/workspace/use-api-resource';

export function PublicTracePage({
  companySlug,
  packId,
}: {
  companySlug: string;
  packId: string;
}) {
  const pack = useApiResource<DataRow>(
    packId ? `/qr-code/${encodeURIComponent(packId)}` : null,
  );
  return (
    <main className="min-h-screen bg-(--bg) px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight text-(--text-primary)">
            NAV<span className="text-(--accent)">Farm</span>
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-(--text-secondary)">
            <ShieldCheck size={15} className="text-(--success)" />
            Traceability record
          </span>
        </header>
        {pack.loading ? (
          <LoadingState label="Verifying pack" />
        ) : pack.error ? (
          <Surface>
            <ErrorState message={pack.error} onRetry={pack.reload} />
          </Surface>
        ) : !pack.data ? (
          <Surface>
            <EmptyState
              title="Pack not found"
              description="No production trace record was found for this pack identifier."
            />
          </Surface>
        ) : (
          <Surface className="overflow-hidden">
            <div className="border-b border-(--border-subtle) p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-(--success)">
                <Leaf size={21} />
              </span>
              <p className="mt-5 text-[13px] font-semibold text-(--accent)">
                Verified production pack
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-(--text-primary)">
                {String(pack.data.pack_no || packId)}
              </h1>
              <p className="mt-2 text-sm text-(--text-secondary)">
                Company workspace: {companySlug}
              </p>
            </div>
            <dl className="grid sm:grid-cols-2">
              {[
                ['Lot number', pack.data.lot_no],
                ['Production date', pack.data.production_date],
                ['Expiry date', pack.data.expiry_date],
                [
                  'Net weight',
                  `${String(pack.data.net_weight || '—')} ${String(pack.data.pack_uom || '')}`,
                ],
                ['Quality record', pack.data.qc_id || 'Not linked'],
                ['Status', pack.data.is_void ? 'Void' : 'Active'],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="border-b border-(--border-subtle) p-5 sm:border-r"
                >
                  <dt className="text-xs text-(--text-muted)">
                    {String(label)}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-(--text-primary)">
                    {String(value || '—')}
                  </dd>
                </div>
              ))}
            </dl>
          </Surface>
        )}
      </div>
    </main>
  );
}
