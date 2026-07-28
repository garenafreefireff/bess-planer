"use client";

import { FileText, Folder, Loader2, Search, UserPlus, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AdminSearchGroupKey, AdminSearchItem } from "../data/admin-search.types";
import { useAdminGlobalSearch } from "../hooks/use-admin-global-search";

const groupLabels: Record<AdminSearchGroupKey, string> = {
  users: "Người dùng",
  projects: "Dự án",
  files: "File",
  leads: "Lead"
};

const groupIcons = {
  users: Users,
  projects: Folder,
  files: FileText,
  leads: UserPlus
} satisfies Record<AdminSearchGroupKey, typeof Users>;

const groupOrder: AdminSearchGroupKey[] = ["users", "projects", "files", "leads"];

export function AdminSearchDialog({ onClose, query, setQuery }: { onClose: () => void; query: string; setQuery: (query: string) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data, error, loading } = useAdminGlobalSearch(query, true);
  const items = useMemo(() => flattenItems(data), [data]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, data]);

  const openItem = (item: AdminSearchItem) => {
    router.push(item.target_url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button aria-label="Đóng tìm kiếm" className="absolute inset-0 bg-brand-navy/35" onClick={onClose} type="button" />
      <section
        aria-label="Tìm kiếm quản trị"
        aria-modal="true"
        className="absolute left-1/2 top-16 flex max-h-[min(720px,calc(100vh-96px))] w-[720px] max-w-[calc(100vw-24px)] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-brand-line bg-white shadow-2xl max-sm:top-4 max-sm:max-h-[calc(100vh-32px)]"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-brand-line px-4 py-3">
          <Search className="text-brand-muted" size={20} />
          <input
            aria-label="Nhập từ khóa tìm kiếm quản trị"
            className="h-11 min-w-0 flex-1 bg-transparent text-base font-semibold text-brand-navy outline-none placeholder:text-brand-muted"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(items.length - 1, 0)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter" && items[activeIndex]) {
                event.preventDefault();
                openItem(items[activeIndex]);
              }
            }}
            placeholder="Tìm người dùng, dự án, file, lead..."
            ref={inputRef}
            value={query}
          />
          {loading ? <Loader2 className="animate-spin text-brand-muted" size={18} aria-label="Đang tìm kiếm" /> : null}
          <button aria-label="Đóng tìm kiếm" className="grid size-9 place-items-center rounded-md text-brand-muted hover:bg-blue-50 hover:text-brand-blue" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-[220px] overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <StateText title="Nhập ít nhất 2 ký tự" detail="Tìm kiếm theo người dùng, dự án, file hoặc lead trong Admin Portal." />
          ) : null}
          {error ? <StateText title="Không thể tìm kiếm dữ liệu quản trị" detail={error} /> : null}
          {!error && query.trim().length >= 2 && !loading && data?.total_matches === 0 ? (
            <StateText title="Không có kết quả" detail="Thử từ khóa khác hoặc kiểm tra lại bộ lọc trang đích." />
          ) : null}
          {!error && data && data.total_matches > 0 ? (
            <div className="grid gap-3">
              {groupOrder.map((group) => {
                const groupItems = data.groups[group];
                if (!groupItems.length) return null;
                const offset = groupOrder.slice(0, groupOrder.indexOf(group)).reduce((total, key) => total + data.groups[key].length, 0);
                return (
                  <SearchGroup
                    activeIndex={activeIndex}
                    group={group}
                    items={groupItems}
                    key={group}
                    offset={offset}
                    onOpen={openItem}
                    onHover={setActiveIndex}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SearchGroup({
  activeIndex,
  group,
  items,
  offset,
  onHover,
  onOpen
}: {
  activeIndex: number;
  group: AdminSearchGroupKey;
  items: AdminSearchItem[];
  offset: number;
  onHover: (index: number) => void;
  onOpen: (item: AdminSearchItem) => void;
}) {
  const Icon = groupIcons[group];
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 px-2 text-xs font-bold uppercase text-brand-muted">
        <Icon size={15} /> {groupLabels[group]}
      </div>
      <div className="grid gap-1">
        {items.map((item, index) => {
          const absoluteIndex = offset + index;
          const active = activeIndex === absoluteIndex;
          return (
            <button
              className={`rounded-lg px-3 py-2 text-left transition ${active ? "bg-blue-50 text-brand-blue" : "text-brand-navy hover:bg-slate-50"}`}
              key={`${item.type}-${item.id}`}
              onClick={() => onOpen(item)}
              onMouseEnter={() => onHover(absoluteIndex)}
              type="button"
            >
              <span className="block text-sm font-bold">{item.title}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-brand-muted">{item.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StateText({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid min-h-[200px] place-items-center text-center">
      <div>
        <p className="text-base font-bold text-brand-navy">{title}</p>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">{detail}</p>
      </div>
    </div>
  );
}

function flattenItems(data: ReturnType<typeof useAdminGlobalSearch>["data"]): AdminSearchItem[] {
  if (!data) return [];
  return groupOrder.flatMap((group) => data.groups[group]);
}
