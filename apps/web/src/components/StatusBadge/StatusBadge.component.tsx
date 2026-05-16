import { UploadStatus } from "@media-upload/shared-types";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { labelStatus } from "@/utils/format";
import type { StatusBadgeProps } from "./StatusBadge.types";

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (status === UploadStatus.Completed) {
    return (
      <Badge>
        <CheckCircle2 className="size-3.5" />
        Completed
      </Badge>
    );
  }

  if (status === UploadStatus.Failed || status === UploadStatus.Cancelled) {
    return (
      <Badge variant="destructive">
        <XCircle className="size-3.5" />
        {labelStatus(status)}
      </Badge>
    );
  }

  return <Badge variant="secondary">{labelStatus(status)}</Badge>;
};
