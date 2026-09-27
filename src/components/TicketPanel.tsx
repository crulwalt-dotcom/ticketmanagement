"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ticket, TicketType, User } from "@/lib/types";
import { PRIORITIES, TYPES } from "@/lib/types";

interface Props {
  ticket: Ticket | null;
  users: User[];
  onSave: (payload: Partial<Ticket> & { title: string }) => Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
}

export default function TicketPanel({
  ticket,
  users,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [title, setTitle] = useState(ticket?.title || "");
  const [description, setDescription] = useState(ticket?.description || "");
  const [type, setType] = useState<TicketType>(ticket?.type || "Task");
  const [priority, setPriority] = useState(ticket?.priority || "Medium");
  const [status, setStatus] = useState(ticket?.status || "New");
  const [assignedTo, setAssignedTo] = useState<string>(ticket?.assignedTo || "");
  const [images, setImages] = useState<string[]>(ticket?.images || []);
  const [uploading, setUploading] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data?.error || "Upload failed");
        return;
      }
      setImages((prev) => [...prev, data.url]);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const named = new File([file], `paste-${Date.now()}.png`, {
              type: file.type,
            });
            uploadImage(named);
          }
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadImage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        status,
        assignedTo: assignedTo || null,
        images,
      });
    } catch {
      setError("Could not save ticket");
    } finally {
      setSaving(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPasteHint(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[#201f1e]/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-[720px] animate-slide-in flex-col border-l border-[#edebe9] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#edebe9] bg-[#faf9f8] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0078d4]">
              Work item
            </p>
            <h2 className="mt-0.5 text-xl font-semibold text-[#242424]">
              {ticket ? "Edit ticket" : "New ticket"}
            </h2>
            {ticket && (
              <p className="mt-1 text-xs text-[#605e5c]">
                {ticket.type} · {ticket.status} · Updated{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-lg text-[#605e5c] hover:bg-[#f3f2f1]"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#323130]">
                Title
              </label>
              <input
                className="w-full rounded border border-[#8a8886] px-3 py-2.5 text-[15px] outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Type">
                <select
                  className="field-input"
                  value={type}
                  onChange={(e) => setType(e.target.value as TicketType)}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  className="field-input"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as Ticket["priority"])
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="State">
                <select
                  className="field-input"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Ticket["status"])
                  }
                >
                  {["New", "Active", "Resolved", "Closed"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Assigned to">
              <select
                className="field-input"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                className="field-input min-h-[140px] resize-y"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Repro steps, acceptance criteria, notes…"
              />
            </Field>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-[#323130]">
                  Attachments
                </label>
                <span className="text-[11px] text-[#605e5c]">
                  Ctrl+V to paste a screenshot
                </span>
              </div>
              <div
                ref={dropRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  setPasteHint(true);
                }}
                onDragLeave={() => setPasteHint(false)}
                onDrop={onDrop}
                className={`rounded border-2 border-dashed p-4 transition ${
                  pasteHint
                    ? "border-[#0078d4] bg-[#deecf9]"
                    : "border-[#c8c6c4] bg-[#faf9f8]"
                }`}
              >
                <div className="mb-3 flex flex-wrap gap-3">
                  {images.map((url) => (
                    <div key={url} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="attachment"
                        className="h-24 w-24 rounded border border-[#edebe9] object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((u) => u !== url))
                        }
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#a4262c] text-xs text-white opacity-90 shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="rounded bg-white px-3 py-1.5 text-sm font-medium text-[#0078d4] ring-1 ring-[#8a8886] hover:bg-[#f3f2f1] disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "Browse files"}
                  </button>
                  <p className="text-xs text-[#605e5c]">
                    Drop images here, or copy a screenshot and paste (Ctrl+V /
                    ⌘V)
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="rounded border border-[#f1aeb5] bg-[#fde7e9] px-3 py-2 text-sm text-[#a4262c]">
                {error}
              </p>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-[#edebe9] bg-[#faf9f8] px-6 py-3">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-medium text-[#a4262c] hover:underline"
              >
                Delete work item
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-[#8a8886] bg-white px-4 py-2 text-sm font-medium text-[#323130] hover:bg-[#f3f2f1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-[#0078d4] px-5 py-2 text-sm font-semibold text-white hover:bg-[#106ebe] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#323130]">
        {label}
      </label>
      {children}
    </div>
  );
}
