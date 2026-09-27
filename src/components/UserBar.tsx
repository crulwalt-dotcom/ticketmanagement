"use client";

import { useState } from "react";
import type { User } from "@/lib/types";

interface Props {
  users: User[];
  currentUser: User | null;
  onSelect: (user: User) => void;
  onUsersChange: (users: User[]) => void;
}

export default function UserBar({
  users,
  currentUser,
  onSelect,
  onUsersChange,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok || !data?.id || !data?.name) {
        setError(data?.error || "Could not add user. Check MongoDB connection.");
        return;
      }
      if (!users.find((u) => u.id === data.id)) {
        onUsersChange([...users, data]);
      }
      onSelect(data);
      setName("");
      setEmail("");
      setShowAdd(false);
    } catch {
      setError("Network error while adding user.");
    } finally {
      setBusy(false);
    }
  };

  const initials = (userName: string) =>
    (userName || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="relative flex flex-1 items-center justify-center gap-2">
      <span className="hidden text-xs text-slate-500 sm:inline">Working as</span>
      <div className="flex items-center gap-1">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u)}
            title={`${u.name} (${u.email})`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-offset-1 transition ${
              currentUser?.id === u.id ? "ring-2 ring-board-accent" : "opacity-70 hover:opacity-100"
            }`}
            style={{ background: u.color || "#0078d4" }}
          >
            {initials(u.name)}
          </button>
        ))}
        <button
          onClick={() => {
            setShowAdd((v) => !v);
            setError("");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-board-accent hover:text-board-accent"
          title="Add user"
        >
          +
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addUser}
          className="absolute top-12 z-20 flex w-72 flex-col gap-2 rounded border border-slate-200 bg-white p-3 shadow-lg"
        >
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-board-accent px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
