"use client";

import type { Ticket, User } from "@/lib/types";

interface Props {
  ticket: Ticket;
  assignee?: User;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

const typeColor: Record<string, string> = {
  Bug: "bg-board-bug",
  Feature: "bg-board-feature",
  Task: "bg-board-task",
};

const priorityRing: Record<string, string> = {
  Critical: "ring-2 ring-red-500",
  High: "ring-1 ring-orange-400",
  Medium: "",
  Low: "opacity-90",
};

export default function TicketCard({
  ticket,
  assignee,
  onDragStart,
  onDragEnd,
  onClick,
}: Props) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`cursor-grab rounded border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm transition hover:brightness-[1.03] active:cursor-grabbing ${priorityRing[ticket.priority]}`}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-2 flex items-start gap-2">
        <span
          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm ${typeColor[ticket.type]}`}
          title={ticket.type}
        />
        <h3 className="text-sm font-medium leading-snug text-[var(--text)]">
          {ticket.title}
        </h3>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {ticket.type}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">{ticket.priority}</span>
          {ticket.images?.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">
              📎 {ticket.images.length}
            </span>
          )}
        </div>
        {assignee && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: assignee.color }}
            title={assignee.name}
          >
            {assignee.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        )}
      </div>
    </article>
  );
}
