import type { ConstraintProps } from "./Constraint.types";

export const Constraint = ({ label, value }: ConstraintProps) => (
  <div className="rounded-md border bg-background px-3 py-2">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 font-medium">{value}</div>
  </div>
);
