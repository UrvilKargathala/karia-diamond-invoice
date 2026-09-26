"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Sidebar } from "./sidebar";
import { AuthProvider, useAuth } from "./auth";
import { LoginScreen } from "./login";

function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { loggedIn } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");

  if (!loggedIn) return <LoginScreen />;

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[color:var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-4 z-40">
        <button onClick={() => setOpen(true)} className="p-1">
          <Menu size={22} />
        </button>
        <img src="/logo.jpg" alt="Karia Diamond LLP" className="w-7 h-7 rounded-md ml-3 object-cover" />
        <span className="font-semibold ml-2 text-sm tracking-wide">
          KARIA DIAMOND LLP
        </span>
      </div>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <Sidebar mobileOpen={open} onNavigate={() => setOpen(false)} />
      <main className="flex-1 min-w-0 md:ml-60 p-4 pt-[72px] md:p-8 md:pt-5">
        <div className="max-w-[1400px] mx-auto">
          <form
            className="hidden md:flex items-center mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/invoices?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <div className="relative w-full max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="form-input"
                style={{ paddingLeft: 36, borderRadius: 999 }}
                placeholder="Search invoices by number or buyer..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </form>
          {children}
        </div>
      </main>
    </>
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
