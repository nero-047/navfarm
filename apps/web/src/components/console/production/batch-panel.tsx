"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, AlertCircle, Loader2, Inbox, Eye, PlayCircle, CheckCircle2, ClipboardCheck, QrCode as QrCodeIcon } from "lucide-react";
import QRCode from "react-qr-code";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { getActiveCompanyId } from "@/hooks/useAuth";

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised: { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  accent: { color: "var(--accent)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-(--input-border-focus)";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const emptyInputLine = () => ({ item_id: "", source_batch_id: "", quantity: "", uom: "", rate: "" });
const emptyOutputLine = () => ({ item_id: "", output_type: "MAIN", cost_split_pct: "100", quantity: "", uom: "", warehouse_id: "" });
const emptyTxForm = () => ({ transaction_date: new Date().toISOString().slice(0, 10), transaction_type: "CONSUMPTION", item_id: "", resource_id: "", quantity: "", uom: "", rate: "", remarks: "" });
const emptyStdConsumptionLine = () => ({ item_id: "", std_qty_per_unit_per_day: "", std_rate: "" });

const STATUS_STYLE: Record<string, any> = {
  DRAFT: { color: "var(--text-secondary)", borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" },
  ACTIVE: { color: "var(--accent)", borderColor: "var(--accent)", backgroundColor: "var(--accent-muted)" },
  CLOSED: { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" },
  CANCELLED: { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--surface-raised)" },
};

export default function BatchPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [nobs, setNobs] = useState<Row[]>([]);
  const [lobs, setLobs] = useState<Row[]>([]);
  const [breeds, setBreeds] = useState<Row[]>([]);
  const [sheds, setSheds] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);
  const [uoms, setUoms] = useState<Row[]>([]);
  const [warehouses, setWarehouses] = useState<Row[]>([]);
  const [resources, setResources] = useState<Row[]>([]);
  const [batches, setBatches] = useState<Row[]>([]);
  const [schedulers, setSchedulers] = useState<Row[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [nobId, setNobId] = useState("");
  const [header, setHeader] = useState<Row>({ lob_id: "", costing_method: "STANDARD", breed_id: "", scheduler_id: "", shed_id: "", start_date: "", expected_end_date: "", opening_quantity: "", uom: "", remarks: "" });
  const [inputLines, setInputLines] = useState<Row[]>([emptyInputLine()]);
  const [stdForm, setStdForm] = useState<Row>({ std_output_quantity: "", std_output_cost_per_unit: "", std_overhead_rate_per_unit: "" });
  const [stdConsumptionLines, setStdConsumptionLines] = useState<Row[]>([emptyStdConsumptionLine()]);

  const [viewing, setViewing] = useState<Row | null>(null);
  const [acting, setActing] = useState(false);
  const [txForm, setTxForm] = useState<Row>(emptyTxForm());

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [closeDate, setCloseDate] = useState(new Date().toISOString().slice(0, 10));
  const [closeQty, setCloseQty] = useState("");
  const [outputLines, setOutputLines] = useState<Row[]>([emptyOutputLine()]);

  const [bioActionOpen, setBioActionOpen] = useState<null | "mature" | "amortize" | "fair-value" | "dispose">(null);
  const [bioActing, setBioActing] = useState(false);
  const [bioError, setBioError] = useState("");
  const [bioForm, setBioForm] = useState<Row>({});

  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcLine, setQcLine] = useState<Row | null>(null);
  const [qcParameters, setQcParameters] = useState<Row[]>([]);
  const [qcForm, setQcForm] = useState<Row>({});
  const [qcResultValues, setQcResultValues] = useState<Record<string, Row>>({});
  const [qcSaving, setQcSaving] = useState(false);
  const [qcError, setQcError] = useState("");
  const [qcSubmitted, setQcSubmitted] = useState<Row | null>(null);

  const [packModalOpen, setPackModalOpen] = useState(false);
  const [packLine, setPackLine] = useState<Row | null>(null);
  const [packForm, setPackForm] = useState<Row>({});
  const [packQcRecords, setPackQcRecords] = useState<Row[]>([]);
  const [packSaving, setPackSaving] = useState(false);
  const [packError, setPackError] = useState("");
  const [generatedPack, setGeneratedPack] = useState<Row | null>(null);

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");
      const res = await api.get(`/batch?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    const qs = params.toString();
    api.get(`/setup/wizard/nobs?${qs}`).then((r) => setNobs(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/breed?${qs}`).then((r) => setBreeds(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/shed?${qs}`).then((r) => setSheds(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/item?${qs}`).then((r) => setItems(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/uom?${qs}`).then((r) => setUoms(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/warehouse?${qs}`).then((r) => setWarehouses(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/resource?${qs}`).then((r) => setResources(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/batch?${qs}`).then((r) => setBatches(unwrap<Row[]>(r) || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!nobId) { setLobs([]); return; }
    api.get(`/setup/wizard/lobs/${nobId}`).then((r) => setLobs(unwrap<Row[]>(r) || [])).catch(() => setLobs([]));
  }, [nobId]);

  useEffect(() => {
    if (!header.lob_id) { setSchedulers([]); return; }
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("lobId", header.lob_id);
    params.set("limit", "200");
    api.get(`/scheduler?${params.toString()}`).then((r) => setSchedulers(unwrap<Row[]>(r) || [])).catch(() => setSchedulers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header.lob_id]);

  const openCreate = () => {
    setNobId("");
    setHeader({ lob_id: "", costing_method: "STANDARD", breed_id: "", scheduler_id: "", shed_id: "", start_date: new Date().toISOString().slice(0, 10), expected_end_date: "", opening_quantity: "", uom: "", remarks: "" });
    setInputLines([emptyInputLine()]);
    setStdForm({ std_output_quantity: "", std_output_cost_per_unit: "", std_overhead_rate_per_unit: "" });
    setStdConsumptionLines([emptyStdConsumptionLine()]);
    setFormError("");
    setModalOpen(true);
  };

  const setInputLineField = (idx: number, key: string, value: any) => {
    setInputLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };
  const addInputLine = () => setInputLines((prev) => [...prev, emptyInputLine()]);
  const removeInputLine = (idx: number) => setInputLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const setStdConsumptionLineField = (idx: number, key: string, value: any) => {
    setStdConsumptionLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };
  const addStdConsumptionLine = () => setStdConsumptionLines((prev) => [...prev, emptyStdConsumptionLine()]);
  const removeStdConsumptionLine = (idx: number) => setStdConsumptionLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (!header.lob_id) throw new Error("Line of Business is required.");
      if (!header.start_date) throw new Error("Start date is required.");
      if (!header.opening_quantity || !header.uom) throw new Error("Opening quantity and UOM are required.");
      const cleanLines = inputLines
        .filter((l) => l.item_id && l.quantity && l.uom)
        .map((l) => ({
          item_id: l.item_id,
          source_batch_id: l.source_batch_id || undefined,
          quantity: Number(l.quantity),
          uom: l.uom,
          rate: l.rate ? Number(l.rate) : undefined,
        }));
      if (cleanLines.length === 0) throw new Error("Add at least one input line.");

      let standard: Row | undefined;
      if (header.costing_method === "STANDARD") {
        const cleanStdLines = stdConsumptionLines
          .filter((l) => l.item_id && l.std_qty_per_unit_per_day)
          .map((l) => ({
            item_id: l.item_id,
            std_qty_per_unit_per_day: Number(l.std_qty_per_unit_per_day),
            std_rate: l.std_rate ? Number(l.std_rate) : undefined,
          }));
        const hasAnyStdInput = stdForm.std_output_quantity || stdForm.std_output_cost_per_unit || stdForm.std_overhead_rate_per_unit || cleanStdLines.length > 0;
        if (hasAnyStdInput) {
          standard = {
            std_output_quantity: stdForm.std_output_quantity ? Number(stdForm.std_output_quantity) : undefined,
            std_output_cost_per_unit: stdForm.std_output_cost_per_unit ? Number(stdForm.std_output_cost_per_unit) : undefined,
            std_overhead_rate_per_unit: stdForm.std_overhead_rate_per_unit ? Number(stdForm.std_overhead_rate_per_unit) : undefined,
            consumption_lines: cleanStdLines.length > 0 ? cleanStdLines : undefined,
          };
        }
      }

      await api.post("/batch", {
        company_id: companyId,
        lob_id: header.lob_id,
        costing_method: header.costing_method,
        breed_id: header.breed_id || undefined,
        scheduler_id: header.scheduler_id || undefined,
        shed_id: header.shed_id || undefined,
        start_date: header.start_date,
        expected_end_date: header.expected_end_date || undefined,
        opening_quantity: Number(header.opening_quantity),
        uom: header.uom,
        remarks: header.remarks || undefined,
        input_lines: cleanLines,
        standard,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save batch.");
    } finally {
      setSaving(false);
    }
  };

  const openView = async (row: Row) => {
    try {
      const res = await api.get(`/batch/${row.batch_id}`);
      setViewing(unwrap<Row>(res));
      setTxForm(emptyTxForm());
    } catch (err: any) {
      setError(err?.message || "Failed to load batch details.");
    }
  };

  const refreshViewing = async () => {
    if (!viewing) return;
    const res = await api.get(`/batch/${viewing.batch_id}`);
    setViewing(unwrap<Row>(res));
  };

  const handleActivate = async () => {
    if (!viewing) return;
    setActing(true);
    try {
      await api.post(`/batch/${viewing.batch_id}/activate`, {});
      await refreshViewing();
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to activate batch.");
    } finally {
      setActing(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!viewing) return;
    setActing(true);
    setError("");
    try {
      if (!txForm.transaction_date) throw new Error("Transaction date is required.");
      const payload: Row = {
        transaction_date: txForm.transaction_date,
        transaction_type: txForm.transaction_type,
        remarks: txForm.remarks || undefined,
      };
      if (["CONSUMPTION", "OUTPUT"].includes(txForm.transaction_type)) {
        if (!txForm.item_id || !txForm.quantity || !txForm.uom) throw new Error("Item, quantity and UOM are required for this transaction type.");
        payload.item_id = txForm.item_id;
        payload.quantity = Number(txForm.quantity);
        payload.uom = txForm.uom;
        if (txForm.rate) payload.rate = Number(txForm.rate);
      } else if (txForm.transaction_type === "MORTALITY") {
        if (!txForm.quantity) throw new Error("Quantity is required for mortality.");
        payload.quantity = Number(txForm.quantity);
      } else if (txForm.transaction_type === "OVERHEAD") {
        if (!txForm.quantity || !txForm.rate) throw new Error("Quantity and rate are required for overhead.");
        payload.quantity = Number(txForm.quantity);
        payload.rate = Number(txForm.rate);
        if (txForm.resource_id) payload.resource_id = txForm.resource_id;
      }
      await api.post(`/batch/${viewing.batch_id}/transaction`, payload);
      setTxForm(emptyTxForm());
      await refreshViewing();
    } catch (err: any) {
      setError(err?.message || "Failed to record transaction.");
    } finally {
      setActing(false);
    }
  };

  const openClose = () => {
    setCloseDate(new Date().toISOString().slice(0, 10));
    setCloseQty(viewing ? String(viewing.opening_quantity) : "");
    setOutputLines([emptyOutputLine()]);
    setCloseError("");
    setCloseModalOpen(true);
  };

  const setOutputLineField = (idx: number, key: string, value: any) => {
    setOutputLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };
  const addOutputLine = () => setOutputLines((prev) => [...prev, emptyOutputLine()]);
  const removeOutputLine = (idx: number) => setOutputLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const splitTotal = outputLines.reduce((sum, l) => sum + (Number(l.cost_split_pct) || 0), 0);

  const handleClose = async () => {
    if (!viewing) return;
    setActing(true);
    setCloseError("");
    try {
      const cleanLines = outputLines
        .filter((l) => l.item_id && l.quantity && l.uom && l.warehouse_id)
        .map((l) => ({
          item_id: l.item_id,
          output_type: l.output_type,
          cost_split_pct: Number(l.cost_split_pct),
          quantity: Number(l.quantity),
          uom: l.uom,
          warehouse_id: l.warehouse_id,
        }));
      if (cleanLines.length === 0) throw new Error("Add at least one output line.");
      await api.post(`/batch/${viewing.batch_id}/close`, {
        actual_end_date: closeDate,
        closing_quantity: closeQty ? Number(closeQty) : undefined,
        output_lines: cleanLines,
      });
      setCloseModalOpen(false);
      await refreshViewing();
      load();
    } catch (err: any) {
      setCloseError(err?.message || "Failed to close batch.");
    } finally {
      setActing(false);
    }
  };

  const openBioAction = (type: "mature" | "amortize" | "fair-value" | "dispose") => {
    setBioForm({
      posting_date: new Date().toISOString().slice(0, 10),
      residual_value_per_unit: "",
      productive_life_months: "",
      fair_value_per_unit: "",
      disposal_type: "HARVEST",
      quantity: "1",
      output_item_id: "",
      output_uom: "",
      output_quantity: "",
      warehouse_id: "",
      sale_proceeds: "",
    });
    setBioError("");
    setBioActionOpen(type);
  };

  const handleBioAction = async () => {
    if (!viewing || !bioActionOpen) return;
    setBioActing(true);
    setBioError("");
    try {
      let path = "";
      let payload: Row = {};
      if (bioActionOpen === "mature") {
        if (!bioForm.residual_value_per_unit) throw new Error("Residual value per unit is required.");
        path = `/batch/${viewing.batch_id}/mature`;
        payload = {
          residual_value_per_unit: Number(bioForm.residual_value_per_unit),
          productive_life_months: bioForm.productive_life_months ? Number(bioForm.productive_life_months) : undefined,
        };
      } else if (bioActionOpen === "amortize") {
        path = `/batch/${viewing.batch_id}/amortize`;
        payload = { posting_date: bioForm.posting_date };
      } else if (bioActionOpen === "fair-value") {
        if (!bioForm.fair_value_per_unit) throw new Error("Fair value per unit is required.");
        path = `/batch/${viewing.batch_id}/fair-value`;
        payload = { posting_date: bioForm.posting_date, fair_value_per_unit: Number(bioForm.fair_value_per_unit) };
      } else if (bioActionOpen === "dispose") {
        if (!bioForm.quantity) throw new Error("Quantity is required.");
        path = `/batch/${viewing.batch_id}/dispose`;
        payload = { disposal_type: bioForm.disposal_type, quantity: Number(bioForm.quantity), posting_date: bioForm.posting_date };
        if (bioForm.disposal_type === "HARVEST") {
          if (!bioForm.output_item_id || !bioForm.output_uom || !bioForm.output_quantity || !bioForm.warehouse_id) {
            throw new Error("Output item, UOM, quantity and warehouse are required for a harvest disposal.");
          }
          payload.output_item_id = bioForm.output_item_id;
          payload.output_uom = bioForm.output_uom;
          payload.output_quantity = Number(bioForm.output_quantity);
          payload.warehouse_id = bioForm.warehouse_id;
        } else {
          if (!bioForm.sale_proceeds) throw new Error("Sale proceeds are required for a sold disposal.");
          payload.sale_proceeds = Number(bioForm.sale_proceeds);
        }
      }
      await api.post(path, payload);
      setBioActionOpen(null);
      await refreshViewing();
      load();
    } catch (err: any) {
      setBioError(err?.message || "Action failed.");
    } finally {
      setBioActing(false);
    }
  };

  const itemLabel = (id: string) => {
    const it = items.find((i) => i.item_id === id);
    return it ? `${it.item_code} — ${it.item_name}` : "—";
  };
  const batchLabel = (id: string) => {
    const b = batches.find((x) => x.batch_id === id);
    return b ? b.batch_no : "—";
  };

  const openRecordQc = (line: Row) => {
    if (!viewing) return;
    setQcLine(line);
    setQcForm({
      qc_date: new Date().toISOString().slice(0, 10),
      total_qty_received: String(line.quantity ?? ""),
      pass_qty: "",
      fail_qty: "",
      hold_qty: "",
      grade_a_qty: "",
      grade_b_qty: "",
      grade_c_qty: "",
      disposition: "ACCEPT",
      qc_notes: "",
    });
    setQcResultValues({});
    setQcError("");
    setQcSubmitted(null);
    setQcModalOpen(true);
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("lobId", viewing.lob_id);
    params.set("limit", "200");
    api.get(`/qc-parameter?${params.toString()}`).then((r) => setQcParameters(unwrap<Row[]>(r) || [])).catch(() => setQcParameters([]));
  };

  const setQcResultField = (paramId: string, key: string, value: any) => {
    setQcResultValues((prev) => ({ ...prev, [paramId]: { ...prev[paramId], [key]: value } }));
  };

  const handleSaveQc = async () => {
    if (!viewing || !qcLine) return;
    setQcSaving(true);
    setQcError("");
    try {
      if (!qcForm.total_qty_received) throw new Error("Total quantity received is required.");
      const results = qcParameters
        .filter((p) => qcResultValues[p.param_id]?.actual_value !== undefined && qcResultValues[p.param_id]?.actual_value !== "")
        .map((p) => ({
          param_id: p.param_id,
          actual_value: String(qcResultValues[p.param_id].actual_value),
          grade_assigned: qcResultValues[p.param_id].grade_assigned || undefined,
          notes: qcResultValues[p.param_id].notes || undefined,
        }));
      if (results.length === 0) throw new Error("Record at least one parameter result.");
      const result = await api.post("/qc", {
        company_id: companyId,
        source_batch_id: viewing.batch_id,
        output_line_id: qcLine.line_id,
        qc_date: qcForm.qc_date,
        total_qty_received: Number(qcForm.total_qty_received),
        pass_qty: qcForm.pass_qty ? Number(qcForm.pass_qty) : undefined,
        fail_qty: qcForm.fail_qty ? Number(qcForm.fail_qty) : undefined,
        hold_qty: qcForm.hold_qty ? Number(qcForm.hold_qty) : undefined,
        grade_a_qty: qcForm.grade_a_qty ? Number(qcForm.grade_a_qty) : undefined,
        grade_b_qty: qcForm.grade_b_qty ? Number(qcForm.grade_b_qty) : undefined,
        grade_c_qty: qcForm.grade_c_qty ? Number(qcForm.grade_c_qty) : undefined,
        disposition: qcForm.disposition,
        qc_notes: qcForm.qc_notes || undefined,
        results,
      });
      setQcSubmitted(unwrap<Row>(result));
    } catch (err: any) {
      setQcError(err?.message || "Failed to record QC inspection.");
    } finally {
      setQcSaving(false);
    }
  };

  const openGeneratePack = (line: Row) => {
    if (!viewing) return;
    setPackLine(line);
    setPackForm({
      net_weight: String(line.quantity ?? ""),
      gross_weight: "",
      pack_uom: line.uom || "",
      warehouse_id: line.warehouse_id || "",
      lot_no: "",
      qc_id: "",
    });
    setGeneratedPack(null);
    setPackError("");
    setPackModalOpen(true);
    const params = new URLSearchParams();
    params.set("sourceBatchId", viewing.batch_id);
    params.set("outputLineId", line.line_id);
    params.set("limit", "50");
    api.get(`/qc?${params.toString()}`).then((r) => setPackQcRecords(unwrap<Row[]>(r) || [])).catch(() => setPackQcRecords([]));
  };

  const handleGeneratePack = async () => {
    if (!viewing || !packLine) return;
    setPackSaving(true);
    setPackError("");
    try {
      if (!packForm.net_weight || !packForm.pack_uom) throw new Error("Net weight and UOM are required.");
      const result = await api.post("/qr-code", {
        company_id: companyId,
        batch_id: viewing.batch_id,
        output_line_id: packLine.line_id,
        qc_id: packForm.qc_id || undefined,
        item_id: packLine.item_id,
        lot_no: packForm.lot_no || undefined,
        production_date: viewing.actual_end_date || new Date().toISOString().slice(0, 10),
        net_weight: Number(packForm.net_weight),
        gross_weight: packForm.gross_weight ? Number(packForm.gross_weight) : undefined,
        pack_uom: packForm.pack_uom,
        warehouse_id: packForm.warehouse_id || undefined,
      });
      setGeneratedPack(unwrap<Row>(result));
    } catch (err: any) {
      setPackError(err?.message || "Failed to generate pack.");
    } finally {
      setPackSaving(false);
    }
  };

  const generateAnotherPack = () => {
    setGeneratedPack(null);
    setPackForm((f: Row) => ({ ...f, lot_no: "" }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>Batches</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Batch lifecycle: input placement, daily consumption/mortality/output, and closing to finished inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border py-1.5 px-2 text-xs outline-none" style={S.input}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none" style={S.input} />
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: "var(--accent)" }}>
            <Plus className="h-3.5 w-3.5" /> New Batch
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                <th className="whitespace-nowrap px-4 py-3">Batch No.</th>
                <th className="whitespace-nowrap px-4 py-3">Start Date</th>
                <th className="whitespace-nowrap px-4 py-3">Method</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Opening Qty</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No batches yet.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.batch_id} className="border-b text-xs transition-colors hover:bg-(--surface-raised)" style={{ borderColor: "var(--border)" }}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold" style={S.primary}>{row.batch_no}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.primary}>{row.start_date}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{row.costing_method}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>{row.opening_quantity} {row.uom}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>{row.unit_cost ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={STATUS_STYLE[row.status] || STATUS_STYLE.DRAFT}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openView(row)} title="View" className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="New Batch"
        maxWidth="xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Nature of Business <span className="text-red-500">*</span></label>
              <select value={nobId} onChange={(e) => { setNobId(e.target.value); setHeader((h) => ({ ...h, lob_id: "" })); }} className={inputCls} style={S.input}>
                <option value="">Select…</option>
                {nobs.map((n) => <option key={n.nob_id} value={n.nob_id}>{n.nob_code} — {n.nob_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Line of Business <span className="text-red-500">*</span></label>
              <select value={header.lob_id} onChange={(e) => setHeader((h) => ({ ...h, lob_id: e.target.value }))} className={inputCls} style={S.input} disabled={!nobId}>
                <option value="">{nobId ? "Select…" : "Select Nature of Business first…"}</option>
                {lobs.map((l) => <option key={l.lob_id} value={l.lob_id}>{l.lob_code} — {l.lob_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Costing Method <span className="text-red-500">*</span></label>
              <select value={header.costing_method} onChange={(e) => setHeader((h) => ({ ...h, costing_method: e.target.value }))} className={inputCls} style={S.input}>
                <option value="STANDARD">Standard</option>
                <option value="FIFO">FIFO</option>
                <option value="BIO_ASSET">Bio-Asset (IAS41)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Breed</label>
              <select value={header.breed_id} onChange={(e) => setHeader((h) => ({ ...h, breed_id: e.target.value }))} className={inputCls} style={S.input}>
                <option value="">Select…</option>
                {breeds.map((b) => <option key={b.breed_id} value={b.breed_id}>{b.breed_code} — {b.breed_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Scheduler (KPI monitoring)</label>
              <select value={header.scheduler_id} onChange={(e) => setHeader((h) => ({ ...h, scheduler_id: e.target.value }))} className={inputCls} style={S.input} disabled={!header.lob_id}>
                <option value="">{header.lob_id ? "None" : "Select Line of Business first…"}</option>
                {schedulers.map((s) => <option key={s.scheduler_id} value={s.scheduler_id}>{s.scheduler_code} — {s.scheduler_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Shed</label>
              <select value={header.shed_id} onChange={(e) => setHeader((h) => ({ ...h, shed_id: e.target.value }))} className={inputCls} style={S.input}>
                <option value="">Select…</option>
                {sheds.map((s) => <option key={s.shed_id} value={s.shed_id}>{s.shed_code} — {s.shed_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Start Date <span className="text-red-500">*</span></label>
              <input type="date" value={header.start_date} onChange={(e) => setHeader((h) => ({ ...h, start_date: e.target.value }))} className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Expected End Date</label>
              <input type="date" value={header.expected_end_date} onChange={(e) => setHeader((h) => ({ ...h, expected_end_date: e.target.value }))} className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Opening Quantity <span className="text-red-500">*</span></label>
              <input type="number" value={header.opening_quantity} onChange={(e) => setHeader((h) => ({ ...h, opening_quantity: e.target.value }))} placeholder="5000" className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>UOM <span className="text-red-500">*</span></label>
              <select value={header.uom} onChange={(e) => setHeader((h) => ({ ...h, uom: e.target.value }))} className={inputCls} style={S.input}>
                <option value="">Select…</option>
                {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Remarks</label>
              <input value={header.remarks} onChange={(e) => setHeader((h) => ({ ...h, remarks: e.target.value }))} className={inputCls} style={S.input} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Input Lines</p>
            <button onClick={addInputLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
              <Plus className="h-3 w-3" /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border" style={S.surface}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Source Batch</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Qty</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>UOM</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Est. Rate</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {inputLines.map((line, idx) => (
                  <tr key={idx} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-2 py-1.5">
                      <select value={line.item_id} onChange={(e) => setInputLineField(idx, "item_id", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">Select…</option>
                        {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_code} — {it.item_name}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={line.source_batch_id} onChange={(e) => setInputLineField(idx, "source_batch_id", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">None</option>
                        {batches.filter((b) => b.status === "CLOSED").map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_no}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-24"><input type="number" value={line.quantity} onChange={(e) => setInputLineField(idx, "quantity", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5 w-24">
                      <select value={line.uom} onChange={(e) => setInputLineField(idx, "uom", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">Select…</option>
                        {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-24"><input type="number" value={line.rate} onChange={(e) => setInputLineField(idx, "rate", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeInputLine(idx)} type="button" className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px]" style={S.muted}>Rate is an estimate only — actual cost is drawn from inventory via FIFO when the batch is activated.</p>

          {header.costing_method === "STANDARD" && (
            <>
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Standard Cost Assumptions</p>
                <p className="mt-0.5 text-[11px]" style={S.muted}>Optional — set these to enable Price/Usage/Output/Overhead variance calculation when the batch closes.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Std Output Qty</label>
                  <input
                    type="number"
                    value={stdForm.std_output_quantity}
                    onChange={(e) => setStdForm((f: Row) => ({ ...f, std_output_quantity: e.target.value }))}
                    placeholder={header.breed_id ? "Auto from breed mortality" : "Defaults to opening qty"}
                    className={inputCls}
                    style={S.input}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Std Output Cost/Unit</label>
                  <input type="number" value={stdForm.std_output_cost_per_unit} onChange={(e) => setStdForm((f: Row) => ({ ...f, std_output_cost_per_unit: e.target.value }))} className={inputCls} style={S.input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Std Overhead Rate/Unit</label>
                  <input type="number" value={stdForm.std_overhead_rate_per_unit} onChange={(e) => setStdForm((f: Row) => ({ ...f, std_overhead_rate_per_unit: e.target.value }))} className={inputCls} style={S.input} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Consumption Standards</p>
                <button onClick={addStdConsumptionLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
                  <Plus className="h-3 w-3" /> Add Line
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border" style={S.surface}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Std Qty/Unit/Day</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Std Rate</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stdConsumptionLines.map((line, idx) => (
                      <tr key={idx} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="px-2 py-1.5">
                          <select value={line.item_id} onChange={(e) => setStdConsumptionLineField(idx, "item_id", e.target.value)} className={inputCls} style={S.input}>
                            <option value="">Select…</option>
                            {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_code} — {it.item_name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 w-32"><input type="number" value={line.std_qty_per_unit_per_day} onChange={(e) => setStdConsumptionLineField(idx, "std_qty_per_unit_per_day", e.target.value)} className={inputCls} style={S.input} /></td>
                        <td className="px-2 py-1.5 w-28">
                          <input
                            type="number"
                            value={line.std_rate}
                            onChange={(e) => setStdConsumptionLineField(idx, "std_rate", e.target.value)}
                            placeholder="Item default"
                            className={inputCls}
                            style={S.input}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => removeStdConsumptionLine(idx)} type="button" className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Detail / lifecycle modal */}
      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Batch ${viewing.batch_no}` : ""}
        maxWidth="xl"
        footer={<button onClick={() => setViewing(null)} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Close</button>}
      >
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Status</p><span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={STATUS_STYLE[viewing.status] || STATUS_STYLE.DRAFT}>{viewing.status}</span></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Method</p><p style={S.primary}>{viewing.costing_method}</p></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Opening Qty</p><p style={S.primary}>{viewing.opening_quantity} {viewing.uom}</p></div>
              {viewing.total_cost && <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Total Cost / Unit</p><p style={S.primary}>{viewing.total_cost} / {viewing.unit_cost}</p></div>}
              {viewing.scheduler && (
                <div>
                  <p className="font-semibold uppercase tracking-wider" style={S.muted}>Scheduler</p>
                  <p style={S.primary}>{viewing.scheduler.scheduler_code}{(viewing.alerts || []).length > 0 ? ` — ${viewing.alerts.length} alert(s)` : ""}</p>
                </div>
              )}
            </div>

            {viewing.status === "DRAFT" && (
              <button onClick={handleActivate} disabled={acting} className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 self-start" style={{ backgroundColor: "var(--accent)" }}>
                <PlayCircle className="h-4 w-4" /> {acting ? "Activating…" : "Activate Batch"}
              </button>
            )}

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Input Lines</p>
              <div className="overflow-x-auto rounded-xl border" style={S.surface}>
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Source Batch</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Qty</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Rate</th>
                  </tr></thead>
                  <tbody>
                    {(viewing.input_lines || []).map((l: Row) => (
                      <tr key={l.line_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="px-3 py-2" style={S.primary}>{itemLabel(l.item_id)}</td>
                        <td className="px-3 py-2" style={S.sub}>{l.source_batch_id ? batchLabel(l.source_batch_id) : "—"}</td>
                        <td className="px-3 py-2" style={S.primary}>{l.quantity} {l.uom}</td>
                        <td className="px-3 py-2" style={S.primary}>{l.rate ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {viewing.costing_method === "BIO_ASSET" && viewing.bio_asset_state && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Bio-Asset State</p>
                <div className="rounded-xl border p-3" style={S.surface}>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <p className="font-semibold uppercase tracking-wider" style={S.muted}>Stage</p>
                      <span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={viewing.bio_asset_state.stage === "MATURE" ? { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" } : { color: "var(--accent)", borderColor: "var(--accent)", backgroundColor: "var(--accent-muted)" }}>
                        {viewing.bio_asset_state.stage}
                      </span>
                    </div>
                    <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Current Qty</p><p style={S.primary}>{viewing.bio_asset_state.current_quantity}</p></div>
                    <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>NCA Book Value</p><p style={S.primary}>{viewing.bio_asset_state.nca_book_value}</p></div>
                    <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Monthly Amort. Rate</p><p style={S.primary}>{viewing.bio_asset_state.monthly_amortization_rate ?? "—"}</p></div>
                  </div>
                  {viewing.status === "ACTIVE" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {viewing.bio_asset_state.stage === "PREMATURE" && (
                        <button onClick={() => openBioAction("mature")} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Mature Herd</button>
                      )}
                      {viewing.bio_asset_state.stage === "MATURE" && (
                        <>
                          <button onClick={() => openBioAction("amortize")} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={S.surface}>Run Amortization</button>
                          <button onClick={() => openBioAction("fair-value")} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={S.surface}>Record Fair Value</button>
                        </>
                      )}
                      {Number(viewing.bio_asset_state.current_quantity) > 0 && (
                        <button onClick={() => openBioAction("dispose")} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "var(--success)" }}>Dispose</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewing.status === "ACTIVE" && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Add Transaction</p>
                <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-3" style={S.surface}>
                  <select value={txForm.transaction_type} onChange={(e) => setTxForm((f: Row) => ({ ...f, transaction_type: e.target.value }))} className={inputCls} style={S.input}>
                    {["CONSUMPTION", "MORTALITY", "OUTPUT", "OVERHEAD", "OBSERVATION"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="date" value={txForm.transaction_date} onChange={(e) => setTxForm((f: Row) => ({ ...f, transaction_date: e.target.value }))} className={inputCls} style={S.input} />
                  {["CONSUMPTION", "OUTPUT"].includes(txForm.transaction_type) && (
                    <select value={txForm.item_id} onChange={(e) => setTxForm((f: Row) => ({ ...f, item_id: e.target.value }))} className={inputCls} style={S.input}>
                      <option value="">Item…</option>
                      {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_code}</option>)}
                    </select>
                  )}
                  {txForm.transaction_type === "OVERHEAD" && (
                    <select value={txForm.resource_id} onChange={(e) => setTxForm((f: Row) => ({ ...f, resource_id: e.target.value }))} className={inputCls} style={S.input}>
                      <option value="">Resource…</option>
                      {resources.map((r) => <option key={r.resource_id} value={r.resource_id}>{r.resource_code}</option>)}
                    </select>
                  )}
                  {["CONSUMPTION", "MORTALITY", "OUTPUT", "OVERHEAD"].includes(txForm.transaction_type) && (
                    <input type="number" placeholder="Qty" value={txForm.quantity} onChange={(e) => setTxForm((f: Row) => ({ ...f, quantity: e.target.value }))} className={inputCls} style={S.input} />
                  )}
                  {["CONSUMPTION", "OUTPUT"].includes(txForm.transaction_type) && (
                    <select value={txForm.uom} onChange={(e) => setTxForm((f: Row) => ({ ...f, uom: e.target.value }))} className={inputCls} style={S.input}>
                      <option value="">UOM…</option>
                      {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
                    </select>
                  )}
                  {["OUTPUT", "OVERHEAD"].includes(txForm.transaction_type) && (
                    <input type="number" placeholder="Rate" value={txForm.rate} onChange={(e) => setTxForm((f: Row) => ({ ...f, rate: e.target.value }))} className={inputCls} style={S.input} />
                  )}
                  <input placeholder="Remarks" value={txForm.remarks} onChange={(e) => setTxForm((f: Row) => ({ ...f, remarks: e.target.value }))} className={inputCls + " sm:col-span-3"} style={S.input} />
                  <button onClick={handleAddTransaction} disabled={acting} className="rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-3" style={{ backgroundColor: "var(--accent)" }}>
                    {acting ? "Saving…" : "Add Transaction"}
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Transaction Log</p>
              <div className="overflow-x-auto rounded-xl border" style={S.surface}>
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Date</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Type</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Qty</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {(viewing.transactions || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-6 text-center" style={S.sub}>No transactions yet.</td></tr>
                    ) : (viewing.transactions || []).map((t: Row) => (
                      <tr key={t.transaction_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="px-3 py-2" style={S.primary}>{t.transaction_date}</td>
                        <td className="px-3 py-2" style={S.sub}>{t.transaction_type}</td>
                        <td className="px-3 py-2" style={S.primary}>{t.item_id ? itemLabel(t.item_id) : "—"}</td>
                        <td className="px-3 py-2" style={S.primary}>{t.quantity ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold" style={Number(t.amount) >= 0 ? { color: "var(--success)" } : { color: "var(--danger)" }}>{t.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {viewing.costing_method === "BIO_ASSET" && (viewing.bio_asset_entries || []).length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Bio-Asset Ledger</p>
                <div className="overflow-x-auto rounded-xl border" style={S.surface}>
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Date</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Entry Type</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Stage</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Qty</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Cost Amount</th>
                    </tr></thead>
                    <tbody>
                      {(viewing.bio_asset_entries || []).map((e: Row) => (
                        <tr key={e.entry_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                          <td className="px-3 py-2" style={S.primary}>{e.posting_date}</td>
                          <td className="px-3 py-2" style={S.sub}>{e.entry_type}</td>
                          <td className="px-3 py-2" style={S.primary}>{itemLabel(e.bio_asset_item_id)}</td>
                          <td className="px-3 py-2" style={S.sub}>{e.stage ?? "—"}</td>
                          <td className="px-3 py-2" style={S.primary}>{e.quantity ?? "—"}</td>
                          <td className="px-3 py-2 font-semibold" style={Number(e.cost_amount) >= 0 ? { color: "var(--success)" } : { color: "var(--danger)" }}>{e.cost_amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewing.status === "ACTIVE" && viewing.costing_method !== "BIO_ASSET" && (
              <button onClick={openClose} className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white self-start" style={{ backgroundColor: "var(--success)" }}>
                <CheckCircle2 className="h-4 w-4" /> Close Batch
              </button>
            )}

            {viewing.status === "CLOSED" && (viewing.output_lines || []).length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Output Lines</p>
                <div className="overflow-x-auto rounded-xl border" style={S.surface}>
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Type</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Split %</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Qty</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Cost / Unit Cost</th>
                      <th className="px-3 py-2 font-semibold text-right" style={S.sub}>QC / Pack</th>
                    </tr></thead>
                    <tbody>
                      {(viewing.output_lines || []).map((l: Row) => (
                        <tr key={l.line_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                          <td className="px-3 py-2" style={S.primary}>{itemLabel(l.item_id)}</td>
                          <td className="px-3 py-2" style={S.sub}>{l.output_type}</td>
                          <td className="px-3 py-2" style={S.primary}>{l.cost_split_pct}%</td>
                          <td className="px-3 py-2" style={S.primary}>{l.quantity} {l.uom}</td>
                          <td className="px-3 py-2" style={S.primary}>{l.computed_cost} / {l.unit_cost}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openRecordQc(l)} title="Record QC" className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                                <ClipboardCheck className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => openGeneratePack(l)} title="Generate Pack" className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                                <QrCodeIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewing.status === "CLOSED" && (viewing.variances || []).length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Cost Variance</p>
                <div className="overflow-x-auto rounded-xl border" style={S.surface}>
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Type</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Std Value</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Actual Value</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}>Variance</th>
                      <th className="px-3 py-2 font-semibold" style={S.sub}></th>
                    </tr></thead>
                    <tbody>
                      {(viewing.variances || []).map((v: Row) => (
                        <tr key={v.variance_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                          <td className="px-3 py-2" style={S.primary}>{v.variance_type}</td>
                          <td className="px-3 py-2" style={S.sub}>{v.item_id ? itemLabel(v.item_id) : "—"}</td>
                          <td className="px-3 py-2" style={S.primary}>{Number(v.std_value).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                          <td className="px-3 py-2" style={S.primary}>{Number(v.actual_value).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                          <td className="px-3 py-2 font-semibold" style={v.is_favorable ? { color: "var(--success)" } : { color: "var(--danger)" }}>{v.variance_amount}</td>
                          <td className="px-3 py-2">
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={v.is_favorable ? { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" } : { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--surface-raised)" }}>
                              {v.is_favorable ? "FAV" : "UNFAV"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Close batch modal */}
      <Dialog
        open={closeModalOpen}
        onClose={() => !acting && setCloseModalOpen(false)}
        title={`Close Batch ${viewing?.batch_no || ""}`}
        maxWidth="xl"
        footer={
          <>
            <button onClick={() => setCloseModalOpen(false)} disabled={acting} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
            <button onClick={handleClose} disabled={acting} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--success)" }}>
              {acting ? "Closing…" : "Close Batch"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {closeError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {closeError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Actual End Date</label>
              <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Closing (Surviving) Quantity</label>
              <input type="number" value={closeQty} onChange={(e) => setCloseQty(e.target.value)} className={inputCls} style={S.input} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Output Lines — split % must sum to 100</p>
            <button onClick={addOutputLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
              <Plus className="h-3 w-3" /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border" style={S.surface}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Item</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Type</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Split %</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Qty</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>UOM</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Warehouse</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {outputLines.map((line, idx) => (
                  <tr key={idx} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-2 py-1.5">
                      <select value={line.item_id} onChange={(e) => setOutputLineField(idx, "item_id", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">Select…</option>
                        {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_code}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-24">
                      <select value={line.output_type} onChange={(e) => setOutputLineField(idx, "output_type", e.target.value)} className={inputCls} style={S.input}>
                        <option value="MAIN">Main</option>
                        <option value="BY_PRODUCT">By-Product</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-20"><input type="number" value={line.cost_split_pct} onChange={(e) => setOutputLineField(idx, "cost_split_pct", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5 w-20"><input type="number" value={line.quantity} onChange={(e) => setOutputLineField(idx, "quantity", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5 w-24">
                      <select value={line.uom} onChange={(e) => setOutputLineField(idx, "uom", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">Select…</option>
                        {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={line.warehouse_id} onChange={(e) => setOutputLineField(idx, "warehouse_id", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">Select…</option>
                        {warehouses.map((w) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_code}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeOutputLine(idx)} type="button" className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold" style={{ borderColor: "var(--border)" }}>
                  <td colSpan={2} className="px-3 py-2" style={S.sub}>Split Total</td>
                  <td className="px-3 py-2" style={{ color: Math.abs(splitTotal - 100) < 0.01 ? "var(--success)" : "var(--danger)" }}>{splitTotal.toFixed(2)}%</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Dialog>

      {/* Bio-asset lifecycle action modal (mature / amortize / fair-value / dispose) */}
      <Dialog
        open={!!bioActionOpen}
        onClose={() => !bioActing && setBioActionOpen(null)}
        title={
          bioActionOpen === "mature" ? "Mature Herd"
            : bioActionOpen === "amortize" ? "Run Amortization"
            : bioActionOpen === "fair-value" ? "Record Fair Value"
            : "Dispose"
        }
        footer={
          <>
            <button onClick={() => setBioActionOpen(null)} disabled={bioActing} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
            <button onClick={handleBioAction} disabled={bioActing} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
              {bioActing ? "Saving…" : "Confirm"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {bioError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {bioError}
            </div>
          )}

          {bioActionOpen === "mature" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Residual Value / Unit <span className="text-red-500">*</span></label>
                <input type="number" value={bioForm.residual_value_per_unit} onChange={(e) => setBioForm((f: Row) => ({ ...f, residual_value_per_unit: e.target.value }))} className={inputCls} style={S.input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Productive Life (Months)</label>
                <input type="number" value={bioForm.productive_life_months} onChange={(e) => setBioForm((f: Row) => ({ ...f, productive_life_months: e.target.value }))} placeholder="From breed if left blank" className={inputCls} style={S.input} />
              </div>
            </div>
          )}

          {bioActionOpen === "amortize" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Posting Date</label>
              <input type="date" value={bioForm.posting_date} onChange={(e) => setBioForm((f: Row) => ({ ...f, posting_date: e.target.value }))} className={inputCls} style={S.input} />
              <p className="text-[11px]" style={S.muted}>One amortization run per calendar month.</p>
            </div>
          )}

          {bioActionOpen === "fair-value" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Posting Date</label>
                <input type="date" value={bioForm.posting_date} onChange={(e) => setBioForm((f: Row) => ({ ...f, posting_date: e.target.value }))} className={inputCls} style={S.input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>New Fair Value / Unit <span className="text-red-500">*</span></label>
                <input type="number" value={bioForm.fair_value_per_unit} onChange={(e) => setBioForm((f: Row) => ({ ...f, fair_value_per_unit: e.target.value }))} className={inputCls} style={S.input} />
              </div>
            </div>
          )}

          {bioActionOpen === "dispose" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Disposal Type</label>
                  <select value={bioForm.disposal_type} onChange={(e) => setBioForm((f: Row) => ({ ...f, disposal_type: e.target.value }))} className={inputCls} style={S.input}>
                    <option value="HARVEST">Harvest</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Quantity</label>
                  <input type="number" value={bioForm.quantity} onChange={(e) => setBioForm((f: Row) => ({ ...f, quantity: e.target.value }))} className={inputCls} style={S.input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Posting Date</label>
                  <input type="date" value={bioForm.posting_date} onChange={(e) => setBioForm((f: Row) => ({ ...f, posting_date: e.target.value }))} className={inputCls} style={S.input} />
                </div>
              </div>

              {bioForm.disposal_type === "HARVEST" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Output Item</label>
                    <select value={bioForm.output_item_id} onChange={(e) => setBioForm((f: Row) => ({ ...f, output_item_id: e.target.value }))} className={inputCls} style={S.input}>
                      <option value="">Select…</option>
                      {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_code} — {it.item_name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Output UOM</label>
                    <select value={bioForm.output_uom} onChange={(e) => setBioForm((f: Row) => ({ ...f, output_uom: e.target.value }))} className={inputCls} style={S.input}>
                      <option value="">Select…</option>
                      {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Output Quantity</label>
                    <input type="number" value={bioForm.output_quantity} onChange={(e) => setBioForm((f: Row) => ({ ...f, output_quantity: e.target.value }))} className={inputCls} style={S.input} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Warehouse</label>
                    <select value={bioForm.warehouse_id} onChange={(e) => setBioForm((f: Row) => ({ ...f, warehouse_id: e.target.value }))} className={inputCls} style={S.input}>
                      <option value="">Select…</option>
                      {warehouses.map((w) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_code}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Sale Proceeds</label>
                  <input type="number" value={bioForm.sale_proceeds} onChange={(e) => setBioForm((f: Row) => ({ ...f, sale_proceeds: e.target.value }))} className={inputCls} style={S.input} />
                  <p className="text-[11px]" style={S.muted}>Gain/loss vs. the disposed animals' book value posts automatically. Cash/receivable isn't recorded here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* Record QC modal */}
      <Dialog
        open={qcModalOpen}
        onClose={() => !qcSaving && setQcModalOpen(false)}
        title={qcLine ? `Record QC — ${itemLabel(qcLine.item_id)}` : "Record QC"}
        maxWidth="lg"
        footer={
          qcSubmitted ? (
            <button onClick={() => { setQcModalOpen(false); refreshViewing(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Done</button>
          ) : (
            <>
              <button onClick={() => setQcModalOpen(false)} disabled={qcSaving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
              <button onClick={handleSaveQc} disabled={qcSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
                {qcSaving ? "Saving…" : "Submit Inspection"}
              </button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {qcError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {qcError}
            </div>
          )}

          {qcSubmitted ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <span
                className="rounded-full border px-4 py-1.5 text-sm font-bold"
                style={qcSubmitted.overall_result === "PASS"
                  ? { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" }
                  : { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--surface-raised)" }}
              >
                Overall Result: {qcSubmitted.overall_result}
              </span>
              <p className="text-xs" style={S.sub}>Disposition: {qcSubmitted.disposition}</p>
              <div className="w-full overflow-x-auto rounded-xl border" style={S.surface}>
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Parameter</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Value</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Result</th>
                  </tr></thead>
                  <tbody>
                    {(qcSubmitted.results || []).map((r: Row) => {
                      const param = qcParameters.find((p) => p.param_id === r.param_id);
                      return (
                        <tr key={r.result_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                          <td className="px-3 py-2" style={S.primary}>{param?.param_name || r.param_id}</td>
                          <td className="px-3 py-2" style={S.sub}>{r.actual_value}{r.grade_assigned ? ` (${r.grade_assigned})` : ""}</td>
                          <td className="px-3 py-2 font-semibold" style={r.result_status === "PASS" ? { color: "var(--success)" } : { color: "var(--danger)" }}>{r.result_status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>QC Date</label>
                  <input type="date" value={qcForm.qc_date} onChange={(e) => setQcForm((f: Row) => ({ ...f, qc_date: e.target.value }))} className={inputCls} style={S.input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Total Qty Received</label>
                  <input type="number" value={qcForm.total_qty_received} onChange={(e) => setQcForm((f: Row) => ({ ...f, total_qty_received: e.target.value }))} className={inputCls} style={S.input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Disposition</label>
                  <select value={qcForm.disposition} onChange={(e) => setQcForm((f: Row) => ({ ...f, disposition: e.target.value }))} className={inputCls} style={S.input}>
                    {["ACCEPT", "REJECT", "REWORK", "QUARANTINE", "CONDITIONAL_ACCEPT"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Pass Qty</label>
                  <input type="number" value={qcForm.pass_qty} onChange={(e) => setQcForm((f: Row) => ({ ...f, pass_qty: e.target.value }))} className={inputCls} style={S.input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Fail Qty</label>
                  <input type="number" value={qcForm.fail_qty} onChange={(e) => setQcForm((f: Row) => ({ ...f, fail_qty: e.target.value }))} className={inputCls} style={S.input} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Hold Qty</label>
                  <input type="number" value={qcForm.hold_qty} onChange={(e) => setQcForm((f: Row) => ({ ...f, hold_qty: e.target.value }))} className={inputCls} style={S.input} />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Parameter Results</p>
                {qcParameters.length === 0 ? (
                  <p className="rounded-xl border p-3 text-xs" style={{ ...S.surface, ...S.sub }}>No QC parameters defined for this Line of Business yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {qcParameters.map((p) => (
                      <div key={p.param_id} className="grid grid-cols-3 items-center gap-2 rounded-xl border p-2.5" style={S.surface}>
                        <div>
                          <p className="text-xs font-semibold" style={S.primary}>{p.param_name}{p.is_mandatory && <span className="text-red-500"> *</span>}</p>
                          <p className="text-[10px]" style={S.muted}>{p.param_type === "NUMERIC" ? `${p.min_value ?? "—"}–${p.max_value ?? "—"} ${p.uom || ""}` : p.param_type}</p>
                        </div>
                        <div className="col-span-2">
                          {p.param_type === "NUMERIC" && (
                            <input type="number" placeholder="Actual value" value={qcResultValues[p.param_id]?.actual_value ?? ""} onChange={(e) => setQcResultField(p.param_id, "actual_value", e.target.value)} className={inputCls} style={S.input} />
                          )}
                          {p.param_type === "BOOLEAN" && (
                            <select value={qcResultValues[p.param_id]?.actual_value ?? ""} onChange={(e) => setQcResultField(p.param_id, "actual_value", e.target.value)} className={inputCls} style={S.input}>
                              <option value="">Select…</option>
                              <option value="true">Pass (true)</option>
                              <option value="false">Fail (false)</option>
                            </select>
                          )}
                          {p.param_type === "GRADE" && (
                            <select
                              value={qcResultValues[p.param_id]?.actual_value ?? ""}
                              onChange={(e) => { setQcResultField(p.param_id, "actual_value", e.target.value); setQcResultField(p.param_id, "grade_assigned", e.target.value); }}
                              className={inputCls}
                              style={S.input}
                            >
                              <option value="">Select grade…</option>
                              {Object.keys(p.grade_scale || {}).map((g) => <option key={g} value={g}>{g} — {p.grade_scale[g]}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Notes</label>
                <input value={qcForm.qc_notes} onChange={(e) => setQcForm((f: Row) => ({ ...f, qc_notes: e.target.value }))} className={inputCls} style={S.input} />
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Generate Pack modal */}
      <Dialog
        open={packModalOpen}
        onClose={() => !packSaving && setPackModalOpen(false)}
        title={packLine ? `Generate Pack — ${itemLabel(packLine.item_id)}` : "Generate Pack"}
        footer={
          generatedPack ? (
            <>
              <button onClick={generateAnotherPack} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Generate Another Pack</button>
              <button onClick={() => setPackModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Done</button>
            </>
          ) : (
            <>
              <button onClick={() => setPackModalOpen(false)} disabled={packSaving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
              <button onClick={handleGeneratePack} disabled={packSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
                {packSaving ? "Generating…" : "Generate Pack"}
              </button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {packError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {packError}
            </div>
          )}

          {generatedPack ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm font-bold" style={S.primary}>{generatedPack.pack_no}</p>
              <div className="rounded-xl bg-white p-4">
                <QRCode value={JSON.stringify(generatedPack.qr_data)} size={200} />
              </div>
              <p className="text-xs" style={S.sub}>{generatedPack.net_weight} {generatedPack.pack_uom} — {generatedPack.production_date}{generatedPack.expiry_date ? ` → ${generatedPack.expiry_date}` : ""}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Net Weight <span className="text-red-500">*</span></label>
                <input type="number" value={packForm.net_weight} onChange={(e) => setPackForm((f: Row) => ({ ...f, net_weight: e.target.value }))} className={inputCls} style={S.input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Gross Weight</label>
                <input type="number" value={packForm.gross_weight} onChange={(e) => setPackForm((f: Row) => ({ ...f, gross_weight: e.target.value }))} className={inputCls} style={S.input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Pack UOM <span className="text-red-500">*</span></label>
                <select value={packForm.pack_uom} onChange={(e) => setPackForm((f: Row) => ({ ...f, pack_uom: e.target.value }))} className={inputCls} style={S.input}>
                  <option value="">Select…</option>
                  {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Lot No.</label>
                <input value={packForm.lot_no} onChange={(e) => setPackForm((f: Row) => ({ ...f, lot_no: e.target.value }))} className={inputCls} style={S.input} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Warehouse / Facility</label>
                <select value={packForm.warehouse_id} onChange={(e) => setPackForm((f: Row) => ({ ...f, warehouse_id: e.target.value }))} className={inputCls} style={S.input}>
                  <option value="">Select…</option>
                  {warehouses.map((w) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_code}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Link QC Record (optional)</label>
                <select value={packForm.qc_id} onChange={(e) => setPackForm((f: Row) => ({ ...f, qc_id: e.target.value }))} className={inputCls} style={S.input}>
                  <option value="">None</option>
                  {packQcRecords.map((q) => <option key={q.qc_id} value={q.qc_id}>{q.qc_date} — {q.overall_result}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
