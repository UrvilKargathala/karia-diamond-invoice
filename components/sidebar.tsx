"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Globe,
  Home as HomeIcon,
  X,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "./auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create/domestic", label: "Domestic Invoice", icon: FilePlus },
  { href: "/create/export", label: "Export Invoice", icon: Globe },
  { href: "/invoices", label: "Invoice History", icon: FileText },
];

export function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full w-60 bg-[#1a1a2e] text-white flex flex-col z-50 transition-transform duration-200 md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
            <HomeIcon size={18} />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-wide">
              KARIA DIAMOND
            </div>
            <div className="text-[11px] text-white/50">Invoice Generator</div>
          </div>
        </Link>
        <button
          onClick={onNavigate}
          className="md:hidden text-white/60 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <div className="text-[11px] text-white/30">Karia India LLP</div>
      </div>
    </aside>
  );
}
