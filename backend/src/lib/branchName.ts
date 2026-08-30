// Shared by manual alias registration (here) and the import pipeline's
// column-matching (Phase 4) — one normalization function, so a spelling
// variant confirmed once is recognized everywhere, not just where it was
// first seen. Handles exactly the drift found in the real source workbooks:
// "مصر الجديدة" vs "مصر الجديده" (ة/ه) plus the usual diacritic/alef noise.
export function normalizeBranchName(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics (tashkeel)
    .replace(/ـ/g, "") // tatweel/kashida
    .replace(/[آأإٱ]/g, "ا") // آ/أ/إ/ٱ -> ا
    .replace(/ة/g, "ه") // ة -> ه (the exact drift seen in the source data)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
