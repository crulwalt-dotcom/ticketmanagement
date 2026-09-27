"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

const COLORS = [
  "#0078d4",
  "#107c10",
  "#e81123",
  "#8764b8",
  "#ca5010",
  "#038387",
  "#004e8c",
  "#5c2d91",
];

interface Props {
  users: User[];
  currentUser: User | null;
  onUsersChange: (users: User[]) => void;
  onSelect: (user: User) => void;
  onClose: () => void;
}

export default function UsersPanel({
  users,
  currentUser,
  onUsersChange,
  onSelect,
  onClose,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startCreate = () => {
    setMode("create");
    setEditingId(null);
    setName("");
    setEmail("");
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setError("");
  };

  const startEdit = (u: User) => {
    setMode("edit");
    setEditingId(u.id);
    setName(u.name);
    setEmail(u.email);
    setColor(u.color);
    setError("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "create") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, color }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Could not create user");
          return;
        }
        onUsersChange([...users, data]);
        onSelect(data);
      } else if (editingId) {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, email, color }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Could not update user");
          return;
        }
        onUsersChange(users.map((u) => (u.id === data.id ? data : u)));
        if (currentUser?.id === data.id) onSelect(data);
      }
      setMode("list");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete ${u.name}? Their assigned tickets will become unassigned.`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/users?id=${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not delete user");
        return;
      }
      const next = users.filter((x) => x.id !== u.id);
      onUsersChange(next);
      if (currentUser?.id === u.id && next[0]) onSelect(next[0]);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const initials = (n: string) =>
    (n || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        style={{ background: "var(--overlay)" }}
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-[480px] animate-slide-in flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <header className="flex items-start justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              Team
            </p>
            <h2 className="text-xl font-semibold text-[var(--text)]">Manage users</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Add, edit, or remove people who can own tickets
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-lg text-[var(--text-muted)] hover:bg-[var(--bg)]"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <p className="mb-3 rounded border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}

          {mode === "list" ? (
            <>
              <button
                type="button"
                onClick={startCreate}
                className="mb-4 w-full rounded bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + Add user
              </button>
              <ul className="space-y-2">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 rounded border border-[var(--border)] bg-[var(--surface-2)] p-3"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: u.color }}
                    >
                      {initials(u.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">
                        {u.name}
                        {currentUser?.id === u.id && (
                          <span className="ml-2 text-[10px] font-medium uppercase text-[var(--accent)]">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{u.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect(u)}
                      className="rounded px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      Switch
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="rounded px-2 py-1 text-xs font-medium text-[var(--text)] hover:bg-[var(--bg)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(u)}
                      className="rounded px-2 py-1 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)]"
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {users.length === 0 && (
                  <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                    No users yet. Add your first teammate.
                  </p>
                )}
              </ul>
            </>
          ) : (
            <form onSubmit={save} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                ← Back to list
              </button>
              <h3 className="text-base font-semibold text-[var(--text)]">
                {mode === "create" ? "New user" : "Edit user"}
              </h3>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text)]">
                  Name
                </label>
                <input
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text)]">
                  Email
                </label>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full ${
                        color === c ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" : ""
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="rounded border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
