import Link from "next/link";
import { ArrowRight, ChevronDown, Globe2 } from "lucide-react";
import { navItems } from "@/features/landing/data/landing-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandPair } from "./brand-logo";

export function PublicHeader({ activeItem }: { activeItem?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-line bg-white/90 backdrop-blur-xl">
      <div className="site-container flex min-h-[66px] items-center gap-8 max-lg:flex-wrap max-lg:gap-x-6 max-lg:gap-y-3 max-lg:py-3">
        <BrandPair />
        <nav className="flex flex-1 justify-center gap-[clamp(24px,3vw,58px)] text-sm font-semibold text-brand-navy max-xl:gap-6 max-lg:order-3 max-lg:w-full max-lg:justify-start max-lg:overflow-x-auto">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex min-h-[66px] items-center border-b-[3px] border-transparent hover:border-brand-blue hover:text-brand-blue max-lg:min-h-10 max-lg:whitespace-nowrap",
                activeItem === item.label && "border-brand-blue text-brand-blue"
              )}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 max-lg:ml-auto max-sm:w-full max-sm:justify-between">
          <button className="inline-flex min-h-10 items-center gap-2 bg-transparent font-semibold text-brand-navy" type="button" aria-label="Đổi ngôn ngữ">
            <Globe2 size={18} />
            <span>VI</span>
            <ChevronDown size={16} />
          </button>
          <a className={buttonVariants({ size: "sm", className: "bg-brand-blue text-white hover:bg-brand-blue/90" })} href="/customer-portal">
            Bắt đầu
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
