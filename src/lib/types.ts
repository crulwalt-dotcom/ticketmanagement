export type TicketType = "Bug" | "Feature" | "Task";
export type TicketStatus = "New" | "Active" | "Resolved" | "Closed";

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

export const STATUSES: TicketStatus[] = ["New", "Active", "Resolved", "Closed"];
export const TYPES: TicketType[] = ["Bug", "Feature", "Task"];
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
