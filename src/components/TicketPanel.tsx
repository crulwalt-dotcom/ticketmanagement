"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ticket, TicketType, User } from "@/lib/types";
import { PRIORITIES, TYPES } from "@/lib/types";
import RichDescription from "./RichDescription";
import ImageLightbox from "./ImageLightbox";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadAndGetUrl = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) return null;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data?.error || "Upload failed");
        return null;
      }
      return data.url as string;
    } catch {
      setError("Upload failed");
      return null;
    }
  }, []);

  const addAttachment = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");
      const url = await uploadAndGetUrl(file);
      if (url) setImages((prev) => [...prev, url]);
      setUploading(false);
    },
    [uploadAndGetUrl]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewUrl) {
          setPreviewUrl(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description,
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

  const onDropAttach = (e: React.DragEvent) => {
    e.preventDefault();
    setPasteHint(false);
    const file = e.dataTransfer.files?.[0];
    if (file) addAttachment(file);
  };

  const previewIndex = previewUrl ? images.indexOf(previewUrl) : -1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 backdrop-blur-[1px]"
        style={{ background: "var(--overlay)" }}
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-[720px] animate-slide-in flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-2)] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              Work item
            </p>
            <h2 className="mt-0.5 text-xl font-semibold text-[var(--text)]">
              {ticket ? "Edit ticket" : "New ticket"}
            </h2>
            {ticket && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {ticket.type} · {ticket.status} · Updated{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-lg text-[var(--text-muted)] hover:bg-[var(--bg)]"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
                Title
              </label>
              <input
                className="field-input py-2.5 text-[15px]"
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

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
                Description
              </label>
              <p className="mb-2 text-[11px] text-[var(--text-muted)]">
                Write text, add checklist, and paste screenshots right under the
                line — like Azure. Separate files go in Attachments below.
              </p>
              <RichDescription
                value={description}
                onChange={setDescription}
                onUploadImage={uploadAndGetUrl}
                onOpenImage={setPreviewUrl}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Attachments
                </label>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Extra files (click to open)
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setPasteHint(true);
                }}
                onDragLeave={() => setPasteHint(false)}
                onDrop={onDropAttach}
                className={`rounded border-2 border-dashed p-4 transition ${
                  pasteHint
                    ? "border-[var(--accent)] bg-[var(--drop-active)]"
                    : "border-[var(--border-strong)] bg-[var(--surface-2)]"
                }`}
              >
                <div className="mb-3 flex flex-wrap gap-3">
                  {images.map((url) => (
                    <div key={url} className="group relative">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(url)}
                        className="block"
                        title="Open preview"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="attachment"
                          className="h-24 w-24 rounded border border-[var(--border)] object-cover shadow-sm transition hover:ring-2 hover:ring-[var(--accent)]"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((u) => u !== url))
                        }
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--danger)] text-xs text-white opacity-90 shadow"
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
                    className="rounded bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--accent)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--bg)] disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "Browse files"}
                  </button>
                  <p className="text-xs text-[var(--text-muted)]">
                    Drop images here for separate attachments
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) addAttachment(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="rounded border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-3">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-medium text-[var(--danger)] hover:underline"
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
                className="rounded border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </form>
      </aside>

      {previewUrl && (
        <ImageLightbox
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
          onPrev={
            previewIndex > 0
              ? () => setPreviewUrl(images[previewIndex - 1])
              : undefined
          }
          onNext={
            previewIndex >= 0 && previewIndex < images.length - 1
              ? () => setPreviewUrl(images[previewIndex + 1])
              : undefined
          }
        />
      )}
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
      <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
        {label}
      </label>
      {children}
    </div>
  );
}
