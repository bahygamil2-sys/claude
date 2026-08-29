export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-lg font-semibold text-neutral-400">{title}</h1>
      <p className="mt-2 text-sm text-neutral-400">Coming soon</p>
    </div>
  );
}
