import type { MetricProps } from "./Metric.types";

export const Metric = ({ label, value, tone = "default" }: MetricProps) => (
  <div className="min-w-0 rounded-lg border bg-card px-3 py-2 shadow-sm">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div
      className={
        tone === "danger" ? "text-xl font-semibold text-destructive" : "text-xl font-semibold"
      }
    >
      {value}
    </div>
  </div>
);
