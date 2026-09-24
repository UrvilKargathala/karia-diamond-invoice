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
  Moon,
  Sun,
  BarChart3,
  Settings,
  StickyNote,
  ClipboardList,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "./auth";
import { useTheme } from "@/components/theme";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create/domestic", label: "Domestic Invoice", icon: FilePlus },
  { href: "/create/export", label: "Export Invoice", icon: Globe },
  { href: "/invoices", label: "Invoice History", icon: FileText },
  { href: "/memos", label: "Memo", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: Settings },
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
  const { dark, toggle } = useTheme();

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full w-60 bg-[#1a1a2e] text-white flex flex-col z-50 transition-transform duration-200 md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HomeIcon size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide">
              KARIA DIAMOND
            </div>
            <div className="text-[10px] text-white/40 font-medium">Invoice Generator</div>
          </div>
        </Link>
        <button
          onClick={onNavigate}
          className="md:hidden text-white/60 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5">
        <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Menu
        </div>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={17} className={isActive ? "text-blue-400" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={17} />
          Sign Out
        </button>
        <div className="text-[10px] text-white/20 px-3 pt-1">Karia India LLP</div>
      </div>
    </aside>
  );
}
