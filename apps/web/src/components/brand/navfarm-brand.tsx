type NavfarmBrandProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function NavfarmBrand({
  compact = false,
  inverse = false,
  className = '',
}: NavfarmBrandProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <img
        src="/favicon.ico"
        alt="NAVFarm icon"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
      />
      {!compact && (
        <span
          className={`whitespace-nowrap text-lg font-bold tracking-tight ${
            inverse ? 'text-white' : 'text-[var(--brand-word)]'
          }`}
        >
          NAV<span className="text-[#e4664d]">Farm</span>
        </span>
      )}
    </span>
  );
}
