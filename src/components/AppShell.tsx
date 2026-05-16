import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen flex flex-col pb-24">
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center shadow-red">
                <span className="text-white text-display font-black text-lg leading-none">2K</span>
              </div>
              <div className="text-display font-black text-xl tracking-tight">
                Urgent<span className="text-brand-red">2k</span>
              </div>
            </div>
            {title && <h1 className="mt-5 text-3xl text-display">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </header>
        <main className="flex-1 px-5">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}