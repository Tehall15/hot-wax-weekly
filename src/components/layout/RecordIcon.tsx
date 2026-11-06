import { Button } from "../ui/button";

export default function RecordIcon({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="relative h-auto flex-col gap-0.5 p-0 leading-none"
      onClick={onClick}
      title="Friends & Notifications"
    >
      <span className="relative leading-none">
        <span className="text-xl">💿</span>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded bg-destructive px-0.5 text-[10px] font-bold text-background">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="text-[9px] tracking-wide text-muted-foreground">Find bandmates</span>
    </Button>
  );
}
