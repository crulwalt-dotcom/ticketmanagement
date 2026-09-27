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

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const user = await res.json();
    if (!users.find((u) => u.id === user.id)) {
      onUsersChange([...users, user]);
    }
    onSelect(user);
    setName("");
    setEmail("");
    setShowAdd(false);
    setBusy(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center gap-2">
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
            style={{ background: u.color }}
          >
            {u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-board-accent hover:text-board-accent"
          title="Add user"
        >
          +
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addUser}
          className="absolute top-14 z-20 flex gap-2 rounded border border-slate-200 bg-white p-3 shadow-lg"
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
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-board-accent px-3 py-1 text-sm text-white"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
