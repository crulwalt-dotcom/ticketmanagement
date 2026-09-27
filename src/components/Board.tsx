"use client";

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
  Closed: "border-t-[#605e5c]",
};

export default function Board({
  statuses,
  tickets,
  userMap,
  setDragId,
  onDropColumn,
  onOpen,
}: Props) {
  return (
    <div className="flex h-full min-w-max gap-3">
      {statuses.map((status) => {
        const columnTickets = tickets
          .filter((t) => t.status === status)
          .sort((a, b) => a.order - b.order);

        return (
          <div
            key={status}
            className={`flex w-80 flex-col rounded border border-[#edebe9] border-t-4 bg-[#ebecf0] shadow-sm ${columnAccent[status]}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropColumn(status)}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <h2 className="text-sm font-semibold text-[#323130]">{status}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[#605e5c] shadow-sm">
                {columnTickets.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
              {columnTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  assignee={ticket.assignedTo ? userMap[ticket.assignedTo] : undefined}
                  onDragStart={() => setDragId(ticket.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onOpen(ticket)}
                />
              ))}
              {columnTickets.length === 0 && (
                <p className="px-1 py-8 text-center text-xs text-[#8a8886]">
                  Drop work items here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
