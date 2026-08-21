"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Check,
  X,
  Wheat,
  Boxes,
  Layers,
  Stethoscope,
  Building2,
  Plus,
} from "lucide-react";
import { getStoredUser, NavUser } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const STORAGE_KEY = "navfarm_operational_approvals";

export type ApprovalItem = {
  id: string;
  doc_type: "FEED_RATION" | "GRN_RECEIPT" | "STOCK_TRANSFER" | "STAGE_CLOSE" | "VET_DISPOSAL";
  doc_no: string;
  title: string;
  requestor: string;
  requestor_role: string;
  location: string;
  batch_no?: string;
  date_submitted: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  details: {
    item_or_stage: string;
    requested_qty: string;
    uom: string;
    cost_impact: string;
    justification: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  approval_date?: string;
  approver?: string;
  rejection_reason?: string;
};

const DEFAULT_APPROVALS: ApprovalItem[] = [
  {
    id: "app-001",
    doc_type: "FEED_RATION",
    doc_no: "REQ-RAT-2025-0042",
    title: "Daily Gestation Feed Ration Increase (+10%)",
    requestor: "piggery.staff@devco.local",
    requestor_role: "Farm Operator",
    location: "Gestation Barn 1 / Pen Row B",
    batch_no: "PIG-SOW-GEST-2025-001",
    date_submitted: "2026-08-20 10:15 AM",
    urgency: "HIGH",
    details: {
      item_or_stage: "Sow Gestation Feed (SG-101)",
      requested_qty: "199.5 kg / day (from 181.4 kg / day)",
      uom: "KG",
      cost_impact: "₹ 334.85 / day",
      justification: "Body condition score (BCS) assessment on Parity 2 sows indicated mild under-conditioning at Day 30 gestation.",
    },
    status: "PENDING",
  },
  {
    id: "app-002",
    doc_type: "GRN_RECEIPT",
    doc_no: "GRN-2025-0018",
    title: "Vendor Goods Receipt Quality Sign-Off",
    requestor: "Central Warehouse Inward Officer",
    requestor_role: "Store Manager",
    location: "Piggery Feed Store / Silo 1",
    date_submitted: "2026-08-20 09:30 AM",
    urgency: "MEDIUM",
    details: {
      item_or_stage: "Sow Gestation Feed (SG-101) — Batch MF-882",
      requested_qty: "2,400.00",
      uom: "KG",
      cost_impact: "₹ 44,400.00",
      justification: "Physical moisture test (11.2%) and toxin screen passed. Vendor invoice #INV-9921 attached for inventory acceptance.",
    },
    status: "PENDING",
  },
  {
    id: "app-003",
    doc_type: "STOCK_TRANSFER",
    doc_no: "TRF-2025-0089",
    title: "Creep Feed & Iron Dextran Requisition to Pen 1",
    requestor: "piggery.manager@devco.local",
    requestor_role: "Operational Admin",
    location: "Main Dispensary -> Farrowing Pen A",
    batch_no: "PIG-SOW-GEST-2025-001",
    date_submitted: "2026-08-19 04:45 PM",
    urgency: "MEDIUM",
    details: {
      item_or_stage: "Creep Feed (300 KG) + Iron Dextran 200mg (10 Vials)",
      requested_qty: "300 KG / 10 Vials",
      uom: "MIXED",
      cost_impact: "₹ 13,700.00",
      justification: "Pre-positioning nutritional supplements and piglet iron injections ahead of scheduled farrowing batch.",
    },
    status: "PENDING",
  },
  {
    id: "app-004",
    doc_type: "STAGE_CLOSE",
    doc_no: "STG-CLS-2025-0003",
    title: "Quarantine Stage Sign-Off & Variance Capitalization",
    requestor: "Farm Supervisor",
    requestor_role: "Senior Operations Lead",
    location: "Quarantine Holding Shed",
    batch_no: "PIG-GILT-QUAR-001",
    date_submitted: "2026-08-15 02:00 PM",
    urgency: "LOW",
    details: {
      item_or_stage: "Quarantine 30-Day Stage Closure",
      requested_qty: "28 Head",
      uom: "HEAD",
      cost_impact: "₹ 18,200.00 WIP Finalized",
      justification: "30-day health clearance completed with zero mortality. All 28 gilts tested negative for PRRS and cleared for breeding.",
    },
    status: "APPROVED",
    approval_date: "2026-08-15 05:20 PM",
    approver: "admin@1st.local (Company Admin)",
  },
];

export default function ApprovalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [search, setSearch] = useState("");
  const [approvals, setApprovals] = useState<ApprovalItem[]>(DEFAULT_APPROVALS);

  // Detail Modal
  const [viewingItem, setViewingItem] = useState<ApprovalItem | null>(null);

  // Reject Modal
  const [rejectItem, setRejectItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newType, setNewType] = useState<ApprovalItem["doc_type"]>("FEED_RATION");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("Gestation Barn 1");
  const [newBatchNo, setNewBatchNo] = useState("PIG-SOW-GEST-2025-001");
  const [newItemName, setNewItemName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newJustification, setNewJustification] = useState("");

  // Action feedback
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);

    // Load from localStorage for actual working persistence
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setApprovals(JSON.parse(saved));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APPROVALS));
      }
    } catch {
      // fallback
    }

    setReady(true);
  }, [router]);

  const saveApprovals = (items: ApprovalItem[]) => {
    setApprovals(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const handleApprove = (item: ApprovalItem) => {
    const updated = approvals.map((a) =>
      a.id === item.id
        ? {
            ...a,
            status: "APPROVED" as const,
            approval_date: new Date().toLocaleString(),
            approver: user?.fullName || user?.email || "Authorized User",
          }
        : a
    );
    saveApprovals(updated);
    setActionMsg(`✓ Approved document ${item.doc_no} successfully.`);
    if (viewingItem?.id === item.id) setViewingItem(null);
    setTimeout(() => setActionMsg(""), 3500);
  };

  const handleRejectConfirm = () => {
    if (!rejectItem) return;
    const updated = approvals.map((a) =>
      a.id === rejectItem.id
        ? {
            ...a,
            status: "REJECTED" as const,
            rejection_reason: rejectReason || "Rejected by authorizer.",
            approval_date: new Date().toLocaleString(),
            approver: user?.fullName || user?.email || "Authorized User",
          }
        : a
    );
    saveApprovals(updated);
    setActionMsg(`✕ Rejected document ${rejectItem.doc_no}.`);
    setRejectItem(null);
    setRejectReason("");
    if (viewingItem?.id === rejectItem.id) setViewingItem(null);
    setTimeout(() => setActionMsg(""), 3500);
  };

  const handleCreateApproval = () => {
    if (!newTitle || !newItemName) return;
    const count = approvals.length + 1;
    const prefix = newType === "FEED_RATION" ? "REQ-RAT" : newType === "GRN_RECEIPT" ? "GRN" : newType === "STOCK_TRANSFER" ? "TRF" : newType === "STAGE_CLOSE" ? "STG-CLS" : "VET-DISP";
    const docNo = `${prefix}-2026-${String(count).padStart(4, "0")}`;

    const newApproval: ApprovalItem = {
      id: `app-${Date.now()}`,
      doc_type: newType,
      doc_no: docNo,
      title: newTitle,
      requestor: user?.email || "piggery.operator@navfarm.local",
      requestor_role: user?.userType?.replace(/_/g, " ") || "Farm Operator",
      location: newLocation,
      batch_no: newBatchNo || undefined,
      date_submitted: new Date().toLocaleString(),
      urgency: "MEDIUM",
      details: {
        item_or_stage: newItemName,
        requested_qty: newQty || "1 Unit",
        uom: "KG",
        cost_impact: newCost.startsWith("₹") ? newCost : `₹ ${newCost || "0.00"}`,
        justification: newJustification || "Operational requirement logged from console.",
      },
      status: "PENDING",
    };

    const updated = [newApproval, ...approvals];
    saveApprovals(updated);
    setCreateModalOpen(false);
    setNewTitle("");
    setNewItemName("");
    setNewQty("");
    setNewCost("");
    setNewJustification("");
    setActionMsg(`✓ Created approval request ${docNo}.`);
    setTimeout(() => setActionMsg(""), 3500);
  };

  if (!ready || !user) return null;

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;
  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = approvals.filter((a) => a.status === "REJECTED").length;

  const filteredList = approvals
    .filter((a) => a.status === activeTab)
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.doc_no.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.requestor.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        (a.batch_no && a.batch_no.toLowerCase().includes(q))
      );
    });

  const getDocTypeBadge = (type: ApprovalItem["doc_type"]) => {
    switch (type) {
      case "FEED_RATION":
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"><Wheat className="h-3 w-3" /> Feed Ration</span>;
      case "GRN_RECEIPT":
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"><Boxes className="h-3 w-3" /> GRN Procurement</span>;
      case "STOCK_TRANSFER":
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"><Building2 className="h-3 w-3" /> Stock Transfer</span>;
      case "STAGE_CLOSE":
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"><Layers className="h-3 w-3" /> Stage Closure</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"><Stethoscope className="h-3 w-3" /> Clinical / Disposal</span>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <PageHeader
          title="Operational Approvals & Sign-Offs"
          description="Multi-tier authorization inbox for feed ration changes, GRN receipts, stock requisitions, and batch stage transitions."
          sticky={false}
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approvals…"
              className="nf-input pl-8 w-full text-xs"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="nf-btn-primary text-xs h-8 gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New Request
          </Button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-md)] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`nf-press px-4 py-2 rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "PENDING"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Action Required (Pending)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "PENDING" ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`nf-press px-4 py-2 rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "APPROVED"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Approved History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface)] text-[var(--text-secondary)]">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("REJECTED")}
          className={`nf-press px-4 py-2 rounded-[var(--radius-sm)] text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "REJECTED"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-500" />
          <span>Rejected / Returned</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface)] text-[var(--text-secondary)]">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* ── Table View ── */}
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-xs border-collapse">
          <TableHeader>
            <TableRow className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <TableHead className="py-2.5 px-3 font-semibold">Document No</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Type</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Title & Context</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Requestor</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Cost / Qty Impact</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Date Submitted</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                  No approval records found in this category.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((item) => (
                <TableRow key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)] transition-colors">
                  <TableCell className="py-3 px-3 font-mono font-bold text-[var(--text-primary)]">
                    {item.doc_no}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    {getDocTypeBadge(item.doc_type)}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">{item.location} {item.batch_no ? `• Batch: ${item.batch_no}` : ""}</p>
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span className="font-medium text-[var(--text-primary)]">{item.requestor}</span>
                    <span className="block text-[10px] text-[var(--text-secondary)]">{item.requestor_role}</span>
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span className="font-bold text-[var(--text-primary)]">{item.details.cost_impact}</span>
                    <span className="block text-[10px] text-[var(--text-secondary)]">{item.details.requested_qty}</span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-[var(--text-secondary)] font-mono text-[11px]">
                    {item.date_submitted}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingItem(item)}
                        className="h-7 text-xs px-2 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Button>

                      {item.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item)}
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectItem(item)}
                            className="h-7 text-xs px-2.5 gap-1"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}

                      {item.status === "APPROVED" && (
                        <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                        </span>
                      )}

                      {item.status === "REJECTED" && (
                        <span className="text-[11px] text-rose-600 font-semibold inline-flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>

      {/* ── MODAL: DOCUMENT DETAILS ── */}
      {viewingItem && (
        <Dialog
          open={Boolean(viewingItem)}
          onClose={() => setViewingItem(null)}
          title={`Approval Request: ${viewingItem.doc_no}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs pt-2">
            <div className="flex items-center justify-between p-3 rounded bg-[var(--surface-raised)] border border-[var(--border)]">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Document Type</p>
                <div className="mt-1">{getDocTypeBadge(viewingItem.doc_type)}</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-secondary)]">Current Status</p>
                <p className="font-bold text-sm mt-0.5 text-[var(--text-primary)]">{viewingItem.status}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm text-[var(--text-primary)]">{viewingItem.title}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
                <div><span className="font-medium">Requestor:</span> {viewingItem.requestor} ({viewingItem.requestor_role})</div>
                <div><span className="font-medium">Location:</span> {viewingItem.location}</div>
                {viewingItem.batch_no && <div><span className="font-medium">Batch No:</span> {viewingItem.batch_no}</div>}
                <div><span className="font-medium">Submitted:</span> {viewingItem.date_submitted}</div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--border)" }}>
              <p className="font-semibold text-[var(--text-primary)]">Operational Justification & Details</p>
              <div className="p-3 rounded bg-[var(--surface-raised)] space-y-1.5">
                <p><span className="font-medium text-[var(--text-secondary)]">Item / Action:</span> <span className="font-semibold text-[var(--text-primary)]">{viewingItem.details.item_or_stage}</span></p>
                <p><span className="font-medium text-[var(--text-secondary)]">Requested Qty:</span> <span className="font-mono">{viewingItem.details.requested_qty}</span></p>
                <p><span className="font-medium text-[var(--text-secondary)]">Estimated Cost Impact:</span> <span className="font-bold text-[var(--accent)]">{viewingItem.details.cost_impact}</span></p>
                <p className="pt-1 text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">Reason:</span> {viewingItem.details.justification}</p>
              </div>
            </div>

            {viewingItem.status === "APPROVED" && viewingItem.approver && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <p className="font-semibold">✓ Authorized by {viewingItem.approver}</p>
                <p className="text-[11px]">Approved on {viewingItem.approval_date}</p>
              </div>
            )}

            {viewingItem.status === "REJECTED" && viewingItem.rejection_reason && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                <p className="font-semibold">✕ Rejected by {viewingItem.approver}</p>
                <p className="text-[11px]">Reason: {viewingItem.rejection_reason}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Button variant="outline" onClick={() => setViewingItem(null)}>
                Close
              </Button>
              {viewingItem.status === "PENDING" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setRejectItem(viewingItem);
                    }}
                  >
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => handleApprove(viewingItem)}
                    className="nf-btn-primary"
                  >
                    Approve Document
                  </Button>
                </>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: REJECT REASON ── */}
      {rejectItem && (
        <Dialog
          open={Boolean(rejectItem)}
          onClose={() => setRejectItem(null)}
          title={`Reject Request: ${rejectItem.doc_no}`}
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs pt-2">
            <p className="text-[var(--text-secondary)]">
              Please specify the operational or financial reason for returning document <span className="font-bold text-[var(--text-primary)]">{rejectItem.doc_no}</span>.
            </p>
            <div>
              <label className="font-semibold block mb-1">Rejection Remarks</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Feed moisture exceeds tolerance limit / Ration exceeds standard cost budget."
                className="nf-input w-full"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <Button variant="outline" onClick={() => setRejectItem(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectConfirm}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: CREATE APPROVAL REQUEST ── */}
      {createModalOpen && (
        <Dialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create Operational Authorization Request"
          maxWidth="md"
        >
          <div className="space-y-3.5 text-xs pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Document Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="nf-input w-full"
                >
                  <option value="FEED_RATION">Feed Ration Change</option>
                  <option value="GRN_RECEIPT">GRN Procurement Sign-Off</option>
                  <option value="STOCK_TRANSFER">Stock Requisition & Transfer</option>
                  <option value="STAGE_CLOSE">Stage Closure & WIP Capitalization</option>
                  <option value="VET_DISPOSAL">Veterinary Emergency / Disposal</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Target Batch</label>
                <select
                  value={newBatchNo}
                  onChange={(e) => setNewBatchNo(e.target.value)}
                  className="nf-input w-full font-mono"
                >
                  <option value="PIG-SOW-GEST-2025-001">PIG-SOW-GEST-2025-001 (Sow Gestation)</option>
                  <option value="PIG-2025-06-0001">PIG-2025-06-0001 (LW Gilt Growing)</option>
                  <option value="PIG-FARROW-2025-002">PIG-FARROW-2025-002 (Farrowing Weaners)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Request Title / Summary</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Creep Feed + Mineral Mix emergency requisition for Pen 3"
                className="nf-input w-full font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold block mb-1">Item / Stage Involved</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Sow Gestation Feed (SG-101)"
                  className="nf-input w-full"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Quantity / Volume</label>
                <input
                  type="text"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  placeholder="e.g. 200 KG / 5 Vials"
                  className="nf-input w-full font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Estimated Cost Impact (₹)</label>
                <input
                  type="text"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  placeholder="e.g. 7,400.00"
                  className="nf-input w-full font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Farm Location / Pen</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Gestation Barn 1 / Pen Row B"
                className="nf-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Operational Justification</label>
              <textarea
                rows={3}
                value={newJustification}
                onChange={(e) => setNewJustification(e.target.value)}
                placeholder="Explain the clinical, nutritional, or stock reason for this request…"
                className="nf-input w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateApproval} className="nf-btn-primary">
                Submit for Authorization
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
