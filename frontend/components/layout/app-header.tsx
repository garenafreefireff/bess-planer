import Link from "next/link";
import { Bell, ChevronDown, CircleHelp, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandPair } from "./brand-logo";

type AppHeaderVariant = "planner" | "dashboard";

type AppHeaderUser = {
  initials: string;
  name: string;
  company: string;
};

const plannerNav = [
  { label: "Giới thiệu", href: "/" },
  { label: "So sánh công cụ", href: "/so-sanh-cong-cu" },
  { label: "Quick Sizing", href: "/quick-sizing" },
  { label: "BESS Planner", href: "/bess-planner" },
  { label: "Báo cáo mẫu", href: "/bao-cao-mau" },
  { label: "Liên hệ", href: "/lien-he" }
];

const dashboardNav = [
  { label: "Trang chủ", href: "/" },
  { label: "Quick Sizing", href: "/quick-sizing" },
  { label: "BESS Planner", href: "/bess-planner" },
  { label: "Dự án của tôi", href: "/customer-portal/du-an-cua-toi" },
  { label: "Báo cáo", href: "/bao-cao-mau" }
];

const defaultUsers: Record<AppHeaderVariant, AppHeaderUser> = {
  planner: {
    initials: "NT",
    name: "Nguyễn Tuấn",
    company: "Solaris Energy"
  },
  dashboard: {
    initials: "NA",
    name: "Nguyễn Văn A",
    company: "Công ty TNHH ABC"
  }
};

export function AppHeader({
  activeItem = "BESS Planner",
  notificationCount,
  user,
  variant = "planner"
}: {
  activeItem?: string;
  notificationCount?: number;
  user?: AppHeaderUser;
  variant?: AppHeaderVariant;
}) {
  const isDashboard = variant === "dashboard";
  const navItems = isDashboard ? dashboardNav : plannerNav;
  const currentUser = user ?? defaultUsers[variant];
  const count = notificationCount ?? (isDashboard ? 2 : 3);

  return (
    <header className="border-b border-brand-line bg-white">
      <div
        className={cn(
          "mx-auto flex items-center max-xl:w-[min(1180px,calc(100%_-_40px))]",
          isDashboard
            ? "min-h-[52px] w-[min(1440px,calc(100%_-_96px))] gap-8"
            : "min-h-[74px] w-[min(1920px,calc(100%_-_88px))] gap-7 max-xl:w-[min(1220px,calc(100%_-_42px))]"
        )}
      >
        {isDashboard ? (
          <Link className="flex min-w-[230px] items-center gap-2 text-xl font-bold text-brand-navy" href="/customer-portal">
            <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-brand-blue">
              <span className="size-3 rounded-full bg-white/85" />
            </span>
            EnergyInsight
          </Link>
        ) : (
          <BrandPair />
        )}

        <nav
          className={cn(
            "flex flex-1 justify-center text-sm font-semibold text-brand-navy",
            isDashboard ? "gap-[clamp(34px,4vw,78px)]" : "gap-[clamp(30px,3.2vw,70px)]"
          )}
        >
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex items-center border-b-[3px] border-transparent hover:border-brand-blue hover:text-brand-blue",
                isDashboard ? "min-h-[52px]" : "min-h-[74px]",
                activeItem === item.label && "border-brand-blue text-brand-blue"
              )}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={cn("flex items-center text-brand-navy", isDashboard ? "gap-5" : "gap-5")}>
          {!isDashboard ? (
            <button className="inline-flex items-center gap-2 font-semibold" type="button">
              <Globe2 size={19} />
              <span>VI</span>
              <ChevronDown size={16} />
            </button>
          ) : null}
          {isDashboard ? (
            <button type="button" aria-label="Trợ giúp">
              <CircleHelp size={18} />
            </button>
          ) : null}
          <button className="relative" type="button" aria-label="Thông báo">
            <Bell size={isDashboard ? 18 : 22} />
            <span
              className={cn(
                "absolute grid place-items-center rounded-full bg-red-500 font-bold text-white",
                isDashboard ? "-right-1.5 -top-2 size-4 text-xs" : "-right-2 -top-2 size-5 text-xs"
              )}
            >
              {count}
            </span>
          </button>
          {!isDashboard ? (
            <button type="button" aria-label="Trợ giúp">
              <CircleHelp size={22} />
            </button>
          ) : null}
          <button className="flex items-center gap-3" type="button">
            <span
              className={cn(
                "grid place-items-center rounded-full text-sm font-bold text-white",
                isDashboard ? "size-8 bg-brand-navy text-xs" : "size-10 bg-brand-blue"
              )}
            >
              {currentUser.initials}
            </span>
            <span className="text-left leading-tight">
              <strong className="block text-sm">{currentUser.name}</strong>
              <small className="font-semibold text-brand-muted">{currentUser.company}</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
