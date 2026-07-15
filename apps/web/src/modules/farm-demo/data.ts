import type { CompanyMeta, NobCode } from '@/modules/company';

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';
export type BatchStatus =
  'Active' | 'At risk' | 'QC hold' | 'Ready to close' | 'Planned';

export interface IndustryDemoConfig {
  unit: string;
  outputUnit: string;
  primaryInput: string;
  primaryOutput: string;
  dailyParameter: string;
  qualityParameter: string;
  qualityTarget: string;
  costingMethods: string[];
  batchPrefix: string;
  resourceNames: string[];
  traceSteps: string[];
}

export const INDUSTRY_CONFIG: Record<NobCode, IndustryDemoConfig> = {
  POULTRY: {
    unit: 'birds',
    outputUnit: 'birds / eggs',
    primaryInput: 'Day-old chicks / fertile eggs',
    primaryOutput: 'Growers, eggs and processed packs',
    dailyParameter: 'Feed consumption',
    qualityParameter: 'Hatchability / live weight',
    qualityTarget: '≥ 87% / 1.8–2.5 kg',
    costingMethods: ['STANDARD', 'FIFO'],
    batchPrefix: 'PLT',
    resourceNames: ['Setter Machine 01', 'Farm Worker Team A', 'Feed Silo 03'],
    traceSteps: [
      'Breeder flock',
      'Hatching eggs',
      'Hatchery',
      'Rearing',
      'Broiler',
      'Slaughter pack',
    ],
  },
  LIVESTOCK: {
    unit: 'animals',
    outputUnit: 'litres / animals',
    primaryInput: 'Heifers, weaners and feed',
    primaryOutput: 'Milk, piglets and market animals',
    dailyParameter: 'Feed and milk yield',
    qualityParameter: 'Yield / health score',
    qualityTarget: '≥ 20 L/day / PASS',
    costingMethods: ['BIO_ASSET', 'STANDARD'],
    batchPrefix: 'LVS',
    resourceNames: ['Milking Parlour 01', 'Veterinary Team', 'Feed Mixer 02'],
    traceSteps: [
      'Purchase / birth',
      'Premature stage',
      'Mature asset',
      'Daily production',
      'QC release',
      'Sale / disposal',
    ],
  },
  AGRICULTURE: {
    unit: 'acres',
    outputUnit: 'kg',
    primaryInput: 'Seed, fertiliser and irrigation',
    primaryOutput: 'Fruit, crop and processed seed',
    dailyParameter: 'Irrigation / input use',
    qualityParameter: 'Moisture content',
    qualityTarget: '< 13%',
    costingMethods: ['STANDARD', 'BIO_ASSET', 'FIFO'],
    batchPrefix: 'AGR',
    resourceNames: ['Tractor 04', 'Irrigation Pump 02', 'Field Team West'],
    traceSteps: [
      'Seed lot',
      'Sowing',
      'Crop operations',
      'Harvest',
      'QC grading',
      'QR bag / sale',
    ],
  },
  AQUACULTURE: {
    unit: 'fingerlings',
    outputUnit: 'kg',
    primaryInput: 'Fingerlings and fish pellets',
    primaryOutput: 'Live fish, fillet and fish meal',
    dailyParameter: 'Feed and sample weight',
    qualityParameter: 'Freshness score',
    qualityTarget: '≥ 3 of 5',
    costingMethods: ['BIO_ASSET', 'FIFO', 'STANDARD'],
    batchPrefix: 'AQU',
    resourceNames: ['Pond Aerator 01', 'Water Quality Kit', 'Harvest Crew'],
    traceSteps: [
      'Fingerling lot',
      'Pond stocking',
      'Grow-out',
      'Harvest lot',
      'Aqua slaughter',
      'QR fillet pack',
    ],
  },
  INSECT: {
    unit: 'hives',
    outputUnit: 'kg',
    primaryInput: 'Colonies, sugar feed and hive material',
    primaryOutput: 'Honey and beeswax',
    dailyParameter: 'Hive inspection',
    qualityParameter: 'Moisture / purity',
    qualityTarget: '< 20% / PASS',
    costingMethods: ['STANDARD'],
    batchPrefix: 'INS',
    resourceNames: ['Apiary Team', 'Honey Extractor 01', 'Hive Set North'],
    traceSteps: [
      'Queen / colony',
      'Hive placement',
      'Feeding',
      'Honey harvest',
      'QC purity',
      'QR jar',
    ],
  },
  PROCESSING: {
    unit: 'kg planned',
    outputUnit: 'kg feed',
    primaryInput: 'BOR ingredients and micro-nutrients',
    primaryOutput: 'QC-released compound feed',
    dailyParameter: 'Ingredient issue',
    qualityParameter: 'Protein / moisture',
    qualityTarget: '18.8% / < 12%',
    costingMethods: ['STANDARD'],
    batchPrefix: 'FDM',
    resourceNames: ['Feed Mixer 01', 'Pellet Mill 02', 'Production Shift A'],
    traceSteps: [
      'BOR version',
      'Ingredient lots',
      'Mixing',
      'Pelleting',
      'QC release',
      'Finished feed bag',
    ],
  },
};

export interface DemoBatch {
  code: string;
  lob: string;
  method: string;
  stage: string;
  progress: number;
  quantity: string;
  output: string;
  status: BatchStatus;
  cost: string;
  variance: string;
}

export interface DemoTask {
  time: string;
  parameter: string;
  batch: string;
  expected: string;
  actual: string;
  status: 'Due' | 'Completed' | 'Deviation';
}

export interface DemoQualityRecord {
  lot: string;
  batch: string;
  parameter: string;
  result: string;
  status: 'PASS' | 'HOLD' | 'FAIL';
  owner: string;
}

export interface DemoResource {
  name: string;
  type: string;
  allocation: string;
  status: 'Available' | 'In use' | 'Maintenance due';
  cost: string;
}

function padded(index: number): string {
  return String(index).padStart(3, '0');
}

export function getDemoBatches(company: CompanyMeta): DemoBatch[] {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const lobs = company.lobs;
  return [
    {
      code: `${config.batchPrefix}-2026-${padded(41)}`,
      lob: lobs[0],
      method: config.costingMethods[0],
      stage:
        company.nobCode === 'LIVESTOCK'
          ? 'Mature production'
          : 'Daily operations',
      progress: 68,
      quantity:
        company.nobCode === 'AGRICULTURE'
          ? '10 acres'
          : company.nobCode === 'INSECT'
            ? '50 hives'
            : '10,000 units',
      output: 'On target',
      status: 'Active',
      cost: '₹ 8,42,650',
      variance: '+2.4%',
    },
    {
      code: `${config.batchPrefix}-2026-${padded(38)}`,
      lob: lobs[Math.min(1, lobs.length - 1)],
      method:
        config.costingMethods[Math.min(1, config.costingMethods.length - 1)],
      stage: 'Quality review',
      progress: 84,
      quantity: '7,800 units',
      output: '96% forecast',
      status: 'QC hold',
      cost: '₹ 5,18,200',
      variance: '-0.8%',
    },
    {
      code: `${config.batchPrefix}-2026-${padded(35)}`,
      lob: lobs[Math.min(2, lobs.length - 1)],
      method: config.costingMethods[0],
      stage: 'Final output',
      progress: 96,
      quantity: '5,200 units',
      output: 'Ready to transfer',
      status: 'Ready to close',
      cost: '₹ 3,76,490',
      variance: '+1.1%',
    },
    {
      code: `${config.batchPrefix}-2026-${padded(44)}`,
      lob: lobs[lobs.length - 1],
      method: config.costingMethods[0],
      stage: 'Draft setup',
      progress: 12,
      quantity: '12,500 planned',
      output: 'Not started',
      status: 'Planned',
      cost: '₹ 0',
      variance: '—',
    },
  ];
}

export function getDemoTasks(company: CompanyMeta): DemoTask[] {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const batches = getDemoBatches(company);
  return [
    {
      time: '07:00',
      parameter: config.dailyParameter,
      batch: batches[0].code,
      expected: '1,198 kg',
      actual: '1,199 kg',
      status: 'Completed',
    },
    {
      time: '09:30',
      parameter: config.qualityParameter,
      batch: batches[1].code,
      expected: config.qualityTarget,
      actual: 'Below warning limit',
      status: 'Deviation',
    },
    {
      time: '12:00',
      parameter: 'Resource usage',
      batch: batches[0].code,
      expected: '8 hours',
      actual: '—',
      status: 'Due',
    },
    {
      time: '16:00',
      parameter: 'Mortality / loss check',
      batch: batches[2].code,
      expected: '< 0.2%',
      actual: '0.08%',
      status: 'Completed',
    },
    {
      time: '18:30',
      parameter: 'Overhead meter reading',
      batch: batches[0].code,
      expected: '₹ 405/day',
      actual: '—',
      status: 'Due',
    },
  ];
}

export function getQualityRecords(company: CompanyMeta): DemoQualityRecord[] {
  const config = INDUSTRY_CONFIG[company.nobCode];
  const batches = getDemoBatches(company);
  return [
    {
      lot: 'QC-2026-0184',
      batch: batches[0].code,
      parameter: config.qualityParameter,
      result: config.qualityTarget,
      status: 'PASS',
      owner: 'Quality Team A',
    },
    {
      lot: 'QC-2026-0183',
      batch: batches[1].code,
      parameter: 'Visual grade',
      result: 'Grade B - review',
      status: 'HOLD',
      owner: 'A. Sharma',
    },
    {
      lot: 'QC-2026-0182',
      batch: batches[2].code,
      parameter: 'Weight / moisture',
      result: 'Within range',
      status: 'PASS',
      owner: 'Quality Team B',
    },
    {
      lot: 'QC-2026-0181',
      batch: batches[0].code,
      parameter: 'Contamination screen',
      result: 'No detection',
      status: 'PASS',
      owner: 'Lab 01',
    },
    {
      lot: 'QC-2026-0180',
      batch: batches[1].code,
      parameter: 'Temperature excursion',
      result: '+0.6°C / 42 min',
      status: 'FAIL',
      owner: 'H. Patel',
    },
  ];
}

export function getResources(company: CompanyMeta): DemoResource[] {
  const names = INDUSTRY_CONFIG[company.nobCode].resourceNames;
  return [
    {
      name: names[0],
      type: 'EQUIPMENT',
      allocation: company.lobs[0],
      status: 'In use',
      cost: '₹ 405 / day',
    },
    {
      name: names[1],
      type: names[1].includes('Team') ? 'MANPOWER' : 'EQUIPMENT',
      allocation: company.lobs[Math.min(1, company.lobs.length - 1)],
      status: 'Available',
      cost: '₹ 1,200 / shift',
    },
    {
      name: names[2],
      type: names[2].includes('Team') ? 'MANPOWER' : 'EQUIPMENT',
      allocation: 'Shared resource',
      status: 'Maintenance due',
      cost: '₹ 850 / hour',
    },
  ];
}

export function statusTone(status: string): Tone {
  if (
    ['Active', 'Completed', 'PASS', 'Available', 'Ready to close'].includes(
      status,
    )
  )
    return 'green';
  if (
    ['At risk', 'Deviation', 'HOLD', 'QC hold', 'Maintenance due'].includes(
      status,
    )
  )
    return 'amber';
  if (['FAIL'].includes(status)) return 'red';
  if (['Planned', 'Due', 'In use'].includes(status)) return 'blue';
  return 'gray';
}

export const SETUP_STEPS = [
  'Company profile',
  'Address & farm location',
  'Primary contacts',
  'Language',
  'Base currency',
  'Timezone & region',
  'Fiscal & accounting',
  'Enable modules',
  'Administrator account',
  'Users & roles',
  'GL mapping',
  'NOB & LOB configuration',
  'Master data',
  'Notifications',
  'Setup complete',
] as const;
