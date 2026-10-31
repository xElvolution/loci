import type { Message } from "@/lib/server/repo";

function when(d: Date) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** A simple two-sided thread. Patient on one side, care team on the other. */
export function MessageThread({ messages, viewer, empty }: { messages: Message[]; viewer: "patient" | "team"; empty: string }) {
  if (!messages.length) return <p className="glass rounded-3xl p-6 text-center text-sm text-haze" data-testid="thread-empty">{empty}</p>;
  return (
    <ol className="space-y-3" data-testid="thread" aria-label="Messages">
      {messages.map((m) => {
        const mine = m.side === viewer;
        return (
          <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid="thread-msg">
            <div className={`max-w-[88%] min-w-0 rounded-3xl px-4 py-3 md:max-w-[75%] ${mine ? "rounded-br-lg bg-gradient-to-br from-ember/25 to-coral/15" : "rounded-bl-lg border border-white/10 bg-white/[0.05]"}`}>
              <p className="text-[11px] text-haze">
                <span className="font-semibold text-[#efeaff]">{m.name ?? (m.side === "team" ? "Care team" : "Patient")}</span>
                {m.side === "team" ? " · care team" : ""} · {when(m.created_at)}
              </p>
              {m.kind === "question" && (
                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.resolved_at ? "bg-mint/15 text-mint" : "bg-ember/20 text-ember"}`}>{m.resolved_at ? "Question, answered" : "Question, waiting"}</span>
              )}
              <p className="mt-1 text-[15px] break-words whitespace-pre-line">{m.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
