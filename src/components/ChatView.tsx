"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, User } from "@/lib/types";
import ImageLightbox from "./ImageLightbox";

interface Props {
  users: User[];
  currentUser: User;
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/gi);
  return parts.map((part, i) =>
    /^https?:\/\//i.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[var(--accent)] underline"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ChatView({ users, currentUser }: Props) {
  const others = useMemo(
    () => users.filter((u) => u.id !== currentUser.id),
    [users, currentUser.id]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previews, setPreviews] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = others.find((u) => u.id === selectedId) || null;

  const loadPreviews = useCallback(async () => {
    const res = await fetch(`/api/messages?userId=${currentUser.id}`);
    const data = await res.json();
    if (Array.isArray(data)) setPreviews(data);
  }, [currentUser.id]);

  const loadThread = useCallback(async (withUserId: string) => {
    const res = await fetch(
      `/api/messages?userId=${currentUser.id}&withUserId=${withUserId}`
    );
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  }, [currentUser.id]);

  useEffect(() => {
    loadPreviews();
  }, [loadPreviews]);

  useEffect(() => {
    if (!selectedId) return;
    loadThread(selectedId);
    const t = setInterval(() => loadThread(selectedId), 4000);
    return () => clearInterval(t);
  }, [selectedId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = (userId: string) => {
    setSelectedId(userId);
    setMobileShowThread(true);
    setError("");
  };

  const send = async (payload: {
    content: string;
    type?: string;
    meta?: ChatMessage["meta"];
  }) => {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: selectedId,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Send failed");
        return;
      }
      setMessages((prev) => [...prev, data]);
      setText("");
      loadPreviews();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const sendText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    await send({ content: text.trim() });
  };

  const sendImage = async (file: File) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await up.json();
      if (!up.ok || !data.url) {
        setError(data?.error || "Upload failed");
        return;
      }
      await send({
        content: data.url,
        type: "image",
        meta: { imageUrl: data.url },
      });
    } finally {
      setBusy(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !selectedId) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await sendImage(
            new File([file], `chat-${Date.now()}.png`, { type: file.type })
          );
        }
        return;
      }
    }
  };

  const deleteMsg = async (id: string) => {
    await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    loadPreviews();
  };

  const previewFor = (userId: string) =>
    previews.find(
      (p) =>
        (p.fromUserId === userId && p.toUserId === currentUser.id) ||
        (p.toUserId === userId && p.fromUserId === currentUser.id)
    );

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      {/* People list */}
      <aside
        className={`w-full shrink-0 border-r border-[var(--border)] bg-[var(--surface-2)] md:w-72 ${
          mobileShowThread ? "hidden md:flex md:flex-col" : "flex flex-col"
        }`}
      >
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Chat & saved notes</h2>
          <p className="text-[11px] text-[var(--text-muted)]">
            Message teammates · save links, images, notes
          </p>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {others.map((u) => {
            const prev = previewFor(u.id);
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => openChat(u.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg)] ${
                    selectedId === u.id ? "bg-[var(--accent-soft)]" : ""
                  }`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: u.color }}
                  >
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                      {u.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">
                      {prev
                        ? prev.type === "image"
                          ? "📷 Image"
                          : prev.type === "link"
                            ? "🔗 Link"
                            : prev.content
                        : "Start a conversation"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
          {others.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              Add more users to start chatting.
            </p>
          )}
        </ul>
      </aside>

      {/* Thread */}
      <section
        className={`min-w-0 flex-1 flex-col ${
          mobileShowThread ? "flex" : "hidden md:flex"
        }`}
      >
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-2.5 md:px-4">
              <button
                type="button"
                className="rounded px-2 py-1 text-sm text-[var(--accent)] md:hidden"
                onClick={() => setMobileShowThread(false)}
              >
                ← Back
              </button>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: selected.color }}
              >
                {initials(selected.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text)]">
                  {selected.name}
                </p>
                <p className="truncate text-[11px] text-[var(--text-muted)]">
                  {selected.email}
                </p>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg)] px-3 py-4 md:px-4">
              {messages.map((m) => {
                const mine = m.fromUserId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm md:max-w-[70%] ${
                        mine
                          ? "rounded-br-md bg-[var(--accent)] text-white"
                          : "rounded-bl-md bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
                      }`}
                    >
                      {m.type === "image" || m.meta?.imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage(m.meta?.imageUrl || m.content)
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.meta?.imageUrl || m.content}
                            alt="shared"
                            className="max-h-56 max-w-full rounded-lg object-contain"
                          />
                        </button>
                      ) : m.type === "link" && m.meta?.url ? (
                        <a
                          href={m.meta.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`block break-all underline ${
                            mine ? "text-white" : "text-[var(--accent)]"
                          }`}
                        >
                          🔗 {m.meta.title || m.meta.url}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {linkify(m.content)}
                        </p>
                      )}
                      <div
                        className={`mt-1 flex items-center justify-between gap-3 text-[10px] ${
                          mine ? "text-white/70" : "text-[var(--text-muted)]"
                        }`}
                      >
                        <span>{formatTime(m.createdAt)}</span>
                        {mine && (
                          <button
                            type="button"
                            onClick={() => deleteMsg(m.id)}
                            className="opacity-0 group-hover:opacity-100 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                  No messages yet. Send text, a link, or paste a screenshot.
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <p className="border-t border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]">
                {error}
              </p>
            )}

            <form
              onSubmit={sendText}
              onPaste={onPaste}
              className="border-t border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--bg)]"
                  title="Attach image"
                >
                  🖼
                </button>
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendText();
                    }
                  }}
                  placeholder="Message, paste link, or Ctrl+V screenshot…"
                  className="field-input max-h-28 min-h-[44px] flex-1 resize-none"
                />
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) sendImage(f);
                  e.target.value = "";
                }}
              />
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-[var(--text-muted)]">
            Select a person to chat and save shared content.
          </div>
        )}
      </section>

      {previewImage && (
        <ImageLightbox url={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}
