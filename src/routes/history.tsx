import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { formatNaira, useGame } from "@/lib/game-store";
import { Trophy, X } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Round History — Urgent 2k" },
      { name: "description", content: "Your past rounds on Urgent 2k." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history } = useGame();
  return (
    <AppShell title="History" subtitle={`${history.length} rounds played`}>
      {history.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border p-10 text-center">
          <div className="text-sm text-muted-foreground">No rounds yet.</div>
          <Link
            to="/"
            className="inline-block mt-4 px-5 h-11 leading-[2.75rem] rounded-xl bg-brand-red text-white font-bold text-sm"
          >
            Join your first round
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {history.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-border"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  h.won ? "bg-brand-red text-white" : "bg-secondary text-muted-foreground"
                }`}
              >
                {h.won ? <Trophy className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{h.won ? "Won" : "Lost"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.date).toLocaleString("en-NG", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div
                className={`text-display font-black text-base ${
                  h.amount > 0 ? "text-brand-red" : "text-foreground/60"
                }`}
              >
                {h.amount > 0 ? "+" : ""}
                {formatNaira(h.amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}