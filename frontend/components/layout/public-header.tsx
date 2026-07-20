"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Globe2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/features/landing/data/landing-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandPair } from "./brand-logo";

export function PublicHeader({ activeItem }: { activeItem?: string }) {
  const pathname = usePathname();
  const [isStartOpen, setIsStartOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5ECF5] bg-white/95 backdrop-blur-xl">
      <div className="site-container flex h-[68px] items-center gap-8 max-lg:flex-wrap max-lg:gap-x-6 max-lg:gap-y-3 max-lg:py-3">
        <BrandPair />
        <nav className="flex flex-1 justify-center gap-[clamp(24px,3vw,52px)] text-[15px] font-medium text-brand-navy max-xl:gap-6 max-lg:order-3 max-lg:w-full max-lg:justify-start max-lg:overflow-x-auto">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex h-[68px] items-center border-b-[3px] border-transparent transition-colors hover:border-brand-blue hover:text-brand-blue max-lg:h-10 max-lg:whitespace-nowrap",
                (activeItem === item.label || pathname === item.href) && "border-brand-blue text-brand-blue"
              )}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 max-lg:ml-auto max-sm:w-full max-sm:justify-between">
          <button className="inline-flex min-h-10 items-center gap-2 bg-transparent text-sm font-semibold text-brand-navy" type="button" aria-label="Đổi ngôn ngữ">
            <Globe2 size={18} />
            <span>VI</span>
            <ChevronDown size={16} />
          </button>
          <div className="relative">
            <button
              className={buttonVariants({ className: "h-11 rounded-lg bg-brand-blue px-6 text-white hover:bg-brand-blue/90" })}
              onClick={() => setIsStartOpen((value) => !value)}
              type="button"
              aria-expanded={isStartOpen}
            >
              Bắt đầu
              <ArrowRight size={18} />
            </button>
            {isStartOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-brand-line bg-white p-2 shadow-soft">
                <Link className="block rounded-lg px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-blue-50 hover:text-brand-blue" href="/quick-sizing">
                  Dùng Quick Sizing
                </Link>
                <Link className="block rounded-lg px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-green-50 hover:text-brand-green" href="/customer-portal">
                  Đăng nhập BESS Planner
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
