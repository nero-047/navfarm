export interface CompanyMeta {
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export const COMPANIES: Record<string, CompanyMeta> = {
  piggery: {
    slug: 'piggery',
    name: 'Piggery',
    icon: '🐷',
    description: 'Manage breeding, production, feeds and processing for pig farming.',
  },
  poultry: {
    slug: 'poultry',
    name: 'Poultry',
    icon: '🐔',
    description: 'Grand parent, parent, broiler breeder, rearing, layer, hatchery and more.',
  },
  dairy: {
    slug: 'dairy',
    name: 'Dairy',
    icon: '🥛',
    description: 'Herd management, cattle breeding, milking parlour, feed to yield.',
  },
  agriculture: {
    slug: 'agriculture',
    name: 'Agriculture',
    icon: '🌾',
    description: 'Seeding, germination, irrigation, harvesting and storage.',
  },
  livestock: {
    slug: 'livestock',
    name: 'Livestock',
    icon: '🐄',
    description: 'Cow, goat, cattle, sheep farm management.',
  },
  aquaculture: {
    slug: 'aquaculture',
    name: 'Aquaculture',
    icon: '🐟',
    description: 'Breeding, feeding and harvesting for fish and shrimp farming.',
  },
  beekeeping: {
    slug: 'beekeeping',
    name: 'Beekeeping',
    icon: '🐝',
    description: 'Hive management, honey production and colony tracking.',
  },
};

export type CompanySlug = keyof typeof COMPANIES;

export function isValidCompany(slug: string): slug is CompanySlug {
  return slug in COMPANIES;
}
