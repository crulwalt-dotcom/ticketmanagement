export type TicketType = "Bug" | "Feature" | "Task";
export type TicketStatus = "New" | "Active" | "Resolved" | "Closed";
export type MessageType = "text" | "link" | "image" | "note";

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface Ticket {
  _id?: string;
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  createdBy: string;
  assignedTo: string | null;
  images: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id?: string;
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  type: MessageType;
  content: string;
  meta?: {
    title?: string;
    url?: string;
    imageUrl?: string;
  };
  createdAt: string;
}

export const STATUSES: TicketStatus[] = ["New", "Active", "Resolved", "Closed"];
export const TYPES: TicketType[] = ["Bug", "Feature", "Task"];
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

export function conversationIdFor(a: string, b: string) {
  return [a, b].sort().join("__");
}

export function detectMessageType(text: string): { type: MessageType; meta?: ChatMessage["meta"] } {
  const trimmed = text.trim();
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  if (urlMatch && trimmed === urlMatch[0]) {
    return { type: "link", meta: { url: urlMatch[0], title: urlMatch[0] } };
  }
  if (urlMatch) {
    return { type: "text", meta: { url: urlMatch[0] } };
  }
  return { type: "text" };
}
