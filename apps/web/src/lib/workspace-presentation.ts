import {
  Bird, Factory, Fish, Leaf, Milk, PawPrint, Shapes, type LucideIcon,
} from 'lucide-react';
import type { WorkspaceMembership } from '../contracts/api';

export type WorkspaceModule = 'Batches' | 'Inventory' | 'QC' | 'QR' | 'Resources' | 'Finance' | 'Analytics';

export interface WorkspacePresentation {
  label: string;
  icon: LucideIcon;
  availableModules: readonly WorkspaceModule[];
  productionLabel: string;
}

const allModules: readonly WorkspaceModule[] = ['Batches', 'Inventory', 'QC', 'QR', 'Resources', 'Finance', 'Analytics'];

export const WORKSPACE_PRESENTATION: Record<WorkspaceMembership['workspaceType'], WorkspacePresentation> = {
  POULTRY: { label: 'Poultry', icon: Bird, availableModules: allModules, productionLabel: 'Batches' },
  AGRICULTURE: { label: 'Agriculture', icon: Leaf, availableModules: allModules, productionLabel: 'Production cycles' },
  PIGGERY: { label: 'Piggery', icon: PawPrint, availableModules: allModules, productionLabel: 'Production cycles' },
  DAIRY: { label: 'Dairy', icon: Milk, availableModules: allModules, productionLabel: 'Production cycles' },
  AQUACULTURE: { label: 'Aquaculture', icon: Fish, availableModules: allModules, productionLabel: 'Production cycles' },
  FEED_PROCESSING: { label: 'Feed & Processing', icon: Factory, availableModules: allModules, productionLabel: 'Production batches' },
  OTHER: { label: 'Other', icon: Shapes, availableModules: allModules, productionLabel: 'Production cycles' },
};

export function workspaceModuleEnabled(workspace: WorkspaceMembership, module?: string) {
  if (!module) return true;
  const presentation = WORKSPACE_PRESENTATION[workspace.workspaceType];
  return presentation.availableModules.includes(module as WorkspaceModule) && workspace.enabledModules.includes(module);
}
