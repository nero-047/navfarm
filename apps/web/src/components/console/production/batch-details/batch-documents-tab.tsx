"use client";

import React, { useState } from "react";
import { Plus, Edit2, Check, X, FileText, Image as ImageIcon, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchDocumentsTabProps {
  batch?: any;
  onRefreshBatch?: () => Promise<void>;
}

export function BatchDocumentsTab({ batch }: BatchDocumentsTabProps) {
  const [stageNotes, setStageNotes] = useState(
    "Sows in good condition. Feed and health parameters within normal range. Pregnancy scan checkpoint scheduled for Day 45. Two mortalities noted — attending vet informed."
  );
  const [editingNotes, setEditingNotes] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Upload modal state
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [fileSize, setFileSize] = useState("1.5 MB");
  const [uploader, setUploader] = useState("Dr. Rajesh (Farm Veterinarian)");

  const [files, setFiles] = useState([
    {
      id: "doc-1",
      name: "Pigs_Barn_Inspection_Jul26.jpg",
      type: "Image",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      size: "2.1 MB",
      uploaded_by: "Farm Operations Manager",
      icon: "🖼",
    },
    {
      id: "doc-2",
      name: "Feed_Quality_Cert_Batch26.pdf",
      type: "PDF",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      size: "1.2 MB",
      uploaded_by: "Nutrition Lab Attendant",
      icon: "📄",
    },
    {
      id: "doc-3",
      name: "Veterinary_Health_Assessment.pdf",
      type: "PDF",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      size: "0.8 MB",
      uploaded_by: "Dr. Rajesh (Veterinarian)",
      icon: "📄",
    },
  ]);

  const handleAddFile = () => {
    if (!fileName) {
      alert("Please enter a file name.");
      return;
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: fileName.includes(".") ? fileName : `${fileName}.${fileType.toLowerCase()}`,
      type: fileType,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      size: fileSize,
      uploaded_by: uploader,
      icon: fileType === "Image" ? "🖼" : "📄",
    };

    setFiles((prev) => [newDoc, ...prev]);
    setNotification(`✓ Attached ${newDoc.name} to batch documents!`);
    setUploadModalOpen(false);
    setFileName("");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (!confirm(`Delete attachment ${name}?`)) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setNotification(`✓ Removed attachment ${name}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveNotes = () => {
    setEditingNotes(false);
    setNotification("✓ Stage operational notes updated successfully!");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 p-3.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 shadow-md">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Documents View ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Documents & Audit Attachments
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Attached to batch {batch?.batch_no || "current"} · Stored in encrypted cloud storage
                </p>
              </div>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="bg-[#1A3A5C] text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Upload file
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-3.5 py-3">Type</th>
                    <th className="px-3.5 py-3">Date</th>
                    <th className="px-3 py-3">Size</th>
                    <th className="px-3.5 py-3">Uploaded By</th>
                    <th className="px-3.5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {files.map((f) => (
                    <tr key={f.id} className="hover:bg-[var(--surface-raised)]/30 transition">
                      <td className="px-4 py-3 font-bold text-[#1A3A5C] dark:text-blue-300 flex items-center gap-2">
                        <span className="text-base">{f.icon}</span>
                        <span>{f.name}</span>
                      </td>
                      <td className="px-3.5 py-3 text-[var(--text-secondary)] font-medium">{f.type}</td>
                      <td className="px-3.5 py-3 text-[var(--text-secondary)]">{f.date}</td>
                      <td className="px-3 py-3 text-[var(--text-muted)] font-mono">{f.size}</td>
                      <td className="px-3.5 py-3 text-[var(--text-secondary)]">{f.uploaded_by}</td>
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(f)}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(f.id, f.name)}
                            className="text-rose-600 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
              <span>{files.length} document attachments</span>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar: Stage Notes ── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Stage Operational Notes
              </h3>
              {editingNotes ? (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingNotes(true)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {editingNotes ? (
              <textarea
                rows={6}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                className="w-full p-2.5 text-xs text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl resize-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            ) : (
              <div className="p-3 rounded-xl bg-[var(--surface-raised)]/40 border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                {stageNotes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Upload Document Modal ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Upload Document</h3>
                <p className="text-xs text-[var(--text-secondary)]">Attach a veterinary report, test certificate, or barn photo</p>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">
                  Document Title / File Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Feed_Lab_Test_Jul26.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">
                    Document Category
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  >
                    <option value="PDF">PDF Report / Certificate</option>
                    <option value="Image">Barn Image / Photo</option>
                    <option value="Spreadsheet">Excel / Spreadsheet</option>
                    <option value="Invoice">Receipt / Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">
                    File Size
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">
                  Uploaded By
                </label>
                <input
                  type="text"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handleAddFile} className="bg-[#1A3A5C] text-white text-xs h-8 font-black gap-1.5">
                Upload & Attach
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{previewDoc.icon}</span>
                <h3 className="text-sm font-black text-[var(--text-primary)]">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                {previewDoc.type === "Image" ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-[var(--text-primary)] text-sm">{previewDoc.name}</p>
                <p className="text-[var(--text-muted)] font-mono">{previewDoc.size} · Uploaded on {previewDoc.date}</p>
                <p className="text-[var(--text-secondary)]">By {previewDoc.uploaded_by}</p>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">NavFarm Batch Document Vault</span>
              <Button onClick={() => setPreviewDoc(null)} className="bg-[#1A3A5C] text-white text-xs h-8">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
