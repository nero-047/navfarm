'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CompanyMeta } from '@/modules/company';
import { operationalClients } from './operational-client';
import {
  assertMockClose,
  assertMockQr,
  assertMockTransition,
  mockApplyOperation,
  mockApplyQualityDisposition,
  mockApproveBatch,
  mockCreateBatch,
  mockFinalizeBatch,
  mockJournal,
  mockVariance,
} from './mock-domain';
import {
  getDemoBatches,
  getQualityRecords,
  getResources,
  INDUSTRY_CONFIG,
} from './data';

export type CostingMethod = 'STANDARD' | 'FIFO' | 'BIO_ASSET';
export type WorkflowStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'QC_HOLD'
  | 'READY_TO_CLOSE'
  | 'CLOSED'
  | 'CANCELLED';

export interface WorkflowBatch {
  id: string;
  code: string;
  lob: string;
  method: CostingMethod;
  status: WorkflowStatus;
  riskStatus: 'ON_TRACK' | 'WARNING' | 'AT_RISK' | 'CRITICAL';
  inventoryStatus: 'BLOCKED' | 'PARTIAL' | 'RELEASED';
  costingStatus: 'DRAFT' | 'OPEN' | 'CLOSE_BLOCKED' | 'FINALIZED';
  stage: string;
  inputName: string;
  inputQty: number;
  inputUom: string;
  expectedOutput: number;
  actualOutput: number;
  standardRate: number;
  actualRate: number;
  expectedUsage: number;
  actualUsage: number;
  standardOverhead: number;
  actualOverhead: number;
  wip: number;
  sourceBatchId?: string;
  qcRequired: boolean;
  qcStatus: 'NOT_STARTED' | 'HOLD' | 'PASS' | 'FAIL';
  borVersion?: string;
  costSplitMethod?: 'FIXED_PERCENT' | 'BY_WEIGHT' | 'MAIN_ALL';
  createdAt: string;
  closedAt?: string;
}

export interface OperationEntry {
  id: string;
  batchId: string;
  entryType:
    | 'CONSUMPTION'
    | 'OUTPUT'
    | 'OVERHEAD'
    | 'RESOURCE'
    | 'MORTALITY'
    | 'OBSERVATION';
  parameter: string;
  quantity: number;
  uom: string;
  unitCost: number;
  expected?: number;
  notes: string;
  journal?: { debit: string; credit: string; amount: number };
  createdAt: string;
}

export interface QualityLot {
  id: string;
  code: string;
  batchId: string;
  parameter: string;
  result: string;
  status: 'HOLD' | 'PASS' | 'FAIL';
  owner: string;
  createdAt: string;
}

export interface QrPack {
  id: string;
  code: string;
  batchId: string;
  quantity: number;
  payload: string;
  createdAt: string;
}

export interface DemoResourceRecord {
  id: string;
  name: string;
  type: 'MANPOWER' | 'EQUIPMENT' | 'VEHICLE' | 'UTILITY' | 'OTHER';
  allocation: string;
  status: 'Available' | 'In use' | 'Maintenance due';
  costRate: number;
  costUom: 'HOUR' | 'DAY' | 'SHIFT' | 'BATCH';
}

export interface VarianceResult {
  price: number;
  usage: number;
  output: number;
  overhead: number;
  total: number;
}

export interface SetupState {
  completedSteps: number;
  legalName: string;
  displayName: string;
  companyType: string;
  registrationNumber: string;
  taxId: string;
  website: string;
  brandColor: string;
  address: string;
  addressLine1: string;
  city: string;
  stateProvince: string;
  country: string;
  postalCode: string;
  gpsCoordinates: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  receiveKpiAlerts: boolean;
  receiveWeeklyReports: boolean;
  language: string;
  additionalLanguages: string[];
  dateFormat: string;
  numberFormat: string;
  currency: string;
  reportingCurrencies: string[];
  timezone: string;
  fiscalYear: string;
  fiscalStartMonth: string;
  accountingStandard: string;
  inventoryValuation: string;
  modules: string[];
  notificationChannels: string[];
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminTwoFactor: boolean;
}

export interface MasterRecord {
  id: string;
  type: 'UOM' | 'ITEM' | 'BREED' | 'LOCATION';
  code: string;
  name: string;
  uom: string;
}

export interface DemoState {
  version: 6;
  batches: WorkflowBatch[];
  operations: OperationEntry[];
  qualityLots: QualityLot[];
  qrPacks: QrPack[];
  resources: DemoResourceRecord[];
  setup: SetupState;
  masterData: MasterRecord[];
  auditLog: string[];
}

export interface NewBatchInput {
  lob: string;
  method: CostingMethod;
  inputQty: number;
  expectedOutput: number;
  sourceBatchId?: string;
  borVersion?: string;
  costSplitMethod?: WorkflowBatch['costSplitMethod'];
}

export interface NewOperationInput {
  batchId: string;
  entryType: OperationEntry['entryType'];
  parameter: string;
  quantity: number;
  uom: string;
  unitCost: number;
  expected?: number;
  notes: string;
}

interface DemoStoreValue {
  state: DemoState;
  isReady: boolean;
  createBatch: (input: NewBatchInput) => WorkflowBatch;
  approveBatch: (id: string) => void;
  transitionBatch: (
    id: string,
    action: 'START' | 'PAUSE' | 'RESUME' | 'CANCEL',
    reason?: string,
  ) => { ok: boolean; message: string };
  recordOperation: (input: NewOperationInput) => void;
  createQualityLot: (batchId: string, parameter: string) => void;
  setQualityDisposition: (
    id: string,
    status: QualityLot['status'],
    result: string,
  ) => void;
  generateQrPack: (
    batchId: string,
    quantity: number,
  ) => { ok: boolean; message: string };
  addResource: (resource: Omit<DemoResourceRecord, 'id'>) => void;
  closeBatch: (id: string) => {
    ok: boolean;
    message: string;
    variance?: VarianceResult;
  };
  calculateVariance: (batch: WorkflowBatch) => VarianceResult;
  saveSetupStep: (step: number, values: Partial<SetupState>) => void;
  setModule: (module: string, enabled: boolean) => void;
  setNotificationChannel: (channel: string, enabled: boolean) => void;
  addMasterRecord: (record: Omit<MasterRecord, 'id'>) => void;
  removeMasterRecord: (id: string) => void;
  resetDemo: () => void;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function calculateVarianceForBatch(
  batch: WorkflowBatch,
): VarianceResult {
  return mockVariance(batch);
}

export function validateBatchClose(batch: WorkflowBatch): string | null {
  return assertMockClose(batch);
}

export function canGenerateQr(
  batch: WorkflowBatch | undefined,
): batch is WorkflowBatch {
  return Boolean(batch && !assertMockQr(batch, 1));
}

function seedState(company: CompanyMeta): DemoState {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const source = getDemoBatches(company);
  const methods = config.costingMethods as CostingMethod[];
  const batches: WorkflowBatch[] = source.map((batch, index) => ({
    id: `batch-${index + 1}`,
    code: batch.code,
    lob: batch.lob,
    method: methods[index % methods.length] ?? 'STANDARD',
    status:
      index === 0
        ? 'APPROVED'
        : index === 1
          ? 'QC_HOLD'
          : index === 2
            ? 'READY_TO_CLOSE'
            : 'DRAFT',
    riskStatus: index === 1 ? 'AT_RISK' : index === 0 ? 'WARNING' : 'ON_TRACK',
    inventoryStatus: index === 2 ? 'RELEASED' : 'BLOCKED',
    costingStatus: index === 3 ? 'DRAFT' : 'OPEN',
    stage: batch.stage,
    inputName: config.primaryInput,
    inputQty: index === 0 ? 10000 : 5000 + index * 500,
    inputUom: config.unit,
    expectedOutput: index === 0 ? 9800 : 4800 + index * 400,
    actualOutput: index === 2 ? 5520 : index === 0 ? 0 : 4600,
    standardRate: 20,
    actualRate: 21.5,
    expectedUsage: index === 0 ? 83916 : 12000,
    actualUsage: index === 0 ? 86400 : 12180,
    standardOverhead: index === 0 ? 48750 : 25000,
    actualOverhead: index === 0 ? 55000 : 26300,
    wip: index === 3 ? 0 : 842650 - index * 120000,
    sourceBatchId: index ? `batch-${index}` : undefined,
    qcRequired: true,
    qcStatus: index === 1 ? 'HOLD' : index === 2 ? 'PASS' : 'NOT_STARTED',
    borVersion:
      company.nobCode === 'PROCESSING' ? 'BOR-2026-001 V1' : undefined,
    costSplitMethod: batch.lob.toLowerCase().includes('slaughter')
      ? 'FIXED_PERCENT'
      : undefined,
    createdAt: new Date(2026, 6, 10 + index).toISOString(),
  }));
  const qualityLots: QualityLot[] = getQualityRecords(company).map(
    (lot, index) => ({
      id: `qc-${index + 1}`,
      code: lot.lot,
      batchId: batches[index % batches.length].id,
      parameter: lot.parameter,
      result: lot.result,
      status: lot.status,
      owner: lot.owner,
      createdAt: new Date(2026, 6, 15, 9 + index).toISOString(),
    }),
  );
  const resources: DemoResourceRecord[] = getResources(company).map(
    (resource, index) => ({
      id: `resource-${index + 1}`,
      name: resource.name,
      type: resource.type === 'MANPOWER' ? 'MANPOWER' : 'EQUIPMENT',
      allocation: resource.allocation,
      status: resource.status,
      costRate: [405, 1200, 850][index],
      costUom: index === 1 ? 'SHIFT' : index === 2 ? 'HOUR' : 'DAY',
    }),
  );
  return {
    version: 6,
    batches,
    operations: [],
    qualityLots,
    qrPacks: [],
    resources,
    setup: {
      completedSteps: Math.round((company.setupProgress / 100) * 15),
      legalName: company.name,
      displayName: company.name,
      companyType: 'Private Limited',
      registrationNumber: 'U01100MH2026PTC00184',
      taxId: '27AABCG1234F1ZK',
      website: 'https://www.navfarm.app',
      brandColor: '#1F4E79',
      address: company.location,
      addressLine1: 'Registered farm and operations office',
      city: company.location.split(',')[0]?.trim() || 'Pune',
      stateProvince: company.location.split(',')[1]?.trim() || 'Maharashtra',
      country: 'India',
      postalCode: '411001',
      gpsCoordinates: '18.520430, 73.856744',
      contactName: 'Rajesh Kumar Sharma',
      contactEmail: 'operations@sunriselivestock.in',
      contactPhone: '+91 98700 12309',
      receiveKpiAlerts: true,
      receiveWeeklyReports: true,
      language: 'English',
      additionalLanguages: ['Hindi', 'Marathi'],
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'Indian (1,00,000)',
      currency: 'INR',
      reportingCurrencies: ['USD'],
      timezone: 'Asia/Kolkata',
      fiscalYear: 'April to March',
      fiscalStartMonth: 'April',
      accountingStandard: 'IND AS',
      inventoryValuation: 'LOB-level configuration',
      modules: ['Batches', 'Inventory', 'QC', 'QR', 'Finance', 'Analytics'],
      notificationChannels: ['In-app notifications', 'Email'],
      adminName: 'Rajesh Kumar Sharma',
      adminEmail: 'admin@sunriselivestock.in',
      adminPhone: '+91 98700 12309',
      adminTwoFactor: true,
    },
    masterData: [
      { id: 'master-1', type: 'UOM', code: 'KG', name: 'Kilogram', uom: 'KG' },
      {
        id: 'master-2',
        type: 'ITEM',
        code: 'FEED-001',
        name: config.primaryInput,
        uom: 'KG',
      },
      {
        id: 'master-3',
        type: 'BREED',
        code: 'BREED-001',
        name:
          company.nobCode === 'AGRICULTURE'
            ? 'Primary variety'
            : 'Primary breed',
        uom: 'NOS',
      },
      {
        id: 'master-4',
        type: 'LOCATION',
        code: 'LOC-001',
        name: company.location,
        uom: 'N/A',
      },
    ],
    auditLog: ['Company workspace created and opening balances loaded.'],
  };
}

function journalFor(input: NewOperationInput): OperationEntry['journal'] {
  return mockJournal(input);
}

export function DemoStoreProvider({
  company,
  children,
}: {
  company: CompanyMeta;
  children: ReactNode;
}) {
  const [state, setState] = useState<DemoState>(() => seedState(company));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    operationalClients.workspace
      .bootstrap<DemoState>(company.slug, seedState(company))
      .then((storedState) => {
        if (cancelled) return;
        const parsed = storedState as DemoState | null;
        setState(parsed?.version === 6 ? parsed : seedState(company));
      })
      .catch(() => {
        if (!cancelled) setState(seedState(company));
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [company]);

  useEffect(() => {
    if (isReady) {
      void Promise.all([
        ...state.batches.map((batch) => operationalClients.batches.save(company.slug, batch)),
        ...state.operations.map((operation) => operationalClients.operations.save(company.slug, operation)),
        ...state.qualityLots.map((lot) => operationalClients.qualityLots.save(company.slug, lot)),
        ...state.qrPacks.map((pack) => operationalClients.qrPacks.save(company.slug, pack)),
        ...state.resources.map((resource) => operationalClients.resources.save(company.slug, resource)),
      ]).catch(() => undefined);
      window.dispatchEvent(
        new CustomEvent('navfarm-demo-state', {
          detail: { company: company.slug, modules: state.setup.modules },
        }),
      );
    }
  }, [company.slug, isReady, state]);

  const calculateVariance = useCallback(
    (batch: WorkflowBatch): VarianceResult => {
      return calculateVarianceForBatch(batch);
    },
    [],
  );

  const createBatch = useCallback(
    (input: NewBatchInput): WorkflowBatch => {
      let created!: WorkflowBatch;
      setState((current) => {
        const nextNumber = current.batches.length + 45;
        created = mockCreateBatch(input, {
          number: nextNumber, prefix: INDUSTRY_CONFIG[company.nobCode].batchPrefix,
          inputName: INDUSTRY_CONFIG[company.nobCode].primaryInput,
          inputUom: INDUSTRY_CONFIG[company.nobCode].unit,
        });
        return {
          ...current,
          batches: [created, ...current.batches],
          auditLog: [
            `Created draft batch ${created.code}.`,
            ...current.auditLog,
          ],
        };
      });
      return created;
    },
    [company.nobCode],
  );

  const approveBatch = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      batches: current.batches.map((batch) =>
        batch.id === id ? mockApproveBatch(batch) : batch,
      ),
      auditLog: [
        `Approved batch; costing method and standards locked.`,
        ...current.auditLog,
      ],
    }));
  }, []);

  const transitionBatch = useCallback(
    (
      id: string,
      action: 'START' | 'PAUSE' | 'RESUME' | 'CANCEL',
      reason = '',
    ) => {
      const batch = state.batches.find((item) => item.id === id);
      if (!batch) return { ok: false, message: 'Batch not found.' };
      const transitionError = assertMockTransition(batch, action, reason);
      if (transitionError) return { ok: false, message: transitionError };
      const nextStatus: WorkflowStatus =
        action === 'START' || action === 'RESUME'
          ? 'ACTIVE'
          : action === 'PAUSE'
            ? 'PAUSED'
            : 'CANCELLED';
      setState((current) => ({
        ...current,
        batches: current.batches.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
                stage:
                  action === 'START' || action === 'RESUME'
                    ? 'Daily operations'
                    : action === 'PAUSE'
                      ? 'Operations paused'
                      : 'Cancelled',
                riskStatus: action === 'PAUSE' ? 'WARNING' : item.riskStatus,
                costingStatus:
                  action === 'CANCEL' ? 'FINALIZED' : item.costingStatus,
                wip: action === 'CANCEL' ? 0 : item.wip,
              }
            : item,
        ),
        auditLog: [
          `${action} ${batch.code}${reason ? ` — ${reason}` : ''}.`,
          ...current.auditLog,
        ],
      }));
      return {
        ok: true,
        message: `${batch.code} changed to ${nextStatus.replaceAll('_', ' ')}.`,
      };
    },
    [state.batches],
  );

  const recordOperation = useCallback((input: NewOperationInput) => {
    const journal = journalFor(input);
    const entry: OperationEntry = {
      id: `operation-${Date.now()}`,
      ...input,
      journal,
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({
      ...current,
      operations: [entry, ...current.operations],
      batches: current.batches.map((batch) => {
        if (batch.id !== input.batchId) return batch;
        return mockApplyOperation(batch, input);
      }),
      auditLog: [
        `Recorded ${input.entryType.toLowerCase()} entry${journal ? ` and balanced journal ₹${journal.amount.toLocaleString('en-IN')}` : ''}.`,
        ...current.auditLog,
      ],
    }));
  }, []);

  const createQualityLot = useCallback((batchId: string, parameter: string) => {
    setState((current) => {
      const lot: QualityLot = {
        id: `qc-${Date.now()}`,
        code: `QC-2026-${String(current.qualityLots.length + 185).padStart(4, '0')}`,
        batchId,
        parameter,
        result: 'Awaiting inspection',
        status: 'HOLD',
        owner: 'Current user',
        createdAt: new Date().toISOString(),
      };
      return {
        ...current,
        qualityLots: [lot, ...current.qualityLots],
        batches: current.batches.map((batch) =>
          batch.id === batchId
            ? { ...batch, qcStatus: 'HOLD', status: 'QC_HOLD' }
            : batch,
        ),
        auditLog: [
          `Created ${lot.code}; source output placed on QC hold.`,
          ...current.auditLog,
        ],
      };
    });
  }, []);

  const setQualityDisposition = useCallback(
    (id: string, status: QualityLot['status'], result: string) => {
      setState((current) => {
        const lot = current.qualityLots.find((item) => item.id === id);
        if (!lot) return current;
        return {
          ...current,
          qualityLots: current.qualityLots.map((item) =>
            item.id === id ? { ...item, status, result } : item,
          ),
          batches: current.batches.map((batch) =>
            batch.id === lot.batchId
              ? mockApplyQualityDisposition(batch, status)
              : batch,
          ),
          auditLog: [
            `${lot.code} disposition changed to ${status}.`,
            ...current.auditLog,
          ],
        };
      });
    },
    [],
  );

  const generateQrPack = useCallback(
    (batchId: string, quantity: number) => {
      const batch = state.batches.find((item) => item.id === batchId);
      if (!canGenerateQr(batch))
        return {
          ok: false,
          message:
            'QR generation is blocked until the source batch has QC PASS.',
        };
      const pack: QrPack = {
        id: `qr-${Date.now()}`,
        code: `PACK-2026-${String(state.qrPacks.length + 9513).padStart(7, '0')}`,
        batchId,
        quantity,
        payload: JSON.stringify({
          company: company.name,
          batch: batch.code,
          sourceBatchId: batch.sourceBatchId,
          qc: 'PASS',
        }),
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({
        ...current,
        qrPacks: [pack, ...current.qrPacks],
        auditLog: [
          `Generated ${pack.code} with farm-to-fork source lineage.`,
          ...current.auditLog,
        ],
      }));
      return { ok: true, message: `${pack.code} generated.` };
    },
    [company.name, state.batches, state.qrPacks.length],
  );

  const addResource = useCallback(
    (resource: Omit<DemoResourceRecord, 'id'>) => {
      setState((current) => ({
        ...current,
        resources: [
          { ...resource, id: `resource-${Date.now()}` },
          ...current.resources,
        ],
        auditLog: [
          `Added ${resource.type.toLowerCase()} resource ${resource.name}.`,
          ...current.auditLog,
        ],
      }));
    },
    [],
  );

  const closeBatch = useCallback(
    (id: string) => {
      const batch = state.batches.find((item) => item.id === id);
      if (!batch) return { ok: false, message: 'Batch not found.' };
      const validationMessage = validateBatchClose(batch);
      if (validationMessage) return { ok: false, message: validationMessage };
      const variance = calculateVariance(batch);
      setState((current) => ({
        ...current,
        batches: current.batches.map((item) =>
          item.id === id ? mockFinalizeBatch(item) : item,
        ),
        auditLog: [
          `${batch.code} closed; ${batch.method === 'STANDARD' ? 'four variances calculated' : batch.method === 'FIFO' ? 'actual FIFO cost finalized with no variances' : 'NCA/harvest cost finalized'} and WIP balanced to zero.`,
          ...current.auditLog,
        ],
      }));
      return {
        ok: true,
        message: `${batch.code} closed with a zero WIP balance.`,
        variance,
      };
    },
    [calculateVariance, state.batches],
  );

  const saveSetupStep = useCallback(
    (step: number, values: Partial<SetupState>) => {
      setState((current) => ({
        ...current,
        setup: {
          ...current.setup,
          ...values,
          completedSteps: Math.max(current.setup.completedSteps, step),
        },
        auditLog: [
          `Completed onboarding step ${step} of 15.`,
          ...current.auditLog,
        ],
      }));
    },
    [],
  );

  const setModule = useCallback((module: string, enabled: boolean) => {
    setState((current) => ({
      ...current,
      setup: {
        ...current.setup,
        modules: enabled
          ? Array.from(new Set([...current.setup.modules, module]))
          : current.setup.modules.filter((item) => item !== module),
      },
      auditLog: [
        `${enabled ? 'Enabled' : 'Disabled'} ${module} module.`,
        ...current.auditLog,
      ],
    }));
  }, []);

  const setNotificationChannel = useCallback(
    (channel: string, enabled: boolean) => {
      setState((current) => ({
        ...current,
        setup: {
          ...current.setup,
          notificationChannels: enabled
            ? Array.from(
                new Set([...current.setup.notificationChannels, channel]),
              )
            : current.setup.notificationChannels.filter(
                (item) => item !== channel,
              ),
        },
        auditLog: [
          `${enabled ? 'Enabled' : 'Disabled'} ${channel} notifications.`,
          ...current.auditLog,
        ],
      }));
    },
    [],
  );

  const addMasterRecord = useCallback((record: Omit<MasterRecord, 'id'>) => {
    setState((current) => ({
      ...current,
      masterData: [
        { ...record, id: `master-${Date.now()}` },
        ...current.masterData,
      ],
      auditLog: [
        `Added ${record.type} master ${record.code}.`,
        ...current.auditLog,
      ],
    }));
  }, []);

  const removeMasterRecord = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      masterData: current.masterData.filter((record) => record.id !== id),
      auditLog: ['Removed a master-data record.', ...current.auditLog],
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const next = seedState(company);
    setState(next);
    void operationalClients.workspace.reset(company.slug, next);
  }, [company]);

  const value = useMemo<DemoStoreValue>(
    () => ({
      state,
      isReady,
      createBatch,
      approveBatch,
      transitionBatch,
      recordOperation,
      createQualityLot,
      setQualityDisposition,
      generateQrPack,
      addResource,
      closeBatch,
      calculateVariance,
      saveSetupStep,
      setModule,
      setNotificationChannel,
      addMasterRecord,
      removeMasterRecord,
      resetDemo,
    }),
    [
      state,
      isReady,
      createBatch,
      approveBatch,
      transitionBatch,
      recordOperation,
      createQualityLot,
      setQualityDisposition,
      generateQrPack,
      addResource,
      closeBatch,
      calculateVariance,
      saveSetupStep,
      setModule,
      setNotificationChannel,
      addMasterRecord,
      removeMasterRecord,
      resetDemo,
    ],
  );

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore(): DemoStoreValue {
  const value = useContext(DemoStoreContext);
  if (!value)
    throw new Error('useDemoStore must be used inside DemoStoreProvider');
  return value;
}
