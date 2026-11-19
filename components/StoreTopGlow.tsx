/** Soft blue light at the top of the coin store and history screens. */
export function StoreTopGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden"
    >
      <div className="absolute left-1/2 top-[-73px] h-[95px] w-[287px] -translate-x-1/2 rounded-full bg-[#1A95FA] opacity-60 blur-[47px]" />
    </div>
  );
}
