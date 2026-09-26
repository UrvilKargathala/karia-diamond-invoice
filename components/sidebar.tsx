"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Globe,
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

const sections = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Invoices",
    items: [
      { href: "/create/domestic", label: "Domestic Invoice", icon: FilePlus },
      { href: "/create/export", label: "Export Invoice", icon: Globe },
      { href: "/invoices", label: "Invoice History", icon: FileText },
      { href: "/memos", label: "Memo", icon: ClipboardList },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/notes", label: "Notes", icon: StickyNote },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
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
        "fixed left-0 top-0 h-full w-60 bg-[color:var(--color-surface)] border-r border-[var(--color-border)] flex flex-col z-50 transition-transform duration-200 md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="px-5 h-16 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Karia Diamond LLP" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          <div>
            <div className="font-bold text-sm tracking-wide leading-tight">KARIA DIAMOND LLP</div>
            <div className="text-[10px] text-gray-400 font-medium">Invoice Generator</div>
          </div>
        </Link>
        <button onClick={onNavigate} className="md:hidden text-gray-400 hover:text-gray-700 p-1">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.title} className="mb-4">
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sec.title}</div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-white/5"
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--color-border)] space-y-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-white/5 transition-colors w-full"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={17} />
          Sign Out
        </button>
        <div className="text-[10px] text-gray-400 px-3 pt-1">Karia Diamond LLP</div>
      </div>
    </aside>
  );
}
