import { NOB_OPTIONS, type NobOption } from './types';

export const CUSTOM_NOB_CATALOG_KEY = 'navfarm_operator_nob_catalog';
let customNobs: NobOption[] = [];

export function getNobCatalog(): NobOption[] {
  return [...NOB_OPTIONS, ...customNobs.filter((item) => !NOB_OPTIONS.some((seed) => seed.code === item.code))];
}

export function saveCustomNob(option: NobOption): void {
  customNobs = [...customNobs.filter((item) => item.code !== option.code), option];
}

export function removeCustomNob(code: string): void {
  customNobs = customNobs.filter((item) => item.code !== code);
}
