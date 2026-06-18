import type { TimelinePoint } from "@/lib/admin/moderation-types";

export function TimelineChart({ data, title }: { data: TimelinePoint[]; title: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="flex h-28 items-end gap-1.5">
        {data.map((point) => (
          <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-500">{point.count > 0 ? point.count : ""}</span>
            <div
              className="w-full rounded-t bg-gradient-to-t from-pink-600/80 to-purple-500/60 transition-all"
              style={{
                height: `${Math.round((point.count / max) * 100)}%`,
                minHeight: point.count > 0 ? 6 : 2,
                opacity: point.count > 0 ? 1 : 0.25,
              }}
            />
            <span className="text-[9px] text-zinc-600">{point.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
