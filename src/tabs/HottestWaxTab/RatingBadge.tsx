export default function RatingBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[13px] text-primary">★</span>
      <span className="text-[13px] font-bold text-primary">{value}</span>
      <span className="text-xs text-muted-foreground">/10</span>
    </span>
  );
}
