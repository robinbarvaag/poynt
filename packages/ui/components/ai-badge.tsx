import { cn } from "../lib/utils";
import { Badge, type BadgeProps } from "./badge";

// Én dempet, konsistent markør for AI-generert innhald. Erstatningen for det
// gamle sparkles-/emoji-rotet — same uttrykk overalt, ingen pynt.
export function AiBadge({
  label = "AI-generert",
  className,
  ...props
}: { label?: string } & Omit<BadgeProps, "children">) {
  return (
    <Badge variant="muted" size="sm" className={cn(className)} {...props}>
      {label}
    </Badge>
  );
}
