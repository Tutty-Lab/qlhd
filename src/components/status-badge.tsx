import { computeStatus, STATUS_CLASS, STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, endDate }: { status: string; endDate?: string | null }) {
  const k = computeStatus(status, endDate);
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", STATUS_CLASS[k])}>{STATUS_LABEL[k]}</span>;
}
