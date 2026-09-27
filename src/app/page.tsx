"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ticket, TicketStatus, User } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import Board from "@/components/Board";
import TicketPanel from "@/components/TicketPanel";
import UsersPanel from "@/components/UsersPanel";
import UserBar from "@/components/UserBar";
import ThemeToggle from "@/components/ThemeToggle";
import ChatView from "@/components/ChatView";

type AppView = "board" | "chat";

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("board");

  const load = useCallback(async () => {
    try {
      const [uRes, tRes] = await Promise.all([fetch("/api/users"), fetch("/api/tickets")]);
      const [uData, tData] = await Promise.all([uRes.json(), tRes.json()]);
      if (!uRes.ok) {
        setLoadError(uData?.error || "Failed to load users from database.");
        setUsers([]);
      } else {
        setUsers(Array.isArray(uData) ? uData : []);
        setLoadError("");
      }
      setTickets(Array.isArray(tData) ? tData : []);
    } catch {
      setLoadError("Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!currentUser && users.length) {
      const saved = localStorage.getItem("tb_user");
      const found = users.find((u) => u.id === saved) || users[0];
      setCurrentUser(found);
    }
    if (currentUser && users.length && !users.find((u) => u.id === currentUser.id)) {
      setCurrentUser(users[0] || null);
    }
  }, [users, currentUser]);

  const selectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("tb_user", user.id);
  };

  const userMap = useMemo(() => {
    const m: Record<string, User> = {};
    users.forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditing(ticket);
    setModalOpen(true);
  };

  const saveTicket = async (payload: Partial<Ticket> & { title: string }) => {
    if (editing) {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Save failed");
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, createdBy: currentUser?.id }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || "Create failed");
      setTickets((prev) => [...prev, created]);
    }
    setModalOpen(false);
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Delete this work item?")) return;
    await fetch(`/api/tickets?id=${id}`, { method: "DELETE" });
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setModalOpen(false);
  };

  const moveTicket = async (ticketId: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
    await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticketId, status }),
    });
  };

  const onDropColumn = (status: TicketStatus) => {
    if (dragId) {
      moveTicket(dragId, status);
      setDragId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--bg)] text-[var(--text-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--bg)]">
      {/* Top header */}
      <header className="shrink-0 border-b border-black/10 bg-[var(--header)] text-[var(--header-text)] shadow">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/15 text-xs font-bold sm:h-9 sm:w-9 sm:text-sm">
              TB
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">
                Ticket Board
              </h1>
              <p className="hidden text-[11px] text-white/80 sm:block">
                Bugs · Features · Tasks
              </p>
            </div>
          </div>

          <div className="hidden flex-1 md:block">
            <UserBar
              users={users}
              currentUser={currentUser}
              onSelect={selectUser}
              onManage={() => setUsersOpen(true)}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            {view === "board" && (
              <button
                onClick={openCreate}
                disabled={!currentUser}
                className="rounded bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0078d4] hover:bg-[#deecf9] disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span className="sm:hidden">+ New</span>
                <span className="hidden sm:inline">+ New work item</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden items-center gap-1 px-4 pb-2 md:flex">
          <NavTab active={view === "board"} onClick={() => setView("board")}>
            Board
          </NavTab>
          <NavTab active={view === "chat"} onClick={() => setView("chat")}>
            Chat
          </NavTab>
        </div>

        {/* Mobile user strip */}
        <div className="border-t border-white/10 px-3 py-2 md:hidden">
          <UserBar
            users={users}
            currentUser={currentUser}
            onSelect={selectUser}
            onManage={() => setUsersOpen(true)}
            compact
          />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-2 pb-[calc(3.5rem+env(safe-area-inset-bottom))] sm:p-4 md:pb-4">
        {loadError && (
          <div className="mb-3 rounded border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
            {loadError}
          </div>
        )}

        {view === "board" ? (
          <Board
            statuses={STATUSES}
            tickets={tickets}
            userMap={userMap}
            dragId={dragId}
            setDragId={setDragId}
            onDropColumn={onDropColumn}
            onOpen={openEdit}
          />
        ) : currentUser ? (
          <div className="h-full">
            <ChatView users={users} currentUser={currentUser} />
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-[var(--text-muted)]">
            Add a user first to use chat.
          </p>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
        <button
          type="button"
          onClick={() => setView("board")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
            view === "board" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <span className="text-base">📋</span>
          Board
        </button>
        <button
          type="button"
          onClick={() => setView("chat")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
            view === "chat" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <span className="text-base">💬</span>
          Chat
        </button>
      </nav>

      {modalOpen && currentUser && (
        <TicketPanel
          ticket={editing}
          users={users}
          onSave={saveTicket}
          onDelete={editing ? () => deleteTicket(editing.id) : undefined}
          onClose={() => setModalOpen(false)}
        />
      )}

      {usersOpen && (
        <UsersPanel
          users={users}
          currentUser={currentUser}
          onUsersChange={setUsers}
          onSelect={selectUser}
          onClose={() => setUsersOpen(false)}
        />
      )}
    </div>
  );
}

function NavTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1 text-xs font-semibold ${
        active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
