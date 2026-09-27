"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ticket, TicketStatus, User } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import Board from "@/components/Board";
import TicketModal from "@/components/TicketModal";
import UserBar from "@/components/UserBar";

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

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
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, createdBy: currentUser?.id }),
      });
      const created = await res.json();
      setTickets((prev) => [...prev, created]);
    }
    setModalOpen(false);
  };

  const deleteTicket = async (id: string) => {
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
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading board…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-board-accent text-sm font-bold text-white">
            TB
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-slate-800">
              Ticket Board
            </h1>
            <p className="text-xs text-slate-500">Bugs · Features · Tasks</p>
          </div>
        </div>

        <UserBar
          users={users}
          currentUser={currentUser}
          onSelect={selectUser}
          onUsersChange={setUsers}
        />

        <button
          onClick={openCreate}
          disabled={!currentUser}
          className="rounded bg-board-accent px-4 py-2 text-sm font-medium text-white hover:bg-[#106ebe] disabled:opacity-50"
        >
          + New ticket
        </button>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        {loadError && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <Board
          statuses={STATUSES}
          tickets={tickets}
          userMap={userMap}
          dragId={dragId}
          setDragId={setDragId}
          onDropColumn={onDropColumn}
          onOpen={openEdit}
        />
      </main>

      {modalOpen && currentUser && (
        <TicketModal
          ticket={editing}
          users={users}
          currentUser={currentUser}
          onSave={saveTicket}
          onDelete={editing ? () => deleteTicket(editing.id) : undefined}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
