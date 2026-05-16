import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { IconButtonProps } from "./IconButton.types";

export const IconButton = ({ label, children, onClick }: IconButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="outline" size="icon-sm" aria-label={label} onClick={onClick}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);
