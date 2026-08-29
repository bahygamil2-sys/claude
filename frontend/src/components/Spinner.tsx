import clsx from "clsx";

export function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      className={clsx("animate-spin text-brand-600", className)}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
