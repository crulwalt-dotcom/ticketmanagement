"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  onOpenImage?: (url: string) => void;
}

function toEditorHtml(value: string) {
  if (!value) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function RichDescription({
  value,
  onChange,
  onUploadImage,
  onOpenImage,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const synced = useRef(false);

  useEffect(() => {
    if (!editorRef.current || synced.current) return;
    editorRef.current.innerHTML = toEditorHtml(value) || "<p><br></p>";
    synced.current = true;
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    const html =
      '<ul class="checklist"><li><label><input type="checkbox" /> Checklist item</label></li></ul><p><br></p>';
    document.execCommand("insertHTML", false, html);
    emitChange();
  };

  const insertUploadedImage = async (file: File) => {
    setUploading(true);
    const url = await onUploadImage(file);
    setUploading(false);
    if (!url || !editorRef.current) return;
    editorRef.current.focus();
    const html = `<p><img src="${url}" alt="screenshot" class="desc-img" /></p><p><br></p>`;
    document.execCommand("insertHTML", false, html);
    emitChange();
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await insertUploadedImage(
            new File([file], `paste-${Date.now()}.png`, { type: file.type })
          );
        }
        return;
      }
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      await insertUploadedImage(file);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "IMG" && onOpenImage) {
      const src = (t as HTMLImageElement).src;
      // Prefer relative path if it's our API
      const path = src.includes("/api/images/")
        ? src.slice(src.indexOf("/api/images/"))
        : src;
      onOpenImage(path);
    }
    if (t.tagName === "INPUT" && (t as HTMLInputElement).type === "checkbox") {
      // allow toggle then persist
      setTimeout(emitChange, 0);
    }
  };

  return (
    <div className="overflow-hidden rounded border border-[var(--border-strong)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5">
        <ToolBtn
          active={mode === "edit"}
          onClick={() => setMode("edit")}
          title="Edit"
        >
          Edit
        </ToolBtn>
        <ToolBtn
          active={mode === "preview"}
          onClick={() => setMode("preview")}
          title="Preview"
        >
          Preview
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        {mode === "edit" && (
          <>
            <ToolBtn onClick={() => exec("bold")} title="Bold">
              <b>B</b>
            </ToolBtn>
            <ToolBtn onClick={() => exec("italic")} title="Italic">
              <i>I</i>
            </ToolBtn>
            <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
              • List
            </ToolBtn>
            <ToolBtn onClick={insertChecklist} title="Checklist">
              ☑ Check
            </ToolBtn>
            <ToolBtn
              onClick={() => fileRef.current?.click()}
              title="Insert image"
              disabled={uploading}
            >
              {uploading ? "…" : "🖼 Image"}
            </ToolBtn>
          </>
        )}
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">
          Paste screenshot under your text (Ctrl+V)
        </span>
      </div>

      {mode === "edit" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={onClick}
          className="rich-editor min-h-[180px] max-h-[360px] overflow-y-auto px-3 py-2 text-sm leading-relaxed text-[var(--text)] outline-none"
          data-placeholder="Write steps, then paste screenshot under that line…"
        />
      ) : (
        <div
          className="rich-editor min-h-[180px] max-h-[360px] overflow-y-auto px-3 py-2 text-sm leading-relaxed text-[var(--text)]"
          onClick={onClick}
          dangerouslySetInnerHTML={{
            __html: toEditorHtml(value) || "<p class='text-muted'>Nothing to preview</p>",
          }}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) insertUploadedImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
        active
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--text)] hover:bg-[var(--bg)]"
      }`}
    >
      {children}
    </button>
  );
}
