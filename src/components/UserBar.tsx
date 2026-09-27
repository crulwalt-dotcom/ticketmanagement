"use client";

import type { User } from "@/lib/types";

interface Props {
  users: User[];
  currentUser: User | null;
  onSelect: (user: User) => void;
  onManage: () => void;
}

export default function UserBar({
  users,
  currentUser,
  onSelect,
  onManage,
}: Props) {
  const initials = (n: string) =>
    (n || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex flex-1 items-center justify-center gap-3">
      <span className="hidden text-xs text-white/80 sm:inline">Working as</span>
      <div className="flex items-center gap-1">
        {users.slice(0, 8).map((u) => (
          <button
            key={u.id}
            onClick={() => onSelect(u)}
            title={`${u.name} (${u.email})`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white transition ${
              currentUser?.id === u.id
                ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--header)]"
                : "opacity-80 hover:opacity-100"
            }`}
            style={{ background: u.color || "#005a9e" }}
          >
            {initials(u.name)}
          </button>
        ))}
        {users.length > 8 && (
          <span className="px-1 text-xs text-white/80">+{users.length - 8}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onManage}
        className="rounded border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
      >
        Manage users
      </button>
    </div>
  );
}
