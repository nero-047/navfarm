'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Checkbox,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  PageHeader,
  Select,
  Surface,
  Toast,
} from '@/components/ui/primitives';
import { useCompanyContext } from '@/modules/company';
import {
  unwrap,
  useApiResource,
  type DataRow,
} from '@/modules/workspace/use-api-resource';

type ValueMap = Record<string, string>;

export function OperationsPage() {
  const { company } = useCompanyContext();
  const companyId = company?.id;
  const batches = useApiResource<DataRow[]>(
    companyId
      ? `/batch?companyId=${encodeURIComponent(companyId)}&status=ACTIVE&limit=200`
      : null,
  );
  const parameters = useApiResource<DataRow[]>(
    companyId
      ? `/parameter?companyId=${encodeURIComponent(companyId)}&limit=500`
      : null,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState('');
  const [scheduler, setScheduler] = useState<DataRow | null>(null);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [schedulerError, setSchedulerError] = useState('');
  const [values, setValues] = useState<ValueMap>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: 'danger' | 'success';
    message: string;
  } | null>(null);

  const activeRows = batches.data ?? [];
  const selectedRows = activeRows.filter((batch) =>
    selected.includes(String(batch.batch_id)),
  );
  const firstSchedulerId = selectedRows[0]?.scheduler_id
    ? String(selectedRows[0].scheduler_id)
    : '';

  useEffect(() => {
    setScheduler(null);
    setSchedulerError('');
    setPeriod('');
    setValues({});
    if (!firstSchedulerId) return;
    let active = true;
    setSchedulerLoading(true);
    api
      .get<unknown>(`/scheduler/${encodeURIComponent(firstSchedulerId)}`)
      .then((result) => {
        if (active) setScheduler(unwrap<DataRow>(result));
      })
      .catch((cause) => {
        if (active)
          setSchedulerError(
            cause instanceof Error
              ? cause.message
              : 'Could not load scheduler.',
          );
      })
      .finally(() => {
        if (active) setSchedulerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [firstSchedulerId]);

  const schedulerLines =
    (scheduler?.parameter_lines as DataRow[] | undefined) ?? [];
  const periods = useMemo(() => {
    const map = new Map<string, string>();
    for (const line of schedulerLines)
      map.set(
        String(line.period_no),
        String(
          line.period_label ||
            `Period ${line.period_no} · day ${line.period_from}–${line.period_to}`,
        ),
      );
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [schedulerLines]);

  useEffect(() => {
    if (!period && periods[0]) setPeriod(periods[0].value);
  }, [period, periods]);

  const applicableLines = schedulerLines.filter(
    (line) => String(line.period_no) === period,
  );
  const parameterById = new Map(
    (parameters.data ?? []).map((parameter) => [
      String(parameter.parameter_id),
      parameter,
    ]),
  );

  const toggleBatch = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  async function submit() {
    setFeedback(null);
    if (!selectedRows.length)
      return setFeedback({
        tone: 'danger',
        message: 'Select at least one active batch.',
      });
    const entries = applicableLines
      .map((line) => ({
        line,
        parameter: parameterById.get(String(line.parameter_id)),
        value: values[String(line.parameter_id)],
      }))
      .filter(
        (entry) =>
          entry.parameter && entry.value !== undefined && entry.value !== '',
      );
    if (!entries.length)
      return setFeedback({
        tone: 'danger',
        message: 'Enter at least one scheduled parameter value.',
      });
    const incompatible = selectedRows.filter(
      (row) => String(row.scheduler_id || '') !== firstSchedulerId,
    );
    if (incompatible.length)
      return setFeedback({
        tone: 'danger',
        message:
          'Selected batches use different schedulers. Record them in separate submissions.',
      });
    setSaving(true);
    try {
      await Promise.all(
        selectedRows.flatMap((batch) =>
          entries.map(({ parameter, value }) =>
            api.post(`/batch/${String(batch.batch_id)}/transaction`, {
              transaction_date: date,
              transaction_type: String(parameter!.parameter_type),
              item_id: parameter!.item_id || undefined,
              resource_id: parameter!.resource_id || undefined,
              quantity: Number(value),
              uom: String(parameter!.default_uom || '') || undefined,
              remarks: `Scheduler entry: ${String(parameter!.parameter_name)}`,
            }),
          ),
        ),
      );
      setValues({});
      setFeedback({
        tone: 'success',
        message: `${entries.length} parameter${entries.length === 1 ? '' : 's'} recorded for ${selectedRows.length} batch${selectedRows.length === 1 ? '' : 'es'}.`,
      });
    } catch (cause) {
      setFeedback({
        tone: 'danger',
        message:
          cause instanceof Error
            ? cause.message
            : 'Could not record operational data.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (batches.loading || parameters.loading)
    return <LoadingState label="Loading data-entry configuration" />;
  if (batches.error)
    return (
      <Surface>
        <ErrorState message={batches.error} onRetry={batches.reload} />
      </Surface>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily operations"
        title="Data entry"
        description="Select the batches, operating period and date. Fields come from the locked scheduler attached to the active batch."
      />
      {!activeRows.length ? (
        <Surface>
          <EmptyState
            title="No active batches"
            description="Activate a production batch before recording daily operations."
          />
        </Surface>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Surface className="overflow-hidden">
            <div className="border-b border-(--border-subtle) p-5">
              <h2 className="text-lg font-semibold text-(--text-primary)">
                1. Choose batches
              </h2>
              <p className="mt-1 text-sm text-(--text-secondary)">
                Batches in one submission must share a scheduler.
              </p>
            </div>
            <div className="max-h-[520px] divide-y divide-(--border-subtle) overflow-y-auto">
              {activeRows.map((batch) => {
                const id = String(batch.batch_id);
                return (
                  <label
                    key={id}
                    className="flex min-h-16 cursor-pointer items-center gap-3 px-5 py-3 hover:bg-(--row-hover)"
                  >
                    <Checkbox
                      checked={selected.includes(id)}
                      onChange={() => toggleBatch(id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-(--text-primary)">
                        {String(batch.batch_no)}
                      </span>
                      <span className="mt-0.5 block text-xs text-(--text-muted)">
                        {Number(batch.opening_quantity || 0).toLocaleString()}{' '}
                        {String(batch.uom || '')} ·{' '}
                        {String(batch.costing_method)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Surface>
          <Surface className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Entry date">
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </FormField>
              <FormField label="Stage / scheduler period">
                <Select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  disabled={!periods.length}
                >
                  <option value="">
                    {selectedRows.length
                      ? 'No period available'
                      : 'Select a batch first'}
                  </option>
                  {periods.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            {schedulerLoading && <LoadingState label="Loading scheduler" />}
            {schedulerError && (
              <div className="mt-5">
                <Toast tone="danger">{schedulerError}</Toast>
              </div>
            )}
            {selectedRows.length > 0 && !firstSchedulerId && (
              <div className="mt-6">
                <EmptyState
                  title="No scheduler attached"
                  description="Attach a scheduler to this batch before using unified operational entry. This prevents hardcoded or disconnected daily forms."
                />
              </div>
            )}
            {firstSchedulerId && !schedulerLoading && !schedulerError && (
              <div className="mt-7">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-(--text-primary)">
                    2. Scheduled parameters
                  </h2>
                  <p className="mt-1 text-sm text-(--text-secondary)">
                    {String(scheduler?.scheduler_name || 'Batch scheduler')} ·
                    values are posted to each selected batch.
                  </p>
                </div>
                {!applicableLines.length ? (
                  <EmptyState
                    title="No parameters in this period"
                    description="Configure at least one scheduler parameter for the selected period."
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {applicableLines.map((line) => {
                      const parameter = parameterById.get(
                        String(line.parameter_id),
                      );
                      if (!parameter) return null;
                      const id = String(parameter.parameter_id);
                      return (
                        <FormField
                          key={id}
                          label={String(
                            parameter.parameter_name ||
                              parameter.parameter_code,
                          )}
                          hint={`${String(parameter.parameter_type)}${parameter.default_uom ? ` · ${String(parameter.default_uom)}` : ''}`}
                        >
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={values[id] ?? ''}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                [id]: event.target.value,
                              }))
                            }
                            placeholder={
                              line.expected_qty_override
                                ? `Expected ${String(line.expected_qty_override)}`
                                : 'Enter actual value'
                            }
                          />
                        </FormField>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {feedback && (
              <div className="mt-5">
                <Toast tone={feedback.tone}>
                  {feedback.tone === 'success' && (
                    <CheckCircle2 className="mr-2 inline" size={16} />
                  )}
                  {feedback.message}
                </Toast>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={submit}
                disabled={saving || !applicableLines.length}
              >
                {saving ? 'Recording…' : 'Record entries'}
              </Button>
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
}
