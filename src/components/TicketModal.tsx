"use client";

import { useRef, useState } from "react";
import type { Ticket, TicketType, User } from "@/lib/types";
import { PRIORITIES, TYPES } from "@/lib/types";

interface Props {
  ticket: Ticket | null;
  users: User[];
  currentUser: User;
  onSave: (payload: Partial<Ticket> & { title: string }) => Promise<void>;
  onDelete?: () => void;
  onClose: () => void;
}

export default function TicketModal({
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
  const [assignedTo, setAssignedTo] = useState<string>(ticket?.assignedTo || "");
  const [images, setImages] = useState<string[]>(ticket?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setImages((prev) => [...prev, data.url]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      assignedTo: assignedTo || null,
      images,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-800">
            {ticket ? "Edit ticket" : "New ticket"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-board-accent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-board-accent"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details, repro steps, acceptance criteria…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Priority
              </label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Assign to
            </label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Images
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="attachment"
                    className="h-16 w-16 rounded border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-500 hover:border-board-accent hover:text-board-accent"
              >
                {uploading ? "…" : "+ Add"}
              </button>
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

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-board-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#106ebe] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
