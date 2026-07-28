"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminSearchDialog } from "./admin-search-dialog";

export function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    setShortcutLabel(platform.includes("mac") ? "⌘ K" : "Ctrl K");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        aria-label="Mở tìm kiếm quản trị"
        className="relative flex h-12 w-full items-center rounded-lg border border-input bg-white pl-12 pr-16 text-left text-[15px] font-medium text-brand-muted transition hover:border-brand-blue hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
        <span className="truncate">Tìm kiếm người dùng, dự án, file...</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-brand-line px-2 py-0.5 text-xs font-semibold text-brand-muted">
          {shortcutLabel}
        </span>
      </button>
      {open ? (
        <AdminSearchDialog
          onClose={close}
          query={query}
          setQuery={setQuery}
        />
      ) : null}
    </>
  );
}
