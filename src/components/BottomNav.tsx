import { Link } from "@tanstack/react-router";
import { Home, Clock, Wallet, User } from "lucide-react";

const items = [
  { to: "/", label: "Rounds", Icon: Home },
  { to: "/history", label: "History", Icon: Clock },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center justify-center py-2.5 gap-1 text-muted-foreground data-[status=active]:text-brand-red transition-colors"
          >
            <Icon className="w-5 h-5" strokeWidth={2.25} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </Link>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  );
}