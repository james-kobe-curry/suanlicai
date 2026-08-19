/** HUD 四角标 · 纯装饰 */
export default function TechCorners() {
  const c = 'pointer-events-none absolute h-4 w-4 border-brand/35';
  return (
    <>
      <span className={`${c} left-2 top-2 border-l border-t`} />
      <span className={`${c} right-2 top-2 border-r border-t`} />
      <span className={`${c} bottom-2 left-2 border-b border-l`} />
      <span className={`${c} bottom-2 right-2 border-b border-r`} />
    </>
  );
}
