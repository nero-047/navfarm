import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Check } from "lucide-react";
import { api } from "../../../services/api-client";

interface Step8ModulesProps {
  onSubmit: (modules: string[]) => Promise<void>;
  isSubmitting: boolean;
  nobs: any[];
  initialModules?: string[];
}

// Piggery-only for now — every other NOB/LOB combination is real backend
// catalog data (system admin still manages the full list in Master Data),
// but only Piggery has a built operational workflow end to end. Remove this
// filter once another LOB is ready to onboard companies against.
const PIGGERY_ONLY = true;
const isLivestockNob = (n: any) => (n.nob_name || n.nob_code || "").toLowerCase().includes("livestock");
const isPiggeryLob = (l: any) => (l.lob_name || l.lob_code || "").toLowerCase().includes("piggery");

export default function Step8Modules({ onSubmit, isSubmitting, nobs, initialModules }: Step8ModulesProps) {
  const visibleNobs = PIGGERY_ONLY ? nobs.filter(isLivestockNob) : nobs;
  const [selectedNobs, setSelectedNobs] = useState<string[]>([]);
  const [selectedLobs, setSelectedLobs] = useState<string[]>([]);

  // Mapping of NOB ID to its LOBs list
  const [lobMap, setLobMap] = useState<Record<string, any[]>>({});
  const [loadingLobs, setLoadingLobs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialModules && nobs.length > 0) {
      const nobCodes = nobs.map(n => n.nob_code);
      const initialNobs = initialModules.filter(m => nobCodes.includes(m));
      const initialLobs = initialModules.filter(m => !nobCodes.includes(m));
      setSelectedNobs(initialNobs);
      setSelectedLobs(initialLobs);
    }
  }, [initialModules, nobs]);

  // Fetch LOBs associated with selected NOBs automatically
  useEffect(() => {
    selectedNobs.forEach(nobCode => {
      const nob = nobs.find(n => n.nob_code === nobCode);
      if (nob) {
        fetchLobsForNob(nob.nob_id, nobCode);
      }
    });
  }, [selectedNobs, nobs]);

  const fetchLobsForNob = async (nobId: string, nobCode: string) => {
    if (lobMap[nobId]) return; // Already fetched
    setLoadingLobs(prev => ({ ...prev, [nobId]: true }));
    try {
      const list = await api.get(`/setup/wizard/lobs/${nobId}`);
      setLobMap(prev => ({ ...prev, [nobId]: list || [] }));

      // Auto-select all associated LOBs by default when NOB is selected
      const visibleLobs = PIGGERY_ONLY ? (list || []).filter(isPiggeryLob) : (list || []);
      const lobCodes = visibleLobs.map((l: any) => l.lob_code);
      setSelectedLobs(prev => {
        const unique = new Set([...prev, ...lobCodes]);
        return Array.from(unique);
      });
    } catch (e) {
      console.error(`Failed to fetch LOBs for NOB ${nobCode}:`, e);
    } finally {
      setLoadingLobs(prev => ({ ...prev, [nobId]: false }));
    }
  };

  const handleNobToggle = (nobCode: string, nobId: string) => {
    const isChecked = selectedNobs.includes(nobCode);
    if (isChecked) {
      setSelectedNobs(selectedNobs.filter(code => code !== nobCode));
      // Also unselect all sub-LOBs belonging to this NOB
      const associatedLobs = lobMap[nobId] || [];
      const associatedCodes = associatedLobs.map(l => l.lob_code);
      setSelectedLobs(selectedLobs.filter(code => !associatedCodes.includes(code)));
    } else {
      setSelectedNobs([...selectedNobs, nobCode]);
      // The useEffect will trigger LOB fetching and auto-checking automatically
    }
  };

  const handleLobToggle = (lobCode: string) => {
    const isChecked = selectedLobs.includes(lobCode);
    if (isChecked) {
      setSelectedLobs(selectedLobs.filter(code => code !== lobCode));
    } else {
      setSelectedLobs([...selectedLobs, lobCode]);
    }
  };

  const handleSubmit = () => {
    onSubmit([...selectedNobs, ...selectedLobs]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-(--text-primary) flex items-center gap-2">
          <Layers className="w-5 h-5 text-(--text-muted)" />
          Step 8: Nature of Farming Business
        </h2>
        <p className="text-xs text-(--text-secondary)">Enable lines of businesses to activate standard templates and workflows.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {nobs.length === 0 ? (
          <div className="p-4 bg-(--surface-raised) rounded-[var(--radius-sm)] text-(--text-secondary) text-sm">Loading business modules catalog...</div>
        ) : (
          visibleNobs.map((n: any) => {
            const isChecked = selectedNobs.includes(n.nob_code);
            return (
              <div
                key={n.nob_id}
                onClick={() => handleNobToggle(n.nob_code, n.nob_id)}
                className={`p-4 border rounded-[var(--radius-md)] flex flex-col gap-2 cursor-pointer transition-all ${
                  isChecked
                    ? "border-(--accent) bg-(--accent-muted)"
                    : "border-(--border) bg-(--surface-raised) hover:border-(--accent)"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-(--text-primary)">{n.nob_name}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isChecked ? "bg-(--accent) border-(--accent) text-white" : "border-(--border)"
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-(--text-secondary)">{n.description || "Link this sector to enable daily feed logs and batches."}</p>

                {/* Sub-LOBs options rendered inside the parent NOB card */}
                {isChecked && (
                  <div className="mt-3 pt-3 border-t border-(--border) flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-semibold text-(--accent) uppercase tracking-wider">Select Active Operations (LOBs):</span>
                    {loadingLobs[n.nob_id] ? (
                      <div className="text-[11px] text-(--text-secondary) animate-pulse py-1">Loading active sub-sectors...</div>
                    ) : !lobMap[n.nob_id] || (PIGGERY_ONLY ? lobMap[n.nob_id].filter(isPiggeryLob) : lobMap[n.nob_id]).length === 0 ? (
                      <div className="text-[11px] text-(--text-secondary) py-1">No sub-sectors available.</div>
                    ) : (
                      <div className="flex flex-col gap-1.5 mt-1">
                        {(PIGGERY_ONLY ? lobMap[n.nob_id].filter(isPiggeryLob) : lobMap[n.nob_id]).map((lob: any) => {
                          const isLobChecked = selectedLobs.includes(lob.lob_code);
                          return (
                            <label
                              key={lob.lob_id}
                              className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-(--surface-raised) text-xs transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isLobChecked}
                                onChange={() => handleLobToggle(lob.lob_code)}
                                className="w-4 h-4 rounded-[var(--radius-xs)] border-(--input-border) bg-(--input-bg) text-(--accent) focus:ring-(--accent) focus:ring-offset-0 focus:ring-0 cursor-pointer"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-(--text-primary)">{lob.lob_name}</span>
                                {lob.description && <span className="text-[10px] text-(--text-secondary)">{lob.description}</span>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="mt-8 self-end">
        {isSubmitting ? "Linking..." : "Link Verticals & Continue"}
      </Button>
    </div>
  );
}
