export type NobCode = string;

export interface NobOption {
  code: NobCode;
  name: string;
  icon: string;
  description: string;
  lobs: string[];
}

export interface CompanyMeta {
  id?: string;
  tenantId?: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  nobCode: NobCode;
  nobName: string;
  lobs: string[];
  location: string;
  setupProgress: number;
}

export const NOB_OPTIONS: NobOption[] = [
  {
    code: 'POULTRY',
    name: 'Poultry',
    icon: '🐔',
    description:
      'Breeding, rearing, laying, hatching, broiler farming and slaughter.',
    lobs: [
      'Rearing & Breeding',
      'Laying',
      'Hatching',
      'Commercial Broiler',
      'Poultry Slaughter',
    ],
  },
  {
    code: 'LIVESTOCK',
    name: 'Livestock',
    icon: '🐄',
    description:
      'Dairy cattle, piggery, goats and sheep with biological-asset costing.',
    lobs: [
      'Dairy Cattle',
      'Piggery - Breeding',
      'Piggery - Commercial',
      'Goat & Sheep',
    ],
  },
  {
    code: 'AGRICULTURE',
    name: 'Agriculture',
    icon: '🌾',
    description:
      'Fruit, crop and seed production from cultivation through harvest.',
    lobs: ['Fruit Farming', 'Crop Farming', 'Seed Production'],
  },
  {
    code: 'AQUACULTURE',
    name: 'Aquaculture',
    icon: '🐟',
    description: 'Fish farming, pond operations, harvest and aqua processing.',
    lobs: ['Fish Farming', 'Aqua Slaughter'],
  },
  {
    code: 'INSECT',
    name: 'Insect Farming',
    icon: '🐝',
    description:
      'Apiary, honey, beeswax and future insect-production operations.',
    lobs: ['Beekeeping', 'Black Soldier Fly'],
  },
  {
    code: 'PROCESSING',
    name: 'Feed & Processing',
    icon: '🏭',
    description:
      'Bill-of-recipe feed batches, processing plants and QC release.',
    lobs: ['Feed Production', 'Processing Plant'],
  },
];

export function getNobOption(code: NobCode): NobOption {
  return (
    NOB_OPTIONS.find((item) => item.code === code) ?? {
      code,
      name: 'Unconfigured',
      icon: '🏢',
      description: 'Nature of business has not been configured.',
      lobs: [],
    }
  );
}

export function createCompanyMeta(
  name: string,
  slug: string,
  nobCode: NobCode,
  configuredNob?: NobOption,
): CompanyMeta {
  const nob = configuredNob ?? getNobOption(nobCode);
  return {
    slug,
    name,
    icon: nob.icon,
    description: nob.description,
    nobCode,
    nobName: nob.name,
    lobs: nob.lobs,
    location: 'Location not configured',
    setupProgress: 0,
  };
}

export function normalizeCompany(
  value: Partial<CompanyMeta> & Pick<CompanyMeta, 'slug' | 'name'>,
): CompanyMeta {
  const inferred =
    NOB_OPTIONS.find(
      (item) =>
        item.code === value.nobCode ||
        item.name.toLowerCase() === value.nobName?.toLowerCase(),
    ) ?? getNobOption(value.nobCode ?? 'UNCONFIGURED');
  return {
    id: value.id,
    tenantId: value.tenantId,
    slug: value.slug,
    name: value.name,
    icon: value.icon ?? inferred.icon,
    description: value.description ?? inferred.description,
    nobCode: value.nobCode ?? inferred.code,
    nobName: value.nobName ?? inferred.name,
    lobs: value.lobs?.length ? value.lobs : inferred.lobs,
    location: value.location ?? 'Location not configured',
    setupProgress: value.setupProgress ?? 0,
  };
}
