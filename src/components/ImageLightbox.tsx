"use client";

import { useEffect } from "react";

interface Props {
  url: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ImageLightbox({ url, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Preview"
          className="max-h-[82vh] max-w-full rounded-md object-contain shadow-2xl"
        />
        <div className="flex items-center gap-2">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="rounded bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
            >
              ← Prev
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-white px-3 py-1.5 text-sm font-medium text-[#0078d4]"
          >
            Open in new tab
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
          >
            Close
          </button>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="rounded bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
