import { NOB_OPTIONS, type NobOption } from './types';

export const CUSTOM_NOB_CATALOG_KEY = 'navfarm_operator_nob_catalog';

export function getNobCatalog(): NobOption[] {
  if (typeof window === 'undefined') return NOB_OPTIONS;
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_NOB_CATALOG_KEY) ?? '[]') as NobOption[];
    return [...NOB_OPTIONS, ...custom.filter((item) => !NOB_OPTIONS.some((seed) => seed.code === item.code))];
  } catch {
    return NOB_OPTIONS;
  }
}

export function saveCustomNob(option: NobOption): void {
  const custom = getNobCatalog().filter((item) => !NOB_OPTIONS.some((seed) => seed.code === item.code));
  localStorage.setItem(CUSTOM_NOB_CATALOG_KEY, JSON.stringify([...custom.filter((item) => item.code !== option.code), option]));
}

export function removeCustomNob(code: string): void {
  const custom = getNobCatalog().filter((item) => !NOB_OPTIONS.some((seed) => seed.code === item.code) && item.code !== code);
  localStorage.setItem(CUSTOM_NOB_CATALOG_KEY, JSON.stringify(custom));
}
