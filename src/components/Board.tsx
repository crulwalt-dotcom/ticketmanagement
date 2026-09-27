"use client";

import { useState } from "react";
import type { Ticket, TicketStatus, User } from "@/lib/types";
import TicketCard from "./TicketCard";

interface Props {
  statuses: TicketStatus[];
  tickets: Ticket[];
  userMap: Record<string, User>;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onDropColumn: (status: TicketStatus) => void;
  onOpen: (ticket: Ticket) => void;
}

const columnAccent: Record<TicketStatus, string> = {
  New: "border-t-[#0078d4]",
  Active: "border-t-[#ca5010]",
  Resolved: "border-t-[#107c10]",
  Closed: "border-t-[var(--text-muted)]",
};

export default function Board({
  statuses,
  tickets,
  userMap,
  setDragId,
  onDropColumn,
  onOpen,
}: Props) {
  const [mobileStatus, setMobileStatus] = useState<TicketStatus>("New");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Mobile column picker */}
      <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
        {statuses.map((status) => {
          const count = tickets.filter((t) => t.status === status).length;
          const active = mobileStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setMobileStatus(status)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Mobile: single column */}
      <div className="min-h-0 flex-1 md:hidden">
        {statuses
          .filter((s) => s === mobileStatus)
          .map((status) => {
            const columnTickets = tickets
              .filter((t) => t.status === status)
              .sort((a, b) => a.order - b.order);
            return (
              <div
                key={status}
                className={`flex h-full flex-col rounded border border-[var(--border)] border-t-4 bg-[var(--column)] ${columnAccent[status]}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropColumn(status)}
              >
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-3">
                  {columnTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      assignee={
                        ticket.assignedTo ? userMap[ticket.assignedTo] : undefined
                      }
                      onDragStart={() => setDragId(ticket.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => onOpen(ticket)}
                    />
                  ))}
                  {columnTickets.length === 0 && (
                    <p className="px-1 py-10 text-center text-xs text-[var(--text-muted)]">
                      No items · drop or create here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop: all columns */}
      <div className="hidden h-full min-w-max gap-3 md:flex">
        {statuses.map((status) => {
          const columnTickets = tickets
            .filter((t) => t.status === status)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={status}
              className={`flex w-80 flex-col rounded border border-[var(--border)] border-t-4 bg-[var(--column)] shadow-sm ${columnAccent[status]}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropColumn(status)}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold text-[var(--text)]">{status}</h2>
                <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] shadow-sm">
                  {columnTickets.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
                {columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    assignee={
                      ticket.assignedTo ? userMap[ticket.assignedTo] : undefined
                    }
                    onDragStart={() => setDragId(ticket.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => onOpen(ticket)}
                  />
                ))}
                {columnTickets.length === 0 && (
                  <p className="px-1 py-8 text-center text-xs text-[var(--text-muted)]">
                    Drop work items here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
