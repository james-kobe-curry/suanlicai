export default function DigitBall({
  d,
  size = 'md',
  accent = false,
}: {
  d: string;
  size?: 'sm' | 'md' | 'lg';
  accent?: boolean;
}) {
  const cls =
    size === 'lg' ? 'h-12 w-10 text-2xl' : size === 'sm' ? 'h-7 w-6 text-base' : 'h-9 w-8 text-lg';
  return <span className={`${accent ? 'ball-brand' : 'ball'} ${cls}`}>{d}</span>;
}
