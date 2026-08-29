export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${Math.random().toString(36).slice(2, 8)}`;
}

/** Appends -2, -3, ... until `isTaken` reports the candidate is free. */
export async function uniqueSlug(base: string, isTaken: (candidate: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
    if (suffix > 100) throw new Error("Could not generate a unique slug");
  }
  return candidate;
}
