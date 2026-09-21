"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { AuthProvider, useAuth } from "./auth";
import { LoginScreen } from "./login";

function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { loggedIn } = useAuth();

  if (!loggedIn) return <LoginScreen />;

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a1a2e] flex items-center px-4 z-40">
        <button onClick={() => setOpen(true)} className="text-white p-1">
          <Menu size={22} />
        </button>
        <span className="text-white font-semibold ml-3 text-sm tracking-wide">
          KARIA DIAMOND
        </span>
      </div>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <Sidebar mobileOpen={open} onNavigate={() => setOpen(false)} />
      <main className="flex-1 md:ml-60 p-4 pt-[72px] md:p-8 md:pt-8">
        <div className="max-w-6xl mx-auto">{children}</div>
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
