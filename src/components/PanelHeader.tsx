/** 面板版块头部：眉标 + 标题 + 说明 + 计数徽章 */
export default function PanelHeader({
  eyebrow,
  title,
  desc,
  badge,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="eyebrow text-brand">{eyebrow}</p>
        <h2 className="mt-1 text-base font-semibold text-fg">{title}</h2>
        {desc && <p className="mt-1 text-xs leading-relaxed text-fg3">{desc}</p>}
      </div>
      {badge && (
        <span className="rounded-full border border-line bg-raise px-2.5 py-1 text-xs text-fg2">
          {badge}
        </span>
      )}
    </div>
  );
}
